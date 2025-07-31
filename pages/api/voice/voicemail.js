// Handle voicemail transcriptions from Twilio
import { sendAdminSMS } from '../../../utils/sms-helper';

export default async function handler(req, res) {
  const { 
    RecordingUrl, 
    TranscriptionText, 
    From, 
    To, 
    CallSid,
    RecordingStatus 
  } = req.body;

  try {
    // Send SMS notification about the voicemail
    if (RecordingStatus === 'completed') {
      const message = `📞 NEW VOICEMAIL - M10 DJ Company

From: ${From}
${TranscriptionText ? `Message: ${TranscriptionText}` : 'Transcription not available'}

Listen: ${RecordingUrl}
Call ID: ${CallSid}

Reply to this number to respond via SMS.`;

      await sendAdminSMS(message);
      console.log('Voicemail notification sent via SMS');
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing voicemail:', error);
    res.status(500).json({ error: 'Failed to process voicemail' });
  }
}