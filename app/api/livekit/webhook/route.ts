import { NextRequest, NextResponse } from 'next/server';
import { WebhookReceiver } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

// Webhook receiver for LiveKit events
// This can be used to track participant joins/leaves, room events, etc.

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

const livekitHost =
  process.env.LIVEKIT_URL?.replace('wss://', 'https://').replace('ws://', 'http://') ?? '';

type MinimalParticipant = {
  identity?: string;
  metadata?: string;
  kind?: string | number;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    const event = await receiver.receive(body, authHeader);

    // Handle different event types
    switch (event.event) {
      case 'room_started':
        // Update stream status to live
        if (event.room) {
          await updateStreamStatus(event.room.name, true);
          // Meet rooms: set metadata with startedAt for master timer (visible to all participants)
          if (event.room.name.startsWith('meet-')) {
            try {
              const { RoomServiceClient } = await import('livekit-server-sdk');
              const roomService = new RoomServiceClient(
                livekitHost,
                process.env.LIVEKIT_API_KEY!,
                process.env.LIVEKIT_API_SECRET!
              );
              await roomService.updateRoomMetadata(
                event.room.name,
                JSON.stringify({ startedAt: Date.now() })
              );
            } catch (err) {
              console.error('[Webhook] Failed to set meet room metadata:', err);
            }
          }
        }
        break;

      case 'room_finished':
        // Update stream status to offline
        if (event.room) {
          await updateStreamStatus(event.room.name, false);
          // Voice call end: update voice_calls for outbound-* / inbound-* rooms
          if (event.room.name.startsWith('outbound-') || event.room.name.startsWith('inbound-')) {
            await handleCallEnd(event.room.name);
          }
        }
        break;

      case 'participant_joined':
        // Track participant join and broadcast viewer count
        if (event.room) {
          console.log(`Participant joined: ${event.participant?.identity} to room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
          // Inbound SIP call: room name prefix "inbound-" (LiveKit SIP dispatch rule convention)
          if (event.room.name.startsWith('inbound-') && event.participant) {
            const participantInfo = event.participant as unknown as MinimalParticipant;
            await handleInboundSipCall(event.room.name, participantInfo);
          }

          if (
            event.room.name.startsWith('inbound-') &&
            event.participant &&
            !isSipParticipant(event.participant as unknown as MinimalParticipant)
          ) {
            await markCallConnected(event.room.name);
          }
        }
        break;

      case 'participant_left':
        // Track participant leave and broadcast viewer count
        if (event.room) {
          console.log(`Participant left: ${event.participant?.identity} from room ${event.room.name}`);
          await broadcastViewerCount(event.room.name);
          // Optional: when SIP participant leaves, we could mark call ended here,
          // but room_finished is the canonical signal when room is empty.
        }
        break;

      case 'egress_ended': {
        // Store recording URL in voice_calls / meet_rooms when egress finishes
        const raw = event as {
          egressInfo?: {
            roomName?: string;
            fileResults?: Array<{ location?: string; filename?: string; path?: string }>;
            egressId?: string;
          };
          egress_info?: {
            room_name?: string;
            file_results?: Array<{ location?: string; filename?: string; path?: string }>;
            egress_id?: string;
          };
        };
        const info = (raw.egressInfo ?? raw.egress_info) as Record<string, unknown> | undefined;
        const roomName = (info?.roomName ?? info?.room_name) as string | undefined;
        const rawFileResults = (info?.fileResults ?? info?.file_results) as Array<Record<string, unknown>> | undefined;
        const fileResults = (rawFileResults ?? []).map((f) => ({
          location: (f.location ?? f.filename ?? f.path) as string | undefined,
          filename: (f.filename ?? f.location ?? f.path) as string | undefined,
        }));
        const egressId = (info?.egressId ?? info?.egress_id) as string | undefined;
        if (roomName) {
          if (roomName.startsWith('outbound-') || roomName.startsWith('inbound-')) {
            await handleEgressEnded({ roomName, egressId, fileResults });
          } else if (roomName.startsWith('meet-')) {
            await handleMeetEgressEnded({ roomName, egressId, fileResults });
          }
        }
        break;
      }

      default:
        // Handle transcription events (not in WebhookEventNames type yet)
        const eventType = (event as any).event;
        if (eventType === 'transcription_received' || eventType === 'transcription_final') {
          const transcription = (event as any).transcription;
          if (transcription && event.room) {
            const text = transcription.text || '';
            const isFinal = eventType === 'transcription_final';
            await handleCallTranscription(event.room.name, text, isFinal);
            if (event.room.name.startsWith('meet-')) {
              await handleMeetTranscription(event.room.name, text, isFinal);
            }
          }
        } else {
          console.log(`Unhandled LiveKit event: ${eventType || event.event}`);
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing LiveKit webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateStreamStatus(roomName: string, isLive: boolean) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await (supabase
    .from('live_streams') as any)
    .update({ is_live: isLive, updated_at: new Date().toISOString() })
    .eq('room_name', roomName);
}

async function handleCallTranscription(
  roomName: string,
  text: string,
  isFinal: boolean
) {
  // Process SIP call rooms: outbound-*, inbound-*, and legacy call-*
  const isCallRoom =
    roomName.startsWith('outbound-') ||
    roomName.startsWith('inbound-') ||
    roomName.startsWith('call-');
  if (!isCallRoom) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get call record
    const { data: call, error: callError } = await supabase
      .from('voice_calls')
      .select('*')
      .eq('room_name', roomName)
      .single();

    if (callError || !call) {
      console.log(`Call record not found for room: ${roomName}`);
      return;
    }

    // Append to transcript
    const currentTranscript = call.transcript || '';
    const updatedTranscript = isFinal 
      ? currentTranscript + ' ' + text
      : currentTranscript; // Don't update partial transcripts in DB

    if (isFinal && text.trim()) {
      await supabase
        .from('voice_calls')
        .update({
          transcript: updatedTranscript.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('room_name', roomName);

      // If call is completed and we have a contact_id, analyze the transcript
      if (call.contact_id && call.status === 'completed') {
        const { analyzeCallTranscript } = await import('@/utils/admin-assistant/call-analyzer');
        await analyzeCallTranscript(
          call.contact_id,
          updatedTranscript.trim(),
          {
            duration: call.duration_seconds,
            callType: call.call_type,
            clientPhone: call.client_phone,
          }
        );
      }
    }
  } catch (error) {
    console.error('Error handling call transcription:', error);
  }
}

/** Store transcription for meet-* rooms when LiveKit sends transcription_received/transcription_final.
 * Only appends when room has transcription_enabled and segment is final.
 */
async function handleMeetTranscription(
  roomName: string,
  text: string,
  isFinal: boolean
) {
  if (!roomName.startsWith('meet-') || !isFinal || !text.trim()) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: meetRoom, error: fetchError } = await supabase
      .from('meet_rooms')
      .select('id, transcription_enabled, transcript')
      .eq('room_name', roomName)
      .single();

    if (fetchError || !meetRoom) return;
    if (!(meetRoom as { transcription_enabled?: boolean }).transcription_enabled) return;

    const currentTranscript = (meetRoom as { transcript?: string | null }).transcript ?? '';
    const updatedTranscript = (currentTranscript + ' ' + text.trim()).trim();

    await supabase
      .from('meet_rooms')
      .update({
        transcript: updatedTranscript,
        updated_at: new Date().toISOString(),
      })
      .eq('room_name', roomName);
  } catch (error) {
    console.error('Error handling meet transcription:', error);
  }
}

/** Handle inbound SIP call: create voice_calls row and notify admins to answer in browser */
async function handleInboundSipCall(roomName: string, participant: MinimalParticipant) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabase
    .from('voice_calls')
    .select('id')
    .eq('room_name', roomName)
    .limit(1)
    .single();

  if (existing) return;

  let phoneNumber = participant.identity ?? roomName;
  if (participant.metadata) {
    try {
      const meta = JSON.parse(participant.metadata);
      if (meta.phoneNumber || meta.phone) phoneNumber = meta.phoneNumber || meta.phone;
    } catch {
      // ignore
    }
  }

  await supabase.from('voice_calls').insert({
    room_name: roomName,
    contact_id: null,
    client_phone: phoneNumber,
    admin_phone: null,
    direction: 'inbound',
    call_type: 'inbound',
    status: 'ringing',
    started_at: new Date().toISOString(),
  });

  // Optional: start room egress (audio recording) when LIVEKIT_EGRESS_ENABLED and S3 are set
  const { startCallEgress } = await import('@/utils/livekit/egress');
  startCallEgress(roomName).catch((err) => console.error('[Egress] startCallEgress:', err));

  const { broadcastToAllAdmins } = await import('@/utils/livekit/notifications');
  await broadcastToAllAdmins({
    type: 'incoming_call',
    title: 'Incoming call',
    message: `Call from ${phoneNumber}`,
    data: { roomName, phoneNumber, callerId: participant.identity },
    priority: 'high',
  });

  scheduleAutoAnswer(roomName).catch((err) => console.error('Auto-answer schedule error:', err));
}

/** Store recording URL in voice_calls when LiveKit egress ends (egress_ended webhook). */
async function handleEgressEnded(egressInfo: {
  roomName?: string;
  egressId?: string;
  fileResults?: Array<{ location?: string; filename?: string }>;
}) {
  const roomName = egressInfo.roomName;
  if (!roomName) return;

  const fileResults = egressInfo.fileResults ?? [];
  const firstFile = fileResults[0];
  const recordingUrl = firstFile?.location;
  if (!recordingUrl && !egressInfo.egressId) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const update: { recording_url?: string; egress_id?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (recordingUrl) update.recording_url = recordingUrl;
  if (egressInfo.egressId) update.egress_id = egressInfo.egressId;

  await supabase
    .from('voice_calls')
    .update(update)
    .eq('room_name', roomName);
}

/**
 * Build a Supabase Storage public URL from bucket and object path.
 * Use when LiveKit returns an S3 key/path instead of a full URL (e.g. with Supabase S3).
 */
function buildSupabaseRecordingUrl(pathOrKey: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.LIVEKIT_EGRESS_S3_BUCKET;
  if (!base || !bucket || !pathOrKey || pathOrKey.startsWith('http')) return null;
  const baseUrl = base.replace(/\/$/, '');
  const path = pathOrKey.replace(/^\//, '');
  return `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/** Store recording URL in meet_rooms when LiveKit meet egress ends. */
async function handleMeetEgressEnded(egressInfo: {
  roomName?: string;
  egressId?: string;
  fileResults?: Array<{ location?: string; filename?: string }>;
}) {
  const roomName = egressInfo.roomName;
  if (!roomName || !roomName.startsWith('meet-')) return;

  const fileResults = egressInfo.fileResults ?? [];
  const firstFile = fileResults[0];
  let recordingUrl: string | null = (firstFile?.location ?? firstFile?.filename) ?? null;
  if (!recordingUrl && !egressInfo.egressId) return;

  // If we have a path/key instead of a full URL (e.g. Supabase S3 returns key), build public URL
  if (recordingUrl && !recordingUrl.startsWith('http')) {
    const publicUrl = buildSupabaseRecordingUrl(recordingUrl);
    if (publicUrl) recordingUrl = publicUrl;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const update: { recording_url?: string; egress_id?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (recordingUrl) update.recording_url = recordingUrl;
  if (egressInfo.egressId) update.egress_id = egressInfo.egressId;

  const { error } = await supabase.from('meet_rooms').update(update).eq('room_name', roomName);
  if (error) {
    console.error('[Webhook] handleMeetEgressEnded update error:', error);
  } else if (!recordingUrl && egressInfo.egressId) {
    console.warn('[Webhook] meet egress_ended: no recording URL (fileResults:', JSON.stringify(fileResults), ')');
  }
}

/** Update voice_calls when a call room ends (room_finished for outbound-* / inbound-*). */
async function handleCallEnd(roomName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: call, error: fetchError } = await supabase
    .from('voice_calls')
    .select('id, started_at, status')
    .eq('room_name', roomName)
    .maybeSingle();

  if (fetchError || !call) return;
  if (call.status === 'completed' || call.status === 'failed' || call.status === 'missed') return;

  const endedAt = new Date();
  const startedAt = call.started_at ? new Date(call.started_at) : endedAt;
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

  await supabase
    .from('voice_calls')
    .update({
      status: 'completed',
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds,
      updated_at: endedAt.toISOString(),
    })
    .eq('room_name', roomName);
}

function isSipParticipant(participant: MinimalParticipant | null | undefined): boolean {
  if (!participant) return false;
  if (participant.identity && typeof participant.identity === 'string') {
    if (participant.identity.toLowerCase().startsWith('sip')) return true;
  }
  if (participant.kind && typeof participant.kind === 'string') {
    return participant.kind.toUpperCase().includes('SIP');
  }
  if (typeof participant.kind === 'number') {
    // LiveKit enum: 0 = STANDARD, 1 = SIP (value may change; treat >0 as SIP fallback)
    return participant.kind > 0;
  }
  return false;
}

async function markCallConnected(roomName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase
    .from('voice_calls')
    .update({
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('room_name', roomName)
    .eq('status', 'ringing');
}

async function scheduleAutoAnswer(roomName: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settingsRow } = await supabase
      .from('livekit_agent_settings')
      .select('agent_name, auto_answer_enabled, auto_answer_delay_seconds')
      .is('organization_id', null)
      .eq('name', 'default_m10')
      .maybeSingle();

    const autoAnswerEnabled =
      (settingsRow as { auto_answer_enabled?: boolean } | null)?.auto_answer_enabled ?? true;
    if (!autoAnswerEnabled) return;

    const delaySecondsRaw =
      (settingsRow as { auto_answer_delay_seconds?: number } | null)?.auto_answer_delay_seconds ?? 20;
    const delaySeconds = Number.isFinite(delaySecondsRaw) && delaySecondsRaw > 0 ? delaySecondsRaw : 20;

    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

    const { data: call } = await supabase
      .from('voice_calls')
      .select('status')
      .eq('room_name', roomName)
      .maybeSingle();
    if (!call || call.status !== 'ringing') return;

    if (!livekitHost || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
      console.warn('LiveKit credentials missing; cannot auto-answer');
      return;
    }

    const { RoomServiceClient, AgentDispatchClient } = await import('livekit-server-sdk');
    const roomService = new RoomServiceClient(
      livekitHost,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    let participants: Array<any> = [];
    try {
      participants = await roomService.listParticipants(roomName);
    } catch (err) {
      console.error('Auto-answer listParticipants error:', err);
      return;
    }

    const hasNonSipParticipant = participants.some((p) =>
      !isSipParticipant(p as MinimalParticipant)
    );
    if (hasNonSipParticipant) return;

    const agentName = (settingsRow as { agent_name?: string } | null)?.agent_name ?? 'Ben';
    const dispatchClient = new AgentDispatchClient(
      livekitHost,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    try {
      await dispatchClient.createDispatch(roomName, agentName, {
        metadata: JSON.stringify({
          auto_answer: true,
          triggered_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Auto-answer dispatch error:', err);
    }
  } catch (err) {
    console.error('Auto-answer unexpected error:', err);
  }
}

async function broadcastViewerCount(roomName: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get current participant count from LiveKit Room API
    const { RoomServiceClient } = await import('livekit-server-sdk');
    const roomService = new RoomServiceClient(
      process.env.LIVEKIT_URL!,
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!
    );

    const participants = await roomService.listParticipants(roomName);
    // Filter out the streamer (participant with canPublish permission)
    const viewerCount = participants.filter(
      (p: any) => !p.permissions?.canPublish
    ).length;

    // Broadcast viewer count to all subscribers
    const channel = supabase.channel(`viewer_count:${roomName}`);
    await channel.send({
      type: 'broadcast',
      event: 'viewer_count_update',
      payload: { count: viewerCount, roomName },
    });
  } catch (error) {
    console.error('Error broadcasting viewer count:', error);
    // Fallback: try to get count from event data if available
    // Otherwise broadcast 0
    try {
      const channel = supabase.channel(`viewer_count:${roomName}`);
      await channel.send({
        type: 'broadcast',
        event: 'viewer_count_update',
        payload: { count: 0, roomName },
      });
    } catch (broadcastError) {
      console.error('Error broadcasting fallback count:', broadcastError);
    }
  }
}

