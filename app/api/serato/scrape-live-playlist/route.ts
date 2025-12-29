/**
 * API Route: /api/serato/scrape-live-playlist
 * 
 * Scrapes a DJ's Serato Live Playlist and returns the current track.
 * This can be called periodically from the frontend or via a cron job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeTrackString } from '@/utils/serato/normalize';
import { matchTrackToRequest } from '@/utils/serato/matching';

interface ScrapedTrack {
  artist: string;
  title: string;
  timestamp: string;
}

/**
 * Scrape the Serato Live Playlist page
 */
async function scrapePlaylist(username: string): Promise<ScrapedTrack | null> {
  try {
    const url = `https://serato.com/playlists/${username}/live`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 } // Don't cache
    });

    if (!response.ok) {
      console.log(`[Serato Scrape] Playlist not found for ${username}`);
      return null;
    }

    const html = await response.text();
    
    // Parse the most recent track from the HTML
    // Serato shows tracks with "X mins ago" or "Live now!" labels
    
    // Look for track entries - the page structure shows artist and title
    // Pattern: looks for content near time indicators like "secs ago", "mins ago", "Live now"
    
    // Try multiple patterns
    const patterns = [
      // Pattern 1: Look for structured track data
      /(?:secs?\s+ago|mins?\s+ago|Live\s+now)[^<]*<\/[^>]+>[\s\S]{0,1000}?([A-Za-z0-9][\w\s\.\,\'\"\!\?\&\-]{2,50})\s*[-–—]\s*([\w\s\.\,\'\"\!\?\(\)\&\-]{2,80})/i,
      // Pattern 2: More flexible
      /ago\s*<\/[^>]+>[\s\S]{0,500}?>([^<]{3,50})\s*-\s*([^<]{3,80})</i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[2]) {
        const artist = cleanText(match[1]);
        const title = cleanText(match[2]);
        
        if (artist.length > 1 && title.length > 1) {
          return {
            artist,
            title,
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('[Serato Scrape] Error:', error);
    return null;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get request body
    const { serato_username } = await request.json();
    
    if (!serato_username) {
      return NextResponse.json({ error: 'serato_username required' }, { status: 400 });
    }

    // Scrape the playlist
    const track = await scrapePlaylist(serato_username);

    if (!track) {
      return NextResponse.json({
        success: true,
        track: null,
        message: 'No track found or playlist not active'
      });
    }

    // Get service client
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get organization
    const { data: org } = await serviceSupabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Check if this track was already recorded recently (dedupe)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: existingPlay } = await serviceSupabase
      .from('serato_play_history')
      .select('id')
      .eq('dj_id', user.id)
      .eq('normalized_artist', normalizeTrackString(track.artist))
      .eq('normalized_title', normalizeTrackString(track.title))
      .gte('played_at', fiveMinutesAgo)
      .limit(1);

    if (existingPlay && existingPlay.length > 0) {
      return NextResponse.json({
        success: true,
        track,
        duplicate: true,
        message: 'Track already recorded recently'
      });
    }

    // Insert play history
    const { data: playHistory, error: insertError } = await serviceSupabase
      .from('serato_play_history')
      .insert({
        dj_id: user.id,
        organization_id: org?.id || null,
        artist: track.artist,
        title: track.title,
        normalized_artist: normalizeTrackString(track.artist),
        normalized_title: normalizeTrackString(track.title),
        played_at: track.timestamp,
        detection_method: 'live_playlists'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Serato Scrape] Insert error:', insertError);
    }

    // Try to match
    let matchResult: { matched: boolean; requestId?: string } = { matched: false };
    if (playHistory) {
      try {
        matchResult = await matchTrackToRequest(playHistory, serviceSupabase);
      } catch (e) {
        console.error('[Serato Scrape] Match error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      track,
      play_id: playHistory?.id,
      matched: matchResult.matched,
      matched_request_id: matchResult.requestId
    });

  } catch (error: any) {
    console.error('[Serato Scrape] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/serato/scrape-live-playlist',
    description: 'Scrapes Serato Live Playlist for current track',
    method: 'POST',
    body: { serato_username: 'DJ_Ben_Murray' }
  });
}

