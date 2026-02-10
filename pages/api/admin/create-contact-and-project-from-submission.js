/**
 * Create Contact & Project from a contact_submission
 * One-click flow from the Form Submissions detail modal.
 * Finds or creates the contact, then creates the project (event) linked to the submission.
 */

import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

function parseName(fullName) {
  const parts = (fullName || '').trim().split(' ');
  const first = parts[0] || '';
  const last = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { firstName: first, lastName: last };
}

function extractDateString(dateValue) {
  if (!dateValue) return null;
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await requireAdmin(req, res);
    const supabase = createServerSupabaseClient({ req, res });
    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    const isAdmin = isPlatformAdmin(user.email);
    const orgId = await getOrganizationContext(supabase, user.id, user.email);
    if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const env = getEnv();
    const supabaseAdmin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch submission
    let submissionQuery = supabaseAdmin
      .from('contact_submissions')
      .select('*')
      .eq('id', submissionId);

    if (!isAdmin && orgId) {
      submissionQuery = submissionQuery.eq('organization_id', orgId);
    }

    const { data: submission, error: subError } = await submissionQuery.single();

    if (subError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionOrgId = submission.organization_id || orgId;
    const email = (submission.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Submission has no email' });
    }

    const { firstName, lastName } = parseName(submission.name);
    const eventDateStr = extractDateString(submission.event_date) || new Date().toISOString().split('T')[0];

    // Find existing contact by email (same org or platform admin)
    let contactQuery = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('email_address', email)
      .is('deleted_at', null);

    if (!isAdmin && submissionOrgId) {
      contactQuery = contactQuery.eq('organization_id', submissionOrgId);
    }

    const { data: existingContact } = await contactQuery.maybeSingle();

    let contact = existingContact;

    if (!contact) {
      // Create contact from submission
      const contactData = {
        organization_id: submissionOrgId,
        first_name: firstName || 'Contact',
        last_name: lastName || '',
        email_address: email,
        phone: submission.phone || null,
        event_type: submission.event_type || 'other',
        event_date: eventDateStr,
        venue_name: submission.location || null,
        venue_address: submission.location || null,
        special_requests: submission.message || null,
        lead_status: 'New',
        lead_source: 'Form Submission',
        lead_stage: 'Initial Inquiry',
        lead_temperature: 'Warm',
        communication_preference: 'email',
        how_heard_about_us: 'Website Contact Form',
        notes: `Created from form submission on ${new Date().toLocaleDateString()}.`,
        lead_score: 50,
        priority_level: 'Medium',
      };

      const { data: newContact, error: createContactError } = await supabaseAdmin
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (createContactError) {
        logger.error('create-contact-and-project-from-submission: contact insert failed', createContactError);
        return res.status(500).json({
          error: 'Failed to create contact',
          details: createContactError.message,
        });
      }
      contact = newContact;
    }

    // Build event name and project payload
    const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
    const eventType = contact.event_type || submission.event_type || 'other';
    const venuePart = (contact.venue_name || submission.location) ? ` - ${contact.venue_name || submission.location}` : '';
    const eventName = `${clientName} - ${eventType} - ${eventDateStr}${venuePart}`;

    const projectData = {
      submission_id: submission.id,
      organization_id: contact.organization_id || submissionOrgId,
      event_name: eventName,
      client_name: clientName,
      client_email: contact.email_address,
      client_phone: contact.phone || submission.phone || null,
      event_type: eventType,
      event_date: eventDateStr,
      venue_name: contact.venue_name || submission.location || null,
      venue_address: contact.venue_address || submission.location || null,
      special_requests: contact.special_requests || submission.message || null,
      status: 'confirmed',
      timeline_notes: `Created from form submission on ${new Date().toLocaleDateString()}.`,
    };

    const { data: project, error: projectError } = await supabaseAdmin
      .from('events')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      logger.error('create-contact-and-project-from-submission: event insert failed', projectError);
      return res.status(500).json({
        error: 'Failed to create project',
        details: projectError.message,
      });
    }

    return res.status(200).json({
      success: true,
      contact: { id: contact.id, first_name: contact.first_name, last_name: contact.last_name, email_address: contact.email_address },
      project: { id: project.id, event_name: project.event_name, event_date: project.event_date },
      message: existingContact
        ? 'Project created and linked to existing contact.'
        : 'Contact and project created successfully.',
    });
  } catch (err) {
    if (res.headersSent) return;
    logger.error('create-contact-and-project-from-submission', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
