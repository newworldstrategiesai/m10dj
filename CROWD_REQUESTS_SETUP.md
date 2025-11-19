# 🎵 Crowd Requests System - Setup Guide

## Overview

The Crowd Requests system allows event attendees to scan a QR code and request songs or shoutouts while making payments. This creates an interactive experience at events and generates additional revenue.

## Features

- ✅ **QR Code Generation**: Create unique QR codes for each event
- ✅ **Song Requests**: Attendees can request songs with optional artist names
- ✅ **Shoutouts**: Attendees can request shoutouts for special people
- ✅ **Fast-Track Option**: Pay extra ($10) to skip the queue and get priority placement
- ✅ **Flexible Pricing**: Preset amounts ($5, $10, $20, $50) or custom amounts
- ✅ **Stripe Integration**: Secure payment processing
- ✅ **Admin Dashboard**: View and manage all requests with fast-track highlighted
- ✅ **Status Tracking**: Track request status (new, acknowledged, playing, played)
- ✅ **Priority Queue**: Fast-track requests automatically appear first in admin dashboard

## Setup Steps

### 1. Run Database Migrations

Run the database migrations to create the `crowd_requests` table with fast-track support:

```sql
-- First migration: Create crowd_requests table
-- supabase/migrations/20250121000000_create_crowd_requests.sql

-- Second migration: Add fast-track support
-- supabase/migrations/20250121000001_add_fast_track_to_crowd_requests.sql
```

Or run both files directly in your Supabase SQL Editor.

### 2. Access Admin Dashboard

1. Navigate to `/admin/crowd-requests` in your admin panel
2. You'll see the "Crowd Requests" link in the sidebar navigation

### 3. Generate QR Code for an Event

1. Click "Generate QR Code" button in the admin dashboard
2. Enter:
   - **Event Code**: Unique identifier (e.g., `wedding-2025-01-15` or `sarah-michael-wedding`)
   - **Event Name** (optional): For display purposes
   - **Event Date** (optional): For tracking
3. Click "Generate QR Code"
4. The QR code will appear - you can:
   - Download it as PNG
   - Copy the URL to share digitally
   - Print it for physical display

### 4. Share QR Code with Attendees

- **Print QR Code**: Print the QR code and display it at your event
- **Digital Share**: Share the URL with attendees via text, email, or social media
- **URL Format**: `https://yoursite.com/crowd-request/[event-code]`

Example: `https://m10djcompany.com/crowd-request/wedding-2025-01-15`

### 5. How It Works for Attendees

1. Attendee scans QR code or visits the URL
2. They choose:
   - **Song Request**: Enter song title and optional artist
   - **Shoutout**: Enter recipient name and message
3. They enter their information (name required, email/phone optional)
4. They choose payment amount:
   - Quick amounts: $5, $10, $20, $50
   - Custom amount: Enter any amount (minimum $1.00)
5. **For Song Requests Only**: They can optionally add Fast-Track for $10
   - Fast-Track moves their song to the front of the queue
   - Their request will be played next!
   - Fast-Track fee is added to the base payment amount
6. They submit and are redirected to Stripe Checkout
7. After payment, they see a confirmation page
   - Fast-Track requests show special confirmation message

### 6. Admin Management

In the admin dashboard (`/admin/crowd-requests`), you can:

- **View All Requests**: See all song requests and shoutouts
- **Filter by Status**: Filter by new, acknowledged, playing, played, or payment status
- **Search**: Search by requester name, song title, artist, recipient name, or event code
- **Update Status**: Change request status (new → acknowledged → playing → played)
- **View Details**: See full request details including:
  - Requester information
  - Song details or shoutout message
  - Payment amount and status
  - Submission timestamp

### 7. Status Workflow

Recommended workflow for managing requests:

1. **New**: Request submitted and paid
2. **Acknowledged**: DJ has seen the request and will handle it
3. **Playing**: Currently playing the song or doing the shoutout
4. **Played**: Request completed
5. **Cancelled**: Request cancelled (refund may be needed manually)

## File Structure

```
pages/
├── crowd-request/
│   ├── [code].js          # Public page where attendees make requests
│   └── success.js          # Payment success confirmation page
├── api/
│   └── crowd-request/
│       ├── submit.js       # API to submit request and create Stripe checkout
│       ├── event-info.js   # API to fetch event info by code
│       └── details.js      # API to fetch request details
└── admin/
    └── crowd-requests.tsx  # Admin dashboard for managing requests

supabase/migrations/
└── 20250121000000_create_crowd_requests.sql  # Database schema

components/ui/Sidebar/
└── AdminSidebar.tsx        # Admin navigation (includes Crowd Requests link)
```

## API Endpoints

### Submit Request
```
POST /api/crowd-request/submit
Body: {
  eventCode: string,
  requestType: 'song_request' | 'shoutout',
  songArtist?: string,
  songTitle?: string,
  recipientName?: string,
  recipientMessage?: string,
  requesterName: string,
  requesterEmail?: string,
  requesterPhone?: string,
  message?: string,
  amount: number (in cents)
}
Returns: { checkoutUrl: string, requestId: string }
```

### Get Event Info
```
GET /api/crowd-request/event-info?code={eventCode}
Returns: { event_name, event_date, venue_name }
```

### Get Request Details
```
GET /api/crowd-request/details?id={requestId}
Returns: CrowdRequest object
```

## Stripe Webhook

The Stripe webhook (`/api/stripe/webhook`) has been updated to handle crowd request payments. When a payment succeeds:

1. The `crowd_requests` table is updated with payment info
2. Payment status is set to `paid`
3. Request status is set to `acknowledged`
4. Admin is notified (if notification system is configured)

## Fast-Track Feature

### How Fast-Track Works

**For Attendees:**
- Available only for song requests (not shoutouts)
- Adds $10.00 to the base payment amount
- Moves the song to the front of the queue
- Song will be played next after current song finishes

**For Admins:**
- Fast-track requests appear first in the dashboard (sorted by priority)
- Visually highlighted with orange border and badge
- Shows "⚡ Fast-Track" badge next to request title
- Fast-track fee displayed separately in amount column

**Pricing Breakdown:**
- Base amount: User-selected payment ($1+ minimum)
- Fast-Track fee: +$10.00 (automatically added)
- Total: Base amount + $10.00 (if fast-track selected)

### Admin Queue Management

Requests are automatically sorted:
1. **Fast-Track requests** (priority_order = 0) - appear first
2. **Regular requests** (priority_order = 1000) - appear after fast-track
3. Within each group, sorted by creation date (newest first)

This ensures fast-track requests are always visible at the top of the queue.

## Best Practices

### Event Code Naming
- Use descriptive, unique codes: `wedding-2025-01-15` or `sarah-michael-wedding`
- Avoid spaces - use hyphens or underscores
- Keep it short for easy typing if sharing URL manually

### Pricing Strategy
- Consider setting a minimum tip amount ($5-$10) for shoutouts
- Song requests might be lower ($1-$5) for higher volume
- Custom amounts allow flexibility for special occasions
- Fast-track at $10 provides good revenue boost while maintaining accessibility

### Fast-Track Best Practices
- Communicate clearly that fast-track moves song to front of queue
- Consider adjusting fast-track fee based on event (higher for premium events)
- Monitor fast-track usage - if queue is empty, fast-track isn't necessary
- Always play fast-track requests promptly to maintain trust

### Display at Events
- Print QR codes large enough to scan easily (at least 3"x3")
- Place multiple QR codes around the venue
- Consider having staff members with QR codes on their phones/tablets
- Display a short URL if possible: `m10djcompany.com/qr/[event-code]`

### Managing Requests
- Acknowledge requests promptly so attendees know you saw them
- Use the status workflow to track which requests have been played
- Consider having a "priority" queue for higher-paying requests
- Update status to "playing" when you start the request
- Mark as "played" when complete

## Troubleshooting

### QR Code Not Working
- Verify the event code is correct and matches the URL
- Check that the page route exists: `/crowd-request/[code]`
- Test the URL directly in a browser first

### Payments Not Processing
- Verify Stripe keys are set in environment variables
- Check Stripe webhook is configured and receiving events
- Review webhook logs in Stripe dashboard

### Requests Not Appearing in Admin
- Check database RLS policies allow admin access
- Verify you're logged in as an admin user
- Check browser console for errors

### QR Code Generation Not Working
- The QR code service (api.qrserver.com) should work without installation
- For offline/local QR generation, consider installing `qrcode` npm package

## Future Enhancements

Potential improvements you could add:

- Link requests to specific event/contact records
- Auto-populate event info when scanning QR code
- Email confirmations to requesters
- SMS notifications when request is played
- Request queue display at events
- Request analytics and revenue reports
- Bulk status updates
- Refund functionality
- Request scheduling/timing preferences

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review server logs for API errors
3. Verify database migration ran successfully
4. Check Stripe webhook configuration
5. Test payment flow in Stripe test mode first

---

**Ready to use!** Generate your first QR code and start accepting requests at your next event! 🎉

