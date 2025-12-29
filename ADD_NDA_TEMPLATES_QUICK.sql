-- ============================================
-- ADD NDA / PERSONAL AGREEMENT TEMPLATES
-- Run this in Supabase SQL Editor
-- ============================================

-- ================================================
-- 1. UPDATE CONTRACT TYPES
-- ================================================

ALTER TABLE public.contracts 
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

ALTER TABLE public.contracts
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN (
  'service_agreement', 'addendum', 'amendment', 'cancellation',
  'nda', 'personal_agreement', 'vendor_agreement', 'partnership', 'general'
));

-- ================================================
-- 2. ADD NEW COLUMNS FOR STANDALONE CONTRACTS
-- ================================================

-- Make contact_id nullable
ALTER TABLE public.contracts 
ALTER COLUMN contact_id DROP NOT NULL;

-- Add recipient fields
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS recipient_phone TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS governing_state TEXT DEFAULT 'Tennessee';
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS term_years INTEGER DEFAULT 7;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS is_personal BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;

-- ================================================
-- 3. ENSURE template_content COLUMN EXISTS (may be named html_template)
-- ================================================

DO $$
BEGIN
  -- Check if html_template exists but template_content doesn't
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_templates' AND column_name = 'html_template')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_templates' AND column_name = 'template_content') 
  THEN
    ALTER TABLE public.contract_templates RENAME COLUMN html_template TO template_content;
    RAISE NOTICE 'Renamed html_template to template_content';
  END IF;
  
  -- If neither exists, add template_content
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_templates' AND column_name = 'template_content')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_templates' AND column_name = 'html_template')
  THEN
    ALTER TABLE public.contract_templates ADD COLUMN template_content TEXT;
    RAISE NOTICE 'Added template_content column';
  END IF;
END $$;

-- ================================================
-- 4. ADD PERSONAL NDA TEMPLATE
-- ================================================

INSERT INTO public.contract_templates (
  name, description, template_type, template_content, is_active, is_default, variables
) VALUES (
  'personal_nda',
  'Personal Confidentiality, Non-Disclosure & Non-Disparagement Agreement',
  'personal_agreement',
  '<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Georgia, serif; line-height: 1.8; color: #1a1a1a; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
h1 { text-align: center; font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px; margin-bottom: 15px; color: #333; }
h3 { font-size: 13px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
p { margin: 12px 0; text-align: justify; }
ul { margin: 10px 0 10px 30px; }
li { margin: 8px 0; }
.parties { background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #333; }
.signature-section { margin-top: 50px; page-break-inside: avoid; }
.signature-box { border: 1px solid #ddd; padding: 25px; margin: 20px 0; background: #fafafa; }
</style>
</head>
<body>

<h1>Personal Confidentiality, Non-Disclosure & Non-Disparagement Agreement</h1>

<p>This Agreement is entered into as of <strong>{{effective_date}}</strong>, by and between:</p>

<div class="parties">
<p><strong>Party A:</strong> {{party_a_name}} ({{party_a_email}})</p>
<p><strong>Party B:</strong> {{party_b_name}} ({{party_b_email}})</p>
</div>

<h2>1. Purpose & Mutual Respect</h2>
<p>The Parties anticipate engaging in private, personal, romantic, or intimate interactions. Both Parties value privacy, discretion, dignity, and mutual respect.</p>

<h2>2. Confidential Information</h2>
<p>"Confidential Information" includes any personal, intimate, or private information shared between the Parties, including communications, media, and the fact of the relationship itself.</p>

<h2>3. Confidentiality & Non-Disclosure</h2>
<p>Each Party agrees to keep all Confidential Information private and not disclose it to any third party.</p>

<h2>4. Social Media & Public Communications</h2>
<p>No Party shall post content that could identify the other Party or infer the relationship.</p>

<h2>5. No Recording or Distribution</h2>
<p>No recording without explicit written consent. Unauthorized recording constitutes a material breach.</p>

<h2>6. Mutual Non-Disparagement</h2>
<p>Neither Party shall make negative statements about the other, privately or publicly.</p>

<h2>7. No Defamation</h2>
<p>Each Party agrees not to defame the other through false or misleading statements.</p>

<h2>8. Term & Survival</h2>
<p>This Agreement remains in effect for <strong>{{term_years}} years</strong>. Obligations regarding intimate matters survive indefinitely.</p>

<h2>9. Remedies</h2>
<p>Breach entitles the non-breaching Party to injunctive relief, damages, and legal fees.</p>

<h2>10. Governing Law</h2>
<p>Governed by the laws of <strong>{{governing_state}}</strong>.</p>

<div class="signature-section">
<h2>Signatures</h2>
<p>By signing, each Party affirms voluntary and knowing agreement.</p>

<div class="signature-box">
<h3>Party A</h3>
<p>{{signature_area_party_a}}</p>
<p>Name: {{party_a_name}}</p>
<p>Date: {{signature_date}}</p>
</div>

<div class="signature-box">
<h3>Party B</h3>
<p>{{signature_area_party_b}}</p>
<p>Name: {{party_b_name}}</p>
<p>Date: {{signature_date}}</p>
</div>
</div>

<p style="font-size: 11px; color: #999; margin-top: 30px; text-align: center;">Agreement ID: {{contract_number}}</p>

</body>
</html>',
  true, false,
  '{"party_a_name": {"type": "string", "required": true}, "party_a_email": {"type": "email", "required": true}, "party_b_name": {"type": "string", "required": true}, "party_b_email": {"type": "email", "required": true}, "term_years": {"type": "number", "default": 7}, "governing_state": {"type": "string", "default": "Tennessee"}}'::JSONB
) ON CONFLICT (name) DO UPDATE SET 
  template_content = EXCLUDED.template_content,
  variables = EXCLUDED.variables,
  is_active = true;

-- ================================================
-- 5. ADD BUSINESS NDA TEMPLATE
-- ================================================

INSERT INTO public.contract_templates (
  name, description, template_type, template_content, is_active, is_default, variables
) VALUES (
  'business_nda',
  'Standard Business Non-Disclosure Agreement',
  'nda',
  '<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
h2 { margin-top: 25px; }
.parties { background: #f5f5f5; padding: 15px; margin: 20px 0; }
.signature-box { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
</style>
</head>
<body>

<h1>NON-DISCLOSURE AGREEMENT</h1>

<p>This Agreement is entered into as of <strong>{{effective_date}}</strong> by and between:</p>

<div class="parties">
<p><strong>Disclosing Party:</strong> {{party_a_name}}</p>
<p><strong>Receiving Party:</strong> {{party_b_name}}</p>
</div>

<h2>1. Purpose</h2>
<p>The parties wish to explore a potential business relationship and may share confidential information.</p>

<h2>2. Confidential Information</h2>
<p>"Confidential Information" means any non-public information disclosed by either party.</p>

<h2>3. Obligations</h2>
<p>Recipient agrees to hold Confidential Information in strict confidence and not disclose to third parties.</p>

<h2>4. Term</h2>
<p>This Agreement remains in effect for <strong>{{term_years}} years</strong>.</p>

<h2>5. Governing Law</h2>
<p>Governed by the laws of <strong>{{governing_state}}</strong>.</p>

<div class="signature-box">
<h3>Disclosing Party</h3>
<p>{{signature_area_party_a}}</p>
<p>Name: {{party_a_name}} | Date: {{signature_date}}</p>
</div>

<div class="signature-box">
<h3>Receiving Party</h3>
<p>{{signature_area_party_b}}</p>
<p>Name: {{party_b_name}} | Date: {{signature_date}}</p>
</div>

<p style="font-size: 11px; color: #999; margin-top: 30px;">Agreement ID: {{contract_number}}</p>

</body>
</html>',
  true, false,
  '{"party_a_name": {"type": "string", "required": true}, "party_b_name": {"type": "string", "required": true}, "party_b_email": {"type": "email", "required": true}, "term_years": {"type": "number", "default": 3}, "governing_state": {"type": "string", "default": "Tennessee"}}'::JSONB
) ON CONFLICT (name) DO UPDATE SET
  template_content = EXCLUDED.template_content,
  variables = EXCLUDED.variables,
  is_active = true;

-- ================================================
-- 6. UPDATE RLS FOR STANDALONE CONTRACTS
-- ================================================

DROP POLICY IF EXISTS "Public can view contracts with valid token" ON public.contracts;
CREATE POLICY "Public can view contracts with valid token"
  ON public.contracts
  FOR SELECT
  TO anon
  USING (
    signing_token IS NOT NULL 
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
  );

DROP POLICY IF EXISTS "Public can sign contracts with valid token" ON public.contracts;
CREATE POLICY "Public can sign contracts with valid token"
  ON public.contracts
  FOR UPDATE
  TO anon
  USING (
    signing_token IS NOT NULL 
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
    AND status IN ('sent', 'viewed')
  )
  WITH CHECK (
    signing_token IS NOT NULL 
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
  );

-- ================================================
-- DONE!
-- ================================================

SELECT '✅ NDA templates added!' as status;
SELECT 'Available templates:' as info;
SELECT name, description, template_type FROM contract_templates WHERE is_active = true;

