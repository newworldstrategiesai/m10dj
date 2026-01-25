import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { CommissionCalculator } from '@/utils/affiliate/commission-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, eventType } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Only process successful payments
    if (eventType !== 'payment.succeeded' && eventType !== 'payment.captured') {
      return NextResponse.json({ success: true, message: 'Event type not processed' });
    }

    console.log(`Processing affiliate commission for payment ${paymentId}, event: ${eventType}`);

    const supabase = createClient();
    const calculator = new CommissionCalculator(supabase);

    // Process platform fee commission
    await calculator.processPlatformFeeCommission(paymentId);

    // Check if this is the first payment for a referral (triggers bonus)
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        contact_id,
        contacts (
          id,
          organizations (
            id,
            affiliate_attribution
          )
        )
      `)
      .eq('id', paymentId)
      .maybeSingle();

    if (!paymentError && payment) {
      const paymentData = payment as any;
      const referralId = paymentData?.contacts?.organizations?.affiliate_attribution?.referral_id;

      if (referralId) {
        // Check if this is the first payment for this referral
        const { data: existingPayments } = await supabase
          .from('payments')
          .select('id')
          .eq('contact_id', paymentData.contacts?.id)
          .eq('payment_status', 'Paid')
          .neq('id', paymentId)
          .limit(1);

        if (!existingPayments || existingPayments.length === 0) {
          // This is the first payment, update referral status and award bonus
          await (supabase
            .from('affiliate_referrals') as any)
            .update({
              conversion_status: 'first_payment',
              converted_at: new Date().toISOString()
            })
            .eq('id', referralId);

          await calculator.processReferralBonus(referralId);
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}