-- Create organizations table for multi-tenant SaaS
-- This is the foundation for converting the app to a multi-tenant platform

CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- For subdomain/URL routing (e.g., 'm10dj', 'dj-john')
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- One org per user
  
  -- Subscription information
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'past_due')),
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Trial management
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own organizations
CREATE POLICY "Users can view own organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Users can insert their own organizations
CREATE POLICY "Users can create own organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Policy: Users can update their own organizations
CREATE POLICY "Users can update own organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Policy: Users can delete their own organizations
CREATE POLICY "Users can delete own organizations"
  ON organizations
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create default organization for existing user (M10 DJ Company)
-- This will be run after user authentication is set up
-- For now, we'll create a function that can be called during onboarding

COMMENT ON TABLE organizations IS 'Multi-tenant organizations table. Each DJ business is an organization.';
COMMENT ON COLUMN organizations.slug IS 'Unique slug for subdomain routing (e.g., m10dj.yourplatform.com)';
COMMENT ON COLUMN organizations.subscription_tier IS 'Subscription tier: starter ($19), professional ($49), enterprise ($149)';
COMMENT ON COLUMN organizations.subscription_status IS 'Current subscription status: trial, active, cancelled, past_due';

