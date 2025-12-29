/**
 * Track-to-request matching logic for Serato play detection
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { normalizeTrackString, calculateSimilarity } from './normalize';
import { sendRequestPlayingNotification } from './notifications';

interface PlayHistory {
  id: string;
  dj_id: string;
  organization_id: string | null;
  artist: string;
  title: string;
  normalized_artist: string;
  normalized_title: string;
  played_at: string;
}

interface CrowdRequest {
  id: string;
  song_artist: string;
  song_title: string;
  normalized_artist: string | null;
  normalized_title: string | null;
  status: string;
  notification_sent: boolean;
  requester_phone: string | null;
  requester_email: string | null;
}

// Similarity threshold for fuzzy matching (85%)
const MATCH_THRESHOLD = 0.85;

/**
 * Match a played track to active song requests
 * Updates request status and triggers notifications
 */
export async function matchTrackToRequest(
  playHistory: PlayHistory,
  supabase: SupabaseClient
): Promise<{ matched: boolean; requestId?: string }> {
  try {
    console.log(`[Serato Matching] Looking for match: ${playHistory.artist} - ${playHistory.title}`);

    // 1. Get the DJ's organization first
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', playHistory.dj_id)
      .single();

    if (!org) {
      console.log('[Serato Matching] DJ has no organization, cannot match requests');
      return { matched: false };
    }

    // 2. Build query for active requests within the DJ's organization
    const { data: activeRequests, error } = await supabase
      .from('crowd_requests')
      .select('id, song_artist, song_title, normalized_artist, normalized_title, status, notification_sent, requester_phone, requester_email')
      .eq('request_type', 'song_request')
      .eq('organization_id', org.id)
      .in('status', ['new', 'acknowledged', 'paid']) as { data: CrowdRequest[] | null; error: any };

    if (error) {
      console.error('[Serato Matching] Error fetching requests:', error);
      return { matched: false };
    }

    if (!activeRequests || activeRequests.length === 0) {
      console.log('[Serato Matching] No active requests to match');
      return { matched: false };
    }

    console.log(`[Serato Matching] Found ${activeRequests.length} active requests to check`);

    // 3. Try to find a match using fuzzy matching
    const normTrackArtist = normalizeTrackString(playHistory.artist);
    const normTrackTitle = normalizeTrackString(playHistory.title);

    let bestMatch: CrowdRequest | null = null;
    let bestScore = 0;
    let bestArtistSim = 0;
    let bestTitleSim = 0;

    for (const request of activeRequests) {
      if (!request.normalized_artist || !request.normalized_title) continue;

      const artistSimilarity = calculateSimilarity(normTrackArtist, request.normalized_artist);
      const titleSimilarity = calculateSimilarity(normTrackTitle, request.normalized_title);

      // Both must meet threshold
      if (artistSimilarity < MATCH_THRESHOLD || titleSimilarity < MATCH_THRESHOLD) continue;

      // Combined score
      const score = (artistSimilarity + titleSimilarity) / 2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = request;
        bestArtistSim = artistSimilarity;
        bestTitleSim = titleSimilarity;
      }
    }

    if (!bestMatch) {
      console.log('[Serato Matching] No match found');
      return { matched: false };
    }

    console.log(`[Serato Matching] ✓ Match found: ${bestMatch.song_artist} - ${bestMatch.song_title}`);
    console.log(`[Serato Matching]   Artist similarity: ${(bestArtistSim * 100).toFixed(1)}%`);
    console.log(`[Serato Matching]   Title similarity: ${(bestTitleSim * 100).toFixed(1)}%`);

    // 4. First, mark any currently "playing" requests as "played"
    // This ensures only one request can be "playing" at a time
    const { error: completeError } = await supabase
      .from('crowd_requests')
      .update({
        status: 'played'
      })
      .eq('organization_id', org.id)
      .eq('status', 'playing')
      .neq('id', bestMatch.id); // Don't update the one we're about to set as playing

    if (completeError) {
      console.error('[Serato Matching] Error completing previous requests:', completeError);
    }

    // 5. Update matched request status to "playing"
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({
        status: 'playing',
        played_at: playHistory.played_at,
        matched_play_id: playHistory.id
      })
      .eq('id', bestMatch.id);

    if (updateError) {
      console.error('[Serato Matching] Error updating request:', updateError);
      // Continue to notification even if update fails
    }

    // 6. Send notification (one time only)
    if (!bestMatch.notification_sent) {
      try {
        await sendRequestPlayingNotification({
          id: bestMatch.id,
          song_artist: bestMatch.song_artist,
          song_title: bestMatch.song_title,
          requester_phone: bestMatch.requester_phone,
          requester_email: bestMatch.requester_email
        }, supabase);
        console.log('[Serato Matching] Notification sent');
      } catch (notifyError) {
        console.error('[Serato Matching] Error sending notification:', notifyError);
        // Don't fail the match just because notification failed
      }
    } else {
      console.log('[Serato Matching] Notification already sent, skipping');
    }

    // 7. Update play history with match info
    const { error: playUpdateError } = await supabase
      .from('serato_play_history')
      .update({
        matched_request_id: bestMatch.id,
        matched_at: new Date().toISOString()
      })
      .eq('id', playHistory.id);

    if (playUpdateError) {
      console.error('[Serato Matching] Error updating play history:', playUpdateError);
    }

    return {
      matched: true,
      requestId: bestMatch.id
    };

  } catch (error) {
    console.error('[Serato Matching] Unexpected error:', error);
    return { matched: false };
  }
}

/**
 * Create a service client for matching operations
 * Uses service role key to bypass RLS
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

