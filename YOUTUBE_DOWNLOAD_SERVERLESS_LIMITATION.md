# YouTube Audio Download - Serverless Limitation

## Issue
The YouTube audio download feature uses `yt-dlp` which requires:
- Python 3.7+
- FFmpeg
- Ability to download and execute binaries
- Write access to filesystem for temporary files

**These requirements are NOT available in serverless environments (Vercel, AWS Lambda, etc.)**

## Current Status
- ✅ Works in local development (if Python and FFmpeg are installed)
- ❌ Does NOT work in Vercel serverless functions
- ❌ Does NOT work in other serverless environments

## Error Message
When attempting to download in serverless, users will see:
> "YouTube audio download is not available in this environment. This feature requires a server with Python and yt-dlp installed. Please contact support for server configuration."

## Solutions

### Option 1: Use a Dedicated Server (Recommended)
Deploy the download endpoint to a dedicated server (not serverless) that has:
- Python 3.7+ installed
- FFmpeg installed
- yt-dlp binary available
- Write access for temporary files

### Option 2: Use an External Service
- Use a third-party API service for YouTube downloads
- Examples: RapidAPI, YouTube Downloader APIs
- Requires API key and may have costs

### Option 3: Client-Side Download (Not Recommended)
- Download in the browser using JavaScript
- Privacy/security concerns
- May violate YouTube ToS

### Option 4: Disable Feature in Serverless
- Hide the download button in serverless environments
- Show a message explaining the limitation

## Implementation Notes
The code now detects serverless environments and provides a clear error message instead of crashing.

## Future Improvements
Consider implementing Option 1 (dedicated server) or Option 2 (external API) for production use.

