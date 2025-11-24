# 🧪 Onboarding Test Checklist

## ✅ Pre-Test Setup

1. **Run Database Migration**
   ```sql
   -- Run in Supabase SQL Editor
   -- File: supabase/migrations/20250125000004_add_onboarding_tracking.sql
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:3003` (or next available port)

---

## 🎯 Test Scenarios

### Test 1: New User Signup Flow
- [ ] Sign up as a new user at `/signin/signup`
- [ ] Enter business name (optional)
- [ ] Verify redirect to `/onboarding/welcome`
- [ ] Check that onboarding wizard loads

### Test 2: Welcome Step
- [ ] Verify welcome message displays
- [ ] Check business name field is pre-filled
- [ ] Click "Let's Get Started" button
- [ ] Verify progress bar shows "Step 1 of 6"
- [ ] Verify step indicator shows step 1 as active

### Test 3: Request Page Step
- [ ] Verify request page URL is displayed
- [ ] Click "Copy" button - verify URL is copied
- [ ] Click "Test" button - verify page opens in new tab
- [ ] Click "Generate QR Code" button
- [ ] Verify QR code image appears
- [ ] Click "Continue" button
- [ ] Verify progress bar updates to "Step 2 of 6"

### Test 4: Embed Step
- [ ] Verify embed code is displayed
- [ ] Test customization options (theme, height, border radius)
- [ ] Click "Copy Code" button
- [ ] Verify code is copied to clipboard
- [ ] Click "Preview" button (if available)
- [ ] Click "Continue" button
- [ ] Verify progress bar updates

### Test 5: Payment Step
- [ ] Verify Stripe Connect setup component loads
- [ ] Click "Set Up Payment Processing" button
- [ ] Verify Stripe onboarding flow starts (or error message if not configured)
- [ ] Test "Skip for now" option
- [ ] Verify can proceed without completing

### Test 6: First Event Step
- [ ] Enter event name
- [ ] Select event date
- [ ] Enter location (optional)
- [ ] Click "Create Event" button
- [ ] Verify success message appears
- [ ] Verify event URL is displayed
- [ ] Test "Skip for now" option

### Test 7: Completion Step
- [ ] Verify success celebration displays
- [ ] Check "What's Next" section
- [ ] Click "Go to Dashboard" button
- [ ] Verify redirects to `/admin/crowd-requests`
- [ ] Click "View Request Page" button
- [ ] Verify opens request page

### Test 8: Navigation
- [ ] Test "Back" button on step 2
- [ ] Verify returns to step 1
- [ ] Test "Next" button advances steps
- [ ] Test clicking step indicators
- [ ] Verify can jump to any completed step

### Test 9: Progress Tracking
- [ ] Complete step 1, refresh page
- [ ] Verify progress is maintained (if database connected)
- [ ] Complete all steps
- [ ] Check database for `onboarding_completed_at` timestamp
- [ ] Check `onboarding_progress` JSON field

### Test 10: Skip Functionality
- [ ] On embed step, click "Skip for now"
- [ ] Verify step is marked as skipped
- [ ] Verify can proceed to next step
- [ ] Verify can return to skipped step later

---

## 🐛 Known Issues to Check

1. **Stripe Connect Setup**
   - May show error if Stripe platform profile not completed
   - This is expected - verify error message is helpful

2. **Event Creation**
   - Requires database connection
   - May fail if `crowd_requests` table structure differs
   - Check console for errors

3. **QR Code Generation**
   - Uses external service (qrserver.com)
   - May be slow on first load
   - Verify image loads correctly

---

## 📊 Expected Behavior

### Progress Bar
- Should show percentage (e.g., "17% Complete" for step 1 of 6)
- Should fill from left to right
- Should update smoothly on step changes

### Step Indicators
- Active step: Purple background, white number
- Completed step: Green background, checkmark icon
- Skipped step: Gray background
- Future step: Gray background, number

### Navigation
- "Back" button disabled on first step
- "Next" button changes to "Complete Setup" on last step
- Step indicators are clickable (can jump to any step)

### Data Persistence
- Steps completed should save to database
- Progress should persist across page refreshes
- Completion timestamp should be saved

---

## 🔍 Console Checks

Open browser DevTools and check for:

- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] API calls succeed (check Network tab):
  - `/api/organizations/update-onboarding` (200 status)
  - `/api/qr-code/generate` (200 status)
  - `/api/crowd-request/create-event` (200 status, if creating event)

---

## ✅ Success Criteria

- [ ] All 6 steps load without errors
- [ ] Progress bar updates correctly
- [ ] Navigation works (Next, Back, Skip)
- [ ] Step indicators are clickable
- [ ] QR code generates successfully
- [ ] Event creation works (if tested)
- [ ] Progress saves to database
- [ ] Completion timestamp is saved
- [ ] No console errors
- [ ] Responsive design works on mobile

---

## 🚨 If Tests Fail

### Build Errors
- Check TypeScript compilation
- Verify all imports are correct
- Check for missing dependencies

### Runtime Errors
- Check browser console
- Verify API endpoints are accessible
- Check database connection
- Verify environment variables

### UI Issues
- Check Tailwind classes
- Verify dark mode support
- Test responsive breakpoints

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________
Environment: Development (localhost:3003)

Results:
- Welcome Step: ✅ / ❌
- Request Page Step: ✅ / ❌
- Embed Step: ✅ / ❌
- Payment Step: ✅ / ❌
- First Event Step: ✅ / ❌
- Completion Step: ✅ / ❌
- Navigation: ✅ / ❌
- Progress Tracking: ✅ / ❌

Issues Found:
1. 
2. 
3. 

Notes:
```

---

**Ready to Test!** 🚀

Start the dev server and navigate to `/onboarding/welcome` (after signing up) to begin testing.

