-- Add Contract Participants System
-- Allows admins to add additional signers beyond client and vendor

-- Create contract_participants table
CREATE TABLE IF NOT EXISTS public.contract_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
    
    -- Participant details
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT, -- e.g., "Witness", "Co-signer", "Third Party", "Additional Signer"
    title TEXT, -- e.g., "Best Man", "Wedding Coordinator", "Venue Manager"
    
    -- Signature tracking
    signing_token TEXT UNIQUE,
    signing_token_expires_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by TEXT, -- Name used when signing
    signed_by_email TEXT,
    signed_by_ip TEXT,
    signature_data TEXT, -- Base64 encoded signature image
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'signed', 'declined')),
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Ordering (for display order in contract)
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_participants_contract ON public.contract_participants(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_participants_token ON public.contract_participants(signing_token);
CREATE INDEX IF NOT EXISTS idx_contract_participants_status ON public.contract_participants(status);
CREATE INDEX IF NOT EXISTS idx_contract_participants_email ON public.contract_participants(email);

-- Add RLS policies
ALTER TABLE public.contract_participants ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to contract_participants"
    ON public.contract_participants
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Platform admins can manage all participants
CREATE POLICY "Platform admins can manage contract participants"
    ON public.contract_participants
    FOR ALL
    TO authenticated
    USING (is_platform_admin())
    WITH CHECK (is_platform_admin());

-- Participants can view and update their own record with valid token
CREATE POLICY "Participants can sign with valid token"
    ON public.contract_participants
    FOR SELECT
    TO anon
    USING (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
    );

CREATE POLICY "Participants can update signature with valid token"
    ON public.contract_participants
    FOR UPDATE
    TO anon
    USING (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
    )
    WITH CHECK (
        signing_token IS NOT NULL 
        AND signing_token_expires_at > NOW()
    );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_contract_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_participants_updated_at
    BEFORE UPDATE ON public.contract_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_participants_updated_at();

-- Add comments
COMMENT ON TABLE public.contract_participants IS 'Additional signers for contracts beyond client and vendor';
COMMENT ON COLUMN public.contract_participants.role IS 'Role of the participant (Witness, Co-signer, etc.)';
COMMENT ON COLUMN public.contract_participants.display_order IS 'Order in which participants appear in the contract';
COMMENT ON COLUMN public.contract_participants.signing_token IS 'Unique secure token for participant signing link';
