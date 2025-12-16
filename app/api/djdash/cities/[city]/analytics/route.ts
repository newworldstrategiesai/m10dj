import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { city: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Get city page
    const { data: cityPage, error: cityError } = await supabase
      .from('city_pages')
      .select('id, city_name, city_slug')
      .eq('city_slug', params.city)
      .eq('is_published', true)
      .eq('product_context', 'djdash')
      .single();

    if (cityError || !cityPage) {
      return NextResponse.json(
        { error: 'City page not found' },
        { status: 404 }
      );
    }

    // Build query for analytics
    let query = supabase
      .from('city_analytics')
      .select('*')
      .eq('city_page_id', cityPage.id);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: analytics, error: analyticsError } = await query
      .order('date', { ascending: false });

    if (analyticsError) {
      throw analyticsError;
    }

    // Calculate aggregates
    const totals = analytics?.reduce(
      (acc, day) => ({
        page_views: acc.page_views + (day.page_views || 0),
        unique_visitors: acc.unique_visitors + (day.unique_visitors || 0),
        leads_generated: acc.leads_generated + (day.leads_generated || 0),
        inquiry_submissions: acc.inquiry_submissions + (day.inquiry_submissions || 0),
        booking_requests: acc.booking_requests + (day.booking_requests || 0),
        tipjar_clicks: acc.tipjar_clicks + (day.tipjar_clicks || 0),
        tipjar_revenue: acc.tipjar_revenue + (parseFloat(day.tipjar_revenue?.toString() || '0')),
      }),
      {
        page_views: 0,
        unique_visitors: 0,
        leads_generated: 0,
        inquiry_submissions: 0,
        booking_requests: 0,
        tipjar_clicks: 0,
        tipjar_revenue: 0,
      }
    ) || {
      page_views: 0,
      unique_visitors: 0,
      leads_generated: 0,
      inquiry_submissions: 0,
      booking_requests: 0,
      tipjar_clicks: 0,
      tipjar_revenue: 0,
    };

    // Calculate conversion rates
    const conversionRates = {
      inquiry_to_booking: totals.inquiry_submissions > 0
        ? (totals.booking_requests / totals.inquiry_submissions) * 100
        : 0,
      lead_to_inquiry: totals.leads_generated > 0
        ? (totals.inquiry_submissions / totals.leads_generated) * 100
        : 0,
    };

    return NextResponse.json({
      city: cityPage,
      analytics: analytics || [],
      totals,
      conversionRates,
      period: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  } catch (error: any) {
    console.error('Error fetching city analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { city: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { metric, value, date } = body;

    // Get city page
    const { data: cityPage, error: cityError } = await supabase
      .from('city_pages')
      .select('id')
      .eq('city_slug', params.city)
      .eq('product_context', 'djdash')
      .single();

    if (cityError || !cityPage) {
      return NextResponse.json(
        { error: 'City page not found' },
        { status: 404 }
      );
    }

    const analyticsDate = date || new Date().toISOString().split('T')[0];

    // Upsert analytics record
    const { data: existing } = await supabase
      .from('city_analytics')
      .select('*')
      .eq('city_page_id', cityPage.id)
      .eq('date', analyticsDate)
      .single();

    const updateData: any = {
      city_page_id: cityPage.id,
      date: analyticsDate,
      [metric]: value,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('city_analytics')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('city_analytics')
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    console.error('Error updating city analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update analytics' },
      { status: 500 }
    );
  }
}

