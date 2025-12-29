/**
 * API Route: /api/serato/now-playing
 * 
 * Receives "Now Playing" events from the companion app
 * and triggers matching/notification logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeTrackString } from '@/utils/serato/normalize';
import { matchTrackToRequest } from '@/utils/serato/matching';

// Rate limiting: Max 1 request per 2 seconds per user
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2000;

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[Serato API] Auth error:', authError?.message);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const lastRequest = rateLimitMap.get(user.id);
    const now = Date.now();
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another request.' },
        { status: 429 }
      );
    }
    rateLimitMap.set(user.id, now);

    // 3. Parse request body
    const body = await request.json();
    const { track, detection_method, source_file, platform, app_version } = body;

    // Validate required fields
    if (!track?.artist || !track?.title || !track?.played_at) {
      return NextResponse.json(
        { error: 'Missing required fields: track.artist, track.title, track.played_at' },
        { status: 400 }
      );
    }

    // Validate detection method
    const validMethods = ['text_file', 'serato_history', 'live_playlists', 'websocket', 'manual', 'virtualdj', 'rekordbox', 'traktor'];
    if (detection_method && !validMethods.includes(detection_method)) {
      return NextResponse.json(
        { error: `Invalid detection_method. Must be one of: ${validMethods.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`[Serato API] Track received: ${track.artist} - ${track.title}`);
    console.log(`[Serato API] User: ${user.email}, Method: ${detection_method || 'unknown'}`);

    // 4. Create service client (bypasses RLS)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[Serato API] Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 5. Get user's organization (if any)
    const { data: organization } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    // 6. Normalize track strings
    const normalizedArtist = normalizeTrackString(track.artist);
    const normalizedTitle = normalizeTrackString(track.title);

    // 7. Insert play history
    const { data: playHistory, error: insertError } = await serviceSupabase
      .from('serato_play_history')
      .insert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        artist: track.artist,
        title: track.title,
        normalized_artist: normalizedArtist,
        normalized_title: normalizedTitle,
        played_at: track.played_at,
        deck: track.deck || null,
        bpm: track.bpm || null,
        detection_method: detection_method || 'text_file',
        source_file: source_file || null
      })
      .select()
      .single();

    if (insertError) {
      // Check for duplicate constraint violation
      if (insertError.code === '23505') {
        console.log('[Serato API] Duplicate play ignored');
        return NextResponse.json({
          success: true,
          message: 'Duplicate play event ignored',
          duplicate: true
        });
      }

      console.error('[Serato API] Insert error:', insertError);
      // Continue anyway - don't fail just because of insert error
    }

    // 8. Update connection status
    await serviceSupabase
      .from('serato_connections')
      .upsert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        last_heartbeat: new Date().toISOString(),
        is_connected: true,
        platform: platform || null,
        app_version: app_version || null,
        detection_method: detection_method || 'text_file'
      }, {
        onConflict: 'dj_id'
      });

    // 9. Match to requests (async - don't block response)
    let matchResult: { matched: boolean; requestId?: string } = { matched: false };
    
    if (playHistory) {
      try {
        matchResult = await matchTrackToRequest(playHistory, serviceSupabase);
      } catch (matchError) {
        console.error('[Serato API] Matching error:', matchError);
        // Don't fail the request just because matching failed
      }
    }

    // 10. Return success
    return NextResponse.json({
      success: true,
      play_id: playHistory?.id,
      matched: matchResult.matched,
      matched_request_id: matchResult.requestId,
      message: matchResult.matched 
        ? 'Track recorded and matched to a request!' 
        : 'Track recorded'
    });

  } catch (error: any) {
    console.error('[Serato API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/serato/now-playing',
    methods: ['POST'],
    description: 'Receives Now Playing events from Serato companion app'
  });
}

