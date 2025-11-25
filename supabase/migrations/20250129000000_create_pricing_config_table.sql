-- Create pricing_config table for admin-controlled pricing
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Configuration type
  config_type TEXT NOT NULL DEFAULT 'wedding', -- 'wedding', 'corporate', 'school'
  
  -- Package pricing
  package1_price DECIMAL(10, 2) NOT NULL DEFAULT 2000,
  package1_a_la_carte_price DECIMAL(10, 2) NOT NULL DEFAULT 2600,
  
  package2_price DECIMAL(10, 2) NOT NULL DEFAULT 2500,
  package2_a_la_carte_price DECIMAL(10, 2) NOT NULL DEFAULT 3400,
  
  package3_price DECIMAL(10, 2) NOT NULL DEFAULT 3000,
  package3_a_la_carte_price DECIMAL(10, 2) NOT NULL DEFAULT 3900,
  
  -- Package breakdown line items (stored as JSONB)
  package1_breakdown JSONB DEFAULT '[]'::jsonb,
  package2_breakdown JSONB DEFAULT '[]'::jsonb,
  package3_breakdown JSONB DEFAULT '[]'::jsonb,
  
  -- Add-ons pricing (stored as JSONB array)
  addons JSONB DEFAULT '[]'::jsonb,
  
  -- Corporate/School packages (if different from wedding)
  corporate_basics_price DECIMAL(10, 2),
  corporate_package1_price DECIMAL(10, 2),
  corporate_package2_price DECIMAL(10, 2),
  corporate_breakdowns JSONB DEFAULT '{}'::jsonb,
  
  school_basics_price DECIMAL(10, 2),
  school_package1_price DECIMAL(10, 2),
  school_package2_price DECIMAL(10, 2),
  school_breakdowns JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one config per type
  UNIQUE(config_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_config_type ON public.pricing_config(config_type);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to pricing_config"
  ON public.pricing_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_pricing_config_timestamp ON public.pricing_config;
CREATE TRIGGER trigger_update_pricing_config_timestamp
  BEFORE UPDATE ON public.pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_config_updated_at();

-- Insert default wedding pricing
INSERT INTO public.pricing_config (config_type, package1_price, package1_a_la_carte_price, package2_price, package2_a_la_carte_price, package3_price, package3_a_la_carte_price)
VALUES ('wedding', 2000, 2600, 2500, 3400, 3000, 3900)
ON CONFLICT (config_type) DO NOTHING;

-- Add comments
COMMENT ON TABLE public.pricing_config IS 'Admin-controlled pricing configuration for all packages and add-ons';
COMMENT ON COLUMN public.pricing_config.package1_breakdown IS 'JSON array of line items: [{item, description, price}]';
COMMENT ON COLUMN public.pricing_config.package2_breakdown IS 'JSON array of line items: [{item, description, price}]';
COMMENT ON COLUMN public.pricing_config.package3_breakdown IS 'JSON array of line items: [{item, description, price}]';
COMMENT ON COLUMN public.pricing_config.addons IS 'JSON array of add-ons: [{id, name, price, description}]';

