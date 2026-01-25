import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { AffiliatePayoutService } from '@/utils/affiliate/payout-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, stripeAccountId } = body;

    const payoutService = new AffiliatePayoutService(supabase);

    // Get user's affiliate account
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Affiliate account not found' }, { status: 404 });
    }

    const affiliateData = affiliate as any;

    if (action === 'create_account') {
      // Create Stripe Connect account
      const accountId = await payoutService.createStripeAccount(
        affiliateData.id,
        user.email!,
        'US' // Default to US, could be made configurable
      );

      // Create onboarding link
      const onboardingUrl = await payoutService.createAccountLink(
        accountId,
        `${process.env.NEXT_PUBLIC_SITE_URL}/tipjar/affiliate`,
        `${process.env.NEXT_PUBLIC_SITE_URL}/tipjar/affiliate`
      );

      return NextResponse.json({
        success: true,
        accountId,
        onboardingUrl
      });

    } else if (action === 'get_account_status') {
      // Get account status
      const accountInfo = await payoutService.getStripeAccount(affiliateData.id);

      return NextResponse.json({
        success: true,
        accountInfo
      });

    } else if (action === 'request_payout') {
      // Manual payout request
      const pendingBalance = affiliateData.pending_balance || 0;
      const payoutThreshold = affiliateData.payout_threshold || 25.00;
      
      if (pendingBalance < payoutThreshold) {
        return NextResponse.json({
          error: `Minimum payout amount is $${payoutThreshold}. You have $${pendingBalance.toFixed(2)} available.`
        }, { status: 400 });
      }

      // Get pending commissions
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('id, amount')
        .eq('affiliate_id', affiliateData.id)
        .eq('status', 'approved')
        .is('payout_date', null);

      if (!commissions || commissions.length === 0) {
        return NextResponse.json({ error: 'No pending commissions to payout' }, { status: 400 });
      }

      // Check Stripe account
      const accountInfo = await payoutService.getStripeAccount(affiliateData.id);
      if (!accountInfo?.payouts_enabled) {
        return NextResponse.json({
          error: 'Stripe account not set up for payouts. Please complete onboarding first.'
        }, { status: 400 });
      }

      // Process payout
      const result = await payoutService.processPayout({
        affiliateId: affiliateData.id,
        amount: pendingBalance,
        commissions: commissions
      });

      return NextResponse.json({
        success: true,
        message: `Payout of $${pendingBalance.toFixed(2)} processed successfully`,
        transferId: result.transferId,
        payoutId: result.payoutId
      });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in affiliate payouts API:', error);
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

    const payoutService = new AffiliatePayoutService(supabase);

    // Get user's affiliate account
    const { data: affiliate, error: affiliateError } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (affiliateError || !affiliate) {
      return NextResponse.json({ error: 'Affiliate account not found' }, { status: 404 });
    }

    const affiliateData = affiliate as any;

    // Get payout history
    const { data: payouts } = await supabase
      .from('affiliate_commissions')
      .select(`
        *,
        affiliate_payout_batches (*)
      `)
      .eq('affiliate_id', affiliateData.id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(50);

    // Get account status
    const accountInfo = await payoutService.getStripeAccount(affiliateData.id);
    return NextResponse.json({
      success: true,
      affiliate: {
        id: affiliateData.id,
        stripe_account_status: affiliateData.stripe_account_status || null,
        pending_balance: affiliateData.pending_balance || 0,
        payout_threshold: affiliateData.payout_threshold || 25.00
      },
      accountInfo,
      payoutHistory: payouts || []
    });

  } catch (error) {
    console.error('Error getting affiliate payouts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}