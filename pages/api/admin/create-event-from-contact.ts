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
    const { data: existingEvents } = await adminClient
      .from('events')
      .select('id')
      .or(`contact_id.eq.${contactId},client_email.eq.${contact.email_address || ''},submission_id.eq.${contactId}`)
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      return res.status(400).json({ 
        error: 'Event already exists',
        eventId: existingEvents[0].id 
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

    // Create event from contact data
    const clientName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Client';
    const eventType = contact.event_type || 'other';
    const eventDate = contact.event_date || new Date().toISOString().split('T')[0];
    const venue = contact.venue_name ? ` - ${contact.venue_name}` : '';
    const eventName = `${clientName} - ${eventType}${venue}`;

    const newEventData: any = {
      contact_id: contactId,
      submission_id: contactId,
      event_name: eventName,
      client_name: clientName,
      client_email: contact.email_address || null,
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
      notes: `Manually created from contact on ${new Date().toLocaleDateString()}.`,
    };

    if (contact.organization_id) {
      newEventData.organization_id = contact.organization_id;
    }

    const { data: newEvent, error: createError } = await adminClient
      .from('events')
      .insert([newEventData])
      .select()
      .single();

    if (createError) {
      console.error('[create-event-from-contact] Error creating event:', createError);
      return res.status(500).json({ 
        error: 'Failed to create event', 
        details: createError.message 
      });
    }

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
