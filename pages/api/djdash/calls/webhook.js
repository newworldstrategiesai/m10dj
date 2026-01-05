import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Twilio webhook for call status updates
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
      CallStatus,
      From,
      To,
      Duration,
      CallerName
    } = req.body;

    // Find the call record by CallSid
    const { data: callRecord, error: findError } = await supabase
      .from('dj_calls')
      .select('*')
      .eq('call_sid', CallSid)
      .single();

    if (findError || !callRecord) {
      console.log('Call record not found for CallSid:', CallSid);
      // This might be a new call, we'll handle it in the incoming-call webhook
      return res.status(200).send('OK');
    }

    // Update call record with status and duration
    const updates = {
      call_status: CallStatus,
      call_duration_seconds: Duration ? parseInt(Duration) : null,
      updated_at: new Date().toISOString()
    };

    if (CallerName) {
      updates.caller_name = CallerName;
    }

    const { error: updateError } = await supabase
      .from('dj_calls')
      .update(updates)
      .eq('call_sid', CallSid);

    if (updateError) {
      console.error('Error updating call record:', updateError);
    }

    // If call is completed, trigger TipJar SMS follow-up
    if (CallStatus === 'completed' && Duration && parseInt(Duration) > 10) {
      // Only send if call lasted more than 10 seconds (not a missed call)
      try {
        await sendTipJarFollowUp(callRecord, From);
      } catch (smsError) {
        console.error('Error sending TipJar follow-up:', smsError);
        // Don't fail the webhook if SMS fails
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in call webhook:', error);
    return res.status(200).send('OK'); // Always return 200 to Twilio
  }
}

async function sendTipJarFollowUp(callRecord, callerNumber) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get DJ profile info
  const { data: profile } = await supabase
    .from('dj_profiles')
    .select('dj_name, dj_slug')
    .eq('id', callRecord.dj_profile_id)
    .single();

  if (!profile) {
    throw new Error('DJ profile not found');
  }

  // Generate TipJar link (you'll need to implement this based on your TipJar setup)
  const tipjarLink = await generateTipJarLink(callRecord.dj_profile_id, callerNumber);

  // Send SMS via Twilio
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const message = `Thanks for calling ${profile.dj_name}! 🎵\n\n` +
    `Secure your booking with a deposit: ${tipjarLink}\n\n` +
    `Or fill out our event form: https://djdash.net/dj/${profile.dj_slug}#inquiry-form`;

  await twilioClient.messages.create({
    body: message,
    from: callRecord.virtual_number,
    to: callerNumber
  });

  // Update call record
  await supabase
    .from('dj_calls')
    .update({
      tipjar_link_sent: true,
      tipjar_link: tipjarLink
    })
    .eq('id', callRecord.id);
}

async function generateTipJarLink(djProfileId, callerNumber) {
  // This should integrate with your TipJar system
  // For now, return a placeholder link
  // You'll need to implement actual TipJar session creation
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djdash.net';
  return `${baseUrl}/tipjar/dj/${djProfileId}?caller=${encodeURIComponent(callerNumber)}`;
}










