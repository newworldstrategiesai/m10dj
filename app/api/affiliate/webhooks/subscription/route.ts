import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CommissionCalculator } from '@/utils/affiliate/commission-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, eventType } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organization ID' }, { status: 400 });
    }

    console.log(`Processing affiliate commission for organization ${organizationId}, event: ${eventType}`);

    const supabase = createClient();
    const calculator = new CommissionCalculator(supabase);

    // Process subscription commission (subscriptions are tracked in organizations table)
    await calculator.processSubscriptionCommission(organizationId);

    // Check if this triggers a referral bonus
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('affiliate_attribution')
      .eq('id', organizationId)
      .maybeSingle();

    if (!orgError && organization) {
      const orgData = organization as any;
      const referralId = orgData?.affiliate_attribution?.referral_id;
      if (referralId) {
        await calculator.processReferralBonus(referralId);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing subscription webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}