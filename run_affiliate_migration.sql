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