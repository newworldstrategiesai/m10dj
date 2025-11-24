-- Add refund support to crowd_requests table
-- This migration adds refund fields and updates payment_status constraint

-- Add refund columns
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add payment_intent_id if it doesn't exist (for Stripe refunds)
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Update payment_status constraint to include refunded statuses
-- First, drop the existing constraint
ALTER TABLE crowd_requests
DROP CONSTRAINT IF EXISTS crowd_requests_payment_status_check;

-- Add new constraint with refunded statuses
ALTER TABLE crowd_requests
ADD CONSTRAINT crowd_requests_payment_status_check 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded'));

-- Add comments
COMMENT ON COLUMN crowd_requests.refund_amount IS 'Amount refunded in cents';
COMMENT ON COLUMN crowd_requests.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN crowd_requests.payment_intent_id IS 'Stripe payment intent ID for refunds';

-- Create index for refund queries
CREATE INDEX IF NOT EXISTS idx_crowd_requests_refunded_at ON crowd_requests(refunded_at);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_payment_intent_id ON crowd_requests(payment_intent_id);

