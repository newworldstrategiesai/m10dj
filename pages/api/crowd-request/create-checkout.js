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
  console.log('🔵 [CREATE-CHECKOUT] Request received:', {
    method: req.method,
    body: req.body,
    headers: {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host
    }
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId, amount, preferredPaymentMethod } = req.body;

  if (!requestId || !amount) {
    console.error('❌ [CREATE-CHECKOUT] Missing required fields:', { requestId, amount });
    return res.status(400).json({ error: 'Request ID and amount are required' });
  }

  // Validate and normalize amount - ensure it's in cents (integer)
  // IMPORTANT: Frontend always sends amounts in cents (e.g., 500 for $5.00)
  // Do NOT convert - amounts are already in cents
  let amountInCents;
  if (typeof amount === 'string') {
    // If it's a string, parse it as a number (already in cents)
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) {
      console.error('❌ [CREATE-CHECKOUT] Invalid amount format (string):', amount);
      return res.status(400).json({ error: 'Invalid amount format' });
    }
    amountInCents = Math.round(parsed);
  } else if (typeof amount === 'number') {
    // Amount is already in cents from frontend
    amountInCents = Math.round(amount);
  } else {
    console.error('❌ [CREATE-CHECKOUT] Invalid amount type:', typeof amount, amount);
    return res.status(400).json({ error: 'Invalid amount type' });
  }

  // Ensure amount is at least 1 cent (Stripe minimum)
  if (amountInCents < 1) {
    console.error('❌ [CREATE-CHECKOUT] Amount too small:', amountInCents);
    return res.status(400).json({ error: 'Amount must be at least $0.01' });
  }

  console.log('✅ [CREATE-CHECKOUT] Amount validated:', {
    original: amount,
    normalized: amountInCents,
    in_dollars: `$${(amountInCents / 100).toFixed(2)}`
  });

  // Use normalized amount for rest of function
  const normalizedAmount = amountInCents;

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    console.log('🔵 [CREATE-CHECKOUT] Initializing Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the crowd request
    console.log('🔵 [CREATE-CHECKOUT] Fetching crowd request:', requestId);
    const { data: crowdRequest, error: requestError } = await supabase
      .from('crowd_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !crowdRequest) {
      console.error('❌ [CREATE-CHECKOUT] Request not found:', { requestError, requestId });
      return res.status(404).json({ error: 'Request not found', details: requestError?.message });
    }
    
    console.log('✅ [CREATE-CHECKOUT] Crowd request found:', {
      id: crowdRequest.id,
      type: crowdRequest.request_type,
      organization_id: crowdRequest.organization_id
    });

    // Fetch bundle songs if this is part of a bundle
    // Bundle songs share: same requester (email/phone), same payment_code, created within 5 seconds
    let bundleSongs = [];
    if (crowdRequest.request_type === 'song_request') {
      // Find all related requests (main + bundle songs) created within 5 seconds
      const timeWindow = 5000; // 5 seconds in milliseconds
      const requestTime = new Date(crowdRequest.created_at).getTime();
      const startTime = new Date(requestTime - timeWindow).toISOString();
      const endTime = new Date(requestTime + timeWindow).toISOString();
      
      // Build query to find related requests
      let query = supabase
        .from('crowd_requests')
        .select('song_title, song_artist, created_at, request_message, id')
        .eq('request_type', 'song_request')
        .gte('created_at', startTime)
        .lte('created_at', endTime);
      
      // Match by email or phone
      if (crowdRequest.requester_email) {
        query = query.eq('requester_email', crowdRequest.requester_email);
      } else if (crowdRequest.requester_phone) {
        query = query.eq('requester_phone', crowdRequest.requester_phone);
      }
      
      const { data: relatedRequests } = await query.order('created_at', { ascending: true }).limit(10);
      
      if (relatedRequests && relatedRequests.length > 0) {
        // Separate main request from bundle songs
        const mainRequest = relatedRequests.find(r => !r.request_message || !r.request_message.includes('Bundle deal'));
        const bundleRequests = relatedRequests.filter(r => r.request_message && r.request_message.includes('Bundle deal'));
        
        // Add main song first
        if (mainRequest && mainRequest.song_title) {
          bundleSongs.push({ 
            song_title: mainRequest.song_title, 
            song_artist: mainRequest.song_artist || null 
          });
        } else if (crowdRequest.song_title) {
          // Fallback to current request if no main found
          bundleSongs.push({ 
            song_title: crowdRequest.song_title, 
            song_artist: crowdRequest.song_artist || null 
          });
        }
        
        // Add bundle songs
        bundleRequests.forEach(r => {
          if (r.song_title) {
            bundleSongs.push({ 
              song_title: r.song_title, 
              song_artist: r.song_artist || null 
            });
          }
        });
      } else if (crowdRequest.song_title) {
        // No bundle found, just use main song
        bundleSongs.push({ 
          song_title: crowdRequest.song_title, 
          song_artist: crowdRequest.song_artist || null 
        });
      }
    }

    // Get organization data (if available) - including Stripe Connect account
    let organization = null;
    if (crowdRequest.organization_id) {
      console.log('🔵 [CREATE-CHECKOUT] Fetching organization:', crowdRequest.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*, stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_payouts_enabled, platform_fee_percentage, platform_fee_fixed, subscription_tier, subscription_status, is_platform_owner')
        .eq('id', crowdRequest.organization_id)
        .single();
      
      if (orgError) {
        console.error('❌ [CREATE-CHECKOUT] Error fetching organization:', orgError);
      } else {
        organization = orgData;
        console.log('✅ [CREATE-CHECKOUT] Organization found:', {
          id: organization.id,
          name: organization.name,
          hasConnectAccount: !!organization.stripe_connect_account_id,
          chargesEnabled: organization.stripe_connect_charges_enabled,
          payoutsEnabled: organization.stripe_connect_payouts_enabled
        });
      }
      
      // Allow all users to process payments regardless of subscription tier
    } else {
      console.log('⚠️ [CREATE-CHECKOUT] No organization_id on request');
    }

    // Calculate charity donation if enabled
    let charityDonationAmount = 0;
    let charityInfo = null;
    if (organization?.charity_donation_enabled && organization?.charity_donation_percentage > 0) {
      charityDonationAmount = Math.round(normalizedAmount * (organization.charity_donation_percentage / 100));
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
    
    // Build song list for description (include all bundle songs)
    let songDescription = '';
    if (crowdRequest.request_type === 'song_request') {
      if (bundleSongs.length > 1) {
        // Bundle: list all songs
        const songList = bundleSongs.map(s => {
          const artist = s.song_artist ? ` by ${s.song_artist}` : '';
          return `${s.song_title}${artist}`;
        }).join(', ');
        songDescription = `Bundle (${bundleSongs.length} songs)${priorityLabel}: ${songList}`;
      } else if (bundleSongs.length === 1) {
        // Single song from bundle list
        const s = bundleSongs[0];
        const artist = s.song_artist ? ` by ${s.song_artist}` : '';
        songDescription = `Song Request${priorityLabel}: ${s.song_title}${artist}`;
      } else {
        // Fallback to main request
        songDescription = `Song Request${priorityLabel}: ${crowdRequest.song_title}${crowdRequest.song_artist ? ` by ${crowdRequest.song_artist}` : ''}`;
      }
    }
    
    const description = crowdRequest.request_type === 'song_request'
      ? songDescription
      : crowdRequest.request_type === 'shoutout'
      ? `Shoutout for ${crowdRequest.recipient_name}`
      : 'Tip';
    
    // Build comprehensive description for Stripe (appears in dashboard and receipts)
    const buildFullDescription = () => {
      if (crowdRequest.request_type === 'tip') {
        return 'Tip';
      } else if (crowdRequest.request_type === 'song_request') {
        if (bundleSongs.length > 1) {
          // Bundle: list all songs
          const songList = bundleSongs.map(s => {
            const artist = s.song_artist ? ` by ${s.song_artist}` : '';
            return `${s.song_title}${artist}`;
          }).join('; ');
          let desc = `Bundle (${bundleSongs.length} songs): ${songList}`;
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
          // Single song
          const song = bundleSongs.length === 1 ? bundleSongs[0].song_title : (crowdRequest.song_title || 'Song Request');
          const artist = bundleSongs.length === 1 ? bundleSongs[0].song_artist : (crowdRequest.song_artist || '');
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
        }
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
    const baseAmount = Math.max(0, normalizedAmount - fastTrackFee - nextFee - audioUploadFee); // Ensure baseAmount is never negative
    
    // Base request item with detailed description
    // Ensure we always have a base line item if the total amount is valid
    if (baseAmount > 0 || amount > 0) {
      // Build base description with all bundle songs
      let baseDescription = '';
      if (crowdRequest.request_type === 'song_request') {
        if (bundleSongs.length > 1) {
          // Bundle: list all songs
          const songList = bundleSongs.map(s => {
            const artist = s.song_artist ? ` by ${s.song_artist}` : '';
            return `${s.song_title}${artist}`;
          }).join(', ');
          baseDescription = `Bundle (${bundleSongs.length} songs): ${songList}`;
        } else if (bundleSongs.length === 1) {
          // Single song
          const s = bundleSongs[0];
          baseDescription = s.song_title 
            ? `${s.song_title}${s.song_artist ? ` by ${s.song_artist}` : ''}`
            : 'Song Request';
        } else {
          // Fallback
          baseDescription = crowdRequest.song_title 
            ? `${crowdRequest.song_title}${crowdRequest.song_artist ? ` by ${crowdRequest.song_artist}` : ''}`
            : 'Song Request';
        }
      } else if (crowdRequest.request_type === 'shoutout') {
        baseDescription = `Shoutout for ${crowdRequest.recipient_name || 'Recipient'}`;
      } else {
        baseDescription = 'Tip';
      }
      
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
          unit_amount: Math.max(1, baseAmount), // Ensure unit_amount is at least 1 cent (Stripe minimum)
        },
        quantity: 1,
      });
    } else if (normalizedAmount > 0 && baseAmount <= 0) {
      // Edge case: If fees exceed base amount, create a single line item with the total amount
      // This can happen if someone adds fees that exceed the base amount (shouldn't happen in normal flow)
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: fullDescription.substring(0, 100) || 'Song Request / Shoutout',
            description: fullDescription,
          },
          unit_amount: Math.max(1, normalizedAmount), // Ensure unit_amount is at least 1 cent (Stripe minimum)
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

    // Determine base URL based on source_domain to keep user on same domain
    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
    if (crowdRequest.source_domain) {
      // If request came from tipjar.live, use tipjar.live for success page
      if (crowdRequest.source_domain === 'tipjar.live' || crowdRequest.source_domain === 'www.tipjar.live') {
        baseUrl = 'https://tipjar.live';
      } else if (crowdRequest.source_domain === 'm10djcompany.com' || crowdRequest.source_domain === 'www.m10djcompany.com') {
        baseUrl = 'https://www.m10djcompany.com';
      }
      // For other domains, use the source_domain to construct URL
      // Note: This assumes the domain is valid and uses HTTPS
      else if (!crowdRequest.source_domain.includes('localhost')) {
        baseUrl = `https://${crowdRequest.source_domain.replace(/^www\./, '')}`;
      }
    }
    
    // Determine cancel URL based on whether it's a general request or event-specific
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
    
    console.log('🔵 [CREATE-CHECKOUT] Stripe Connect status:', {
      hasConnectAccount,
      connectAccountId: organization?.stripe_connect_account_id || 'none',
      chargesEnabled: organization?.stripe_connect_charges_enabled || false,
      payoutsEnabled: organization?.stripe_connect_payouts_enabled || false
    });
    
    // PLATFORM OWNER BYPASS: M10 DJ Company can use platform account (existing behavior)
    // This ensures your business operations are never disrupted
    const isPlatformOwner = organization?.is_platform_owner || false;
    
    // Note: We allow payments to go through even without Stripe Connect set up
    // Payments will route to the platform account, and users can set up banking later
    // Manual payouts will be required until Stripe Connect is configured
    
    // Import Connect helpers (if needed)
    let createCheckoutSessionWithPlatformFee, calculatePlatformFee;
    if (hasConnectAccount) {
      try {
        console.log('🔵 [CREATE-CHECKOUT] Importing Stripe Connect helpers...');
        const connectModule = await import('@/utils/stripe/connect');
        createCheckoutSessionWithPlatformFee = connectModule.createCheckoutSessionWithPlatformFee;
        calculatePlatformFee = connectModule.calculatePlatformFee;
        console.log('✅ [CREATE-CHECKOUT] Stripe Connect helpers imported successfully');
      } catch (importError) {
        console.error('❌ [CREATE-CHECKOUT] Error importing Stripe Connect helpers:', importError);
        throw new Error(`Failed to load Stripe Connect utilities: ${importError.message}`);
      }
    }
    
    // Determine product context for business name customization
    let productContext = organization?.product_context || null;
    if (!productContext && crowdRequest.source_domain) {
      if (crowdRequest.source_domain.includes('tipjar.live')) {
        productContext = 'tipjar';
      } else if (crowdRequest.source_domain.includes('djdash.net') || crowdRequest.source_domain.includes('djdash.com')) {
        productContext = 'djdash';
      } else if (crowdRequest.source_domain.includes('m10djcompany.com')) {
        productContext = 'm10dj';
      }
    }
    
    // Update connected account business profile for TipJar to show "TipJar.live" instead of organization name
    // This ensures the business name shown on Stripe checkout pages is "TipJar.live" for TipJar payments
    if (hasConnectAccount && productContext === 'tipjar') {
      try {
        console.log('🔵 [CREATE-CHECKOUT] Checking connected account business profile for TipJar...');
        const account = await stripe.accounts.retrieve(organization.stripe_connect_account_id);
        const currentBusinessName = account.business_profile?.name || account.display_name || '';
        
        if (currentBusinessName !== 'TipJar.live') {
          console.log(`🔵 [CREATE-CHECKOUT] Updating business profile from "${currentBusinessName}" to "TipJar.live"...`);
          await stripe.accounts.update(organization.stripe_connect_account_id, {
            business_profile: {
              name: 'TipJar.live',
              url: `https://tipjar.live/${organization.slug || 'requests'}/requests`
            }
          });
          console.log('✅ [CREATE-CHECKOUT] Updated connected account business profile to "TipJar.live"');
        } else {
          console.log('✅ [CREATE-CHECKOUT] Business profile already set to "TipJar.live"');
        }
      } catch (updateError) {
        console.error('⚠️ [CREATE-CHECKOUT] Failed to update business profile (non-critical):', updateError);
        // Non-critical error - continue with checkout even if update fails
      }
    }
    
    // Calculate platform fee if using Connect
    let platformFeePercentage = organization?.platform_fee_percentage || 3.50;
    let platformFeeFixed = organization?.platform_fee_fixed || 0.30;
    let feeCalculation = null;
    
    if (hasConnectAccount) {
      feeCalculation = calculatePlatformFee(normalizedAmount, platformFeePercentage, platformFeeFixed);
      console.log(`💰 Using Stripe Connect for organization ${organization.name}:`);
      console.log(`   Total: $${(normalizedAmount / 100).toFixed(2)}`);
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
      // Create checkout session with line items and Connect routing
      // Ensure we have at least one line item - use amount directly if lineItems is empty (shouldn't happen, but safety check)
      const finalLineItems = lineItems.length > 0 ? lineItems : [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: fullDescription.substring(0, 100) || 'Song Request / Shoutout',
              description: fullDescription,
            },
            unit_amount: Math.max(1, normalizedAmount), // Amount is already in cents, ensure minimum 1 cent
          },
          quantity: 1,
        },
      ];
      
      // Calculate total amount from line items for platform fee calculation
      const totalAmountInCents = finalLineItems.reduce((sum, item) => {
        return sum + (item.price_data.unit_amount * (item.quantity || 1));
      }, 0);
      
      // Ensure we have a valid total amount (at least 1 cent)
      if (totalAmountInCents < 1) {
        throw new Error('Invalid payment amount: Total amount must be at least $0.01');
      }
      
      // Calculate platform fee based on total amount
      const percentageFee = Math.round((totalAmountInCents * platformFeePercentage) / 100);
      const applicationFeeAmount = percentageFee + Math.round(platformFeeFixed * 100);
      
      const sessionParams = {
        payment_method_types: paymentMethodTypes,
        line_items: finalLineItems,
        mode: 'payment',
        success_url: `${baseUrl}/crowd-request/success?session_id={CHECKOUT_SESSION_ID}&request_id=${crowdRequest.id}`,
        cancel_url: cancelUrl,
        ...(crowdRequest.requester_email && {
          customer_email: crowdRequest.requester_email,
        }),
        billing_address_collection: 'auto',
        phone_number_collection: {
          enabled: !crowdRequest.requester_phone,
        },
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: organization.stripe_connect_account_id,
          },
        },
        metadata: {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          event_code: crowdRequest.event_qr_code,
          organization_id: organization.id,
          organization_name: organization.name,
          is_fast_track: isFastTrackRequest ? 'true' : 'false',
          is_next: isNextRequest ? 'true' : 'false',
          payment_routing: 'stripe_connect', // Track that this payment is routed through Stripe Connect
          requires_manual_payout: 'false', // Connect payments are automatically routed
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
        // Note: We use payment_intent_data.transfer_data.destination to route payment to connected account
        // The customer_account parameter is not a valid Checkout Sessions API parameter
      };
      
      // Note: Cash App Pay is supported with Stripe Connect via transfer_data.destination
      // The payment method types (cashapp) will work correctly with the connected account
      
      // Validate Stripe secret key
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key is not configured');
      }
      
      // Validate session parameters
      console.log('🔵 [CREATE-CHECKOUT] Creating Stripe Connect checkout session with params:', {
        payment_method_types: sessionParams.payment_method_types,
        line_items_count: sessionParams.line_items.length,
        total_amount: totalAmountInCents,
        connect_account_id: organization.stripe_connect_account_id?.substring(0, 20) + '...',
        has_application_fee: !!sessionParams.payment_intent_data?.application_fee_amount,
        transfer_destination: sessionParams.payment_intent_data?.transfer_data?.destination?.substring(0, 20) + '...'
      });
      
      try {
        session = await stripe.checkout.sessions.create(sessionParams);
        
        console.log(`✅ Created Stripe Connect checkout session for organization ${organization.name}:`);
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Total: $${(totalAmountInCents / 100).toFixed(2)}`);
        console.log(`   Platform Fee: $${(applicationFeeAmount / 100).toFixed(2)} (${platformFeePercentage}% + $${platformFeeFixed.toFixed(2)})`);
        console.log(`   DJ Payout: $${((totalAmountInCents - applicationFeeAmount) / 100).toFixed(2)}`);
        console.log(`   Payment Methods: ${paymentMethodTypes.join(', ')}`);
      } catch (connectError) {
        console.error('❌ [CREATE-CHECKOUT] Error creating Stripe Connect checkout session:', {
          message: connectError.message,
          type: connectError.type,
          code: connectError.code,
          decline_code: connectError.decline_code,
          param: connectError.param,
          raw: connectError.raw,
          stack: connectError.stack
        });
        // Re-throw to be caught by outer try-catch
        throw connectError;
      }
      
    } else {
      // Fallback to regular checkout (payment goes to platform account)
      // This allows users to accept payments before setting up Stripe Connect
      // Payments will be held in the platform account until Stripe Connect is configured
      // Users can set up banking later and receive payouts after setup
      console.log(`⚠️ Organization ${organization?.name || 'Unknown'} (${organization?.id || 'Unknown ID'}) does not have Stripe Connect set up. Payment will go to platform account for manual payout.`);
      console.log(`   💡 User can set up Stripe Connect later in their dashboard to receive automatic payouts.`);
      
      // Ensure we have at least one line item with valid amount
      const regularLineItems = lineItems.length > 0 ? lineItems : [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: fullDescription.substring(0, 100) || 'Song Request / Shoutout', // Product name (max 100 chars)
              description: fullDescription, // Full description appears in Stripe dashboard
              metadata: {
                request_type: crowdRequest.request_type,
                ...(crowdRequest.request_type === 'song_request' && {
                  song_title: crowdRequest.song_title || '',
                  song_artist: crowdRequest.song_artist || '',
                  bundle_size: bundleSongs.length > 1 ? bundleSongs.length.toString() : '1',
                  bundle_songs: bundleSongs.length > 1 ? JSON.stringify(bundleSongs.map(s => ({
                    title: s.song_title || '',
                    artist: s.song_artist || ''
                  }))) : '',
                }),
                ...(crowdRequest.request_type === 'shoutout' && {
                  recipient_name: crowdRequest.recipient_name || '',
                }),
                ...(crowdRequest.request_type === 'tip' && {
                  tip: 'true',
                }),
              },
            },
            unit_amount: Math.max(1, normalizedAmount), // Amount is already in cents, ensure minimum 1 cent (Stripe requirement)
          },
          quantity: 1,
        },
      ];
      
      // Validate that total amount is valid (at least 1 cent)
      const totalAmount = regularLineItems.reduce((sum, item) => {
        return sum + (item.price_data.unit_amount * (item.quantity || 1));
      }, 0);
      
      if (totalAmount < 1) {
        throw new Error('Invalid payment amount: Total amount must be at least $0.01');
      }
      
      // Validate Stripe secret key
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key is not configured');
      }
      
      // Validate session parameters
      console.log('🔵 [CREATE-CHECKOUT] Creating regular checkout session with params:', {
        payment_method_types: paymentMethodTypes,
        line_items_count: regularLineItems.length,
        total_amount: totalAmount,
        has_organization: !!organization
      });
      
      try {
        session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethodTypes, // Card includes Apple Pay automatically on supported devices
        // Cash App Pay requires enabling in Stripe dashboard: Settings > Payment methods > Cash App Pay
        // Cash App Pay works with both Connect and non-Connect accounts
        line_items: regularLineItems,
        mode: 'payment',
        success_url: `${baseUrl}/crowd-request/success?session_id={CHECKOUT_SESSION_ID}&request_id=${crowdRequest.id}`,
        cancel_url: cancelUrl,
        // Pre-fill customer email if we have it (Stripe only supports email pre-fill in Checkout)
        // Note: customer_details is read-only on completed sessions, not a valid create parameter
        customer_email: crowdRequest.requester_email || undefined,
        billing_address_collection: 'auto',
        phone_number_collection: {
          enabled: !crowdRequest.requester_phone, // Only collect phone if we don't already have it
        },
        metadata: {
          request_id: crowdRequest.id,
          request_type: crowdRequest.request_type,
          event_code: crowdRequest.event_qr_code,
          organization_id: organization?.id || '',
          organization_name: organization?.name || '',
          is_fast_track: isFastTrackRequest ? 'true' : 'false',
          is_next: isNextRequest ? 'true' : 'false',
          payment_routing: 'platform_account', // Track that this payment went to platform account
          requires_manual_payout: organization ? 'true' : 'false', // Manual payout needed for non-Connect accounts
        // Add song info to metadata for easy viewing in Stripe dashboard
        ...(crowdRequest.request_type === 'song_request' && {
          song_title: crowdRequest.song_title || '',
          song_artist: crowdRequest.song_artist || '',
          song_full: fullDescription, // Full song description in metadata
          bundle_size: bundleSongs.length > 1 ? bundleSongs.length.toString() : '1',
          bundle_songs: bundleSongs.length > 1 ? JSON.stringify(bundleSongs.map(s => ({
            title: s.song_title || '',
            artist: s.song_artist || ''
          }))) : '',
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
            bundle_size: bundleSongs.length > 1 ? bundleSongs.length.toString() : '1',
            bundle_songs: bundleSongs.length > 1 ? JSON.stringify(bundleSongs.map(s => ({
              title: s.song_title || '',
              artist: s.song_artist || ''
            }))) : '',
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
      
        console.log(`✅ Created regular checkout session (platform account):`);
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Total: $${(totalAmount / 100).toFixed(2)}`);
        console.log(`   Payment Methods: ${paymentMethodTypes.join(', ')}`);
        if (organization) {
          console.log(`   Organization: ${organization.name || organization.id}`);
          console.log(`   Note: Payment will go to platform account. Organization can set up Stripe Connect for automatic payouts.`);
        }
      } catch (regularError) {
        console.error('❌ [CREATE-CHECKOUT] Error creating regular checkout session:', {
          message: regularError.message,
          type: regularError.type,
          code: regularError.code,
          decline_code: regularError.decline_code,
          param: regularError.param,
          raw: regularError.raw,
          stack: regularError.stack
        });
        // Re-throw to be caught by outer try-catch
        throw regularError;
      }
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
    console.error('❌ [CREATE-CHECKOUT] Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      stack: error.stack,
      requestId: req.body?.requestId,
      amount: req.body?.amount
    });
    
    // Return detailed error information for debugging
    const errorResponse = {
      error: 'Failed to create checkout session',
      message: error.message || 'Unknown error occurred',
      ...(error.type && { type: error.type }),
      ...(error.code && { code: error.code }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    };
    
    return res.status(500).json(errorResponse);
  }
}

