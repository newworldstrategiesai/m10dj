-- Add payment_method column to crowd_requests table
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('card', 'cashapp', 'venmo', 'cash', 'other'));

COMMENT ON COLUMN crowd_requests.payment_method IS 'Payment method selected by the user: card (Stripe), cashapp, venmo, cash, or other';
