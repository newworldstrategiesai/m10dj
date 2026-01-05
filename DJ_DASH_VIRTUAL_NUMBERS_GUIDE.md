# 📞 DJ Dash Virtual Number Management Guide

## Overview

Virtual numbers are proxy phone numbers that replace DJs' real phone numbers on their profile pages. This enables:
- **Call Tracking**: Track all incoming calls with analytics
- **Call Recording**: Record calls for quality assurance
- **Privacy**: Protect DJs' real phone numbers
- **Revenue Capture**: Track calls that convert to bookings

## How Virtual Numbers Work

1. **DJ Profile Published** → System assigns a virtual number
2. **User Calls Virtual Number** → Call routed through Twilio
3. **Twilio Forwards Call** → To DJ's real phone number
4. **Call Logged** → All metadata stored in database
5. **Analytics Tracked** → Call duration, conversion, revenue

## Generating Virtual Numbers

### Method 1: Automatic Assignment (Recommended)

When a DJ profile is published, the system automatically assigns a virtual number:

```bash
POST /api/djdash/virtual-numbers
{
  "dj_profile_id": "uuid",
  "real_phone_number": "+19011234567"
}
```

**How it works:**
1. Checks for available numbers from existing Twilio numbers
2. If none available, searches for and purchases a new number
3. Configures Twilio webhooks automatically
4. Stores mapping in database

### Method 2: Pre-purchase Number Pool

Purchase numbers in bulk and assign them as needed:

```bash
# Purchase 10 numbers for the pool
POST /api/djdash/virtual-numbers/pool
{
  "count": 10,
  "areaCode": "901"  // Optional: Memphis area code
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully purchased 10 number(s)",
  "numbers": [
    {
      "phoneNumber": "+19015551234",
      "sid": "PNxxxxx",
      "friendlyName": null
    }
  ]
}
```

### Method 3: Manual Assignment via Admin

1. **List Available Numbers:**
```bash
GET /api/djdash/virtual-numbers/pool
```

2. **Assign to DJ:**
```bash
POST /api/djdash/virtual-numbers
{
  "dj_profile_id": "uuid",
  "real_phone_number": "+19011234567"
}
```

## Number Pool Management

### View Number Pool Status

```bash
GET /api/djdash/virtual-numbers/pool
```

**Response:**
```json
{
  "success": true,
  "pool": {
    "total": 25,
    "available": 15,
    "assigned": 10,
    "numbers": {
      "available": [
        {
          "phoneNumber": "+19015551234",
          "sid": "PNxxxxx",
          "friendlyName": null,
          "dateCreated": "2025-01-15T10:00:00Z"
        }
      ],
      "assigned": [
        {
          "phoneNumber": "+19015551235",
          "sid": "PNyyyyy",
          "assignedTo": "DJ Ben Murray",
          "isActive": true
        }
      ]
    }
  }
}
```

### Release Unused Numbers

```bash
DELETE /api/djdash/virtual-numbers/pool
{
  "phone_number_sid": "PNxxxxx"
}
```

**Note:** Cannot release numbers that are currently assigned to DJs.

## Setup Instructions

### 1. Twilio Configuration

1. **Get Twilio Credentials:**
   - Account SID
   - Auth Token
   - Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   ```

2. **Configure Webhooks:**
   - The system automatically configures webhooks when assigning numbers
   - Voice URL: `https://yourdomain.com/api/djdash/calls/incoming`
   - Status Callback: `https://yourdomain.com/api/djdash/calls/webhook`

### 2. Initial Number Pool Setup

**Option A: Purchase Numbers in Bulk (Recommended)**
```bash
# Purchase 20 numbers for your pool
curl -X POST https://yourdomain.com/api/djdash/virtual-numbers/pool \
  -H "Content-Type: application/json" \
  -d '{
    "count": 20,
    "areaCode": "901"
  }'
```

**Option B: Let System Purchase On-Demand**
- Numbers will be purchased automatically when DJs sign up
- More expensive but requires no upfront setup

### 3. Assign Numbers to DJs

**Automatic (Recommended):**
- When DJ publishes profile, call the assignment API
- System automatically finds available number or purchases new one

**Manual:**
```bash
curl -X POST https://yourdomain.com/api/djdash/virtual-numbers \
  -H "Content-Type: application/json" \
  -d '{
    "dj_profile_id": "uuid-here",
    "real_phone_number": "+19011234567"
  }'
```

## Cost Considerations

### Twilio Pricing (as of 2025)
- **Phone Number Purchase**: ~$1.00/month per number
- **Incoming Calls**: ~$0.0085/minute
- **Call Recording**: ~$0.0025/minute
- **SMS**: ~$0.0075 per message

### Best Practices
1. **Pre-purchase Pool**: Buy 20-50 numbers upfront for better cost control
2. **Reuse Numbers**: When DJ deactivates, number returns to pool
3. **Area Code Selection**: Choose area codes matching your service area
4. **Monitor Usage**: Track number utilization to optimize pool size

## API Endpoints Reference

### Get Virtual Number for DJ
```bash
GET /api/djdash/virtual-numbers?dj_profile_id=uuid
```

### Assign/Create Virtual Number
```bash
POST /api/djdash/virtual-numbers
{
  "dj_profile_id": "uuid",
  "real_phone_number": "+19011234567"
}
```

### Update Virtual Number
```bash
PUT /api/djdash/virtual-numbers
{
  "dj_profile_id": "uuid",
  "real_phone_number": "+19019876543",  // Optional
  "is_active": false  // Optional: deactivate
}
```

### List Number Pool
```bash
GET /api/djdash/virtual-numbers/pool
```

### Purchase Numbers for Pool
```bash
POST /api/djdash/virtual-numbers/pool
{
  "count": 10,
  "areaCode": "901"  // Optional
}
```

### Release Number from Pool
```bash
DELETE /api/djdash/virtual-numbers/pool
{
  "phone_number_sid": "PNxxxxx"
}
```

## Troubleshooting

### No Numbers Available
**Error:** `No available phone numbers found`

**Solutions:**
1. Purchase numbers for the pool: `POST /api/djdash/virtual-numbers/pool`
2. Check Twilio account has available numbers
3. Verify Twilio credentials are correct

### Number Not Forwarding Calls
**Issue:** Calls to virtual number don't reach DJ

**Check:**
1. Verify webhooks are configured: Check Twilio console
2. Verify `real_phone_number` is correct in database
3. Check Twilio logs for errors
4. Verify webhook URLs are accessible

### Number Already Assigned
**Error:** `Virtual number already exists`

**Solution:**
- Use PUT endpoint to update existing assignment
- Or deactivate old assignment first

### Cannot Release Number
**Error:** `Cannot release assigned number`

**Solution:**
- Deactivate the number first: `PUT /api/djdash/virtual-numbers` with `is_active: false`
- Then release from pool

## Best Practices

1. **Pre-purchase Pool**: Buy 20-50 numbers upfront
2. **Monitor Pool Size**: Keep 10-20% buffer of available numbers
3. **Reuse Numbers**: When DJs deactivate, numbers return to pool
4. **Area Code Strategy**: Use area codes matching your primary service area
5. **Regular Cleanup**: Release unused numbers monthly to reduce costs
6. **Webhook Monitoring**: Monitor Twilio webhook logs for issues

## Integration with DJ Profile Publishing

When a DJ profile is published, automatically assign a virtual number:

```javascript
// In your profile publishing logic
async function publishDJProfile(djProfileId, realPhoneNumber) {
  // Publish profile
  await supabase
    .from('dj_profiles')
    .update({ is_published: true })
    .eq('id', djProfileId);

  // Assign virtual number
  const response = await fetch('/api/djdash/virtual-numbers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dj_profile_id: djProfileId,
      real_phone_number: realPhoneNumber
    })
  });

  if (!response.ok) {
    console.error('Failed to assign virtual number');
  }
}
```

## Security Notes

- **Service Role Key Required**: Virtual number APIs require service role key
- **RLS Policies**: Database has RLS enabled for DJ access
- **Real Numbers Protected**: Real phone numbers never exposed on profile pages
- **Webhook Security**: Twilio webhooks should validate requests

## Support

For issues:
1. Check Twilio console for number status
2. Review API logs for errors
3. Verify database records in `dj_virtual_numbers` table
4. Check webhook configuration in Twilio









