# Live Streaming Setup Guide

This guide will help you set up browser-based live streaming with LiveKit Cloud for TipJar.live.

## Prerequisites

- LiveKit Cloud account (sign up at https://cloud.livekit.io)
- Stripe account (already configured)
- Supabase project (already configured)

## 1. LiveKit Cloud Setup

1. **Sign up for LiveKit Cloud:**
   - Go to https://cloud.livekit.io
   - Create a free account (includes 10GB/month free)
   - Create a new project

2. **Get your credentials:**
   - In your LiveKit Cloud dashboard, go to Settings → API Keys
   - Copy your:
     - Server URL (e.g., `wss://your-project.livekit.cloud`)
     - API Key
     - API Secret

3. **Add to environment variables:**
   ```bash
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your-api-key
   LIVEKIT_API_SECRET=your-api-secret
   ```

## 2. Install Dependencies

```bash
npm install livekit-server-sdk @livekit/components-react @livekit/components-styles
```

## 3. Database Setup

Run the migration to create the `live_streams` table:

```bash
npx supabase migration up
```

Or manually run:
```bash
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/20250102000000_create_live_streams.sql
```

## 4. Configure LiveKit Webhook (Optional)

1. In LiveKit Cloud dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/livekit/webhook`
3. Select events:
   - `room_started`
   - `room_finished`
   - `participant_joined`
   - `participant_left`

## 5. Stripe Webhook Integration

Update your existing Stripe webhook handler to broadcast tips to live streams.

**Example integration:**

```typescript
// In your Stripe webhook handler (e.g., pages/api/webhooks/stripe.ts)
import { broadcastTipToLiveStream } from '@/lib/livekit-tip-broadcast';

export default async function handler(req, res) {
  const event = stripe.webhooks.constructEvent(...);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Check if this is a live stream tip
    if (session.metadata?.type === 'live_stream_tip') {
      const streamerUserId = session.metadata.streamer_user_id;
      const tipperName = session.metadata.tipper_name;
      const tipMessage = session.metadata.tip_message;
      const amount = session.amount_total / 100; // Convert from cents

      // Broadcast to live stream
      await broadcastTipToLiveStream(streamerUserId, {
        amount,
        name: tipperName,
        message: tipMessage,
      });
    }
  }

  res.json({ received: true });
}
```

## 6. Testing

### Test as Streamer:

1. **Go to dashboard:**
   - Navigate to `/dashboard/go-live`
   - Sign in if needed

2. **Start streaming:**
   - Click "Go Live"
   - Allow camera/microphone permissions
   - Your stream should start

3. **Share your URL:**
   - Copy the stream URL from the dashboard
   - Share with viewers

### Test as Viewer:

1. **Open viewer page:**
   - Go to `/live/@username` (replace with your username)
   - You should see the live stream

2. **Test tipping:**
   - Click the "Tip" button
   - Complete a test payment
   - Tip should appear in chat and as an alert

## 7. URLs

- **Viewer Page:** `https://tipjar.live/live/@username`
- **Streamer Dashboard:** `https://tipjar.live/dashboard/go-live`
- **LiveKit Token API:** `POST /api/livekit/token`
- **LiveKit Webhook:** `POST /api/livekit/webhook`
- **Tip Session API:** `POST /api/tipjar/create-tip-session`

## 8. Features

✅ Browser-based streaming (no OBS needed)  
✅ Real-time video/audio via WebRTC  
✅ Live chat with Supabase Realtime  
✅ In-stream tipping with Stripe  
✅ Tip alerts in chat and overlay  
✅ Pay-per-view support  
✅ Stream controls (start/stop)  
✅ Mobile-friendly viewer experience  

## 9. Troubleshooting

### Stream not connecting:
- Check LiveKit credentials in environment variables
- Verify room name matches in database
- Check browser console for errors

### Tips not appearing:
- Verify Stripe webhook is configured
- Check webhook handler is calling `broadcastTipToLiveStream`
- Check Supabase Realtime is enabled

### Video/audio issues:
- Ensure browser permissions are granted
- Check LiveKit Cloud dashboard for connection status
- Verify network allows WebRTC traffic

## 10. Production Checklist

- [ ] LiveKit Cloud project created
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Database migration run
- [ ] LiveKit webhook configured (optional)
- [ ] Stripe webhook updated
- [ ] Test streaming as streamer
- [ ] Test viewing as viewer
- [ ] Test tipping flow
- [ ] Verify tip alerts appear

## Support

For issues:
- Check browser console for errors
- Verify all environment variables are set
- Check LiveKit Cloud dashboard for connection status
- Review Supabase logs for Realtime issues

---

**Built with ❤️ for TipJar.live**

