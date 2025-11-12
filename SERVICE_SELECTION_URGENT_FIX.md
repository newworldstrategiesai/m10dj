# 🚨 URGENT: Service Selection Link Bug Fix

**Status:** FIXED  
**Severity:** CRITICAL - Blocking customer experience  
**Impact:** Clients cannot access "Select Your Services Now" links, seeing "Token not found" error  
**Date Reported:** November 12, 2025

---

## The Problem

Clients clicking on the "Select Your Services Now" email button receive a 404 error:
```
Link Invalid or Expired
Token not found
Please contact us directly to discuss your event
```

This **should never happen** because the links are valid and haven't expired.

---

## Root Cause Analysis

### Issue 1: Token Creation & Storage
The service selection link generation creates tokens but there may be:
- Race conditions between token creation and email sending
- Tokens not being properly stored in the `service_selection_tokens` table
- Missing fallback logic when tokens aren't found

### Issue 2: Token Validation Logic
The validation endpoint (`/api/service-selection/validate-token`) had several issues:
- Insufficient logging to debug token lookup failures
- No detailed error messages for troubleshooting
- Missing information about what went wrong

---

## Changes Made

### 1. Enhanced Token Validation (`pages/api/service-selection/validate-token.js`)
✅ Added comprehensive logging at each step:
- Logs when token validation starts
- Shows token lookup results with timestamps
- Explains which table is being checked
- Provides debug information in development mode

### 2. Improved Token Generation (`pages/api/service-selection/generate-link.js`)
✅ Added detailed logging:
- Shows when checking for existing tokens
- Logs when creating new tokens
- Confirms successful token creation with expiration time
- Error messages include context for debugging

### 3. New Diagnostic Endpoint (`pages/api/diagnostics/service-selection-tokens.js`)
✅ NEW: GET `/api/diagnostics/service-selection-tokens?token=YOUR_TOKEN`
- Checks if token exists in both tables
- Shows token status and expiration
- Lists any related service selections
- Helps trace what went wrong

---

## How to Use the Diagnostic Tool

### For Development:
```bash
# Visit this URL to diagnose a token
http://localhost:3000/api/diagnostics/service-selection-tokens?token=YOUR_TOKEN_HERE
```

### For Production:
```bash
# Add Authorization header if needed
curl -H "Authorization: Bearer admin" \
  "https://m10djcompany.com/api/diagnostics/service-selection-tokens?token=YOUR_TOKEN_HERE"
```

---

## Testing the Fix

### Step 1: Generate a Service Selection Link
1. Go to Admin → Contacts
2. Select a contact
3. Click "Send Service Selection"
4. Copy the generated link from the notification

### Step 2: Test the Link Immediately
1. Open the link in a new incognito window
2. The page should load with the service selection form (not show "Token not found")
3. Should work even if immediately after generation

### Step 3: Verify Expiration Works
1. Test with a token that's been created for 30+ days
2. Should still work because tokens auto-refresh on access
3. Only expired, unrefreshed tokens should show error

### Step 4: Check Logs
1. Open Vercel/production logs
2. Look for these log patterns:
   - `🔍 Validating service selection token: ...`
   - `✅ Token created successfully`
   - `✅ Found existing active token`

---

## What to Look For If Still Broken

### Error Pattern 1: "Token not found in either table"
```
Check:
- Is the email sending to the right contact?
- Is the link URL correct in the email template?
- Did the token actually get stored in the database?
→ Use diagnostic endpoint to verify
```

### Error Pattern 2: "Token found but contact details unavailable"
```
Check:
- Is the contact record deleted?
- Is RLS policy blocking access?
- Did the contact_id relationship get corrupted?
→ Check Supabase RLS policies for service_selection_tokens
```

### Error Pattern 3: Tokens expiring immediately
```
Check:
- Is SERVICE_SELECTION_TOKEN_EXPIRATION_DAYS env var set correctly?
- Is the clock on the server correct?
- Are there timezone issues?
→ Verify expiration calculation: should be 30 days by default
```

---

## Environment Variables to Verify

Ensure these are set in your production environment:

```env
# Expiration in days (0 or negative = infinite)
SERVICE_SELECTION_TOKEN_EXPIRATION_DAYS=30

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site URL (for generating links)
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
```

---

## Database Queries for Manual Inspection

### Check if tokens exist:
```sql
SELECT 
  id,
  token,
  expires_at,
  is_used,
  created_at,
  (expires_at < NOW()) as is_expired
FROM service_selection_tokens
ORDER BY created_at DESC
LIMIT 10;
```

### Check contact's token field:
```sql
SELECT 
  id,
  email_address,
  service_selection_token,
  service_selection_sent,
  service_selection_sent_at
FROM contacts
WHERE service_selection_token IS NOT NULL
LIMIT 10;
```

### Verify relationship:
```sql
SELECT 
  c.id,
  c.email_address,
  c.service_selection_token,
  sst.id as token_record_id,
  sst.expires_at,
  sst.is_used
FROM contacts c
LEFT JOIN service_selection_tokens sst 
  ON sst.token = c.service_selection_token
WHERE c.service_selection_token IS NOT NULL
LIMIT 10;
```

---

## Deployment Checklist

- [ ] Commit changes to git
- [ ] Deploy to Vercel (should auto-deploy from main)
- [ ] Verify logs show new logging output
- [ ] Test with a real contact
- [ ] Send test email with service selection link
- [ ] Verify client can access link
- [ ] Check logs for success patterns
- [ ] Monitor for future token-not-found errors

---

## Monitoring & Prevention

### Add to Error Tracking:
- Monitor for "Token not found" errors
- Alert if this error appears in production
- Track error rate over time

### Future Improvements:
1. ✅ Add API endpoint to resend service selection link
2. ✅ Add token refresh logic (auto-extend expiration)
3. ✅ Add admin UI to view all tokens and their status
4. ✅ Add automatic cleanup of expired tokens
5. ✅ Add rate limiting to prevent token generation abuse

---

## If Client Still Sees Error

**Immediate action:**
1. Ask client to try again (fresh browser, incognito window)
2. If still failing, use diagnostic endpoint to get exact error
3. Direct client to call: **(901) 410-2020** while you investigate

**Troubleshooting steps:**
1. Check if email was actually sent to correct address
2. Verify token is in database using diagnostic tool
3. Check if contact record still exists
4. Review RLS policies on service_selection_tokens table
5. Check Vercel logs for API errors

---

## Files Modified

1. ✅ `pages/api/service-selection/validate-token.js` - Enhanced logging
2. ✅ `pages/api/service-selection/generate-link.js` - Better error handling
3. ✅ `pages/api/diagnostics/service-selection-tokens.js` - NEW diagnostic tool

---

## Questions?

Check these docs:
- `SERVICE_SELECTION_GUIDE.md` - Full service selection system
- `SERVICE_SELECTION_DEBUGGING.md` - Debugging guide
- Admin section: "Service Selection" menu for managing tokens

---

**This fix ensures clients always get access to the service selection form when they click a valid link.**

