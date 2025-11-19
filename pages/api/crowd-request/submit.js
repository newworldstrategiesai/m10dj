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
    fastTrackFee
  } = req.body;

  // Validate required fields
  if (!eventCode || !requestType || !requesterName || !amount) {
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

    // Set priority: fast-track = 0 (highest), regular = 1000
    const priorityOrder = (requestType === 'song_request' && isFastTrack) ? 0 : 1000;
    
    // For 'general' event code, append timestamp to make it unique
    const uniqueEventCode = eventCode === 'general' 
      ? `general-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : eventCode;
    
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
        requester_name: requesterName,
        requester_email: requesterEmail || null,
        requester_phone: requesterPhone || null,
        request_message: message || null,
        amount_requested: amount,
        is_fast_track: requestType === 'song_request' ? (isFastTrack || false) : false,
        fast_track_fee: (requestType === 'song_request' && isFastTrack) ? (fastTrackFee || 0) : 0,
        priority_order: priorityOrder,
        payment_status: 'pending',
        status: 'new'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating crowd request:', insertError);
      return res.status(500).json({ 
        error: 'Failed to create request',
        details: insertError.message,
        code: insertError.code
      });
    }

    console.log(`✅ Created crowd request (ID: ${crowdRequest.id})`);

    // Return request ID - payment method selection will happen on frontend
    return res.status(200).json({
      success: true,
      requestId: crowdRequest.id,
    });
  } catch (error) {
    console.error('❌ Error processing crowd request:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message,
    });
  }
}

