import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDJPricingInsight } from '@/utils/pricingEngine';

/**
 * GET /api/pricing/dj?dj_profile_id=xxx&city=Memphis&event_type=wedding
 * Returns pricing insights for a DJ comparing their rates to market
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const djProfileId = searchParams.get('dj_profile_id');
    const city = searchParams.get('city');
    const eventType = searchParams.get('event_type');
    
    if (!djProfileId || !city || !eventType) {
      return NextResponse.json(
        { error: 'dj_profile_id, city, and event_type parameters are required' },
        { status: 400 }
      );
    }
    
    // Verify DJ owns this profile
    const { data: profile } = await supabase
      .from('dj_profiles')
      .select('id, organization_id, organizations!inner(owner_id)')
      .eq('id', djProfileId)
      .single();
    
    const profileWithOrg = profile as any;
    if (!profile || !profileWithOrg.organizations || profileWithOrg.organizations.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - you do not own this DJ profile' },
        { status: 403 }
      );
    }
    
    const state = searchParams.get('state') || undefined;
    const insight = await getDJPricingInsight(djProfileId, city, eventType, state);
    
    if (!insight) {
      return NextResponse.json(
        { error: 'No pricing insight available' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(insight);
  } catch (error) {
    console.error('Error fetching DJ pricing insight:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

