# 📞🎙️ DJ Dash Call Recording & AI Transcription System

## Overview

This system extends the DJ Dash call tracking with full call recording, AI-powered transcription using OpenAI Whisper, automatic metadata extraction, and intelligent lead scoring.

## Features

✅ **Call Recording** - All calls are automatically recorded via Twilio  
✅ **Cloud Storage** - Recordings stored securely in Supabase Storage  
✅ **AI Transcription** - OpenAI Whisper transcribes all recordings  
✅ **Metadata Extraction** - Automatically extracts event type, date, budget, guest count  
✅ **Auto Lead Scoring** - Updates lead score based on extracted metadata  
✅ **Automated Follow-ups** - Sends TipJar links and confirmations after calls  
✅ **Legal Compliance** - Automated consent notices for call recording  
✅ **Dashboard Analytics** - Comprehensive transcription and recording analytics  

## Database Schema Updates

### New Columns in `dj_calls` Table

- `recording_url` (text) - URL to the call recording file
- `recording_sid` (text) - Twilio Recording SID
- `recording_duration_seconds` (integer) - Duration of recording
- `transcription_text` (text) - Full transcription of the call
- `transcription_status` (text) - 'pending', 'processing', 'completed', 'failed'
- `transcription_confidence` (decimal) - Confidence score from Whisper
- `extracted_metadata` (jsonb) - Extracted metadata (event_type, event_date, budget, guest_count)
- `recording_storage_path` (text) - Path in Supabase Storage
- `recording_storage_bucket` (text) - Storage bucket name (default: 'dj-call-recordings')
- `consent_recorded` (boolean) - Whether caller consent was recorded
- `consent_timestamp` (timestamptz) - When consent was given

### Database Functions

**`extract_call_metadata(transcript_text TEXT)`**
- Extracts event type, date, budget, and guest count from transcription
- Returns JSONB object with extracted data

**`auto_extract_call_metadata()`**
- Trigger function that automatically extracts metadata when transcription completes
- Updates `event_type` and `lead_score` based on extracted data

## API Endpoints

### POST `/api/djdash/calls/recording`
Twilio webhook for call recording completion.

**Webhook Payload:**
```
CallSid, RecordingSid, RecordingUrl, RecordingDuration, RecordingStatus
```

**Process:**
1. Downloads recording from Twilio
2. Stores in Supabase Storage
3. Updates call record with recording info
4. Triggers transcription job

### POST `/api/djdash/calls/transcribe`
Transcribes call recording using OpenAI Whisper.

**Request Body:**
```json
{
  "call_id": "uuid",
  "recording_url": "https://...",
  "recording_sid": "RExxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "transcription": "Full transcription text...",
  "metadata": {
    "event_type": "wedding",
    "event_date": "June 15, 2024",
    "budget": "$2000",
    "guest_count": "150 people"
  }
}
```

## Setup Instructions

### 1. Database Migration
Run the migration to add new columns and functions:
```bash
# Migration: supabase/migrations/20250215000001_add_call_recording_transcription.sql
```

### 2. Supabase Storage Setup

Create a storage bucket for call recordings:

```sql
-- Create bucket (run in Supabase SQL editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dj-call-recordings', 'dj-call-recordings', false);

-- Set up RLS policies
CREATE POLICY "DJs can view their own recordings"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dj-call-recordings' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM dj_profiles
    WHERE organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  )
);
```

Or via Supabase Dashboard:
1. Go to Storage → Create Bucket
2. Name: `dj-call-recordings`
3. Public: No (private bucket)
4. Add RLS policies for DJ access

### 3. Twilio Configuration

Update Twilio webhook settings:

1. **Voice Webhook URL**: `https://yourdomain.com/api/djdash/calls/incoming`
2. **Recording Status Callback**: `https://yourdomain.com/api/djdash/calls/recording`

The system automatically:
- Plays legal compliance notice before recording
- Records all calls forwarded to DJs
- Sends recording completion webhook

### 4. OpenAI Configuration

Ensure `OPENAI_API_KEY` is set in environment variables:

```env
OPENAI_API_KEY=sk-your-key-here
```

The system uses:
- **Model**: `whisper-1`
- **Language**: English (en)
- **Format**: `verbose_json` (includes confidence scores)

### 5. Environment Variables

Required environment variables:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
OPENAI_API_KEY=sk-your-key-here
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Legal Compliance

### Call Recording Consent

The system automatically plays a consent notice before recording:
> "This call may be recorded for quality assurance and customer service purposes."

**Compliance Features:**
- ✅ Automated consent notice before recording
- ✅ Consent timestamp recorded in database
- ✅ Consent flag stored with call record
- ✅ Complies with one-party consent states (most US states)

**Important Notes:**
- Some states require two-party consent (CA, CT, FL, IL, MA, MD, MT, NH, PA, WA)
- For two-party consent states, you may need:
  - Explicit verbal consent from caller
  - Written consent
  - Additional legal notices

**Recommendation**: Consult with legal counsel for your specific jurisdiction.

## Metadata Extraction

The system automatically extracts:

### Event Type
- Detects: wedding, corporate, party, anniversary, graduation, other
- Based on keywords in transcription

### Event Date
- Matches patterns: `MM/DD/YYYY`, `Month DD`, etc.
- Examples: "June 15", "6/15/2024", "June 15th"

### Budget
- Extracts dollar amounts: `$2000`, `$1,500`, etc.

### Guest Count
- Extracts: "150 people", "200 guests", "50 attendees"

### Auto Lead Scoring

Lead score is automatically updated based on extracted metadata:

- **Hot**: Budget + Event Date both present
- **Warm**: Budget OR Event Date present
- **Cold**: No budget or date information

## Automated Follow-ups

After transcription completes, the system automatically:

1. **Sends SMS with TipJar Link**
   - Includes personalized message
   - Mentions event type if detected
   - Includes event date if available
   - Links to booking form

2. **Email Confirmation** (if email available)
   - Sends confirmation email
   - Includes call summary
   - Links to next steps

3. **Updates Lead Score**
   - Based on extracted metadata
   - Triggers CRM workflows

## Frontend Components

### `CallTranscriptionView`
Displays call recording and transcription with extracted metadata.

**Props:**
- `callId` - Call record ID
- `recordingUrl` - URL to recording
- `transcriptionText` - Full transcription
- `transcriptionStatus` - Status of transcription
- `transcriptionConfidence` - Confidence score
- `extractedMetadata` - Extracted metadata object
- `callDuration` - Call duration in seconds

**Features:**
- Play/pause recording
- Download recording
- View full transcription
- Display extracted metadata
- Show transcription confidence

### `CallAnalytics` (Updated)
Now includes transcription and recording statistics:
- Total recordings
- Completed transcriptions
- Transcription success rate

## Call Details Page

New page: `/djdash/calls/[id]`

Displays:
- Full call transcription
- Recording playback
- Extracted metadata
- Call details
- TipJar follow-up status
- Event information

## Workflow

1. **Call Initiated**
   - User calls virtual number
   - Legal compliance notice played
   - Call logged in database

2. **Call Forwarded**
   - Call forwarded to DJ's real number
   - Recording starts automatically
   - Consent timestamp recorded

3. **Call Completed**
   - Recording saved to Twilio
   - Webhook triggers storage download
   - Recording stored in Supabase Storage

4. **Transcription Triggered**
   - Recording webhook triggers transcription
   - Audio sent to OpenAI Whisper
   - Transcription saved to database

5. **Metadata Extraction**
   - Database trigger extracts metadata
   - Event type, date, budget, guest count extracted
   - Lead score automatically updated

6. **Automated Follow-up**
   - SMS sent with TipJar link
   - Email confirmation sent (if available)
   - CRM updated with lead information

## Analytics

### Recording Statistics
- Total recordings
- Recording success rate
- Average recording duration

### Transcription Statistics
- Total transcriptions
- Transcription success rate
- Average transcription confidence
- Processing time

### Metadata Extraction
- Events by type (from transcriptions)
- Budget ranges detected
- Average guest counts
- Date distribution

## Troubleshooting

### Recordings Not Saving
- Check Twilio webhook configuration
- Verify Supabase Storage bucket exists
- Check storage RLS policies
- Review webhook logs

### Transcriptions Failing
- Verify OpenAI API key is set
- Check API quota/limits
- Review audio file format (must be WAV/MP3)
- Check transcription webhook logs

### Metadata Not Extracting
- Verify database function exists
- Check trigger is active
- Review transcription text quality
- Test extraction function manually

### Legal Compliance Issues
- Verify consent notice is playing
- Check consent flags in database
- Review state-specific requirements
- Consult legal counsel if needed

## Security & Privacy

### Storage Security
- Recordings stored in private Supabase bucket
- RLS policies restrict access to DJ owners
- Admin access for platform oversight

### Data Privacy
- Recordings encrypted at rest
- Transcriptions stored securely
- Metadata extraction done server-side
- No PII exposed in frontend

### Access Control
- DJs can only view their own recordings
- Admins can view all recordings
- RLS policies enforce access
- Audit trail via database timestamps

## Cost Considerations

### Twilio Costs
- Recording storage: ~$0.0025/min
- Recording retrieval: Free
- Call forwarding: Standard rates

### OpenAI Costs
- Whisper API: $0.006 per minute
- Average 5-min call: ~$0.03
- Monthly estimate: Depends on call volume

### Supabase Storage
- Storage: $0.021/GB/month
- Bandwidth: $0.09/GB
- Estimate: ~$5-20/month for typical usage

## Future Enhancements

- [ ] Real-time transcription during call
- [ ] Multi-language support
- [ ] Sentiment analysis of calls
- [ ] Keyword highlighting in transcripts
- [ ] Call quality scoring
- [ ] Integration with CRM systems
- [ ] Automated email summaries
- [ ] Call coaching insights
- [ ] A/B testing for follow-up messages

## Support

For issues:
1. Check webhook logs in Twilio dashboard
2. Review Supabase function logs
3. Check OpenAI API status
4. Verify environment variables
5. Review database migration status














