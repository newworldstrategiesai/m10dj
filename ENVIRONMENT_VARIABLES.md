# Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe (existing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# LiveKit Cloud (NEW - provided)
LIVEKIT_URL=wss://tip-jar-eqd4nnqw.livekit.cloud
LIVEKIT_API_KEY=APIBzAkJEE3qZzR
LIVEKIT_API_SECRET=A4JMYtX7kUwgDeW5RpkHGWZb6MMn7VHQglcypehoDo6

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# In production: NEXT_PUBLIC_SITE_URL=https://tipjar.live
```

## Getting LiveKit Keys

1. Sign up at https://cloud.livekit.io
2. Create a new project
3. Go to Settings → API Keys
4. Copy:
   - Server URL (wss://your-project.livekit.cloud)
   - API Key
   - API Secret

## Testing Locally with ngrok

1. Install ngrok: `npm install -g ngrok` or `brew install ngrok`
2. Start dev server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update LiveKit webhook to: `https://abc123.ngrok.io/api/livekit/webhook`
6. Test streaming at the ngrok URL

