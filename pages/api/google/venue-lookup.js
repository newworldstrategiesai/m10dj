/**
 * Google Places API - Venue Lookup
 * Search for venues and get their addresses
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn('⚠️ GOOGLE_PLACES_API_KEY not configured');
    return res.status(200).json({ 
      results: [],
      fallback: true,
      message: 'Google Places API not configured'
    });
  }

  try {
    // Use Places API Text Search with bias towards Memphis area
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.append('query', `${query} Memphis TN`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('type', 'establishment');
    
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Format results for easy use
      const venues = data.results.slice(0, 5).map(place => ({
        name: place.name,
        address: place.formatted_address,
        place_id: place.place_id,
        types: place.types,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total
      }));

      res.status(200).json({
        success: true,
        results: venues
      });
    } else if (data.status === 'ZERO_RESULTS') {
      res.status(200).json({
        success: true,
        results: [],
        message: 'No venues found'
      });
    } else {
      console.error('Google Places API error:', data.status, data.error_message);
      res.status(200).json({
        success: false,
        results: [],
        error: data.error_message || 'Search failed'
      });
    }
  } catch (error) {
    console.error('❌ Venue lookup error:', error);
    res.status(500).json({
      success: false,
      results: [],
      error: 'Failed to search venues'
    });
  }
}

