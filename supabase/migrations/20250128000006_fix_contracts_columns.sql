-- Fix: Add missing columns to contracts table if they don't exist
-- This handles the case where the contracts table was created before the signature columns were added

-- Add signature tracking columns
DO $$ 
BEGIN
    -- Add client_signature_data if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'client_signature_data') THEN
        ALTER TABLE public.contracts ADD COLUMN client_signature_data TEXT;
    END IF;

    -- Add vendor_signature_data if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'vendor_signature_data') THEN
        ALTER TABLE public.contracts ADD COLUMN vendor_signature_data TEXT;
    END IF;

    -- Add signing_token if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'signing_token') THEN
        ALTER TABLE public.contracts ADD COLUMN signing_token TEXT UNIQUE;
    END IF;

    -- Add signing_token_expires_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'signing_token_expires_at') THEN
        ALTER TABLE public.contracts ADD COLUMN signing_token_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add contract_html if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'contract_html') THEN
        ALTER TABLE public.contracts ADD COLUMN contract_html TEXT;
    END IF;

    -- Add contract_template if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'contract_template') THEN
        ALTER TABLE public.contracts ADD COLUMN contract_template TEXT;
    END IF;

    -- Add signed_by_client_ip if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contracts' 
                   AND column_name = 'signed_by_client_ip') THEN
        ALTER TABLE public.contracts ADD COLUMN signed_by_client_ip TEXT;
    END IF;
END $$;

-- Add index for signing_token if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_contracts_signing_token ON public.contracts(signing_token);

-- Add RLS policies if they don't exist (with DROP IF EXISTS first)
DROP POLICY IF EXISTS "Public can view contracts with valid token" ON public.contracts;
DROP POLICY IF EXISTS "Public can sign contracts with valid token" ON public.contracts;

-- Allow anyone to view contracts with valid signing token (for public signing page)
CREATE POLICY "Public can view contracts with valid token"
    ON public.contracts
    FOR SELECT
    TO anon
    USING (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
    );

-- Allow anyone to update signature with valid signing token
CREATE POLICY "Public can sign contracts with valid token"
    ON public.contracts
    FOR UPDATE
    TO anon
    USING (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
        AND status IN ('sent', 'viewed')
    )
    WITH CHECK (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
    );

-- Add comments
COMMENT ON COLUMN public.contracts.signing_token IS 'Unique secure token for contract signing link';
COMMENT ON COLUMN public.contracts.signing_token_expires_at IS 'Expiration timestamp for signing link (default 30 days)';
COMMENT ON COLUMN public.contracts.client_signature_data IS 'Base64 encoded client signature image (from draw or type)';
COMMENT ON COLUMN public.contracts.vendor_signature_data IS 'Base64 encoded vendor signature image';

