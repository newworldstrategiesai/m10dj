# 🌐 Browser Testing Guide - Onboarding Wizard

## 🎯 Testing at http://localhost:3005/onboarding/welcome

### Step-by-Step Test Process

---

## ✅ Step 1: Initial Page Load

**What to Check:**
1. Page loads without errors
2. Progress bar appears at top showing "Step 1 of 6" and "17% Complete"
3. Six step indicators show at top (numbered circles)
4. Welcome step content is displayed
5. No console errors in DevTools (F12)

**Expected Elements:**
- ✅ Purple gradient progress bar
- ✅ Step 1 indicator (purple, active)
- ✅ Steps 2-6 indicators (gray, inactive)
- ✅ Welcome message: "Welcome to [Business Name]! 🎉"
- ✅ Business name input field (pre-filled)
- ✅ "Let's Get Started" button

---

## ✅ Step 2: Welcome Step → Request Page Step

**Actions:**
1. Click "Let's Get Started" button

**What to Check:**
1. Progress bar updates to "Step 2 of 6" and "33% Complete"
2. Step 1 indicator turns green with checkmark
3. Step 2 indicator becomes purple (active)
4. Request Page step content appears

**Expected Elements:**
- ✅ Request page URL displayed in input field
- ✅ "Copy" button next to URL
- ✅ "Test" button (opens in new tab)
- ✅ "Generate QR Code" button
- ✅ "Continue" button at bottom

**Test Actions:**
- Click "Copy" → Verify URL copied to clipboard
- Click "Test" → Verify page opens in new tab
- Click "Generate QR Code" → Verify QR code image appears
- Click "Continue" → Should advance to Step 3

---

## ✅ Step 3: Request Page → Embed Step

**What to Check:**
1. Progress bar updates to "Step 3 of 6" and "50% Complete"
2. Step 2 indicator turns green
3. Step 3 indicator becomes active
4. Embed code generator appears

**Expected Elements:**
- ✅ Embed code textarea with code
- ✅ Customization options (theme, height, border radius)
- ✅ "Copy Code" button
- ✅ "Preview" button (optional)
- ✅ "Skip for Now" button (should be visible)
- ✅ "Continue" button

**Test Actions:**
- Change theme dropdown → Verify code updates
- Change height → Verify code updates
- Click "Copy Code" → Verify code copied
- Click "Skip for Now" → Should advance to Step 4
- OR click "Continue" → Should advance to Step 4

---

## ✅ Step 4: Embed → Payment Step

**What to Check:**
1. Progress bar updates to "Step 4 of 6" and "67% Complete"
2. Step 3 indicator turns green (or gray if skipped)
3. Step 4 indicator becomes active
4. Stripe Connect setup component appears

**Expected Elements:**
- ✅ "Set Up Payment Processing" heading
- ✅ Stripe Connect setup component
- ✅ "Set Up Payment Processing" button
- ✅ "I'll set this up later" link (skip option)

**Test Actions:**
- Click "Set Up Payment Processing" → 
  - If Stripe configured: Should open Stripe onboarding
  - If not configured: Should show helpful error message
- Click "I'll set this up later" → Should advance to Step 5
- OR complete Stripe setup → Should auto-advance

---

## ✅ Step 5: Payment → First Event Step

**What to Check:**
1. Progress bar updates to "Step 5 of 6" and "83% Complete"
2. Step 4 indicator turns green (or gray if skipped)
3. Step 5 indicator becomes active
4. Event creation form appears

**Expected Elements:**
- ✅ Event Name input field
- ✅ Event Date date picker
- ✅ Location input field (optional)
- ✅ "Create Event" button
- ✅ "Skip for now" link

**Test Actions:**
- Fill in event name: "Test Wedding"
- Select a date (future date)
- Enter location: "Test Venue"
- Click "Create Event" → 
  - Should show success message
  - Should display event URL
  - Should auto-advance to Step 6
- OR click "Skip for now" → Should advance to Step 6

---

## ✅ Step 6: First Event → Completion Step

**What to Check:**
1. Progress bar updates to "Step 6 of 6" and "100% Complete"
2. Step 5 indicator turns green (or gray if skipped)
3. Step 6 indicator becomes active
4. Completion celebration appears

**Expected Elements:**
- ✅ Green checkmark icon
- ✅ "You're All Set! 🎉" heading
- ✅ "What's Next" section with 4 items
- ✅ "Go to Dashboard" button
- ✅ "View Request Page" button

**Test Actions:**
- Click "Go to Dashboard" → Should redirect to `/admin/crowd-requests`
- Click "View Request Page" → Should open request page

---

## 🔄 Navigation Testing

### Test Back Button
1. Go to Step 2
2. Click "Back" button
3. Should return to Step 1
4. Progress bar should update to 17%

### Test Step Indicators
1. Complete Step 1 and 2
2. Click on Step 1 indicator (circle)
3. Should jump back to Step 1
4. Click on Step 2 indicator
5. Should jump to Step 2

### Test Skip Functionality
1. On Step 3 (Embed), click "Skip for Now"
2. Step 3 indicator should turn gray (skipped)
3. Should advance to Step 4
4. Can return to Step 3 later and complete it

---

## 📊 Progress Tracking Test

### Check Database
1. Complete a few steps
2. Open browser DevTools → Network tab
3. Look for POST requests to `/api/organizations/update-onboarding`
4. Check response - should include `onboardingProgress` JSON

### Check LocalStorage
1. Complete onboarding
2. Open DevTools → Application → LocalStorage
3. Should see:
   - `onboarding_complete: "true"`
   - `onboarding_completed_at: "[timestamp]"`

---

## 🐛 Common Issues to Watch For

### Issue 1: Steps Not Advancing
**Check:**
- Browser console for errors
- Network tab for failed API calls
- Verify organization is loaded

### Issue 2: QR Code Not Generating
**Check:**
- Network tab for `/api/qr-code/generate` request
- Should return 200 status
- QR code image should appear

### Issue 3: Event Creation Fails
**Check:**
- Network tab for `/api/crowd-request/create-event` request
- Check response for error message
- Verify database migration ran

### Issue 4: Progress Not Saving
**Check:**
- Network tab for `/api/organizations/update-onboarding` requests
- Should see POST requests after each step
- Check database for `onboarding_progress` field

---

## ✅ Success Checklist

After going through the entire flow, verify:

- [ ] All 6 steps load correctly
- [ ] Progress bar updates smoothly
- [ ] Step indicators show correct states
- [ ] Navigation works (Next/Back/Skip)
- [ ] Can jump to any step via indicators
- [ ] QR code generates successfully
- [ ] Event creation works (or shows helpful error)
- [ ] Progress saves to database
- [ ] Completion timestamp is saved
- [ ] No console errors
- [ ] Responsive on mobile (test resize)
- [ ] Dark mode works (if applicable)

---

## 📝 Test Results

**Date:** ___________
**Tester:** ___________
**Browser:** ___________
**URL:** http://localhost:3005/onboarding/welcome

**Results:**
- Step 1 (Welcome): ✅ / ❌
- Step 2 (Request Page): ✅ / ❌
- Step 3 (Embed): ✅ / ❌
- Step 4 (Payments): ✅ / ❌
- Step 5 (First Event): ✅ / ❌
- Step 6 (Completion): ✅ / ❌
- Navigation: ✅ / ❌
- Progress Tracking: ✅ / ❌
- QR Code: ✅ / ❌
- Event Creation: ✅ / ❌

**Issues Found:**
1. 
2. 
3. 

**Notes:**
- 

---

**Ready to test!** Navigate to http://localhost:3005/onboarding/welcome and follow this guide step by step.

