-- Advanced Payment Features Migration
-- Adds support for partial payments, payment plans, discounts, and more

-- Payment Plans Table
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Plan Details
  plan_name TEXT NOT NULL, -- e.g., "50% Deposit + Balance"
  plan_type TEXT NOT NULL, -- 'partial', 'installment', 'full'
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'overdue'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Payment Installments Table
CREATE TABLE IF NOT EXISTS payment_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Installment Details
  installment_number INTEGER NOT NULL,
  installment_name TEXT, -- e.g., "Deposit", "Balance", "Payment 1 of 3"
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Payment Info
  payment_id UUID REFERENCES payments(id),
  stripe_payment_intent TEXT,
  
  -- Reminders
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Discount Codes Table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Code Details
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  
  -- Limits
  max_uses INTEGER, -- NULL for unlimited
  current_uses INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2),
  
  -- Validity
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Application
  applies_to TEXT, -- 'all', 'specific_services', 'first_payment'
  service_types TEXT[], -- Array of applicable service types
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Discount Usage Tracking
CREATE TABLE IF NOT EXISTS discount_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  
  -- Usage Details
  original_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Late Fees Table
CREATE TABLE IF NOT EXISTS late_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES payment_installments(id) ON DELETE CASCADE,
  
  -- Fee Details
  fee_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  fee_amount DECIMAL(10,2) NOT NULL,
  days_overdue INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'applied', 'waived'
  applied_at TIMESTAMP WITH TIME ZONE,
  waived_at TIMESTAMP WITH TIME ZONE,
  waived_by UUID,
  waive_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Payment Reminders Log
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  installment_id UUID REFERENCES payment_installments(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Reminder Details
  reminder_type TEXT NOT NULL, -- 'due_soon', 'overdue', 'final_notice'
  days_until_due INTEGER, -- Negative if overdue
  
  -- Delivery
  sent_via TEXT NOT NULL, -- 'email', 'sms', 'both'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_status TEXT, -- 'sent', 'delivered', 'opened', 'failed'
  sms_status TEXT, -- 'sent', 'delivered', 'failed'
  
  -- Content
  subject TEXT,
  message TEXT,
  
  -- Response
  payment_made BOOLEAN DEFAULT false,
  payment_made_at TIMESTAMP WITH TIME ZONE
);

-- Add columns to existing invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS has_payment_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_plan_id UUID REFERENCES payment_plans(id),
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_fee_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_reminders_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_plans_invoice ON payment_plans(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_contact ON payment_plans(contact_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);

CREATE INDEX IF NOT EXISTS idx_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installments_invoice ON payment_installments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON payment_installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON payment_installments(due_date);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, valid_until);

CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_invoice ON discount_usage(invoice_id);

CREATE INDEX IF NOT EXISTS idx_late_fees_invoice ON late_fees(invoice_id);
CREATE INDEX IF NOT EXISTS idx_late_fees_status ON late_fees(status);

CREATE INDEX IF NOT EXISTS idx_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminders_installment ON payment_reminders(installment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON payment_reminders(sent_at);

-- Create view for overdue installments
CREATE OR REPLACE VIEW overdue_installments AS
SELECT 
  i.*,
  pp.plan_name,
  pp.contact_id,
  inv.invoice_number,
  c.first_name,
  c.last_name,
  c.email_address,
  c.phone,
  CURRENT_DATE - i.due_date AS days_overdue
FROM payment_installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN invoices inv ON i.invoice_id = inv.id
LEFT JOIN contacts c ON pp.contact_id = c.id
WHERE i.status = 'pending'
  AND i.due_date < CURRENT_DATE
  AND pp.deleted_at IS NULL
ORDER BY i.due_date ASC;

-- Create view for upcoming payments
CREATE OR REPLACE VIEW upcoming_payments AS
SELECT 
  i.*,
  pp.plan_name,
  pp.contact_id,
  inv.invoice_number,
  c.first_name,
  c.last_name,
  c.email_address,
  i.due_date - CURRENT_DATE AS days_until_due
FROM payment_installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN invoices inv ON i.invoice_id = inv.id
LEFT JOIN contacts c ON pp.contact_id = c.id
WHERE i.status = 'pending'
  AND i.due_date >= CURRENT_DATE
  AND i.due_date <= CURRENT_DATE + INTERVAL '7 days'
  AND pp.deleted_at IS NULL
ORDER BY i.due_date ASC;

-- Function to calculate late fees
CREATE OR REPLACE FUNCTION calculate_late_fee(
  p_amount DECIMAL,
  p_days_overdue INTEGER,
  p_fee_type TEXT DEFAULT 'percentage',
  p_fee_value DECIMAL DEFAULT 5.0
) RETURNS DECIMAL AS $$
DECLARE
  v_fee DECIMAL;
BEGIN
  IF p_fee_type = 'percentage' THEN
    v_fee := p_amount * (p_fee_value / 100);
  ELSE
    v_fee := p_fee_value;
  END IF;
  
  RETURN ROUND(v_fee, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to check if discount code is valid
CREATE OR REPLACE FUNCTION is_discount_valid(
  p_code TEXT,
  p_order_amount DECIMAL
) RETURNS BOOLEAN AS $$
DECLARE
  v_discount discount_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE code = p_code
    AND is_active = true
    AND deleted_at IS NULL
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (min_order_amount IS NULL OR min_order_amount <= p_order_amount);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed)
GRANT SELECT, INSERT, UPDATE ON payment_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payment_installments TO authenticated;
GRANT SELECT ON discount_codes TO authenticated;
GRANT INSERT ON discount_usage TO authenticated;
GRANT SELECT ON late_fees TO authenticated;
GRANT SELECT ON payment_reminders TO authenticated;
GRANT SELECT ON overdue_installments TO authenticated;
GRANT SELECT ON upcoming_payments TO authenticated;

COMMENT ON TABLE payment_plans IS 'Stores payment plan configurations for invoices';
COMMENT ON TABLE payment_installments IS 'Individual installment payments within a payment plan';
COMMENT ON TABLE discount_codes IS 'Promo codes and discount configurations';
COMMENT ON TABLE discount_usage IS 'Tracks when and how discount codes are used';
COMMENT ON TABLE late_fees IS 'Late fees applied to overdue payments';
COMMENT ON TABLE payment_reminders IS 'Log of payment reminder notifications sent';

