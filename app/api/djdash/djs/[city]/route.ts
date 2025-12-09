import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/djdash/djs/[city]
 * Get available DJs for a city
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { city: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const state = searchParams.get('state');
    const city = decodeURIComponent(params.city);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
      .from('dj_network_profiles')
      .select('*')
      .eq('is_active', true)
      .eq('accepts_leads', true);

    // Filter by city
    if (city) {
      query = query.contains('service_cities', [city]);
    }

    // Filter by state
    if (state) {
      query = query.contains('service_states', [state]);
    }

    // Filter by event type
    if (eventType && eventType !== 'all') {
      const standardizedEventType = eventType.toLowerCase().replace(' ', '_');
      query = query.or(
        `event_types.cs.{${standardizedEventType}},lead_types_accepted.cs.{all},lead_types_accepted.cs.{${standardizedEventType}}`
      );
    }

    // Filter by active subscription
    query = query.or(
      `subscription_expires_at.is.null,subscription_expires_at.gt.${new Date().toISOString()}`
    );

    // Order by featured, verified, rating
    query = query.order('is_featured', { ascending: false });
    query = query.order('is_verified', { ascending: false });
    query = query.order('average_rating', { ascending: false });

    const { data: djs, error } = await query;

    if (error) {
      console.error('Error fetching DJs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch DJs' },
        { status: 500 }
      );
    }

    // Format response (exclude sensitive data)
    const publicDJs = (djs || []).map((dj) => ({
      id: dj.id,
      business_name: dj.business_name,
      dj_name: dj.dj_name,
      bio: dj.bio,
      years_experience: dj.years_experience,
      service_cities: dj.service_cities,
      service_states: dj.service_states,
      event_types: dj.event_types,
      specialties: dj.specialties,
      starting_price: dj.starting_price,
      price_range: dj.price_range,
      website_url: dj.website_url,
      social_media: dj.social_media,
      portfolio_images: dj.portfolio_images,
      video_urls: dj.video_urls,
      testimonials: dj.testimonials,
      average_rating: dj.average_rating,
      total_reviews: dj.total_reviews,
      total_events_completed: dj.total_events_completed,
      is_featured: dj.is_featured,
      is_verified: dj.is_verified,
    }));

    return NextResponse.json({
      city,
      state,
      eventType,
      count: publicDJs.length,
      djs: publicDJs,
    });
  } catch (error) {
    console.error('Error in GET /api/djdash/djs/[city]:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

