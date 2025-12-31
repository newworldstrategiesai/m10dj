/**
 * Generate AI-powered content for city + event type pages
 * Creates SEO-rich pages optimized for LLM search engines
 * 
 * Usage:
 *   npx tsx scripts/generate-city-event-pages.ts --city memphis-tn --event-type corporate
 *   npx tsx scripts/generate-city-event-pages.ts --batch (generates all combinations)
 */

import { createClient } from '@supabase/supabase-js';
import { generateCityEventContent } from '../utils/ai/city-event-content-generator';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables manually
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Event types configuration
const EVENT_TYPES = [
  { type: 'wedding', display: 'Wedding DJs', slug: 'wedding' },
  { type: 'corporate', display: 'Corporate Event DJs', slug: 'corporate' },
  { type: 'birthday', display: 'Birthday Party DJs', slug: 'birthday' },
  { type: 'school_dance', display: 'School Dance DJs', slug: 'school-dance' },
  { type: 'holiday_party', display: 'Holiday Party DJs', slug: 'holiday-party' },
  { type: 'private_party', display: 'Private Party DJs', slug: 'private-party' },
];

// Get cities from database or use fallback list
async function getCities() {
  const { data: cityPages } = await supabase
    .from('city_pages')
    .select('city_slug, city_name, state_name, state_abbr, dj_count')
    .eq('is_published', true)
    .eq('product_context', 'djdash');

  if (cityPages && cityPages.length > 0) {
    return cityPages.map(cp => ({
      slug: cp.city_slug,
      name: cp.city_name,
      state: cp.state_name,
      stateAbbr: cp.state_abbr,
      djCount: cp.dj_count || 0
    }));
  }

  // Fallback to common cities
  return [
    { slug: 'memphis-tn', name: 'Memphis', state: 'Tennessee', stateAbbr: 'TN', djCount: 80 },
    { slug: 'nashville-tn', name: 'Nashville', state: 'Tennessee', stateAbbr: 'TN', djCount: 120 },
    { slug: 'atlanta-ga', name: 'Atlanta', state: 'Georgia', stateAbbr: 'GA', djCount: 100 },
    { slug: 'new-york-ny', name: 'New York', state: 'New York', stateAbbr: 'NY', djCount: 350 },
    { slug: 'los-angeles-ca', name: 'Los Angeles', state: 'California', stateAbbr: 'CA', djCount: 300 },
    { slug: 'chicago-il', name: 'Chicago', state: 'Illinois', stateAbbr: 'IL', djCount: 250 },
    { slug: 'houston-tx', name: 'Houston', state: 'Texas', stateAbbr: 'TX', djCount: 200 },
    { slug: 'dallas-tx', name: 'Dallas', state: 'Texas', stateAbbr: 'TX', djCount: 200 },
  ];
}

async function generateCityEventPage(city: any, eventType: any) {
  console.log(`\n📝 Generating content for ${city.name} - ${eventType.display}...`);

  try {
    // Check if page already exists
    const { data: existing } = await supabase
      .from('city_event_pages')
      .select('id, content_version')
      .eq('city_slug', city.slug)
      .eq('event_type_slug', eventType.slug)
      .eq('product_context', 'djdash')
      .single();

    // Fetch DJ count for this city and event type
    const { count: djCount } = await supabase
      .from('dj_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .contains('event_types', [eventType.type])
      .or(`city.ilike.%${city.name}%,primary_city.ilike.%${city.name}%`);

    // Fetch popular venues (if available)
    const { data: venues } = await supabase
      .from('city_venue_spotlights')
      .select('venue_name')
      .eq('city_slug', city.slug)
      .eq('is_published', true)
      .limit(5);

    const popularVenues = venues?.map(v => v.venue_name) || [];

    // Generate AI content
    console.log(`  🤖 Generating AI content...`);
    const content = await generateCityEventContent({
      cityName: city.name,
      state: city.state,
      stateAbbr: city.stateAbbr,
      eventType: eventType.type,
      eventTypeDisplay: eventType.display,
      djCount: djCount || city.djCount || 0,
      popularVenues,
    });

    console.log(`  ✅ AI content generated successfully`);

    // Prepare data for database
    const pageData = {
      city_slug: city.slug,
      event_type_slug: eventType.slug,
      full_slug: `${city.slug}/${eventType.slug}`,
      city_name: city.name,
      state_name: city.state,
      state_abbr: city.stateAbbr,
      event_type: eventType.type,
      event_type_display: eventType.display,
      seo_title: content.seoTitle,
      seo_description: content.seoDescription,
      seo_keywords: content.seoKeywords,
      meta_og_title: content.metaOgTitle,
      meta_og_description: content.metaOgDescription,
      hero_title: content.heroTitle,
      hero_subtitle: content.heroSubtitle,
      hero_description: content.heroDescription,
      introduction_text: content.introductionText,
      why_choose_section: content.whyChooseSection,
      pricing_section: content.pricingSection,
      venue_section: content.venueSection,
      timeline_section: content.timelineSection,
      comprehensive_guide: content.comprehensiveGuide,
      local_insights: content.localInsights,
      seasonal_trends: content.seasonalTrends,
      popular_songs: content.popularSongs,
      venue_recommendations: content.venueRecommendations,
      faqs: content.faqs,
      structured_data: content.structuredData,
      dj_count: djCount || city.djCount || 0,
      average_rating: null, // Can be calculated from reviews
      review_count: 0, // Can be calculated from reviews
      average_price_range: null, // Can be calculated from DJ profiles
      content_generated_at: new Date().toISOString(),
      content_updated_at: new Date().toISOString(),
      content_version: existing ? (existing.content_version || 1) + 1 : 1,
      ai_model_used: 'gpt-4-turbo-preview',
      is_published: true,
      product_context: 'djdash',
    };

    // Check if page exists first
    const { data: existingPage, error: checkError } = await supabase
      .from('city_event_pages')
      .select('id')
      .eq('city_slug', city.slug)
      .eq('event_type_slug', eventType.slug)
      .eq('product_context', 'djdash')
      .maybeSingle();

    if (checkError) {
      console.error(`  ❌ Error checking existing page:`, checkError);
    }

    let data, error;
    if (existingPage) {
      // Update existing
      console.log(`  📝 Updating existing page...`);
      const result = await supabase
        .from('city_event_pages')
        .update(pageData)
        .eq('id', existingPage.id)
        .select();
      data = result.data?.[0];
      error = result.error;
    } else {
      // Insert new
      console.log(`  ➕ Inserting new page...`);
      const result = await supabase
        .from('city_event_pages')
        .insert(pageData)
        .select();
      data = result.data?.[0];
      error = result.error;
    }

    if (error) {
      console.error(`  ❌ Error saving page:`, error);
      console.error(`  ❌ Error code:`, error.code);
      console.error(`  ❌ Error message:`, error.message);
      console.error(`  ❌ Error details:`, error.details);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from database operation');
    }

    console.log(`  ✅ Page saved: ${data.id}`);
    return { success: true, pageId: data.id };

  } catch (error: any) {
    console.error(`  ❌ Error generating page:`, error.message);
    return { success: false, error: error.message };
  }
}

async function generateBatch() {
  console.log('🚀 Starting batch generation of city + event type pages...\n');

  const cities = await getCities();
  console.log(`📊 Found ${cities.length} cities`);
  console.log(`📊 Generating ${EVENT_TYPES.length} event types per city`);
  console.log(`📊 Total pages to generate: ${cities.length * EVENT_TYPES.length}\n`);

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  let processed = 0;
  const total = cities.length * EVENT_TYPES.length;

  for (const city of cities) {
    for (const eventType of EVENT_TYPES) {
      processed++;
      console.log(`\n[${processed}/${total}] Processing: ${city.name} - ${eventType.display}`);

      const result = await generateCityEventPage(city, eventType);

      if (result.success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push(`${city.name} - ${eventType.display}: ${result.error}`);
      }

      // Rate limiting: wait 2 seconds between requests to avoid API limits
      if (processed < total) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully generated: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total processed: ${processed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  console.log('\n✨ Batch generation complete!');
}

async function generateSingle(citySlug: string, eventTypeSlug: string) {
  console.log(`🚀 Generating single page: ${citySlug} - ${eventTypeSlug}\n`);

  const cities = await getCities();
  const city = cities.find(c => c.slug === citySlug);

  if (!city) {
    console.error(`❌ City not found: ${citySlug}`);
    process.exit(1);
  }

  const eventType = EVENT_TYPES.find(et => et.slug === eventTypeSlug);

  if (!eventType) {
    console.error(`❌ Event type not found: ${eventTypeSlug}`);
    console.error(`Available event types: ${EVENT_TYPES.map(et => et.slug).join(', ')}`);
    process.exit(1);
  }

  const result = await generateCityEventPage(city, eventType);

  if (result.success) {
    console.log(`\n✅ Successfully generated page!`);
    process.exit(0);
  } else {
    console.error(`\n❌ Failed to generate page: ${result.error}`);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const batchMode = args.includes('--batch');
const cityArg = args.find(arg => arg.startsWith('--city='))?.split('=')[1];
const eventTypeArg = args.find(arg => arg.startsWith('--event-type='))?.split('=')[1];

if (batchMode) {
  generateBatch().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else if (cityArg && eventTypeArg) {
  generateSingle(cityArg, eventTypeArg).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  console.log('Usage:');
  console.log('  Single page: npx tsx scripts/generate-city-event-pages.ts --city=memphis-tn --event-type=corporate');
  console.log('  Batch mode:  npx tsx scripts/generate-city-event-pages.ts --batch');
  console.log('\nAvailable event types:', EVENT_TYPES.map(et => et.slug).join(', '));
  process.exit(1);
}

