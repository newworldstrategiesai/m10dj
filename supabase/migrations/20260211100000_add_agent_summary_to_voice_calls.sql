-- Add agent_summary to voice_calls for LiveKit agent end-of-call webhook
ALTER TABLE public.voice_calls
  ADD COLUMN IF NOT EXISTS agent_summary TEXT;
COMMENT ON COLUMN public.voice_calls.agent_summary IS 'AI-generated session summary from LiveKit agent (Ben) end-of-call webhook';
