/**
 * API Route: /api/serato/test
 * 
 * Test endpoint for simulating Serato play events
 * Can be used to test the matching and notification flow
 * without running the companion app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeTrackString } from '@/utils/serato/normalize';
import { matchTrackToRequest } from '@/utils/serato/matching';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await userSupabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { artist, title } = body;

    if (!artist || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: artist, title' },
        { status: 400 }
      );
    }

    // 3. Create service client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 4. Get user's organization
    const { data: organization } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // 5. Create test play entry
    const playedAt = new Date().toISOString();
    
    const { data: playHistory, error: insertError } = await serviceSupabase
      .from('serato_play_history')
      .insert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        artist,
        title,
        normalized_artist: normalizeTrackString(artist),
        normalized_title: normalizeTrackString(title),
        played_at: playedAt,
        detection_method: 'manual'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({
          success: false,
          error: 'Duplicate play event',
          duplicate: true
        });
      }
      console.error('[Serato Test] Insert error:', insertError);
    }

    // 6. Try to match
    let matchResult: { matched: boolean; requestId?: string } = { matched: false };
    
    if (playHistory) {
      try {
        matchResult = await matchTrackToRequest(playHistory, serviceSupabase);
      } catch (matchError) {
        console.error('[Serato Test] Matching error:', matchError);
      }
    }

    return NextResponse.json({
      success: true,
      play_id: playHistory?.id,
      artist,
      title,
      normalized_artist: normalizeTrackString(artist),
      normalized_title: normalizeTrackString(title),
      played_at: playedAt,
      matched: matchResult.matched,
      matched_request_id: matchResult.requestId,
      message: matchResult.matched 
        ? `✅ Matched to request ${matchResult.requestId}! Notification sent.`
        : '🎵 Track recorded (no matching requests found)'
    });

  } catch (error: any) {
    console.error('[Serato Test] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/serato/test',
    description: 'Test endpoint for simulating Serato play events',
    usage: {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN',
        'Content-Type': 'application/json'
      },
      body: {
        artist: 'Artist Name',
        title: 'Song Title'
      }
    },
    example: {
      artist: 'Daft Punk',
      title: 'Get Lucky'
    }
  });
}

