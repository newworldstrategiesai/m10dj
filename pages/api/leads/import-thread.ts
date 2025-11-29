import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { parseLeadThread } from '@/utils/lead-thread-parser';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

// Import email parsing function
function parseEmailContent(emailContent: string) {
  const extracted: any = {
    playlists: {},
    ceremonyTime: null,
    ceremonyEndTime: null,
    grandEntrance: null,
    grandExit: null,
    specialRequests: null,
    notes: null
  };

  const lowerContent = emailContent.toLowerCase();

  // Extract Spotify playlist links
  const spotifyRegex = /(?:spotify\.com|open\.spotify\.com)[^\s\)]+/gi;
  const spotifyLinks = emailContent.match(spotifyRegex) || [];
  
  // Try to identify playlist types from context
  spotifyLinks.forEach((link, index) => {
    const contextBefore = emailContent.substring(Math.max(0, emailContent.indexOf(link) - 100), emailContent.indexOf(link));
    const contextLower = contextBefore.toLowerCase();
    
    if (contextLower.includes('first dance') || contextLower.includes('first dances')) {
      extracted.playlists.first_dance = link;
    } else if (contextLower.includes('wedding') && !contextLower.includes('cocktail')) {
      extracted.playlists.reception = link;
    } else if (contextLower.includes('cocktail')) {
      extracted.playlists.cocktail = link;
    } else {
      // Assign in order if no context found
      if (index === 0) extracted.playlists.first_dance = link;
      if (index === 1) extracted.playlists.reception = link;
      if (index === 2) extracted.playlists.cocktail = link;
    }
  });

  // Extract times with improved patterns
  // Handle patterns like "The ceremony is 3 pm-3:30" (note: no space before dash)
  // Also handle "ceremony is 3 pm to 3:30 pm"
  const ceremonyRangePatterns = [
    // "The ceremony is 3 pm-3:30" (no space before dash)
    /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    // "ceremony is 3 pm to 3:30 pm"
    /(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s+(?:to|until)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    // "ceremony 3 pm-3:30 pm"
    /(?:the\s+)?ceremony\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  let ceremonyRangeMatch = null;
  for (const pattern of ceremonyRangePatterns) {
    ceremonyRangeMatch = emailContent.match(pattern);
    if (ceremonyRangeMatch) break;
  }
  
  if (ceremonyRangeMatch) {
    extracted.ceremonyTime = normalizeTime(ceremonyRangeMatch[1]);
    extracted.ceremonyEndTime = normalizeTime(ceremonyRangeMatch[2]);
  } else {
    // Try single ceremony time
    const singleCeremonyMatch = emailContent.match(/(?:the\s+)?ceremony\s+(?:is\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (singleCeremonyMatch) {
      extracted.ceremonyTime = normalizeTime(singleCeremonyMatch[1]);
    }
  }
  
  // Also check for "will end no later than" pattern separately
  // "it will end no later than 4 pm"
  const ceremonyEndMatch = emailContent.match(/(?:ceremony|it)\s+(?:will\s+)?end\s+(?:no\s+later\s+than|by|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (ceremonyEndMatch && !extracted.ceremonyEndTime) {
    extracted.ceremonyEndTime = normalizeTime(ceremonyEndMatch[1]);
  }

  // Extract grand entrance - handle "grand entrance is at 5 pm"
  const entrancePatterns = [
    /grand\s+entrance\s+is\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+entrance\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+entrance\s+is\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  for (const pattern of entrancePatterns) {
    const entranceMatch = emailContent.match(pattern);
    if (entranceMatch) {
      extracted.grandEntrance = normalizeTime(entranceMatch[1]);
      break;
    }
  }

  // Extract grand exit - handle "grand exit is scheduled for 9:30 pm"
  const exitPatterns = [
    /grand\s+exit\s+is\s+scheduled\s+for\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+scheduled\s+for\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+is\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
    /grand\s+exit\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i
  ];
  
  for (const pattern of exitPatterns) {
    const exitMatch = emailContent.match(pattern);
    if (exitMatch) {
      extracted.grandExit = normalizeTime(exitMatch[1]);
      break;
    }
  }
  
  // If no ceremony time found but we found entrance, use entrance as event time
  if (!extracted.ceremonyTime && extracted.grandEntrance) {
    extracted.ceremonyTime = extracted.grandEntrance;
  }

  // Extract special requests
  const specialRequests = [];
  if (lowerContent.includes('mariachi')) {
    const mariachiMatch = emailContent.match(/mariachi[^.]*(?:\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm)?)[^.]*/i);
    if (mariachiMatch) {
      specialRequests.push(mariachiMatch[0].trim());
    }
  }
  if (lowerContent.includes('break') || lowerContent.includes('breaks')) {
    const breakMatch = emailContent.match(/[^.]*(?:break|breaks)[^.]*/i);
    if (breakMatch) {
      specialRequests.push(breakMatch[0].trim());
    }
  }

  if (specialRequests.length > 0) {
    extracted.specialRequests = specialRequests.join('\n');
  }

  // Extract general notes
  const notes = [];
  if (emailContent.match(/(?:what does|how does|schedule|arrival|set up|break down)/i)) {
    const scheduleMatch = emailContent.match(/[^.]*(?:what does|how does|schedule|arrival|set up|break down)[^.]*/i);
    if (scheduleMatch) {
      notes.push(scheduleMatch[0].trim());
    }
  }

  if (notes.length > 0) {
    extracted.notes = notes.join('\n');
  }

  return extracted;
}

function normalizeTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  
  timeStr = timeStr.trim();
  // Improved regex to handle formats like "3 pm", "3:30 pm", "3pm", etc.
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    let ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
    
    // If no am/pm specified, infer from context (most weddings are PM)
    // For times 1-11 without am/pm, assume PM (wedding times)
    if (!ampm) {
      if (hours >= 1 && hours <= 11) {
        ampm = 'pm';
      } else if (hours === 12) {
        ampm = 'pm';
      } else {
        ampm = 'pm'; // Default to PM for wedding events
      }
    }
    
    // Convert to 24-hour format
    if (ampm === 'pm' && hours !== 12) {
      hours += 12;
    } else if (ampm === 'am' && hours === 12) {
      hours = 0;
    }
    
    // Return in HH:mm:ss format for TIME column
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
  
  return null;
}

function detectEmailFormat(text: string): boolean {
  // Check for email indicators
  const emailIndicators = [
    /hey\s*[,!]?\s*(ben|dj|m10)/i,
    /hi\s*[,!]?\s*(ben|dj|m10)/i,
    /hello\s*[,!]?\s*(ben|dj|m10)/i,
    /spotify/i,
    /playlist/i,
    /ceremony\s*(is|at)/i,
    /grand\s*entrance/i,
    /grand\s*exit/i,
    /mariachi/i,
    /thank\s*you/i,
    /veronica/i
  ];
  
  return emailIndicators.some(pattern => pattern.test(text));
}

async function handleEmailImport(
  req: NextApiRequest,
  res: NextApiResponse,
  emailContent: string,
  contactId: string,
  adminClient: ReturnType<typeof createClient>
) {
  try {
    const extractedData = parseEmailContent(emailContent);
    
    console.log('[handleEmailImport] Extracted data:', {
      ceremonyTime: extractedData.ceremonyTime,
      ceremonyEndTime: extractedData.ceremonyEndTime,
      grandEntrance: extractedData.grandEntrance,
      grandExit: extractedData.grandExit
    });

    // Update contact record - ALWAYS update times if found (override existing values)
    const contactUpdates: Record<string, any> = {};
    
    // Update event time - always update if found (even if existing)
    if (extractedData.ceremonyTime) {
      contactUpdates.event_time = extractedData.ceremonyTime;
      console.log('[handleEmailImport] Setting event_time:', extractedData.ceremonyTime);
    }
    if (extractedData.ceremonyEndTime) {
      contactUpdates.end_time = extractedData.ceremonyEndTime;
      console.log('[handleEmailImport] Setting end_time:', extractedData.ceremonyEndTime);
    }
    
    // Store grand entrance/exit in custom_fields since those columns don't exist
    if (extractedData.grandEntrance || extractedData.grandExit) {
      const { data: existingContact } = await adminClient
        .from('contacts')
        .select('custom_fields')
        .eq('id', contactId)
        .single() as { data: { custom_fields: any } | null };
      
      const existingCustomFields = existingContact?.custom_fields || {};
      contactUpdates.custom_fields = {
        ...existingCustomFields,
        ...(extractedData.grandEntrance ? { grand_entrance_time: extractedData.grandEntrance } : {}),
        ...(extractedData.grandExit ? { grand_exit_time: extractedData.grandExit } : {})
      };
    }
    
    if (extractedData.specialRequests) {
      const { data: existingContact } = await adminClient
        .from('contacts')
        .select('special_requests')
        .eq('id', contactId)
        .single() as { data: { special_requests: string | null } | null };
      
      const currentRequests = existingContact?.special_requests || '';
      contactUpdates.special_requests = currentRequests 
        ? `${currentRequests}\n\n--- Email Update ---\n${extractedData.specialRequests}`
        : extractedData.specialRequests;
    }
    
    if (extractedData.notes) {
      const { data: existingContact } = await adminClient
        .from('contacts')
        .select('notes')
        .eq('id', contactId)
        .single() as { data: { notes: string | null } | null };
      
      const currentNotes = existingContact?.notes || '';
      contactUpdates.notes = currentNotes 
        ? `${currentNotes}\n\n--- Email Update ---\n${extractedData.notes}`
        : extractedData.notes;
    }

    if (Object.keys(contactUpdates).length > 0) {
      contactUpdates.updated_at = new Date().toISOString();
      console.log('[handleEmailImport] Updating contact with:', contactUpdates);
      
      // TypeScript workaround: Supabase update method doesn't infer dynamic object types well
      const contactsTable = adminClient.from('contacts') as any;
      const { data: updatedContact, error: updateError } = await contactsTable
        .update(contactUpdates)
        .eq('id', contactId)
        .select()
        .single();
      
      if (updateError) {
        console.error('[handleEmailImport] Update error:', updateError);
        throw new Error(`Failed to update contact: ${updateError.message}`);
      }
      
      console.log('[handleEmailImport] Contact updated successfully:', {
        id: updatedContact?.id,
        event_time: updatedContact?.event_time,
        end_time: updatedContact?.end_time
      });
    } else {
      console.log('[handleEmailImport] No updates to apply');
    }

    // Update questionnaire data if playlists are found
    if (extractedData.playlists && Object.keys(extractedData.playlists).length > 0) {
      const { data: existingQuestionnaire } = await adminClient
        .from('music_questionnaires')
        .select('*')
        .eq('lead_id', contactId)
        .single() as { data: { playlist_links?: Record<string, string> } | null };

      const playlistLinks = (existingQuestionnaire?.playlist_links || {}) as Record<string, string>;
      
      Object.keys(extractedData.playlists).forEach(key => {
        if (extractedData.playlists[key]) {
          playlistLinks[key] = extractedData.playlists[key];
        }
      });

      const questionnaireData: Record<string, any> = {
        lead_id: contactId,
        playlist_links: playlistLinks,
        updated_at: new Date().toISOString()
      };

      if (existingQuestionnaire) {
        const questionnairesTable = adminClient.from('music_questionnaires') as any;
        await questionnairesTable.update(questionnaireData).eq('lead_id', contactId);
      } else {
        questionnaireData.created_at = new Date().toISOString();
        const questionnairesTable = adminClient.from('music_questionnaires') as any;
        await questionnairesTable.insert(questionnaireData);
      }
    }

    return res.status(200).json({
      success: true,
      action: 'updated',
      contactId,
      extractedData,
      message: 'Email parsed and contact updated successfully'
    });
  } catch (error: any) {
    console.error('Error parsing email:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to parse email',
      details: error.message
    });
  }
}

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

    const { thread, overrides, contactId } = req.body as { 
      thread?: string; 
      overrides?: Record<string, any>;
      contactId?: string;
    };

    if (!thread || typeof thread !== 'string' || !thread.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing thread text',
      });
    }

    // Detect if this is an email or SMS thread
    const isEmail = detectEmailFormat(thread);
    
    // If it's an email, try to find contact by email/name and use email parser
    if (isEmail) {
      let targetContactId = contactId;
      
      // If no contactId provided, try to find contact by email or name
      if (!targetContactId) {
        // Extract email from thread
        const emailMatch = thread.match(EMAIL_REGEX);
        if (emailMatch) {
          const foundEmail = emailMatch[0].toLowerCase();
          const { data: emailContact } = await adminClient
            .from('contacts')
            .select('id')
            .eq('email_address', foundEmail)
            .is('deleted_at', null)
            .maybeSingle();
          
          if (emailContact) {
            targetContactId = emailContact.id;
            console.log('[lead-import-thread] Found contact by email:', targetContactId);
          }
        }
        
        // Also try to find by name (Veronica G. from signature)
        if (!targetContactId) {
          const nameMatch = thread.match(/(?:thank\s+you,|sincerely,|best\s+regards,)\s*\n?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?)/i);
          if (nameMatch) {
            const name = nameMatch[1].trim();
            const nameParts = name.split(' ');
            const firstName = nameParts[0];
            
            const { data: nameContact } = await adminClient
              .from('contacts')
              .select('id')
              .ilike('first_name', firstName)
              .is('deleted_at', null)
              .maybeSingle();
            
            if (nameContact) {
              targetContactId = nameContact.id;
              console.log('[lead-import-thread] Found contact by name:', targetContactId);
            }
          }
        }
      }
      
      // If we have a contactId (provided or found), use email parser
      if (targetContactId) {
        return handleEmailImport(req, res, thread, targetContactId, adminClient as any);
      } else {
        console.log('[lead-import-thread] Email detected but no contact found - falling back to SMS parser');
      }
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
    let existingSubmission: Record<string, any> | null = null;

    // Step 1: Check contacts table first
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

    // Step 2: If not found in contacts, check contact_submissions table
    if (!existingContact) {
      if (email) {
        console.log('[lead-import-thread] Checking contact_submissions by email:', email);
        const { data, error } = await adminClient
          .from('contact_submissions')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[lead-import-thread] Error searching submissions by email:', error);
        } else {
          console.log('[lead-import-thread] Submission email search result:', data ? 'found' : 'not found');
        }

        existingSubmission = data || null;
      }

      if (!existingSubmission && phoneDigits) {
        console.log('[lead-import-thread] Checking contact_submissions by phone:', phoneDigits);
        const { data, error } = await adminClient
          .from('contact_submissions')
          .select('*')
          .ilike('phone', `%${phoneDigits}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[lead-import-thread] Error searching submissions by phone:', error);
        } else {
          console.log('[lead-import-thread] Submission phone search result:', data ? 'found' : 'not found');
        }

        existingSubmission = data || null;
      }
    }

    console.log('[lead-import-thread] Final check:', {
      contact: existingContact ? 'exists' : 'none',
      submission: existingSubmission ? 'exists' : 'none'
    });

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

      if (parsed.contact.endTime) {
        if (!existingContact.end_time || existingContact.end_time.trim() === '') {
          updatePayload.end_time = parsed.contact.endTime;
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

      // Save structured messages to sms_conversations table
      if (!isDuplicate && parsed.messages.length > 0) {
        const phoneNumber = parsed.contact.phoneE164 || parsed.contact.phoneDigits;
        if (phoneNumber) {
          try {
            // Check if conversation exists
            const { data: existingConversation } = await adminClient
              .from('sms_conversations')
              .select('id, messages')
              .eq('phone_number', phoneNumber)
              .single();

            // Convert parsed messages to structured format
            const structuredMessages = parsed.messages.map((msg) => ({
              role: msg.role === 'contact' ? 'user' : msg.role === 'team' ? 'assistant' : 'user',
              content: msg.message,
              speaker: msg.speakerLabel,
              timestamp: new Date().toISOString(),
              source: 'imported_thread'
            }));

            if (existingConversation) {
              // Append to existing messages
              const existingMessages = existingConversation.messages || [];
              const updatedMessages = [...existingMessages, ...structuredMessages];
              
              await adminClient
                .from('sms_conversations')
                .update({
                  messages: updatedMessages,
                  last_message_at: new Date().toISOString(),
                  last_message_from: structuredMessages[structuredMessages.length - 1]?.role === 'user' ? 'user' : 'assistant',
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingConversation.id);
            } else {
              // Create new conversation
              await adminClient
                .from('sms_conversations')
                .insert({
                  contact_id: existingContact.id,
                  phone_number: phoneNumber,
                  messages: structuredMessages,
                  last_message_at: new Date().toISOString(),
                  last_message_from: structuredMessages[structuredMessages.length - 1]?.role === 'user' ? 'user' : 'assistant',
                  conversation_status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }
            console.log('[lead-import-thread] Saved structured messages to sms_conversations');
          } catch (conversationError) {
            console.error('[lead-import-thread] Error saving structured messages:', conversationError);
            // Don't fail the import if conversation saving fails
          }
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

    // If we found a submission but no contact, migrate it first, then update it
    if (existingSubmission && !existingContact) {
      console.log('[lead-import-thread] Found submission, migrating to contacts table');
      
      // Extract name parts from submission
      const nameParts = (existingSubmission.name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Create contact from submission data (merge with parsed thread data)
      const migratedContactData: Record<string, any> = {
        user_id: session.user.id,
        first_name: firstName || parsed.contact.firstName || null,
        last_name: lastName || parsed.contact.lastName || null,
        email_address: existingSubmission.email || parsed.contact.email || null,
        phone: existingSubmission.phone || parsed.contact.phoneE164 || parsed.contact.phoneDigits || null,
        event_type: existingSubmission.event_type || parsed.contact.eventType || null,
        event_date: existingSubmission.event_date || parsed.contact.eventDate || null,
        venue_name: existingSubmission.location || parsed.contact.venueName || null,
        venue_address: parsed.contact.venueAddress || null,
        event_time: parsed.contact.eventTime || null,
        end_time: parsed.contact.endTime || null,
        special_requests: existingSubmission.message || parsed.contact.notes?.join('\n') || null,
        lead_status: existingSubmission.status || 'New',
        lead_source: existingSubmission.source || 'Contact Form',
        lead_stage: 'Initial Inquiry',
        lead_temperature: 'Warm',
        communication_preference: existingSubmission.phone ? 'any' : 'email',
        opt_in_status: true,
        notes: existingSubmission.notes || importNote,
        created_at: existingSubmission.created_at || new Date().toISOString(),
        tags: ['migrated_from_submission', 'sms_import'],
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'sms_import',
      };

      // Insert the migrated contact
      const { data: migratedContact, error: migrateError } = await adminClient
        .from('contacts')
        .insert(migratedContactData)
        .select('*')
        .single();

      if (migrateError) {
        console.error('[lead-import-thread] Error migrating submission to contact:', migrateError);
        // Continue to create new contact below
        existingContact = null;
      } else {
        console.log('[lead-import-thread] Successfully migrated submission to contact:', migratedContact.id);
        // Now treat it as existing contact and update it with thread details
        existingContact = migratedContact;
        
        // Re-run the update logic with the migrated contact
        // (The code will fall through to the existing contact update logic above)
        // But we need to add the thread note and update fields properly
        const updatePayload: Record<string, any> = {
          last_contacted_date: new Date().toISOString(),
          last_contact_type: 'sms_import',
        };

        // Merge thread data with migrated submission data (thread takes precedence for missing fields)
        if (parsed.contact.firstName && existingContact && !existingContact.first_name) {
          updatePayload.first_name = parsed.contact.firstName;
        }
        if (parsed.contact.lastName && existingContact && !existingContact.last_name) {
          updatePayload.last_name = parsed.contact.lastName;
        }
        if (parsed.contact.eventTime && existingContact && !existingContact.event_time) {
          updatePayload.event_time = parsed.contact.eventTime;
        }
        if (parsed.contact.endTime && existingContact && !existingContact.end_time) {
          updatePayload.end_time = parsed.contact.endTime;
        }
        if (parsed.contact.venueAddress && existingContact && !existingContact.venue_address) {
          updatePayload.venue_address = parsed.contact.venueAddress;
        }

        // Check for duplicate messages
        const existingNotes = existingContact?.notes || '';
        const isDuplicate = checkForDuplicateMessages(existingNotes, conversationText);
        
        if (!isDuplicate) {
          updatePayload.notes = existingContact?.notes
            ? `${importNote}\n\n---\n${existingContact.notes}`
            : importNote;
        }

        // Update the migrated contact
        if (existingContact) {
          const { data: updatedContact, error: updateError } = await adminClient
            .from('contacts')
            .update(updatePayload)
            .eq('id', existingContact.id)
            .select('*')
            .single();

          if (!updateError && updatedContact) {
            existingContact = updatedContact;
          }

          // Save structured messages
          if (!isDuplicate && parsed.messages.length > 0 && existingContact) {
            const phoneNumber = parsed.contact.phoneE164 || parsed.contact.phoneDigits;
            if (phoneNumber) {
              try {
                const structuredMessages = parsed.messages.map((msg) => ({
                  role: msg.role === 'contact' ? 'user' : msg.role === 'team' ? 'assistant' : 'user',
                  content: msg.message,
                  speaker: msg.speakerLabel,
                  timestamp: new Date().toISOString(),
                  source: 'imported_thread'
                }));

                await adminClient
                  .from('sms_conversations')
                  .upsert({
                    contact_id: existingContact.id,
                    phone_number: phoneNumber,
                    messages: structuredMessages,
                    last_message_at: new Date().toISOString(),
                    last_message_from: structuredMessages[structuredMessages.length - 1]?.role === 'user' ? 'user' : 'assistant',
                    conversation_status: 'active',
                    updated_at: new Date().toISOString()
                  }, {
                    onConflict: 'phone_number'
                  });
              } catch (conversationError) {
                console.error('[lead-import-thread] Error saving structured messages for migrated contact:', conversationError);
              }
            }
          }

          // Return updated contact
          if (existingContact) {
            return res.status(200).json({
              success: true,
              action: 'updated' as const,
              contactId: existingContact.id,
              contact: existingContact,
              notes: importNote,
              parsed,
            });
          }
        }
      }
    }

    // If we still don't have a contact, create a new one
    if (!existingContact) {
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
        end_time: parsed.contact.endTime || null,
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

      const { data: newContact, error: insertError } = await adminClient
        .from('contacts')
        .insert(insertPayload)
        .select('*')
        .single();

        // Save structured messages to sms_conversations table for new contacts
        if (!insertError && newContact && parsed.messages.length > 0) {
          const phoneNumber = parsed.contact.phoneE164 || parsed.contact.phoneDigits;
          if (phoneNumber) {
            try {
              // Convert parsed messages to structured format
              const structuredMessages = parsed.messages.map((msg) => ({
                role: msg.role === 'contact' ? 'user' : msg.role === 'team' ? 'assistant' : 'user',
                content: msg.message,
                speaker: msg.speakerLabel,
                timestamp: new Date().toISOString(),
                source: 'imported_thread'
              }));

              await adminClient
                .from('sms_conversations')
                .insert({
                  contact_id: newContact.id,
                  phone_number: phoneNumber,
                  messages: structuredMessages,
                  last_message_at: new Date().toISOString(),
                  last_message_from: structuredMessages[structuredMessages.length - 1]?.role === 'user' ? 'user' : 'assistant',
                  conversation_status: 'active',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              console.log('[lead-import-thread] Saved structured messages to sms_conversations for new contact');
            } catch (conversationError) {
              console.error('[lead-import-thread] Error saving structured messages for new contact:', conversationError);
              // Don't fail the import if conversation saving fails
            }
          }
        }

        if (insertError) {
          console.error('[lead-import-thread] Insert error:', insertError);
          return res.status(500).json({
            success: false,
            error: 'Failed to create contact',
            details: insertError,
          });
        }

        console.log('[lead-import-thread] Contact created successfully:', newContact?.id);

        return res.status(200).json({
          success: true,
          action: 'created',
          contactId: newContact?.id,
          contact: newContact,
          notes: importNote,
          parsed,
        });
    }
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


