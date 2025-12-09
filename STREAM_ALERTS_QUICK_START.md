# Stream Alerts Quick Start

## For Developers: Integrating Alerts into Your Payment Flow

### 1. Import the helper functions

```typescript
import { 
  broadcastTipAlert,
  broadcastSongRequestAlert,
  broadcastMerchPurchaseAlert,
  broadcastFollowerAlert,
  broadcastSubscriberAlert
} from '@/lib/stream-alerts';
```

### 2. Call after successful payment/action

```typescript
// Example: After Stripe payment succeeds
async function handleSuccessfulPayment(userId: string, amount: number, customerName: string, message?: string) {
  // Process payment...
  
  // Broadcast alert
  await broadcastTipAlert(userId, amount, customerName, message);
}
```

### 3. Example: Stripe Webhook Handler

```typescript
// pages/api/webhooks/stripe.ts or app/api/webhooks/stripe/route.ts
import { broadcastTipAlert } from '@/lib/stream-alerts';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Get user_id from metadata
    const userId = paymentIntent.metadata.user_id;
    const amount = paymentIntent.amount / 100; // Convert from cents
    const customerName = paymentIntent.metadata.customer_name || 'Anonymous';
    const message = paymentIntent.metadata.message;

    if (userId) {
      await broadcastTipAlert(userId, amount, customerName, message);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

## For Streamers: Setting Up in OBS

1. **Get your Alert URL:**
   - Go to https://tipjar.live/tipjar/dashboard/stream-alerts
   - Copy your Alert URL (e.g., `https://tipjar.live/tipjar/alerts/@yourusername`)

2. **Add Browser Source in OBS:**
   - Right-click in Sources → Add → Browser Source
   - Name it "TipJar Alerts"
   - URL: Paste your Alert URL
   - Width: 1920
   - Height: 1080
   - ✅ Shutdown source when not visible
   - ✅ Refresh browser when scene becomes active

3. **Position and Style:**
   - Position the source where you want alerts to appear
   - The alerts will appear based on your layout position setting (center, left, right, top, bottom)

4. **Test:**
   - Use the "Test Alert" button in the dashboard
   - You should see a test alert appear in OBS

## URL Formats

- **By Username:** `https://tipjar.live/tipjar/alerts/@username`
- **By Token:** `https://tipjar.live/tipjar/alerts?user=your-token`
- **By User ID:** `https://tipjar.live/tipjar/alerts?user=user-uuid`

## Sound Files Setup

Place these files in `/public/sounds/`:

- `alert-default.mp3`
- `alert-cash.mp3`
- `alert-coin.mp3`
- `alert-success.mp3`
- `alert-celebration.mp3`

You can find free sound effects at:
- [Freesound.org](https://freesound.org)
- [Zapsplat](https://www.zapsplat.com)
- [Mixkit](https://mixkit.co/free-sound-effects/)

## Testing

1. **Dashboard Test Button:**
   - Go to `/tipjar/dashboard/stream-alerts`
   - Click "Test Alert"
   - Should see a $20 tip alert

2. **API Test:**
   ```bash
   curl -X POST https://tipjar.live/api/tipjar/stream-alerts/broadcast \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "your-user-id",
       "event_type": "tip",
       "event_data": {
         "amount": 25.00,
         "name": "Test Donor",
         "message": "Testing alerts!"
       }
     }'
   ```

## Troubleshooting

- **Alerts not showing?** Check browser console, verify Realtime is enabled
- **Sounds not playing?** Check browser autoplay policies, verify files exist
- **Real-time not working?** Verify Supabase Realtime is enabled for `stream_alert_events` table

For more details, see [STREAM_ALERTS_SETUP.md](./STREAM_ALERTS_SETUP.md)

