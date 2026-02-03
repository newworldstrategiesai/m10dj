-- Add recording fields to voice_calls for LiveKit Egress (Phase 4)
ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS recording_url TEXT,
  ADD COLUMN IF NOT EXISTS egress_id TEXT;

CREATE INDEX IF NOT EXISTS idx_voice_calls_egress_id ON voice_calls(egress_id) WHERE egress_id IS NOT NULL;
COMMENT ON COLUMN public.voice_calls.recording_url IS 'URL to the call recording file (from LiveKit Egress)';
COMMENT ON COLUMN public.voice_calls.egress_id IS 'LiveKit egress ID for correlating egress_ended webhook';
