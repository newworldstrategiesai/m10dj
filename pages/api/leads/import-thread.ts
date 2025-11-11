import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('[lead-import-thread] Missing Supabase service role credentials');
      return res.status(500).json({
        success: false,
        error: 'Supabase service role credentials are not configured.',
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const userEmail = session.user.email || '';
    const userMetadata = session.user.user_metadata || {};
    const isAdminByEmail = ADMIN_EMAILS.includes(userEmail);
    const isAdminByRole = userMetadata.role === 'admin';

    console.log('[lead-import-thread] User auth check:', {
      userEmail,
      isAdminByEmail,
      isAdminByRole,
      userMetadata,
    });

    if (!isAdminByEmail && !isAdminByRole) {
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

    let parsed;
    try {
      parsed = parseLeadThread(thread);
    } catch (parseError: any) {
      console.error('[lead-import-thread] Parse error:', parseError);
      return res.status(400).json({
        success: false,
        error: 'Failed to parse thread',
        details: process.env.NODE_ENV === 'development' 
          ? { message: parseError?.message || String(parseError) }
          : undefined,
      });
    }

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

    console.log('[lead-import-thread] Parsed data:', {
      phoneDigits,
      email,
      hasPhone: !!phoneDigits,
      hasEmail: !!email,
    });

    let existingContact: Record<string, any> | null = null;

    if (email) {
      console.log('[lead-import-thread] Searching for existing contact by email:', email);
      const { data, error } = await adminClient
        .from('contacts')
        .select('*')
        .eq('email_address', email)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('[lead-import-thread] Error searching by email:', error);
      } else {
        console.log('[lead-import-thread] Email search result:', data ? 'found' : 'not found');
      }

      existingContact = data || null;
    }

    if (!existingContact && phoneDigits) {
      console.log('[lead-import-thread] Searching for existing contact by phone:', phoneDigits);
      const { data, error } = await adminClient
        .from('contacts')
        .select('*')
        .ilike('phone', `%${phoneDigits}%`)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        console.error('[lead-import-thread] Error searching by phone:', error);
      } else {
        console.log('[lead-import-thread] Phone search result:', data ? 'found' : 'not found');
      }

      existingContact = data || null;
    }

    console.log('[lead-import-thread] Final existing contact check:', existingContact ? 'exists' : 'none found');

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

      if ((parsed.contact.phoneE164 || parsed.contact.phoneDigits) && !existingContact.phone) {
        updatePayload.phone = parsed.contact.phoneE164 || parsed.contact.phoneDigits;
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

      if (parsed.contact.guestCount !== null && parsed.contact.guestCount !== undefined && !existingContact.guest_count) {
        const guestCountNum = typeof parsed.contact.guestCount === 'number' 
          ? parsed.contact.guestCount 
          : parseInt(String(parsed.contact.guestCount), 10);
        if (!isNaN(guestCountNum) && guestCountNum > 0) {
          updatePayload.guest_count = guestCountNum;
        }
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

      console.log('[lead-import-thread] Updating existing contact:', existingContact.id);
      console.log('[lead-import-thread] Update payload:', updatePayload);

      const { data, error: updateError } = await adminClient
        .from('contacts')
        .update(updatePayload)
        .eq('id', existingContact.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('[lead-import-thread] Update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update contact',
          details: updateError,
        });
      }

      console.log('[lead-import-thread] Contact updated successfully:', data.id);

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
      first_name: parsed.contact.firstName || null,
      last_name: parsed.contact.lastName || null,
      email_address: parsed.contact.email || null,
      phone: parsed.contact.phoneE164 || parsed.contact.phoneDigits || null,
      event_type: parsed.contact.eventType || null,
      event_date: parsed.contact.eventDate || null,
      venue_name: parsed.contact.venueName || null,
      venue_address: parsed.contact.venueAddress || null,
      event_time: parsed.contact.eventTime || null,
      guest_count: parsed.contact.guestCount !== null && parsed.contact.guestCount !== undefined
        ? (typeof parsed.contact.guestCount === 'number' 
            ? parsed.contact.guestCount 
            : (() => {
                const num = parseInt(String(parsed.contact.guestCount), 10);
                return !isNaN(num) && num > 0 ? num : null;
              })())
        : null,
      budget_range: parsed.contact.budgetRange || null,
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

    console.log('[lead-import-thread] Creating new contact');
    console.log('[lead-import-thread] Insert payload:', insertPayload);

    const { data, error: insertError } = await adminClient
      .from('contacts')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('[lead-import-thread] Insert error:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create contact',
        details: insertError,
      });
    }

    console.log('[lead-import-thread] Contact created successfully:', data.id);

    return res.status(200).json({
      success: true,
      action: 'created',
      contactId: data.id,
      contact: data,
      notes: importNote,
      parsed,
    });
  } catch (error: any) {
    console.error('[lead-import-thread] Unexpected error:', error);
    const errorMessage = error?.message || String(error);
    const errorStack = error?.stack;
    const errorName = error?.name || 'Error';
    
    console.error('[lead-import-thread] Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
      error: error,
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' 
        ? {
            message: errorMessage,
            name: errorName,
            stack: errorStack?.split('\n').slice(0, 5).join('\n'),
          }
        : undefined,
    });
  }
}


