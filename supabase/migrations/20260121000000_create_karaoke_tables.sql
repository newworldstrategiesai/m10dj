-- Create karaoke_signups table for managing karaoke singer sign-ups
CREATE TABLE IF NOT EXISTS karaoke_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- DEPRECATED: Use event_qr_code instead
  event_qr_code TEXT NOT NULL, -- Links to crowd_requests event system

  -- Singer/Group info
  group_size INTEGER NOT NULL DEFAULT 1 CHECK (group_size >= 1 AND group_size <= 10), -- 1 = solo, 2 = duo, etc.
  singer_name TEXT NOT NULL, -- Primary singer/group name
  group_members JSONB, -- Array of member names: ["John Doe", "Jane Smith"] for groups
  singer_email TEXT,
  singer_phone TEXT, -- Required for SMS notifications (enforced in application layer)

  -- Song selection
  song_title TEXT NOT NULL,
  song_artist TEXT,
  song_key TEXT, -- Optional: key signature for karaoke

  -- Queue management
  queue_position INTEGER DEFAULT 0, -- Calculated dynamically, cached for performance
  priority_order INTEGER NOT NULL DEFAULT 1000 CHECK (priority_order >= 0), -- Lower = higher priority
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled')),

  -- Payment/priority
  is_priority BOOLEAN NOT NULL DEFAULT FALSE,
  priority_fee INTEGER DEFAULT 0 CHECK (priority_fee >= 0), -- Amount paid for priority (in cents)
  payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'free')),
  payment_intent_id TEXT UNIQUE, -- Stripe payment intent ID
  stripe_session_id TEXT UNIQUE, -- Stripe checkout session ID

  -- Rotation tracking
  singer_rotation_id TEXT NOT NULL, -- Groups singers by name/phone for rotation tracking
  group_rotation_ids TEXT[], -- Array of rotation IDs for all group members (for rotation fairness)
  times_sung INTEGER NOT NULL DEFAULT 0 CHECK (times_sung >= 0), -- How many times this singer/group has sung
  last_sung_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE, -- When they started singing
  completed_at TIMESTAMP WITH TIME ZONE, -- When they finished

  -- Admin notes
  admin_notes TEXT,

  -- Links to crowd_requests (if created through that system)
  crowd_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,

  -- Prevent duplicate signups: same singer, song, event within 24 hours
  CONSTRAINT unique_active_signup EXCLUDE (
    singer_rotation_id WITH =,
    event_qr_code WITH =,
    song_title WITH =,
    tstzrange(created_at, created_at + INTERVAL '24 hours', '[]')
  ) WHERE (status IN ('queued', 'next', 'singing'))
);

-- Indexes for performance and data integrity
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_organization_id ON karaoke_signups(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_qr_code ON karaoke_signups(event_qr_code);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_id ON karaoke_signups(event_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_status ON karaoke_signups(status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_priority_order ON karaoke_signups(priority_order);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_singer_rotation_id ON karaoke_signups(singer_rotation_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_rotation_ids ON karaoke_signups USING GIN(group_rotation_ids); -- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_size ON karaoke_signups(group_size);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_created_at ON karaoke_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_updated_at ON karaoke_signups(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_status ON karaoke_signups(payment_status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_is_priority ON karaoke_signups(is_priority) WHERE is_priority = true;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_active_queue ON karaoke_signups(organization_id, event_qr_code, status, priority_order, created_at) WHERE status IN ('queued', 'next', 'singing');
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_rotation_fairness ON karaoke_signups(organization_id, singer_rotation_id, times_sung, last_sung_at);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_payment_intent ON karaoke_signups(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_stripe_session ON karaoke_signups(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Create karaoke_settings table for organization-level karaoke configuration
CREATE TABLE IF NOT EXISTS karaoke_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,

  -- Feature flags
  karaoke_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  priority_pricing_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rotation_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Pricing
  priority_fee_cents INTEGER NOT NULL DEFAULT 1000 CHECK (priority_fee_cents >= 0), -- $10.00 default
  free_signups_allowed BOOLEAN NOT NULL DEFAULT TRUE,

  -- Capacity and limits
  max_concurrent_singers INTEGER DEFAULT NULL CHECK (max_concurrent_singers IS NULL OR max_concurrent_singers > 0),
  phone_field_mode TEXT NOT NULL DEFAULT 'required' CHECK (phone_field_mode IN ('required', 'optional', 'hidden')),
  sms_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Rotation settings
  max_singers_before_repeat INTEGER NOT NULL DEFAULT 3 CHECK (max_singers_before_repeat >= 0), -- Must wait for N others before singing again
  rotation_fairness_mode TEXT NOT NULL DEFAULT 'strict' CHECK (rotation_fairness_mode IN ('strict', 'flexible', 'disabled')),

  -- Display settings
  display_show_queue_count INTEGER NOT NULL DEFAULT 5 CHECK (display_show_queue_count >= 0), -- Show next N in queue
  display_theme TEXT NOT NULL DEFAULT 'default' CHECK (display_theme IN ('default', 'dark', 'colorful', 'minimal')),

  -- Queue settings
  auto_advance BOOLEAN NOT NULL DEFAULT FALSE, -- Auto-advance to next when current completes
  allow_skips BOOLEAN NOT NULL DEFAULT TRUE,
  auto_refresh_interval_seconds INTEGER NOT NULL DEFAULT 30 CHECK (auto_refresh_interval_seconds >= 5),

  -- Page customization (added later via separate migration)
  karaoke_page_title TEXT,
  karaoke_page_description TEXT,
  karaoke_main_heading TEXT,
  karaoke_welcome_message TEXT,
  karaoke_signup_success_message TEXT,
  karaoke_queue_position_message TEXT,
  karaoke_estimated_wait_message TEXT,
  karaoke_show_welcome_message BOOLEAN DEFAULT TRUE,
  karaoke_show_current_singer BOOLEAN DEFAULT TRUE,
  karaoke_show_queue_preview BOOLEAN DEFAULT TRUE,
  karaoke_show_estimated_wait BOOLEAN DEFAULT TRUE,
  karaoke_theme TEXT DEFAULT 'default' CHECK (karaoke_theme IN ('default', 'dark', 'colorful', 'minimal')),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
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
