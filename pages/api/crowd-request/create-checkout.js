// API endpoint to create Stripe checkout session for an existing crowd request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, amount } = req.body;

  if (!requestId || !amount) {
    return res.status(400).json({ error: 'Request ID and amount are required' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the crowd request
    const { data: crowdRequest, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !crowdRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Build description
    const isFastTrackRequest = crowdRequest.is_fast_track;
    const isNextRequest = crowdRequest.is_next;
    const priorityLabel = isNextRequest ? ' 🎁 NEXT' : (isFastTrackRequest ? ' ⚡ FAST-TRACK' : '');
    const description = crowdRequest.request_type === 'song_request'
      ? `Song Request${priorityLabel}: ${crowdRequest.song_title}${crowdRequest.song_artist ? ` by ${crowdRequest.song_artist}` : ''}`
      : `Shoutout for ${crowdRequest.recipient_name}`;
    
    // Build line items - separate base amount and priority fees for clarity
    const lineItems = [];
    const fastTrackFee = crowdRequest.fast_track_fee || 0;
    const nextFee = crowdRequest.next_fee || 0;
    const baseAmount = amount - fastTrackFee - nextFee;
    
    // Base request item
    if (baseAmount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: description.replace(' 🎁 NEXT', '').replace(' ⚡ FAST-TRACK', ''),
            description: `Crowd Request - ${crowdRequest.request_type === 'song_request' ? 'Song Request' : 'Shoutout'}`,
          },
          unit_amount: baseAmount,
        },
        quantity: 1,
      });
    }
    
    // Next fee (highest priority)
    if (isNextRequest && nextFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Next Fee',
            description: 'Highest priority - Your song will be played next!',
          },
          unit_amount: nextFee,
        },
        quantity: 1,
      });
    }
    
    // Fast-track fee (priority placement)
    if (isFastTrackRequest && fastTrackFee > 0 && !isNextRequest) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Fast-Track Fee',
            description: 'Priority placement - Your song will be played soon!',
          },
          unit_amount: fastTrackFee,
        },
        quantity: 1,
      });
    }

    // Determine cancel URL based on whether it's a general request or event-specific
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    const isGeneralRequest = crowdRequest.event_qr_code && crowdRequest.event_qr_code.startsWith('general');
    const cancelUrl = isGeneralRequest 
      ? `${baseUrl}/requests`
      : `${baseUrl}/crowd-request/${crowdRequest.event_qr_code}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // Card includes Apple Pay automatically on supported devices
      // Cash App Pay can be added if enabled in Stripe dashboard: 'cashapp'
      line_items: lineItems.length > 0 ? lineItems : [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
              description: `Crowd Request - ${crowdRequest.request_type === 'song_request' ? 'Song Request' : 'Shoutout'}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/crowd-request/success?session_id={CHECKOUT_SESSION_ID}&request_id=${crowdRequest.id}`,
      cancel_url: cancelUrl,
      customer_email: crowdRequest.requester_email || undefined,
      // Collect customer information during checkout
      billing_address_collection: 'auto', // Collect billing address (includes name)
      phone_number_collection: {
        enabled: true, // Collect phone number during checkout
      },
      metadata: {
        request_id: crowdRequest.id,
        request_type: crowdRequest.request_type,
        event_code: crowdRequest.event_qr_code,
        is_fast_track: isFastTrackRequest ? 'true' : 'false',
        is_next: isNextRequest ? 'true' : 'false',
      },
      payment_intent_data: {
        metadata: {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          event_code: crowdRequest.event_qr_code,
          is_fast_track: isFastTrackRequest ? 'true' : 'false',
          is_next: isNextRequest ? 'true' : 'false',
        },
      },
    });

    // Update crowd request with Stripe session ID
    await supabase
      .from('crowd_requests')
      .update({
        stripe_session_id: session.id,
        payment_method: 'card',
      })
      .eq('id', crowdRequest.id);

    console.log(`✅ Created Stripe checkout session for request ${crowdRequest.id}`);

    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

