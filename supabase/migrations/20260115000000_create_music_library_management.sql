-- ============================================
-- Music Library Management System
-- ============================================
-- Allows admins to manage song requests through:
-- 1. Music library upload (boundary list)
-- 2. Song blacklist (immediate denial)
-- 3. Special pricing rules (per-song pricing)
-- 4. Duplicate request handling (auto-deny or premium pricing)

-- ============================================
-- Table: music_library
-- ============================================
-- Stores the organization's music library (boundary list)
CREATE TABLE IF NOT EXISTS music_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Song identification
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  normalized_title TEXT, -- For matching (lowercase, trimmed)
  normalized_artist TEXT, -- For matching (lowercase, trimmed)
  
  -- Metadata
  genre TEXT,
  bpm INTEGER,
  key_signature TEXT,
  notes TEXT,
  
  -- Import tracking
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  import_batch_id UUID, -- Groups songs imported together
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicates within organization
  UNIQUE(organization_id, normalized_title, normalized_artist)
);

-- ============================================
-- Table: song_blacklist
-- ============================================
-- Songs that should be denied immediately
CREATE TABLE IF NOT EXISTS song_blacklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Song identification
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  normalized_title TEXT, -- For matching
  normalized_artist TEXT, -- For matching
  
  -- Blacklist details
  reason TEXT, -- Optional reason for blacklisting
  blacklisted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicates within organization
  UNIQUE(organization_id, normalized_title, normalized_artist)
);

-- ============================================
-- Table: song_pricing_rules
-- ============================================
-- Special pricing for specific songs
CREATE TABLE IF NOT EXISTS song_pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Song identification
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  normalized_title TEXT, -- For matching
  normalized_artist TEXT, -- For matching
  
  -- Pricing
  custom_price_cents INTEGER NOT NULL, -- Custom price in cents (0 = free, -1 = deny)
  applies_to_fast_track BOOLEAN DEFAULT TRUE, -- Whether this price applies to fast-track requests
  applies_to_regular BOOLEAN DEFAULT TRUE, -- Whether this price applies to regular requests
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicates within organization
  UNIQUE(organization_id, normalized_title, normalized_artist)
);

-- ============================================
-- Table: song_duplicate_rules
-- ============================================
-- Organization-level rules for handling duplicate requests
CREATE TABLE IF NOT EXISTS song_duplicate_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Rule settings
  enable_duplicate_detection BOOLEAN DEFAULT TRUE,
  duplicate_action TEXT DEFAULT 'premium_price' CHECK (duplicate_action IN ('deny', 'premium_price', 'allow')),
  
  -- Time window for duplicate detection (in minutes)
  duplicate_time_window_minutes INTEGER DEFAULT 60, -- Default: 1 hour
  
  -- Premium pricing for duplicates
  duplicate_premium_multiplier DECIMAL(5,2) DEFAULT 1.5, -- Multiply base price by this (e.g., 1.5 = 50% increase)
  duplicate_premium_fixed_cents INTEGER, -- Fixed premium amount in cents (overrides multiplier if set)
  
  -- Matching settings
  match_by_exact_title BOOLEAN DEFAULT TRUE,
  match_by_exact_artist BOOLEAN DEFAULT TRUE,
  match_case_sensitive BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Organization settings columns
-- ============================================
-- Add columns to organizations table for library management settings
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS music_library_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS music_library_action TEXT DEFAULT 'premium_price' 
    CHECK (music_library_action IN ('deny', 'premium_price', 'allow')),
  ADD COLUMN IF NOT EXISTS music_library_premium_multiplier DECIMAL(5,2) DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS music_library_premium_fixed_cents INTEGER;

-- ============================================
-- Indexes for performance
-- ============================================

-- Music library indexes
CREATE INDEX IF NOT EXISTS idx_music_library_organization_id ON music_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_music_library_normalized_lookup ON music_library(organization_id, normalized_title, normalized_artist);
CREATE INDEX IF NOT EXISTS idx_music_library_import_batch ON music_library(import_batch_id);

-- Blacklist indexes
CREATE INDEX IF NOT EXISTS idx_song_blacklist_organization_id ON song_blacklist(organization_id);
CREATE INDEX IF NOT EXISTS idx_song_blacklist_normalized_lookup ON song_blacklist(organization_id, normalized_title, normalized_artist);

-- Pricing rules indexes
CREATE INDEX IF NOT EXISTS idx_song_pricing_rules_organization_id ON song_pricing_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_song_pricing_rules_normalized_lookup ON song_pricing_rules(organization_id, normalized_title, normalized_artist);

-- ============================================
-- Helper function to normalize song strings
-- ============================================
-- Use the existing normalize_track_string function (from Serato migration)
-- If it doesn't exist from that migration, create it here
-- CREATE OR REPLACE is idempotent, so this is safe to run
CREATE OR REPLACE FUNCTION normalize_track_string(str TEXT)
RETURNS TEXT AS $func$
BEGIN
  IF str IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN lower(
    trim(
      regexp_replace(
        regexp_replace(str, '[^\w\s]', '', 'g'),  -- Remove punctuation
        '\s+', ' ', 'g'                            -- Normalize whitespace
      )
    )
  );
END;
$func$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Triggers to auto-populate normalized fields
-- ============================================

-- Music library trigger
CREATE OR REPLACE FUNCTION update_music_library_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_title := normalize_track_string(NEW.song_title);
  NEW.normalized_artist := normalize_track_string(NEW.song_artist);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_music_library_normalized ON music_library;
CREATE TRIGGER trigger_music_library_normalized
  BEFORE INSERT OR UPDATE ON music_library
  FOR EACH ROW
  EXECUTE FUNCTION update_music_library_normalized();

-- Blacklist trigger
CREATE OR REPLACE FUNCTION update_blacklist_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_title := normalize_track_string(NEW.song_title);
  NEW.normalized_artist := normalize_track_string(NEW.song_artist);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blacklist_normalized ON song_blacklist;
CREATE TRIGGER trigger_blacklist_normalized
  BEFORE INSERT OR UPDATE ON song_blacklist
  FOR EACH ROW
  EXECUTE FUNCTION update_blacklist_normalized();

-- Pricing rules trigger
CREATE OR REPLACE FUNCTION update_pricing_rules_normalized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_title := normalize_track_string(NEW.song_title);
  NEW.normalized_artist := normalize_track_string(NEW.song_artist);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pricing_rules_normalized ON song_pricing_rules;
CREATE TRIGGER trigger_pricing_rules_normalized
  BEFORE INSERT OR UPDATE ON song_pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_rules_normalized();

-- Duplicate rules trigger
CREATE OR REPLACE FUNCTION update_duplicate_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_duplicate_rules_updated_at ON song_duplicate_rules;
CREATE TRIGGER trigger_duplicate_rules_updated_at
  BEFORE UPDATE ON song_duplicate_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_duplicate_rules_updated_at();

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_duplicate_rules ENABLE ROW LEVEL SECURITY;

-- Music library policies
DROP POLICY IF EXISTS "Users can view music library for their organization" ON music_library;
CREATE POLICY "Users can view music library for their organization"
  ON music_library FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage music library for their organization" ON music_library;
CREATE POLICY "Users can manage music library for their organization"
  ON music_library FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Blacklist policies
DROP POLICY IF EXISTS "Users can view blacklist for their organization" ON song_blacklist;
CREATE POLICY "Users can view blacklist for their organization"
  ON song_blacklist FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage blacklist for their organization" ON song_blacklist;
CREATE POLICY "Users can manage blacklist for their organization"
  ON song_blacklist FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Pricing rules policies
DROP POLICY IF EXISTS "Users can view pricing rules for their organization" ON song_pricing_rules;
CREATE POLICY "Users can view pricing rules for their organization"
  ON song_pricing_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage pricing rules for their organization" ON song_pricing_rules;
CREATE POLICY "Users can manage pricing rules for their organization"
  ON song_pricing_rules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Duplicate rules policies
DROP POLICY IF EXISTS "Users can view duplicate rules for their organization" ON song_duplicate_rules;
CREATE POLICY "Users can view duplicate rules for their organization"
  ON song_duplicate_rules FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage duplicate rules for their organization" ON song_duplicate_rules;
CREATE POLICY "Users can manage duplicate rules for their organization"
  ON song_duplicate_rules FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE music_library IS 'Organization-scoped music library. Songs in this list act as a boundary for requests.';
COMMENT ON TABLE song_blacklist IS 'Organization-scoped blacklist. Songs in this list are denied immediately.';
COMMENT ON TABLE song_pricing_rules IS 'Organization-scoped special pricing rules for specific songs.';
COMMENT ON TABLE song_duplicate_rules IS 'Organization-scoped rules for handling duplicate song requests.';
