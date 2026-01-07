-- Add call recording and transcription fields to dj_calls table
ALTER TABLE dj_calls
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS recording_sid TEXT,
  ADD COLUMN IF NOT EXISTS recording_duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS transcription_text TEXT,
  ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS transcription_confidence DECIMAL(5, 2),
  ADD COLUMN IF NOT EXISTS extracted_metadata JSONB,
  ADD COLUMN IF NOT EXISTS recording_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS recording_storage_bucket TEXT DEFAULT 'dj-call-recordings',
  ADD COLUMN IF NOT EXISTS consent_recorded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMPTZ;

-- Add indexes for transcription queries
CREATE INDEX IF NOT EXISTS idx_dj_calls_transcription_status ON dj_calls(transcription_status);
CREATE INDEX IF NOT EXISTS idx_dj_calls_recording_sid ON dj_calls(recording_sid);
CREATE INDEX IF NOT EXISTS idx_dj_calls_extracted_metadata ON dj_calls USING GIN(extracted_metadata);

-- Create function to extract metadata from transcription
CREATE OR REPLACE FUNCTION extract_call_metadata(transcript_text TEXT)
RETURNS JSONB AS $$
DECLARE
  metadata JSONB := '{}'::JSONB;
  event_type TEXT;
  event_date TEXT;
  budget TEXT;
  guest_count TEXT;
BEGIN
  -- Extract event type (case-insensitive)
  IF transcript_text ~* 'wedding' THEN
    event_type := 'wedding';
  ELSIF transcript_text ~* 'corporate|business|company' THEN
    event_type := 'corporate';
  ELSIF transcript_text ~* 'birthday|party|celebration' THEN
    event_type := 'party';
  ELSIF transcript_text ~* 'anniversary' THEN
    event_type := 'anniversary';
  ELSIF transcript_text ~* 'graduation' THEN
    event_type := 'graduation';
  ELSE
    event_type := 'other';
  END IF;

  -- Extract event date (look for common date patterns)
  SELECT INTO event_date
    (regexp_matches(transcript_text, '\d{1,2}[/-]\d{1,2}[/-]\d{2,4}'))[1]
  LIMIT 1;
  
  IF event_date IS NULL THEN
    SELECT INTO event_date
      (regexp_matches(transcript_text, '(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}'))[1]
    LIMIT 1;
  END IF;

  -- Extract budget (look for dollar amounts)
  SELECT INTO budget
    (regexp_matches(transcript_text, '\$[\d,]+'))[1]
  LIMIT 1;

  -- Extract guest count (look for numbers followed by people/guests/attendees)
  SELECT INTO guest_count
    (regexp_matches(transcript_text, '(\d+)\s*(people|guests|attendees|person)'))[1]
  LIMIT 1;

  -- Build metadata JSON
  metadata := jsonb_build_object(
    'event_type', event_type,
    'event_date', event_date,
    'budget', budget,
    'guest_count', guest_count,
    'extracted_at', NOW()
  );

  RETURN metadata;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-extract metadata when transcription is completed
CREATE OR REPLACE FUNCTION auto_extract_call_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Only extract if transcription is completed and metadata not already extracted
  IF NEW.transcription_status = 'completed' 
     AND NEW.transcription_text IS NOT NULL 
     AND (NEW.extracted_metadata IS NULL OR NEW.extracted_metadata = '{}'::JSONB) THEN
    NEW.extracted_metadata := extract_call_metadata(NEW.transcription_text);
    
    -- Auto-update event_type if extracted
    IF NEW.extracted_metadata->>'event_type' IS NOT NULL THEN
      NEW.event_type := NEW.extracted_metadata->>'event_type';
    END IF;
    
    -- Auto-update lead_score based on extracted metadata
    IF NEW.extracted_metadata->>'budget' IS NOT NULL 
       AND NEW.extracted_metadata->>'event_date' IS NOT NULL THEN
      NEW.lead_score := 'hot';
    ELSIF NEW.extracted_metadata->>'event_date' IS NOT NULL 
          OR NEW.extracted_metadata->>'budget' IS NOT NULL THEN
      NEW.lead_score := 'warm';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_extract_call_metadata
  BEFORE UPDATE ON dj_calls
  FOR EACH ROW
  WHEN (NEW.transcription_status IS DISTINCT FROM OLD.transcription_status 
        OR NEW.transcription_text IS DISTINCT FROM OLD.transcription_text)
  EXECUTE FUNCTION auto_extract_call_metadata();

-- Add comment
COMMENT ON COLUMN dj_calls.recording_url IS 'URL to the call recording file';
COMMENT ON COLUMN dj_calls.transcription_text IS 'Full transcription of the call';
COMMENT ON COLUMN dj_calls.extracted_metadata IS 'JSON object with extracted metadata (event_type, event_date, budget, guest_count)';
COMMENT ON COLUMN dj_calls.consent_recorded IS 'Whether caller consent was recorded for call recording';












