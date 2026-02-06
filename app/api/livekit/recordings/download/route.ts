import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';

/**
 * GET /api/livekit/recordings/download?type=meet|voice&id=<uuid>
 * Returns the recording file with Content-Disposition: attachment so the browser
 * triggers a download. Uses same auth as GET /api/livekit/recordings.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id || (type !== 'meet' && type !== 'voice')) {
      return NextResponse.json(
        { error: 'Missing or invalid type (meet|voice) or id' },
        { status: 400 }
      );
    }

    const isAdmin = isSuperAdminEmail(user.email);
    let recordingUrl: string | null = null;
    let suggestedName = `recording-${type}-${id.slice(0, 8)}`;

    if (type === 'meet') {
      // Bucket-only recording (id = storage-<encoded-path> from list merge)
      if (id.startsWith('storage-')) {
        const encodedPath = id.slice(8);
        const bucket = process.env.LIVEKIT_EGRESS_S3_BUCKET || 'meet-recordings';
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
        if (base && encodedPath) {
          try {
            const path = decodeURIComponent(encodedPath);
            if (!path.includes('..') && !path.startsWith('/')) {
              const pathSegment = path.split('/').map((p) => encodeURIComponent(p)).join('/');
              recordingUrl = `${base}/storage/v1/object/public/${bucket}/${pathSegment}`;
              const filename = path.split('/').pop() || 'recording';
              suggestedName = filename.endsWith('.mp4') || filename.endsWith('.mp3') || filename.endsWith('.m4a') ? filename : `${filename}.mp4`;
            }
          } catch {
            // invalid encoded path
          }
        }
        if (!recordingUrl) {
          return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }
      } else {
        const query = supabase
          .from('meet_rooms')
          .select('recording_url, title, username')
          .eq('id', id)
          .not('recording_url', 'is', null);

        const { data: row, error } = await (!isAdmin
          ? query.eq('user_id', user.id).maybeSingle()
          : query.maybeSingle());

        if (error || !row) {
          return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
        }

        const typed = row as { recording_url: string; title: string | null; username: string };
        recordingUrl = typed.recording_url;
        const base = typed.title || `meet-${typed.username}`;
        const safe = base.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
        suggestedName = `${safe}.${recordingUrl.toLowerCase().endsWith('.mp4') ? 'mp4' : 'm4a'}`;
      }
    } else {
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: row, error } = await supabase
        .from('voice_calls')
        .select('recording_url')
        .eq('id', id)
        .not('recording_url', 'is', null)
        .maybeSingle();

      if (error || !row) {
        return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
      }

      const typed = row as { recording_url: string };
      recordingUrl = typed.recording_url;
      suggestedName = `voice-call-${id.slice(0, 8)}.m4a`;
    }

    if (!recordingUrl) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    const res = await fetch(recordingUrl, {
      redirect: 'follow',
      headers: { Accept: '*/*' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch recording from storage' },
        { status: 502 }
      );
    }

    const contentType = res.headers.get('content-type') || 'video/mp4';
    const contentDisposition = `attachment; filename="${suggestedName.replace(/"/g, '\\"')}"`;

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (err) {
    console.error('[Recordings download] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
