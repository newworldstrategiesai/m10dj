// Simple script to populate the preferred_venues table with Memphis area venues
// Run with: node scripts/populate-venues.js
// Or execute this in your browser console on the admin venues page

const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);

const venues = [
  {
    venue_name: "The Peabody Hotel",
    venue_type: "hotel",
    address: "149 Union Ave",
    city: "Memphis",
    state: "TN",
    zip_code: "38103",
    website: "https://www.peabodymemphis.com",
    description: "Iconic luxury hotel dubbed \"The South's Grand Hotel,\" offering historic charm, opulent ballrooms, and its famous resident ducks.",
    capacity_min: 50,
    capacity_max: 400,
    amenities: ["parking", "elegant decor", "accommodations", "catering available"],
    is_featured: true,
    is_active: true
  },
  {
    venue_name: "Memphis Botanic Garden",
    venue_type: "outdoor",
    address: "750 Cherry Rd",
    city: "Memphis",
    state: "TN",
    zip_code: "38117", 
    website: "https://membg.org",
    description: "96-acre garden oasis with indoor and outdoor venues amid specialty gardens and arboretum vistas. A haven for nature-loving couples seeking romantic natural backdrops.",
    capacity_min: 50,
    capacity_max: 300,
    amenities: ["outdoor space", "garden", "scenic views", "parking"],
    is_featured: true,
    is_active: true
  },
  {
    venue_name: "Dixon Gallery & Gardens",
    venue_type: "historic",
    address: "4339 Park Ave",
    city: "Memphis",
    state: "TN",
    zip_code: "38117",
    website: "https://www.dixon.org",
    description: "Art museum and garden venue offering an artful ambiance with blooming gardens. Ideal for intimate weddings that blend artistic elegance with natural beauty.",
    capacity_min: 30,
    capacity_max: 150,
    amenities: ["art collection", "garden", "historic architecture", "parking"],
    is_featured: false,
    is_active: true
  },
  {
    venue_name: "Graceland's Chapel in the Woods",
    venue_type: "outdoor",
    address: "3734 Elvis Presley Blvd",
    city: "Memphis",
    state: "TN",
    zip_code: "38116",
    website: "https://www.graceland.com/chapel-in-the-woods",
    description: "Quaint white chapel in a serene forest on Elvis Presley's Graceland estate. An intimate, charming site for couples seeking a private, music-inspired ceremony in the woods.",
    capacity_min: 20,
    capacity_max: 80,
    amenities: ["chapel", "outdoor space", "historic significance", "parking"],
    is_featured: true,
    is_active: true
  },
  {
    venue_name: "The Guest House at Graceland",
    venue_type: "hotel",
    address: "3600 Elvis Presley Blvd",
    city: "Memphis",
    state: "TN",
    zip_code: "38116",
    website: "https://guesthousegraceland.com",
    description: "Four-Diamond resort hotel adjacent to Graceland, featuring elegant ballrooms and a private theater. Offers full-service wedding packages in an Elvis-inspired luxury setting.",
    capacity_min: 100,
    capacity_max: 350,
    amenities: ["ballroom", "accommodations", "catering available", "elegant decor", "parking"],
    is_featured: true,
    is_active: true
  }
  // Add more venues here - keeping it simple for now with just 5 key venues
];

async function populateVenues() {
  try {
    console.log('Starting venue population...');
    
    // Insert venues
    const { data, error } = await supabase
      .from('preferred_venues')
      .insert(venues)
      .select();

    if (error) {
      console.error('Error inserting venues:', error);
      return;
    }

    console.log(`Successfully inserted ${data.length} venues:`);
    data.forEach(venue => {
      console.log(`- ${venue.venue_name} (${venue.city}, ${venue.state})`);
    });

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Run the function if this is called directly
if (require.main === module) {
  populateVenues();
}

module.exports = { populateVenues, venues };