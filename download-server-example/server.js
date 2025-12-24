const express = require('express');
const cors = require('cors');
const { downloadYouTubeAudio } = require('./youtube-downloader');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const API_KEY = process.env.DOWNLOAD_SERVER_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Pre-initialize yt-dlp on startup (non-blocking)
const { getYtDlpWrap } = require('./youtube-downloader');
(async () => {
  try {
    await getYtDlpWrap();
    console.log('✅ yt-dlp initialized successfully');
  } catch (error) {
    console.warn('⚠️  yt-dlp initialization warning:', error.message);
    console.warn('   Downloads will still be attempted, but may fail if yt-dlp is not available');
  }
})();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'youtube-download-server'
  });
});

// Download endpoint
app.post('/api/download-youtube-audio', async (req, res) => {
  try {
    // Authenticate
    const providedKey = req.headers['x-api-key'];
    if (API_KEY && providedKey !== API_KEY) {
      return res.status(401).json({ error: 'Unauthorized - Invalid API key' });
    }

    const { requestId, youtubeUrl, songTitle, songArtist } = req.body;
    
    // Validate request
    if (!requestId || !youtubeUrl) {
      return res.status(400).json({ error: 'Missing required fields: requestId and youtubeUrl' });
    }

    console.log(`[${new Date().toISOString()}] Download request:`, { requestId, youtubeUrl });

    // Update status to processing
    await supabase
      .from('crowd_requests')
      .update({ 
        audio_download_status: 'processing',
        audio_download_error: null
      })
      .eq('id', requestId);

    // Download audio
    const result = await downloadYouTubeAudio(
      youtubeUrl,
      requestId,
      songTitle,
      songArtist
    );

    if (!result.success) {
      console.error(`[${new Date().toISOString()}] Download failed:`, result.error);
      
      // Update status to failed
      await supabase
        .from('crowd_requests')
        .update({
          audio_download_status: 'failed',
          audio_download_error: result.error
        })
        .eq('id', requestId);

      return res.status(500).json({ 
        success: false,
        error: result.error 
      });
    }

    console.log(`[${new Date().toISOString()}] Download successful:`, result.url);

    // Update status to completed
    await supabase
      .from('crowd_requests')
      .update({
        audio_download_status: 'completed',
        downloaded_audio_url: result.url,
        audio_download_error: null,
        audio_downloaded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    res.json({
      success: true,
      url: result.url,
      path: result.path
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 YouTube Download Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  if (!API_KEY) {
    console.warn('⚠️  WARNING: No API key set! Server is open to all requests.');
  }
});

