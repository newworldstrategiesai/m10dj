// Twilio webhook for incoming voice calls
// Now routes calls through LiveKit for transcription and AI analysis

import { createClient } from '@supabase/supabase-js';
import { RoomServiceClient } from 'livekit-server-sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
);

export default async function handler(req, res) {
  try {
    const { From, To } = req.body;
    const personalPhoneNumber = process.env.ADMIN_PHONE_NUMBER || '+19014977001';
    
    // Check if LiveKit call routing is enabled
    const useLiveKit = process.env.ENABLE_LIVEKIT_CALLS === 'true';
    
    if (!useLiveKit) {
      // Fallback to original direct dial behavior
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling M10 DJ Company. Please hold while we connect you.</Say>
    <Dial timeout="20" record="record-from-ringing" callerId="${To}">
        <Number>${personalPhoneNumber}</Number>
    </Dial>
    <Say voice="alice">We're sorry, but we're unable to take your call at this time. Please visit our website at M10 DJ Company dot com or send us a text message for a faster response.</Say>
    <Record maxLength="60" transcribe="true" transcribeCallback="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/voice/voicemail"/>
</Response>`;
      
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml);
    }

    // Create LiveKit room for call
    const roomName = `call-${Date.now()}-${From.replace(/\D/g, '')}`;
    
    // Create room in LiveKit
    const livekitUrl = process.env.LIVEKIT_URL || '';
    const livekitApiKey = process.env.LIVEKIT_API_KEY || '';
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET || '';
    
    if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
      throw new Error('LiveKit not configured');
    }
    
    const roomService = new RoomServiceClient(
      livekitUrl.replace('wss://', 'https://'),
      livekitApiKey,
      livekitApiSecret
    );

    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // 5 minutes
        maxParticipants: 2,
      });
    } catch (roomError) {
      console.error('Error creating LiveKit room:', roomError);
      // Fallback to direct dial if room creation fails
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling M10 DJ Company. Please hold while we connect you.</Say>
    <Dial timeout="20" callerId="${To}">
        <Number>${personalPhoneNumber}</Number>
    </Dial>
</Response>`;
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml);
    }

    // Find contact by phone number
    const cleanPhone = From.replace(/\D/g, '');
    const { data: contact } = await supabase
      .from('contacts')
      .select('id')
      .ilike('phone', `%${cleanPhone}%`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Store call record
    await supabase.from('voice_calls').insert({
      room_name: roomName,
      contact_id: contact?.id || null,
      client_phone: From,
      admin_phone: personalPhoneNumber,
      direction: 'inbound',
      status: 'ringing',
      started_at: new Date().toISOString(),
    });

    // For now, still dial admin directly
    // In the future, we can route through LiveKit SIP gateway
    // This requires LiveKit SIP configuration
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling M10 DJ Company. Please hold while we connect you.</Say>
    <Dial timeout="20" record="record-from-ringing" callerId="${To}">
        <Number>${personalPhoneNumber}</Number>
    </Dial>
    <Say voice="alice">We're sorry, but we're unable to take your call at this time. Please visit our website at M10 DJ Company dot com or send us a text message for a faster response.</Say>
    <Record maxLength="60" transcribe="true" transcribeCallback="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/voice/voicemail"/>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
  } catch (error) {
    console.error('Error in incoming call handler:', error);
    
    // Fallback response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling M10 DJ Company. Please hold while we connect you.</Say>
    <Dial timeout="20" callerId="${req.body.To}">
        <Number>${process.env.ADMIN_PHONE_NUMBER || '+19014977001'}</Number>
    </Dial>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(twiml);
  }
}