import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Twilio webhook for incoming calls to virtual numbers
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const {
      CallSid,
      From,
      To,
      CallerName,
      CallStatus
    } = req.body;

    // Find the virtual number record
    const { data: virtualNumber, error: vnError } = await supabase
      .from('dj_virtual_numbers')
      .select('*, dj_profiles!inner(id, dj_slug, organization_id, organizations!inner(product_context))')
      .eq('virtual_number', To)
      .eq('is_active', true)
      .single();

    if (vnError || !virtualNumber) {
      console.error('Virtual number not found:', To);
      // Return basic TwiML to hang up
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say('Sorry, this number is not available.');
      twiml.hangup();
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    // Log the call with consent tracking
    const { data: callRecord, error: callError } = await supabase
      .from('dj_calls')
      .insert({
        dj_profile_id: virtualNumber.dj_profile_id,
        virtual_number: To,
        caller_number: From,
        caller_name: CallerName,
        call_sid: CallSid,
        call_status: CallStatus,
        page_url: `https://djdash.net/dj/${virtualNumber.dj_profiles.dj_slug}`,
        product_context: 'djdash',
        lead_score: 'hot',
        consent_recorded: true, // Consent given via automated notice
        consent_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (callError) {
      console.error('Error logging call:', callError);
    }

    // Forward call to DJ's real number with recording and legal compliance
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Legal compliance notice - inform caller that call may be recorded
    twiml.say('This call may be recorded for quality assurance and customer service purposes.', {
      voice: 'alice'
    });
    
    twiml.say(`Thank you for calling ${virtualNumber.dj_profiles.dj_name}. Please hold while we connect you.`, {
      voice: 'alice'
    });
    
    // Record the call and set up status callback
    const recordingStatusCallback = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/djdash/calls/recording`;
    
    twiml.dial({
      timeout: 20,
      record: 'record-from-ringing',
      recordingStatusCallback: recordingStatusCallback,
      recordingStatusCallbackEvent: 'completed',
      callerId: To
    }, virtualNumber.real_phone_number);

    // If call is not answered
    twiml.say('We\'re sorry, but we\'re unable to take your call at this time. Please visit our website or send us a text message for a faster response.', {
      voice: 'alice'
    });
    
    twiml.record({
      maxLength: 60,
      transcribe: true,
      transcribeCallback: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/djdash/calls/voicemail`
    });

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  } catch (error) {
    console.error('Error in incoming call webhook:', error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('We\'re sorry, but we\'re experiencing technical difficulties. Please try again later.');
    twiml.hangup();
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml.toString());
  }
}

