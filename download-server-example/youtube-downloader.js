// Copy this from utils/youtube-audio-downloader.ts
// This is a simplified version for the dedicated server

const YTDlpWrap = require('yt-dlp-wrap').default;
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const os = require('os');

let ytDlpWrap = null;

async function getYtDlpWrap() {
  if (ytDlpWrap) {
    return ytDlpWrap;
  }

  ytDlpWrap = new YTDlpWrap();
  
  try {
    // Check if binary exists
    const binaryPath = ytDlpWrap.getBinaryPath();
    if (fs.existsSync(binaryPath)) {
      console.log('yt-dlp binary found at:', binaryPath);
    } else {
      throw new Error('Binary not found');
    }
  } catch (error) {
    console.log('yt-dlp binary not found, downloading...');
    try {
      await ytDlpWrap.downloadBinary();
      console.log('yt-dlp binary downloaded successfully');
      
      // Verify it exists after download
      const binaryPath = ytDlpWrap.getBinaryPath();
      if (!fs.existsSync(binaryPath)) {
        throw new Error('Binary download completed but file not found');
      }
      
      // Make it executable (Unix systems)
      if (process.platform !== 'win32') {
        fs.chmodSync(binaryPath, '755');
      }
    } catch (downloadError) {
      console.error('Failed to download yt-dlp binary:', downloadError);
      throw new Error(`Failed to setup yt-dlp: ${downloadError.message}. Make sure Python and FFmpeg are available.`);
    }
  }

  return ytDlpWrap;
}

function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function downloadYouTubeAudio(youtubeUrl, requestId, songTitle, songArtist) {
  let tempFilePath = null;

  try {
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL',
      };
    }

    const ytdlp = await getYtDlpWrap();

    console.log('Fetching video info...');
    const videoInfo = await ytdlp.getVideoInfo(youtubeUrl);
    const videoTitle = videoInfo.title || songTitle || 'Unknown';

    const sanitizeFilename = (text) => {
      return text
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
    };

    const songName = songTitle && songArtist 
      ? `${songArtist}_${songTitle}`
      : videoTitle;
    const timestamp = Date.now();
    const baseFilename = `${timestamp}_${sanitizeFilename(songName)}`;

    const tempDir = path.join(os.tmpdir(), 'youtube-audio-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputTemplate = path.join(tempDir, `${baseFilename}.%(ext)s`);
    tempFilePath = path.join(tempDir, `${baseFilename}.mp3`);

    console.log('Downloading audio from YouTube...');

    await new Promise((resolve, reject) => {
      ytdlp
        .exec([
          youtubeUrl,
          '-f', 'bestaudio[ext=m4a]/bestaudio/best',
          '-x',
          '--audio-format', 'mp3',
          '--audio-quality', '0',
          '-o', outputTemplate,
          '--no-playlist',
          '--no-warnings',
          '--quiet',
        ])
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Download progress: ${progress.percent}%`);
          }
        })
        .on('error', (error) => {
          console.error('yt-dlp error:', error);
          reject(new Error(`Download failed: ${error.message || error}`));
        })
        .on('close', (code) => {
          if (code === 0) {
            console.log('Download completed successfully');
            resolve();
          } else {
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });
    });

    if (!fs.existsSync(tempFilePath)) {
      const files = fs.readdirSync(tempDir);
      const matchingFile = files.find(f => f.startsWith(baseFilename));
      
      if (matchingFile) {
        tempFilePath = path.join(tempDir, matchingFile);
        console.log(`Found downloaded file: ${matchingFile}`);
      } else {
        return {
          success: false,
          error: 'Downloaded file not found',
        };
      }
    }

    const audioBuffer = fs.readFileSync(tempFilePath);
    const fileSize = audioBuffer.length;

    if (fileSize === 0) {
      return {
        success: false,
        error: 'Downloaded file is empty',
      };
    }

    console.log(`Downloaded ${fileSize} bytes of audio`);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const actualFilename = path.basename(tempFilePath);
    const filePath = `crowd-requests/youtube-audio/${requestId}/${actualFilename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('crowd-requests')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return {
        success: false,
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    const { data: urlData } = supabase.storage
      .from('crowd-requests')
      .getPublicUrl(filePath);

    console.log('Audio uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('YouTube download error:', error);
    
    let errorMessage = 'Failed to download audio';
    
    if (error.message?.includes('Private video') || error.message?.includes('private')) {
      errorMessage = 'Video is private and cannot be downloaded';
    } else if (error.message?.includes('Video unavailable') || error.message?.includes('unavailable')) {
      errorMessage = 'Video is unavailable or has been removed';
    } else if (error.message?.includes('age') || error.message?.includes('restricted')) {
      errorMessage = 'Video is age-restricted and cannot be downloaded';
    } else if (error.message) {
      errorMessage = `Failed to download audio: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Cleaned up temp file');
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  }
}

module.exports = { downloadYouTubeAudio, getYtDlpWrap };

