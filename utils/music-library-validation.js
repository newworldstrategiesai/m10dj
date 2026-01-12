/**
 * Music Library Validation Utilities
 * 
 * Validates song requests against:
 * - Music library (boundary list)
 * - Blacklist (immediate denial)
 * - Pricing rules (special pricing)
 * - Duplicate detection (already played songs)
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Normalize song string for matching (same logic as database normalize_track_string function)
 */
function normalizeSongString(text) {
  if (!text) return null;
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if a song is blacklisted
 * Returns: { isBlacklisted: boolean, reason?: string }
 */
async function checkBlacklist(organizationId, songTitle, songArtist, supabase = null) {
  if (!organizationId || !songTitle || !songArtist) {
    return { isBlacklisted: false };
  }

  const client = supabase || createClient(supabaseUrl, supabaseServiceKey);
  const normalizedTitle = normalizeSongString(songTitle);
  const normalizedArtist = normalizeSongString(songArtist);

  const { data, error } = await client
    .from('song_blacklist')
    .select('reason')
    .eq('organization_id', organizationId)
    .eq('normalized_title', normalizedTitle)
    .eq('normalized_artist', normalizedArtist)
    .maybeSingle();

  if (error) {
    console.error('Error checking blacklist:', error);
    return { isBlacklisted: false }; // Fail open
  }

  return {
    isBlacklisted: !!data,
    reason: data?.reason || null
  };
}

/**
 * Check if a song has special pricing rules
 * Returns: { hasCustomPrice: boolean, priceCents?: number, appliesToFastTrack?: boolean, appliesToRegular?: boolean }
 */
async function checkPricingRule(organizationId, songTitle, songArtist, isFastTrack = false, supabase = null) {
  if (!organizationId || !songTitle || !songArtist) {
    return { hasCustomPrice: false };
  }

  const client = supabase || createClient(supabaseUrl, supabaseServiceKey);
  const normalizedTitle = normalizeSongString(songTitle);
  const normalizedArtist = normalizeSongString(songArtist);

  const { data, error } = await client
    .from('song_pricing_rules')
    .select('custom_price_cents, applies_to_fast_track, applies_to_regular')
    .eq('organization_id', organizationId)
    .eq('normalized_title', normalizedTitle)
    .eq('normalized_artist', normalizedArtist)
    .maybeSingle();

  if (error) {
    console.error('Error checking pricing rules:', error);
    return { hasCustomPrice: false };
  }

  if (!data) {
    return { hasCustomPrice: false };
  }

  // Check if rule applies to this request type
  const appliesToRequest = isFastTrack 
    ? data.applies_to_fast_track 
    : data.applies_to_regular;

  if (!appliesToRequest) {
    return { hasCustomPrice: false };
  }

  return {
    hasCustomPrice: true,
    priceCents: data.custom_price_cents,
    appliesToFastTrack: data.applies_to_fast_track,
    appliesToRegular: data.applies_to_regular
  };
}

/**
 * Check if a song is in the music library
 * Returns: { inLibrary: boolean }
 */
async function checkMusicLibrary(organizationId, songTitle, songArtist, supabase = null) {
  if (!organizationId || !songTitle || !songArtist) {
    return { inLibrary: false };
  }

  const client = supabase || createClient(supabaseUrl, supabaseServiceKey);
  const normalizedTitle = normalizeSongString(songTitle);
  const normalizedArtist = normalizeSongString(songArtist);

  const { data, error } = await client
    .from('music_library')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('normalized_title', normalizedTitle)
    .eq('normalized_artist', normalizedArtist)
    .maybeSingle();

  if (error) {
    console.error('Error checking music library:', error);
    return { inLibrary: false };
  }

  return { inLibrary: !!data };
}

/**
 * Check if a song was recently played (duplicate detection)
 * Returns: { isDuplicate: boolean, lastPlayedAt?: string, minutesAgo?: number }
 */
async function checkDuplicate(
  organizationId, 
  songTitle, 
  songArtist, 
  eventId = null,
  timeWindowMinutes = 60,
  supabase = null
) {
  if (!organizationId || !songTitle || !songArtist) {
    return { isDuplicate: false };
  }

  const client = supabase || createClient(supabaseUrl, supabaseServiceKey);
  const normalizedTitle = normalizeSongString(songTitle);
  const normalizedArtist = normalizeSongString(songArtist);

  // Check both songs_played and serato_play_history tables
  const timeWindow = new Date();
  timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);

  // Check crowd_requests for the same song (this is the most reliable source)
  let crowdQuery = client
    .from('crowd_requests')
    .select('created_at, status, normalized_title, normalized_artist')
    .eq('organization_id', organizationId)
    .eq('request_type', 'song_request')
    .in('status', ['new', 'acknowledged', 'playing', 'played'])
    .gte('created_at', timeWindow.toISOString())
    .order('created_at', { ascending: false });

  const { data: recentRequests, error: requestsError } = await crowdQuery;

  // Filter by normalized title/artist if we have normalized fields
  // Otherwise, do a case-insensitive match
  let matchingRequests = [];
  if (recentRequests) {
    matchingRequests = recentRequests.filter(req => {
      const reqNormalizedTitle = req.normalized_title || normalizeSongString(req.song_title);
      const reqNormalizedArtist = req.normalized_artist || normalizeSongString(req.song_artist);
      return reqNormalizedTitle === normalizedTitle && reqNormalizedArtist === normalizedArtist;
    });
  }

  // Also check songs_played table (use normalized matching via SQL)
  // Note: songs_played doesn't have normalized fields, so we'll match manually after fetching
  const { data: songsPlayed, error: songsError } = await client
    .from('songs_played')
    .select('recognition_timestamp, song_title, song_artist')
    .eq('organization_id', organizationId)
    .gte('recognition_timestamp', timeWindow.toISOString())
    .order('recognition_timestamp', { ascending: false })
    .limit(100); // Get more to filter client-side

  // Filter songs_played by normalized matching
  const matchingSongsPlayed = (songsPlayed || []).filter(sp => {
    const spNormalizedTitle = normalizeSongString(sp.song_title);
    const spNormalizedArtist = normalizeSongString(sp.song_artist);
    return spNormalizedTitle === normalizedTitle && spNormalizedArtist === normalizedArtist;
  });

  // Check serato_play_history (also doesn't have normalized fields in the way we need)
  const { data: seratoPlays, error: seratoError } = await client
    .from('serato_play_history')
    .select('played_at, title, artist, normalized_title, normalized_artist')
    .eq('organization_id', organizationId)
    .gte('played_at', timeWindow.toISOString())
    .order('played_at', { ascending: false })
    .limit(100);

  // Filter serato plays by normalized matching
  const matchingSeratoPlays = (seratoPlays || []).filter(sp => {
    const spNormalizedTitle = sp.normalized_title || normalizeSongString(sp.title);
    const spNormalizedArtist = sp.normalized_artist || normalizeSongString(sp.artist);
    return spNormalizedTitle === normalizedTitle && spNormalizedArtist === normalizedArtist;
  });

  const hasRecentPlay = matchingRequests.length > 0 || 
                        matchingSongsPlayed.length > 0 ||
                        matchingSeratoPlays.length > 0;

  if (!hasRecentPlay) {
    return { isDuplicate: false };
  }

  // Get the most recent timestamp from all sources
  const timestamps = [
    ...matchingRequests.map(r => r.created_at),
    ...matchingSongsPlayed.map(s => s.recognition_timestamp),
    ...matchingSeratoPlays.map(s => s.played_at)
  ].filter(Boolean).sort((a, b) => new Date(b) - new Date(a));

  const lastPlayedAt = timestamps[0];
  if (!lastPlayedAt) {
    return { isDuplicate: false };
  }

  const minutesAgo = Math.floor((new Date() - new Date(lastPlayedAt)) / (1000 * 60));

  return {
    isDuplicate: true,
    lastPlayedAt,
    minutesAgo
  };
}

/**
 * Validate a song request against all rules
 * Returns: {
 *   isValid: boolean,
 *   shouldDeny: boolean,
 *   denyReason?: string,
 *   adjustedPrice?: number,
 *   priceAdjustmentReason?: string,
 *   warnings?: string[]
 * }
 */
async function validateSongRequest({
  organizationId,
  songTitle,
  songArtist,
  basePriceCents,
  isFastTrack = false,
  eventId = null,
  supabase = null
}) {
  const client = supabase || createClient(supabaseUrl, supabaseServiceKey);
  const warnings = [];
  let shouldDeny = false;
  let denyReason = null;
  let adjustedPrice = basePriceCents;
  let priceAdjustmentReason = null;

  // 1. Check blacklist first (immediate denial)
  const blacklistCheck = await checkBlacklist(organizationId, songTitle, songArtist, client);
  if (blacklistCheck.isBlacklisted) {
    return {
      isValid: false,
      shouldDeny: true,
      denyReason: blacklistCheck.reason || 'This song is blacklisted',
      adjustedPrice: basePriceCents
    };
  }

  // 2. Check special pricing rules
  const pricingCheck = await checkPricingRule(organizationId, songTitle, songArtist, isFastTrack, client);
  if (pricingCheck.hasCustomPrice) {
    if (pricingCheck.priceCents === -1) {
      // -1 means deny
      return {
        isValid: false,
        shouldDeny: true,
        denyReason: 'This song has been configured to be denied',
        adjustedPrice: basePriceCents
      };
    } else if (pricingCheck.priceCents === 0) {
      adjustedPrice = 0;
      priceAdjustmentReason = 'Free song (configured pricing rule)';
    } else {
      adjustedPrice = pricingCheck.priceCents;
      priceAdjustmentReason = 'Custom pricing rule applied';
    }
  }

  // 3. Check music library (if enabled)
  const orgData = await client
    .from('organizations')
    .select('music_library_enabled, music_library_action, music_library_premium_multiplier, music_library_premium_fixed_cents')
    .eq('id', organizationId)
    .single();

  if (orgData?.music_library_enabled) {
    const libraryCheck = await checkMusicLibrary(organizationId, songTitle, songArtist, client);
    
    if (!libraryCheck.inLibrary) {
      // Song is not in library
      if (orgData.music_library_action === 'deny') {
        return {
          isValid: false,
          shouldDeny: true,
          denyReason: 'This song is not in the DJ\'s music library',
          adjustedPrice: basePriceCents
        };
      } else if (orgData.music_library_action === 'premium_price') {
        const multiplier = orgData.music_library_premium_multiplier || 2.0;
        const fixedPrice = orgData.music_library_premium_fixed_cents;
        
        if (fixedPrice !== null && fixedPrice !== undefined) {
          adjustedPrice = fixedPrice;
        } else {
          adjustedPrice = Math.round(basePriceCents * multiplier);
        }
        priceAdjustmentReason = 'Premium price (song not in library)';
      }
      // If action is 'allow', no change needed
    }
  }

  // 4. Check duplicate rules
  const duplicateRules = await client
    .from('song_duplicate_rules')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (duplicateRules?.enable_duplicate_detection) {
    const timeWindow = duplicateRules.duplicate_time_window_minutes || 60;
    const duplicateCheck = await checkDuplicate(
      organizationId,
      songTitle,
      songArtist,
      eventId,
      timeWindow,
      client
    );

    if (duplicateCheck.isDuplicate) {
      if (duplicateRules.duplicate_action === 'deny') {
        return {
          isValid: false,
          shouldDeny: true,
          denyReason: `This song was played ${duplicateCheck.minutesAgo} minutes ago`,
          adjustedPrice: basePriceCents
        };
      } else if (duplicateRules.duplicate_action === 'premium_price') {
        const multiplier = duplicateRules.duplicate_premium_multiplier || 1.5;
        const fixedPremium = duplicateRules.duplicate_premium_fixed_cents;
        
        if (fixedPremium !== null && fixedPremium !== undefined) {
          adjustedPrice = basePriceCents + fixedPremium;
        } else {
          adjustedPrice = Math.round(basePriceCents * multiplier);
        }
        priceAdjustmentReason = `Premium price (duplicate - played ${duplicateCheck.minutesAgo} min ago)`;
      }
      // If action is 'allow', no change needed
    }
  }

  return {
    isValid: !shouldDeny,
    shouldDeny,
    denyReason,
    adjustedPrice,
    priceAdjustmentReason,
    warnings
  };
}

module.exports = {
  normalizeSongString,
  checkBlacklist,
  checkPricingRule,
  checkMusicLibrary,
  checkDuplicate,
  validateSongRequest
};
