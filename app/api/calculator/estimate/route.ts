import { NextRequest, NextResponse } from 'next/server';
import { calculateEstimate, CalculatorInputs } from '@/utils/pricingCalculator';
import { createClient } from '@/utils/supabase/server';

/**
 * POST /api/calculator/estimate
 * Calculate DJ cost estimate based on inputs
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculatorInputs = await request.json();
    
    // Validate required fields
    if (!body.eventType || !body.city || !body.durationHours) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, city, durationHours' },
        { status: 400 }
      );
    }
    
    // Validate duration
    if (body.durationHours < 1 || body.durationHours > 12) {
      return NextResponse.json(
        { error: 'Duration must be between 1 and 12 hours' },
        { status: 400 }
      );
    }
    
    // Calculate estimate
    const result = await calculateEstimate(body);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Insufficient pricing data for this city and event type' },
        { status: 404 }
      );
    }
    
    // Log calculator usage (optional, for analytics)
    try {
      const supabase = createClient();
      const userAgent = request.headers.get('user-agent') || null;
      const referrer = request.headers.get('referer') || null;
      
      // Type assertion needed because calculator_usage table may not be in generated types yet
      const { error: insertError } = await (supabase
        .from('calculator_usage' as any)
        .insert({
          city: body.city,
          state: body.state || null,
          event_type: body.eventType,
          duration_hours: body.durationHours,
          venue_type: body.venueType || null,
          guest_count_range: body.guestCountRange || null,
          needs_mc: body.needsMC || false,
          has_lighting: body.addOns?.lighting || false,
          has_ceremony_audio: body.addOns?.ceremonyAudio || false,
          extra_hours: body.addOns?.extraHours || 0,
          event_date: body.eventDate || null,
          estimated_low: result.estimatedLow,
          estimated_high: result.estimatedHigh,
          estimated_median: result.estimatedMedian,
          confidence: result.confidence,
          user_agent: userAgent,
          referrer: referrer,
          product_context: 'djdash'
        } as any));
      
      if (insertError) {
        // Silently fail if table doesn't exist yet or other error
        console.error('Error logging calculator usage:', insertError);
      }
    } catch (error) {
      // Don't fail the request if logging fails
      console.error('Error logging calculator usage:', error);
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating estimate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

