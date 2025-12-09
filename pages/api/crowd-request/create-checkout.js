// API endpoint to create Stripe checkout session for an existing crowd request
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Import Stripe Connect helpers (using dynamic import for TypeScript module)
let createCheckoutSessionWithPlatformFee, calculatePlatformFee;
(async () => {
  const connectModule = await import('@/utils/stripe/connect');
  createCheckoutSessionWithPlatformFee = connectModule.createCheckoutSessionWithPlatformFee;
  calculatePlatformFee = connectModule.calculatePlatformFee;
})();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, amount, preferredPaymentMethod } = req.body;

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

    // Get organization data (if available) - including Stripe Connect account
    let organization = null;
    if (crowdRequest.organization_id) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_fee_percentage, platform_fee_fixed')
        .eq('id', crowdRequest.organization_id)
        .single();
      organization = orgData;
    }

    // Calculate charity donation if enabled
    let charityDonationAmount = 0;
    let charityInfo = null;
    if (organization?.charity_donation_enabled && organization?.charity_donation_percentage > 0) {
      charityDonationAmount = Math.round(amount * (organization.charity_donation_percentage / 100));
      charityInfo = {
        name: organization.charity_name,
        url: organization.charity_url,
        percentage: organization.charity_donation_percentage,
        amount: charityDonationAmount
      };
    }

    // Build description
    const isFastTrackRequest = crowdRequest.is_fast_track;
    const isNextRequest = crowdRequest.is_next;
    const priorityLabel = isNextRequest ? ' 🎁 NEXT' : (isFastTrackRequest ? ' ⚡ FAST-TRACK' : '');
    const description = crowdRequest.request_type === 'song_request'
      ? `Song Request${priorityLabel}: ${crowdRequest.song_title}${crowdRequest.song_artist ? ` by ${crowdRequest.song_artist}` : ''}`
      : crowdRequest.request_type === 'shoutout'
      ? `Shoutout for ${crowdRequest.recipient_name}`
      : 'Tip';
    
    // Build comprehensive description for Stripe (appears in dashboard and receipts)
    const buildFullDescription = () => {
      if (crowdRequest.request_type === 'tip') {
        return 'Tip';
      } else if (crowdRequest.request_type === 'song_request') {
        const song = crowdRequest.song_title || 'Song Request';
        const artist = crowdRequest.song_artist || '';
        let desc = `Song Request: ${song}`;
        if (artist) {
          desc += ` by ${artist}`;
        }
        if (isNextRequest) {
          desc += ' (NEXT - Highest Priority)';
        } else if (isFastTrackRequest) {
          desc += ' (Fast-Track - Priority Placement)';
        }
        if (crowdRequest.is_custom_audio) {
          desc += ' [Custom Audio Upload]';
        }
        return desc;
      } else {
        const recipient = crowdRequest.recipient_name || 'Recipient';
        let desc = `Shoutout for ${recipient}`;
        if (crowdRequest.recipient_message) {
          const messagePreview = crowdRequest.recipient_message.substring(0, 100);
          desc += `: "${messagePreview}${crowdRequest.recipient_message.length > 100 ? '...' : ''}"`;
        }
        return desc;
      }
    };

    const fullDescription = buildFullDescription();
    
    // Build line items - separate base amount and priority fees for clarity
    const lineItems = [];
    const fastTrackFee = crowdRequest.fast_track_fee || 0;
    const nextFee = crowdRequest.next_fee || 0;
    const audioUploadFee = crowdRequest.audio_upload_fee || 0;
    const baseAmount = amount - fastTrackFee - nextFee - audioUploadFee;
    
    // Base request item with detailed description
    if (baseAmount > 0) {
      const baseDescription = crowdRequest.request_type === 'song_request'
        ? (crowdRequest.song_title 
            ? `${crowdRequest.song_title}${crowdRequest.song_artist ? ` by ${crowdRequest.song_artist}` : ''}`
            : 'Song Request')
        : crowdRequest.request_type === 'shoutout'
        ? `Shoutout for ${crowdRequest.recipient_name || 'Recipient'}`
        : 'Tip';
      
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: baseDescription,
            description: fullDescription, // Full description appears in Stripe dashboard
            metadata: {
              request_type: crowdRequest.request_type,
              ...(crowdRequest.request_type === 'song_request' && {
                song_title: crowdRequest.song_title || '',
                song_artist: crowdRequest.song_artist || '',
              }),
              ...(crowdRequest.request_type === 'shoutout' && {
                recipient_name: crowdRequest.recipient_name || '',
              }),
            },
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
    
    // Audio upload fee
    if (crowdRequest.is_custom_audio && audioUploadFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Custom Audio Upload',
            description: 'Upload your own audio file to be played',
          },
          unit_amount: audioUploadFee,
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

    // Determine payment method types based on preferred payment method
    let paymentMethodTypes = ['card', 'cashapp']; // Default: show both
    if (preferredPaymentMethod === 'cashapp') {
      // If Cash App Pay is preferred, show only Cash App Pay
      paymentMethodTypes = ['cashapp'];
    }
    
    // Check if organization has Stripe Connect account set up
    const hasConnectAccount = organization?.stripe_connect_account_id && 
                              organization?.stripe_connect_charges_enabled && 
                              organization?.stripe_connect_payouts_enabled;
    
    // PLATFORM OWNER BYPASS: M10 DJ Company can use platform account (existing behavior)
    // This ensures your business operations are never disrupted
    const isPlatformOwner = organization?.is_platform_owner || false;
    
    // For non-platform owners without Connect, require setup
    if (!isPlatformOwner && !hasConnectAccount) {
      return res.status(400).json({ 
        error: 'Please set up Stripe Connect to receive payments. Visit your dashboard to complete setup.',
        requires_connect: true 
      });
    }
    
    // Import Connect helpers (if needed)
    let createCheckoutSessionWithPlatformFee, calculatePlatformFee;
    if (hasConnectAccount) {
      const connectModule = await import('@/utils/stripe/connect');
      createCheckoutSessionWithPlatformFee = connectModule.createCheckoutSessionWithPlatformFee;
      calculatePlatformFee = connectModule.calculatePlatformFee;
    }
    
    // Calculate platform fee if using Connect
    let platformFeePercentage = organization?.platform_fee_percentage || 3.50;
    let platformFeeFixed = organization?.platform_fee_fixed || 0.30;
    let feeCalculation = null;
    
    if (hasConnectAccount) {
      feeCalculation = calculatePlatformFee(amount, platformFeePercentage, platformFeeFixed);
      console.log(`💰 Using Stripe Connect for organization ${organization.name}:`);
      console.log(`   Total: $${amount.toFixed(2)}`);
      console.log(`   Platform Fee: $${feeCalculation.feeAmount.toFixed(2)} (${platformFeePercentage}% + $${platformFeeFixed.toFixed(2)})`);
      console.log(`   DJ Payout: $${feeCalculation.payoutAmount.toFixed(2)}`);
    } else if (isPlatformOwner) {
      // Platform owner using platform account (expected behavior for M10 DJ Company)
      console.log(`💰 Platform owner ${organization.name} using platform account (expected)`);
    }
    
    // Create checkout session - use Connect if available, otherwise regular checkout
    let session;
    
    if (hasConnectAccount) {
      // Use Stripe Connect to route payment to DJ's account with platform fee
      session = await createCheckoutSessionWithPlatformFee(
        Math.round(amount * 100), // Convert to cents
        organization.stripe_connect_account_id,
        `${baseUrl}/crowd-request/success?session_id={CHECKOUT_SESSION_ID}&request_id=${crowdRequest.id}`,
        cancelUrl,
        {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          event_code: crowdRequest.event_qr_code,
          organization_id: organization.id,
          organization_name: organization.name,
          is_fast_track: isFastTrackRequest ? 'true' : 'false',
          is_next: isNextRequest ? 'true' : 'false',
          ...(crowdRequest.request_type === 'song_request' && {
            song_title: crowdRequest.song_title || '',
            song_artist: crowdRequest.song_artist || '',
          }),
          ...(crowdRequest.request_type === 'shoutout' && {
            recipient_name: crowdRequest.recipient_name || '',
          }),
          ...(charityInfo && {
            charity_donation_enabled: 'true',
            charity_name: charityInfo.name || '',
            charity_donation_percentage: charityInfo.percentage.toString(),
            charity_donation_amount: charityInfo.amount.toString(),
          }),
        },
        platformFeePercentage,
        platformFeeFixed
      );
      
      // Update session with additional payment method types and customer info
      // Note: createCheckoutSessionWithPlatformFee creates the base session,
      // but we may need to update it for payment method types
      // For now, the function handles the core Connect routing
      
    } else {
      // Fallback to regular checkout (payment goes to platform account)
      // This is for organizations without Connect set up yet
      console.log(`⚠️ Organization ${organization?.name || 'Unknown'} does not have Stripe Connect set up. Payment will go to platform account.`);
      
      session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes, // Card includes Apple Pay automatically on supported devices
      // Cash App Pay requires enabling in Stripe dashboard: Settings > Payment methods > Cash App Pay
      line_items: lineItems.length > 0 ? lineItems : [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: fullDescription.substring(0, 100), // Product name (max 100 chars)
              description: fullDescription, // Full description appears in Stripe dashboard
              metadata: {
                request_type: crowdRequest.request_type,
                ...(crowdRequest.request_type === 'song_request' && {
                  song_title: crowdRequest.song_title || '',
                  song_artist: crowdRequest.song_artist || '',
                }),
                ...(crowdRequest.request_type === 'shoutout' && {
                  recipient_name: crowdRequest.recipient_name || '',
                }),
                ...(crowdRequest.request_type === 'tip' && {
                  tip: 'true',
                }),
              },
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
        // Add song info to metadata for easy viewing in Stripe dashboard
        ...(crowdRequest.request_type === 'song_request' && {
          song_title: crowdRequest.song_title || '',
          song_artist: crowdRequest.song_artist || '',
          song_full: fullDescription, // Full song description in metadata
        }),
        ...(crowdRequest.request_type === 'shoutout' && {
          recipient_name: crowdRequest.recipient_name || '',
          shoutout_full: fullDescription, // Full shoutout description in metadata
        }),
        ...(crowdRequest.request_type === 'tip' && {
          tip: 'true',
          tip_full: fullDescription, // Full tip description in metadata
        }),
        // Add charity donation info if applicable
        ...(charityInfo && {
          charity_donation_enabled: 'true',
          charity_name: charityInfo.name || '',
          charity_donation_percentage: charityInfo.percentage.toString(),
          charity_donation_amount: charityInfo.amount.toString(),
        }),
      },
      payment_intent_data: {
        // Description field - appears prominently in Stripe dashboard, receipts, and customer statements
        // This is the main description that shows up everywhere in Stripe (max 500 chars)
        description: fullDescription,
        metadata: {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          event_code: crowdRequest.event_qr_code,
          is_fast_track: isFastTrackRequest ? 'true' : 'false',
          is_next: isNextRequest ? 'true' : 'false',
          // Add song info to payment intent metadata for easy viewing in Stripe dashboard
          ...(crowdRequest.request_type === 'song_request' && {
            song_title: crowdRequest.song_title || '',
            song_artist: crowdRequest.song_artist || '',
            song_full: fullDescription, // Full song description in metadata
          }),
          ...(crowdRequest.request_type === 'shoutout' && {
            recipient_name: crowdRequest.recipient_name || '',
            shoutout_full: fullDescription, // Full shoutout description in metadata
          }),
          ...(crowdRequest.request_type === 'tip' && {
            tip: 'true',
            tip_full: fullDescription, // Full tip description in metadata
          }),
        },
        // Description field - appears prominently in Stripe dashboard, receipts, and customer statements
        // This is the main description that shows up everywhere in Stripe (max 500 chars)
        description: fullDescription,
        // Statement descriptor for Cash App Pay and card statements (max 22 characters)
        // This shows in Cash App transactions and on customer credit card statements
        statement_descriptor: (() => {
          if (crowdRequest.request_type === 'song_request') {
            const song = crowdRequest.song_title || 'Song';
            const artist = crowdRequest.song_artist || '';
            // Format: "Song - Artist" (truncate to 22 chars)
            if (artist) {
              const combined = `${song} - ${artist}`;
              return combined.length > 22 ? combined.substring(0, 22) : combined;
            }
            return song.length > 22 ? song.substring(0, 22) : song;
          } else {
            // Shoutout format
            const recipient = crowdRequest.recipient_name || '';
            const shoutout = recipient ? `Shoutout - ${recipient}` : 'Shoutout';
            return shoutout.length > 22 ? shoutout.substring(0, 22) : shoutout;
          }
        })(),
      },
      });
    }

    // Update crowd request with Stripe session ID
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({
        stripe_session_id: session.id,
        payment_method: 'card',
        updated_at: new Date().toISOString(),
      })
      .eq('id', crowdRequest.id);

    if (updateError) {
      console.error('❌ Error updating request with session ID:', updateError);
      // Don't fail the request - session was created, webhook will handle it
    }

    console.log(`✅ Created Stripe checkout session ${session.id} for request ${crowdRequest.id}`);
    console.log(`   Payment will be processed automatically via webhook when completed`);

    return res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      requestId: crowdRequest.id,
    });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}

