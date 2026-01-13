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
  if (req.method !== 'GET') {
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

    const { contactId } = req.query;
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

    // Check for linked events
    const { data: events, error: eventsError } = await adminClient
      .from('events')
      .select('*')
      .or(`contact_id.eq.${contactId},client_email.eq.${contact.email_address || ''},submission_id.eq.${contactId}`)
      .order('created_at', { ascending: false });

    // Determine if event SHOULD exist based on contact data
    const hasEventData = !!(
      contact.event_date ||
      contact.venue_name ||
      contact.event_type ||
      contact.event_time ||
      contact.guest_count
    );

    // Analysis
    const analysis = {
      contact: {
        id: contact.id,
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        email: contact.email_address,
        hasEventData,
        eventFields: {
          event_date: contact.event_date,
          event_time: contact.event_time,
          end_time: contact.end_time,
          setup_time: contact.setup_time,
          guest_arrival_time: contact.guest_arrival_time,
          venue_name: contact.venue_name,
          venue_address: contact.venue_address,
          venue_type: contact.venue_type,
          venue_room: contact.venue_room,
          event_type: contact.event_type,
          guest_count: contact.guest_count,
        },
      },
      events: {
        count: events?.length || 0,
        events: events || [],
        error: eventsError?.message || null,
      },
      recommendation: {
        shouldHaveEvent: hasEventData,
        hasEvent: (events?.length || 0) > 0,
        action: hasEventData && (events?.length || 0) === 0
          ? 'CREATE_EVENT'
          : hasEventData && (events?.length || 0) > 0
          ? 'EVENT_EXISTS'
          : 'NO_EVENT_DATA',
        reason: hasEventData && (events?.length || 0) === 0
          ? 'Contact has event data but no event record exists. An event should be created.'
          : hasEventData && (events?.length || 0) > 0
          ? 'Contact has event data and event record(s) exist. This is correct.'
          : 'Contact has no event data, so no event record is needed.',
      },
    };

    return res.status(200).json(analysis);
  } catch (error: any) {
    console.error('Error checking contact events:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
