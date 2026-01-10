# TipJar Prospect Request Page - Testing & Fixes

## ✅ What's Been Fixed

### 1. Created Missing Claim Page
**File**: `app/(marketing)/tipjar/claim/page.tsx`
- Created frontend page for claiming TipJar pages
- Handles token from email link
- Shows organization info
- Form to create account and claim page
- Error handling for invalid/expired tokens

### 2. Created Missing API Endpoint
**File**: `pages/api/tipjar/unclaimed-token.js`
- New endpoint to verify claim token and get organization info
- Returns organization details for claim page
- Handles token expiration checks
- Returns pending tips info

### 3. Fixed Claim Page API Call
**File**: `app/(marketing)/tipjar/claim/page.tsx`
- Updated to use correct endpoint: `/api/tipjar/unclaimed-token`
- Proper error handling
- Loading states

---

## 🧪 Testing Checklist

### Test 1: Batch Create Page Access
- [ ] Navigate to `http://localhost:3000/admin/tipjar/batch-create`
- [ ] Verify super admin can access (should redirect non-admins)
- [ ] Check form loads correctly
- [ ] Verify "Quick Create Single" mode works

### Test 2: Create Single Page
- [ ] Fill in form:
  - Email: `test@example.com`
  - Business Name: `Test DJ`
  - Artist Name: `Test Artist` (optional)
  - Phone: (optional)
  - Slug: (auto-generated, can override)
- [ ] Click "Create Page"
- [ ] Verify review dialog appears
- [ ] Check page URL is correct: `http://localhost:3000/{slug}/requests`
- [ ] Verify QR code is generated
- [ ] Verify claim link is generated: `http://localhost:3000/tipjar/claim?token={token}`

### Test 3: Email Preview
- [ ] Click "Preview & Send Email" in review dialog
- [ ] Verify email preview shows:
  - QR code image
  - Page URL link
  - Claim link
  - Welcome message
- [ ] Check email looks correct

### Test 4: Send Email
- [ ] From review dialog, click "Send Welcome Email"
- [ ] OR from email preview, click "Send This Email"
- [ ] Verify success message
- [ ] Check email is sent (if Mailgun configured)
- [ ] If email fails, verify error message is shown

### Test 5: Claim Page Access
- [ ] Copy claim link from review dialog
- [ ] Open in new tab: `http://localhost:3000/tipjar/claim?token={token}`
- [ ] Verify page loads
- [ ] Check organization name is displayed
- [ ] Verify email field is pre-filled
- [ ] Check business name field is pre-filled

### Test 6: Claim Flow
- [ ] Fill in form:
  - Email: (should match prospect email)
  - Business Name: (can edit)
  - Password: (at least 8 characters)
  - Confirm Password: (must match)
- [ ] Click "Claim My Page & Create Account"
- [ ] Verify account is created
- [ ] Check redirect to onboarding page
- [ ] Verify organization is claimed in database

### Test 7: Public Page Access
- [ ] Visit page URL: `http://localhost:3000/{slug}/requests`
- [ ] Verify page loads (even if unclaimed)
- [ ] Check page shows organization name
- [ ] Verify request form works

### Test 8: Edge Cases
- [ ] Test with invalid token → should show error
- [ ] Test with expired token → should show error
- [ ] Test with wrong email on claim form → should show error
- [ ] Test with short password → should show error
- [ ] Test with mismatched passwords → should show error
- [ ] Test duplicate page creation → should warn

---

## 🔧 Potential Issues to Fix

### Issue 1: Mailgun Configuration
**Problem**: Email sending requires Mailgun API key
**Fix**: Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN_TIPJAR` in `.env.local`
**Test**: Emails should send, or show clear error if not configured

### Issue 2: Environment Variables
**Problem**: `NEXT_PUBLIC_TIPJAR_URL` might not be set for localhost
**Fix**: Set `NEXT_PUBLIC_TIPJAR_URL=http://localhost:3000` in `.env.local` for local testing
**Note**: URLs in emails will use localhost (fine for testing)

### Issue 3: Claim Token Expiration
**Problem**: Tokens expire after 90 days
**Fix**: Already handled - shows expiration error
**Test**: Try with expired token

### Issue 4: Database Schema
**Problem**: Need to verify `unclaimed_tip_balance` table exists
**Fix**: Check if table exists, create if missing
**Note**: Feature works without it, but tips won't be tracked

---

## 📝 Testing Steps

1. **Start Dev Server**:
   ```bash
   npm run dev
   ```

2. **Login as Super Admin**:
   - Go to `http://localhost:3000/signin`
   - Login with super admin email

3. **Navigate to Batch Create**:
   - Go to `http://localhost:3000/admin/tipjar/batch-create`

4. **Create Test Page**:
   - Fill in test data
   - Click "Create Page"
   - Review page details

5. **Send Email** (if Mailgun configured):
   - Click "Send Welcome Email"
   - Verify success

6. **Test Claim Flow**:
   - Copy claim link
   - Open in new tab/incognito
   - Fill form and claim page

7. **Verify Page Works**:
   - Visit page URL
   - Check request form works

---

## 🐛 Bugs Found & Fixed

### Bug 1: Missing Claim Page ✅ FIXED
**Issue**: No frontend page for `/tipjar/claim?token=xxx`
**Fix**: Created `app/(marketing)/tipjar/claim/page.tsx`

### Bug 2: Missing API Endpoint ✅ FIXED
**Issue**: Claim page tried to call non-existent `/api/tipjar/unclaimed?token=xxx`
**Fix**: Created `pages/api/tipjar/unclaimed-token.js`

### Bug 3: Environment Variables
**Issue**: `NEXT_PUBLIC_TIPJAR_URL` might be undefined locally
**Status**: Uses fallback to `NEXT_PUBLIC_SITE_URL` or `https://tipjar.live`
**Action**: Set in `.env.local` for local testing

---

## ✅ Next Steps

1. Test the full flow end-to-end
2. Fix any bugs found during testing
3. Verify email sending works (if Mailgun configured)
4. Test with actual prospect data
5. Verify QR codes work correctly
6. Test claim flow with different scenarios

