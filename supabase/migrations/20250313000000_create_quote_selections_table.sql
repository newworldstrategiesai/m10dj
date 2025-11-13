-- Create quote_selections table
-- Stores customer service selections from the quote page

CREATE TABLE IF NOT EXISTS public.quote_selections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to contact/lead
  lead_id UUID NOT NULL,
  
  -- Package selection
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price DECIMAL(10, 2) NOT NULL,
  
  -- Add-ons (stored as JSON array)
  addons JSONB DEFAULT '[]'::jsonb,
  
  -- Pricing
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'invoiced', 'paid', 'cancelled')),
  
  -- Links to related records
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  
  -- Payment tracking
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  payment_intent_id TEXT,
  deposit_amount DECIMAL(10, 2),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Signature tracking (for contract)
  signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on lead_id (one selection per lead)
CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_selections_lead_id ON public.quote_selections(lead_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quote_selections_status ON public.quote_selections(status);
CREATE INDEX IF NOT EXISTS idx_quote_selections_payment_status ON public.quote_selections(payment_status);
CREATE INDEX IF NOT EXISTS idx_quote_selections_invoice_id ON public.quote_selections(invoice_id) WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quote_selections_contract_id ON public.quote_selections(contract_id) WHERE contract_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.quote_selections ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to quote_selections"
  ON public.quote_selections
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quote_selections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_quote_selections_timestamp ON public.quote_selections;
CREATE TRIGGER trigger_update_quote_selections_timestamp
  BEFORE UPDATE ON public.quote_selections
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_selections_updated_at();

-- Add comments
COMMENT ON TABLE public.quote_selections IS 'Stores customer service selections from the personalized quote page';
COMMENT ON COLUMN public.quote_selections.addons IS 'JSON array of selected add-ons: [{id, name, price, description}]';
COMMENT ON COLUMN public.quote_selections.lead_id IS 'References contact_submissions.id or contacts.id';

