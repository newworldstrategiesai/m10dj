# 🧪 DJ Onboarding Process - Testing Guide

**For Chrome Browser Testing** (Cursor browser has compatibility issues with signin)

---

## 📋 Testing Checklist

### Step 1: Access Signin/Signup
1. Navigate to: `http://localhost:3000/signin`
2. If you don't have an account, look for "Sign Up" link
3. Create a new account with:
   - Email: `test-dj@example.com`
   - Password: (secure password)

### Step 2: Onboarding Wizard Flow

After signup/login, you should be redirected to: `http://localhost:3000/onboarding/wizard`

**Expected Flow:**

#### Step 1: Welcome Screen
- ✅ Should see "Welcome to M10 DJ SaaS!" message
- ✅ Should see "Let's get your DJ business set up" description
- ✅ Should have a "Get Started" or "Next" button

#### Step 2: Organization Details
- ✅ Input field for "Company Name"
- ✅ Should auto-generate slug from company name
- ✅ Validation: Company name cannot be empty
- ✅ "Create My Organization" button

**Test Cases:**
- Try empty company name → Should show error
- Try "Elite DJ Services" → Should create organization
- Check if slug is generated (e.g., "elite-dj-services")

#### Step 3: Your Profile (if implemented)
- ✅ Owner name field
- ✅ Email field (pre-filled from signup)
- ✅ Phone number field
- ✅ Location field

#### Step 4: Choose Plan
- ✅ Should see 3 plan options:
  - Starter ($X/month)
  - Professional ($X/month) 
  - Enterprise ($X/month)
- ✅ Each plan should show features
- ✅ "Most Popular" badge on Professional (if applicable)
- ✅ Should be able to select a plan
- ✅ "Continue to Checkout" button

**Test Cases:**
- Select Starter plan → Should proceed
- Select Professional plan → Should proceed
- Select Enterprise plan → Should proceed
- Try to continue without selecting → Should be disabled

#### Step 5: Complete
- ✅ Should see success message
- ✅ "Organization Created!" confirmation
- ✅ "Select My Plan" button (if not done in step 4)
- ✅ OR redirect to dashboard if plan already selected

### Step 3: Post-Onboarding

After completing wizard:
- ✅ Should redirect to `/admin/dashboard` or `/onboarding/select-plan`
- ✅ Organization should be created in database
- ✅ User should be owner of organization
- ✅ Trial should be active (14 days)

---

## 🔍 What to Check

### Database Verification
After completing onboarding, verify in Supabase:

1. **Organizations Table:**
   ```sql
   SELECT * FROM organizations 
   WHERE owner_id = '<user_id>' 
   ORDER BY created_at DESC LIMIT 1;
   ```
   - ✅ `name` matches company name entered
   - ✅ `slug` is generated correctly
   - ✅ `owner_id` matches signed-in user
   - ✅ `subscription_tier` = 'starter'
   - ✅ `subscription_status` = 'trial'
   - ✅ `trial_ends_at` is set (14 days from now)

2. **Organization Members Table:**
   ```sql
   SELECT * FROM organization_members 
   WHERE organization_id = '<org_id>';
   ```
   - ✅ Owner should be added as member with role 'owner'
   - ✅ `is_active` = true
   - ✅ `joined_at` is set

### UI/UX Checks
- ✅ Loading states show during API calls
- ✅ Error messages are clear and helpful
- ✅ Form validation works
- ✅ Navigation between steps works
- ✅ Back button works (if implemented)
- ✅ Responsive design (test on mobile)

### Error Scenarios
Test these edge cases:

1. **Network Error:**
   - Disconnect internet → Try to create organization
   - Should show error message
   - Should not lose form data

2. **Duplicate Organization Name:**
   - Create org with "Test DJ"
   - Try to create another with "Test DJ"
   - Should handle gracefully (append random string or show error)

3. **Invalid Slug:**
   - Try company name with special characters
   - Should sanitize to valid slug

4. **Session Expiry:**
   - Wait for session to expire
   - Try to continue wizard
   - Should redirect to signin

---

## 🐛 Common Issues to Watch For

### Issue 1: Redirect Loop
**Symptom:** Page keeps redirecting between signin and wizard
**Check:**
- Is user authenticated?
- Does organization already exist?
- Check browser console for errors

### Issue 2: Organization Not Created
**Symptom:** Wizard completes but no organization in database
**Check:**
- API route `/api/organizations/create` working?
- Check browser network tab for API errors
- Verify RLS policies allow insert

### Issue 3: Slug Generation Fails
**Symptom:** Slug is null or invalid
**Check:**
- Company name validation
- Slug generation logic in `createOrganization()`
- Database constraints on slug column

### Issue 4: Trial Not Set
**Symptom:** Organization created but trial_ends_at is null
**Check:**
- `createOrganization()` function sets trial_ends_at
- Date calculation is correct (14 days)

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

### Test Results

**Step 1: Signin/Signup**
- [ ] Signin page loads
- [ ] Can create new account
- [ ] Redirects to onboarding after signup

**Step 2: Welcome Screen**
- [ ] Page loads correctly
- [ ] Can proceed to next step

**Step 3: Organization Details**
- [ ] Form validation works
- [ ] Organization created successfully
- [ ] Slug generated correctly

**Step 4: Plan Selection**
- [ ] All plans display
- [ ] Can select plan
- [ ] Can proceed to checkout

**Step 5: Complete**
- [ ] Success message shows
- [ ] Redirects correctly

**Database Verification**
- [ ] Organization created
- [ ] Owner added as member
- [ ] Trial set correctly

**Issues Found:**
1. 
2. 
3. 

**Notes:**
```

---

## 🚀 Quick Test Script

1. Open Chrome
2. Go to `http://localhost:3000/signin`
3. Sign up with test account
4. Complete onboarding wizard
5. Verify organization in Supabase dashboard
6. Check `/admin/dashboard` loads correctly

---

## 🔗 Related Files

- `pages/onboarding/wizard.tsx` - Main wizard component
- `pages/onboarding/select-plan.tsx` - Plan selection page
- `utils/organization-context.ts` - Organization creation logic
- `pages/api/organizations/create.js` - API endpoint

---

**Note:** If signin page doesn't work in Cursor browser, use Chrome for testing. This is a known browser compatibility issue.

