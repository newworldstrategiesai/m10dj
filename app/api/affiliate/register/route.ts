import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AffiliateService } from '@/utils/affiliate/affiliate-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      bio,
      payoutThreshold = 25.00,
      payoutFrequency = 'monthly',
      autoPayout = true
    } = body;

    const affiliateService = new AffiliateService(supabase);

    // Check if user already has an affiliate account
    const { data: existingAffiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingAffiliate) {
      return NextResponse.json({
        error: 'User already has an affiliate account',
        affiliate: existingAffiliate
      }, { status: 400 });
    }

    // Create affiliate account
    const affiliate = await affiliateService.getOrCreateAffiliate(user.id);

    // Update with additional settings
    await affiliateService.updateAffiliateSettings(affiliate.id, {
      display_name: displayName,
      bio,
      payout_threshold: payoutThreshold,
      payout_frequency: payoutFrequency as 'weekly' | 'monthly' | 'quarterly',
      auto_payout: autoPayout
    });

    // Get updated affiliate data
    const dashboardData = await affiliateService.getAffiliateDashboard(affiliate.id);

    return NextResponse.json({
      success: true,
      affiliate: dashboardData.affiliate,
      referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live'}/ref/${affiliate.affiliate_code}`,
      stats: dashboardData.stats
    });

  } catch (error) {
    console.error('Error registering affiliate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const affiliateService = new AffiliateService(supabase);

    // Get or create affiliate account
    const affiliate = await affiliateService.getOrCreateAffiliate(user.id);

    const dashboardData = await affiliateService.getAffiliateDashboard(affiliate.id);

    return NextResponse.json({
      success: true,
      affiliate: dashboardData.affiliate,
      referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live'}/ref/${affiliate.affiliate_code}`,
      stats: dashboardData.stats,
      recentReferrals: dashboardData.recentReferrals,
      recentCommissions: dashboardData.recentCommissions
    });

  } catch (error) {
    console.error('Error getting affiliate data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}