import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCityContent } from '@/utils/ai/city-content-generator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/admin/cities/generate-content
 * 
 * Admin endpoint to generate AI content for a city page
 * 
 * Body: {
 *   cityName: string;
 *   state: string;
 *   stateAbbr: string;
 *   citySlug?: string;
 *   metroArea?: string;
 *   djCount?: number;
 *   eventTypes?: string[];
 *   popularVenues?: string[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getAdminUser(request);
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const body = await request.json();
    const {
      cityName,
      state,
      stateAbbr,
      citySlug,
      metroArea,
      djCount: providedDjCount,
      eventTypes: providedEventTypes,
      popularVenues: providedPopularVenues,
    } = body;

    if (!cityName || !state || !stateAbbr) {
      return NextResponse.json(
        { error: 'Missing required fields: cityName, state, stateAbbr' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch DJ data for the city
    const { data: djs } = await supabase
      .from('dj_profiles')
      .select(`
        id,
        dj_name,
        city,
        state,
        event_types,
        organizations!inner(product_context)
      `)
      .or(`city.ilike.%${cityName}%,primary_city.ilike.%${cityName}%`)
      .eq('is_published', true)
      .eq('organizations.product_context', 'djdash');

    const actualDjCount = providedDjCount || djs?.length || 0;
    const eventTypes = providedEventTypes || 
      Array.from(new Set(djs?.flatMap(dj => dj.event_types || []) || []));

    // Fetch popular venues
    const { data: venues } = await supabase
      .from('contacts')
      .select('venue_name')
      .ilike('city', `%${cityName}%`)
      .not('venue_name', 'is', null)
      .limit(20);

    const popularVenues = providedPopularVenues || 
      Array.from(new Set(venues?.map(v => v.venue_name).filter(Boolean) || []))
        .slice(0, 10);

    // Generate AI content
    const aiContent = await generateCityContent({
      cityName,
      state,
      stateAbbr,
      djCount: actualDjCount,
      eventTypes,
      popularVenues,
    });

    // Generate city slug if not provided
    const finalCitySlug = citySlug || 
      `${cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${stateAbbr.toLowerCase()}`;

    // Get featured DJ IDs
    const featuredDjIds = djs?.slice(0, 6).map(dj => dj.id) || [];

    // Calculate aggregate stats
    const { data: reviews } = await supabase
      .from('dj_reviews')
      .select('rating, dj_profiles!inner(id, city, organizations!inner(product_context))')
      .eq('is_approved', true)
      .eq('is_verified', true)
      .eq('dj_profiles.organizations.product_context', 'djdash')
      .or(`dj_profiles.city.ilike.%${cityName}%,dj_profiles.primary_city.ilike.%${cityName}%`);

    const totalReviews = reviews?.length || 0;
    const avgRating = reviews?.length 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
      : null;

    // Build city page data
    const cityPageData = {
      city_slug: finalCitySlug,
      city_name: cityName,
      state: state,
      state_abbr: stateAbbr,
      metro_area: metroArea || null,
      meta_title: `Best DJs in ${cityName} – Book Local DJs | DJ Dash`,
      meta_description: `Discover top-rated DJs in ${cityName}, ${state}. Verified reviews, availability, pricing, and online booking. ${actualDjCount}+ professional DJs available.`,
      hero_title: `Best DJs in ${cityName}`,
      hero_subtitle: `Find professional DJs in ${cityName} for weddings, corporate events, parties, and more. ${actualDjCount}+ verified DJs with ${totalReviews}+ reviews.`,
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
      total_djs: actualDjCount,
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
      .eq('city_slug', finalCitySlug)
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
      result = { ...data, action: 'updated' };
    } else {
      // Create new
      const { data, error } = await supabase
        .from('city_pages')
        .insert(cityPageData)
        .select()
        .single();

      if (error) throw error;
      result = { ...data, action: 'created' };
    }

    return NextResponse.json({
      success: true,
      cityPage: result,
      stats: {
        djs: actualDjCount,
        reviews: totalReviews,
        avgRating,
        guides: aiContent.guides.length,
        tips: aiContent.tips.length,
        faqs: aiContent.faqs.length,
      },
      url: `/djdash/cities/${finalCitySlug}`,
    });

  } catch (error: any) {
    console.error('Error generating city content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate city content' },
      { status: 500 }
    );
  }
}

