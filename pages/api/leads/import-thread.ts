import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { parseLeadThread } from '@/utils/lead-thread-parser';

const ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com',
];

type SuccessResponse = {
  success: true;
  action: 'created' | 'updated';
  contactId: string;
  contact: Record<string, any>;
  notes: string;
  parsed: ReturnType<typeof parseLeadThread>;
};

type ErrorResponse = {
  success: false;
  error: string;
  details?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userEmail = session.user.email || '';
    const isAdmin = ADMIN_EMAILS.includes(userEmail);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
      });
    }

    const { thread } = req.body as { thread?: string };

    if (!thread || typeof thread !== 'string' || !thread.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing thread text',
      });
    }

    const parsed = parseLeadThread(thread);

    if (!parsed.contact.phoneDigits && !parsed.contact.email) {
      return res.status(422).json({
        success: false,
        error: 'Unable to detect phone number or email in the thread.',
        details: {
          notes: parsed.contact.notes,
        },
      });
    }

    const phoneDigits = parsed.contact.phoneDigits;
    const email = parsed.contact.email;

    let existingContact: Record<string, any> | null = null;

    if (email) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('email_address', email)
        .is('deleted_at', null)
        .maybeSingle();

      existingContact = data || null;
    }

    if (!existingContact && phoneDigits) {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .ilike('phone', `%${phoneDigits}%`)
        .is('deleted_at', null)
        .maybeSingle();

      existingContact = data || null;
    }

    const conversationText = parsed.messages
      .map((message) => `${message.speakerLabel}: ${message.message}`)
      .join('\n');

    const detailSection = parsed.contact.notes.length
      ? `Detected details:\n${parsed.contact.notes.map((note) => `- ${note}`).join('\n')}\n\n`
      : '';

    const importNote =
      `Imported thread on ${new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })} by ${userEmail}.\n\n` + detailSection + conversationText;

    if (existingContact) {
      const updatePayload: Record<string, any> = {
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'sms_import',
      };

      if (parsed.contact.firstName && !existingContact.first_name) {
        updatePayload.first_name = parsed.contact.firstName;
      }

      if (parsed.contact.lastName && !existingContact.last_name) {
        updatePayload.last_name = parsed.contact.lastName;
      }

      if (parsed.contact.email && !existingContact.email_address) {
        updatePayload.email_address = parsed.contact.email;
      }

      if (parsed.contact.phoneE164 && !existingContact.phone) {
        updatePayload.phone = parsed.contact.phoneE164;
      }

      if (parsed.contact.eventType && !existingContact.event_type) {
        updatePayload.event_type = parsed.contact.eventType;
      }

      if (parsed.contact.eventDate && !existingContact.event_date) {
        updatePayload.event_date = parsed.contact.eventDate;
      }

      if (parsed.contact.venueName && !existingContact.venue_name) {
        updatePayload.venue_name = parsed.contact.venueName;
      }

      if (parsed.contact.venueAddress && !existingContact.venue_address) {
        updatePayload.venue_address = parsed.contact.venueAddress;
      }

      if (parsed.contact.eventTime && !existingContact.event_time) {
        updatePayload.event_time = parsed.contact.eventTime;
      }

      if (parsed.contact.guestCount && !existingContact.guest_count) {
        updatePayload.guest_count = parsed.contact.guestCount;
      }

      if (parsed.contact.budgetRange && !existingContact.budget_range) {
        updatePayload.budget_range = parsed.contact.budgetRange;
      }

      updatePayload.lead_source = existingContact.lead_source || 'Conversation Import';
      updatePayload.lead_status = existingContact.lead_status || 'New';
      updatePayload.lead_stage = existingContact.lead_stage || 'Initial Inquiry';
      updatePayload.lead_temperature = existingContact.lead_temperature || 'Warm';

      const existingTags = Array.isArray(existingContact.tags) ? existingContact.tags : [];
      if (!existingTags.includes('sms_import')) {
        updatePayload.tags = [...existingTags, 'sms_import'];
      }

      updatePayload.notes = existingContact.notes
        ? `${importNote}\n\n---\n${existingContact.notes}`
        : importNote;

      const { data, error: updateError } = await supabase
        .from('contacts')
        .update(updatePayload)
        .eq('id', existingContact.id)
        .select('*')
        .single();

      if (updateError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update contact',
          details: updateError,
        });
      }

      return res.status(200).json({
        success: true,
        action: 'updated',
        contactId: data.id,
        contact: data,
        notes: importNote,
        parsed,
      });
    }

    const insertPayload: Record<string, any> = {
      user_id: session.user.id,
      first_name: parsed.contact.firstName,
      last_name: parsed.contact.lastName,
      email_address: parsed.contact.email,
      phone: parsed.contact.phoneE164 || parsed.contact.phoneDigits,
      event_type: parsed.contact.eventType,
      event_date: parsed.contact.eventDate,
      venue_name: parsed.contact.venueName,
      venue_address: parsed.contact.venueAddress,
      event_time: parsed.contact.eventTime,
      guest_count: parsed.contact.guestCount,
      budget_range: parsed.contact.budgetRange,
      lead_status: 'New',
      lead_source: 'Conversation Import',
      lead_stage: 'Initial Inquiry',
      lead_temperature: 'Warm',
      communication_preference: 'text',
      opt_in_status: true,
      last_contacted_date: new Date().toISOString(),
      last_contact_type: 'sms_import',
      notes: importNote,
      tags: ['sms_import'],
    };

    const { data, error: insertError } = await supabase
      .from('contacts')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create contact',
        details: insertError,
      });
    }

    return res.status(200).json({
      success: true,
      action: 'created',
      contactId: data.id,
      contact: data,
      notes: importNote,
      parsed,
    });
  } catch (error) {
    console.error('[lead-import-thread] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}


