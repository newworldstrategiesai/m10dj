/**
 * Enriches venue information by searching the web for address context
 * @param {string} address - The address to search for
 * @returns {Promise<Object>} Enriched venue information
 */
export async function enrichVenueFromAddress(address) {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return null;
  }

  try {
    // Try to extract venue name from address patterns first
    let potentialVenueName = null;
    
    // Pattern 1: "Venue Name, Address" or "Venue Name - Address"
    const pattern1 = address.match(/^([^,]+?)(?:\s*,\s*|\s+-\s+)(.+)$/i);
    if (pattern1) {
      const firstPart = pattern1[1].trim();
      const secondPart = pattern1[2].trim();
      
      // If first part doesn't look like a street address (no numbers), it's likely the venue name
      if (!/^\d+\s/.test(firstPart) && firstPart.length > 3 && firstPart.length < 60) {
        potentialVenueName = firstPart;
      }
    }
    
    // Pattern 2: "Address (Venue Name)" or "Address - Venue Name"
    if (!potentialVenueName) {
      const pattern2 = address.match(/\(([^)]+)\)|-\s*([^-]+)$/i);
      if (pattern2) {
        const extracted = (pattern2[1] || pattern2[2]).trim();
        if (extracted.length > 3 && extracted.length < 60 && !/^\d+/.test(extracted)) {
          potentialVenueName = extracted;
        }
      }
    }
    
    // Pattern 3: Check if address starts with a known venue indicator
    const venueIndicators = ['the ', 'at ', 'venue:', 'location:'];
    const lowerAddress = address.toLowerCase();
    for (const indicator of venueIndicators) {
      if (lowerAddress.startsWith(indicator)) {
        const afterIndicator = address.substring(indicator.length).trim();
        const commaIndex = afterIndicator.indexOf(',');
        if (commaIndex > 0) {
          potentialVenueName = afterIndicator.substring(0, commaIndex).trim();
          break;
        }
      }
    }

    // If we found a potential venue name, return it
    if (potentialVenueName && potentialVenueName.length > 3 && potentialVenueName.length < 60) {
      return {
        venue_name: potentialVenueName,
        venue_address: address,
        enrichment_source: 'address_parsing',
        enrichment_notes: `Extracted venue name from address pattern`
      };
    }

    // If no pattern match, try web search via API endpoint
    // This will be called asynchronously to avoid blocking the form submission
    try {
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/venue-search?address=${encodeURIComponent(address)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.venue_name) {
          return {
            venue_name: searchData.venue_name,
            venue_address: address,
            enrichment_source: 'web_search',
            enrichment_notes: searchData.enrichment_notes || 'Found via web search'
          };
        }
      }
    } catch (searchError) {
      console.log('Web search not available or failed, using address only:', searchError.message);
    }

    // If no pattern match and web search didn't find anything, return address only
    return {
      venue_address: address,
      enrichment_source: 'address_only',
      enrichment_notes: `Address provided but no venue name could be extracted. Consider manual research.`
    };
  } catch (error) {
    console.error('Error enriching venue from address:', error);
    return {
      venue_address: address,
      enrichment_source: 'error',
      enrichment_notes: `Error during enrichment: ${error.message}`
    };
  }
}
