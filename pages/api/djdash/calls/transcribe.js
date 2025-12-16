import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

// Transcribe call recording using OpenAI Whisper
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { call_id, recording_url, recording_sid } = req.body;

    if (!call_id || !recording_url) {
      return res.status(400).json({ error: 'Missing required fields: call_id, recording_url' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Update transcription status to processing
    await supabase
      .from('dj_calls')
      .update({ transcription_status: 'processing' })
      .eq('id', call_id);

    // Download recording from Twilio
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    let audioBuffer;
    try {
      if (recording_sid) {
        // Use Twilio API to get recording
        const recording = await twilioClient.recordings(recording_sid).fetch();
        const audioResponse = await fetch(recording.uri.replace('.json', '.wav'));
        audioBuffer = await audioResponse.arrayBuffer();
      } else {
        // Fallback: download directly from URL
        const audioResponse = await fetch(recording_url);
        audioBuffer = await audioResponse.arrayBuffer();
      }
    } catch (downloadError) {
      console.error('Error downloading recording:', downloadError);
      await supabase
        .from('dj_calls')
        .update({ transcription_status: 'failed' })
        .eq('id', call_id);
      return res.status(500).json({ error: 'Failed to download recording' });
    }

    // Transcribe using OpenAI Whisper
    try {
      // Convert ArrayBuffer to Buffer for FormData
      const Buffer = require('buffer').Buffer;
      const FormData = require('form-data');
      
      const formData = new FormData();
      formData.append('file', Buffer.from(audioBuffer), {
        filename: 'recording.wav',
        contentType: 'audio/wav'
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'verbose_json');

      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        const errorText = await transcriptionResponse.text();
        console.error('OpenAI transcription error:', errorText);
        throw new Error(`OpenAI API error: ${transcriptionResponse.status}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcriptionText = transcriptionData.text || transcriptionData.transcript || '';
      const confidence = transcriptionData.segments?.length > 0
        ? transcriptionData.segments.reduce((sum, seg) => sum + (seg.avg_logprob || 0), 0) / transcriptionData.segments.length
        : null;

      // Extract metadata from transcription
      const { data: metadataResult } = await supabase.rpc('extract_call_metadata', {
        transcript_text: transcriptionText
      });

      const extractedMetadata = metadataResult || {};

      // Update call record with transcription
      const updates = {
        transcription_text: transcriptionText,
        transcription_status: 'completed',
        transcription_confidence: confidence ? Math.round(confidence * 100) / 100 : null,
        extracted_metadata: extractedMetadata,
        updated_at: new Date().toISOString()
      };

      // Auto-update event_type and lead_score from extracted metadata
      if (extractedMetadata.event_type) {
        updates.event_type = extractedMetadata.event_type;
      }

      if (extractedMetadata.budget && extractedMetadata.event_date) {
        updates.lead_score = 'hot';
      } else if (extractedMetadata.event_date || extractedMetadata.budget) {
        updates.lead_score = 'warm';
      }

      const { error: updateError } = await supabase
        .from('dj_calls')
        .update(updates)
        .eq('id', call_id);

      if (updateError) {
        console.error('Error updating transcription:', updateError);
        return res.status(500).json({ error: 'Failed to save transcription' });
      }

      // Trigger automated follow-ups
      try {
        await triggerAutomatedFollowUps(call_id, transcriptionText, extractedMetadata);
      } catch (followUpError) {
        console.error('Error triggering follow-ups:', followUpError);
        // Don't fail the request if follow-ups fail
      }

      return res.status(200).json({
        success: true,
        transcription: transcriptionText,
        metadata: extractedMetadata
      });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      await supabase
        .from('dj_calls')
        .update({ transcription_status: 'failed' })
        .eq('id', call_id);
      return res.status(500).json({ error: 'Transcription failed', details: transcriptionError.message });
    }
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function triggerAutomatedFollowUps(callId, transcriptionText, extractedMetadata) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get call record
  const { data: callRecord } = await supabase
    .from('dj_calls')
    .select('*, dj_profiles!inner(dj_name, dj_slug)')
    .eq('id', callId)
    .single();

  if (!callRecord || callRecord.tipjar_link_sent) {
    return; // Already sent or no record
  }

  // Only send if call was completed and has meaningful content
  if (callRecord.call_status !== 'completed' || !transcriptionText || transcriptionText.length < 50) {
    return;
  }

  // Generate TipJar link
  const tipjarLink = await generateTipJarLink(callRecord.dj_profile_id, callRecord.caller_number, extractedMetadata);

  // Send SMS with TipJar link
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  const message = buildFollowUpMessage(callRecord.dj_profiles.dj_name, tipjarLink, extractedMetadata);

  await twilioClient.messages.create({
    body: message,
    from: callRecord.virtual_number,
    to: callRecord.caller_number
  });

  // Update call record
  await supabase
    .from('dj_calls')
    .update({
      tipjar_link_sent: true,
      tipjar_link: tipjarLink
    })
    .eq('id', callId);

  // Send email confirmation if email is available
  // (You'll need to implement email lookup from caller number or extracted metadata)
}

function buildFollowUpMessage(djName, tipjarLink, metadata) {
  let message = `Thanks for calling ${djName}! 🎵\n\n`;

  if (metadata.event_type) {
    message += `I'd love to help with your ${metadata.event_type}!\n\n`;
  }

  message += `Secure your booking: ${tipjarLink}\n\n`;

  if (metadata.event_date) {
    message += `I see you mentioned ${metadata.event_date} - let's make it happen! 📅\n\n`;
  }

  message += `Or fill out our event form: https://djdash.net/dj/${djName.toLowerCase().replace(/\s+/g, '-')}#inquiry-form`;

  return message;
}

async function generateTipJarLink(djProfileId, callerNumber, metadata) {
  // This should integrate with your TipJar system
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://djdash.net';
  const params = new URLSearchParams({
    dj: djProfileId,
    caller: encodeURIComponent(callerNumber),
    ...(metadata.event_type && { event: metadata.event_type }),
    ...(metadata.event_date && { date: metadata.event_date })
  });
  return `${baseUrl}/tipjar/dj/${djProfileId}?${params.toString()}`;
}

