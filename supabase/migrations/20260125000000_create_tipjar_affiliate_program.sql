-- Create TipJar Affiliate Program Schema
-- This migration creates the complete affiliate system for TipJar.Live

-- =====================================================
-- AFFILIATE PROGRAM TABLES
-- =====================================================

-- Main affiliates table - tracks affiliate accounts
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Affiliate identification
  affiliate_code VARCHAR(100) UNIQUE NOT NULL, -- Unique code for referral links (e.g., 'DJ_SMITH_123')
  display_name VARCHAR(255), -- Public display name for affiliate
  bio TEXT, -- Optional bio for affiliate profile

  -- Status and configuration
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  commission_rate DECIMAL(5,2) DEFAULT 25.00, -- Base commission rate (25%)
  platform_fee_rate DECIMAL(5,2) DEFAULT 10.00, -- Platform fee commission rate (10%)

  -- Financial tracking
  lifetime_value DECIMAL(10,2) DEFAULT 0, -- Total value of referred users
  total_earned DECIMAL(10,2) DEFAULT 0, -- Total commissions earned
  total_paid DECIMAL(10,2) DEFAULT 0, -- Total commissions paid out
  pending_balance DECIMAL(10,2) DEFAULT 0, -- Current pending commissions

  -- Referral stats
  total_clicks INTEGER DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0, -- Users who became paying customers

  -- Settings
  payout_threshold DECIMAL(8,2) DEFAULT 25.00, -- Minimum amount before payout
  payout_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (payout_frequency IN ('weekly', 'monthly', 'quarterly')),
  auto_payout BOOLEAN DEFAULT true, -- Auto-pay when threshold reached

  -- Marketing materials
  custom_landing_page BOOLEAN DEFAULT false,
  marketing_materials_access BOOLEAN DEFAULT true,

  -- Metadata
  application_notes TEXT, -- Notes from affiliate application
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  terminated_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT affiliates_single_active_per_user UNIQUE(user_id, status) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT affiliates_positive_rates CHECK (commission_rate >= 0 AND platform_fee_rate >= 0),
  CONSTRAINT affiliates_positive_amounts CHECK (lifetime_value >= 0 AND total_earned >= 0 AND total_paid >= 0 AND pending_balance >= 0)
);

-- Affiliate referrals table - tracks individual referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,

  -- Referral target
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

  -- Referral tracking
  referral_code VARCHAR(100) NOT NULL, -- The affiliate code used
  referral_source VARCHAR(50) DEFAULT 'direct_link' CHECK (referral_source IN ('direct_link', 'website_embed', 'social_media', 'email', 'qr_code', 'api')),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),

  -- Conversion tracking
  conversion_status VARCHAR(30) DEFAULT 'clicked' CHECK (conversion_status IN ('clicked', 'signed_up', 'subscribed', 'first_payment', 'active_user')),
  converted_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2) DEFAULT 0, -- Value of the conversion

  -- Commission eligibility
  commission_eligible BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5,2), -- Rate at conversion time
  commission_expires_at TIMESTAMP WITH TIME ZONE, -- When commission eligibility ends

  -- Financial tracking
  total_commissions_earned DECIMAL(10,2) DEFAULT 0,
  total_commissions_paid DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  referrer_ip VARCHAR(45), -- IPv4/IPv6
  referrer_user_agent TEXT,
  click_metadata JSONB, -- Additional tracking data

  -- Timestamps
  first_clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT affiliate_referrals_positive_values CHECK (conversion_value >= 0 AND total_commissions_earned >= 0 AND total_commissions_paid >= 0)
);

-- Affiliate commissions table - individual commission records
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES public.affiliate_referrals(id) ON DELETE CASCADE,

  -- Commission details
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('subscription_monthly', 'subscription_setup', 'platform_fee', 'upgrade_bonus', 'referral_bonus')),

  -- Source transaction
  source_table VARCHAR(50), -- 'subscriptions', 'payments', 'organizations', etc.
  source_transaction_id UUID, -- ID from source table
  source_amount DECIMAL(10,2), -- Original transaction amount
  commission_rate DECIMAL(5,2), -- Rate used for this commission

  -- Processing status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'disputed')),
  payout_batch_id UUID, -- Groups commissions for batch payouts
  payout_date DATE,
  payout_transaction_id VARCHAR(255), -- Stripe transfer ID

  -- Dispute handling
  disputed BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP WITH TIME ZONE,
  dispute_resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT affiliate_commissions_positive_amount CHECK (amount > 0),
  CONSTRAINT affiliate_commissions_valid_dates CHECK (
    (paid_at IS NULL OR approved_at IS NOT NULL) AND
    (payout_date IS NULL OR paid_at IS NOT NULL)
  )
);

-- Affiliate payout batches - for bulk processing
CREATE TABLE IF NOT EXISTS public.affiliate_payout_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_reference VARCHAR(100) UNIQUE NOT NULL, -- Human-readable reference
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Batch totals
  total_commissions DECIMAL(10,2) DEFAULT 0,
  total_fees DECIMAL(10,2) DEFAULT 0,
  total_payout DECIMAL(10,2) DEFAULT 0,
  commission_count INTEGER DEFAULT 0,

  -- Processing status
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  stripe_batch_id VARCHAR(255), -- Stripe batch payout ID

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT affiliate_payout_batches_positive_totals CHECK (total_commissions >= 0 AND total_fees >= 0 AND total_payout >= 0),
  CONSTRAINT affiliate_payout_batches_valid_period CHECK (period_end >= period_start)
);

-- =====================================================
-- EXISTING TABLE MODIFICATIONS
-- =====================================================

-- Add affiliate tracking to organizations
-- Note: Organizations table stores subscription state (subscription_tier, subscription_status, stripe_subscription_id)
-- so we add both referral attribution AND subscription commission tracking here
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    ALTER TABLE public.organizations
      ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES public.affiliates(id),
      ADD COLUMN IF NOT EXISTS affiliate_attribution JSONB, -- Store attribution data
      ADD COLUMN IF NOT EXISTS affiliate_commission_processed BOOLEAN DEFAULT false, -- Track if subscription commission processed
      ADD COLUMN IF NOT EXISTS affiliate_commission_eligible BOOLEAN DEFAULT true; -- Whether org qualifies for commissions
  END IF;
END $$;

-- Add affiliate tracking to subscriptions (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions') THEN
    ALTER TABLE public.subscriptions
      ADD COLUMN IF NOT EXISTS affiliate_commission_processed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS affiliate_commission_eligible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add affiliate tracking to payments table (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments
      ADD COLUMN IF NOT EXISTS affiliate_commission_processed BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS affiliate_commission_eligible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Affiliates indexes
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_organization_id ON public.affiliates(organization_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON public.affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_pending_balance ON public.affiliates(pending_balance) WHERE pending_balance > 0;

-- Referrals indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON public.affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON public.affiliate_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(conversion_status);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_first_clicked_at ON public.affiliate_referrals(first_clicked_at DESC);

-- Commissions indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referral_id ON public.affiliate_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_type ON public.affiliate_commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_payout_batch ON public.affiliate_commissions(payout_batch_id);

-- Payout batches indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_batches_status ON public.affiliate_payout_batches(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_payout_batches_period ON public.affiliate_payout_batches(period_start, period_end);

-- Modified table indexes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
    CREATE INDEX IF NOT EXISTS idx_organizations_referred_by ON public.organizations(referred_by_affiliate_id) WHERE referred_by_affiliate_id IS NOT NULL;
  END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all affiliate tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_batches ENABLE ROW LEVEL SECURITY;

-- Affiliates policies
CREATE POLICY "Users can view their own affiliate account"
  ON public.affiliates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own affiliate account"
  ON public.affiliates
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users can update their own affiliate account"
  ON public.affiliates
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Referrals policies
CREATE POLICY "Affiliates can view their own referrals"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create referrals via their links"
  ON public.affiliate_referrals
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true); -- Allow public creation for tracking

CREATE POLICY "Admins can view all referrals"
  ON public.affiliate_referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Commissions policies
CREATE POLICY "Affiliates can view their own commissions"
  ON public.affiliate_commissions
  FOR SELECT
  TO authenticated
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create commissions"
  ON public.affiliate_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow system/service accounts

CREATE POLICY "Admins can manage all commissions"
  ON public.affiliate_commissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- Payout batches policies (admin only)
CREATE POLICY "Admins can manage payout batches"
  ON public.affiliate_payout_batches
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' IN ('admin', 'super_admin'))
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate unique affiliate codes
CREATE OR REPLACE FUNCTION generate_affiliate_code(base_name TEXT)
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 100;
BEGIN
  -- Clean and format the base name
  code := regexp_replace(upper(trim(base_name)), '[^A-Z0-9]', '_', 'g');

  -- Ensure minimum length and add random suffix
  IF length(code) < 3 THEN
    code := 'AFFILIATE';
  END IF;

  -- Try to find a unique code
  WHILE counter < max_attempts LOOP
    IF counter = 0 THEN
      code := code || '_' || floor(random() * 900 + 100)::text;
    ELSE
      code := split_part(code, '_', 1) || '_' || floor(random() * 900 + 100)::text;
    END IF;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.affiliates WHERE affiliate_code = code);
    counter := counter + 1;
  END LOOP;

  IF counter >= max_attempts THEN
    RAISE EXCEPTION 'Could not generate unique affiliate code after % attempts', max_attempts;
  END IF;

  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to update affiliate stats when commissions are added
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Update affiliate totals when commission is paid
    UPDATE public.affiliates
    SET
      total_paid = total_paid + NEW.amount,
      pending_balance = pending_balance - NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  ELSIF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Update pending balance when commission is approved
    UPDATE public.affiliates
    SET
      pending_balance = pending_balance + NEW.amount,
      total_earned = total_earned + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update affiliate stats
DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON public.affiliate_commissions;
CREATE TRIGGER trigger_update_affiliate_stats
  AFTER INSERT OR UPDATE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_affiliate_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS trigger_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER trigger_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_updated_at();

DROP TRIGGER IF EXISTS trigger_affiliate_referrals_updated_at ON public.affiliate_referrals;
CREATE TRIGGER trigger_affiliate_referrals_updated_at
  BEFORE UPDATE ON public.affiliate_referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_updated_at();

DROP TRIGGER IF EXISTS trigger_affiliate_commissions_updated_at ON public.affiliate_commissions;
CREATE TRIGGER trigger_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_updated_at();

DROP TRIGGER IF EXISTS trigger_affiliate_payout_batches_updated_at ON public.affiliate_payout_batches;
CREATE TRIGGER trigger_affiliate_payout_batches_updated_at
  BEFORE UPDATE ON public.affiliate_payout_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_updated_at();

-- =====================================================
-- INITIAL DATA AND SEEDING
-- =====================================================

-- Insert default commission rates (can be modified by admins)
INSERT INTO public.affiliates (user_id, affiliate_code, status, commission_rate, platform_fee_rate)
SELECT
  u.id,
  generate_affiliate_code(COALESCE(o.name, u.raw_user_meta_data->>'name', 'AFFILIATE')),
  'active',
  25.00, -- 25% on subscriptions
  10.00  -- 10% on platform fees
FROM auth.users u
LEFT JOIN public.organizations o ON u.id = o.owner_id
WHERE u.raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  AND NOT EXISTS (SELECT 1 FROM public.affiliates WHERE user_id = u.id)
ON CONFLICT (user_id, status) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.affiliates IS 'Main affiliate accounts for the TipJar affiliate program';
COMMENT ON TABLE public.affiliate_referrals IS 'Tracks individual referrals from affiliates to new users';
COMMENT ON TABLE public.affiliate_commissions IS 'Individual commission records earned by affiliates';
COMMENT ON TABLE public.affiliate_payout_batches IS 'Batch processing for affiliate commission payouts';

COMMENT ON COLUMN public.affiliates.affiliate_code IS 'Unique code used in referral links (e.g., tipjar.live/ref/DJ_SMITH_123)';
COMMENT ON COLUMN public.affiliates.commission_rate IS 'Percentage of subscription revenue earned as commission (25% default)';
COMMENT ON COLUMN public.affiliates.platform_fee_rate IS 'Percentage of TipJar platform fees earned as commission (10% default)';
COMMENT ON COLUMN public.affiliate_referrals.commission_eligible IS 'Whether this referral qualifies for ongoing commissions';
COMMENT ON COLUMN public.affiliate_commissions.commission_type IS 'Type of commission: subscription_monthly, platform_fee, etc.';
COMMENT ON COLUMN public.affiliate_payout_batches.stripe_batch_id IS 'Stripe batch payout ID for tracking transfers';