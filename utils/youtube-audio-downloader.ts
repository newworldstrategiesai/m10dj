/**
 * YouTube Audio Downloader Service
 * Downloads audio from YouTube videos and converts to MP3
 * SUPER ADMIN ONLY - For personal use in DJ software
 * 
 * Uses yt-dlp via yt-dlp-wrap for maximum reliability
 * yt-dlp is actively maintained and handles YouTube API changes better than ytdl-core
 */

// yt-dlp-wrap uses CommonJS export
// @ts-ignore - yt-dlp-wrap doesn't have TypeScript definitions
const YTDlpWrap = require('yt-dlp-wrap').default;
import { createClient } from '@supabase/supabase-js';
import { getEnv } from './env-validator';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

// Initialize yt-dlp wrapper (will auto-download binary if needed)
let ytDlpWrap: any | null = null;

/**
 * Check if we're in a serverless environment
 */
function isServerless(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.GOOGLE_CLOUD_FUNCTION ||
    process.env.AZURE_FUNCTIONS_ENVIRONMENT ||
    process.env.NEXT_RUNTIME === 'nodejs'
  );
}

/**
 * Get or initialize yt-dlp wrapper
 */
async function getYtDlpWrap(): Promise<any> {
  // Check if we're in serverless - yt-dlp won't work there
  if (isServerless()) {
    throw new Error('yt-dlp is not available in serverless environments. This feature requires a server with Python and yt-dlp installed.');
  }

  if (ytDlpWrap) {
    return ytDlpWrap;
  }

  // Use yt-dlp-wrap's binary downloader to ensure we have the latest version
  // It will download the binary to a cache directory if not present
  ytDlpWrap = new YTDlpWrap();
  
  // Check if binary exists, if not, download it
  try {
    await ytDlpWrap.getBinaryPath();
  } catch (error) {
    console.log('Downloading yt-dlp binary...');
    try {
      // The library will auto-download on first use, but we can also explicitly download
      await ytDlpWrap.downloadBinary();
    } catch (downloadError: any) {
      throw new Error(`Failed to download yt-dlp binary: ${downloadError.message}. This feature requires Python and write access to download the binary.`);
    }
  }

  return ytDlpWrap;
}

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url: string): string | null {
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

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Download audio from YouTube video and upload to Supabase Storage
 */
export async function downloadYouTubeAudio(
  youtubeUrl: string,
  requestId: string,
  songTitle?: string,
  songArtist?: string
): Promise<DownloadResult> {
  let tempFilePath: string | null = null;

  try {
    // Validate URL
    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      return {
        success: false,
        error: 'Invalid YouTube URL',
      };
    }

    // Get yt-dlp wrapper
    const ytdlp = await getYtDlpWrap();

    // Get video info first to get the title
    console.log('Fetching video info...');
    const videoInfo = await ytdlp.getVideoInfo(youtubeUrl);
    const videoTitle = videoInfo.title || songTitle || 'Unknown';

    // Generate filename
    const sanitizeFilename = (text: string) => {
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

    // Create temp directory for download
    const tempDir = path.join(os.tmpdir(), 'youtube-audio-downloads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // yt-dlp will add the extension automatically, so we provide a template
    // Use %(ext)s placeholder for extension, but since we're converting to MP3, it will be .mp3
    const outputTemplate = path.join(tempDir, `${baseFilename}.%(ext)s`);
    // Final path will be with .mp3 extension
    tempFilePath = path.join(tempDir, `${baseFilename}.mp3`);

    console.log('Downloading audio from YouTube...');

    // Download audio as MP3 using yt-dlp
    // Options:
    // -f 'bestaudio[ext=m4a]/bestaudio' - best audio format
    // -x --audio-format mp3 - extract audio and convert to MP3
    // --audio-quality 0 - best quality (0 = best, 9 = worst)
    // -o - output file path template
    await new Promise<void>((resolve, reject) => {
      const ytDlpEventEmitter = ytdlp
        .exec([
          youtubeUrl,
          '-f', 'bestaudio[ext=m4a]/bestaudio/best',
          '-x', // Extract audio
          '--audio-format', 'mp3', // Convert to MP3
          '--audio-quality', '0', // Best quality
          '-o', outputTemplate, // Output file template (yt-dlp will add extension)
          '--no-playlist', // Don't download playlists
          '--no-warnings', // Suppress warnings
          '--quiet', // Less verbose output
        ])
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`Download progress: ${progress.percent}%`);
          }
        })
        .on('ytDlpEvent', (eventType: string, eventData: any) => {
          console.log(`yt-dlp event: ${eventType}`, eventData);
        })
        .on('error', (error: any) => {
          console.error('yt-dlp error:', error);
          reject(new Error(`Download failed: ${error.message || error}`));
        })
        .on('close', (code: number | null) => {
          if (code === 0) {
            console.log('Download completed successfully');
            resolve();
          } else {
            reject(new Error(`yt-dlp exited with code ${code}`));
          }
        });
    });

    // Check if file was created (yt-dlp might use slightly different extension)
    // Try the expected path first, then check for any file with the base name
    if (!fs.existsSync(tempFilePath)) {
      // Try to find the actual file (might have different extension)
      const files = fs.readdirSync(tempDir);
      const matchingFile = files.find(f => f.startsWith(baseFilename));
      
      if (matchingFile) {
        tempFilePath = path.join(tempDir, matchingFile);
        console.log(`Found downloaded file with different extension: ${matchingFile}`);
      } else {
        return {
          success: false,
          error: 'Downloaded file not found',
        };
      }
    }

    // Read the downloaded file into a buffer
    const audioBuffer = fs.readFileSync(tempFilePath);
    const fileSize = audioBuffer.length;

    if (fileSize === 0) {
      return {
        success: false,
        error: 'Downloaded file is empty',
      };
    }

    console.log(`Downloaded ${fileSize} bytes of audio`);

    // Upload to Supabase Storage
    const env = getEnv();
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Use the actual filename from the downloaded file (ensures correct extension)
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

    // Get public URL (or signed URL for private storage)
    const { data: urlData } = supabase.storage
      .from('crowd-requests')
      .getPublicUrl(filePath);

    console.log('Audio uploaded successfully:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    console.error('YouTube download error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    });
    
    let errorMessage = 'Failed to download audio';
    
    // Handle serverless/environment errors
    if (error.message?.includes('ENOENT') || error.message?.includes('spawn yt-dlp')) {
      errorMessage = 'YouTube audio download is not available in this environment. This feature requires a server with Python and yt-dlp installed. Please contact support for server configuration.';
    } else if (error.message?.includes('serverless')) {
      errorMessage = 'YouTube audio download is not available in serverless environments. This feature requires a dedicated server.';
    } else if (error.message?.includes('Private video') || error.message?.includes('private')) {
      errorMessage = 'Video is private and cannot be downloaded';
    } else if (error.message?.includes('Video unavailable') || error.message?.includes('unavailable')) {
      errorMessage = 'Video is unavailable or has been removed';
    } else if (error.message?.includes('age') || error.message?.includes('restricted')) {
      errorMessage = 'Video is age-restricted and cannot be downloaded';
    } else if (error.message?.includes('region') || error.message?.includes('not available')) {
      errorMessage = 'Video is not available in your region or has been removed';
    } else if (error.message?.includes('copyright') || error.message?.includes('blocked')) {
      errorMessage = 'Video is blocked due to copyright restrictions';
    } else if (error.message) {
      errorMessage = `Failed to download audio: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Cleaned up temp file:', tempFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
  }
}
