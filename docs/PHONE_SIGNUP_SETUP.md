# Phone-Only Sign Up / Sign In

TipJar (and optionally other products) can let users register and sign in using only their phone number—no email or password required.

## What’s implemented

- **Database**: `handle_new_user_organization` supports phone-only users (`auth.users.email` can be null); org name/slug derived from metadata or phone.
- **API**: `POST /api/auth/phone-otp` — rate-limited request for SMS OTP (body: `{ phone, productContext?, organizationName? }`).
- **UI**:  
  - **Sign up**: `/tipjar/signup/phone` — enter phone (and optional business name) → receive 6-digit code → verify → redirect to dashboard.  
  - **Sign in**: `/tipjar/signin/phone` — same flow (existing users get signed in; new numbers get an account).
- **Main signup**: TipJar signup page includes a “Sign up with phone (no password)” link.

## Supabase: enable Phone auth and Twilio

1. **Supabase Dashboard** (hosted):  
   - **Authentication → Providers** → enable **Phone**.  
   - Under Phone, choose **Twilio** and set:
     - **Twilio Account SID**
     - **Twilio Auth Token** (or use [Twilio Verify](https://www.twilio.com/verify) if you prefer)
     - **Twilio Message Service SID** (optional; recommended for better delivery)

2. **Self-hosted / local** (`supabase/config.toml`):  
   - `[auth.sms]` is already present with `enable_signup = true`.  
   - Set `[auth.sms.twilio]`:
     - `enabled = true`
     - `account_sid = "ACxxxx"`
     - `message_service_sid = "MGxxxx"` (optional)
     - `auth_token = "env(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN)"`  
   - In `.env`:  
     `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=your_twilio_auth_token`

3. **Testing without SMS** (local):  
   In `config.toml`, under `[auth.sms.test_otp]`, add a mapping, e.g.  
   `4152127777 = "123456"`  
   Then use that number and code to sign in without sending a real SMS.

## Cross-product notes

- Phone signup is currently wired for **TipJar** (`product_context: 'tipjar'`).  
- The same flow can be used for DJ Dash or M10 by adding product-specific routes and passing `productContext` in the phone-otp request.
- Rate limits: 5 OTP requests per 15 min per IP, 3 per 5 min per phone number.
