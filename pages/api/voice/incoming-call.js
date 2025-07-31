// Twilio webhook for incoming voice calls
export default function handler(req, res) {
  // Use the existing admin phone number environment variable
  const personalPhoneNumber = process.env.ADMIN_PHONE_NUMBER || '+19014977001';
  
  // TwiML response for call forwarding
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you for calling M10 DJ Company. Please hold while we connect you.</Say>
    <Dial timeout="20" record="record-from-ringing" callerId="${req.body.To}">
        <Number>${personalPhoneNumber}</Number>
    </Dial>
    <Say voice="alice">We're sorry, but we're unable to take your call at this time. Please visit our website at M10 DJ Company dot com or send us a text message for a faster response.</Say>
    <Record maxLength="60" transcribe="true" transcribeCallback="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/voice/voicemail"/>
</Response>`;

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml);
}