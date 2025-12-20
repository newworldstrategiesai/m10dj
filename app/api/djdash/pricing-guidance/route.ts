import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPricingGuidance } from '@/utils/pricingEngine';

/**
 * GET /api/djdash/pricing-guidance?city=Memphis&event_type=wedding&state=TN&dj_profile_id=xxx
 * 
 * Legal-safe pricing guidance endpoint for DJs
 * 
 * Returns anonymized market data with suggested ranges and required disclaimers.
 * Free tier DJs get minimal data, Pro/Elite get full quartiles.
 * 
 * Legal Compliance:
 * - All data is anonymized (no individual DJ pricing exposed)
 * - Clear disclaimers that pricing is informational only
 * - No enforcement or requirement to follow suggestions
 * - Ranges only, never exact competitor rates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const eventType = searchParams.get('event_type');
    const state = searchParams.get('state') || undefined;
    const djProfileId = searchParams.get('dj_profile_id') || undefined;
    
    // Required parameters
    if (!city || !eventType) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: ['city', 'event_type'],
          optional: ['state', 'dj_profile_id']
        },
        { status: 400 }
      );
    }
    
    // If DJ profile ID provided, verify ownership and get current pricing
    let djCurrentPrice: number | undefined;
    
    if (djProfileId) {
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required when providing dj_profile_id' },
          { status: 401 }
        );
      }
      
      // Verify DJ owns this profile
      const { data: profile } = await supabase
        .from('dj_profiles')
        .select('id, price_range_min, price_range_max, organization_id, organizations!inner(owner_id)')
        .eq('id', djProfileId)
        .single();
      
      const profileWithOrg = profile as any;
      if (!profile || !profileWithOrg.organizations || profileWithOrg.organizations.owner_id !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - you do not own this DJ profile' },
          { status: 403 }
        );
      }
      
      // Calculate current price (median of range)
      const typedProfile = profile as any;
      if (typedProfile.price_range_min) {
        djCurrentPrice = typedProfile.price_range_min + 
          ((typedProfile.price_range_max || typedProfile.price_range_min) - typedProfile.price_range_min) / 2;
      }
    }
    
    // Get pricing guidance
    const guidance = await getPricingGuidance(
      city,
      eventType,
      state,
      djProfileId,
      djCurrentPrice
    );
    
    if (!guidance) {
      return NextResponse.json(
        { 
          error: 'No pricing guidance available',
          message: 'Insufficient market data for this city and event type. Data requires at least 10 anonymized bookings.'
        },
        { status: 404 }
      );
    }
    
    // Check subscription tier for data access level
    // Free tier gets minimal data, Pro/Elite get full quartiles
    let subscriptionTier: 'free' | 'pro' | 'elite' = 'free';
    
    if (user) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, prices!inner(metadata)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (subscription) {
        const metadata = (subscription as any).prices?.metadata || {};
        const tier = metadata.tier || metadata.plan_tier;
        if (tier === 'pro' || tier === 'elite') {
          subscriptionTier = tier;
        }
      }
    }
    
    // Filter response based on subscription tier
    if (subscriptionTier === 'free') {
      // Free tier: minimal data only (market range, no quartiles)
      return NextResponse.json({
        city: guidance.city,
        state: guidance.state,
        event_type: guidance.event_type,
        market_range: {
          formatted: guidance.market_range.formatted
        },
        suggested_range: guidance.suggested_range,
        sample_size: guidance.sample_size,
        data_quality: guidance.data_quality,
        disclaimer: guidance.disclaimer,
        data_source_note: guidance.data_source_note,
        upgrade_message: 'Upgrade to Pro or Elite to see detailed quartiles, market positioning, and personalized insights.',
        subscription_tier: 'free'
      });
    }
    
    // Pro/Elite: Full data access
    return NextResponse.json({
      ...guidance,
      subscription_tier: subscriptionTier
    });
    
  } catch (error) {
    console.error('Error fetching pricing guidance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

