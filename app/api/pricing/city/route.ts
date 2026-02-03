import { NextRequest, NextResponse } from 'next/server';
import { getCityPricing, getCityPricingRange } from '@/utils/pricingEngine';

export const dynamic = 'force-dynamic';

/**
 * GET /api/pricing/city?city=Memphis&event_type=wedding&state=TN
 * Returns pricing statistics for a city and event type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const eventType = searchParams.get('event_type') || undefined;
    const state = searchParams.get('state') || undefined;
    
    if (!city) {
      return NextResponse.json(
        { error: 'City parameter is required' },
        { status: 400 }
      );
    }
    
    if (eventType) {
      const range = await getCityPricingRange(city, eventType, state);
      if (!range) {
        return NextResponse.json(
          { error: 'No pricing data available for this city and event type' },
          { status: 404 }
        );
      }
      return NextResponse.json(range);
    }
    
    const stats = await getCityPricing(city, eventType, state);
    if (!stats) {
      return NextResponse.json(
        { error: 'No pricing data available for this city' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching city pricing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

