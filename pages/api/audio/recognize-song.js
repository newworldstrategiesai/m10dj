// API endpoint for audio recognition using AudD API
// Accepts audio file or base64 encoded audio data
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      audioData, // Base64 encoded audio or file buffer
      eventId, 
      contactId,
      organizationId,
      audioFormat = 'mp3' // mp3, wav, m4a, etc.
    } = req.body;

    if (!audioData) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Allow detection without eventId/contactId if organizationId is provided
    if (!eventId && !contactId && !organizationId) {
      return res.status(400).json({ error: 'Either eventId, contactId, or organizationId is required' });
    }

    // Check if audio tracking is enabled for this event
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('audio_tracking_enabled')
        .eq('id', eventId)
        .single();

      if (eventError) {
        console.error('Error checking event:', eventError);
        // Continue anyway - don't block if we can't check
      } else if (event && event.audio_tracking_enabled === false) {
        return res.status(403).json({ 
          error: 'Audio tracking is disabled for this event',
          message: 'Please enable audio tracking in the event settings to use this feature'
        });
      }
    }

    // AudD API configuration
    const AUDD_API_URL = 'https://api.audd.io/';
    const AUDD_API_TOKEN = process.env.AUDD_API_TOKEN;

    if (!AUDD_API_TOKEN) {
      return res.status(500).json({ 
        error: 'AudD API token not configured',
        message: 'Please set AUDD_API_TOKEN in environment variables'
      });
    }

    // Prepare audio data for AudD
    // AudD accepts base64 encoded audio or file uploads
    let audioPayload;
    
    if (typeof audioData === 'string' && audioData.startsWith('data:')) {
      // Remove data URL prefix if present
      const base64Data = audioData.split(',')[1] || audioData;
      audioPayload = base64Data;
    } else if (typeof audioData === 'string') {
      // Assume it's already base64
      audioPayload = audioData;
    } else {
      // Convert buffer to base64
      audioPayload = Buffer.from(audioData).toString('base64');
    }

    // Call AudD API
    const formData = new FormData();
    const audioBlob = Buffer.from(audioPayload, 'base64');
    formData.append('audio', audioBlob, `audio.${audioFormat}`);
    formData.append('api_token', AUDD_API_TOKEN);
    formData.append('return', 'apple_music,spotify,deezer'); // Get streaming links too

    const auddResponse = await fetch(AUDD_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!auddResponse.ok) {
      const errorText = await auddResponse.text();
      console.error('AudD API error:', errorText);
      return res.status(auddResponse.status).json({ 
        error: 'Audio recognition failed',
        details: errorText 
      });
    }

    const recognitionResult = await auddResponse.json();

    // Check if song was recognized
    if (recognitionResult.status !== 'success' || !recognitionResult.result) {
      return res.status(200).json({
        success: false,
        message: 'No song recognized',
        recognitionResult
      });
    }

    const songInfo = recognitionResult.result;
    const songTitle = songInfo.title || 'Unknown';
    const songArtist = songInfo.artist || 'Unknown';
    const confidence = songInfo.score ? parseFloat(songInfo.score) / 100 : null;

    // Save to songs_played table
    const { data: savedSong, error: saveError } = await supabase
      .from('songs_played')
      .insert({
        event_id: eventId || null,
        contact_id: contactId || null,
        organization_id: organizationId || null,
        song_title: songTitle,
        song_artist: songArtist,
        recognition_confidence: confidence,
        recognition_service: 'audd',
        audio_sample_duration_seconds: songInfo.timecode ? parseInt(songInfo.timecode) : null,
        recognition_response: recognitionResult,
        is_manual_entry: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving song to database:', saveError);
      // Still return the recognition result even if save fails
    }

    // Return recognition result
    return res.status(200).json({
      success: true,
      song: {
        title: songTitle,
        artist: songArtist,
        confidence: confidence,
        album: songInfo.album || null,
        releaseDate: songInfo.release_date || null,
        spotifyUrl: songInfo.spotify?.external_urls?.spotify || null,
        appleMusicUrl: songInfo.apple_music?.url || null,
        deezerUrl: songInfo.deezer?.link || null,
      },
      savedToDatabase: !saveError,
      songId: savedSong?.id || null,
      recognitionResult: recognitionResult
    });

  } catch (error) {
    console.error('Audio recognition error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Disable body parsing for file uploads (Next.js default)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Allow up to 10MB audio files
    },
  },
};

