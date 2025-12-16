/**
 * City Page Content Generator Script
 * 
 * This script generates unique AI content for city pages and saves them to the database.
 * 
 * Usage:
 *   npx tsx scripts/generate-city-page-content.ts <city-slug>
 *   npx tsx scripts/generate-city-page-content.ts memphis-tn
 * 
 * Or for batch processing:
 *   npx tsx scripts/generate-city-page-content.ts --batch
 */

import { createClient } from '@supabase/supabase-js';
import { generateCityContent } from '../utils/ai/city-content-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CityInput {
  cityName: string;
  state: string;
  stateAbbr: string;
  citySlug?: string;
  metroArea?: string;
  djCount?: number;
  eventTypes?: string[];
  popularVenues?: string[];
  featuredDjIds?: string[];
}

/**
 * Generate content for a single city
 */
async function generateCityPageContent(city: CityInput) {
  console.log(`\n🎯 Generating content for ${city.cityName}, ${city.state}...`);

  try {
    // Step 1: Fetch DJ data for the city
    console.log('📊 Fetching DJ data...');
    const { data: djs, error: djError } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        city,
        state,
        event_types,
        organizations!inner(product_context, slug)
      `)
      .or(`city.ilike.%${city.cityName}%,primary_city.ilike.%${city.cityName}%`)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash');

    if (djError) {
      console.error('❌ Error fetching DJs:', djError);
    }

    const djCount = djs?.length || 0;
    const eventTypes = city.eventTypes || 
      Array.from(new Set(djs?.flatMap(dj => dj.event_types || []) || []));

    // Step 2: Fetch popular venues from contacts/events
    console.log('🏛️  Fetching venue data...');
    const { data: venues, error: venueError } = await supabase
      .from('contacts')
      .select('venue_name')
      .ilike('city', `%${city.cityName}%`)
      .not('venue_name', 'is', null)
      .limit(20);

    const popularVenues = city.popularVenues || 
      Array.from(new Set(venues?.map(v => v.venue_name).filter(Boolean) || []))
        .slice(0, 10);

    // Step 3: Generate AI content
    console.log('🤖 Generating AI content...');
    const aiContent = await generateCityContent({
      cityName: city.cityName,
      state: city.state,
      stateAbbr: city.stateAbbr,
      djCount,
      eventTypes,
      popularVenues,
    });

    console.log('✅ AI content generated:');
    console.log(`   - ${aiContent.guides.length} guides`);
    console.log(`   - ${aiContent.tips.length} tips`);
    console.log(`   - ${aiContent.faqs.length} FAQs`);
    console.log(`   - ${aiContent.localInsights.length} local insights`);

    // Step 4: Generate city slug if not provided
    const citySlug = city.citySlug || 
      `${city.cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.stateAbbr.toLowerCase()}`;

    // Step 5: Get featured DJ IDs
    const featuredDjIds = city.featuredDjIds || 
      djs?.slice(0, 6).map(dj => dj.id) || [];

    // Step 6: Calculate aggregate stats
    const { data: reviews } = await supabase
      .from('dj_reviews')
      .select('rating, dj_profiles!inner(id, city, organizations!inner(product_context))')
      .eq('is_approved', true)
      .eq('is_verified', true)
      .eq('dj_profiles.organizations.product_context', 'djdash')
      .or(`dj_profiles.city.ilike.%${city.cityName}%,dj_profiles.primary_city.ilike.%${city.cityName}%`);

    const totalReviews = reviews?.length || 0;
    const avgRating = reviews?.length 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
      : null;

    // Step 7: Create or update city page
    console.log('💾 Saving to database...');
    
    const cityPageData = {
      city_slug: citySlug,
      city_name: city.cityName,
      state: city.state,
      state_abbr: city.stateAbbr,
      metro_area: city.metroArea || null,
      meta_title: `Best DJs in ${city.cityName} – Book Local DJs | DJ Dash`,
      meta_description: `Discover top-rated DJs in ${city.cityName}, ${city.state}. Verified reviews, availability, pricing, and online booking. ${djCount}+ professional DJs available.`,
      hero_title: `Best DJs in ${city.cityName}`,
      hero_subtitle: `Find professional DJs in ${city.cityName} for weddings, corporate events, parties, and more. ${djCount}+ verified DJs with ${totalReviews}+ reviews.`,
      ai_generated_content: aiContent,
      local_tips: aiContent.tips,
      featured_dj_ids: featuredDjIds,
      event_type_demand: eventTypes.reduce((acc: Record<string, { dj_count: number; demand_level: string }>, type: string) => {
        const typeDjs = djs?.filter(dj => dj.event_types?.includes(type)) || [];
        acc[type] = {
          dj_count: typeDjs.length,
          demand_level: typeDjs.length > 5 ? 'high' : typeDjs.length > 2 ? 'medium' : 'low',
        };
        return acc;
      }, {}),
      total_djs: djCount,
      total_reviews: totalReviews,
      avg_rating: avgRating ? Math.round(avgRating * 100) / 100 : null,
      is_published: true,
      product_context: 'djdash',
      last_ai_update: new Date().toISOString(),
    };

    // Check if city page exists
    const { data: existing } = await supabase
      .from('city_pages')
      .select('id')
      .eq('city_slug', citySlug)
      .eq('product_context', 'djdash')
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('city_pages')
        .update(cityPageData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`✅ Updated existing city page: ${city.cityName}`);
    } else {
      // Create new
      const { data, error } = await supabase
        .from('city_pages')
        .insert(cityPageData)
        .select()
        .single();

      if (error) throw error;
      result = data;
      console.log(`✅ Created new city page: ${city.cityName}`);
    }

    console.log(`\n🎉 Success! City page available at: /djdash/cities/${citySlug}`);
    return result;

  } catch (error: any) {
    console.error(`❌ Error generating content for ${city.cityName}:`, error.message);
    throw error;
  }
}

/**
 * Batch generate content for multiple cities
 */
async function batchGenerate(cities: CityInput[]) {
  console.log(`\n🚀 Starting batch generation for ${cities.length} cities...\n`);
  console.log(`⏱️  Estimated time: ~${Math.ceil(cities.length * 3 / 60)} minutes\n`);

  const results = [];
  let processed = 0;
  for (const city of cities) {
    processed++;
    console.log(`\n[${processed}/${cities.length}] Processing ${city.cityName}, ${city.stateAbbr}...`);
    try {
      const result = await generateCityPageContent(city);
      results.push({ city: city.cityName, status: 'success', data: result });
      
      // Rate limiting: wait 3 seconds between cities to avoid API limits
      // Increased delay for large batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error: any) {
      results.push({ city: city.cityName, status: 'error', error: error.message });
    }
  }

  console.log('\n📊 Batch Generation Summary:');
  console.log('============================');
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'error').length;
  console.log(`✅ Successful: ${successful}/${cities.length}`);
  console.log(`❌ Failed: ${failed}/${cities.length}`);
  console.log(`📈 Success Rate: ${((successful / cities.length) * 100).toFixed(1)}%`);

  if (successful > 0) {
    console.log('\n✅ Successfully Generated Cities:');
    results
      .filter(r => r.status === 'success')
      .slice(0, 10)
      .forEach(r => console.log(`   - ${r.city}`));
    if (successful > 10) {
      console.log(`   ... and ${successful - 10} more`);
    }
  }

  if (failed > 0) {
    console.log('\n❌ Failed Cities:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`   - ${r.city}: ${r.error}`));
  }

  console.log('\n🌐 View generated pages at: /djdash/cities/[city-slug]');
  console.log('💡 Tip: Run the script again for failed cities to retry');

  return results;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--batch' || args[0] === '--help') {
    // Batch mode or help
    if (args[0] === '--help') {
      console.log(`
City Page Content Generator

Usage:
  npx tsx scripts/generate-city-page-content.ts <city-slug>
  npx tsx scripts/generate-city-page-content.ts memphis-tn

  npx tsx scripts/generate-city-page-content.ts --batch

Examples:
  # Generate content for Memphis
  npx tsx scripts/generate-city-page-content.ts memphis-tn

  # Generate content for Nashville
  npx tsx scripts/generate-city-page-content.ts nashville-tn

Batch Mode:
  Edit the cities array in this script, then run:
  npx tsx scripts/generate-city-page-content.ts --batch
      `);
      process.exit(0);
    }

    // Batch cities - comprehensive list of major US cities
    const batchCities: CityInput[] = [
      // Top Tier - Major Markets
      { cityName: 'Memphis', state: 'Tennessee', stateAbbr: 'TN', metroArea: 'Memphis Metro' },
      { cityName: 'Nashville', state: 'Tennessee', stateAbbr: 'TN', metroArea: 'Nashville Metro' },
      { cityName: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', metroArea: 'Atlanta Metro' },
      { cityName: 'Los Angeles', state: 'California', stateAbbr: 'CA', metroArea: 'Los Angeles Metro' },
      { cityName: 'New York', state: 'New York', stateAbbr: 'NY', metroArea: 'New York Metro' },
      { cityName: 'Chicago', state: 'Illinois', stateAbbr: 'IL', metroArea: 'Chicago Metro' },
      { cityName: 'Houston', state: 'Texas', stateAbbr: 'TX', metroArea: 'Houston Metro' },
      { cityName: 'Phoenix', state: 'Arizona', stateAbbr: 'AZ', metroArea: 'Phoenix Metro' },
      { cityName: 'Philadelphia', state: 'Pennsylvania', stateAbbr: 'PA', metroArea: 'Philadelphia Metro' },
      { cityName: 'San Antonio', state: 'Texas', stateAbbr: 'TX', metroArea: 'San Antonio Metro' },
      { cityName: 'San Diego', state: 'California', stateAbbr: 'CA', metroArea: 'San Diego Metro' },
      { cityName: 'Dallas', state: 'Texas', stateAbbr: 'TX', metroArea: 'Dallas Metro' },
      { cityName: 'San Jose', state: 'California', stateAbbr: 'CA', metroArea: 'San Jose Metro' },
      { cityName: 'Austin', state: 'Texas', stateAbbr: 'TX', metroArea: 'Austin Metro' },
      { cityName: 'Jacksonville', state: 'Florida', stateAbbr: 'FL', metroArea: 'Jacksonville Metro' },
      { cityName: 'Fort Worth', state: 'Texas', stateAbbr: 'TX', metroArea: 'Dallas-Fort Worth Metro' },
      { cityName: 'Columbus', state: 'Ohio', stateAbbr: 'OH', metroArea: 'Columbus Metro' },
      { cityName: 'Charlotte', state: 'North Carolina', stateAbbr: 'NC', metroArea: 'Charlotte Metro' },
      { cityName: 'San Francisco', state: 'California', stateAbbr: 'CA', metroArea: 'San Francisco Metro' },
      { cityName: 'Indianapolis', state: 'Indiana', stateAbbr: 'IN', metroArea: 'Indianapolis Metro' },
      { cityName: 'Seattle', state: 'Washington', stateAbbr: 'WA', metroArea: 'Seattle Metro' },
      { cityName: 'Denver', state: 'Colorado', stateAbbr: 'CO', metroArea: 'Denver Metro' },
      { cityName: 'Washington', state: 'District of Columbia', stateAbbr: 'DC', metroArea: 'Washington Metro' },
      { cityName: 'Boston', state: 'Massachusetts', stateAbbr: 'MA', metroArea: 'Boston Metro' },
      { cityName: 'El Paso', state: 'Texas', stateAbbr: 'TX', metroArea: 'El Paso Metro' },
      { cityName: 'Detroit', state: 'Michigan', stateAbbr: 'MI', metroArea: 'Detroit Metro' },
      { cityName: 'Portland', state: 'Oregon', stateAbbr: 'OR', metroArea: 'Portland Metro' },
      { cityName: 'Oklahoma City', state: 'Oklahoma', stateAbbr: 'OK', metroArea: 'Oklahoma City Metro' },
      { cityName: 'Las Vegas', state: 'Nevada', stateAbbr: 'NV', metroArea: 'Las Vegas Metro' },
      { cityName: 'Louisville', state: 'Kentucky', stateAbbr: 'KY', metroArea: 'Louisville Metro' },
      { cityName: 'Baltimore', state: 'Maryland', stateAbbr: 'MD', metroArea: 'Baltimore Metro' },
      { cityName: 'Milwaukee', state: 'Wisconsin', stateAbbr: 'WI', metroArea: 'Milwaukee Metro' },
      { cityName: 'Albuquerque', state: 'New Mexico', stateAbbr: 'NM', metroArea: 'Albuquerque Metro' },
      { cityName: 'Tucson', state: 'Arizona', stateAbbr: 'AZ', metroArea: 'Tucson Metro' },
      { cityName: 'Fresno', state: 'California', stateAbbr: 'CA', metroArea: 'Fresno Metro' },
      { cityName: 'Sacramento', state: 'California', stateAbbr: 'CA', metroArea: 'Sacramento Metro' },
      { cityName: 'Kansas City', state: 'Missouri', stateAbbr: 'MO', metroArea: 'Kansas City Metro' },
      { cityName: 'Mesa', state: 'Arizona', stateAbbr: 'AZ', metroArea: 'Phoenix Metro' },
      { cityName: 'Omaha', state: 'Nebraska', stateAbbr: 'NE', metroArea: 'Omaha Metro' },
      { cityName: 'Colorado Springs', state: 'Colorado', stateAbbr: 'CO', metroArea: 'Colorado Springs Metro' },
      { cityName: 'Raleigh', state: 'North Carolina', stateAbbr: 'NC', metroArea: 'Raleigh Metro' },
      { cityName: 'Virginia Beach', state: 'Virginia', stateAbbr: 'VA', metroArea: 'Virginia Beach Metro' },
      { cityName: 'Miami', state: 'Florida', stateAbbr: 'FL', metroArea: 'Miami Metro' },
      { cityName: 'Oakland', state: 'California', stateAbbr: 'CA', metroArea: 'San Francisco Bay Area' },
      { cityName: 'Minneapolis', state: 'Minnesota', stateAbbr: 'MN', metroArea: 'Minneapolis Metro' },
      { cityName: 'Tulsa', state: 'Oklahoma', stateAbbr: 'OK', metroArea: 'Tulsa Metro' },
      { cityName: 'Cleveland', state: 'Ohio', stateAbbr: 'OH', metroArea: 'Cleveland Metro' },
      { cityName: 'Wichita', state: 'Kansas', stateAbbr: 'KS', metroArea: 'Wichita Metro' },
      { cityName: 'Arlington', state: 'Texas', stateAbbr: 'TX', metroArea: 'Dallas-Fort Worth Metro' },
      
      // Secondary Markets - High Event Volume
      { cityName: 'Tampa', state: 'Florida', stateAbbr: 'FL', metroArea: 'Tampa Bay Metro' },
      { cityName: 'Orlando', state: 'Florida', stateAbbr: 'FL', metroArea: 'Orlando Metro' },
      { cityName: 'St. Louis', state: 'Missouri', stateAbbr: 'MO', metroArea: 'St. Louis Metro' },
      { cityName: 'Pittsburgh', state: 'Pennsylvania', stateAbbr: 'PA', metroArea: 'Pittsburgh Metro' },
      { cityName: 'Cincinnati', state: 'Ohio', stateAbbr: 'OH', metroArea: 'Cincinnati Metro' },
      { cityName: 'Buffalo', state: 'New York', stateAbbr: 'NY', metroArea: 'Buffalo Metro' },
      { cityName: 'Riverside', state: 'California', stateAbbr: 'CA', metroArea: 'Riverside Metro' },
      { cityName: 'New Orleans', state: 'Louisiana', stateAbbr: 'LA', metroArea: 'New Orleans Metro' },
      { cityName: 'Honolulu', state: 'Hawaii', stateAbbr: 'HI', metroArea: 'Honolulu Metro' },
      { cityName: 'Salt Lake City', state: 'Utah', stateAbbr: 'UT', metroArea: 'Salt Lake City Metro' },
      { cityName: 'Richmond', state: 'Virginia', stateAbbr: 'VA', metroArea: 'Richmond Metro' },
      { cityName: 'Birmingham', state: 'Alabama', stateAbbr: 'AL', metroArea: 'Birmingham Metro' },
      { cityName: 'Norfolk', state: 'Virginia', stateAbbr: 'VA', metroArea: 'Norfolk Metro' },
      { cityName: 'Greensboro', state: 'North Carolina', stateAbbr: 'NC', metroArea: 'Greensboro Metro' },
      { cityName: 'Baton Rouge', state: 'Louisiana', stateAbbr: 'LA', metroArea: 'Baton Rouge Metro' },
      { cityName: 'Rochester', state: 'New York', stateAbbr: 'NY', metroArea: 'Rochester Metro' },
      { cityName: 'Grand Rapids', state: 'Michigan', stateAbbr: 'MI', metroArea: 'Grand Rapids Metro' },
      { cityName: 'Bridgeport', state: 'Connecticut', stateAbbr: 'CT', metroArea: 'Bridgeport Metro' },
      { cityName: 'Oxnard', state: 'California', stateAbbr: 'CA', metroArea: 'Oxnard Metro' },
      { cityName: 'Stockton', state: 'California', stateAbbr: 'CA', metroArea: 'Stockton Metro' },
      { cityName: 'Bakersfield', state: 'California', stateAbbr: 'CA', metroArea: 'Bakersfield Metro' },
      { cityName: 'Aurora', state: 'Colorado', stateAbbr: 'CO', metroArea: 'Denver Metro' },
      { cityName: 'Anaheim', state: 'California', stateAbbr: 'CA', metroArea: 'Los Angeles Metro' },
      { cityName: 'Santa Ana', state: 'California', stateAbbr: 'CA', metroArea: 'Los Angeles Metro' },
      { cityName: 'Corpus Christi', state: 'Texas', stateAbbr: 'TX', metroArea: 'Corpus Christi Metro' },
      { cityName: 'Lexington', state: 'Kentucky', stateAbbr: 'KY', metroArea: 'Lexington Metro' },
      { cityName: 'Henderson', state: 'Nevada', stateAbbr: 'NV', metroArea: 'Las Vegas Metro' },
      { cityName: 'St. Paul', state: 'Minnesota', stateAbbr: 'MN', metroArea: 'Minneapolis Metro' },
      { cityName: 'St. Petersburg', state: 'Florida', stateAbbr: 'FL', metroArea: 'Tampa Bay Metro' },
      { cityName: 'Chesapeake', state: 'Virginia', stateAbbr: 'VA', metroArea: 'Norfolk Metro' },
      { cityName: 'Laredo', state: 'Texas', stateAbbr: 'TX', metroArea: 'Laredo Metro' },
      { cityName: 'Chula Vista', state: 'California', stateAbbr: 'CA', metroArea: 'San Diego Metro' },
      { cityName: 'Garland', state: 'Texas', stateAbbr: 'TX', metroArea: 'Dallas Metro' },
      { cityName: 'Irvine', state: 'California', stateAbbr: 'CA', metroArea: 'Los Angeles Metro' },
      { cityName: 'Fremont', state: 'California', stateAbbr: 'CA', metroArea: 'San Francisco Bay Area' },
      { cityName: 'Boise', state: 'Idaho', stateAbbr: 'ID', metroArea: 'Boise Metro' },
      { cityName: 'Spokane', state: 'Washington', stateAbbr: 'WA', metroArea: 'Spokane Metro' },
      { cityName: 'Tacoma', state: 'Washington', stateAbbr: 'WA', metroArea: 'Seattle Metro' },
      { cityName: 'Fort Wayne', state: 'Indiana', stateAbbr: 'IN', metroArea: 'Fort Wayne Metro' },
      { cityName: 'Shreveport', state: 'Louisiana', stateAbbr: 'LA', metroArea: 'Shreveport Metro' },
      { cityName: 'Des Moines', state: 'Iowa', stateAbbr: 'IA', metroArea: 'Des Moines Metro' },
      { cityName: 'Little Rock', state: 'Arkansas', stateAbbr: 'AR', metroArea: 'Little Rock Metro' },
      { cityName: 'Mobile', state: 'Alabama', stateAbbr: 'AL', metroArea: 'Mobile Metro' },
      { cityName: 'Knoxville', state: 'Tennessee', stateAbbr: 'TN', metroArea: 'Knoxville Metro' },
      { cityName: 'Chattanooga', state: 'Tennessee', stateAbbr: 'TN', metroArea: 'Chattanooga Metro' },
      { cityName: 'Jackson', state: 'Mississippi', stateAbbr: 'MS', metroArea: 'Jackson Metro' },
    ];

    await batchGenerate(batchCities);
  } else {
    // Single city mode
    const citySlug = args[0];
    if (!citySlug) {
      console.error('❌ Please provide a city slug or use --batch mode');
      console.error('   Example: npx tsx scripts/generate-city-page-content.ts memphis-tn');
      process.exit(1);
    }

    // Parse city slug (e.g., "memphis-tn" -> "Memphis, TN")
    const parts = citySlug.split('-');
    if (parts.length < 2) {
      console.error('❌ Invalid city slug format. Expected: city-state (e.g., memphis-tn)');
      process.exit(1);
    }

    const stateAbbr = parts[parts.length - 1].toUpperCase();
    const cityNameParts = parts.slice(0, -1);
    const cityName = cityNameParts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // State name mapping
    const stateMap: Record<string, string> = {
      'TN': 'Tennessee',
      'GA': 'Georgia',
      'CA': 'California',
      'NY': 'New York',
      'IL': 'Illinois',
      'TX': 'Texas',
      'FL': 'Florida',
      'NC': 'North Carolina',
      'WA': 'Washington',
      'CO': 'Colorado',
      'MA': 'Massachusetts',
      'MI': 'Michigan',
      'OR': 'Oregon',
      'NV': 'Nevada',
      'MN': 'Minnesota',
      'AZ': 'Arizona',
      'PA': 'Pennsylvania',
      'MO': 'Missouri',
      'VA': 'Virginia',
      'OK': 'Oklahoma',
      'OH': 'Ohio',
      'KS': 'Kansas',
      'IN': 'Indiana',
      'KY': 'Kentucky',
      'MD': 'Maryland',
      'WI': 'Wisconsin',
      'NM': 'New Mexico',
      'NE': 'Nebraska',
      'DC': 'District of Columbia',
    };

    const state = stateMap[stateAbbr] || stateAbbr;

    await generateCityPageContent({
      cityName,
      state,
      stateAbbr,
      citySlug,
    });
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

