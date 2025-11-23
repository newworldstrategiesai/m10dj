/**
 * Venue Search Utility
 * Searches local preferred_venues database before falling back to Google Places API
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Search local preferred_venues database
 * @param {string} query - Search query (venue name or address)
 * @param {number} limit - Maximum number of results (default: 5)
 * @returns {Promise<Array>} Array of venue objects
 */
export async function searchLocalVenues(query, limit = 5) {
  if (!supabase || !query || query.length < 2) {
    return [];
  }

  try {
    const searchTerm = query.toLowerCase().trim();
    
    // Search by venue name (case-insensitive, partial match)
    const { data: nameMatches, error: nameError } = await supabase
      .from('preferred_venues')
      .select('venue_name, address, city, state, zip_code, venue_type, website, description')
      .ilike('venue_name', `%${searchTerm}%`)
      .eq('is_active', true)
      .limit(limit);

    if (nameError) {
      console.error('Error searching venues by name:', nameError);
    }

    // Search by address (case-insensitive, partial match)
    const { data: addressMatches, error: addressError } = await supabase
      .from('preferred_venues')
      .select('venue_name, address, city, state, zip_code, venue_type, website, description')
      .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(limit);

    if (addressError) {
      console.error('Error searching venues by address:', addressError);
    }

    // Combine results and remove duplicates
    const allMatches = [...(nameMatches || []), ...(addressMatches || [])];
    const uniqueMatches = new Map();

    allMatches.forEach(venue => {
      const key = `${venue.venue_name}-${venue.city}`;
      if (!uniqueMatches.has(key)) {
        uniqueMatches.set(key, venue);
      }
    });

    // Convert to format matching Google Places API response
    const results = Array.from(uniqueMatches.values())
      .slice(0, limit)
      .map(venue => ({
        name: venue.venue_name,
        address: venue.address.includes(',') 
          ? venue.address 
          : `${venue.address}, ${venue.city}, ${venue.state}${venue.zip_code ? ` ${venue.zip_code}` : ''}`,
        place_id: `local_${venue.venue_name.toLowerCase().replace(/\s+/g, '_')}`,
        types: [venue.venue_type],
        source: 'local',
        website: venue.website,
        description: venue.description
      }));

    return results;
  } catch (error) {
    console.error('Error in searchLocalVenues:', error);
    return [];
  }
}

/**
 * Search venues (local first, then Google Places if needed)
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {number} options.limit - Maximum results (default: 5)
 * @param {boolean} options.localFirst - Search local venues first (default: true)
 * @returns {Promise<Array>} Combined results with local venues prioritized
 */
export async function searchVenues(query, options = {}) {
  const { limit = 5, localFirst = true } = options;

  if (!query || query.length < 2) {
    return [];
  }

  // Always search local venues first
  const localResults = await searchLocalVenues(query, limit);

  // If we have enough local results, return them
  if (localResults.length >= limit) {
    return localResults;
  }

  // Otherwise, fetch from Google Places API and combine
  try {
    const response = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.success && data.results) {
      // Combine local and Google results, prioritizing local
      const combined = [...localResults];
      const localNames = new Set(localResults.map(v => v.name.toLowerCase()));
      
      // Add Google results that aren't already in local results
      data.results.forEach(venue => {
        if (!localNames.has(venue.name.toLowerCase()) && combined.length < limit) {
          combined.push({ ...venue, source: 'google' });
        }
      });

      return combined.slice(0, limit);
    }
  } catch (error) {
    console.error('Error fetching from Google Places:', error);
  }

  // Return local results even if Google API fails
  return localResults;
}

