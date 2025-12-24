// API endpoint to download audio from YouTube links (SUPER ADMIN ONLY)
// This endpoint can either:
// 1. Use dedicated download server (if DOWNLOAD_SERVER_URL is set)
// 2. Fall back to local download (if in non-serverless environment)
import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/utils/env-validator';
import { downloadYouTubeAudio, isValidYouTubeUrl } from '@/utils/youtube-audio-downloader';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // SUPER ADMIN ONLY
    const user = await requireSuperAdmin(req, res);
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }

    const { requestId, youtubeUrl } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'requestId is required' });
    }

    if (!youtubeUrl) {
      return res.status(400).json({ error: 'youtubeUrl is required' });
    }

    if (!isValidYouTubeUrl(youtubeUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch request details
    const { data: request, error: fetchError } = await supabase
      .from('crowd_requests')
      .select('id, song_title, song_artist, posted_link, audio_download_status')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Check if already downloaded
    if (request.audio_download_status === 'completed') {
      // Fetch the current download URL
      const { data: currentRequest } = await supabase
        .from('crowd_requests')
        .select('downloaded_audio_url')
        .eq('id', requestId)
        .single();

      return res.status(200).json({
        success: true,
        message: 'Audio already downloaded',
        url: currentRequest?.downloaded_audio_url,
      });
    }

    // Check if dedicated download server is configured
    const downloadServerUrl = process.env.DOWNLOAD_SERVER_URL;
    const downloadServerApiKey = process.env.DOWNLOAD_SERVER_API_KEY;

    // Update status to processing
    await supabase
      .from('crowd_requests')
      .update({
        audio_download_status: 'processing',
        audio_download_error: null,
      })
      .eq('id', requestId);

    let result;

    // Use dedicated server if configured, otherwise try local download
    if (downloadServerUrl) {
      console.log('Using dedicated download server:', downloadServerUrl);
      
      try {
        const serverResponse = await fetch(`${downloadServerUrl}/api/download-youtube-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': downloadServerApiKey || '',
          },
          body: JSON.stringify({
            requestId,
            youtubeUrl,
            songTitle: request.song_title || undefined,
            songArtist: request.song_artist || undefined,
          }),
        });

        // Check if response is JSON before parsing
        const contentType = serverResponse.headers.get('content-type');
        let serverData;
        
        if (contentType && contentType.includes('application/json')) {
          serverData = await serverResponse.json();
        } else {
          // Response is not JSON (likely HTML error page)
          const textResponse = await serverResponse.text();
          console.error('Download server returned non-JSON response:', {
            status: serverResponse.status,
            statusText: serverResponse.statusText,
            contentType,
            preview: textResponse.substring(0, 200)
          });
          
          result = {
            success: false,
            error: `Download server error (${serverResponse.status}): ${serverResponse.statusText || 'Invalid response format'}`,
          };
          
          // Update status to failed
          await supabase
            .from('crowd_requests')
            .update({
              audio_download_status: 'failed',
              audio_download_error: result.error,
            })
            .eq('id', requestId);
          
          return res.status(500).json(result);
        }

        if (!serverResponse.ok) {
          result = {
            success: false,
            error: serverData.error || `Download server error (${serverResponse.status})`,
          };
        } else {
          result = {
            success: true,
            url: serverData.url,
            path: serverData.path,
          };
        }
      } catch (fetchError) {
        console.error('Error calling download server:', fetchError);
        result = {
          success: false,
          error: `Failed to connect to download server: ${fetchError.message}`,
        };
      }
    } else {
      // Fall back to local download (only works in non-serverless environments)
      console.log('Using local download (dedicated server not configured)');
      result = await downloadYouTubeAudio(
        youtubeUrl,
        requestId,
        request.song_title || undefined,
        request.song_artist || undefined
      );
    }

    if (!result.success) {
      // Update status to failed
      await supabase
        .from('crowd_requests')
        .update({
          audio_download_status: 'failed',
          audio_download_error: result.error || 'Unknown error',
        })
        .eq('id', requestId);

      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to download audio',
      });
    }

    // Update status to completed with download URL
    const { error: updateError } = await supabase
      .from('crowd_requests')
      .update({
        audio_download_status: 'completed',
        downloaded_audio_url: result.url,
        audio_download_error: null,
        audio_downloaded_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request:', updateError);
      // Audio was downloaded but update failed - still return success
    }

    return res.status(200).json({
      success: true,
      url: result.url,
      path: result.path,
      message: 'Audio downloaded successfully',
    });
  } catch (error) {
    // Error from requireSuperAdmin is already handled
    if (res.headersSent) {
      return;
    }

    console.error('YouTube audio download error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}

