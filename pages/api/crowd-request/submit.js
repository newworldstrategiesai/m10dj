const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { createRateLimitMiddleware, getClientIp } = require('@/utils/rate-limiter');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Rate limiting: 20 requests per 15 minutes per IP (higher limit for payment submissions)
const rateLimiter = createRateLimitMiddleware({
  maxRequests: 20,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => getClientIp(req)
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  await rateLimiter(req, res);
  if (res.headersSent) {
    return; // Rate limit exceeded, response already sent
  }

  const {
    eventCode,
    requestType,
    songArtist,
    songTitle,
    recipientName,
    recipientMessage,
    requesterName,
    requesterEmail,
    requesterPhone,
    message,
    amount,
    isFastTrack,
    isNext,
    fastTrackFee,
    nextFee,
    organizationId // Optional: can be passed explicitly or determined from eventCode
  } = req.body;

  // Validate required fields
  // Note: requesterName is optional - use 'Guest' as fallback
  if (!eventCode || !requestType || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (requestType === 'song_request' && !songTitle) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  if (requestType === 'shoutout' && (!recipientName || !recipientMessage)) {
    return res.status(400).json({ error: 'Recipient name and message are required for shoutouts' });
  }

  // Note: Minimum amount validation should use admin settings, but we'll keep a basic check here
  // The frontend should enforce the minimum from settings
  if (amount < 100) {
    return res.status(400).json({ error: 'Minimum payment is $1.00' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine organization_id
    // Priority: 1. Explicit organizationId, 2. From referrer/origin URL slug, 3. From eventCode lookup, 4. Platform admin's org
    let organizationIdToUse = organizationId;

    // Helper function to extract slug from URL
    const extractSlugFromUrl = (url) => {
      if (!url) return null;
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        // Check if URL pattern is /{slug}/requests or /{slug}/*
        if (pathParts.length > 0) {
          const potentialSlug = pathParts[0];
          // Validate slug format (alphanumeric and hyphens)
          if (/^[a-z0-9-]+$/.test(potentialSlug) && potentialSlug !== 'api' && potentialSlug !== 'admin') {
            return potentialSlug;
          }
        }
      } catch (err) {
        // Invalid URL, ignore
      }
      return null;
    };

    // Check referrer URL for organization slug
    if (!organizationIdToUse) {
      const referer = req.headers.referer || req.headers.referrer;
      const refererSlug = extractSlugFromUrl(referer);
      
      if (refererSlug) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', refererSlug)
            .single();
          
          if (org) {
            organizationIdToUse = org.id;
            console.log('✅ Found organization from referrer URL:', refererSlug, organizationIdToUse);
          }
        } catch (err) {
          console.warn('Could not find organization from referrer slug:', refererSlug);
        }
      }
    }

    // Check origin URL for organization slug
    if (!organizationIdToUse) {
      const origin = req.headers.origin;
      const originSlug = extractSlugFromUrl(origin);
      
      if (originSlug) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', originSlug)
            .single();
          
          if (org) {
            organizationIdToUse = org.id;
            console.log('✅ Found organization from origin URL:', originSlug, organizationIdToUse);
          }
        } catch (err) {
          console.warn('Could not find organization from origin slug:', originSlug);
        }
      }
    }

    // Try to get organization from eventCode (future: events table mapping)
    // For now, if eventCode matches an organization slug pattern, try to look it up
    if (!organizationIdToUse && eventCode && eventCode !== 'general') {
      // Check if eventCode could be an organization slug
      if (/^[a-z0-9-]+$/.test(eventCode)) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', eventCode)
            .single();
          
          if (org) {
            organizationIdToUse = org.id;
            console.log('✅ Found organization from eventCode:', eventCode, organizationIdToUse);
          }
        } catch (err) {
          // Event code is not an organization slug, continue to fallback
        }
      }
    }

    // Fallback: Use platform admin's organization
    if (!organizationIdToUse) {
      try {
        // Get admin user ID
        const adminUserId = process.env.DEFAULT_ADMIN_USER_ID;
        if (adminUserId) {
          const { data: adminOrg } = await supabase
            .from('organizations')
            .select('id')
            .eq('owner_id', adminUserId)
            .single();
          
          if (adminOrg) {
            organizationIdToUse = adminOrg.id;
            console.log('✅ Using platform admin organization as fallback:', organizationIdToUse);
          }
        }
      } catch (err) {
        console.warn('Could not determine organization from admin user');
      }
    }

    // If still no organization, log warning but allow null for backward compatibility
    if (!organizationIdToUse) {
      console.warn('⚠️ No organization_id found for crowd request. Using null (will need manual assignment).');
      console.warn('   Event code:', eventCode);
      console.warn('   Referrer:', req.headers.referer);
      // For backward compatibility during migration, we'll allow null
      // But this should be fixed once all data is migrated
    }

    // Set priority: next = 0 (highest), fast-track = 1, regular = 1000
    let priorityOrder = 1000;
    if (requestType === 'song_request') {
      if (isNext) {
        priorityOrder = 0; // Highest priority - plays next
      } else if (isFastTrack) {
        priorityOrder = 1; // High priority - priority placement
      }
    }
    
    // For 'general' event code, append timestamp to make it unique
    const uniqueEventCode = eventCode === 'general' 
      ? `general-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : eventCode;
    
    // Generate unique payment code for CashApp/Venmo verification
    // Format: M10-XXXXXX (6 alphanumeric characters)
    const generatePaymentCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
      let code = 'M10-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    const paymentCode = generatePaymentCode();
    
    // Create crowd request record
    const insertData = {
      event_qr_code: uniqueEventCode,
      request_type: requestType,
      song_artist: songArtist || null,
      song_title: songTitle || null,
      recipient_name: recipientName || null,
      recipient_message: recipientMessage || null,
      requester_name: requesterName?.trim() || 'Guest',
      requester_email: requesterEmail?.trim() || null,
      requester_phone: requesterPhone || null,
      request_message: message || null,
      amount_requested: amount,
      is_fast_track: requestType === 'song_request' ? (isFastTrack || false) : false,
      is_next: requestType === 'song_request' ? (isNext || false) : false,
      fast_track_fee: (requestType === 'song_request' && isFastTrack) ? (fastTrackFee || 0) : 0,
      next_fee: (requestType === 'song_request' && isNext) ? (nextFee || 0) : 0,
      priority_order: priorityOrder,
      payment_status: 'pending',
      payment_code: paymentCode,
      status: 'new'
    };

    // Add organization_id if we have it
    if (organizationIdToUse) {
      insertData.organization_id = organizationIdToUse;
    }
    
    const { data: crowdRequest, error: insertError } = await supabase
      .from('crowd_requests')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating crowd request:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      
      // Provide helpful error message for missing columns
      let helpfulMessage = insertError.message || 'Unknown database error';
      if (insertError.code === 'PGRST204' && insertError.message?.includes('payment_code')) {
        helpfulMessage = 'Database migration required: payment_code column missing. Please run the migration in Supabase SQL Editor.';
      } else if (insertError.code === 'PGRST204' && insertError.message?.includes('is_next')) {
        helpfulMessage = 'Database migration required: is_next column missing. Please run the migration in Supabase SQL Editor.';
      } else if (insertError.code === 'PGRST204' && insertError.message?.includes('next_fee')) {
        helpfulMessage = 'Database migration required: next_fee column missing. Please run the migration in Supabase SQL Editor.';
      }
      
      return res.status(500).json({ 
        error: 'Failed to create request',
        details: helpfulMessage,
        code: insertError.code,
        hint: insertError.hint || 'Check APPLY_MIGRATIONS.md for instructions',
        migrationNeeded: insertError.code === 'PGRST204'
      });
    }

    console.log(`✅ Created crowd request (ID: ${crowdRequest.id})`);

    // Return request ID and payment code - payment method selection will happen on frontend
    return res.status(200).json({
      success: true,
      requestId: crowdRequest.id,
      paymentCode: paymentCode,
    });
  } catch (error) {
    console.error('❌ Error processing crowd request:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message,
    });
  }
}

