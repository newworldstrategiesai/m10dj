-- Lead Routing Infrastructure for DJ Dash
-- Core data models optimized for routing queries and marketplace operations
-- All tables scoped to DJ Dash product_context

-- ============================================
-- 1. LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lead Identity
  planner_name TEXT NOT NULL,
  planner_email TEXT NOT NULL,
  planner_phone TEXT,
  planner_phone_hash TEXT, -- Hashed for privacy
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'wedding', 'corporate', 'private_party', etc.
  event_date DATE NOT NULL,
  event_time TIME,
  event_duration_hours DECIMAL(3,1) DEFAULT 4.0,
  venue_name TEXT,
  venue_address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  guest_count INTEGER,
  
  -- Budget & Pricing
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  budget_midpoint DECIMAL(10,2), -- Calculated: (min + max) / 2
  budget_range_text TEXT, -- "$1,000-$2,500"
  
  -- Lead Scoring & Routing
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  routing_state TEXT DEFAULT 'pending' CHECK (routing_state IN (
    'pending',           -- Initial state
    'scoring',           -- Being scored
    'routing',           -- In routing process
    'exclusive',         -- Exclusive window active
    'tier_expansion',    -- Tier expansion phase
    'broadcast',         -- Market broadcast
    'concierge',         -- Escalated to concierge
    'assigned',          -- Assigned to DJ(s)
    'responded',         -- DJ(s) responded
    'converted',         -- Converted to booking
    'expired',           -- No response, expired
    'cancelled'          -- Cancelled by planner
  )),
  
  -- Scoring Components (for explainability)
  scoring_components JSONB, -- {budget_score, urgency_score, completeness_score, demand_score, total}
  
  -- Form Completeness
  form_completeness DECIMAL(3,2) DEFAULT 0.0 CHECK (form_completeness >= 0 AND form_completeness <= 1.0),
  required_fields_missing TEXT[], -- Array of missing required fields
  
  -- Urgency Indicators
  event_urgency TEXT CHECK (event_urgency IN ('high', 'medium', 'low')),
  days_until_event INTEGER, -- Calculated: event_date - created_at
  is_last_minute BOOLEAN DEFAULT FALSE, -- < 30 days
  
  -- Multi-DJ Inquiry
  is_multi_dj_inquiry BOOLEAN DEFAULT FALSE,
  multi_inquiry_id UUID, -- Links to multi_inquiries table if applicable
  dj_inquiry_id UUID REFERENCES dj_inquiries(id) ON DELETE SET NULL, -- Link to existing dj_inquiries if converted from inquiry
  
  -- Source Tracking
  source TEXT, -- 'website', 'phone', 'referral', etc.
  referrer TEXT,
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  routed_at TIMESTAMP WITH TIME ZONE,
  first_response_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  special_requests TEXT,
  notes TEXT,
  custom_fields JSONB
);

-- Indexes for routing queries
CREATE INDEX IF NOT EXISTS idx_leads_routing_state ON leads(routing_state) WHERE routing_state IN ('pending', 'scoring', 'routing');
CREATE INDEX IF NOT EXISTS idx_leads_city_event_type ON leads(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_leads_event_date ON leads(event_date);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC) WHERE routing_state = 'pending';
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_product_context ON leads(product_context);
CREATE INDEX IF NOT EXISTS idx_leads_multi_inquiry ON leads(multi_inquiry_id) WHERE multi_inquiry_id IS NOT NULL;

-- Composite index for city + event type routing (most common query)
CREATE INDEX IF NOT EXISTS idx_leads_city_event_routing ON leads(city, state, event_type, routing_state, lead_score DESC) 
  WHERE routing_state IN ('pending', 'scoring', 'routing');

-- Time-based index for routing cooldowns and urgency
CREATE INDEX IF NOT EXISTS idx_leads_urgency ON leads(event_date, created_at, is_last_minute) 
  WHERE routing_state IN ('pending', 'routing');

COMMENT ON TABLE leads IS 'Incoming leads from planners, scored and routed to DJs';
COMMENT ON COLUMN leads.lead_score IS 'Weighted score 0-100 used for routing priority';
COMMENT ON COLUMN leads.routing_state IS 'Current state in routing pipeline';
COMMENT ON COLUMN leads.scoring_components IS 'JSON breakdown of score components for explainability';
COMMENT ON INDEX idx_leads_city_event_routing IS 'Optimized for routing queries: find pending leads by city/event type, sorted by score';

-- ============================================
-- 2. DJ_ROUTING_METRICS TABLE (extends dj_profiles)
-- ============================================
-- This table stores routing-specific DJ metrics
-- Links directly to existing dj_profiles table
CREATE TABLE IF NOT EXISTS dj_routing_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Pricing & Tier
  pricing_tier TEXT DEFAULT 'standard' CHECK (pricing_tier IN ('premium', 'standard', 'budget')),
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  price_range_midpoint DECIMAL(10,2), -- (min + max) / 2
  
  -- Trust & Performance Metrics
  reliability_score INTEGER DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  response_speed_avg_seconds INTEGER, -- Average response time in seconds
  conversion_rate DECIMAL(5,2), -- % of leads that convert to bookings
  acceptance_rate DECIMAL(5,2), -- % of leads accepted
  decline_rate DECIMAL(5,2), -- % of leads declined
  ignore_rate DECIMAL(5,2), -- % of leads ignored (no response)
  
  -- Routing Metrics
  routing_score DECIMAL(10,2) DEFAULT 0.0, -- Calculated routing score
  routing_score_components JSONB, -- Breakdown of routing score components
  total_leads_received INTEGER DEFAULT 0,
  total_leads_accepted INTEGER DEFAULT 0,
  total_leads_declined INTEGER DEFAULT 0,
  total_leads_ignored INTEGER DEFAULT 0,
  
  -- Penalties & Cooldowns
  recent_lead_penalty DECIMAL(5,2) DEFAULT 0.0, -- Penalty that decays over time
  penalty_decay_rate DECIMAL(5,2) DEFAULT 0.1, -- How fast penalty decays (per day)
  last_penalty_applied_at TIMESTAMP WITH TIME ZONE,
  cooldown_until TIMESTAMP WITH TIME ZONE, -- DJ on cooldown until this time
  
  -- Status (syncs with dj_profiles.is_published)
  is_suspended BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_routed_at TIMESTAMP WITH TIME ZONE,
  last_response_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for DJ routing queries
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_reliability ON dj_routing_metrics(reliability_score DESC) WHERE is_active = TRUE AND is_suspended = FALSE;
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_routing_score ON dj_routing_metrics(routing_score DESC) WHERE is_active = TRUE AND is_suspended = FALSE;
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_tier ON dj_routing_metrics(pricing_tier, routing_score DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_cooldown ON dj_routing_metrics(cooldown_until) WHERE cooldown_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_active ON dj_routing_metrics(is_active, is_suspended, reliability_score DESC);

-- Composite index for eligibility filtering
CREATE INDEX IF NOT EXISTS idx_dj_routing_metrics_eligibility ON dj_routing_metrics(is_active, is_suspended, reliability_score, routing_score DESC) 
  WHERE is_active = TRUE AND is_suspended = FALSE AND reliability_score >= 50;

COMMENT ON TABLE dj_routing_metrics IS 'DJ routing metrics and performance data, extends dj_profiles';
COMMENT ON COLUMN dj_routing_metrics.reliability_score IS 'Trust score 0-100, minimum 50 for eligibility';
COMMENT ON COLUMN dj_routing_metrics.routing_score IS 'Calculated score for lead routing priority';
COMMENT ON COLUMN dj_routing_metrics.recent_lead_penalty IS 'Penalty that decays over time for recent lead behavior';
COMMENT ON INDEX idx_dj_routing_metrics_eligibility IS 'Optimized for eligibility filtering: active, not suspended, reliable DJs sorted by routing score';

-- ============================================
-- 3. EXTEND DJ_AVAILABILITY TABLE (adds routing fields)
-- ============================================
-- Note: dj_availability table already exists, we're just adding routing-specific columns
ALTER TABLE dj_availability 
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS locked_by_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_slots JSONB, -- Array of {start: "18:00", end: "23:00", status: "available"}
  ADD COLUMN IF NOT EXISTS auto_blocked BOOLEAN DEFAULT FALSE; -- Auto-blocked due to routing

-- Indexes for availability queries (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_dj_availability_dj_profile_date ON dj_availability(dj_profile_id, date);
CREATE INDEX IF NOT EXISTS idx_dj_availability_date_status ON dj_availability(date, status) WHERE status IN ('available', 'tentative');
CREATE INDEX IF NOT EXISTS idx_dj_availability_locked ON dj_availability(locked_until, locked_by_lead_id) WHERE locked_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dj_availability_range ON dj_availability(dj_profile_id, date, status) WHERE status = 'available';

-- Composite index for range queries (checking availability across date ranges)
-- Note: locked_until < NOW() check must be done in query, not in index predicate (NOW() is not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_dj_availability_range_query ON dj_availability(dj_profile_id, date, status, locked_until) 
  WHERE status = 'available';

COMMENT ON COLUMN dj_availability.locked_until IS 'Temporary lock during routing to prevent double-booking';
COMMENT ON COLUMN dj_availability.locked_by_lead_id IS 'Lead ID that locked this availability slot';
COMMENT ON INDEX idx_dj_availability_range_query IS 'Optimized for checking availability across date ranges with lock status';

-- ============================================
-- 4. LEAD_ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Assignment Phase
  phase TEXT NOT NULL CHECK (phase IN ('exclusive', 'tier_expansion', 'broadcast', 'concierge')),
  phase_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  phase_expires_at TIMESTAMP WITH TIME ZONE, -- When this phase ends
  
  -- Exclusive Window
  is_exclusive BOOLEAN DEFAULT FALSE,
  exclusive_until TIMESTAMP WITH TIME ZONE, -- Exclusive window end time
  
  -- Response Tracking
  response_status TEXT CHECK (response_status IN ('pending', 'viewed', 'accepted', 'declined', 'ignored', 'expired')),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_time_seconds INTEGER, -- Time from assignment to response
  
  -- Notification
  notified_at TIMESTAMP WITH TIME ZONE,
  notification_method TEXT, -- 'email', 'sms', 'push', 'in_app'
  
  -- Priority
  assignment_priority INTEGER DEFAULT 0, -- Higher = more priority
  routing_score_at_assignment DECIMAL(10,2), -- Snapshot of DJ routing score
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one assignment per lead-DJ combination
  UNIQUE(lead_id, dj_profile_id)
);

-- Indexes for assignment queries
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id, phase, response_status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_dj ON lead_assignments(dj_profile_id, response_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_exclusive ON lead_assignments(lead_id, is_exclusive, exclusive_until) WHERE is_exclusive = TRUE;
CREATE INDEX IF NOT EXISTS idx_lead_assignments_phase ON lead_assignments(phase, phase_expires_at) WHERE phase_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lead_assignments_pending ON lead_assignments(dj_profile_id, response_status) WHERE response_status = 'pending';

-- Composite index for exclusive window enforcement
-- Note: exclusive_until > NOW() check must be done in query, not in index predicate (NOW() is not IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_lead_assignments_exclusive_window ON lead_assignments(lead_id, is_exclusive, exclusive_until, phase) 
  WHERE is_exclusive = TRUE;

COMMENT ON TABLE lead_assignments IS 'Tracks lead assignments to DJs with phase and response tracking';
COMMENT ON COLUMN lead_assignments.exclusive_until IS 'End time of exclusive window, enforced at DB level';
COMMENT ON INDEX idx_lead_assignments_exclusive_window IS 'Optimized for checking active exclusive windows';

-- ============================================
-- 5. CITY_EVENT_STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS city_event_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Location & Event
  city TEXT NOT NULL,
  state TEXT,
  event_type TEXT NOT NULL,
  
  -- Demand Metrics
  total_leads_30d INTEGER DEFAULT 0,
  total_leads_90d INTEGER DEFAULT 0,
  avg_leads_per_week DECIMAL(5,2),
  demand_trend TEXT CHECK (demand_trend IN ('rising', 'stable', 'declining')),
  
  -- Supply Metrics
  total_active_djs INTEGER DEFAULT 0,
  total_available_djs INTEGER DEFAULT 0, -- DJs with availability
  supply_trend TEXT CHECK (supply_trend IN ('rising', 'stable', 'declining')),
  
  -- Demand/Supply Ratio
  demand_supply_ratio DECIMAL(5,2), -- leads_per_week / available_djs
  market_tension TEXT CHECK (market_tension IN ('high', 'medium', 'low')), -- High = more demand than supply
  
  -- Pricing Stats (rolling medians)
  price_median_30d DECIMAL(10,2),
  price_median_90d DECIMAL(10,2),
  price_trend TEXT CHECK (price_trend IN ('rising', 'stable', 'declining')),
  
  -- Conversion Stats
  avg_conversion_rate DECIMAL(5,2),
  avg_response_time_seconds INTEGER,
  
  -- Time Windows
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one stat per city/event type/period
  UNIQUE(city, state, event_type, period_start, period_end, product_context)
);

-- Indexes for stats queries
CREATE INDEX IF NOT EXISTS idx_city_event_stats_city_event ON city_event_stats(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_city_event_stats_period ON city_event_stats(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_city_event_stats_demand_ratio ON city_event_stats(demand_supply_ratio DESC, market_tension);
CREATE INDEX IF NOT EXISTS idx_city_event_stats_computed_at ON city_event_stats(computed_at DESC);

-- Composite index for routing queries (most common: get current stats for city/event)
CREATE INDEX IF NOT EXISTS idx_city_event_stats_routing ON city_event_stats(city, state, event_type, computed_at DESC, demand_supply_ratio) 
  WHERE product_context = 'djdash';

COMMENT ON TABLE city_event_stats IS 'Rolling statistics for city/event type combinations used in lead scoring';
COMMENT ON COLUMN city_event_stats.demand_supply_ratio IS 'Ratio of leads to available DJs, used for scoring';
COMMENT ON INDEX idx_city_event_stats_routing IS 'Optimized for routing: get latest stats for city/event type';

-- ============================================
-- 6. RLS POLICIES
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_routing_metrics ENABLE ROW LEVEL SECURITY;
-- Note: dj_availability RLS may already be enabled, this won't error if it is
DO $$ BEGIN ALTER TABLE dj_availability ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_event_stats ENABLE ROW LEVEL SECURITY;

-- Leads: Public can create, DJs can view assigned leads, admins can view all
CREATE POLICY "Public can create leads"
  ON leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (product_context = 'djdash');

CREATE POLICY "DJs can view assigned leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT lead_id FROM lead_assignments
      WHERE dj_profile_id IN (
        SELECT id FROM dj_profiles
        WHERE organization_id IN (
          SELECT id FROM organizations
          WHERE owner_id = auth.uid()
          AND product_context = 'djdash'
        )
      )
    )
  );

-- DJ Routing Metrics: DJs can view own metrics, admins can view all
CREATE POLICY "DJs can view own routing metrics"
  ON dj_routing_metrics FOR SELECT
  TO authenticated
  USING (
    dj_profile_id IN (
      SELECT id FROM dj_profiles
      WHERE organization_id IN (
        SELECT id FROM organizations
        WHERE owner_id = auth.uid()
        AND product_context = 'djdash'
      )
    )
  );

-- Availability: DJs manage own (existing policy may already exist, this extends it)
-- Note: If RLS already enabled on dj_availability, this may conflict - check first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'dj_availability' 
    AND policyname = 'DJs can manage own availability'
  ) THEN
    CREATE POLICY "DJs can manage own availability"
      ON dj_availability FOR ALL
      TO authenticated
      USING (
        dj_profile_id IN (
          SELECT id FROM dj_profiles
          WHERE organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
            AND product_context = 'djdash'
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy might already exist or table might not have RLS enabled yet
  -- This is safe to ignore - policy will be created when RLS is enabled
  NULL;
END $$;

-- Assignments: DJs can view own, admins can view all
CREATE POLICY "DJs can view own assignments"
  ON lead_assignments FOR SELECT
  TO authenticated
  USING (
    dj_profile_id IN (
      SELECT id FROM dj_profiles
      WHERE organization_id IN (
        SELECT id FROM organizations
        WHERE owner_id = auth.uid()
        AND product_context = 'djdash'
      )
    )
  );

-- City stats: Public read-only
CREATE POLICY "Public can view city stats"
  ON city_event_stats FOR SELECT
  TO anon, authenticated
  USING (product_context = 'djdash');

-- Platform admins can manage all
CREATE POLICY "Platform admins can manage all routing data"
  ON leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (
        SELECT unnest(string_to_array(current_setting('app.settings.admin_emails', true), ','))
      )
    )
  );

-- ============================================
-- 7. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dj_routing_metrics_updated_at BEFORE UPDATE ON dj_routing_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dj_availability_updated_at BEFORE UPDATE ON dj_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_assignments_updated_at BEFORE UPDATE ON lead_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_city_event_stats_updated_at BEFORE UPDATE ON city_event_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate budget midpoint
CREATE OR REPLACE FUNCTION calculate_budget_midpoint()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.budget_min IS NOT NULL AND NEW.budget_max IS NOT NULL THEN
    NEW.budget_midpoint := (NEW.budget_min + NEW.budget_max) / 2;
  ELSIF NEW.budget_min IS NOT NULL THEN
    NEW.budget_midpoint := NEW.budget_min;
  ELSIF NEW.budget_max IS NOT NULL THEN
    NEW.budget_midpoint := NEW.budget_max;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_lead_budget_midpoint BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION calculate_budget_midpoint();

-- Auto-calculate days until event
CREATE OR REPLACE FUNCTION calculate_event_urgency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_date IS NOT NULL THEN
    NEW.days_until_event := NEW.event_date - CURRENT_DATE;
    NEW.is_last_minute := NEW.days_until_event < 30;
    
    -- Set urgency
    IF NEW.days_until_event < 30 THEN
      NEW.event_urgency := 'high';
    ELSIF NEW.days_until_event < 90 THEN
      NEW.event_urgency := 'medium';
    ELSE
      NEW.event_urgency := 'low';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_lead_event_urgency BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION calculate_event_urgency();

