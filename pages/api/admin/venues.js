import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const venues = req.body.venues;

    if (!Array.isArray(venues)) {
      return res.status(400).json({ error: 'Venues must be provided as an array' });
    }

    // Function to determine venue type from description
    const determineVenueType = (description, venueName) => {
      const desc = description.toLowerCase();
      const name = venueName.toLowerCase();
      
      if (desc.includes('hotel') || name.includes('hotel')) return 'hotel';
      if (desc.includes('museum') || desc.includes('gallery') || desc.includes('art')) return 'historic';
      if (desc.includes('mansion') || desc.includes('historic') || desc.includes('victorian') || desc.includes('1800s') || desc.includes('1900s')) return 'historic';
      if (desc.includes('garden') || desc.includes('outdoor') || desc.includes('acres') || desc.includes('farm') || desc.includes('chapel in the woods')) return 'outdoor';
      if (desc.includes('ballroom') || desc.includes('banquet')) return 'banquet_hall';
      if (desc.includes('country club') || desc.includes('club')) return 'country_club';
      if (desc.includes('distillery') || desc.includes('restaurant')) return 'restaurant';
      if (desc.includes('zoo') || desc.includes('venue')) return 'wedding';
      return 'wedding'; // Default to wedding venue
    };

    // Function to determine capacity from description
    const determineCapacity = (description) => {
      const capacityMatch = description.match(/(\d+)\s+guests?/i);
      if (capacityMatch) {
        const capacity = parseInt(capacityMatch[1]);
        return {
          capacity_min: Math.max(50, Math.floor(capacity * 0.5)), // Assume minimum is 50% of max
          capacity_max: capacity
        };
      }
      
      // Default capacities based on venue type indicators
      if (description.toLowerCase().includes('intimate')) {
        return { capacity_min: 20, capacity_max: 100 };
      }
      if (description.toLowerCase().includes('grand') || description.toLowerCase().includes('large')) {
        return { capacity_min: 100, capacity_max: 400 };
      }
      
      // Default medium capacity
      return { capacity_min: 50, capacity_max: 250 };
    };

    // Function to extract amenities from description
    const extractAmenities = (description) => {
      const amenities = [];
      const desc = description.toLowerCase();
      
      if (desc.includes('parking')) amenities.push('parking');
      if (desc.includes('garden') || desc.includes('outdoor')) amenities.push('outdoor space');
      if (desc.includes('ballroom')) amenities.push('ballroom');
      if (desc.includes('catering') || desc.includes('restaurant')) amenities.push('catering available');
      if (desc.includes('hotel') || desc.includes('accommodation')) amenities.push('accommodations');
      if (desc.includes('chapel') || desc.includes('ceremony')) amenities.push('ceremony space');
      if (desc.includes('historic') || desc.includes('mansion')) amenities.push('historic architecture');
      if (desc.includes('art') || desc.includes('museum')) amenities.push('art collection');
      if (desc.includes('view') || desc.includes('vista')) amenities.push('scenic views');
      if (desc.includes('pool')) amenities.push('pool');
      if (desc.includes('barn')) amenities.push('rustic barn');
      if (desc.includes('chandeliers') || desc.includes('elegant')) amenities.push('elegant decor');
      
      return amenities;
    };

    // Function to generate URL slug from venue name
    const generateSlug = (venueName) => {
      return venueName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    };

    // Process and insert venues
    const processedVenues = venues.map(venue => {
      const capacity = determineCapacity(venue.description);
      const venueType = determineVenueType(venue.description, venue.venue_name);
      const amenities = extractAmenities(venue.description);
      const slug = generateSlug(venue.venue_name);
      
      return {
        venue_name: venue.venue_name,
        venue_type: venueType,
        website: venue.website || null,
        address: `${venue.city}, ${venue.state}`, // Basic address format
        city: venue.city,
        state: venue.state,
        description: venue.description,
        capacity_min: capacity.capacity_min,
        capacity_max: capacity.capacity_max,
        amenities: amenities,
        pricing_notes: null,
        is_featured: false,
        is_active: true
        // Note: slug will be generated dynamically from venue_name in the frontend
      };
    });

    // Insert venues in batches
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < processedVenues.length; i += batchSize) {
      const batch = processedVenues.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('preferred_venues')
        .insert(batch)
        .select();

      if (error) {
        console.error('Error inserting venue batch:', error);
        return res.status(500).json({ 
          error: 'Failed to insert venues', 
          details: error.message,
          failedAt: i 
        });
      }
      
      results.push(...data);
    }

    return res.status(200).json({ 
      success: true, 
      message: `Successfully inserted ${results.length} venues`,
      venues: results
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}