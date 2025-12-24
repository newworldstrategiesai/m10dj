-- Set up default availability patterns for scheduling system
-- This migration sets up basic weekday availability for consultations

-- Insert default availability patterns if they don't exist
INSERT INTO availability_patterns (
  name,
  day_of_week,
  start_time,
  end_time,
  timezone,
  is_active,
  buffer_before_minutes,
  buffer_after_minutes
)
SELECT * FROM (VALUES
  ('Weekdays 9am-5pm', 1, '09:00:00'::TIME, '17:00:00'::TIME, 'America/Chicago', true, 0, 15),
  ('Weekdays 9am-5pm', 2, '09:00:00'::TIME, '17:00:00'::TIME, 'America/Chicago', true, 0, 15),
  ('Weekdays 9am-5pm', 3, '09:00:00'::TIME, '17:00:00'::TIME, 'America/Chicago', true, 0, 15),
  ('Weekdays 9am-5pm', 4, '09:00:00'::TIME, '17:00:00'::TIME, 'America/Chicago', true, 0, 15),
  ('Weekdays 9am-5pm', 5, '09:00:00'::TIME, '17:00:00'::TIME, 'America/Chicago', true, 0, 15)
) AS v(name, day_of_week, start_time, end_time, timezone, is_active, buffer_before_minutes, buffer_after_minutes)
WHERE NOT EXISTS (
  SELECT 1 FROM availability_patterns 
  WHERE availability_patterns.name = v.name 
    AND availability_patterns.day_of_week = v.day_of_week
    AND availability_patterns.start_time = v.start_time::TIME
);

-- Note: Meeting type associations can be set up through the admin panel
-- This provides basic availability that works for all meeting types

