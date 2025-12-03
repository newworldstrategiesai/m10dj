/**
 * Helper function to determine the cover photo URL based on smart fallback logic
 * 
 * Priority:
 * 1. Explicit primary cover photo (requests_cover_photo_url) - only if it's a valid URL
 * 2. If both artist and venue are set, use the one specified by requests_primary_cover_source
 * 3. If only artist is set, use artist
 * 4. If only venue is set, use venue
 * 5. Default fallback
 */
export function getCoverPhotoUrl(organization, defaultCoverPhoto = '/assets/DJ-Ben-Murray-Dodge-Poster.png') {
  if (!organization) {
    console.log('🖼️ [getCoverPhotoUrl] No organization provided, using default');
    return defaultCoverPhoto;
  }

  const {
    requests_cover_photo_url,
    requests_artist_photo_url,
    requests_venue_photo_url,
    requests_primary_cover_source = 'artist'
  } = organization;

  // Helper to check if a URL is valid (not empty and looks like a URL)
  const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.length > 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'));
  };

  const hasArtist = isValidUrl(requests_artist_photo_url);
  const hasVenue = isValidUrl(requests_venue_photo_url);
  const hasPrimary = isValidUrl(requests_cover_photo_url);

  console.log('🖼️ [getCoverPhotoUrl] Evaluating cover photo:', {
    hasPrimary,
    primaryUrl: requests_cover_photo_url,
    hasArtist,
    artistUrl: requests_artist_photo_url,
    hasVenue,
    venueUrl: requests_venue_photo_url,
    primaryCoverSource: requests_primary_cover_source
  });

  // Priority 1: If both artist and venue are set, use the one specified by requests_primary_cover_source
  // This takes highest priority when user has explicitly chosen between artist/venue
  if (hasArtist && hasVenue) {
    const selectedUrl = requests_primary_cover_source === 'venue' 
      ? requests_venue_photo_url 
      : requests_artist_photo_url;
    console.log('🖼️ [getCoverPhotoUrl] Both artist and venue set, using selection:', {
      source: requests_primary_cover_source,
      selectedUrl
    });
    return selectedUrl;
  }

  // Priority 2: If only artist is set, use artist
  if (hasArtist) {
    console.log('🖼️ [getCoverPhotoUrl] Only artist set, using artist photo:', requests_artist_photo_url);
    return requests_artist_photo_url;
  }

  // Priority 3: If only venue is set, use venue
  if (hasVenue) {
    console.log('🖼️ [getCoverPhotoUrl] Only venue set, using venue photo:', requests_venue_photo_url);
    return requests_venue_photo_url;
  }

  // Priority 4: If explicit primary cover photo is set AND it's a valid URL, use it
  // This is a manual override when no artist/venue photos are available
  if (hasPrimary) {
    console.log('🖼️ [getCoverPhotoUrl] Using explicit primary cover photo (fallback):', requests_cover_photo_url);
    return requests_cover_photo_url;
  }

  // Priority 5: Default fallback
  console.log('🖼️ [getCoverPhotoUrl] No valid photos found, using default');
  return defaultCoverPhoto;
}

