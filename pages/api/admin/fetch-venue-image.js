/**
 * API endpoint to fetch venue images from Google Places API
 * 
 * Uses the existing Google Places API key configured in the app.
 * Follows the same pattern as pages/api/google/venue-lookup.js
 */

import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract venue name and address from location string
 */
function parseVenueLocation(location) {
  if (!location) return null;

  // Try to extract venue name and address
  // Format examples:
  // "D'LUXE Venue (Cordova), 11224 Trinity Rd, Cordova, TN 38016"
  // "Venue Name, 123 Main St, City, ST 12345"
  
  const parts = location.split(',').map(p => p.trim());
  
  if (parts.length >= 3) {
    const venueName = parts[0].replace(/\s*\([^)]*\)\s*$/, '').trim(); // Remove parenthetical location
    const streetAddress = parts[1];
    const cityStateZip = parts.slice(2).join(', ');
    
    return {
      venueName,
      fullAddress: location,
      streetAddress,
      cityStateZip
    };
  }
  
  return {
    venueName: location,
    fullAddress: location,
    streetAddress: null,
    cityStateZip: null
  };
}

/**
 * Fetch venue image using Google Places API
 */
async function fetchVenueImageFromGooglePlaces(location) {
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!googlePlacesApiKey) {
    console.log('Google Places API key not configured');
    return null;
  }

  try {
    const parsed = parseVenueLocation(location);
    if (!parsed) return null;

    // Step 1: Search for the place using Text Search
    // Match the pattern from venue-lookup.js: add location context if needed
    let searchQuery = parsed.venueName || parsed.fullAddress;
    
    // If query doesn't contain location info, add Memphis TN context (matching venue-lookup pattern)
    if (!searchQuery.toLowerCase().includes('memphis') && 
        !searchQuery.toLowerCase().includes('tn') && 
        !searchQuery.toLowerCase().includes('tennessee')) {
      searchQuery = `${parsed.venueName} Memphis TN`;
    }
    
    // Use the same URL pattern as venue-lookup.js
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', searchQuery);
    url.searchParams.append('key', googlePlacesApiKey);
    url.searchParams.append('type', 'establishment');
    
    const searchResponse = await fetch(url.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
      console.log('No places found for:', searchQuery);
      return null;
    }

    // Get the first result (most relevant)
    const place = searchData.results[0];
    const placeId = place.place_id;

    if (!placeId) {
      console.log('No place_id found');
      return null;
    }

    // Step 2: Get place details including photos
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,photos&key=${googlePlacesApiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK' || !detailsData.result) {
      console.log('Place details not found');
      return null;
    }

    // Step 3: Get the first photo
    if (detailsData.result.photos && detailsData.result.photos.length > 0) {
      const photo = detailsData.result.photos[0];
      const photoReference = photo.photo_reference;
      
      // Construct photo URL
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${googlePlacesApiKey}`;
      
      return {
        imageUrl: photoUrl,
        source: 'google_places',
        venueName: detailsData.result.name || parsed.venueName
      };
    }

    console.log('No photos found for place');
    return null;
  } catch (error) {
    console.error('Error fetching from Google Places API:', error);
    return null;
  }
}

/**
 * Fallback: Try Google Maps Static Image (no API key needed for basic usage)
 * This provides a map view of the venue location as a fallback
 */
async function fetchVenueImageFallback(location) {
  try {
    const parsed = parseVenueLocation(location);
    if (!parsed || !parsed.fullAddress) return null;

    // Google Maps Static API - free for basic usage (no API key required for low volume)
    const address = encodeURIComponent(parsed.fullAddress);
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${address}&zoom=16&size=800x400&maptype=roadmap&markers=color:red|${address}`;
    
    // Verify the image exists
    const testResponse = await fetch(staticMapUrl, { method: 'HEAD' });
    
    if (testResponse.ok) {
      return {
        imageUrl: staticMapUrl,
        source: 'google_maps_static',
        venueName: parsed.venueName
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching Google Maps static image:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is platform admin
    const isAdmin = isPlatformAdmin(session.user.email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { location, submissionId } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Try Google Places API first
    let imageData = await fetchVenueImageFromGooglePlaces(location);

    // Fallback if Google Places doesn't work
    if (!imageData) {
      imageData = await fetchVenueImageFallback(location);
    }

    if (!imageData || !imageData.imageUrl) {
      return res.status(404).json({ 
        error: 'No venue image found',
        message: 'Could not find an image for this venue. The venue may not exist in Google Maps, or it may not have photos available.'
      });
    }

    // If submissionId is provided, update the submission with the image URL
    if (submissionId) {
      const { error: updateError } = await supabaseService
        .from('contact_submissions')
        .update({
          venue_image_url: imageData.imageUrl,
          venue_image_fetched_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('Error updating submission:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageData.imageUrl,
      source: imageData.source,
      venueName: imageData.venueName,
      submissionId: submissionId || null
    });

  } catch (error) {
    console.error('Error in fetch-venue-image:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

