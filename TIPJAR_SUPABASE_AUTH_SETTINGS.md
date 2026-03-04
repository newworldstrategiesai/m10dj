# 🔐 TipJar Supabase Auth Settings Checklist

## Critical Settings for Login to Work

### 1. **Redirect URLs** (MOST IMPORTANT)

Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**

Add these redirect URLs to the **"Redirect URLs"** list:

**Production:**
```
https://tipjar.live/auth/callback
https://tipjar.live/auth/reset_password
https://www.tipjar.live/auth/callback
https://www.tipjar.live/auth/reset_password
```

**Local Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/reset_password
http://localhost:3006/auth/callback
http://localhost:3006/auth/reset_password
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3006/auth/callback
```

**For Deploy Previews (if using Vercel):**
```
https://*-your-username.vercel.app/auth/callback
https://*-your-username.vercel.app/auth/reset_password
```

**Click "Save" after adding all URLs.**

---

### 2. **Site URL**

Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**

Set **"Site URL"** to:
```
https://www.tipjar.live
```
(or `https://tipjar.live` if you use non-www)

This is the base URL Supabase uses for email links and redirects.

**Manual invites:** If you invite users from **Supabase Dashboard** (Authentication → Users → Invite), the email link uses this Site URL. Use `https://www.tipjar.live` so the confirmation link lands on TipJar. The app will then redirect them to the working sign-in page (`/tipjar/signin/password_signin`) even if the link was generated with another domain.

---

### 3. **Email Confirmation Settings**

Go to: **Supabase Dashboard** → **Authentication** → **Settings**

Check the **"Enable email confirmations"** setting:

**Option A: Disable Email Confirmation (Easier for Testing)**
- ✅ Uncheck "Enable email confirmations"
- Users can sign in immediately after signup
- **Good for:** Testing, development, quick onboarding

**Option B: Keep Email Confirmation Enabled (Recommended for Production)**
- ✅ Keep "Enable email confirmations" checked
- Users must click email link before they can sign in
- **Good for:** Production, security, preventing fake accounts

**If email confirmation is enabled:**
- User must check their email and click the confirmation link
- The link will redirect to `/auth/callback` which should be in your redirect URLs (see #1)
- After confirmation, they'll be redirected to the dashboard

---

### 4. **Password Auth Provider**

Go to: **Supabase Dashboard** → **Authentication** → **Providers**

Make sure **"Email"** provider is enabled:
- ✅ **Enable Email provider** should be ON
- ✅ **Confirm email** - See setting #3 above
- ✅ **Secure email change** - Can be enabled for extra security

---

### 5. **Check User Account Status**

If you're testing with `memphismillennial@gmail.com`:

1. Go to: **Supabase Dashboard** → **Authentication** → **Users**
2. Search for the email address
3. Check:
   - ✅ **Email confirmed?** - If not, user needs to click email confirmation link
   - ✅ **User is active?** - Should be enabled
   - ✅ **Last sign in** - Check if there are any errors

**If email is not confirmed:**
- Option 1: Disable email confirmation (see #3)
- Option 2: Resend confirmation email from Supabase dashboard
- Option 3: Manually confirm the user in Supabase dashboard

---

### 6. **Email Templates (Optional but Recommended)**

Go to: **Supabase Dashboard** → **Authentication** → **Email Templates**

Update subject lines to reduce spam:

**Confirm Signup:**
- Subject: `Welcome to TipJar - Confirm Your Account`

**Reset Password:**
- Subject: `TipJar Password Reset Request`

**Magic Link:**
- Subject: `Sign in to TipJar`

---

## Quick Test Checklist

After configuring the above settings:

1. ✅ **Redirect URLs added** (including localhost:3006)
2. ✅ **Site URL set** to `https://tipjar.live`
3. ✅ **Email provider enabled**
4. ✅ **Email confirmation** configured (enabled or disabled)
5. ✅ **User account exists** and is confirmed (if email confirmation is enabled)

---

## Common Login Issues & Fixes

### Issue: "Invalid login credentials"
**Possible causes:**
- Wrong email or password
- Email not confirmed (if email confirmation is enabled)
- User account is disabled

**Fix:**
- Verify email/password are correct
- Check if email is confirmed in Supabase dashboard
- Try resetting password

### Issue: "Redirect URL not allowed"
**Cause:** The redirect URL isn't in the allowed list

**Fix:**
- Add the redirect URL to Supabase → Authentication → URL Configuration → Redirect URLs
- Make sure to include both `http://localhost:3006` and `https://tipjar.live` versions

### Issue: "Email not confirmed"
**Cause:** Email confirmation is enabled but user hasn't clicked the confirmation link

**Fix:**
- Check email inbox (and spam folder) for confirmation email
- Or disable email confirmation in Supabase settings
- Or manually confirm the user in Supabase dashboard

### Issue: Login works but redirects to wrong page
**Cause:** Redirect URL configuration issue

**Fix:**
- Check that `/auth/callback` is in the redirect URLs list
- Verify the callback route is working: `https://tipjar.live/auth/callback`

---

## Testing Steps

1. **Test Sign Up:**
   - Go to `http://localhost:3006/tipjar/signin/password_signin`
   - Click "Don't have an account? Sign up"
   - Create a new account
   - Check if email confirmation is required

2. **Test Sign In:**
   - Go to `http://localhost:3006/tipjar/signin/password_signin`
   - Enter email: `memphismillennial@gmail.com`
   - Enter password: `FakeMoney2026!`
   - Click "Sign in"
   - Should redirect to `/tipjar/dashboard` or `/tipjar/onboarding`

3. **Test Email Confirmation (if enabled):**
   - Check email inbox for confirmation link
   - Click the link
   - Should redirect to `/auth/callback` then to dashboard

---

## Need Help?

If login still doesn't work after checking all these settings:

1. **Check Supabase Logs:**
   - Go to: **Supabase Dashboard** → **Logs** → **Auth Logs**
   - Look for errors related to your login attempts

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for any error messages

3. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Try logging in
   - Look for failed requests (red status codes)
   - Check the response for error messages

4. **Verify Environment Variables:**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
   - Check in Vercel dashboard (for production) or `.env.local` (for local)

