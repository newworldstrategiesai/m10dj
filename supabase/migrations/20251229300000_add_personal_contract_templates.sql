-- ============================================
-- Add Personal Contract Templates (NDA, etc.)
-- 
-- Extends the contract system to support:
-- - Standalone contracts (no event/booking required)
-- - Personal agreements (NDAs, non-disparagement, etc.)
-- - Any-to-any party contracts (not just client→business)
-- ============================================

-- ================================================
-- 1. ADD NEW CONTRACT TYPES
-- ================================================

-- Update the contract_type check constraint to include new types
ALTER TABLE public.contracts 
DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

ALTER TABLE public.contracts
ADD CONSTRAINT contracts_contract_type_check 
CHECK (contract_type IN (
  'service_agreement',    -- DJ service contracts
  'addendum',             -- Modifications to existing contracts
  'amendment',            -- Contract amendments
  'cancellation',         -- Cancellation agreements
  'nda',                  -- Non-disclosure agreements
  'personal_agreement',   -- Personal/romantic confidentiality
  'vendor_agreement',     -- Vendor/subcontractor agreements
  'partnership',          -- Partnership agreements
  'general'               -- General purpose contracts
));

-- ================================================
-- 2. ADD FIELDS FOR STANDALONE CONTRACTS
-- ================================================

-- Make contact_id nullable (allows contracts not tied to existing contacts)
ALTER TABLE public.contracts 
ALTER COLUMN contact_id DROP NOT NULL;

-- Add recipient fields for standalone contracts
DO $$
BEGIN
  -- Recipient info (when no contact exists)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'recipient_name') THEN
    ALTER TABLE public.contracts ADD COLUMN recipient_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'recipient_email') THEN
    ALTER TABLE public.contracts ADD COLUMN recipient_email TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'recipient_phone') THEN
    ALTER TABLE public.contracts ADD COLUMN recipient_phone TEXT;
  END IF;

  -- Sender/creator info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'sender_name') THEN
    ALTER TABLE public.contracts ADD COLUMN sender_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'sender_email') THEN
    ALTER TABLE public.contracts ADD COLUMN sender_email TEXT;
  END IF;

  -- Contract purpose/description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'purpose') THEN
    ALTER TABLE public.contracts ADD COLUMN purpose TEXT;
  END IF;

  -- Governing state/jurisdiction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'governing_state') THEN
    ALTER TABLE public.contracts ADD COLUMN governing_state TEXT DEFAULT 'Tennessee';
  END IF;

  -- Duration/term in years (for NDAs, etc.)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'term_years') THEN
    ALTER TABLE public.contracts ADD COLUMN term_years INTEGER DEFAULT 7;
  END IF;

  -- Is this a personal (non-business) contract?
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'is_personal') THEN
    ALTER TABLE public.contracts ADD COLUMN is_personal BOOLEAN DEFAULT FALSE;
  END IF;

  -- Custom fields JSON for template variables
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'custom_fields') THEN
    ALTER TABLE public.contracts ADD COLUMN custom_fields JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- ================================================
-- 3. ADD NDA / PERSONAL AGREEMENT TEMPLATE
-- ================================================

INSERT INTO public.contract_templates (
  name, 
  description, 
  template_type, 
  template_content, 
  is_active,
  is_default,
  variables
)
VALUES (
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
.signature-line { border-bottom: 1px solid #333; height: 40px; margin: 15px 0; }
.signature-label { font-size: 12px; color: #666; margin-top: 5px; }
.contract-number { font-size: 11px; color: #999; margin-top: 40px; text-align: center; }
</style>
</head>
<body>

<h1>Personal Confidentiality, Non-Disclosure & Non-Disparagement Agreement</h1>

<p>This Personal Confidentiality, Non-Disclosure & Non-Disparagement Agreement ("Agreement") is entered into as of <strong>{{effective_date}}</strong>, by and between:</p>

<div class="parties">
<p><strong>Party A:</strong><br/>
Legal Name: {{party_a_name}}<br/>
Email: {{party_a_email}}</p>

<p><strong>Party B:</strong><br/>
Legal Name: {{party_b_name}}<br/>
Email: {{party_b_email}}</p>

<p>Each a "Party," and collectively the "Parties."</p>
</div>

<h2>1. Purpose & Mutual Respect</h2>
<p>The Parties anticipate engaging in private, personal, romantic, or intimate interactions, which may include conversation, companionship, travel, shared experiences, emotional connection, or physical intimacy.</p>
<p>Both Parties value privacy, discretion, dignity, and mutual respect. This Agreement exists to protect those values — regardless of the outcome of the relationship.</p>

<h2>2. Confidential Information</h2>
<p>"Confidential Information" means any information, whether spoken, written, observed, recorded, or inferred, including but not limited to:</p>

<h3>A. Personal & Intimate Matters</h3>
<ul>
<li>The existence, nature, or details of any personal or intimate interaction</li>
<li>Emotional, romantic, or physical conduct or communications</li>
<li>Personal disclosures, boundaries, vulnerabilities, or preferences</li>
</ul>

<h3>B. Identity & Association</h3>
<ul>
<li>The fact that the Parties know one another or have interacted</li>
<li>Names, likenesses, voices, or identifying characteristics</li>
<li>Presence together at any private or public location</li>
</ul>

<h3>C. Communications & Media</h3>
<ul>
<li>Text messages, DMs, emails, voice notes</li>
<li>Photos, videos, recordings, screenshots, or metadata</li>
<li>Any content captured directly or indirectly</li>
</ul>

<p><em>Confidential Information does not need to be labeled as such to be protected.</em></p>

<h2>3. Confidentiality & Non-Disclosure</h2>
<p>Each Party agrees to:</p>
<ul>
<li>Keep all Confidential Information private and discreet</li>
<li>Not disclose it to any third party, including friends, family, media, or online communities</li>
<li>Not discuss the interaction as gossip, entertainment, or "storytime"</li>
<li>Not use Confidential Information for leverage, retaliation, attention, or reputation harm</li>
</ul>
<p>This obligation applies whether the relationship ends amicably or not.</p>

<h2>4. Social Media & Public Communications</h2>
<p>No Party shall post, share, imply, or comment on any content that could reasonably allow a third party to:</p>
<ul>
<li>Identify the other Party</li>
<li>Infer the existence of a relationship or encounter</li>
<li>Deduce timing, location, or circumstances</li>
</ul>
<p>This includes public posts, private stories, anonymous accounts, podcasts, interviews, group chats, and indirect references.</p>

<h2>5. No Recording or Distribution</h2>
<p>No recording, photographing, filming, or documentation of any interaction is permitted without explicit, written consent of both Parties.</p>
<p><strong>Unauthorized recording or sharing constitutes a material breach.</strong></p>

<h2>6. Mutual Non-Disparagement</h2>
<p>Each Party agrees that they shall not make, publish, or communicate any statement — whether true or false — that could reasonably be perceived as negative, harmful, mocking, or diminishing toward the other Party.</p>
<p>This includes statements about:</p>
<ul>
<li>Character or behavior</li>
<li>Motives or intentions</li>
<li>Personal or intimate conduct</li>
</ul>
<p>This obligation applies privately and publicly, including casual conversations.</p>

<h2>7. No Defamation</h2>
<p>Each Party expressly agrees not to defame the other.</p>
<p>Defamation includes any false or misleading statement, implication, or insinuation presented as fact that could reasonably harm the other Party''s reputation, personal standing, or professional credibility.</p>
<p>This includes exaggeration, selective omission, fictionalization, or framing intended to mislead.</p>

<h2>8. High-Profile & Reputation-Sensitive Acknowledgment</h2>
<p>The Parties acknowledge that disclosure of Confidential Information could cause significant and irreparable reputational harm, including social, personal, or professional consequences.</p>
<p>Accordingly, confidentiality obligations under this Agreement shall be interpreted broadly and strictly, in favor of privacy and discretion.</p>

<h2>9. Exceptions</h2>
<p>Confidential Information does not include information that:</p>
<ul>
<li>Becomes public through no breach of this Agreement</li>
<li>Is required to be disclosed by law or court order (with prompt notice if legally permitted)</li>
</ul>

<h2>10. Term & Survival</h2>
<p>This Agreement becomes effective upon signing and remains in effect for <strong>{{term_years}}</strong> years.</p>
<p>All obligations relating to intimate, sexual, emotional, identity-based, or reputational matters shall survive indefinitely.</p>

<h2>11. Remedies</h2>
<p>The Parties agree that breach of this Agreement would cause irreparable harm.</p>
<p>The non-breaching Party is entitled to:</p>
<ul>
<li>Immediate injunctive relief</li>
<li>Monetary damages</li>
<li>Recovery of legal fees and costs</li>
<li>Any other remedy available at law or equity</li>
</ul>

<h2>12. No Implied Rights</h2>
<p>Nothing in this Agreement grants permission to use the other Party''s name, likeness, voice, or identity for any purpose.</p>

<h2>13. Governing Law</h2>
<p>This Agreement shall be governed by and construed in accordance with the laws of the State of <strong>{{governing_state}}</strong>.</p>

<h2>14. Entire Agreement</h2>
<p>This Agreement represents the entire understanding between the Parties regarding privacy, confidentiality, and reputation.</p>

<div class="signature-section">
<h2>15. Signatures</h2>
<p>By signing below, each Party affirms that they enter into this Agreement voluntarily, knowingly, and without pressure.</p>

<div class="signature-box">
<h3>Party A</h3>
<p>{{signature_area_party_a}}</p>
<p class="signature-label">Signature</p>
<p><strong>Name:</strong> {{party_a_name}}</p>
<p><strong>Email:</strong> {{party_a_email}}</p>
<p><strong>Date:</strong> {{signature_date}}</p>
</div>

<div class="signature-box">
<h3>Party B</h3>
<p>{{signature_area_party_b}}</p>
<p class="signature-label">Signature</p>
<p><strong>Name:</strong> {{party_b_name}}</p>
<p><strong>Email:</strong> {{party_b_email}}</p>
<p><strong>Date:</strong> {{signature_date}}</p>
</div>
</div>

<p class="contract-number"><strong>Agreement ID:</strong> {{contract_number}}</p>

</body>
</html>',
  true,
  false,
  '{
    "party_a_name": {"type": "string", "label": "Your Legal Name", "required": true},
    "party_a_email": {"type": "email", "label": "Your Email", "required": true},
    "party_b_name": {"type": "string", "label": "Other Party Legal Name", "required": true},
    "party_b_email": {"type": "email", "label": "Other Party Email", "required": true},
    "effective_date": {"type": "date", "label": "Effective Date", "required": true},
    "term_years": {"type": "number", "label": "Term (Years)", "default": 7},
    "governing_state": {"type": "string", "label": "Governing State", "default": "Tennessee"}
  }'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  template_content = EXCLUDED.template_content,
  variables = EXCLUDED.variables,
  is_active = true;

-- ================================================
-- 4. ADD SIMPLE NDA TEMPLATE (BUSINESS)
-- ================================================

INSERT INTO public.contract_templates (
  name, 
  description, 
  template_type, 
  template_content, 
  is_active,
  is_default,
  variables
)
VALUES (
  'business_nda',
  'Standard Business Non-Disclosure Agreement',
  'nda',
  '<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { color: #1a1a1a; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
h2 { color: #333; margin-top: 25px; }
p { margin: 10px 0; }
.parties { background: #f5f5f5; padding: 15px; margin: 20px 0; }
.signature-box { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
</style>
</head>
<body>

<h1>NON-DISCLOSURE AGREEMENT</h1>

<p>This Non-Disclosure Agreement ("Agreement") is entered into as of <strong>{{effective_date}}</strong> by and between:</p>

<div class="parties">
<p><strong>Disclosing Party:</strong> {{party_a_name}} ("Discloser")</p>
<p><strong>Receiving Party:</strong> {{party_b_name}} ("Recipient")</p>
</div>

<h2>1. Purpose</h2>
<p>The parties wish to explore a potential business relationship. In connection with this, Discloser may share certain confidential and proprietary information with Recipient.</p>

<h2>2. Confidential Information</h2>
<p>"Confidential Information" means any non-public information disclosed by Discloser, including but not limited to: business plans, financial data, customer lists, trade secrets, technical specifications, and any other proprietary information.</p>

<h2>3. Obligations</h2>
<p>Recipient agrees to:</p>
<ul>
<li>Hold all Confidential Information in strict confidence</li>
<li>Not disclose Confidential Information to any third party without prior written consent</li>
<li>Use Confidential Information only for the purpose of evaluating the potential business relationship</li>
<li>Return or destroy all Confidential Information upon request</li>
</ul>

<h2>4. Term</h2>
<p>This Agreement shall remain in effect for <strong>{{term_years}}</strong> years from the date of execution.</p>

<h2>5. Governing Law</h2>
<p>This Agreement shall be governed by the laws of the State of <strong>{{governing_state}}</strong>.</p>

<div class="signature-box">
<h3>Disclosing Party</h3>
<p>{{signature_area_party_a}}</p>
<p>Name: {{party_a_name}}</p>
<p>Date: {{signature_date}}</p>
</div>

<div class="signature-box">
<h3>Receiving Party</h3>
<p>{{signature_area_party_b}}</p>
<p>Name: {{party_b_name}}</p>
<p>Date: {{signature_date}}</p>
</div>

<p style="font-size: 11px; color: #999; margin-top: 30px;">Agreement ID: {{contract_number}}</p>

</body>
</html>',
  true,
  false,
  '{
    "party_a_name": {"type": "string", "label": "Disclosing Party Name", "required": true},
    "party_b_name": {"type": "string", "label": "Receiving Party Name", "required": true},
    "party_b_email": {"type": "email", "label": "Receiving Party Email", "required": true},
    "effective_date": {"type": "date", "label": "Effective Date", "required": true},
    "term_years": {"type": "number", "label": "Term (Years)", "default": 3},
    "governing_state": {"type": "string", "label": "Governing State", "default": "Tennessee"}
  }'::JSONB
)
ON CONFLICT (name) DO UPDATE SET
  template_content = EXCLUDED.template_content,
  variables = EXCLUDED.variables,
  is_active = true;

-- ================================================
-- 5. ADD RLS FOR STANDALONE CONTRACTS
-- ================================================

-- Allow public access to contracts via signing token (for mobile signing)
DROP POLICY IF EXISTS "Public can view contracts with valid token" ON public.contracts;
CREATE POLICY "Public can view contracts with valid token"
  ON public.contracts
  FOR SELECT
  TO anon
  USING (
    signing_token IS NOT NULL 
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
  );

-- Allow public to sign contracts with valid token
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
-- 6. ADD COMMENTS
-- ================================================

COMMENT ON COLUMN public.contracts.recipient_name IS 'For standalone contracts: recipient name when no contact exists';
COMMENT ON COLUMN public.contracts.recipient_email IS 'For standalone contracts: recipient email for sending signing link';
COMMENT ON COLUMN public.contracts.is_personal IS 'True for personal/non-business contracts like NDAs';
COMMENT ON COLUMN public.contracts.custom_fields IS 'JSON object of template variable values';

-- ================================================
-- SUCCESS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Personal Contract Templates Added!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 New Templates:';
  RAISE NOTICE '   • personal_nda - Personal Confidentiality & Non-Disparagement Agreement';
  RAISE NOTICE '   • business_nda - Standard Business NDA';
  RAISE NOTICE '';
  RAISE NOTICE '🆕 New Contract Fields:';
  RAISE NOTICE '   • recipient_name/email/phone - For standalone contracts';
  RAISE NOTICE '   • sender_name/email - Creator info';
  RAISE NOTICE '   • is_personal - Flags personal agreements';
  RAISE NOTICE '   • custom_fields - Template variable values';
  RAISE NOTICE '   • governing_state - Jurisdiction';
  RAISE NOTICE '   • term_years - Agreement duration';
  RAISE NOTICE '';
END $$;


