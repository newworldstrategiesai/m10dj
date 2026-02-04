import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

/**
 * GET /api/livekit/recordings
 * List all video and audio recordings (meet + voice calls).
 * Super admin: all recordings. Regular user: own meet recordings only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = isSuperAdminEmail(user.email);

    const recordings: Array<{
      id: string;
      type: 'meet' | 'voice';
      mediaType: 'video' | 'audio';
      url: string;
      title: string;
      date: string;
      username?: string;
      clientPhone?: string;
      durationSeconds?: number;
    }> = [];

    // Meet recordings
    let meetQuery = supabase
      .from('meet_rooms')
      .select('id, username, title, recording_url, updated_at')
      .not('recording_url', 'is', null)
      .order('updated_at', { ascending: false });

    if (!isAdmin) {
      meetQuery = meetQuery.eq('user_id', user.id);
    }

    const { data: meetRooms } = await meetQuery;

    if (meetRooms) {
      for (const r of meetRooms) {
        const typed = r as { id: string; username: string; title: string | null; recording_url: string; updated_at: string };
        if (typed.recording_url) {
          const ext = typed.recording_url.toLowerCase().endsWith('.mp4') ? 'video' : 'audio';
          recordings.push({
            id: `meet-${typed.id}`,
            type: 'meet',
            mediaType: ext as 'video' | 'audio',
            url: typed.recording_url,
            title: typed.title || `Meet @${typed.username}`,
            date: typed.updated_at,
            username: typed.username,
          });
        }
      }
    }

    // Voice call recordings (admin only - RLS limits access)
    if (isAdmin) {
      const { data: voiceCalls } = await supabase
        .from('voice_calls')
        .select('id, client_phone, room_name, recording_url, started_at, ended_at, duration_seconds')
        .not('recording_url', 'is', null)
        .order('started_at', { ascending: false });

      if (voiceCalls) {
        for (const v of voiceCalls) {
          const typed = v as {
            id: string;
            client_phone?: string;
            room_name?: string;
            recording_url: string;
            started_at?: string;
            ended_at?: string;
            duration_seconds?: number;
          };
          if (typed.recording_url) {
            const date = typed.ended_at || typed.started_at || new Date().toISOString();
            recordings.push({
              id: `voice-${typed.id}`,
              type: 'voice',
              mediaType: 'audio',
              url: typed.recording_url,
              title: typed.client_phone ? `Call ${typed.client_phone}` : `Call ${typed.room_name || typed.id}`,
              date,
              clientPhone: typed.client_phone ?? undefined,
              durationSeconds: typed.duration_seconds ?? undefined,
            });
          }
        }
      }
    }

    // Sort by date descending
    recordings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ recordings });
  } catch (err) {
    console.error('[Recordings API] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
