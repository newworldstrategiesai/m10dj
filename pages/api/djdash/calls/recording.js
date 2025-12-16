import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Twilio webhook for call recording completion
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
      RecordingSid,
      RecordingUrl,
      RecordingDuration,
      RecordingStatus
    } = req.body;

    console.log('📼 Recording webhook received:', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingDuration
    });

    if (RecordingStatus !== 'completed') {
      return res.status(200).send('OK');
    }

    // Find the call record
    const { data: callRecord, error: findError } = await supabase
      .from('dj_calls')
      .select('*')
      .eq('call_sid', CallSid)
      .single();

    if (findError || !callRecord) {
      console.error('Call record not found for recording:', CallSid);
      return res.status(200).send('OK');
    }

    // Download and store recording in Supabase Storage
    let storagePath = null;
    try {
      storagePath = await downloadAndStoreRecording(
        RecordingUrl,
        RecordingSid,
        callRecord.dj_profile_id
      );
    } catch (storageError) {
      console.error('Error storing recording:', storageError);
      // Continue even if storage fails - we still have the Twilio URL
    }

    // Update call record with recording info
    const updates = {
      recording_url: RecordingUrl,
      recording_sid: RecordingSid,
      recording_duration_seconds: RecordingDuration ? parseInt(RecordingDuration) : null,
      recording_storage_path: storagePath,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('dj_calls')
      .update(updates)
      .eq('call_sid', CallSid);

    if (updateError) {
      console.error('Error updating call record with recording:', updateError);
    }

    // Trigger transcription if recording is available
    if (RecordingUrl && process.env.OPENAI_API_KEY) {
      try {
        // Queue transcription job (don't wait for it)
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/djdash/calls/transcribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            call_id: callRecord.id,
            recording_url: RecordingUrl,
            recording_sid: RecordingSid
          })
        }).catch(err => console.error('Error triggering transcription:', err));
      } catch (transcribeError) {
        console.error('Error queuing transcription:', transcribeError);
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in recording webhook:', error);
    return res.status(200).send('OK'); // Always return 200 to Twilio
  }
}

async function downloadAndStoreRecording(recordingUrl, recordingSid, djProfileId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Download recording from Twilio
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const recording = await twilioClient.recordings(recordingSid).fetch();
  const recordingResponse = await fetch(recording.uri.replace('.json', '.wav'));
  const recordingData = await recordingResponse.arrayBuffer();

  // Upload to Supabase Storage
  const fileName = `${djProfileId}/${recordingSid}.wav`;
  const { data, error } = await supabase.storage
    .from('dj-call-recordings')
    .upload(fileName, recordingData, {
      contentType: 'audio/wav',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('dj-call-recordings')
    .getPublicUrl(fileName);

  return publicUrl;
}

