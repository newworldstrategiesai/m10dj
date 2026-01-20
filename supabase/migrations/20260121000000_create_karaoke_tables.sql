-- Create karaoke_signups table for managing karaoke singer sign-ups
CREATE TABLE IF NOT EXISTS karaoke_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  event_qr_code TEXT, -- Links to crowd_requests event system
  
  -- Singer/Group info
  group_size INTEGER DEFAULT 1 CHECK (group_size >= 1 AND group_size <= 10), -- 1 = solo, 2 = duo, etc.
  singer_name TEXT NOT NULL, -- Primary singer/group name
  group_members JSONB, -- Array of member names: ["John Doe", "Jane Smith"] for groups
  singer_email TEXT,
  singer_phone TEXT, -- Required for SMS notifications (enforced in application layer)
  
  -- Song selection
  song_title TEXT NOT NULL,
  song_artist TEXT,
  song_key TEXT, -- Optional: key signature for karaoke
  
  -- Queue management
  queue_position INTEGER DEFAULT 0, -- Calculated dynamically, not stored
  priority_order INTEGER DEFAULT 1000, -- Lower = higher priority
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled')),
  
  -- Payment/priority
  is_priority BOOLEAN DEFAULT FALSE,
  priority_fee INTEGER DEFAULT 0, -- Amount paid for priority (in cents)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'free')),
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  
  -- Rotation tracking
  singer_rotation_id TEXT, -- Groups singers by name/phone for rotation tracking
  group_rotation_ids TEXT[], -- Array of rotation IDs for all group members (for rotation fairness)
  times_sung INTEGER DEFAULT 0, -- How many times this singer/group has sung
  last_sung_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE, -- When they started singing
  completed_at TIMESTAMP WITH TIME ZONE, -- When they finished
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Links to crowd_requests (if created through that system)
  crowd_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_organization_id ON karaoke_signups(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_qr_code ON karaoke_signups(event_qr_code);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_id ON karaoke_signups(event_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_status ON karaoke_signups(status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_priority_order ON karaoke_signups(priority_order);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_singer_rotation_id ON karaoke_signups(singer_rotation_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_rotation_ids ON karaoke_signups USING GIN(group_rotation_ids); -- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_size ON karaoke_signups(group_size);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_created_at ON karaoke_signups(created_at DESC);

-- Create karaoke_settings table for organization-level karaoke configuration
CREATE TABLE IF NOT EXISTS karaoke_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Feature flags
  karaoke_enabled BOOLEAN DEFAULT FALSE,
  priority_pricing_enabled BOOLEAN DEFAULT TRUE,
  rotation_enabled BOOLEAN DEFAULT TRUE,
  
  -- Pricing
  priority_fee_cents INTEGER DEFAULT 1000, -- $10.00 default
  free_signups_allowed BOOLEAN DEFAULT TRUE,
  
  -- Rotation settings
  max_singers_before_repeat INTEGER DEFAULT 3, -- Must wait for 3 others before singing again
  rotation_fairness_mode TEXT DEFAULT 'strict' CHECK (rotation_fairness_mode IN ('strict', 'flexible', 'disabled')),
  
  -- Display settings
  display_show_queue_count INTEGER DEFAULT 5, -- Show next 5 in queue
  display_theme TEXT DEFAULT 'default' CHECK (display_theme IN ('default', 'dark', 'colorful', 'minimal')),
  
  -- Queue settings
  auto_advance BOOLEAN DEFAULT FALSE, -- Auto-advance to next when current completes
  allow_skips BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for karaoke_settings
CREATE INDEX IF NOT EXISTS idx_karaoke_settings_organization_id ON karaoke_settings(organization_id);

-- Extend crowd_requests table to support karaoke
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS is_karaoke BOOLEAN DEFAULT FALSE;

ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS karaoke_signup_id UUID REFERENCES karaoke_signups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crowd_requests_is_karaoke ON crowd_requests(is_karaoke);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_karaoke_signup_id ON crowd_requests(karaoke_signup_id);

-- Create updated_at trigger for karaoke_signups
CREATE OR REPLACE FUNCTION update_karaoke_signups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_karaoke_signups_updated_at ON karaoke_signups;
CREATE TRIGGER trigger_update_karaoke_signups_updated_at
BEFORE UPDATE ON karaoke_signups
FOR EACH ROW
EXECUTE FUNCTION update_karaoke_signups_updated_at();

-- Create updated_at trigger for karaoke_settings
CREATE OR REPLACE FUNCTION update_karaoke_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_karaoke_settings_updated_at ON karaoke_settings;
CREATE TRIGGER trigger_update_karaoke_settings_updated_at
BEFORE UPDATE ON karaoke_settings
FOR EACH ROW
EXECUTE FUNCTION update_karaoke_settings_updated_at();

-- Add comments for documentation
COMMENT ON TABLE karaoke_signups IS 'Karaoke singer sign-ups with group support (solo, duo, trio, etc.)';
COMMENT ON COLUMN karaoke_signups.group_size IS 'Number of singers: 1 = solo, 2 = duo, 3 = trio, etc. (max 10)';
COMMENT ON COLUMN karaoke_signups.group_members IS 'JSONB array of all group member names';
COMMENT ON COLUMN karaoke_signups.group_rotation_ids IS 'Array of rotation IDs for all group members to track rotation fairness';
COMMENT ON COLUMN karaoke_signups.singer_rotation_id IS 'Primary rotation ID for the signup (usually based on primary singer name/phone)';
COMMENT ON TABLE karaoke_settings IS 'Organization-level karaoke configuration and settings';
