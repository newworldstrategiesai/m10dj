const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    nextFee
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
    const { data: crowdRequest, error: insertError } = await supabase
      .from('crowd_requests')
      .insert({
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
      })
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

