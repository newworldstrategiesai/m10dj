import { requireAdmin } from '@/utils/auth-helpers/api-auth';
import { getEnv } from '@/utils/env-validator';
import { logger } from '@/utils/logger';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use centralized admin authentication
    const user = await requireAdmin(req, res);
    // User is guaranteed to be authenticated and admin here
    
    const supabase = createServerSupabaseClient({ req, res });

    const { contactId } = req.body;

    if (!contactId) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(user.email);

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      user.id,
      user.email
    );

    // Get the contact
    let contactQuery = supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .is('deleted_at', null);

    // For SaaS users, filter by organization_id. Platform admins see all contacts.
    if (!isAdmin && orgId) {
      contactQuery = contactQuery.eq('organization_id', orgId);
    } else if (!isAdmin && !orgId) {
      return res.status(403).json({ error: 'Organization required' });
    }

    const { data: contact, error: contactError } = await contactQuery.single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Verify organization ownership for SaaS users
    if (!isAdmin && contact.organization_id !== orgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

      // Create the project using service role client (needed for events table)
    try {
      const env = getEnv();
      const supabaseAdmin = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Helper function to safely format date without timezone issues
      const formatDateForDisplay = (dateValue) => {
        if (!dateValue) return '';
        
        // If it's already a string in YYYY-MM-DD format, parse it directly using local time
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          const [year, month, day] = dateValue.split('-');
          // Use Date constructor with year, month, day to avoid UTC interpretation
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        }
        
        // Otherwise, try to parse it - but be careful with date-only strings
        try {
          let date;
          // If it looks like a date-only string, parse it manually
          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}(T|$)/.test(dateValue)) {
            const datePart = dateValue.split('T')[0];
            const [year, month, day] = datePart.split('-');
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            date = new Date(dateValue);
          }
          
          if (isNaN(date.getTime())) return '';
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        } catch {
          return '';
        }
      };

      // Helper function to safely extract date string without timezone issues
      const extractDateString = (dateValue) => {
        if (!dateValue) return null;
        
        // If it's already a string in YYYY-MM-DD format, use it directly
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // If it's a Date object or ISO string, extract just the date part
        try {
          // Parse the date value - if it's a date-only string like "2025-12-06",
          // append a time to avoid UTC interpretation issues
          let dateStr = dateValue;
          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            // Already handled above, but just in case
            return dateValue;
          }
          
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          
          // Use local time methods to preserve the intended date
          // This ensures the date doesn't shift when converted
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return null;
        }
      };

      // Generate project name
      const generateProjectName = (contact) => {
        const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
        const eventType = contact.event_type || 'Event';
        const eventDate = formatDateForDisplay(contact.event_date);
        const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
        
        return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
      };

      // Get organization_id from contact for multi-tenant isolation
      const contactOrgId = contact.organization_id;
      if (!contactOrgId) {
        console.warn('⚠️ Contact missing organization_id, project may not be properly isolated');
      }

      // Map contact data to project data
      const projectData = {
        submission_id: contact.id,
        organization_id: contactOrgId, // Set organization_id for multi-tenant isolation
        event_name: generateProjectName(contact),
        client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
        client_email: contact.email_address,
        client_phone: contact.phone || null,
        event_type: contact.event_type || 'other',
        event_date: extractDateString(contact.event_date) || new Date().toISOString().split('T')[0],
        start_time: contact.event_time || null,
        venue_name: contact.venue_name || null,
        venue_address: contact.venue_address || null,
        number_of_guests: contact.guest_count || null,
        special_requests: contact.special_requests || null,
        status: 'confirmed',
        timeline_notes: `Auto-generated project from contact. Created on ${new Date().toLocaleDateString()}.`
      };

      const { data: project, error: projectError } = await supabaseAdmin
        .from('events')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      res.status(200).json({
        success: true,
        project: project,
        message: 'Project created successfully'
      });
    } catch (projectError) {
      logger.error('Error creating project', projectError);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
        details: projectError.message
      });
    }

  } catch (error) {
    // Error from requireAdmin is already handled
    if (res.headersSent) {
      return;
    }
    
    logger.error('Error in create-project-for-contact', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
