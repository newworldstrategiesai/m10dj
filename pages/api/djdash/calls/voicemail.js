import { createClient } from '@supabase/supabase-js';

// Twilio webhook for voicemail transcription
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
      TranscriptionText,
      RecordingUrl
    } = req.body;

    // Find the call record
    const { data: callRecord, error: findError } = await supabase
      .from('dj_calls')
      .select('*')
      .eq('call_sid', CallSid)
      .single();

    if (findError || !callRecord) {
      console.log('Call record not found for voicemail:', CallSid);
      return res.status(200).send('OK');
    }

    // Update call record with voicemail info
    const notes = [
      callRecord.notes,
      TranscriptionText ? `Voicemail: ${TranscriptionText}` : null,
      RecordingUrl ? `Recording: ${RecordingUrl}` : null
    ].filter(Boolean).join('\n\n');

    await supabase
      .from('dj_calls')
      .update({
        call_status: 'voicemail',
        notes: notes || callRecord.notes
      })
      .eq('call_sid', CallSid);

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in voicemail webhook:', error);
    return res.status(200).send('OK'); // Always return 200 to Twilio
  }
}





