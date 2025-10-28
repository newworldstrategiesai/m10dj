-- Add Contract Management System
-- Stores contracts and tracks signatures

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    service_selection_id UUID REFERENCES public.service_selections(id) ON DELETE SET NULL,
    
    -- Contract details
    contract_number TEXT UNIQUE NOT NULL,
    contract_type TEXT DEFAULT 'service_agreement' CHECK (contract_type IN ('service_agreement', 'addendum', 'amendment', 'cancellation')),
    
    -- Event details (from service selection)
    event_name TEXT,
    event_type TEXT,
    event_date DATE,
    event_time TEXT,
    venue_name TEXT,
    venue_address TEXT,
    guest_count INTEGER,
    
    -- Service details
    service_description TEXT,
    performance_details TEXT,
    
    -- Payment terms
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    deposit_percentage DECIMAL(5,2),
    payment_schedule JSONB, -- Array of {date, amount, description}
    
    -- Contract status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'completed', 'cancelled', 'expired')),
    
    -- Signature tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    signed_by_client TEXT, -- Client name who signed
    signed_by_client_email TEXT,
    signed_by_client_ip TEXT,
    client_signature_data TEXT, -- Base64 encoded signature image
    signed_by_vendor TEXT, -- Your signature
    signed_by_vendor_at TIMESTAMP WITH TIME ZONE,
    vendor_signature_data TEXT, -- Base64 encoded signature image
    
    -- Signing token for secure links
    signing_token TEXT UNIQUE,
    signing_token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- E-signature service integration (optional)
    docusign_envelope_id TEXT,
    pandadoc_document_id TEXT,
    hellosign_signature_id TEXT,
    external_signature_url TEXT,
    
    -- Contract content
    contract_template TEXT, -- Template name used
    contract_html TEXT, -- Rendered HTML
    contract_pdf_url TEXT, -- URL to stored PDF
    
    -- Terms and conditions
    cancellation_policy TEXT,
    payment_terms TEXT,
    additional_terms TEXT,
    
    -- Dates
    effective_date DATE,
    expiration_date DATE,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_contact ON public.contracts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contracts_invoice ON public.contracts(invoice_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_event_date ON public.contracts(event_date);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_signing_token ON public.contracts(signing_token);

-- Add RLS policies
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to contracts"
    ON public.contracts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Clients can view their own contracts
CREATE POLICY "Clients can view own contracts"
    ON public.contracts
    FOR SELECT
    TO authenticated
    USING (
        contact_id IN (
            SELECT id FROM public.contacts
            WHERE contacts.user_id = auth.uid()
        )
    );

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

-- Function to generate unique contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    counter INTEGER;
BEGIN
    -- Format: CONT-YYYYMMDD-XXX
    counter := (
        SELECT COUNT(*) + 1
        FROM public.contracts
        WHERE DATE(created_at) = CURRENT_DATE
    );
    
    new_number := 'CONT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate contract number
CREATE OR REPLACE FUNCTION set_contract_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.contract_number IS NULL THEN
        NEW.contract_number := generate_contract_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_contract_number ON public.contracts;
CREATE TRIGGER trigger_set_contract_number
    BEFORE INSERT ON public.contracts
    FOR EACH ROW
    EXECUTE FUNCTION set_contract_number();

-- Create contract templates table
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'service_agreement',
    
    -- Template content (using template variables)
    template_content TEXT NOT NULL, -- Changed from html_template to match editor
    
    -- Template variables (JSON schema)
    variables JSONB, -- {client_name, event_date, venue_name, etc.}
    
    -- Active status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Version control
    version INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to templates"
    ON public.contract_templates
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Insert default DJ service contract template
INSERT INTO public.contract_templates (name, description, template_type, template_content, is_default, variables)
VALUES (
    'dj_service_agreement',
    'Standard DJ Service Agreement Contract',
    'service_agreement',
    '<html><body>
<h1>Contract for Services</h1>
<p>This Contract for Services (the "Contract") is made effective as of <strong>{{effective_date}}</strong> (the "Effective Date"), by and between <strong>{{client_name}}</strong> ("Client") and M10 DJ Company, ("M10") of 65 Stewart Rd, Eads, Tennessee 38028 (collectively the "Parties").</p>

<p>NOW, THEREFORE, FOR AND IN CONSIDERATION of the mutual promises and agreements contained herein, Client hires M10, and M10 agrees to provide Disc Jockey services ("DJ" services) to Client under the terms and conditions hereby agreed upon by the parties:</p>

<h2>1. DESCRIPTION OF SERVICES</h2>
<p>Client hereby agrees to engage M10 to provide Client with DJ services (collectively, the "Services") to be performed at the following event(s):</p>
<p><strong>{{event_name}}</strong> on <strong>{{event_date}}</strong> at <strong>{{venue_name}}, {{venue_address}}</strong>.</p>
<p>Services shall consist primarily of providing musical entertainment by means of a recorded music format.</p>

<h2>2. PERFORMANCE OF SERVICES</h2>
<p><strong>a.</strong> M10 shall arrive at the event location one hour before the starting time to set-up and conduct sound check. M10''s playlist shall have an unlimited playlist of songs from both latest and old classics. M10 shall incorporate guest''s requests into the playlist unless otherwise directed by Client. Music shall be played without any breaks unless requested by Client. Time is of the essence. Requests for extended playing time beyond the agreed-upon hours of service shall be accommodated if feasible.</p>
<p><strong>b.</strong> M10 shall be familiar with indoor and outdoor set-up and sound mixing. M10 shall provide multi-color lighting for a ball room effect. M10 shall have high quality microphone and sound system.</p>

<h2>3. TERM</h2>
<p>Client and M10 agree that this Contract between the Parties is for Services that shall commence on the above date and complete on <strong>{{event_date}}</strong>. The Contract may be extended and/or renewed by agreement of all Parties in writing thereafter.</p>

<h2>4. PAYMENT</h2>
<p>For your convenience, payments can be made online using a valid credit card. Otherwise, payment is to be made by cash or check.</p>
<p>An initial retainer of $<strong>{{deposit_amount}}</strong> of total cost $<strong>{{total_amount}}</strong> and a signed contract must be secured prior to any services being performed by Consultant. Remaining balance is due as indicated in the schedule below:</p>
{{payment_schedule}}

<h2>5. CANCELLATION POLICY</h2>
<p>All retainer fees are non-refundable. Cancellation of this Contract by Client which is received in writing more than 30 days prior to the event will result in a refund of any monies paid, less the retainer fee. Cancellation of Services received less than 30 days prior to the event obligate Client to make full remaining payment of the total fees agreed upon. If cancellation is initiated by M10 all monies paid to M10 from Client shall be fully refunded INCLUDING retainer fee. Any refund shall be paid out at month''s end.</p>

<h2>6. WARRANTY</h2>
<p>M10 shall provide its services and meet its obligations under this Contract in a timely and workmanlike manner, using knowledge and recommendations for performing the services which meet generally acceptable standards in M10''s industry and region, and will provide a standard of care equal to, or superior to, care used by service providers similar to M10 on similar projects.</p>

<h2>7-16. ADDITIONAL TERMS</h2>
<p>[Standard legal terms for Default, Remedies, Force Majeure, Dispute Resolution, Entire Agreement, Severability, Amendment, Governing Law, Notice, Waiver, and Signatories]</p>

<h2>17. SIGNATORIES</h2>
<p>This Agreement shall be signed on behalf of Client by <strong>{{client_name}}</strong> and on behalf of M10 by Ben Murray, Manager and effective as of the date first above written.</p>
</body></html>',
    true,
    '{"client_name": "string", "event_name": "string", "event_date": "date", "event_time": "string", "venue_name": "string", "venue_address": "string", "total_amount": "number", "deposit_amount": "number", "payment_schedule": "html", "effective_date": "date"}'::jsonb
) ON CONFLICT (name) DO NOTHING;

-- Create view for contract summary
CREATE OR REPLACE VIEW public.contract_summary AS
SELECT 
    co.id,
    co.contract_number,
    co.status,
    co.event_name,
    co.event_date,
    co.total_amount,
    co.signed_at,
    con.first_name || ' ' || con.last_name as client_name,
    con.email_address,
    co.created_at
FROM public.contracts co
LEFT JOIN public.contacts con ON co.contact_id = con.id
ORDER BY co.created_at DESC;

-- Grant access
GRANT SELECT ON public.contract_summary TO authenticated;

-- Add comments
COMMENT ON TABLE public.contracts IS 'DJ service contracts and agreements';
COMMENT ON COLUMN public.contracts.contract_number IS 'Unique contract identifier (CONT-YYYYMMDD-XXX)';
COMMENT ON COLUMN public.contracts.status IS 'Contract lifecycle status';
COMMENT ON COLUMN public.contracts.payment_schedule IS 'JSON array of payment due dates and amounts';
COMMENT ON TABLE public.contract_templates IS 'Reusable contract templates with variable substitution';

