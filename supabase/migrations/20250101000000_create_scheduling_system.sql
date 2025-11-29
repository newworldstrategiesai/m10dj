-- Scheduling System Tables
-- Supports Calendly-like scheduling functionality

-- Meeting types (consultation, planning meeting, follow-up, etc.)
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color for calendar display
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default meeting types
INSERT INTO meeting_types (name, description, duration_minutes, color, display_order) VALUES
  ('Consultation', 'Initial consultation to discuss your event', 30, '#3b82f6', 1),
  ('Planning Meeting', 'Detailed planning session for your event', 60, '#8b5cf6', 2),
  ('Follow-up Call', 'Quick follow-up call', 15, '#10b981', 3),
  ('Final Details', 'Final event details and timeline review', 45, '#f59e0b', 4)
ON CONFLICT DO NOTHING;

-- Availability patterns (recurring availability)
CREATE TABLE IF NOT EXISTS availability_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- e.g., "Monday-Friday 9am-5pm"
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday, NULL=any day
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/Chicago',
  is_active BOOLEAN DEFAULT TRUE,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE SET NULL,
  buffer_before_minutes INTEGER DEFAULT 0, -- Buffer time before each meeting
  buffer_after_minutes INTEGER DEFAULT 15, -- Buffer time after each meeting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One-time availability overrides (specific dates/times)
CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/Chicago',
  is_available BOOLEAN DEFAULT TRUE, -- FALSE means blocked/not available
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE SET NULL,
  reason TEXT, -- e.g., "Out of town", "Holiday"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, start_time, meeting_type_id)
);

-- Meeting bookings
CREATE TABLE IF NOT EXISTS meeting_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Link to existing contact if applicable
  contact_submission_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL, -- Link to submission if applicable
  
  -- Client information (stored even if contact exists for historical records)
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Meeting details
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  timezone TEXT DEFAULT 'America/Chicago',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Meeting context
  event_type TEXT, -- wedding, corporate, etc.
  event_date DATE,
  notes TEXT,
  special_requests TEXT,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  
  -- Communication
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Video call link (if applicable)
  video_call_link TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no double bookings for same time slot
  CONSTRAINT no_double_booking UNIQUE (meeting_date, meeting_time, meeting_type_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_patterns_day ON availability_patterns(day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_availability_overrides_date ON availability_overrides(date, is_available);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_date ON meeting_bookings(meeting_date, meeting_time);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_contact ON meeting_bookings(contact_id);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_status ON meeting_bookings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_bookings_date_range ON meeting_bookings(meeting_date, status) WHERE status IN ('scheduled', 'confirmed');

-- Function to get available time slots for a given date and meeting type
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_date DATE,
  p_meeting_type_id UUID DEFAULT NULL,
  p_timezone TEXT DEFAULT 'America/Chicago'
)
RETURNS TABLE (
  time_slot TIME,
  is_available BOOLEAN,
  reason TEXT
) AS $$
DECLARE
  day_of_week INTEGER;
  existing_bookings TIME[];
BEGIN
  -- Get day of week (0=Sunday, 6=Saturday)
  day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get existing bookings for this date and meeting type
  SELECT ARRAY_AGG(meeting_time)
  INTO existing_bookings
  FROM meeting_bookings
  WHERE meeting_date = p_date
    AND (p_meeting_type_id IS NULL OR meeting_type_id = p_meeting_type_id)
    AND status IN ('scheduled', 'confirmed');
  
  -- Check for one-time overrides (blocked dates)
  IF EXISTS (
    SELECT 1 FROM availability_overrides
    WHERE date = p_date
      AND is_available = FALSE
      AND (p_meeting_type_id IS NULL OR meeting_type_id = p_meeting_type_id)
  ) THEN
    RETURN; -- No available slots if date is blocked
  END IF;
  
  -- Return time slots from availability patterns
  RETURN QUERY
  SELECT 
    generate_series(
      pattern.start_time,
      pattern.end_time - (pattern.duration_minutes || ' minutes')::INTERVAL,
      '15 minutes'::INTERVAL
    )::TIME as time_slot,
    TRUE as is_available,
    NULL::TEXT as reason
  FROM availability_patterns pattern
  JOIN meeting_types mt ON pattern.meeting_type_id = mt.id
  WHERE pattern.is_active = TRUE
    AND (pattern.day_of_week IS NULL OR pattern.day_of_week = day_of_week)
    AND (p_meeting_type_id IS NULL OR pattern.meeting_type_id = p_meeting_type_id)
    AND (existing_bookings IS NULL OR generate_series(
      pattern.start_time,
      pattern.end_time - (mt.duration_minutes || ' minutes')::INTERVAL,
      '15 minutes'::INTERVAL
    )::TIME != ALL(existing_bookings));
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_bookings ENABLE ROW LEVEL SECURITY;

-- Public can view active meeting types and check availability
CREATE POLICY "Anyone can view active meeting types"
  ON meeting_types FOR SELECT
  USING (is_active = TRUE);

-- Admins can manage everything
CREATE POLICY "Admins can manage meeting types"
  ON meeting_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

CREATE POLICY "Admins can manage availability"
  ON availability_patterns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

CREATE POLICY "Admins can manage overrides"
  ON availability_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Anyone can create bookings (public scheduling)
CREATE POLICY "Anyone can create bookings"
  ON meeting_bookings FOR INSERT
  WITH CHECK (TRUE);

-- Admins can view and manage all bookings
CREATE POLICY "Admins can manage bookings"
  ON meeting_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

-- Users can view their own bookings (by email)
CREATE POLICY "Users can view own bookings"
  ON meeting_bookings FOR SELECT
  USING (
    client_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN ('admin@m10djcompany.com', 'djbenmurray@gmail.com')
    )
  );

