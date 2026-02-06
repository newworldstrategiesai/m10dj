import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

const RECORDINGS_BUCKET_PREFIX = 'meet-storage-';

/**
 * GET /api/livekit/recordings
 * List all video and audio recordings (meet + voice calls).
 * Includes rows from meet_rooms/voice_calls and objects in the meet-recordings bucket
 * that don't have a DB row (so files in the bucket always show in the UI).
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

    const existingUrls = new Set<string>();

    // Meet recordings from DB
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
          existingUrls.add(typed.recording_url);
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
            existingUrls.add(typed.recording_url);
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

    // Meet recordings from storage bucket (files in bucket that don't have a meet_rooms.recording_url)
    const bucketName = process.env.LIVEKIT_EGRESS_S3_BUCKET || 'meet-recordings';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey) {
      const storage = createServiceClient(supabaseUrl, serviceKey);
      const prefix = process.env.LIVEKIT_EGRESS_S3_MEET_PREFIX || 'meet-recordings';
      try {
        const listRoot = await storage.storage.from(bucketName).list('', { limit: 500 });
        const listPrefix = prefix && prefix !== '' ? await storage.storage.from(bucketName).list(prefix, { limit: 500 }) : { data: null };
        const rootFiles = (listRoot.data ?? []).filter((f) => f.name && !(f as { metadata?: { mimetype?: string } }).metadata?.mimetype);
        const prefixFiles = (listPrefix.data ?? []).filter((f) => f.name && !(f as { metadata?: { mimetype?: string } }).metadata?.mimetype);
        const allPaths: { path: string; updatedAt: string }[] = [];
        for (const f of rootFiles) {
          if (f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.mp3') || f.name.endsWith('.m4a'))) {
            allPaths.push({
              path: f.name,
              updatedAt: (f as { updated_at?: string }).updated_at ?? new Date().toISOString(),
            });
          }
        }
        for (const f of prefixFiles) {
          if (f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.mp3') || f.name.endsWith('.m4a'))) {
            const fullPath = `${prefix}/${f.name}`;
            allPaths.push({
              path: fullPath,
              updatedAt: (f as { updated_at?: string }).updated_at ?? new Date().toISOString(),
            });
          }
        }
        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const myRoomPrefix = !isAdmin ? `meet-${user.id}` : null;
        for (const { path, updatedAt } of allPaths) {
          if (myRoomPrefix && !path.includes(myRoomPrefix)) continue;
          const pathSegment = path.split('/').map((p) => encodeURIComponent(p)).join('/');
          const normalized = `${baseUrl}/storage/v1/object/public/${bucketName}/${pathSegment}`;
          if (existingUrls.has(normalized)) continue;
          existingUrls.add(normalized);
          const mediaType = path.toLowerCase().endsWith('.mp4') ? 'video' : 'audio';
          const safePath = encodeURIComponent(path);
          recordings.push({
            id: `${RECORDINGS_BUCKET_PREFIX}${safePath}`,
            type: 'meet',
            mediaType: mediaType as 'video' | 'audio',
            url: normalized,
            title: path.split('/').pop() || 'Meeting recording',
            date: updatedAt,
          });
        }
      } catch (storageErr) {
        console.warn('[Recordings API] Storage list failed:', storageErr);
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
