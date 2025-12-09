# Stream Alerts Setup Guide

This guide will help you set up the real-time stream alerts system for TipJar.live.

## Overview

The stream alerts system allows streamers to display beautiful, animated alerts in OBS Studio, Streamlabs Desktop, TikTok LIVE Studio, YouTube Live, and other streaming platforms when viewers send tips, song requests, purchase merch, or subscribe.

## Features

- ✅ Real-time alerts via Supabase Realtime
- ✅ 5 built-in themes (Dark, Neon, Retro, Minimal, Pride)
- ✅ Customizable appearance (colors, fonts, backgrounds, layout)
- ✅ Sound effects with volume control
- ✅ Text-to-speech support
- ✅ Donor ticker
- ✅ Goal progress bar
- ✅ Confetti animations for tips ≥ $10
- ✅ Multiple alert types (Tip, Song Request, Merch Purchase, Follower, Subscriber)
- ✅ OBS-ready (pointer-events disabled by default)

## Database Setup

1. **Run the migration:**
   ```bash
   npx supabase migration up
   ```
   
   Or manually run the SQL file:
   ```bash
   psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20250101000000_create_stream_alerts.sql
   ```

2. **Enable Realtime for the events table:**
   The migration should automatically add `stream_alert_events` to the `supabase_realtime` publication. Verify in Supabase Dashboard:
   - Go to Database → Replication
   - Ensure `stream_alert_events` is enabled

## Configuration

### For Streamers

1. **Sign up/Log in** to TipJar.live
2. **Navigate to** `/tipjar/dashboard/stream-alerts`
3. **Configure your alerts:**
   - Choose a theme
   - Set layout position
   - Customize colors and fonts
   - Upload background image (optional)
   - Configure sounds
   - Set up goal bar (optional)
   - Enable/disable features

4. **Copy your Alert URL:**
   - The dashboard will show your unique URL
   - Format: `https://tipjar.live/tipjar/alerts/@username` or `https://tipjar.live/tipjar/alerts?user=token`

5. **Add to OBS/Streamlabs:**
   - Add a Browser Source
   - Paste your Alert URL
   - Set width: 1920, height: 1080 (or your stream resolution)
   - Check "Shutdown source when not visible" (optional)
   - Check "Refresh browser when scene becomes active" (optional)

## Broadcasting Alerts

### API Endpoint

When a tip, song request, merch purchase, or subscription happens, call the broadcast API:

**Endpoint:** `POST /api/tipjar/stream-alerts/broadcast`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "user_id": "uuid-of-streamer",
  "event_type": "tip",
  "event_data": {
    "amount": 20.00,
    "name": "John Doe",
    "message": "Great stream!"
  }
}
```

### Event Types

#### 1. Tip
```json
{
  "user_id": "uuid",
  "event_type": "tip",
  "event_data": {
    "amount": 20.00,
    "name": "John Doe",
    "message": "Great stream!" // optional
  }
}
```

#### 2. Song Request
```json
{
  "user_id": "uuid",
  "event_type": "song_request",
  "event_data": {
    "song_title": "Bohemian Rhapsody",
    "artist": "Queen",
    "name": "Jane Smith"
  }
}
```

#### 3. Merch Purchase
```json
{
  "user_id": "uuid",
  "event_type": "merch_purchase",
  "event_data": {
    "item_name": "T-Shirt",
    "name": "Bob Johnson"
  }
}
```

#### 4. Follower
```json
{
  "user_id": "uuid",
  "event_type": "follower",
  "event_data": {
    "name": "Alice"
  }
}
```

#### 5. Subscriber
```json
{
  "user_id": "uuid",
  "event_type": "subscriber",
  "event_data": {
    "name": "Charlie",
    "tier": "Tier 1" // optional
  }
}
```

### Webhook Integration Example

If you're using Stripe for payments, add this to your webhook handler:

```typescript
// In your Stripe webhook handler
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// After processing a successful payment
async function broadcastTipAlert(userId: string, amount: number, customerName: string, message?: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/tipjar/stream-alerts/broadcast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      event_type: 'tip',
      event_data: {
        amount,
        name: customerName,
        message: message || '',
      },
    }),
  });

  if (!response.ok) {
    console.error('Failed to broadcast alert:', await response.text());
  }
}
```

## Sound Files

The system includes 5 built-in sounds. Place these files in `/public/sounds/`:

- `alert-default.mp3` - Default alert sound
- `alert-cash.mp3` - Cash register sound
- `alert-coin.mp3` - Coin drop sound
- `alert-success.mp3` - Success chime
- `alert-celebration.mp3` - Celebration fanfare

You can use free sound effects from:
- [Freesound.org](https://freesound.org)
- [Zapsplat](https://www.zapsplat.com)
- [Mixkit](https://mixkit.co/free-sound-effects/)

## Testing

1. **Use the Test Alert button** in the dashboard
2. **Or manually create a test event:**
   ```sql
   INSERT INTO stream_alert_events (user_id, event_type, event_data)
   VALUES (
     'your-user-id',
     'tip',
     '{"amount": 20, "name": "Test Donor", "message": "Test alert!"}'::jsonb
   );
   ```

## Performance Optimization

The alerts page is optimized for:
- **Fast loading** (<1 second)
- **Low memory usage** (<50 MB)
- **Smooth animations** (60 FPS)
- **OBS compatibility** (pointer-events disabled)

## Troubleshooting

### Alerts not showing
1. Check that Realtime is enabled for `stream_alert_events` table
2. Verify the user_id in the broadcast matches the streamer's user_id
3. Check browser console for errors
4. Ensure the alerts page is loaded and subscribed to the channel

### Sounds not playing
1. Check browser autoplay policies (may require user interaction first)
2. Verify sound files exist in `/public/sounds/`
3. Check volume settings in configuration

### Real-time not working
1. Verify Supabase Realtime is enabled in your project
2. Check that the table is added to the `supabase_realtime` publication
3. Ensure you're using the correct Supabase URL and keys

## Security

- Alert URLs are public but require valid user_id or alert_token
- Users can set a custom username for easier sharing
- Alert tokens are randomly generated and unique per user
- RLS policies ensure users can only view their own configurations

## Next Steps

1. **Add sound files** to `/public/sounds/`
2. **Test alerts** using the dashboard test button
3. **Set up webhooks** to broadcast alerts when events occur
4. **Customize themes** if needed
5. **Share with streamers** and get feedback!

## Support

For issues or questions:
- Check the browser console for errors
- Verify database migrations ran successfully
- Ensure Supabase Realtime is properly configured
- Review the API endpoint responses

---

**Built with ❤️ for TipJar.live**

