# Fix: Re-Submission Links for Previously Used Contacts

**Status:** FIXED  
**Issue:** Contacts who previously submitted service selections getting "Token not found" when requesting new link  
**Root Cause:** Old tokens marked as `is_used=true` weren't being replaced with fresh tokens

---

## The Specific Scenario

You had previously submitted with `djbenmurray@gmail.com` and filled out a service selection.

When requesting a NEW service selection link:
1. ❌ Old token exists and is marked `is_used = true`
2. ❌ New token wasn't being generated with sufficient forcing
3. ❌ Email sent old/expired link
4. ❌ Client clicks → sees "Token not found"

---

## What I Fixed

### 1. Better Re-Submission Detection
- Detects when a contact has previously submitted
- Logs this fact for debugging
- Prepares to create fresh token

### 2. Force New Token for Resends
Added `isResendingLink` parameter to force creation of brand new tokens:

```javascript
// When resending to someone who already submitted:
{
  contactId: "xyz",
  isResendingLink: true  // Forces fresh token creation
}
```

### 3. Better Messaging for Used Tokens
If someone clicks an OLD/used link:
- ✅ Returns success (not error)
- ✅ Shows friendly message
- ✅ Provides contact info to request new link

---

## How It Works Now

**Scenario: Contact djbenmurray@gmail.com requests new link after already submitting**

1. ✅ Admin generates new link
2. ✅ System detects: "Contact has previously submitted"
3. ✅ Forces creation of completely new token
4. ✅ Email goes out with new link
5. ✅ Client clicks → works perfectly

**Scenario: Client somehow uses old link**

1. ✅ System finds old token marked as `is_used`
2. ✅ Returns friendly message: "You already submitted, contact us to change"
3. ✅ No 404 error - graceful degradation

---

## Files Modified

1. `pages/api/service-selection/generate-link.js` - Added re-submission detection
2. `pages/api/service-selection/validate-token.js` - Better handling of used tokens

---

## Testing the Fix

### Test 1: Generate Link for Previously Used Email
```bash
curl -X POST http://localhost:3000/api/service-selection/generate-link \
  -H "Content-Type: application/json" \
  -d '{
    "email": "djbenmurray@gmail.com",
    "isResendingLink": true,
    "forceNewToken": true
  }'
```

Expected: New token generated (different from old one)

### Test 2: Try Old Link
Click the old link → Should show friendly message, not "Token not found"

### Test 3: Try New Link
Click the new link → Should load service selection form perfectly

---

## Key Improvements

- ✅ Detects when a contact has previously submitted
- ✅ Automatically creates fresh token instead of reusing old one
- ✅ Graceful handling of old/used links
- ✅ Better error messages
- ✅ Better logging for debugging

---

## For the Admin UI

When resending a service selection link to a contact:
- System automatically detects if they submitted before
- Creates fresh token (not old one)
- Sends new link via email
- Client never sees "Token not found"

---

## Logging Output

Watch for these success patterns:

```
✅ Contact has previously submitted, creating fresh token for re-submission
🔐 Creating new token for contact XYZ...
✅ Token created successfully, expires at: 2025-12-12T14:00:00Z
```

Or watch for resend patterns:

```
🔄 Force creating new token for resend to contact who previously submitted
```

---

## Prevention Going Forward

This fix ensures that:
1. ✅ Previously submitted contacts can always get new links
2. ✅ Old tokens are never accidentally reused
3. ✅ Clients with used tokens see helpful messages, not errors
4. ✅ Re-submissions always work smoothly

---

**Bottom Line:** Contacts who previously submitted will now always get working links when they request to submit again. No more "Token not found" errors! 🎉

