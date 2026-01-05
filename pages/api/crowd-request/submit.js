const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const { createRateLimitMiddleware, getClientIp } = require('@/utils/rate-limiter');
const { normalizeSongCasing } = require('@/utils/song-casing-normalizer');
const { cleanSongData } = require('@/utils/song-title-cleanup');

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
    organizationId, // Optional: can be passed explicitly or determined from eventCode
    audioFileUrl,
    isCustomAudio,
    artistRightsConfirmed,
    isArtist,
    scanId, // QR scan ID from sessionStorage
    sessionId, // QR session ID from sessionStorage
    postedLink, // Original URL if request was created from a posted link
    albumArtUrl, // Album art URL extracted from music service links
    visitor_id, // Visitor ID for customer journey tracking
    paymentCode: existingPaymentCode, // Optional: for bundle songs to share same payment code
    parentRequestId // Optional: for bundle songs to link to parent request
  } = req.body;

  // Validate required fields
  // Note: requesterName is now required - users must provide their name
  // Note: amount can be 0 for bidding mode requests (payment happens when bid is placed)
  if (!eventCode || !requestType || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Requester name is required
  if (!requesterName || !requesterName.trim()) {
    return res.status(400).json({ error: 'Requester name is required' });
  }

  // Validate request type
  if (!['song_request', 'shoutout', 'tip'].includes(requestType)) {
    return res.status(400).json({ error: 'Invalid request type' });
  }

  if (requestType === 'song_request' && !songTitle) {
    return res.status(400).json({ error: 'Song title is required' });
  }

  if (requestType === 'shoutout' && (!recipientName || !recipientMessage)) {
    return res.status(400).json({ error: 'Recipient name and message are required for shoutouts' });
  }

  // Tip requests only need an amount (no additional fields required)

  // Note: Minimum amount validation should use admin settings, but we'll keep a basic check here
  // The frontend should enforce the minimum from settings
  // Allow amount to be 0 for bidding mode (payment happens when bid is placed, not at request creation)
  // For tips: allow any amount with no minimum
  // For song requests and shoutouts: enforce minimum of $1.00
  if (requestType !== 'tip' && amount !== 0 && amount < 100) {
    return res.status(400).json({ error: 'Minimum payment is $1.00' });
  }
  
  // For tips, only ensure amount is not negative
  if (requestType === 'tip' && amount < 0) {
    return res.status(400).json({ error: 'Amount cannot be negative' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract source domain from request headers
    // Priority: 1. Explicit sourceDomain from body, 2. Origin header, 3. Referer header
    let sourceDomain = req.body.sourceDomain || null;
    if (!sourceDomain) {
      const origin = req.headers.origin || '';
      const referer = req.headers.referer || req.headers.referrer || '';
      
      // Extract domain from origin or referer
      const extractDomain = (url) => {
        if (!url) return null;
        try {
          const urlObj = new URL(url);
          return urlObj.hostname.replace('www.', '');
        } catch (e) {
          return null;
        }
      };
      
      sourceDomain = extractDomain(origin) || extractDomain(referer);
    }

    // Determine organization_id
    // Priority: 1. Explicit organizationId (from request body - MOST RELIABLE), 
    //           2. From referrer/origin URL slug, 
    //           3. From eventCode lookup, 
    //           4. Platform admin's org
    // 
    // IMPORTANT: If organizationId is explicitly provided, use it and skip header-based detection
    // This ensures consistency when requests are made from the same page
    let organizationIdToUse = organizationId;
    
    // Log the source of organization_id for debugging
    if (organizationIdToUse) {
      console.log('✅ Using explicit organizationId from request body:', organizationIdToUse);
      console.log('   Skipping header-based organization detection for consistency');
    } else {
      console.log('⚠️ No explicit organizationId provided - will use fallback detection methods');
    }

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
    // SKIP THIS IF organizationId was explicitly provided
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
    // SKIP THIS IF organizationId was explicitly provided
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
    // SKIP THIS IF organizationId was explicitly provided
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

    // If still no organization, try harder to find one
    if (!organizationIdToUse) {
      console.warn('⚠️ No organization_id found for crowd request. Trying additional methods...');
      console.warn('   Event code:', eventCode);
      console.warn('   Referrer:', req.headers.referer);
      
      // Last resort: Get the most recently created organization (likely the main one)
      try {
        const { data: recentOrg } = await supabase
          .from('organizations')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentOrg) {
          organizationIdToUse = recentOrg.id;
          console.log('✅ Using most recent organization as fallback:', organizationIdToUse);
        }
      } catch (err) {
        console.warn('Could not get fallback organization:', err.message);
      }
      
      // If still no organization, log error but allow null for backward compatibility
      if (!organizationIdToUse) {
        console.error('❌ CRITICAL: No organization_id found - request will be orphaned');
        console.error('   This request will need manual assignment in the admin UI');
        console.error('   To prevent this, ensure the frontend passes organizationId in the request body');
        console.error('   Request details:', {
          eventCode,
          referer: req.headers.referer,
          origin: req.headers.origin,
          hasExplicitOrgId: !!organizationId
        });
      }
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
    // For bundle songs, use the existing payment code from the main request
    const generatePaymentCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
      let code = 'M10-';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    // Use existing payment code if provided (for bundle songs), otherwise generate new one
    const paymentCode = existingPaymentCode || generatePaymentCode();
    
    // Clean up and normalize song title and artist
    // Step 1: Clean up common issues (e.g., "Latch Disclosure" → "Latch" when artist is "Disclosure")
    // Step 2: Normalize casing (uses title case by default)
    let normalizedTitle = songTitle || null;
    let normalizedArtist = songArtist || null;
    
    if (requestType === 'song_request' && (songTitle || songArtist)) {
      // First, clean up the song data (remove artist from title, etc.)
      const cleaned = cleanSongData(songTitle || '', songArtist || '');
      
      // Then normalize casing
      const normalized = normalizeSongCasing(cleaned.cleanedTitle || '', cleaned.cleanedArtist || '');
      normalizedTitle = normalized.normalizedTitle || null;
      normalizedArtist = normalized.normalizedArtist || null;
      
      // Log the cleanup for debugging
      const wasModified = (songTitle !== cleaned.cleanedTitle) || (songArtist !== cleaned.cleanedArtist);
      if (wasModified) {
        console.log('🧹 Cleaned up song data:', {
          original: { title: songTitle, artist: songArtist },
          cleaned: { title: cleaned.cleanedTitle, artist: cleaned.cleanedArtist },
          final: { title: normalizedTitle, artist: normalizedArtist }
        });
      } else {
      console.log('Normalized casing on request creation:', {
        original: { title: songTitle, artist: songArtist },
        normalized: { title: normalizedTitle, artist: normalizedArtist }
      });
      }
    }
    
    // Create crowd request record with all fields
    const insertData = {
      event_qr_code: uniqueEventCode,
      request_type: requestType,
      song_artist: normalizedArtist,
      song_title: normalizedTitle,
      recipient_name: recipientName || null,
      recipient_message: recipientMessage || null,
      requester_name: requesterName.trim(),
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
      status: 'new',
      audio_file_url: audioFileUrl || null,
      is_custom_audio: isCustomAudio || false,
      artist_rights_confirmed: artistRightsConfirmed || false,
      is_artist: isArtist || false,
      audio_upload_fee: (isCustomAudio && audioFileUrl) ? 10000 : 0, // $100.00 in cents
      posted_link: postedLink || null, // Store original URL if request was created from a posted link
      album_art_url: albumArtUrl || null, // Store album art URL extracted from music service links
      visitor_id: visitor_id || null, // Link to visitor tracking for customer journey
      source_domain: sourceDomain || null // Track where the request originated from
    };

    // Add organization_id if we have it
    if (organizationIdToUse) {
      insertData.organization_id = organizationIdToUse;
      
      // Feature Gating: Check subscription limits and payment processing access
      try {
        const { data: org } = await supabase
          .from('organizations')
          .select('id, subscription_tier, subscription_status, is_platform_owner')
          .eq('id', organizationIdToUse)
          .single();
        
        if (org) {
          // Platform owners bypass all restrictions
          if (!org.is_platform_owner) {
            // Import feature gating utilities
            const { canCreateSongRequest, canProcessPayments, getRequestLimit } = await import('@/utils/feature-gating');
            
            // Check request creation limit (only for song requests and shoutouts, not tips)
            if (requestType === 'song_request' || requestType === 'shoutout') {
              // Count requests this month for this organization
              const now = new Date();
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              
              const { count: requestCount } = await supabase
                .from('crowd_requests')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', organizationIdToUse)
                .in('request_type', ['song_request', 'shoutout'])
                .gte('created_at', startOfMonth.toISOString());
              
              const currentUsage = requestCount || 0;
              const requestAccess = await canCreateSongRequest(
                currentUsage,
                org.subscription_tier,
                org.subscription_status
              );
              
              if (!requestAccess.allowed) {
                return res.status(403).json({
                  error: 'Request limit reached',
                  message: requestAccess.reason,
                  upgradeRequired: true,
                  upgradeTier: requestAccess.upgradeRequired,
                  currentUsage,
                  limit: getRequestLimit(org.subscription_tier),
                });
              }
            }
            
            // Check payment processing access (for tips and requests with payment)
            if (amount > 0 && requestType === 'tip') {
              const paymentAccess = canProcessPayments(org.subscription_tier, org.subscription_status);
              
              if (!paymentAccess.allowed) {
                return res.status(403).json({
                  error: 'Payment processing not available',
                  message: paymentAccess.reason,
                  upgradeRequired: true,
                  upgradeTier: paymentAccess.upgradeRequired,
                });
              }
            }
            
            // For song requests and shoutouts with payment, also check payment access
            if (amount > 0 && (requestType === 'song_request' || requestType === 'shoutout')) {
              const paymentAccess = canProcessPayments(org.subscription_tier, org.subscription_status);
              
              if (!paymentAccess.allowed) {
                // Free tier can create requests, but cannot process payments
                // Set amount to 0 to allow the request without payment
                console.log(`⚠️ Free tier organization cannot process payments. Setting amount to 0 for request.`);
                insertData.amount_requested = 0;
                // Note: The request will be created but payment will not be processed
                // Frontend should handle this by not showing payment options for Free tier
              }
            }
          }
        }
      } catch (featureGateError) {
        console.error('⚠️ Error checking feature gates:', featureGateError);
        // Don't block the request if feature gating check fails
        // This ensures the system remains functional even if feature gating has issues
      }
    }
    
    // Log the data being inserted for debugging
    console.log('📝 Inserting crowd request with data:', {
      eventCode: uniqueEventCode,
      requestType,
      organizationId: organizationIdToUse,
      amount,
      hasAudioFile: !!audioFileUrl,
      insertDataKeys: Object.keys(insertData)
    });

    let crowdRequest;
    let insertError;
    
    // Try insert with all fields first
    try {
      const result = await supabase
      .from('crowd_requests')
      .insert(insertData)
      .select()
      .single();
      
      crowdRequest = result.data;
      insertError = result.error;
    } catch (err) {
      console.error('❌ Exception during insert:', err);
      insertError = {
        message: err.message || 'Unknown error during insert',
        code: err.code || 'UNKNOWN',
        details: err.toString()
      };
    }

    // If insert failed due to missing columns, retry without optional audio upload fields
    if (insertError && (insertError.code === 'PGRST204' || insertError.message?.includes('column') || insertError.message?.includes('does not exist'))) {
      console.warn('⚠️ Insert failed due to missing columns, retrying without optional audio upload fields...');
      
      // Create a fallback insert data without optional audio upload columns
      const fallbackInsertData = { ...insertData };
      delete fallbackInsertData.artist_rights_confirmed;
      delete fallbackInsertData.is_artist;
      // Keep audio_file_url and is_custom_audio as they might exist
      // Only remove audio_upload_fee if it's causing issues
      
      try {
        const fallbackResult = await supabase
          .from('crowd_requests')
          .insert(fallbackInsertData)
          .select()
          .single();
        
        if (!fallbackResult.error && fallbackResult.data) {
          console.log('✅ Insert succeeded with fallback data (without optional audio columns)');
          crowdRequest = fallbackResult.data;
          insertError = null;
        } else {
          // Try one more time without audio_upload_fee
          delete fallbackInsertData.audio_upload_fee;
          const finalResult = await supabase
            .from('crowd_requests')
            .insert(fallbackInsertData)
            .select()
            .single();
          
          if (!finalResult.error && finalResult.data) {
            console.log('✅ Insert succeeded with minimal data (without audio upload fee)');
            crowdRequest = finalResult.data;
            insertError = null;
          } else {
            insertError = finalResult.error || fallbackResult.error;
          }
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback insert also failed:', fallbackErr);
        insertError = {
          message: fallbackErr.message || insertError.message,
          code: fallbackErr.code || insertError.code,
          details: fallbackErr.toString()
        };
      }
    }

    if (insertError) {
      console.error('❌ Error creating crowd request:', insertError);
      console.error('Insert error details:', JSON.stringify(insertError, null, 2));
      console.error('Insert data that failed:', JSON.stringify(insertData, null, 2));
      
      // Provide helpful error message for missing columns
      let helpfulMessage = insertError.message || 'Unknown database error';
      if (insertError.code === 'PGRST204' || insertError.message?.includes('column') || insertError.message?.includes('does not exist')) {
        helpfulMessage = 'Database migration required: One or more columns may be missing. Please check the database schema and run necessary migrations.';
      } else if (insertError.code === '23505') {
        helpfulMessage = 'Duplicate entry: This request may have already been created.';
      } else if (insertError.code === '23503') {
        helpfulMessage = 'Foreign key constraint failed: Invalid organization_id or related record missing.';
      }
      
      return res.status(500).json({ 
        error: 'Failed to create request',
        details: helpfulMessage,
        code: insertError.code,
        message: insertError.message,
        hint: insertError.hint || 'Check server logs for more details',
        migrationNeeded: insertError.code === 'PGRST204' || insertError.message?.includes('column') || insertError.message?.includes('does not exist')
      });
    }

    console.log(`✅ Created crowd request (ID: ${crowdRequest.id})`);

    // Link QR scan to request if scanId is provided
    if (scanId) {
      try {
        const { error: scanUpdateError } = await supabase
          .from('qr_scans')
          .update({
            converted: true,
            converted_at: new Date().toISOString(),
            request_id: crowdRequest.id
          })
          .eq('id', scanId);

        if (scanUpdateError) {
          console.error('⚠️ Error linking scan to request:', scanUpdateError);
          // Don't fail the request if scan linking fails
        } else {
          console.log(`✅ Linked QR scan ${scanId} to request ${crowdRequest.id}`);
        }
      } catch (err) {
        console.error('⚠️ Error updating scan conversion:', err);
        // Don't fail the request if scan linking fails
      }
    } else if (sessionId && eventCode) {
      // Try to find scan by session_id and event_code as fallback
      try {
        const { data: scans, error: scanFindError } = await supabase
          .from('qr_scans')
          .select('id')
          .eq('session_id', sessionId)
          .eq('event_qr_code', eventCode)
          .eq('converted', false)
          .order('scanned_at', { ascending: false })
          .limit(1);

        if (!scanFindError && scans && scans.length > 0) {
          const { error: scanUpdateError } = await supabase
            .from('qr_scans')
            .update({
              converted: true,
              converted_at: new Date().toISOString(),
              request_id: crowdRequest.id
            })
            .eq('id', scans[0].id);

          if (!scanUpdateError) {
            console.log(`✅ Linked QR scan ${scans[0].id} to request ${crowdRequest.id} (via session)`);
          }
        }
      } catch (err) {
        console.error('⚠️ Error finding scan by session:', err);
      }
    }

    // Link visitor session to contact info if visitor_id provided
    if (visitor_id && (requesterEmail || requesterPhone || requesterName)) {
      try {
        await supabase.rpc('link_visitor_to_contact', {
          p_visitor_id: visitor_id,
          p_email: requesterEmail || null,
          p_phone: requesterPhone || null,
          p_name: requesterName || null,
          p_contact_id: null,
          p_contact_submission_id: null
        });
        
        // Mark visitor as having made a song request
        await supabase
          .from('visitor_sessions')
          .update({ 
            has_made_song_request: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', visitor_id);
          
        console.log('✅ Linked visitor to song request for journey tracking');
      } catch (linkError) {
        console.warn('⚠️ Failed to link visitor to song request (non-critical):', linkError.message);
        // Don't fail the request - visitor tracking is non-critical
      }
    }

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

