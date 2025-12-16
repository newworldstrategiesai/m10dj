# Fix Password Reset Email Spam Issues

## Problem
Password reset emails are going to spam while magic link emails work fine.

## Quick Fixes

### 1. Update Subject Line in Supabase (CRITICAL)

The subject line is a major spam trigger. Update it in Supabase:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click **"Reset Password"** template
3. Change subject line from:
   - ❌ `Reset Your Password` (spam trigger)
   - ✅ `Password Reset Request - M10 DJ Company` (better)
   - ✅ `Your M10 DJ Company Password Reset` (even better)

### 2. Verify Redirect URL is Allowed

Password reset emails must have the redirect URL in Supabase's allowed list:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, ensure these are added:
   - `https://tipjar.live/auth/reset_password`
   - `https://m10djcompany.com/auth/reset_password`
   - `http://localhost:3000/auth/reset_password` (for dev)
3. Click **Save**

### 3. Check SMTP Configuration

If using custom SMTP (Resend, SendGrid, etc.):

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Verify:
   - ✅ **Sender Email** uses your verified domain (e.g., `hello@m10djcompany.com`)
   - ❌ Don't use `onboarding@resend.dev` or Supabase default
   - ✅ **SMTP Host/Port** are correct
   - ✅ **SMTP User/Password** are correct

### 4. Update Email Template Content

The template has been updated to reduce spam triggers:
- Changed "Reset Your Password" → "Password Reset Request"
- Changed "Reset My Password" button → "Create New Password"
- Softened security notice language
- Removed excessive urgency language

**To apply:**
1. Copy the updated `email-templates/reset-password.html`
2. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
3. Paste into **"Reset Password"** template
4. Update subject line (see #1 above)
5. Click **Save**

### 5. Verify DNS Records (If Using Custom Domain)

If sending from `@m10djcompany.com` or `@tipjar.live`:

**Required DNS Records:**
- ✅ **SPF** (TXT): `v=spf1 include:resend.com ~all`
- ✅ **DKIM** (CNAME): From your email provider
- ✅ **DMARC** (TXT): `v=DMARC1; p=quarantine; rua=mailto:dmarc@m10djcompany.com`

**Verify:**
```bash
# Check SPF
dig TXT m10djcompany.com | grep spf

# Check DMARC
dig TXT _dmarc.m10djcompany.com
```

### 6. Test Email Deliverability

**Quick Test:**
1. Request password reset for your email
2. Check spam folder
3. If in spam, check email headers:
   - Gmail: Open email → Three dots → "Show original"
   - Look for: `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`

**Mail-Tester:**
1. Go to [Mail-Tester.com](https://www.mail-tester.com/)
2. Get test email address
3. Request password reset to that address
4. Check score (aim for 8+/10)

## Why Magic Link Works But Password Reset Doesn't

Common differences:
1. **Subject line** - "Reset Password" is a spam trigger word
2. **Link format** - Password reset links might look more suspicious
3. **Email frequency** - Password resets are less common, so filters are stricter
4. **Template content** - Password reset emails often have more "urgent" language

## Recommended Subject Lines (Least Spammy)

✅ **Best:**
- `Your M10 DJ Company Password Reset`
- `Password Reset Request - M10 DJ Company`
- `Update Your M10 DJ Company Password`

❌ **Avoid:**
- `Reset Your Password` (too generic)
- `URGENT: Password Reset Required` (spam trigger)
- `Action Required: Reset Password` (spam trigger)
- `Password Reset - Click Now` (spam trigger)

## Supabase Configuration Checklist

- [ ] Subject line updated (see recommendations above)
- [ ] Redirect URL added to allowed list
- [ ] Email template updated (use improved version)
- [ ] SMTP sender uses verified domain
- [ ] DNS records verified (SPF, DKIM, DMARC)
- [ ] Test email sent and checked
- [ ] Email goes to inbox (not spam)

## If Still Going to Spam

1. **Wait 24-48 hours** - DNS changes take time to propagate
2. **Check email headers** - Verify SPF/DKIM/DMARC all pass
3. **Use Mail-Tester** - Get specific feedback on issues
4. **Contact Supabase Support** - They can check email logs
5. **Consider custom auth domain** - Use `auth.m10djcompany.com` instead of Supabase URLs

## Quick Action Items

**Do Now:**
1. ✅ Update subject line in Supabase
2. ✅ Verify redirect URL is in allowed list
3. ✅ Update email template with improved version

**Do This Week:**
1. ✅ Verify DNS records
2. ✅ Test email deliverability
3. ✅ Monitor spam folder for improvements

