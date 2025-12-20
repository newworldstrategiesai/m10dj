-- Pricing Intelligence Engine
-- Aggregates real inquiry and booking data to provide market-based pricing insights
-- All tables scoped to DJ Dash product_context

-- ============================================
-- 1. CITY_PRICING_STATS TABLE
-- ============================================
-- Cached aggregated pricing statistics by city and event type
CREATE TABLE IF NOT EXISTS city_pricing_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Location & Event Context
  city TEXT NOT NULL,
  state TEXT,
  event_type TEXT NOT NULL, -- 'wedding', 'corporate', 'private_party', etc.
  
  -- Pricing Statistics (normalized to 4-hour equivalent)
  price_low DECIMAL(10,2), -- 25th percentile
  price_median DECIMAL(10,2), -- 50th percentile
  price_high DECIMAL(10,2), -- 75th percentile
  price_average DECIMAL(10,2), -- Mean (for reference)
  
  -- Sample Size & Data Quality
  sample_size INTEGER DEFAULT 0, -- Number of data points used
  data_quality TEXT CHECK (data_quality IN ('high', 'medium', 'low')), -- Based on sample size
  min_sample_size INTEGER DEFAULT 10, -- Minimum required for public display
  
  -- Trend Indicators
  trend_direction TEXT CHECK (trend_direction IN ('rising', 'stable', 'declining')),
  trend_percentage DECIMAL(5,2), -- Percentage change vs previous period
  
  -- Time Windows
  period_start DATE NOT NULL, -- Start of aggregation period
  period_end DATE NOT NULL, -- End of aggregation period
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  data_sources JSONB, -- Track which tables contributed data
  outlier_count INTEGER DEFAULT 0, -- Number of outliers excluded
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one stat per city/event_type/period
  UNIQUE(city, state, event_type, period_start, period_end, product_context)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_city_pricing_stats_city_event ON city_pricing_stats(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_city_pricing_stats_period ON city_pricing_stats(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_city_pricing_stats_computed_at ON city_pricing_stats(computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_pricing_stats_product_context ON city_pricing_stats(product_context);

-- ============================================
-- 2. DJ_PRICING_INSIGHTS TABLE
-- ============================================
-- Individual DJ pricing insights and recommendations
CREATE TABLE IF NOT EXISTS dj_pricing_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Market Comparison
  city TEXT NOT NULL,
  state TEXT,
  event_type TEXT NOT NULL,
  
  -- DJ's Current Pricing
  dj_current_price DECIMAL(10,2), -- Normalized to 4-hour equivalent
  dj_pricing_model TEXT, -- 'flat', 'hourly', 'tiered', 'custom'
  
  -- Market Position
  market_position TEXT CHECK (market_position IN ('below_market', 'market_aligned', 'premium')),
  position_percentage DECIMAL(5,2), -- How far above/below median (e.g., -12.5 for 12.5% below)
  
  -- Market Data
  market_median DECIMAL(10,2),
  market_low DECIMAL(10,2),
  market_high DECIMAL(10,2),
  market_range_text TEXT, -- Formatted: "$900-$1,600"
  
  -- Recommendations (non-binding, informational only)
  insight_text TEXT, -- "DJs in your area typically charge $X–$Y for this event type."
  positioning_text TEXT, -- "You are currently priced 12% below the city median."
  
  -- Data Freshness
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats_snapshot_id UUID REFERENCES city_pricing_stats(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(dj_profile_id, city, state, event_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dj_pricing_insights_profile_id ON dj_pricing_insights(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_pricing_insights_city_event ON dj_pricing_insights(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_dj_pricing_insights_market_position ON dj_pricing_insights(market_position);

-- ============================================
-- 3. PRICING_HISTORY TABLE
-- ============================================
-- Track pricing changes over time for trend detection
CREATE TABLE IF NOT EXISTS pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT,
  event_type TEXT NOT NULL,
  
  -- Snapshot Data
  price_median DECIMAL(10,2),
  price_low DECIMAL(10,2),
  price_high DECIMAL(10,2),
  sample_size INTEGER,
  
  -- Period
  snapshot_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(city, state, event_type, snapshot_date, product_context)
);

CREATE INDEX IF NOT EXISTS idx_pricing_history_city_event ON pricing_history(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_pricing_history_snapshot_date ON pricing_history(snapshot_date DESC);

-- ============================================
-- 4. RLS POLICIES
-- ============================================
ALTER TABLE city_pricing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_pricing_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_history ENABLE ROW LEVEL SECURITY;

-- Public can view pricing stats (for city pages, AI search)
CREATE POLICY "Public can view pricing stats"
  ON city_pricing_stats FOR SELECT
  TO anon, authenticated
  USING (
    product_context = 'djdash' 
    AND sample_size >= min_sample_size
    AND data_quality IN ('high', 'medium')
  );

-- DJs can view their own pricing insights
CREATE POLICY "DJs can view own pricing insights"
  ON dj_pricing_insights FOR SELECT
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

-- Public can view pricing history (for trend analysis)
CREATE POLICY "Public can view pricing history"
  ON pricing_history FOR SELECT
  TO anon, authenticated
  USING (product_context = 'djdash');

-- Platform admins can manage all pricing data
CREATE POLICY "Platform admins can manage pricing stats"
  ON city_pricing_stats FOR ALL
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
-- 5. FUNCTIONS FOR PRICING CALCULATIONS
-- ============================================

-- Function to normalize pricing to 4-hour equivalent
CREATE OR REPLACE FUNCTION normalize_price_to_4hour(
  price DECIMAL,
  pricing_model TEXT,
  duration_hours DECIMAL DEFAULT 4
) RETURNS DECIMAL AS $$
BEGIN
  -- If already flat rate or duration is 4 hours, return as-is
  IF pricing_model = 'flat' OR duration_hours = 4 THEN
    RETURN price;
  END IF;
  
  -- If hourly, multiply by 4
  IF pricing_model = 'hourly' THEN
    RETURN price * 4;
  END IF;
  
  -- If tiered, assume it's already for standard package (4-hour equivalent)
  IF pricing_model = 'tiered' THEN
    RETURN price;
  END IF;
  
  -- Default: assume flat rate
  RETURN price;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate percentile
CREATE OR REPLACE FUNCTION calculate_percentile(
  values_array DECIMAL[],
  percentile DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  sorted_array DECIMAL[];
  array_length INTEGER;
  index DECIMAL;
BEGIN
  IF array_length(values_array) = 0 THEN
    RETURN NULL;
  END IF;
  
  sorted_array := ARRAY(SELECT unnest(values_array) ORDER BY unnest);
  array_length := array_length(sorted_array, 1);
  index := CEIL(percentile * array_length);
  
  IF index < 1 THEN
    index := 1;
  ELSIF index > array_length THEN
    index := array_length;
  END IF;
  
  RETURN sorted_array[index::INTEGER];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 6. CALCULATOR USAGE TRACKING
-- ============================================
-- Track calculator usage for analytics and conversion tracking
CREATE TABLE IF NOT EXISTS calculator_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Calculator Inputs
  city TEXT NOT NULL,
  state TEXT,
  event_type TEXT NOT NULL,
  duration_hours DECIMAL(3,1) NOT NULL,
  venue_type TEXT,
  guest_count_range TEXT,
  needs_mc BOOLEAN DEFAULT FALSE,
  has_lighting BOOLEAN DEFAULT FALSE,
  has_ceremony_audio BOOLEAN DEFAULT FALSE,
  extra_hours DECIMAL(3,1) DEFAULT 0,
  event_date DATE,
  
  -- Calculator Results
  estimated_low DECIMAL(10,2),
  estimated_high DECIMAL(10,2),
  estimated_median DECIMAL(10,2),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'early_market')),
  
  -- Conversion Tracking
  converted_to_inquiry BOOLEAN DEFAULT FALSE,
  inquiry_id UUID,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  user_agent TEXT,
  referrer TEXT,
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculator_usage_city_event ON calculator_usage(city, state, event_type);
CREATE INDEX IF NOT EXISTS idx_calculator_usage_created_at ON calculator_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calculator_usage_converted ON calculator_usage(converted_to_inquiry, converted_at);
CREATE INDEX IF NOT EXISTS idx_calculator_usage_product_context ON calculator_usage(product_context);

-- Enable RLS
ALTER TABLE calculator_usage ENABLE ROW LEVEL SECURITY;

-- Public can insert (for calculator usage tracking)
CREATE POLICY "Public can log calculator usage"
  ON calculator_usage FOR INSERT
  TO anon, authenticated
  WITH CHECK (product_context = 'djdash');

-- Platform admins can view all usage
CREATE POLICY "Platform admins can view calculator usage"
  ON calculator_usage FOR SELECT
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
-- 7. COMMENTS
-- ============================================
COMMENT ON TABLE city_pricing_stats IS 'Cached aggregated pricing statistics by city and event type for market intelligence';
COMMENT ON TABLE dj_pricing_insights IS 'Individual DJ pricing insights comparing their rates to market data';
COMMENT ON TABLE pricing_history IS 'Historical pricing snapshots for trend analysis';
COMMENT ON TABLE calculator_usage IS 'Tracks DJ cost calculator usage for analytics and conversion tracking';
COMMENT ON FUNCTION normalize_price_to_4hour IS 'Normalizes pricing from various models (flat, hourly, tiered) to 4-hour equivalent for comparison';
COMMENT ON FUNCTION calculate_percentile IS 'Calculates percentile value from an array of numbers';

