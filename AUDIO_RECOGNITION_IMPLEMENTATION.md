# 🎵 Audio Recognition Implementation Guide

## Overview

This document outlines the implementation of automatic song recognition using phone microphone audio analysis. The system can detect songs playing in real-time and automatically mark them as played in your event tracking system.

## ✅ What's Been Implemented

### 1. Database Schema (`songs_played` table)
- **Location**: `supabase/migrations/20251203000000_create_songs_played_tracking.sql`
- **Features**:
  - Tracks automatically detected songs
  - Links to events, contacts, and crowd_requests
  - Auto-matches detected songs to pending song requests
  - Stores recognition confidence scores
  - Supports manual overrides and false positive marking

### 2. API Endpoint (`/api/audio/recognize-song`)
- **Location**: `pages/api/audio/recognize-song.js`
- **Features**:
  - Accepts audio data (base64 or file)
  - Integrates with AudD API for recognition
  - Saves recognized songs to database
  - Returns song metadata (title, artist, streaming links)

### 3. React Component (`SongRecognition`)
- **Location**: `components/audio/SongRecognition.tsx`
- **Features**:
  - Real-time microphone capture
  - Processes audio in configurable chunks (default: 5 seconds)
  - Displays detected songs in real-time
  - Shows confidence scores and timestamps
  - Auto-saves to database

## 🚀 Setup Instructions

### Step 1: Get AudD API Token

1. Sign up at [audd.io](https://www.audd.io/)
2. Get your API token from the dashboard
3. Add to `.env.local`:
```env
AUDD_API_TOKEN=your_token_here
```

### Step 2: Run Database Migration

```bash
# Apply the migration
supabase migration up
# Or if using Supabase CLI directly:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20251203000000_create_songs_played_tracking.sql
```

### Step 3: Use the Component

```tsx
import SongRecognition from '@/components/audio/SongRecognition';

// In your event management page
<SongRecognition
  eventId={event.id}
  organizationId={organizationId}
  onSongDetected={(song) => {
    console.log('Detected:', song.title, 'by', song.artist);
  }}
  chunkDuration={5} // Process every 5 seconds
/>
```

## 📊 How It Works

### Audio Capture Flow

1. **User clicks "Start Listening"**
   - Requests microphone permission
   - Starts MediaRecorder with Web Audio API
   - Captures audio in chunks (default: 5 seconds)

2. **Audio Processing**
   - Each chunk is converted to base64
   - Sent to `/api/audio/recognize-song`
   - API calls AudD service
   - Returns song information if recognized

3. **Database Storage**
   - Recognized songs saved to `songs_played` table
   - Auto-matches to `crowd_requests` if found
   - Updates `crowd_requests.status` to 'played'

4. **UI Updates**
   - Detected songs displayed in real-time
   - Shows confidence scores
   - Links to Spotify/Apple Music if available

### Auto-Matching Logic

The database trigger `auto_mark_crowd_request_played()` automatically:
- Searches for matching `crowd_requests` by song title/artist
- Updates request status to 'played'
- Sets `played_at` timestamp
- Links the `songs_played` record to the matched request

## 🎯 Use Cases

### 1. Event Setlist Tracking
- DJs can automatically track which songs they've played
- Useful for post-event reports
- Helps avoid repeating songs

### 2. Request Verification
- Automatically marks paid song requests as played
- Provides proof that requested songs were actually played
- Reduces manual tracking overhead

### 3. Playlist Compliance
- Verify that client's "must-play" songs were played
- Track adherence to "do-not-play" lists
- Post-event analytics

## ⚠️ Important Considerations

### Privacy & Permissions
- **Microphone Access**: Users must grant microphone permission
- **Browser Support**: Works in Chrome, Firefox, Safari (latest versions)
- **Mobile**: May have limitations on mobile browsers (consider native app for better experience)

### Performance & Battery
- **Continuous Listening**: Can drain battery quickly
- **Recommendation**: Use during active events only
- **Chunk Duration**: Longer chunks = less API calls but slower detection

### Accuracy
- **Background Noise**: May affect recognition accuracy
- **Volume**: Works best with clear audio
- **Confidence Scores**: Use threshold (e.g., >0.7) to filter low-confidence matches

### API Costs
- **AudD Pricing**: Check current pricing at audd.io
- **Free Tier**: Usually includes limited requests/month
- **Recommendation**: Monitor usage and set up billing alerts

## 🔧 Customization Options

### Adjust Chunk Duration
```tsx
<SongRecognition
  chunkDuration={10} // Process every 10 seconds (slower but fewer API calls)
/>
```

### Filter by Confidence
Modify the API endpoint to only save songs above a certain confidence threshold:

```javascript
// In pages/api/audio/recognize-song.js
const MIN_CONFIDENCE = 0.7; // Only save if confidence > 70%

if (confidence && confidence < MIN_CONFIDENCE) {
  return res.status(200).json({
    success: false,
    message: 'Confidence too low',
    confidence
  });
}
```

### Use Different Recognition Service

**ShazamKit** (Native iOS/macOS):
- Better for native apps
- Requires React Native or native development
- More accurate, but platform-specific

**ACRCloud**:
- Similar to AudD
- May have different pricing
- Check their SDK documentation

## 🐛 Troubleshooting

### "Microphone permission denied"
- Check browser settings
- Ensure HTTPS (required for microphone access)
- Try different browser

### "No song recognized"
- Normal - not every audio chunk will have music
- Check audio quality/volume
- Verify API token is correct

### "API error"
- Check AudD API token in environment variables
- Verify API quota hasn't been exceeded
- Check network connectivity

## 📈 Next Steps

### Phase 2 Enhancements
1. **Native Mobile App**: React Native with ShazamKit for better mobile experience
2. **Custom Catalog**: Build custom catalog from event playlists for faster matching
3. **Analytics Dashboard**: Show song detection stats, accuracy metrics
4. **Batch Processing**: Process multiple audio files after event
5. **Integration**: Connect with DJ software (Serato, Rekordbox) for automatic tracking

### Cross-Product Considerations
- **DJDash.net**: DJs can track their sets automatically
- **M10DJCompany.com**: Event managers can verify playlist compliance
- **TipJar.live**: Could track songs during live streams (future feature)

## 🔒 Security & Data Isolation

- All RLS policies enforce organization-level isolation
- Songs are linked to specific events/organizations
- Platform admins can view all data (for support)
- Regular users only see their organization's data

## 📝 Testing Checklist

- [ ] Microphone permission request works
- [ ] Audio capture starts/stops correctly
- [ ] API endpoint recognizes test songs
- [ ] Songs save to database correctly
- [ ] Auto-matching works for crowd_requests
- [ ] UI displays detected songs
- [ ] RLS policies prevent cross-organization access
- [ ] Battery usage is acceptable
- [ ] Works on mobile browsers (if applicable)

## 💡 Tips for Best Results

1. **Position Phone**: Place phone near speakers for better audio capture
2. **Reduce Background Noise**: Works best in quieter environments
3. **Test First**: Try with known songs to verify setup
4. **Monitor Costs**: Track API usage, especially during peak events
5. **Manual Override**: Always allow DJs to manually mark songs if recognition fails

---

**Questions?** Check the code comments or reach out for support.

