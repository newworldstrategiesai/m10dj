-- PPV Tokens Table
-- Stores one-time access tokens for paid streams

CREATE TABLE IF NOT EXISTS public.ppv_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ppv_tokens_stream_id ON ppv_tokens(stream_id);
CREATE INDEX IF NOT EXISTS idx_ppv_tokens_token ON ppv_tokens(token);
CREATE INDEX IF NOT EXISTS idx_ppv_tokens_used ON ppv_tokens(used);

-- Enable RLS
ALTER TABLE ppv_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Tokens are validated server-side, no public access needed
CREATE POLICY "Service role can manage PPV tokens" ON ppv_tokens
  FOR ALL USING (false); -- Only service role can access

