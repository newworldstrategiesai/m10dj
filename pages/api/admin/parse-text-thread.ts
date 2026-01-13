import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { parseLeadThread } from '@/utils/lead-thread-parser';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { getOrganizationContext } from '@/utils/organization-helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CRITICAL: Only platform admins can use this feature
    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Platform admin access required' });
    }

    const { textThread } = req.body;

    if (!textThread || typeof textThread !== 'string') {
      return res.status(400).json({ error: 'Text thread is required' });
    }

    // Parse the text thread
    let parsed;
    try {
      parsed = parseLeadThread(textThread);
    } catch (parseError: any) {
      console.error('[parse-text-thread] Error parsing text thread:', parseError);
      return res.status(400).json({
        error: 'Failed to parse text thread',
        details: parseError.message || 'Unknown parsing error'
      });
    }

    if (!parsed || (!parsed.contact.firstName && !parsed.contact.lastName && !parsed.contact.email && !parsed.contact.phoneDigits)) {
      return res.status(400).json({ 
        error: 'Could not extract contact information from text thread',
        parsed: parsed || null
      });
    }

    // Get organization context
    const orgId = await getOrganizationContext(
      supabase,
      session.user.id,
      session.user.email
    );
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if contact already exists (by email or phone)
    let existingContact = null;
    if (parsed.contact.email) {
      const { data: emailContact } = await adminClient
        .from('contacts')
        .select('*')
        .eq('email_address', parsed.contact.email.toLowerCase())
        .single();
      existingContact = emailContact;
    }

    if (!existingContact && parsed.contact.phoneE164) {
      const { data: phoneContact } = await adminClient
        .from('contacts')
        .select('*')
        .eq('phone', parsed.contact.phoneE164)
        .single();
      existingContact = phoneContact;
    }

    // Normalize event date
    let eventDate = parsed.contact.eventDate;
    if (eventDate) {
      try {
        const dateObj = new Date(eventDate);
        if (!isNaN(dateObj.getTime())) {
          eventDate = dateObj.toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Could not parse event date:', eventDate);
      }
    }

    // Normalize event time
    let eventTime = parsed.contact.eventTime;
    let endTime = parsed.contact.endTime;
    let setupTime = parsed.contact.setupTime;
    
    const normalizeTime = (timeStr: string | null): string | null => {
      if (!timeStr) return null;
      
      // Handle simple numbers like "7" or "11" - assume PM for event times
      const simpleNumberMatch = timeStr.trim().match(/^(\d{1,2})$/);
      if (simpleNumberMatch) {
        let hours = parseInt(simpleNumberMatch[1]);
        // For event times, assume PM if hours 1-11
        if (hours >= 1 && hours <= 11) {
          hours += 12;
        } else if (hours === 12) {
          hours = 12; // 12 PM
        } else if (hours === 0) {
          hours = 12; // Midnight = 12 AM, but for events assume 12 PM
        }
        return `${hours.toString().padStart(2, '0')}:00:00`;
      }
      
      const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const ampm = match[3] ? match[3].toLowerCase() : null;
        
        // If no am/pm and hours 1-11, assume PM for event times
        if (!ampm && hours >= 1 && hours <= 11) {
          hours += 12;
        } else if (ampm === 'pm' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }
      return null;
    };

    eventTime = normalizeTime(eventTime);
    endTime = normalizeTime(endTime);
    setupTime = normalizeTime(setupTime);

    let contact;
    let project = null;

    if (existingContact) {
      // Update existing contact
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (parsed.contact.firstName && !existingContact.first_name) updateData.first_name = parsed.contact.firstName;
      if (parsed.contact.lastName && !existingContact.last_name) updateData.last_name = parsed.contact.lastName;
      if (parsed.contact.email && !existingContact.email_address) updateData.email_address = parsed.contact.email.toLowerCase();
      if (parsed.contact.phoneE164 && !existingContact.phone) updateData.phone = parsed.contact.phoneE164;
      if (eventDate && !existingContact.event_date) updateData.event_date = eventDate;
      if (eventTime && !existingContact.event_time) updateData.event_time = eventTime;
      if (endTime && !existingContact.end_time) updateData.end_time = endTime;
      if (setupTime && !existingContact.setup_time) updateData.setup_time = setupTime;
      if (parsed.contact.venueName && !existingContact.venue_name) updateData.venue_name = parsed.contact.venueName;
      if (parsed.contact.venueAddress && !existingContact.venue_address) updateData.venue_address = parsed.contact.venueAddress;
      if (parsed.contact.venueType && !existingContact.venue_type) updateData.venue_type = parsed.contact.venueType;
      if (parsed.contact.venueRoom && !existingContact.venue_room) updateData.venue_room = parsed.contact.venueRoom;
      if (parsed.contact.guestCount && !existingContact.guest_count) updateData.guest_count = parsed.contact.guestCount;
      if (parsed.contact.eventType && !existingContact.event_type) updateData.event_type = parsed.contact.eventType;
      if (parsed.contact.guestArrivalTime && !existingContact.guest_arrival_time) {
        updateData.guest_arrival_time = normalizeTime(parsed.contact.guestArrivalTime);
      }
      if (parsed.contact.eventOccasion && !existingContact.event_occasion) updateData.event_occasion = parsed.contact.eventOccasion;
      if (parsed.contact.eventFor && !existingContact.event_for) updateData.event_for = parsed.contact.eventFor;
      if (parsed.contact.isSurprise !== null && existingContact.is_surprise === null) {
        updateData.is_surprise = parsed.contact.isSurprise;
      }
      if (parsed.contact.referralSource && !existingContact.referral_source) updateData.referral_source = parsed.contact.referralSource;

      const existingNotes = existingContact.notes || '';
      const newNotes = parsed.contact.notes.join('\n');
      if (newNotes) {
        updateData.notes = existingNotes ? `${existingNotes}\n\n--- Imported from text thread ---\n${newNotes}` : newNotes;
      }

      const { data: updatedContact, error: updateError } = await adminClient
        .from('contacts')
        .update(updateData)
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update contact: ${updateError.message}`);
      }

      contact = updatedContact;
    } else {
      // Create new contact
      const contactData: any = {
        user_id: session.user.id,
        first_name: parsed.contact.firstName || null,
        last_name: parsed.contact.lastName || null,
        email_address: parsed.contact.email ? parsed.contact.email.toLowerCase() : null,
        phone: parsed.contact.phoneE164 || parsed.contact.phoneDigits || null,
        event_type: parsed.contact.eventType || 'other',
        event_date: eventDate,
        event_time: eventTime,
        end_time: endTime,
        setup_time: setupTime,
        venue_name: parsed.contact.venueName || null,
        venue_address: parsed.contact.venueAddress || null,
        venue_type: parsed.contact.venueType || null,
        venue_room: parsed.contact.venueRoom || null,
        guest_count: parsed.contact.guestCount || null,
        budget_range: parsed.contact.budgetRange || null,
        guest_arrival_time: parsed.contact.guestArrivalTime ? normalizeTime(parsed.contact.guestArrivalTime) : null,
        event_occasion: parsed.contact.eventOccasion || null,
        event_for: parsed.contact.eventFor || null,
        is_surprise: parsed.contact.isSurprise ?? null,
        referral_source: parsed.contact.referralSource || null,
        lead_status: 'New',
        lead_source: 'Text Message',
        lead_stage: 'Initial Inquiry',
        lead_temperature: 'Warm',
        communication_preference: parsed.contact.phoneE164 ? 'text' : 'email',
        opt_in_status: true,
        last_contacted_date: new Date().toISOString(),
        last_contact_type: 'text_import',
        notes: parsed.contact.notes.join('\n') || null,
        tags: ['text_import'],
      };

      if (orgId) {
        contactData.organization_id = orgId;
      }

      const { data: newContact, error: contactError } = await adminClient
        .from('contacts')
        .insert([contactData])
        .select()
        .single();

      if (contactError) {
        throw new Error(`Failed to create contact: ${contactError.message}`);
      }

      contact = newContact;
    }

    // Create event/project if we have event information
    if (eventDate || parsed.contact.venueName || parsed.contact.eventType) {
      const generateProjectName = () => {
        const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
        const eventType = contact.event_type || 'Event';
        const eventDate = contact.event_date ? new Date(contact.event_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : '';
        const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
        return `${clientName} - ${eventType}${eventDate ? ` - ${eventDate}` : ''}${venue}`;
      };

      // Check if event already exists for this contact
      const { data: existingEvent } = await adminClient
        .from('events')
        .select('*')
        .eq('client_email', contact.email_address || '')
        .eq('event_date', eventDate || '')
        .maybeSingle();

      if (existingEvent) {
        // Update existing event with new data from thread
        const eventUpdates: any = {
          updated_at: new Date().toISOString(),
        };

        // Only update fields that are missing or if we have new data
        if (eventTime && !existingEvent.start_time) {
          eventUpdates.start_time = eventTime;
        }
        if (endTime && !existingEvent.end_time) {
          eventUpdates.end_time = endTime;
        }
        if (contact.venue_name && !existingEvent.venue_name) {
          eventUpdates.venue_name = contact.venue_name;
        }
        if (contact.venue_address && !existingEvent.venue_address) {
          eventUpdates.venue_address = contact.venue_address;
        }
        if (contact.guest_count && !existingEvent.number_of_guests) {
          eventUpdates.number_of_guests = contact.guest_count;
        }
        if (contact.event_type && !existingEvent.event_type) {
          eventUpdates.event_type = contact.event_type;
        }

        // Only update if we have changes
        if (Object.keys(eventUpdates).length > 1) { // More than just updated_at
          const { data: updatedEvent, error: updateError } = await adminClient
            .from('events')
            .update(eventUpdates)
            .eq('id', existingEvent.id)
            .select()
            .single();

          if (!updateError && updatedEvent) {
            project = updatedEvent;
            console.log('[parse-text-thread] Updated existing event:', updatedEvent.id);
          } else if (updateError) {
            console.warn('[parse-text-thread] Failed to update event (non-critical):', updateError);
            project = existingEvent; // Use existing event even if update failed
          }
        } else {
          project = existingEvent;
          console.log('[parse-text-thread] Using existing event (no updates needed):', existingEvent.id);
        }
      } else {
        // Create new event if it doesn't exist
        const projectData: any = {
          submission_id: contact.id,
          event_name: generateProjectName(),
          client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client',
          client_email: contact.email_address,
          client_phone: contact.phone || null,
          event_type: contact.event_type || 'other',
          event_date: eventDate || new Date().toISOString().split('T')[0],
          start_time: eventTime || null,
          end_time: endTime || null,
          venue_name: contact.venue_name || null,
          venue_address: contact.venue_address || null,
          number_of_guests: contact.guest_count || null,
          special_requests: contact.notes || null,
          status: 'confirmed',
          notes: `Auto-generated from text thread import. Created on ${new Date().toLocaleDateString()}.`,
        };

        if (orgId) {
          projectData.organization_id = orgId;
        }

        const { data: newProject, error: projectError } = await adminClient
          .from('events')
          .insert([projectData])
          .select()
          .single();

        if (!projectError && newProject) {
          project = newProject;
          console.log('[parse-text-thread] Created new event:', newProject.id);
        } else if (projectError) {
          console.warn('[parse-text-thread] Failed to create project (non-critical):', projectError);
        }
      }
    }

    // Save SMS conversation messages if we have them
    if (parsed.messages.length > 0 && contact.phone) {
      try {
        // Get organization_id from contact
        const contactOrgId = contact.organization_id || orgId || null;
        
        const conversationSessionId = crypto.randomUUID();
        const importTimestamp = new Date().toISOString();

        const messageRows = parsed.messages.map((msg, index) => {
          const direction = msg.role === 'contact' ? 'inbound' : 'outbound';
          const messageType = msg.role === 'contact' ? 'customer' : msg.role === 'team' ? 'admin' : 'customer';

          return {
            phone_number: contact.phone,
            message_content: msg.message,
            direction: direction,
            message_type: messageType,
            customer_id: contact.id,
            organization_id: contactOrgId,
            conversation_session_id: conversationSessionId,
            message_status: 'sent',
            created_at: new Date(new Date(importTimestamp).getTime() + index * 1000).toISOString(),
            processed_at: importTimestamp
          };
        });

        await adminClient
          .from('sms_conversations')
          .insert(messageRows);
          
        console.log(`[parse-text-thread] Saved ${messageRows.length} messages to sms_conversations`);
      } catch (conversationError) {
        console.warn('Failed to save SMS conversation (non-critical):', conversationError);
      }
    }

    return res.status(200).json({
      success: true,
      contact,
      project,
      parsed,
      action: existingContact ? 'updated' : 'created',
    });

  } catch (error: any) {
    console.error('[parse-text-thread] Error:', error);
    return res.status(500).json({
      error: 'Failed to parse text thread',
      details: error.message,
    });
  }
}
