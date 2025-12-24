# YouTube Audio Download Feature (Super Admin Only)

## Overview
This feature allows the super admin (djbenmurray@gmail.com) to download audio from YouTube links in crowd requests for use in external DJ software.

## Implementation Summary

### ✅ Completed

1. **Database Schema** (`supabase/migrations/20250127000002_add_youtube_audio_download_fields.sql`)
   - Added fields to `crowd_requests` table:
     - `downloaded_audio_url` - URL to the downloaded MP3 file
     - `audio_download_status` - Status: pending, processing, completed, failed
     - `audio_download_error` - Error message if download failed
     - `audio_downloaded_at` - Timestamp when audio was downloaded

2. **Backend Service** (`utils/youtube-audio-downloader.ts`)
   - YouTube URL validation and video ID extraction
   - Audio stream download using `ytdl-core`
   - Upload to Supabase Storage
   - Error handling for common YouTube errors (private videos, age restrictions, etc.)

3. **API Endpoint** (`pages/api/crowd-request/download-youtube-audio.js`)
   - Super admin authentication check
   - Validates YouTube URL
   - Processes download asynchronously
   - Updates database with download status and URL

4. **Super Admin Auth** (`utils/auth-helpers/super-admin.ts` & `utils/auth-helpers/api-auth.ts`)
   - `isSuperAdminEmail()` - Checks if email is super admin
   - `requireSuperAdmin()` - API middleware for super admin only routes

5. **Admin Dashboard UI** (`pages/admin/crowd-requests.tsx`)
   - Download button appears only for super admin
   - Shows download status (pending, processing, completed, failed)
   - Download button for completed downloads
   - Retry button for failed downloads
   - Displayed in request detail modal

## Setup Required

### 1. Run Database Migration
```bash
# Apply the migration
npx supabase migration up
# Or if using Supabase CLI locally
npx supabase db push
```

### 2. Verify Storage Bucket
The `crowd-requests` storage bucket should already exist (used by audio upload feature). Verify it exists in Supabase Dashboard:
- Go to Storage → Buckets
- Ensure `crowd-requests` bucket exists
- Ensure it has public access OR ensure service role key has access

If the bucket doesn't exist, create it:
```sql
-- In Supabase SQL Editor or via migration
INSERT INTO storage.buckets (id, name, public)
VALUES ('crowd-requests', 'crowd-requests', true);
```

### 3. Install Dependencies (Already Done)
```bash
npm install ytdl-core@latest
```
Note: `fluent-ffmpeg` was installed but not used - we're using ytdl-core's built-in audio extraction.

## Usage

1. **Access**: Log in as super admin (djbenmurray@gmail.com)
2. **Navigate**: Go to Admin → Crowd Requests
3. **Find Request**: Open a song request that has a YouTube link (in `posted_link` or `music_service_links.youtube`)
4. **Download**: Click "Download Audio as MP3" button
5. **Wait**: Processing status will show while downloading
6. **Download**: Once completed, click "Download MP3" to get the file

## Features

- **Super Admin Only**: Feature is only visible/accessible to djbenmurray@gmail.com
- **Automatic Status Tracking**: Tracks download status (pending → processing → completed/failed)
- **Error Handling**: Handles common YouTube errors (private videos, age restrictions, unavailable videos)
- **File Storage**: Files stored in Supabase Storage at `crowd-requests/youtube-audio/{requestId}/{filename}.mp3`
- **Retry Support**: Failed downloads can be retried with the retry button

## Technical Details

### File Naming
Files are named: `{timestamp}_{sanitized_song_name}.mp3`
- Timestamp ensures uniqueness
- Song name is sanitized (artist_title format if available)

### Storage Path
`crowd-requests/youtube-audio/{requestId}/{filename}.mp3`

### Audio Format
- Downloaded in highest quality audio-only format
- File extension is `.mp3` (actual format may vary based on YouTube source)
- Compatible with most DJ software

## Security & Legal Notes

⚠️ **Important**: This feature is for personal use only by the super admin. Downloading copyrighted content from YouTube may violate:
- YouTube Terms of Service
- Copyright laws
- Content licensing agreements

**Recommendation**: Only use for:
- Your own uploaded content
- Public domain content
- Content you have explicit rights to use

## Troubleshooting

### Download Fails
- Check YouTube URL is valid and accessible
- Verify video is not private or age-restricted
- Check Supabase Storage bucket permissions
- Review error message in the UI

### File Not Downloadable
- Check Supabase Storage bucket is set to public OR
- Ensure service role key has access to storage
- Verify file path in database matches storage path

### Feature Not Visible
- Ensure you're logged in as djbenmurray@gmail.com
- Check that request has a YouTube link
- Verify request type is 'song_request'

## Future Enhancements (Optional)

- Convert to actual MP3 format using ffmpeg
- Add download progress indicator
- Batch download for multiple requests
- Automatic cleanup of old downloads
- Signed URLs for private storage

