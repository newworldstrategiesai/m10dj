-- Stream Alerts System
-- This migration creates tables for real-time stream alerts

-- Stream alert configurations per user
CREATE TABLE IF NOT EXISTS public.stream_alert_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT, -- For @username lookup
  alert_token TEXT UNIQUE, -- Secure token for public alerts (JWT alternative)
  
  -- Theme and appearance
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'neon', 'retro', 'minimal', 'pride')),
  background_image_url TEXT,
  font_color TEXT DEFAULT '#FFFFFF',
  layout_position TEXT DEFAULT 'center' CHECK (layout_position IN ('left', 'right', 'top', 'bottom', 'center')),
  
  -- Alert settings
  alert_duration_ms INTEGER DEFAULT 5000,
  sound_enabled BOOLEAN DEFAULT TRUE,
  sound_volume DECIMAL(3,2) DEFAULT 0.7 CHECK (sound_volume >= 0 AND sound_volume <= 1),
  sound_file_url TEXT, -- Custom sound URL
  built_in_sound TEXT DEFAULT 'default' CHECK (built_in_sound IN ('default', 'cash', 'coin', 'success', 'celebration')),
  
  -- Text-to-speech
  tts_enabled BOOLEAN DEFAULT FALSE,
  tts_voice TEXT DEFAULT 'default',
  tts_provider TEXT DEFAULT 'web' CHECK (tts_provider IN ('web', 'elevenlabs')),
  
  -- Goal bar
  goal_enabled BOOLEAN DEFAULT FALSE,
  goal_title TEXT,
  goal_amount DECIMAL(10,2),
  goal_current DECIMAL(10,2) DEFAULT 0,
  
  -- Donor ticker
  ticker_enabled BOOLEAN DEFAULT TRUE,
  ticker_count INTEGER DEFAULT 5,
  
  -- Branding
  show_branding BOOLEAN DEFAULT TRUE,
  
  -- Pointer events (for OBS overlay)
  pointer_events_disabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Stream alert events (tips, song requests, etc.)
CREATE TABLE IF NOT EXISTS public.stream_alert_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN ('tip', 'song_request', 'merch_purchase', 'follower', 'subscriber')),
  
  -- Event data (flexible JSON)
  event_data JSONB NOT NULL,
  -- Example structure:
  -- tip: { amount: 20.00, name: "John Doe", message: "Great stream!" }
  -- song_request: { song_title: "Bohemian Rhapsody", artist: "Queen", name: "Jane" }
  -- merch_purchase: { item_name: "T-Shirt", name: "Bob" }
  -- follower: { name: "Alice" }
  -- subscriber: { name: "Charlie", tier: "Tier 1" }
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'displayed', 'failed')),
  displayed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Recent donors for ticker
CREATE TABLE IF NOT EXISTS public.stream_recent_donors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  donor_name TEXT NOT NULL,
  amount DECIMAL(10,2),
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stream_alert_configs_user_id ON stream_alert_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_alert_configs_username ON stream_alert_configs(username);
CREATE INDEX IF NOT EXISTS idx_stream_alert_configs_alert_token ON stream_alert_configs(alert_token);

CREATE INDEX IF NOT EXISTS idx_stream_alert_events_user_id ON stream_alert_events(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_alert_events_status ON stream_alert_events(status);
CREATE INDEX IF NOT EXISTS idx_stream_alert_events_created_at ON stream_alert_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stream_recent_donors_user_id ON stream_recent_donors(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_recent_donors_created_at ON stream_recent_donors(created_at DESC);

-- Enable RLS
ALTER TABLE stream_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_recent_donors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Configs: Users can only view/update their own configs
CREATE POLICY "Users can view own stream alert config" ON stream_alert_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stream alert config" ON stream_alert_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stream alert config" ON stream_alert_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Events: Users can only view their own events
CREATE POLICY "Users can view own stream alert events" ON stream_alert_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stream alert events" ON stream_alert_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recent donors: Users can only view their own donors
CREATE POLICY "Users can view own recent donors" ON stream_recent_donors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recent donors" ON stream_recent_donors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for stream_alert_events (public read for alerts page)
-- Note: The alerts page will use a secure token, not auth
ALTER PUBLICATION supabase_realtime ADD TABLE stream_alert_events;

-- Function to automatically create config when user signs up (optional)
CREATE OR REPLACE FUNCTION create_default_stream_alert_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stream_alert_configs (user_id, username, alert_token)
  VALUES (
    NEW.id,
    LOWER(REPLACE(NEW.raw_user_meta_data->>'username', ' ', '')),
    encode(gen_random_bytes(32), 'hex')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create config (optional - can be done manually)
-- CREATE TRIGGER on_user_created_stream_config
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION create_default_stream_alert_config();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stream_alert_configs_updated_at
  BEFORE UPDATE ON stream_alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

