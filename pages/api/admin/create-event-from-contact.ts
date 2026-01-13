import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { contactId } = req.body;
    if (!contactId || typeof contactId !== 'string') {
      return res.status(400).json({ error: 'Contact ID is required' });
    }

    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Get contact data
    const { data: contact, error: contactError } = await adminClient
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if event already exists
    const orConditions: string[] = [];
    if (contactId) {
      orConditions.push(`contact_id.eq.${contactId}`);
    }
    if (contact.email_address) {
      orConditions.push(`client_email.eq.${contact.email_address}`);
    }
    if (contactId) {
      orConditions.push(`submission_id.eq.${contactId}`);
    }
    
    let existingEventsQuery = adminClient
      .from('events')
      .select('id, event_name, event_date');
    
    if (orConditions.length > 0) {
      existingEventsQuery = existingEventsQuery.or(orConditions.join(','));
    }
    
    // If we have an event_date, also filter by it for more precise matching
    if (contact.event_date) {
      existingEventsQuery = existingEventsQuery.eq('event_date', contact.event_date);
    }
    
    const { data: existingEvents, error: existingEventsError } = await existingEventsQuery.limit(1);

    if (existingEventsError) {
      console.error('[create-event-from-contact] Error checking for existing events:', existingEventsError);
      // Don't fail - continue with creation
    }

    if (existingEvents && existingEvents.length > 0) {
      console.log('[create-event-from-contact] Event already exists:', existingEvents[0]);
      return res.status(400).json({ 
        error: 'Event already exists',
        eventId: existingEvents[0].id,
        eventName: existingEvents[0].event_name
      });
    }

    // Check if contact has event data
    const hasEventData = !!(
      contact.event_date ||
      contact.venue_name ||
      contact.event_type ||
      contact.event_time ||
      contact.guest_count
    );

    if (!hasEventData) {
      return res.status(400).json({ 
        error: 'Contact has no event data to create an event from' 
      });
    }

    // client_email is required in events table
    if (!contact.email_address) {
      return res.status(400).json({ 
        error: 'Contact must have an email address to create an event. Please add an email to the contact first.' 
      });
    }

    // Find the actual submission_id if this contact came from a form submission
    // submission_id has a FK constraint to contact_submissions, so we can't just use contactId
    let submissionId: string | null = null;
    if (contact.email_address) {
      const { data: submission } = await adminClient
        .from('contact_submissions')
        .select('id')
        .eq('email', contact.email_address)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (submission) {
        submissionId = submission.id;
        console.log('[create-event-from-contact] Found submission_id:', submissionId);
      } else {
        console.log('[create-event-from-contact] No submission found for contact, submission_id will be null');
      }
    }

    // Create event from contact data
    const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
    const eventType = contact.event_type || 'other';
    
    // Format event_date properly - ensure it's a valid DATE string (YYYY-MM-DD)
    let eventDate: string;
    if (contact.event_date) {
      // If it's already a date string, use it; otherwise parse it
      if (typeof contact.event_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(contact.event_date)) {
        eventDate = contact.event_date;
      } else {
        // Try to parse and format
        try {
          const date = new Date(contact.event_date);
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          eventDate = `${year}-${month}-${day}`;
        } catch (e) {
          console.warn('[create-event-from-contact] Invalid event_date, using today:', contact.event_date);
          eventDate = new Date().toISOString().split('T')[0];
        }
      }
    } else {
      eventDate = new Date().toISOString().split('T')[0];
    }
    
    const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
    const eventName = `${clientName} - ${eventType}${venue}`;
    
    console.log('[create-event-from-contact] Creating event with data:', {
      contactId,
      eventName,
      eventDate,
      eventType,
      hasVenue: !!contact.venue_name,
      organizationId: contact.organization_id
    });

    const newEventData: any = {
      contact_id: contactId,
      submission_id: submissionId, // Use actual submission_id or null if contact didn't come from form
      event_name: eventName,
      client_name: clientName,
      client_email: contact.email_address, // Already validated above
      client_phone: contact.phone || null,
      event_type: contact.event_type || 'other',
      event_date: eventDate,
      start_time: contact.event_time || null,
      end_time: contact.end_time || null,
      setup_time: contact.setup_time || null,
      venue_name: contact.venue_name || null,
      venue_address: contact.venue_address || null,
      venue_type: contact.venue_type || null,
      venue_room: contact.venue_room || null,
      number_of_guests: contact.guest_count || null,
      status: 'confirmed',
      special_requests: contact.special_requests || `Manually created from contact on ${new Date().toLocaleDateString()}.`,
    };

    if (contact.organization_id) {
      newEventData.organization_id = contact.organization_id;
    }

    console.log('[create-event-from-contact] Event data to insert:', JSON.stringify(newEventData, null, 2));

    const { data: newEvent, error: createError } = await adminClient
      .from('events')
      .insert([newEventData])
      .select()
      .single();

    if (createError) {
      console.error('[create-event-from-contact] ❌ Error creating event:', createError);
      console.error('[create-event-from-contact] Error details:', JSON.stringify(createError, null, 2));
      console.error('[create-event-from-contact] Event data that failed:', JSON.stringify(newEventData, null, 2));
      return res.status(500).json({ 
        error: 'Failed to create event', 
        details: createError.message,
        code: createError.code,
        hint: createError.hint
      });
    }
    
    console.log('[create-event-from-contact] ✅ Successfully created event:', {
      id: newEvent?.id,
      name: newEvent?.event_name,
      date: newEvent?.event_date
    });

    return res.status(200).json({
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    });
  } catch (error: any) {
    console.error('Error creating event from contact:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
