# Production Testing Plan

## 🎯 Critical Areas to Test

### 1. **Routing Fixes (TipJar Dynamic Routes)**

#### 1.1 Single Artist Pages
- [ ] **Test:** Navigate to `https://tipjar.live/[artist-slug]`
  - **Expected:** Artist page loads correctly
  - **Verify:** Profile image, bio, links, gallery display
  - **Example URLs:** `https://tipjar.live/dj-ben-murray`

#### 1.2 Nested Venue/Performer Pages
- [ ] **Test:** Navigate to `https://tipjar.live/[venue-slug]/[performer-slug]`
  - **Expected:** Performer page loads with venue context banner
  - **Verify:** 
    - "Back to [venue name]" link works
    - "Performing at [venue name]" badge displays
    - Performer profile content displays correctly
  - **Example URLs:** `https://tipjar.live/silkys/dj1`

#### 1.3 Venue Landing Pages
- [ ] **Test:** Navigate to `https://tipjar.live/[venue-slug]`
  - **Expected:** Venue roster page loads
  - **Verify:** 
    - All performers listed
    - Links to individual performer pages work
    - Venue branding displays

---

### 2. **Organization Type & Venue Hierarchy**

#### 2.1 Organization Context Loading
- [ ] **Test:** Sign in as regular user (non-venue)
  - **Action:** Login at `https://tipjar.live/tipjar/signin`
  - **Expected:** No 500 errors in console
  - **Verify:** Dashboard loads successfully
  - **Check Console:** No errors about "No organization found" or 500s

#### 2.2 Venue Organization Access
- [ ] **Test:** Sign in as venue owner
  - **Action:** Login and navigate to dashboard
  - **Expected:** Redirects to `/tipjar/dashboard/venue` (if venue type)
  - **Verify:** Venue dashboard loads with roster management

#### 2.3 Performer Organization Access
- [ ] **Test:** Sign in as performer (child of venue)
  - **Expected:** Regular dashboard loads
  - **Verify:** Can access their tip page and requests

---

### 3. **Venue Invitation System**

#### 3.1 Venue Owner - Invite Performer
- [ ] **Test:** Invite a new performer
  - **Steps:**
    1. Navigate to `/tipjar/dashboard/venue`
    2. Click "Invite Performer"
    3. Enter email, performer name, and slug
    4. Submit invitation
  - **Expected:** 
    - Invitation created successfully
    - Confirmation message displayed
    - Invitation appears in roster list
  - **Verify:** Email sent to performer

#### 3.2 Performer - Accept Invitation
- [ ] **Test:** Accept invitation via email link
  - **Steps:**
    1. Click invitation link from email
    2. Sign in or sign up
    3. Accept invitation
  - **Expected:**
    - Performer organization created
    - Redirected to onboarding/dashboard
    - Performer appears in venue roster
  - **Verify:**
    - Can access performer tip page
    - URL format: `/[venue-slug]/[performer-slug]`

#### 3.3 Venue Owner - Cancel Invitation
- [ ] **Test:** Cancel pending invitation
  - **Steps:**
    1. Go to venue dashboard
    2. Find pending invitation
    3. Click cancel/delete
  - **Expected:**
    - Invitation status changes to "cancelled"
    - Invitation removed from active list
    - Link no longer works

#### 3.4 Invitation Expiration
- [ ] **Test:** Expired invitation handling
  - **Steps:**
    1. Use old invitation link (30+ days)
    2. Try to accept
  - **Expected:**
    - Error message about expiration
    - Cannot create organization from expired link
  - **Verify:** Auto-expiration works on GET /invitations endpoint

---

### 4. **Payouts Page Fixes**

#### 4.1 Organization Loading
- [ ] **Test:** Access payouts page as logged-in user
  - **Steps:**
    1. Navigate to `/admin/payouts`
    2. Check page loads
  - **Expected:**
    - Page loads without errors
    - No "Stripe setup required" if already set up
    - Organization data displays correctly
  - **Verify Console:** No 500 errors for organization queries

#### 4.2 Error Handling
- [ ] **Test:** Error state display
  - **Expected:**
    - If organization fails to load, shows error message
    - Retry button available
    - No blank/crashed page

#### 4.3 Stripe Connect Status
- [ ] **Test:** Stripe Connect display
  - **Expected:**
    - Shows "setup required" only if not configured
    - Shows payout info if configured
    - Balance and payout history display correctly

---

### 5. **Admin Dashboard - Requests Page Customization**

#### 5.1 Access Customization Page
- [ ] **Test:** Navigate to `/admin/requests-page`
  - **Expected:** Page loads with all tabs
  - **Verify:** 
    - Header Settings tab
    - Labels & Text tab
    - Feature Toggles tab
    - SEO & Metadata tab

#### 5.2 Edit and Save Settings
- [ ] **Test:** Modify settings in each tab
  - **Steps:**
    1. Change header settings (artist name, location, date, heading)
    2. Update labels and placeholders
    3. Toggle features on/off
    4. Update SEO metadata
    5. Click "Save All Changes"
  - **Expected:**
    - Success message appears
    - Changes persist on page reload
    - All fields save correctly

#### 5.3 Verify Public Requests Page
- [ ] **Test:** View public requests page
  - **Steps:**
    1. Navigate to `/[org-slug]/requests`
  - **Expected:**
    - Custom header settings display
    - Custom labels show
    - Toggled features respect settings
    - SEO metadata appears in page source

---

### 6. **Error Scenarios & Edge Cases**

#### 6.1 User Without Organization
- [ ] **Test:** User logged in but no organization
  - **Expected:**
    - Redirects to onboarding
    - No 500 errors
    - Graceful handling

#### 6.2 Multiple Organizations (Edge Case)
- [ ] **Test:** User who might have multiple org contexts
  - **Expected:**
    - Correct organization context loaded
    - No cross-contamination between products

#### 6.3 Invalid Routes
- [ ] **Test:** Access non-existent routes
  - **Examples:**
    - `https://tipjar.live/nonexistent-slug`
    - `https://tipjar.live/venue/nonexistent-performer`
  - **Expected:** 404 page, not crash

---

### 7. **Database Query Fixes**

#### 7.1 Organization Member Queries
- [ ] **Verify Console:** No 500 errors for:
  - `/rest/v1/organizations?select=*&owner_id=eq...`
  - `/rest/v1/organization_members?select=organization_id&user_id=eq...`
  - All should use `maybeSingle()` instead of `single()`

#### 7.2 Null Organization Handling
- [ ] **Test:** Pages that require organization
  - **Expected:**
    - Graceful handling when org is null
    - Error messages instead of crashes
    - Retry mechanisms work

---

## 🧪 Testing Checklist by User Role

### As Venue Owner
- [ ] Can access venue dashboard
- [ ] Can invite performers
- [ ] Can view roster
- [ ] Can cancel invitations
- [ ] Can see aggregated stats (tips, requests, events)
- [ ] Can manage performer activations

### As Performer
- [ ] Can accept invitation
- [ ] Can access own dashboard
- [ ] Can view own tip page at `/[venue-slug]/[performer-slug]`
- [ ] Can manage own profile
- [ ] Can see own analytics

### As Regular User (Individual Organization)
- [ ] Can access dashboard
- [ ] Can view requests page
- [ ] Can customize requests page settings
- [ ] No errors in console
- [ ] All features work normally

### As Admin/Platform Owner
- [ ] Can access all admin pages
- [ ] Can view organizations
- [ ] No permission errors
- [ ] Cross-product data isolation works

---

## 🔍 Browser Console Checks

### What to Look For:
- ❌ **No 500 errors** for Supabase queries
- ❌ **No "No organization found" errors**
- ❌ **No type errors in console**
- ❌ **No routing conflicts**
- ✅ **Clean console** (only warnings are acceptable)

### Specific Error Patterns to Verify Fixed:
```
❌ GET /rest/v1/organizations?select=*&owner_id=eq... 500
❌ GET /rest/v1/organization_members?... 500
❌ Error: No organization found
❌ Error: You cannot use different slug names...
```

---

## 📋 Pre-Deployment Verification

### Before Testing:
- [ ] Build completes successfully (`npm run build`)
- [ ] All migrations applied to production database
- [ ] Environment variables configured
- [ ] Supabase RLS policies updated

### During Testing:
- [ ] Test in Chrome/Chromium
- [ ] Test in Firefox
- [ ] Test in Safari (if applicable)
- [ ] Test on mobile device
- [ ] Check responsive design

---

## 🚨 Critical Path Tests (Must Pass)

These are the most critical tests - if these fail, rollback immediately:

1. ✅ **Organization queries don't throw 500 errors**
2. ✅ **Venue invitation flow works end-to-end**
3. ✅ **Routing handles both single and nested slugs**
4. ✅ **Payouts page loads correctly**
5. ✅ **No TypeScript/build errors in production**

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: Production
Build Version: ___________

### Results:
- [ ] Routing fixes: PASS / FAIL
- [ ] Organization types: PASS / FAIL
- [ ] Venue invitations: PASS / FAIL
- [ ] Payouts page: PASS / FAIL
- [ ] Admin customization: PASS / FAIL

### Issues Found:
1. [Issue description]
   - Severity: Critical / High / Medium / Low
   - Steps to reproduce:
   - Expected vs Actual:

### Notes:
[Additional observations]
```

---

## 🎬 Quick Smoke Test (5-Minute Check)

1. ✅ Login to TipJar
2. ✅ Check console for errors
3. ✅ Navigate to dashboard
4. ✅ Check organization loads
5. ✅ Navigate to a public artist page
6. ✅ Check no 500 errors

If all pass, proceed with full testing plan above.

