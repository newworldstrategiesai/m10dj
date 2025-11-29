# Calendly-like Scheduling System

## Overview
A complete scheduling system similar to Calendly that allows clients to book meetings with Ben. Includes availability management, booking system, and email confirmations.

## What's Been Implemented

### ✅ Database Schema (`supabase/migrations/20250101000000_create_scheduling_system.sql`)
- **meeting_types**: Different types of meetings (consultation, planning, etc.)
- **availability_patterns**: Recurring availability (e.g., "Monday-Friday 9am-5pm")
- **availability_overrides**: One-time availability changes (block dates or add specific slots)
- **meeting_bookings**: Actual bookings with client info, date/time, status
- Row-level security policies for admin and public access

### ✅ Public Scheduling Page (`pages/schedule/index.tsx`)
- Beautiful, responsive calendar interface
- Meeting type selection
- Date selection with calendar widget
- Time slot selection
- Booking form with client information
- Real-time availability checking
- Mobile-optimized design

### ✅ API Endpoint (`pages/api/schedule/available-slots.js`)
- Fetches available time slots for a given date
- Respects availability patterns and bookings
- Handles blocked dates
- Returns formatted time slots

## What Still Needs to Be Done

### 🔨 API Simplification
The available-slots API has duplicate logic and needs to be cleaned up. It should:
1. Get availability patterns for the selected day
2. Get meeting type duration
3. Generate time slots in 15-minute intervals
4. Filter out booked times
5. Return clean array of available slots

### 📅 Admin Availability Management Page
Create `/admin/availability` page where Ben can:
- Set recurring availability patterns (e.g., "Weekdays 9am-5pm")
- Block specific dates
- Set different availability for different meeting types
- View and manage availability calendar

### 📧 Email Confirmations
Create email templates and sending logic for:
- Booking confirmation email to client
- Booking notification email to admin
- Reminder emails (24 hours before meeting)
- Cancellation emails

### ✅ Booking Confirmation Page
Create `/schedule/confirm/[id]` page that shows:
- Booking confirmation details
- Calendar invite download (.ics file)
- Reschedule/cancel options
- Meeting details

### 📊 Admin Bookings Management Page
Create `/admin/bookings` page where Ben can:
- View all bookings in calendar/list view
- Filter by status, date range, meeting type
- View booking details
- Reschedule or cancel bookings
- Mark as completed/no-show

### 🔄 Booking API Endpoint
Create `/api/schedule/book` endpoint that:
- Validates booking request
- Checks availability
- Creates booking record
- Sends confirmation emails
- Returns booking confirmation

### 🧪 Default Availability Setup
Create initial availability patterns:
- Weekdays 9am-5pm for consultations
- Weekdays 10am-4pm for planning meetings
- Buffer times between meetings

## How to Use

### For Admins:
1. Run the database migration
2. Set up default availability in admin panel
3. View and manage bookings in admin dashboard

### For Clients:
1. Visit `/schedule`
2. Select meeting type
3. Choose date from calendar
4. Select available time slot
5. Fill in contact information
6. Confirm booking
7. Receive email confirmation

## Next Steps Priority

1. **Simplify and fix available-slots API** - Make it work correctly
2. **Create booking API endpoint** - Handle booking creation
3. **Create admin availability page** - Allow Ben to set availability
4. **Add email confirmations** - Send booking emails
5. **Create confirmation page** - Show booking success
6. **Create admin bookings page** - Manage all bookings

## Technical Notes

- Uses Supabase for database
- React Day Picker for calendar component
- Time slots generated in 15-minute intervals
- Timezone support (defaults to America/Chicago)
- Prevents double bookings with unique constraint
- RLS policies ensure security

## Integration Points

- Links to contact system (can link booking to contact_id)
- Links to submissions (can link booking to contact_submission_id)
- Email system (Resend integration for confirmations)
- Calendar sync (future: Google Calendar integration)

