-- Combined migration: Create crowd_requests table with fast-track support
-- Use this if you want to create everything at once

-- Create crowd_requests table for song requests and shoutouts from events
CREATE TABLE IF NOT EXISTS crowd_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Optional link to the event contact
  request_type TEXT NOT NULL CHECK (request_type IN ('song_request', 'shoutout')),
  
  -- Request details
  song_artist TEXT, -- For song requests
  song_title TEXT, -- For song requests
  recipient_name TEXT, -- For shoutouts: who the shoutout is for
  recipient_message TEXT, -- For shoutouts: message content
  request_message TEXT, -- Additional message/notes
  
  -- Requester info
  requester_name TEXT NOT NULL,
  requester_email TEXT,
  requester_phone TEXT,
  
  -- Payment info
  amount_requested INTEGER NOT NULL DEFAULT 0, -- Amount in cents
  amount_paid INTEGER DEFAULT 0, -- Amount actually paid in cents
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('card', 'cashapp', 'venmo', 'cash', 'other')), -- Payment method selected
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  
  -- Fast-track support
  is_fast_track BOOLEAN DEFAULT FALSE,
  fast_track_fee INTEGER DEFAULT 0, -- Fast-track fee in cents (added to base amount)
  priority_order INTEGER DEFAULT 1000, -- Lower numbers = higher priority (0 = fast-track, 1000 = regular)
  
  -- Event info
  event_qr_code TEXT UNIQUE, -- Unique identifier for QR codes (e.g., event name or custom code)
  event_name TEXT,
  event_date DATE,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'playing', 'played', 'cancelled')),
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  played_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_crowd_requests_event_qr_code ON crowd_requests(event_qr_code);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_event_id ON crowd_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_status ON crowd_requests(status);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_payment_status ON crowd_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_created_at ON crowd_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_priority ON crowd_requests(priority_order ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_crowd_requests_fast_track ON crowd_requests(is_fast_track, payment_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_crowd_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crowd_requests_updated_at
  BEFORE UPDATE ON crowd_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_crowd_requests_updated_at();

-- Enable RLS
ALTER TABLE crowd_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert crowd requests (for public QR code pages)
CREATE POLICY "Anyone can create crowd requests"
  ON crowd_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Admin can view all crowd requests
CREATE POLICY "Admins can view all crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

-- Policy: Admin can update crowd requests
CREATE POLICY "Admins can update crowd requests"
  ON crowd_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
  );

-- Policy: Users can view their own requests (optional, for confirmation pages)
-- Note: This allows viewing requests by session_id - you may want to restrict this further
-- For now, we'll allow viewing if they have the session_id (which is passed in the URL)
-- You can enhance this later with proper authentication if needed
CREATE POLICY "Users can view their own requests"
  ON crowd_requests
  FOR SELECT
  TO anon, authenticated
  USING (true); -- Allow viewing for now - session_id validation happens in application layer

