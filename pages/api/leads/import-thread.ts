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

    const { thread, overrides } = req.body as { thread?: string; overrides?: Record<string, any> };

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

    // Look up venue address if only venue name is detected
    if (parsed.contact.venueName && !parsed.contact.venueAddress) {
      try {
        const venueSearchTerm = parsed.contact.venueName
          .toLowerCase()
          .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content like "(formerly Pin Oak)"
          .trim();
        
        if (venueSearchTerm.length >= 2) { // Only search if we have a meaningful term
          const { data: venueMatches, error: venueError } = await adminClient
            .from('preferred_venues')
            .select('venue_name, address, city, state, zip_code')
            .ilike('venue_name', `%${venueSearchTerm}%`)
            .eq('is_active', true)
            .limit(1);

          if (!venueError && venueMatches && venueMatches.length > 0) {
            const matchedVenue = venueMatches[0];
            if (matchedVenue.address) {
              // Format address: "123 Main St, Memphis, TN 38103" or just "123 Main St" if city/state not available
              const formattedAddress = matchedVenue.address.includes(',')
                ? matchedVenue.address
                : `${matchedVenue.address}${matchedVenue.city ? `, ${matchedVenue.city}` : ''}${matchedVenue.state ? `, ${matchedVenue.state}` : ''}${matchedVenue.zip_code ? ` ${matchedVenue.zip_code}` : ''}`.trim();
              
              parsed.contact.venueAddress = formattedAddress;
              console.log('[lead-import-thread] Found venue address from database:', {
                venueName: parsed.contact.venueName,
                address: formattedAddress
              });
            }
          }
        }
      } catch (lookupError) {
        console.error('[lead-import-thread] Error looking up venue address:', lookupError);
        // Don't fail the import if venue lookup fails - just continue without address
      }
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

    // Extract new developments from the thread
    const developments = extractDevelopments(parsed.messages, parsed.contact);
    
    const conversationText = parsed.messages
      .map((message) => `${message.speakerLabel}: ${message.message}`)
      .join('\n');

    const detailSection = parsed.contact.notes.length
      ? `Detected details:\n${parsed.contact.notes.map((note) => `- ${note}`).join('\n')}\n\n`
      : '';

    const developmentsSection = developments.length > 0
      ? `New Developments:\n${developments.map((dev) => `- ${dev}`).join('\n')}\n\n`
      : '';

    const importNote =
      `Imported thread on ${new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })} by ${userEmail}.\n\n` + detailSection + developmentsSection + conversationText;

    if (existingContact) {
      // Check for duplicate messages in existing notes
      const existingNotes = existingContact.notes || '';
      const isDuplicate = checkForDuplicateMessages(existingNotes, conversationText);
      
      if (isDuplicate) {
        console.log('[lead-import-thread] Duplicate thread detected, skipping message import');
      }

      const updatePayload: Record<string, any> = {
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'sms_import',
      };

      // Update fields intelligently - fill missing or update with more specific info
      if (parsed.contact.firstName) {
        if (!existingContact.first_name || existingContact.first_name.trim() === '') {
          updatePayload.first_name = parsed.contact.firstName;
        }
      }

      if (parsed.contact.lastName) {
        if (!existingContact.last_name || existingContact.last_name.trim() === '') {
          updatePayload.last_name = parsed.contact.lastName;
        }
      }

      if (parsed.contact.email) {
        if (!existingContact.email_address || existingContact.email_address.trim() === '') {
          updatePayload.email_address = parsed.contact.email;
        }
      }

      if (parsed.contact.phoneE164 || parsed.contact.phoneDigits) {
        if (!existingContact.phone || existingContact.phone.trim() === '') {
          updatePayload.phone = parsed.contact.phoneE164 || parsed.contact.phoneDigits;
        }
      }

      if (parsed.contact.eventType) {
        if (!existingContact.event_type || existingContact.event_type.trim() === '') {
          updatePayload.event_type = parsed.contact.eventType;
        }
      }

      if (parsed.contact.eventDate) {
        if (!existingContact.event_date) {
          updatePayload.event_date = parsed.contact.eventDate;
        }
      }

      // Use overrides if provided (user edited fields in UI)
      const venueToUse = overrides?.venueName !== undefined ? overrides.venueName : parsed.contact.venueName;
      const eventDateToUse = overrides?.eventDate !== undefined ? overrides.eventDate : parsed.contact.eventDate;
      const eventTypeToUse = overrides?.eventType !== undefined ? overrides.eventType : parsed.contact.eventType;
      const venueAddressToUse = overrides?.venueAddress !== undefined ? overrides.venueAddress : parsed.contact.venueAddress;

      // Update venue intelligently - don't overwrite existing correct venue with wrong detection
      if (venueToUse) {
        const newVenue = venueToUse;
        const existingVenue = existingContact.venue_name || '';
        
        // If user provided override, use it (they explicitly edited it)
        if (overrides?.venueName !== undefined) {
          updatePayload.venue_name = newVenue;
        } else {
          // Only update if:
          // 1. No existing venue
          // 2. New venue is clearly more specific (has "formerly" info and existing doesn't)
          // 3. New venue matches existing venue (case-insensitive) - allow updating format
          const newVenueLower = newVenue.toLowerCase().trim();
          const existingVenueLower = existingVenue.toLowerCase().trim();
          
          if (!existingVenue) {
            // No existing venue - use new one
            updatePayload.venue_name = newVenue;
          } else if (newVenue.includes('(') && !existingVenue.includes('(')) {
            // New venue has historical context that existing doesn't - update
            updatePayload.venue_name = newVenue;
          } else if (newVenueLower === existingVenueLower) {
            // Same venue, different format - keep existing (it's already correct)
            // Don't update
          } else {
            // Different venues - check if new one seems wrong (contains conversational phrases)
            const wrongPhrases = ['i know', 'how it goes', 'by the way', 'got your', 'reaching out'];
            const seemsWrong = wrongPhrases.some(phrase => newVenueLower.includes(phrase));
            
            if (!seemsWrong && existingVenue.length < newVenue.length) {
              // New venue is longer and doesn't seem wrong - might be more complete
              updatePayload.venue_name = newVenue;
            }
            // Otherwise, keep existing venue (it's likely correct)
          }
        }
      }

      // Apply other overrides
      if (eventDateToUse && (!existingContact.event_date || overrides?.eventDate !== undefined)) {
        updatePayload.event_date = eventDateToUse;
      }

      if (eventTypeToUse && (!existingContact.event_type || overrides?.eventType !== undefined)) {
        updatePayload.event_type = eventTypeToUse;
      }

      if (venueAddressToUse && (!existingContact.venue_address || overrides?.venueAddress !== undefined)) {
        updatePayload.venue_address = venueAddressToUse;
      }

      if (parsed.contact.venueAddress) {
        if (!existingContact.venue_address || existingContact.venue_address.trim() === '') {
          updatePayload.venue_address = parsed.contact.venueAddress;
        }
      }

      if (parsed.contact.eventTime) {
        if (!existingContact.event_time || existingContact.event_time.trim() === '') {
          updatePayload.event_time = parsed.contact.eventTime;
        }
      }

      if (parsed.contact.guestCount !== null && parsed.contact.guestCount !== undefined) {
        const guestCountNum = typeof parsed.contact.guestCount === 'number' 
          ? parsed.contact.guestCount 
          : parseInt(String(parsed.contact.guestCount), 10);
        if (!isNaN(guestCountNum) && guestCountNum > 0) {
          if (!existingContact.guest_count) {
            updatePayload.guest_count = guestCountNum;
          }
        }
      }

      if (parsed.contact.budgetRange) {
        if (!existingContact.budget_range || existingContact.budget_range.trim() === '') {
          updatePayload.budget_range = parsed.contact.budgetRange;
        }
      }

      // Update lead status/stage based on developments
      const statusUpdate = determineStatusUpdate(developments, existingContact);
      if (statusUpdate.lead_status) {
        updatePayload.lead_status = statusUpdate.lead_status;
      }
      if (statusUpdate.lead_stage) {
        updatePayload.lead_stage = statusUpdate.lead_stage;
      }
      if (statusUpdate.lead_temperature) {
        updatePayload.lead_temperature = statusUpdate.lead_temperature;
      }

      // Store package/service selections in custom_fields
      const packageInfo = extractPackageSelection(parsed.messages);
      if (packageInfo) {
        const existingCustomFields = existingContact.custom_fields || {};
        updatePayload.custom_fields = {
          ...existingCustomFields,
          package_selection: packageInfo,
          package_selected_at: new Date().toISOString(),
        };
      }

      updatePayload.lead_source = existingContact.lead_source || 'Conversation Import';

      const existingTags = Array.isArray(existingContact.tags) ? existingContact.tags : [];
      if (!existingTags.includes('sms_import')) {
        updatePayload.tags = [...existingTags, 'sms_import'];
      }

      // Only add new notes if not duplicate
      if (!isDuplicate) {
        updatePayload.notes = existingContact.notes
          ? `${importNote}\n\n---\n${existingContact.notes}`
          : importNote;
      } else {
        // Still update developments if any
        if (developments.length > 0) {
          const developmentsNote = `Updated on ${new Date().toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}:\n${developments.map((dev) => `- ${dev}`).join('\n')}\n\n`;
          updatePayload.notes = existingContact.notes
            ? `${developmentsNote}---\n${existingContact.notes}`
            : developmentsNote;
        }
      }

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

/**
 * Extract new developments from messages (decisions, commitments, changes)
 */
function extractDevelopments(
  messages: ReturnType<typeof parseLeadThread>['messages'],
  contact: ReturnType<typeof parseLeadThread>['contact']
): string[] {
  const developments: string[] = [];
  const threadText = messages.map(m => m.message).join(' ').toLowerCase();

  // Package/service selections
  if (threadText.includes('package 2') || threadText.includes('package 3') || threadText.includes('package 1')) {
    const packageMatch = threadText.match(/package\s*([123])/i);
    if (packageMatch) {
      const packageNum = packageMatch[1];
      let packageInfo = `Selected Package ${packageNum}`;
      
      // Check for modifications
      if (threadText.includes('without') || threadText.includes('remove') || threadText.includes('no')) {
        const withoutMatch = threadText.match(/(?:without|remove|no)\s+([^.!?]+)/i);
        if (withoutMatch) {
          packageInfo += ` without ${withoutMatch[1].trim()}`;
        }
      }
      
      developments.push(packageInfo);
    }
  }

  // Decision to proceed
  if (threadText.includes('we\'d like to go with') || 
      threadText.includes('we would like') || 
      threadText.includes('let\'s go with') ||
      threadText.includes('sounds great') && threadText.includes('package')) {
    developments.push('Client confirmed package selection');
  }

  // Venue changes/updates
  if (threadText.includes('now called') || threadText.includes('formerly')) {
    const venueUpdate = contact.venueName;
    if (venueUpdate) {
      developments.push(`Venue update: ${venueUpdate}`);
    }
  }

  // Scheduling/consultation
  if (threadText.includes('phone call') || threadText.includes('consultation')) {
    if (threadText.includes('scheduled') || threadText.includes('set up')) {
      developments.push('Consultation scheduled');
    } else if (threadText.includes('would love') || threadText.includes('interested')) {
      developments.push('Client interested in consultation');
    }
  }

  // Email sent
  if (threadText.includes('sent you an email') || threadText.includes('i sent')) {
    developments.push('Quote/email sent to client');
  }

  return developments;
}

/**
 * Check if messages are duplicates of existing notes
 */
function checkForDuplicateMessages(existingNotes: string, newConversation: string): boolean {
  if (!existingNotes || !newConversation) return false;
  
  // Extract key phrases from new conversation
  const newPhrases = extractKeyPhrases(newConversation);
  const existingPhrases = extractKeyPhrases(existingNotes);
  
  // If more than 70% of key phrases match, consider it duplicate
  if (newPhrases.length === 0) return false;
  
  const matchingPhrases = newPhrases.filter(phrase => 
    existingPhrases.some(existing => 
      existing.toLowerCase().includes(phrase.toLowerCase()) ||
      phrase.toLowerCase().includes(existing.toLowerCase())
    )
  );
  
  const matchRatio = matchingPhrases.length / newPhrases.length;
  return matchRatio > 0.7;
}

/**
 * Extract key phrases from text (for duplicate detection)
 */
function extractKeyPhrases(text: string): string[] {
  const phrases: string[] = [];
  const sentences = text.split(/[.!?\n]/).filter(s => s.trim().length > 10);
  
  // Extract unique phrases (3+ words)
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    for (let i = 0; i <= words.length - 3; i++) {
      const phrase = words.slice(i, i + 3).join(' ').toLowerCase();
      if (phrase.length > 15 && !phrases.includes(phrase)) {
        phrases.push(phrase);
      }
    }
  });
  
  return phrases.slice(0, 20); // Limit to 20 phrases
}

/**
 * Determine status updates based on developments
 */
function determineStatusUpdate(
  developments: string[],
  existingContact: Record<string, any>
): { lead_status?: string; lead_stage?: string; lead_temperature?: string } {
  const update: { lead_status?: string; lead_stage?: string; lead_temperature?: string } = {};
  
  // Check for package selection (strong buying signal)
  const hasPackageSelection = developments.some(d => 
    d.toLowerCase().includes('package') || d.toLowerCase().includes('confirmed')
  );
  
  if (hasPackageSelection) {
    update.lead_status = 'Qualified';
    update.lead_stage = 'Quote Provided';
    update.lead_temperature = 'Hot';
  } else if (developments.some(d => d.toLowerCase().includes('consultation'))) {
    update.lead_stage = existingContact.lead_stage || 'Consultation Scheduled';
    update.lead_temperature = 'Warm';
  } else if (developments.length > 0) {
    // Any development is progress
    if (!existingContact.lead_status || existingContact.lead_status === 'New') {
      update.lead_status = 'Contacted';
    }
    if (!existingContact.lead_stage || existingContact.lead_stage === 'Initial Inquiry') {
      update.lead_stage = 'In Discussion';
    }
  }
  
  return update;
}

/**
 * Extract package selection details from messages
 */
function extractPackageSelection(
  messages: ReturnType<typeof parseLeadThread>['messages']
): { package: string; modifications?: string[] } | null {
  const threadText = messages.map(m => m.message).join(' ').toLowerCase();
  
  const packageMatch = threadText.match(/package\s*([123])/i);
  if (!packageMatch) return null;
  
  const packageNum = packageMatch[1];
  const modifications: string[] = [];
  
  // Check for modifications
  if (threadText.includes('without') || threadText.includes('remove') || threadText.includes('no')) {
    const withoutMatch = threadText.match(/(?:without|remove|no)\s+([^.!?]+?)(?:\.|$|,)/i);
    if (withoutMatch) {
      modifications.push(`Removed: ${withoutMatch[1].trim()}`);
    }
  }
  
  return {
    package: `Package ${packageNum}`,
    modifications: modifications.length > 0 ? modifications : undefined,
  };
}


