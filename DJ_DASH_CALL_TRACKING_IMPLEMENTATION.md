# 📞 DJ Dash Call Tracking & Revenue Capture System

## Overview

This system tracks all incoming phone calls from DJ Dash hosted pages, captures revenue through TipJar integration, and provides comprehensive analytics for DJs and platform administrators.

## Features

✅ **Dynamic Number Insertion (DNI)** - Replaces DJ's real phone number with platform-generated virtual numbers  
✅ **Call Logging** - Tracks all calls with metadata (caller, duration, status, page URL)  
✅ **Click-to-Call** - Mobile-optimized call buttons and desktop number display  
✅ **TipJar Integration** - Automatic SMS follow-up with payment links after calls  
✅ **Revenue Tracking** - Calculates platform cut and DJ revenue from TipJar payments  
✅ **Analytics Dashboard** - Comprehensive call analytics for DJs and admins  

## Database Schema

### `dj_calls` Table
Tracks all incoming calls with comprehensive metadata:
- `id` (uuid) - Primary key
- `dj_profile_id` (uuid) - Reference to DJ profile
- `virtual_number` (text) - Platform-generated number
- `caller_number` (text) - Caller's phone number
- `caller_name` (text) - Caller's name (if available)
- `timestamp` (timestamptz) - Call timestamp
- `page_url` (text) - URL where call originated
- `event_type` (text) - Type of event (optional)
- `lead_score` (text) - 'hot', 'warm', or 'cold' (default: 'hot')
- `is_booked` (boolean) - Whether call resulted in booking
- `call_duration_seconds` (integer) - Call duration
- `call_status` (text) - 'completed', 'no-answer', 'busy', 'failed', 'voicemail'
- `call_sid` (text) - Twilio Call SID
- `tipjar_link_sent` (boolean) - Whether TipJar link was sent
- `tipjar_link` (text) - TipJar payment link
- `tipjar_payment_received` (boolean) - Whether payment was received
- `tipjar_payment_amount` (decimal) - Payment amount
- `product_context` (text) - Always 'djdash'
- `notes` (text) - Additional notes/transcription

### `dj_virtual_numbers` Table
Maps virtual phone numbers to DJ profiles:
- `id` (uuid) - Primary key
- `dj_profile_id` (uuid) - Reference to DJ profile
- `virtual_number` (text) - Virtual phone number (unique)
- `twilio_phone_number_sid` (text) - Twilio Phone Number SID
- `real_phone_number` (text) - DJ's actual phone number
- `is_active` (boolean) - Whether number is active
- `product_context` (text) - Always 'djdash'

## API Endpoints

### POST `/api/djdash/calls`
Log a new call.

**Request Body:**
```json
{
  "dj_profile_id": "uuid",
  "virtual_number": "+1234567890",
  "caller_number": "+1987654321",
  "caller_name": "John Doe",
  "page_url": "https://djdash.net/dj/dj-slug",
  "event_type": "wedding",
  "call_sid": "CAxxxxx",
  "call_status": "completed",
  "call_duration_seconds": 120
}
```

**Response:**
```json
{
  "success": true,
  "call": { /* call record */ }
}
```

### GET `/api/djdash/calls`
Get calls for a DJ.

**Query Parameters:**
- `dj_profile_id` (required) - DJ profile ID
- `start_date` (optional) - Start date filter
- `end_date` (optional) - End date filter
- `product_context` (optional, default: 'djdash')

**Response:**
```json
{
  "success": true,
  "calls": [ /* array of call records */ ]
}
```

### GET `/api/djdash/calls/analytics`
Get aggregated call statistics.

**Query Parameters:**
- `dj_profile_id` (required) - DJ profile ID
- `start_date` (optional) - Start date filter
- `end_date` (optional) - End date filter

**Response:**
```json
{
  "success": true,
  "analytics": {
    "totalCalls": 150,
    "bookedCalls": 45,
    "conversionRate": 30.0,
    "totalRevenue": 4500.00,
    "platformCut": 675.00,
    "djRevenue": 3825.00,
    "leadScoreBreakdown": {
      "hot": 90,
      "warm": 40,
      "cold": 20
    },
    "eventTypeBreakdown": {
      "wedding": 80,
      "corporate": 30,
      "party": 40
    },
    "avgCallDuration": 180,
    "tipjarLinksSent": 120,
    "tipjarPaymentsReceived": 30
  }
}
```

### POST `/api/djdash/virtual-numbers`
Assign/create virtual number for a DJ.

**Request Body:**
```json
{
  "dj_profile_id": "uuid",
  "real_phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "virtualNumber": { /* virtual number record */ }
}
```

### GET `/api/djdash/virtual-numbers`
Get virtual number for a DJ.

**Query Parameters:**
- `dj_profile_id` (required) - DJ profile ID

**Response:**
```json
{
  "success": true,
  "virtualNumber": { /* virtual number record */ }
}
```

### POST `/api/djdash/calls/incoming`
Twilio webhook for incoming calls to virtual numbers.

### POST `/api/djdash/calls/webhook`
Twilio webhook for call status updates.

### POST `/api/djdash/calls/voicemail`
Twilio webhook for voicemail transcription.

## Frontend Components

### `DJPhoneNumber` Component
Displays virtual phone number with click-to-call functionality.

**Props:**
- `djProfileId` (string, required) - DJ profile ID
- `fallbackNumber` (string, optional) - Fallback number if virtual number not available

**Usage:**
```tsx
<DJPhoneNumber 
  djProfileId={profile.id}
  fallbackNumber={profile.social_links?.phone}
/>
```

### `CallAnalytics` Component
Displays comprehensive call analytics dashboard.

**Props:**
- `djProfileId` (string, required) - DJ profile ID

**Usage:**
```tsx
<CallAnalytics djProfileId={profile.id} />
```

## Setup Instructions

### 1. Database Migration
Run the migration to create the necessary tables:
```bash
# Migration file: supabase/migrations/20250215000000_create_dj_calls_tracking.sql
```

### 2. Twilio Configuration
1. Set up Twilio account and get credentials
2. Add environment variables:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

3. Configure Twilio webhooks:
   - **Voice URL**: `https://yourdomain.com/api/djdash/calls/incoming`
   - **Status Callback URL**: `https://yourdomain.com/api/djdash/calls/webhook`

### 3. Virtual Number Management
You have two options:

**Option A: Pre-purchase Numbers**
- Purchase a pool of Twilio phone numbers
- Store them in a separate table
- Assign from pool when DJ signs up

**Option B: On-demand Purchase**
- Modify `/api/djdash/virtual-numbers/index.js` to purchase numbers on-demand
- Note: Twilio charges apply for each number

### 4. TipJar Integration
Update the `generateTipJarLink` function in `/api/djdash/calls/webhook.js` to integrate with your TipJar system:

```javascript
async function generateTipJarLink(djProfileId, callerNumber) {
  // Call your TipJar API to create a payment session
  const response = await fetch('/api/tipjar/create-session', {
    method: 'POST',
    body: JSON.stringify({
      dj_profile_id: djProfileId,
      caller_number: callerNumber,
      amount: null, // Optional default amount
      description: 'Event booking deposit'
    })
  });
  
  const data = await response.json();
  return data.paymentUrl;
}
```

### 5. Update DJ Profile Pages
The phone number component is already integrated into the DJ profile page template. Ensure virtual numbers are assigned when DJs publish their profiles.

## Revenue Capture Flow

1. **Call Initiated**: User clicks call button or dials virtual number
2. **Call Logged**: System logs call with metadata
3. **Call Forwarded**: Twilio forwards call to DJ's real number
4. **Call Completed**: Webhook updates call status and duration
5. **SMS Follow-up**: If call > 10 seconds, SMS sent with TipJar link
6. **Payment Tracking**: TipJar webhook updates call record when payment received
7. **Revenue Calculation**: Platform cut (15%) and DJ revenue calculated

## Analytics & Reporting

### DJ Dashboard
DJs can view:
- Total calls received
- Conversion rate (calls to bookings)
- Revenue from TipJar payments
- Lead score breakdown
- Average call duration
- Calls by event type

### Admin Dashboard
Admins can view:
- All calls across all DJs
- Platform-wide revenue
- Top performing DJs
- Call volume trends

## Security & RLS

- **RLS Policies**: All tables have Row Level Security enabled
- **DJ Access**: DJs can only view their own calls
- **Admin Access**: Admins can view all calls
- **System Access**: Service role key required for API operations
- **Product Context**: All records must have `product_context = 'djdash'`

## Testing

1. **Test Call Logging**:
   ```bash
   curl -X POST http://localhost:3000/api/djdash/calls \
     -H "Content-Type: application/json" \
     -d '{
       "dj_profile_id": "uuid",
       "virtual_number": "+1234567890",
       "caller_number": "+1987654321"
     }'
   ```

2. **Test Analytics**:
   ```bash
   curl http://localhost:3000/api/djdash/calls/analytics?dj_profile_id=uuid
   ```

3. **Test Virtual Number Assignment**:
   ```bash
   curl -X POST http://localhost:3000/api/djdash/virtual-numbers \
     -H "Content-Type: application/json" \
     -d '{
       "dj_profile_id": "uuid",
       "real_phone_number": "+1234567890"
     }'
   ```

## Troubleshooting

### Virtual Number Not Showing
- Check if virtual number is assigned: `GET /api/djdash/virtual-numbers?dj_profile_id=xxx`
- Verify DJ profile is published
- Check RLS policies

### Calls Not Being Logged
- Verify Twilio webhooks are configured correctly
- Check webhook URLs are accessible
- Review server logs for errors

### TipJar Links Not Sending
- Verify Twilio SMS credentials
- Check `sendTipJarFollowUp` function
- Ensure call duration > 10 seconds

### Revenue Not Calculating
- Verify TipJar webhook integration
- Check `tipjar_payment_received` flag is being set
- Review payment amount field

## Future Enhancements

- [ ] Call recording playback
- [ ] AI-powered call transcription analysis
- [ ] Automated lead scoring based on call content
- [ ] Integration with CRM for automatic contact creation
- [ ] Multi-language support for SMS follow-ups
- [ ] A/B testing for TipJar link messaging
- [ ] Real-time call dashboard
- [ ] Call quality metrics

## Support

For issues or questions, check:
- Database migration logs
- API endpoint logs
- Twilio webhook logs
- Supabase RLS policy logs











