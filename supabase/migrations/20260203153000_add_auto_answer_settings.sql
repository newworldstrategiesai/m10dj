-- Add auto-answer configuration to LiveKit agent settings
ALTER TABLE public.livekit_agent_settings
  ADD COLUMN IF NOT EXISTS auto_answer_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_answer_delay_seconds INTEGER DEFAULT 20;

-- Ensure defaults are set when column already existed without defaults
ALTER TABLE public.livekit_agent_settings
  ALTER COLUMN auto_answer_enabled SET DEFAULT true,
  ALTER COLUMN auto_answer_delay_seconds SET DEFAULT 20;

-- Backfill platform default row
UPDATE public.livekit_agent_settings
SET
  auto_answer_enabled = COALESCE(auto_answer_enabled, true),
  auto_answer_delay_seconds = CASE
    WHEN auto_answer_delay_seconds IS NULL OR auto_answer_delay_seconds <= 0 THEN 20
    ELSE auto_answer_delay_seconds
  END
WHERE organization_id IS NULL
  AND name = 'default_m10';
