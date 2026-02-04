import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

/**
 * GET /api/meet/participant-data?roomName=meet-xxx&participantIdentity=email-abc
 * Returns stored participant data (email, display name, joined_at) plus related
 * contacts, events, and contracts for the host (matched by participant email).
 * Only room owner or super admin. Used when host clicks a participant tile.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    const participantIdentity = searchParams.get('participantIdentity');

    if (!roomName || !roomName.startsWith('meet-')) {
      return NextResponse.json({ error: 'roomName is required and must be a meet room' }, { status: 400 });
    }
    if (!participantIdentity) {
      return NextResponse.json({ error: 'participantIdentity is required' }, { status: 400 });
    }

    const { data: room } = await supabase
      .from('meet_rooms')
      .select('user_id')
      .eq('room_name', roomName)
      .single();

    const roomData = room as { user_id?: string } | null;
    const isOwner = roomData?.user_id === user.id;
    const isAdmin = isSuperAdminEmail(user.email);

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: participant, error: fetchError } = await supabase
      .from('meet_room_participants')
      .select('email, display_name, joined_at, updated_at')
      .eq('room_name', roomName)
      .eq('participant_identity', participantIdentity)
      .maybeSingle();

    if (fetchError) {
      console.error('[Meet participant-data] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to load participant' }, { status: 500 });
    }

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const email = ((participant as { email?: string }).email || '').trim().toLowerCase();
    const hostUserId = roomData?.user_id;

    const payload: {
      email: string;
      displayName: string;
      joinedAt?: string;
      updatedAt?: string;
      relatedContacts?: Array<Record<string, unknown>>;
      relatedEvents?: Array<Record<string, unknown>>;
      relatedContracts?: Array<Record<string, unknown>>;
    } = {
      email: (participant as { email?: string }).email ?? '',
      displayName: (participant as { display_name?: string }).display_name ?? '',
      joinedAt: (participant as { joined_at?: string }).joined_at,
      updatedAt: (participant as { updated_at?: string }).updated_at,
    };

    if (email && hostUserId) {
      try {
        const service = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: contacts } = await service
          .from('contacts')
          .select('id, first_name, last_name, email_address, primary_email, secondary_email, lead_status, event_type, event_date, venue_name, created_at')
          .eq('user_id', hostUserId)
          .or(`email_address.ilike.${email},primary_email.ilike.${email},secondary_email.ilike.${email}`);

        const contactList = (contacts || []) as Array<{ id: string; first_name?: string; last_name?: string; email_address?: string; primary_email?: string; lead_status?: string; event_type?: string; event_date?: string; venue_name?: string; created_at?: string }>;
        payload.relatedContacts = contactList.map((c) => ({
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email_address || c.primary_email || '—',
          email: c.email_address || c.primary_email,
          leadStatus: c.lead_status,
          eventType: c.event_type,
          eventDate: c.event_date,
          venueName: c.venue_name,
          createdAt: c.created_at,
        }));

        const contactIds = contactList.map((c) => c.id);
        payload.relatedEvents = [];
        payload.relatedContracts = [];

        if (contactIds.length > 0) {
          const [{ data: events }, { data: contracts }] = await Promise.all([
            service.from('events').select('id, event_name, client_name, client_email, event_type, event_date, venue_name, status, created_at').in('contact_id', contactIds),
            service.from('contracts').select('id, contract_number, status, event_name, event_type, event_date, total_amount, signed_at, created_at').in('contact_id', contactIds),
          ]);
          payload.relatedEvents = (events || []).map((e: Record<string, unknown>) => ({
            id: e.id,
            eventName: e.event_name,
            clientName: e.client_name,
            clientEmail: e.client_email,
            eventType: e.event_type,
            eventDate: e.event_date,
            venueName: e.venue_name,
            status: e.status,
            createdAt: e.created_at,
          }));
          payload.relatedContracts = (contracts || []).map((c: Record<string, unknown>) => ({
            id: c.id,
            contractNumber: c.contract_number,
            status: c.status,
            eventName: c.event_name,
            eventType: c.event_type,
            eventDate: c.event_date,
            totalAmount: c.total_amount,
            signedAt: c.signed_at,
            createdAt: c.created_at,
          }));
        }
      } catch (relatedErr) {
        console.error('[Meet participant-data] Related data error:', relatedErr);
        payload.relatedContacts = [];
        payload.relatedEvents = [];
        payload.relatedContracts = [];
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error('[Meet participant-data] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
