import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { streamer_user_id, amount, name, message, return_url } = body;

    if (!streamer_user_id || !amount || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get streamer's Stripe Connect account
    const { data: streamer } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', streamer_user_id)
      .single();

    if (!streamer) {
      return NextResponse.json(
        { error: 'Streamer not found' },
        { status: 404 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip to ${streamer.full_name || 'Streamer'}`,
              description: message || 'Thank you for the tip!',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${return_url || process.env.NEXT_PUBLIC_SITE_URL}/live?tip=success`,
      cancel_url: return_url || process.env.NEXT_PUBLIC_SITE_URL,
      metadata: {
        streamer_user_id,
        tipper_name: name || 'Anonymous',
        tip_message: message || '',
        type: 'live_stream_tip',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating tip session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

