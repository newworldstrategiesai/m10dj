-- Karaoke Quiz System and Premium Features Migration
-- This migration adds quiz functionality and premium content features

-- Add premium fields to existing karaoke_song_videos table
ALTER TABLE karaoke_song_videos
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_version_url TEXT,
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{}';

-- Create karaoke_quizzes table
CREATE TABLE IF NOT EXISTS karaoke_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'mixed',
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  questions JSONB NOT NULL DEFAULT '[]', -- Array of question objects
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  player_count INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create karaoke_quiz_attempts table for tracking user quiz attempts
CREATE TABLE IF NOT EXISTS karaoke_quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES karaoke_quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id, completed_at) -- Prevent duplicate attempts in same session
);

-- Create karaoke_user_preferences table for favorites and personal data
CREATE TABLE IF NOT EXISTS karaoke_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  favorite_video_ids UUID[] DEFAULT '{}',
  favorite_playlist_ids UUID[] DEFAULT '{}',
  recent_video_ids UUID[] DEFAULT '{}',
  preferred_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create karaoke_playlist_categories table for better organization
CREATE TABLE IF NOT EXISTS karaoke_playlist_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1', -- Default indigo color
  icon TEXT DEFAULT 'music',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Add category_id to user_playlists
ALTER TABLE user_playlists
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES karaoke_playlist_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_karaoke_quizzes_organization ON karaoke_quizzes(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_quizzes_category ON karaoke_quizzes(category, difficulty);
CREATE INDEX IF NOT EXISTS idx_karaoke_quiz_attempts_user ON karaoke_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_quiz_attempts_quiz ON karaoke_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_user_preferences_user_org ON karaoke_user_preferences(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_playlists_category ON user_playlists(category_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_song_videos_premium ON karaoke_song_videos(is_premium) WHERE is_premium = TRUE;

-- Create RLS policies for quiz system
ALTER TABLE karaoke_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE karaoke_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE karaoke_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE karaoke_playlist_categories ENABLE ROW LEVEL SECURITY;

-- Quiz policies - organization members can read, admins can manage
CREATE POLICY "karaoke_quizzes_select" ON karaoke_quizzes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "karaoke_quizzes_insert" ON karaoke_quizzes
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    ) AND (
      -- Allow admins to create quizzes
      EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = karaoke_quizzes.organization_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

CREATE POLICY "karaoke_quizzes_update" ON karaoke_quizzes
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Quiz attempts - users can only see/modify their own attempts
CREATE POLICY "karaoke_quiz_attempts_all" ON karaoke_quiz_attempts
  FOR ALL USING (user_id = auth.uid());

-- User preferences - users can only access their own preferences
CREATE POLICY "karaoke_user_preferences_all" ON karaoke_user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Playlist categories - organization members can read, admins can manage
CREATE POLICY "karaoke_playlist_categories_select" ON karaoke_playlist_categories
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "karaoke_playlist_categories_manage" ON karaoke_playlist_categories
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Update karaoke_song_videos RLS to include premium access
CREATE POLICY "karaoke_song_videos_premium_access" ON karaoke_song_videos
  FOR SELECT USING (
    NOT is_premium OR
    organization_id IN (
      SELECT organization_id FROM organizations
      WHERE subscription_tier != 'free'
    ) OR
    -- Allow access if user has premium subscription
    EXISTS (
      SELECT 1 FROM organizations o
      JOIN organization_members om ON o.id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND o.subscription_tier != 'free'
    )
  );

-- Insert some default quiz categories
INSERT INTO karaoke_playlist_categories (organization_id, name, description, color, icon, is_default, sort_order)
SELECT DISTINCT
  o.id as organization_id,
  cat.name,
  cat.description,
  cat.color,
  cat.icon,
  cat.is_default,
  cat.sort_order
FROM organizations o
CROSS JOIN (
  VALUES
    ('Pop', 'Popular hits from all eras', '#ff6b6b', 'music', true, 1),
    ('Rock', 'Classic and modern rock anthems', '#4ecdc4', 'zap', true, 2),
    ('Country', 'Country music favorites', '#ffd93d', 'map-pin', true, 3),
    ('R&B', 'Rhythm and blues classics', '#a8e6cf', 'heart', true, 4),
    ('Hip Hop', 'Hip hop and rap tracks', '#ffd3a5', 'mic', true, 5),
    ('90s', 'Nostalgic 90s hits', '#c7ecee', 'calendar', true, 6),
    ('80s', 'Totally tubular 80s tracks', '#fd79a8', 'radio', true, 7),
    ('Party', 'High-energy party starters', '#fdcb6e', 'party', true, 8),
    ('Love Songs', 'Romantic ballads and love songs', '#e84393', 'heart', true, 9),
    ('Classics', 'Timeless karaoke standards', '#636e72', 'award', true, 10)
) as cat(name, description, color, icon, is_default, sort_order)
ON CONFLICT (organization_id, name) DO NOTHING;

-- Insert some sample quizzes
INSERT INTO karaoke_quizzes (organization_id, title, description, category, difficulty, questions, is_premium, player_count)
SELECT DISTINCT
  o.id as organization_id,
  q.title,
  q.description,
  q.category,
  q.difficulty,
  q.questions::jsonb,
  q.is_premium,
  q.player_count
FROM organizations o
CROSS JOIN (
  VALUES
    ('Britney Spears Trivia', 'Test your knowledge of Britney Spears hits', 'Pop', 'medium', '[{"question": "What year did Britney Spears release her debut album?", "options": ["1998", "1999", "2000", "2001"], "correct": 1}, {"question": "What is the name of Britney''s debut single?", "options": ["Oops!... I Did It Again", "...Baby One More Time", "Toxic", "Womanizer"], "correct": 1}, {"question": "Which movie featured Britney Spears as a character?", "options": ["Crossroads", "The Princess Diaries", "Mean Girls", "Clueless"], "correct": 0}]', false, 15420),
    ('GREATEST HITS EVER', 'The ultimate karaoke challenge', 'Mixed', 'hard', '[{"question": "Who sang ''Bohemian Rhapsody''?", "options": ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"], "correct": 1}, {"question": "What year was Michael Jackson''s Thriller released?", "options": ["1982", "1983", "1984", "1985"], "correct": 1}, {"question": "Which artist has the most Grammy nominations?", "options": ["Beyoncé", "Taylor Swift", "Adele", "U2"], "correct": 0}]', true, 8750),
    ('90s Hits Challenge', 'Relive the 90s with these classics', '90s', 'easy', '[{"question": "Who sang ''Wonderwall''?", "options": ["Oasis", "Blur", "Radiohead", "Nirvana"], "correct": 0}, {"question": "What band released ''Smells Like Teen Spirit''?", "options": ["Pearl Jam", "Soundgarden", "Nirvana", "Alice in Chains"], "correct": 2}, {"question": "Which 90s boy band had a member named Nick?", "options": ["NSYNC", "Backstreet Boys", "98 Degrees", "Boyz II Men"], "correct": 0}]', false, 23100)
) as q(title, description, category, difficulty, questions, is_premium, player_count)
ON CONFLICT DO NOTHING;

-- Create function to update quiz statistics
CREATE OR REPLACE FUNCTION update_quiz_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update player count and average score when a new attempt is added
  UPDATE karaoke_quizzes
  SET
    player_count = (
      SELECT COUNT(DISTINCT user_id)
      FROM karaoke_quiz_attempts
      WHERE quiz_id = NEW.quiz_id
    ),
    average_score = (
      SELECT COALESCE(AVG((score::decimal / NULLIF(total_questions, 0)) * 100), 0)
      FROM karaoke_quiz_attempts
      WHERE quiz_id = NEW.quiz_id
    )
  WHERE id = NEW.quiz_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quiz stats updates
CREATE TRIGGER update_quiz_stats_trigger
  AFTER INSERT OR UPDATE ON karaoke_quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION update_quiz_stats();

-- Add updated_at trigger for quizzes
CREATE TRIGGER update_karaoke_quizzes_updated_at
  BEFORE UPDATE ON karaoke_quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for user preferences
CREATE TRIGGER update_karaoke_user_preferences_updated_at
  BEFORE UPDATE ON karaoke_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();