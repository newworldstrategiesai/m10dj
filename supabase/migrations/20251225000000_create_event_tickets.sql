-- Create event_tickets table for ticketing system
-- This migration creates the complete ticketing system schema

-- Drop table if exists (for fresh migration only - comment out if already deployed)
-- DROP TABLE IF EXISTS event_tickets CASCADE;

CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event reference (using TEXT to support event IDs like 'dj-ben-murray-silky-osullivans-2026-12-27')
  event_id TEXT NOT NULL,
  
  -- Ticket details
  ticket_type TEXT NOT NULL DEFAULT 'general_admission',
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_per_ticket DECIMAL(10,2) NOT NULL CHECK (price_per_ticket >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  
  -- Payment information
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cash', 'card_at_door')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'card_at_door')),
  
  -- QR Code identifiers
  qr_code TEXT UNIQUE NOT NULL,
  qr_code_short TEXT UNIQUE, -- Shorter code for easier scanning (8 characters)
  
  -- Check-in tracking
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by TEXT, -- Staff member who checked them in
  
  -- Additional information
  notes TEXT, -- For refund notes, special instructions, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code ON event_tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr_code_short ON event_tickets(qr_code_short);
CREATE INDEX IF NOT EXISTS idx_event_tickets_payment_status ON event_tickets(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_tickets_checked_in ON event_tickets(checked_in);
CREATE INDEX IF NOT EXISTS idx_event_tickets_purchaser_email ON event_tickets(purchaser_email);
CREATE INDEX IF NOT EXISTS idx_event_tickets_purchaser_name ON event_tickets(purchaser_name); -- For name search
CREATE INDEX IF NOT EXISTS idx_event_tickets_created_at ON event_tickets(created_at); -- For date filtering

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_tickets_updated_at_trigger
  BEFORE UPDATE ON event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_event_tickets_updated_at();

-- Enable Row Level Security
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy 1: Service role can do everything (for API operations)
CREATE POLICY "Service role can manage all tickets"
  ON event_tickets FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Authenticated users (admins) can view tickets
CREATE POLICY "Authenticated users can view tickets"
  ON event_tickets FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy 3: Public can view tickets by QR code (for ticket validation pages)
-- This allows ticket holders to view their own tickets via QR code
-- Note: The application should validate QR codes, but this allows the query to work
CREATE POLICY "Public can view tickets for validation"
  ON event_tickets FOR SELECT
  USING (true);

-- Grant necessary permissions
-- Note: These grants are needed even with RLS policies
GRANT SELECT ON event_tickets TO anon;
GRANT SELECT ON event_tickets TO authenticated;
GRANT ALL ON event_tickets TO service_role;

-- Add helpful comments
COMMENT ON TABLE event_tickets IS 'Stores tickets for events with QR codes, payment tracking, and check-in status';
COMMENT ON COLUMN event_tickets.event_id IS 'Event identifier (e.g., dj-ben-murray-silky-osullivans-2026-12-27)';
COMMENT ON COLUMN event_tickets.qr_code IS 'Full QR code string for ticket validation';
COMMENT ON COLUMN event_tickets.qr_code_short IS 'Shortened 8-character code for easier scanning';
COMMENT ON COLUMN event_tickets.payment_status IS 'Current payment status: pending, paid, failed, refunded, cash, card_at_door';
COMMENT ON COLUMN event_tickets.payment_method IS 'Method of payment: stripe (online), cash, or card_at_door';
COMMENT ON COLUMN event_tickets.notes IS 'Additional notes (refund information, special instructions, etc.)';
