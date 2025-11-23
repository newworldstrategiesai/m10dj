/**
 * Google Places API - Venue Lookup
 * Search for venues and get their addresses
 * Combines local preferred_venues database with Google Places API
 * If Google has a different address for the same venue name, prioritizes Google's version
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Normalize venue name for deduplication
 * Removes parenthetical info, extra spaces, common variations
 */
function normalizeVenueName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content like "(Memphis)"
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Normalize address for comparison
 */
function normalizeAddress(address) {
  if (!address) return '';
  return address
    .toLowerCase()
    .replace(/\./g, '') // Remove periods
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi, '') // Remove street type
    .replace(/[,]/g, '') // Remove commas
    .trim();
}

/**
 * Check if two venues are duplicates based on normalized name and address
 */
function areVenuesDuplicates(venue1, venue2) {
  const name1 = normalizeVenueName(venue1.name || venue1.venue_name);
  const name2 = normalizeVenueName(venue2.name || venue2.venue_name);
  
  // If normalized names match, they're duplicates
  if (name1 === name2 && name1.length > 0) {
    return true;
  }
  
  // Also check addresses if available
  const addr1 = normalizeAddress(venue1.address || '');
  const addr2 = normalizeAddress(venue2.address || '');
  
  // If addresses match and are substantial, they're duplicates
  if (addr1 === addr2 && addr1.length > 10) {
    // But only if one name contains the other (to avoid false positives)
    const longName = name1.length > name2.length ? name1 : name2;
    const shortName = name1.length > name2.length ? name2 : name1;
    if (shortName.length > 0 && longName.includes(shortName)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Search local preferred_venues database first
 */
async function searchLocalVenues(query, limit = 5) {
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
      .limit(limit * 2); // Get more to allow for deduplication

    if (nameError) {
      console.error('Error searching venues by name:', nameError);
    }

    // Search by address (case-insensitive, partial match)
    const { data: addressMatches, error: addressError } = await supabase
      .from('preferred_venues')
      .select('venue_name, address, city, state, zip_code, venue_type, website, description')
      .or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .limit(limit * 2); // Get more to allow for deduplication

    if (addressError) {
      console.error('Error searching venues by address:', addressError);
    }

    // Combine results and remove duplicates using improved deduplication
    const allMatches = [...(nameMatches || []), ...(addressMatches || [])];
    const uniqueMatches = [];

    allMatches.forEach(venue => {
      // Check if this venue is a duplicate of any already added
      const isDuplicate = uniqueMatches.some(existing => 
        areVenuesDuplicates(existing, venue)
      );
      
      if (!isDuplicate) {
        uniqueMatches.push(venue);
      }
    });

    // Convert to format matching Google Places API response
    const results = uniqueMatches
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  try {
    // FIRST: Search local preferred_venues database (prioritize local venues)
    const localResults = await searchLocalVenues(query, 5);
    
    // If we have enough local results, return them immediately
    if (localResults.length >= 5) {
      return res.status(200).json({
        success: true,
        results: localResults,
        source: 'local'
      });
    }

    // If we have some local results but not enough, still fetch from Google
    // and combine them (local venues will be prioritized)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    let googleResults = [];

    if (apiKey) {
      try {
        // Detect if query looks like an address (contains numbers and street indicators)
        const looksLikeAddress = /\d/.test(query) && (
          /street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|way|circle|cir/i.test(query) ||
          /memphis|tn|tennessee/i.test(query)
        );
        
        // Use Places API Text Search
        // If it looks like an address, search directly; otherwise search for venue name in Memphis
        const searchQuery = looksLikeAddress ? query : `${query} Memphis TN`;
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.append('query', searchQuery);
        url.searchParams.append('key', apiKey);
        
        // Only restrict to establishments if it doesn't look like an address
        // This allows finding venues even when searching by address
        if (!looksLikeAddress) {
          url.searchParams.append('type', 'establishment');
        }
        
        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          // Format Google results
          googleResults = data.results.slice(0, 5).map(place => ({
            name: place.name,
            address: place.formatted_address,
            place_id: place.place_id,
            types: place.types,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            source: 'google'
          }));
        }
      } catch (googleError) {
        console.warn('Google Places API error (continuing with local results):', googleError);
      }
    }

    // Combine local and Google results
    // If Google has a different address for the same venue name, prioritize Google's version
    const combinedResults = [];
    const googleByNormalizedName = new Map();
    const processedGoogleNames = new Set(); // Track which Google venues have been processed
    
    // Index Google results by normalized name for quick lookup
    googleResults.forEach(venue => {
      const normalizedName = normalizeVenueName(venue.name);
      if (!googleByNormalizedName.has(normalizedName)) {
        googleByNormalizedName.set(normalizedName, []);
      }
      googleByNormalizedName.get(normalizedName).push(venue);
    });
    
    // Process local results - check if Google has a better version
    localResults.forEach(localVenue => {
      const normalizedName = normalizeVenueName(localVenue.name);
      const googleMatches = googleByNormalizedName.get(normalizedName) || [];
      
      if (googleMatches.length > 0) {
        // Google has a match for this venue name
        const googleVenue = googleMatches[0]; // Take first Google match
        const localAddr = normalizeAddress(localVenue.address);
        const googleAddr = normalizeAddress(googleVenue.address);
        
        // If addresses differ, prioritize Google's version (more up-to-date)
        if (localAddr !== googleAddr && googleAddr.length > 10) {
          // Use Google's version, don't add local version
          combinedResults.push(googleVenue);
          processedGoogleNames.add(normalizedName); // Mark as processed
        } else {
          // Addresses match or are similar, use local version (has our metadata)
          combinedResults.push(localVenue);
          processedGoogleNames.add(normalizedName); // Mark as processed
        }
      } else {
        // No Google match, use local version
        combinedResults.push(localVenue);
      }
    });
    
    // Add remaining Google results that don't match any local venue
    googleResults.forEach(venue => {
      const normalizedName = normalizeVenueName(venue.name);
      
      // Only add if it hasn't been processed (not matched to a local venue)
      if (!processedGoogleNames.has(normalizedName)) {
        // Check if it's a duplicate of any result already added
        const isDuplicate = combinedResults.some(existing => 
          areVenuesDuplicates(existing, venue)
        );
        
        if (!isDuplicate && combinedResults.length < 5) {
          combinedResults.push(venue);
          processedGoogleNames.add(normalizedName); // Mark as processed
        }
      }
    });

    return res.status(200).json({
      success: true,
      results: combinedResults.slice(0, 5),
      source: localResults.length > 0 ? 'mixed' : (googleResults.length > 0 ? 'google' : 'none'),
      localCount: localResults.length,
      googleCount: googleResults.length
    });

  } catch (error) {
    console.error('❌ Venue lookup error:', error);
    res.status(500).json({
      success: false,
      results: [],
      error: 'Failed to search venues'
    });
  }
}

