-- Create music_questionnaires table
CREATE TABLE IF NOT EXISTS music_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE,
  big_no_songs TEXT,
  special_dances TEXT[] DEFAULT '{}',
  special_dance_songs JSONB DEFAULT '{}',
  playlist_links JSONB DEFAULT '{}',
  ceremony_music_type TEXT,
  ceremony_music JSONB DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Create index on lead_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_lead_id ON music_questionnaires(lead_id);

-- Create index on completed_at for filtering
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_completed_at ON music_questionnaires(completed_at);

-- Enable Row Level Security
ALTER TABLE music_questionnaires ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all questionnaires
DROP POLICY IF EXISTS "Service role can manage music_questionnaires" ON music_questionnaires;
CREATE POLICY "Service role can manage music_questionnaires" ON music_questionnaires
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Users can view their own questionnaire (if we add user authentication later)
-- For now, we'll rely on the lead_id being passed correctly from the quote page

-- Add comment
COMMENT ON TABLE music_questionnaires IS 'Stores music planning questionnaire responses from clients';

