import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerSupabaseClient({ req, res });
    const { date, meeting_type_id } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Validate date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Don't allow past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ error: 'Cannot book meetings in the past' });
    }

    // Get meeting type ID (use first active if not specified)
    let meetingTypeId = meeting_type_id || null;
    if (!meetingTypeId) {
      const { data: meetingTypes } = await supabase
        .from('meeting_types')
        .select('id')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1);
      
      if (meetingTypes && meetingTypes.length > 0) {
        meetingTypeId = meetingTypes[0].id;
      }
    }

    // Get meeting type duration
    let durationMinutes = 30;
    if (meetingTypeId) {
      const { data: meetingType } = await supabase
        .from('meeting_types')
        .select('duration_minutes')
        .eq('id', meetingTypeId)
        .single();
      
      if (meetingType) {
        durationMinutes = meetingType.duration_minutes || 30;
      }
    }

    // Get day of week (0=Sunday, 6=Saturday)
    const dayOfWeek = selectedDate.getDay();

    // Check for blocked dates (overrides)
    const { data: blockedOverrides } = await supabase
      .from('availability_overrides')
      .select('id')
      .eq('date', date)
      .eq('is_available', false)
      .limit(1);

    if (blockedOverrides && blockedOverrides.length > 0) {
      return res.status(200).json({ 
        availableSlots: [],
        isBlocked: true,
        message: 'No availability on this date'
      });
    }

    // Get availability patterns for this day
    const { data: patterns, error: patternsError } = await supabase
      .from('availability_patterns')
      .select('*')
      .eq('is_active', true)
      .or(`day_of_week.is.null,day_of_week.eq.${dayOfWeek}`)
      .order('start_time', { ascending: true });

    if (patternsError) {
      console.error('Error fetching patterns:', patternsError);
      return res.status(500).json({ error: 'Failed to fetch availability patterns' });
    }

    if (!patterns || patterns.length === 0) {
      return res.status(200).json({ 
        availableSlots: [],
        isBlocked: false,
        message: 'No availability patterns set for this day'
      });
    }

    // Get existing bookings for this date
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('meeting_bookings')
      .select('meeting_time, duration_minutes')
      .eq('meeting_date', date)
      .in('status', ['scheduled', 'confirmed']);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Generate time slots from patterns
    const slots = [];
    const bookedTimes = new Set((existingBookings || []).map(b => b.meeting_time));

    patterns.forEach(pattern => {
      // Filter by meeting type if specified
      if (meetingTypeId && pattern.meeting_type_id && pattern.meeting_type_id !== meetingTypeId) {
        return;
      }

      const [startHours, startMins] = pattern.start_time.split(':').map(Number);
      const [endHours, endMins] = pattern.end_time.split(':').map(Number);
      
      let currentHour = startHours;
      let currentMin = startMins;
      
      // Generate 15-minute intervals
      while (currentHour < endHours || (currentHour === endHours && currentMin < endMins)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        // Calculate if slot fits with duration
        const slotEndMin = currentMin + durationMinutes;
        const slotEndHour = currentHour + Math.floor(slotEndMin / 60);
        const slotEndMinRemainder = slotEndMin % 60;
        
        // Check if slot fits before end time
        if (slotEndHour < endHours || (slotEndHour === endHours && slotEndMinRemainder <= endMins)) {
          // Check if not booked
          if (!bookedTimes.has(timeString)) {
            const dateTime = new Date(`${date}T${timeString}`);
            slots.push({
              time: timeString,
              formatted: dateTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })
            });
          }
        }
        
        // Move to next 15-minute slot
        currentMin += 15;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }
    });

    // Remove duplicates and sort
    const uniqueSlots = Array.from(
      new Map(slots.map(s => [s.time, s])).values()
    ).sort((a, b) => a.time.localeCompare(b.time));

    return res.status(200).json({
      availableSlots: uniqueSlots,
      isBlocked: false,
      date: date
    });

  } catch (error) {
    console.error('Error in available-slots API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
