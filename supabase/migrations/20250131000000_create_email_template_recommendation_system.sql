-- Email Template Recommendation System
-- Creates intelligent template recommendation based on customer journey state

-- Extend email_templates table with recommendation metadata
ALTER TABLE email_templates 
ADD COLUMN IF NOT EXISTS template_key TEXT UNIQUE, -- Unique identifier for template (e.g., 'contract-signed-client')
ADD COLUMN IF NOT EXISTS journey_stage TEXT[], -- Pipeline stages where this template applies (e.g., ['Booked', 'Retainer Paid'])
ADD COLUMN IF NOT EXISTS trigger_conditions JSONB DEFAULT '{}', -- Conditions for when to recommend
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5, -- Recommendation priority (1-10, higher = more important)
ADD COLUMN IF NOT EXISTS auto_send BOOLEAN DEFAULT FALSE, -- Whether to auto-send (vs manual recommendation)
ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER, -- Hours to wait before recommending again
ADD COLUMN IF NOT EXISTS required_fields JSONB DEFAULT '[]', -- Required fields for template (e.g., ['contract_id', 'invoice_id'])
ADD COLUMN IF NOT EXISTS recommended_when TEXT, -- Human-readable description of when to recommend
ADD COLUMN IF NOT EXISTS category TEXT, -- Template category (e.g., 'payment', 'contract', 'event', 'post-event')
ADD COLUMN IF NOT EXISTS time_sensitive BOOLEAN DEFAULT FALSE, -- Whether timing is critical
ADD COLUMN IF NOT EXISTS file_path TEXT; -- Path to HTML template file

-- Create template_recommendation_rules table for complex recommendation logic
CREATE TABLE IF NOT EXISTS email_template_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL REFERENCES email_templates(template_key) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('pipeline_stage', 'contract_status', 'invoice_status', 'payment_status', 'event_date', 'time_elapsed', 'custom')),
  rule_condition JSONB NOT NULL, -- Complex condition matching
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create template_send_history to track when templates were sent/recommended
CREATE TABLE IF NOT EXISTS email_template_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'sent', 'opened', 'clicked', 'ignored', 'expired')),
  recommendation_score DECIMAL(3,2), -- Score (0-1) indicating how well it matched
  context_data JSONB DEFAULT '{}', -- Context at time of recommendation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_journey_stage ON email_templates USING GIN(journey_stage);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_template_history_contact ON email_template_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_template_history_template ON email_template_history(template_key);
CREATE INDEX IF NOT EXISTS idx_template_history_status ON email_template_history(status);
CREATE INDEX IF NOT EXISTS idx_template_history_recommended ON email_template_history(recommended_at);
CREATE INDEX IF NOT EXISTS idx_template_rules_template ON email_template_rules(template_key);
CREATE INDEX IF NOT EXISTS idx_template_rules_active ON email_template_rules(is_active) WHERE is_active = TRUE;

-- Function to get recommended templates for a contact
CREATE OR REPLACE FUNCTION get_recommended_templates(
  p_contact_id UUID
)
RETURNS TABLE (
  template_key TEXT,
  template_name TEXT,
  subject TEXT,
  category TEXT,
  recommendation_score DECIMAL(3,2),
  recommendation_reason TEXT,
  priority INTEGER,
  time_sensitive BOOLEAN,
  last_sent_at TIMESTAMPTZ,
  cooldown_expires_at TIMESTAMPTZ,
  can_send_now BOOLEAN
) AS $$
DECLARE
  v_contact RECORD;
  v_has_contract BOOLEAN;
  v_signed_contract BOOLEAN;
  v_has_invoice BOOLEAN;
  v_has_payment BOOLEAN;
  v_has_quote BOOLEAN;
  v_event_date DATE;
  v_days_until_event INTEGER;
  v_days_since_event INTEGER;
  v_journey_stage TEXT;
BEGIN
  -- Get contact data
  SELECT * INTO v_contact FROM contacts WHERE id = p_contact_id;
  
  IF NOT FOUND THEN
    RETURN; -- Contact not found, return empty
  END IF;

  -- Check contract status
  SELECT COUNT(*) > 0 INTO v_has_contract
  FROM contracts WHERE contact_id = p_contact_id;
  
  SELECT COUNT(*) > 0 INTO v_signed_contract
  FROM contracts 
  WHERE contact_id = p_contact_id 
    AND (status = 'signed' OR signed_at IS NOT NULL OR signed_by_vendor_at IS NOT NULL);
  
  -- Check invoice status
  SELECT COUNT(*) > 0 INTO v_has_invoice
  FROM invoices WHERE contact_id = p_contact_id;
  
  -- Check payment status
  SELECT COUNT(*) > 0 INTO v_has_payment
  FROM payments 
  WHERE contact_id = p_contact_id 
    AND (payment_status = 'paid' OR payment_status = 'succeeded');
  
  -- Check quote status
  SELECT COUNT(*) > 0 INTO v_has_quote
  FROM quote_selections WHERE lead_id = p_contact_id;

  -- Calculate event timing
  v_event_date := v_contact.event_date;
  
  IF v_event_date IS NOT NULL THEN
    v_days_until_event := v_event_date - CURRENT_DATE;
    v_days_since_event := CURRENT_DATE - v_event_date;
  END IF;

  -- Determine journey stage (simplified logic)
  -- If explicitly marked as Lost or Completed, respect that
  IF v_contact.lead_status = 'Lost' THEN
    v_journey_stage := 'Lost';
  ELSIF v_contact.lead_status = 'Completed' AND v_event_date IS NOT NULL AND v_days_since_event > 0 AND v_has_payment THEN
    v_journey_stage := 'Completed';
  -- Check for completed event
  ELSIF v_event_date IS NOT NULL AND v_days_since_event > 0 AND v_has_payment THEN
    v_journey_stage := 'Completed';
  -- Check for paid deposit/full payment
  ELSIF v_has_payment OR v_contact.deposit_paid = TRUE THEN
    v_journey_stage := 'Retainer Paid';
  -- Check for signed contract
  ELSIF v_signed_contract OR (v_has_contract AND v_has_invoice) THEN
    v_journey_stage := 'Booked';
  -- Check for unsigned contract
  ELSIF v_has_contract AND NOT v_signed_contract THEN
    v_journey_stage := 'Negotiating';
  -- Check for quote/proposal
  ELSIF v_has_quote THEN
    v_journey_stage := 'Proposal Sent';
  -- Check for qualification
  ELSIF v_contact.quoted_price IS NOT NULL OR v_contact.budget_range IS NOT NULL THEN
    v_journey_stage := 'Qualified';
  -- Check for contact
  ELSIF v_contact.last_contacted_date IS NOT NULL OR v_contact.proposal_sent_date IS NOT NULL THEN
    v_journey_stage := 'Contacted';
  -- Default: New
  ELSE
    v_journey_stage := 'New';
  END IF;

  -- Return recommended templates matching journey stage and conditions
  RETURN QUERY
  SELECT 
    et.template_key,
    et.name,
    et.subject,
    COALESCE(et.category, 'general') as category,
    -- Calculate recommendation score (0-1)
    CASE 
      -- Base score from priority
      WHEN et.priority >= 8 THEN 0.9
      WHEN et.priority >= 6 THEN 0.7
      WHEN et.priority >= 4 THEN 0.5
      ELSE 0.3
    END::DECIMAL(3,2) as recommendation_score,
    -- Recommendation reason
    COALESCE(et.recommended_when, 'Recommended based on your current stage in the booking process') as recommendation_reason,
    et.priority,
    COALESCE(et.time_sensitive, FALSE) as time_sensitive,
    -- Last sent timestamp
    (SELECT MAX(sent_at) FROM email_template_history 
     WHERE contact_id = p_contact_id AND template_key = et.template_key) as last_sent_at,
    -- Cooldown expires
    (SELECT MAX(recommended_at) + (et.cooldown_hours || ' hours')::INTERVAL 
     FROM email_template_history 
     WHERE contact_id = p_contact_id AND template_key = et.template_key
     AND et.cooldown_hours IS NOT NULL) as cooldown_expires_at,
    -- Can send now (not in cooldown)
    COALESCE(
      (SELECT 
        CASE 
          WHEN MAX(recommended_at) + (et.cooldown_hours || ' hours')::INTERVAL < NOW() THEN TRUE
          WHEN MAX(recommended_at) IS NULL THEN TRUE
          ELSE FALSE
        END
       FROM email_template_history 
       WHERE contact_id = p_contact_id AND template_key = et.template_key
       AND et.cooldown_hours IS NOT NULL),
      TRUE
    ) as can_send_now
  FROM email_templates et
  WHERE et.is_active = TRUE
    AND (et.journey_stage IS NULL OR v_journey_stage = ANY(et.journey_stage))
    -- Additional conditions would be checked here via trigger_conditions JSONB
  ORDER BY 
    et.priority DESC,
    et.time_sensitive DESC NULLS LAST,
    recommendation_score DESC
  LIMIT 10; -- Return top 10 recommendations

END;
$$ LANGUAGE plpgsql;

-- Create view for easy template recommendations
CREATE OR REPLACE VIEW recommended_templates_view AS
SELECT 
  c.id as contact_id,
  c.first_name || ' ' || COALESCE(c.last_name, '') as contact_name,
  c.lead_status as pipeline_stage,
  et.template_key,
  et.name as template_name,
  et.subject,
  et.category,
  et.priority,
  et.time_sensitive,
  et.recommended_when,
  (SELECT COUNT(*) FROM email_template_history 
   WHERE contact_id = c.id AND template_key = et.template_key) as times_sent
FROM contacts c
CROSS JOIN email_templates et
WHERE et.is_active = TRUE
  AND (et.journey_stage IS NULL OR c.lead_status = ANY(et.journey_stage));

-- Comments
COMMENT ON TABLE email_template_rules IS 'Complex rules for template recommendations based on multiple conditions';
COMMENT ON TABLE email_template_history IS 'Tracks when templates were recommended/sent to prevent spam and track effectiveness';
COMMENT ON FUNCTION get_recommended_templates IS 'Returns recommended email templates for a contact based on their journey stage and context';

COMMENT ON COLUMN email_templates.journey_stage IS 'Pipeline stages where this template is relevant (e.g., ["Booked", "Retainer Paid"])';
COMMENT ON COLUMN email_templates.trigger_conditions IS 'JSON conditions for when to recommend (e.g., {"contract_status": "signed", "days_until_event": 7})';
COMMENT ON COLUMN email_templates.recommended_when IS 'Human-readable description of when this template should be recommended';
COMMENT ON COLUMN email_template_history.recommendation_score IS 'Score (0-1) indicating how well the template matched the contact context';
