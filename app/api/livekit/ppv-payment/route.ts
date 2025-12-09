import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as any,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stream_id, room_name, amount_cents, return_url } = body;

    if (!stream_id || !amount_cents || amount_cents <= 0) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Get stream info
    const { data: stream } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', stream_id)
      .single();

    if (!stream || !stream.is_live) {
      return NextResponse.json(
        { error: 'Stream not found or not live' },
        { status: 404 }
      );
    }

    // Generate unique PPV token
    const ppvToken = uuidv4();

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Access to ${stream.title || stream.username}'s Live Stream`,
              description: 'One-time access to this live stream',
            },
            unit_amount: amount_cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${return_url}?token=${ppvToken}`,
      cancel_url: return_url || process.env.NEXT_PUBLIC_SITE_URL,
      metadata: {
        stream_id,
        room_name,
        ppv_token: ppvToken,
        type: 'ppv_stream',
      },
    });

    // Store PPV token (will be validated on payment success via webhook)
    await supabase.from('ppv_tokens').insert({
      stream_id,
      token: ppvToken,
      amount_cents,
      used: false,
    });

    return NextResponse.json({
      sessionId: session.id,
      token: ppvToken, // For testing - in production, only return after payment
    });
  } catch (error) {
    console.error('Error creating PPV payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

