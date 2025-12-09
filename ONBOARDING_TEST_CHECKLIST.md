# Onboarding Flow Test Checklist

## Pre-Test Setup
- [ ] Dev server is running on port 3004
- [ ] Clear browser cache or use incognito mode
- [ ] Have a test email ready (or use a new one)

## Test Flow: New DJ Signup

### Step 1: Signup Page (`/signup`)
1. Navigate to: `http://localhost:3004/signup`
2. Fill out the form:
   - **DJ Business Name**: Enter a unique name (e.g., "Test DJ Company")
   - **Email**: Use a test email
   - **Password**: Create a password (min 6 characters)
3. Click "Start Free Trial"
4. **Expected**: 
   - If email confirmation required: Shows "Check Your Email" message
   - If auto-logged in: Redirects to `/onboarding/wizard`

### Step 2: Email Confirmation (if required)
1. Check email inbox
2. Click confirmation link
3. **Expected**: Redirects to `/onboarding/wizard`

### Step 3: Onboarding Wizard

#### Step 3.1: Welcome Screen
- [ ] Welcome message displays
- [ ] "Get Started" button works
- [ ] Progress bar shows step 1 of 5

#### Step 3.2: Organization Details
- [ ] Enter organization name (e.g., "Test DJ Company")
- [ ] **VERIFY**: URL slug preview shows correctly (e.g., `test-dj-company`)
- [ ] **VERIFY**: Slug should NOT have random suffix if it's unique
- [ ] Enter location (optional)
- [ ] Click "Next"
- [ ] **Expected**: Organization is created in database
- [ ] **VERIFY**: Check browser console for log: `Slug "test-dj-company" is available, using it`

#### Step 3.3: Profile Step
- [ ] Enter owner name
- [ ] Enter email (should be pre-filled)
- [ ] Enter phone (optional)
- [ ] Click "Next"

#### Step 3.4: Choose Plan
- [ ] See three plan options: Starter ($0), Professional ($49), Enterprise ($149)
- [ ] **VERIFY**: Starter plan shows $0 (not free trial text)
- [ ] Select a plan (try Starter first)
- [ ] Click "Continue to Checkout"
- [ ] **Expected**: Moves to Complete step

#### Step 3.5: Complete Step
- [ ] See success message with organization name
- [ ] **If Starter plan selected**: Should go directly to dashboard (no Stripe checkout)
- [ ] **If paid plan selected**: Should redirect to Stripe checkout
- [ ] Click "Complete Setup" or "Go to Dashboard"

### Step 4: Post-Onboarding Verification

#### 4.1: Dashboard Access
- [ ] Redirected to `/admin/dashboard`
- [ ] Dashboard loads successfully
- [ ] Organization name displays correctly

#### 4.2: Requests Page
- [ ] Navigate to: `http://localhost:3004/organizations/[your-slug]/requests`
- [ ] **VERIFY**: Artist name appears in header (should match organization name)
- [ ] **VERIFY**: URL slug is clean (no random suffix like `-kbx5aw`)
- [ ] Page loads without errors

#### 4.3: Organization Settings
- [ ] Check organization in database or admin panel
- [ ] **VERIFY**: `requests_header_artist_name` is set to organization name
- [ ] **VERIFY**: Slug is clean (no random suffix)
- [ ] **VERIFY**: Subscription tier is "starter"
- [ ] **VERIFY**: Subscription status is "trial"

## Issues to Watch For

### Slug Generation
- ❌ **BAD**: URL like `/organizations/test-dj-company-kbx5aw/requests`
- ✅ **GOOD**: URL like `/organizations/test-dj-company/requests`
- **If you see random suffix**: Check browser console for slug conflict logs

### Artist Name in Header
- ❌ **BAD**: Header shows "DJ" or is blank
- ✅ **GOOD**: Header shows your organization name (e.g., "TEST DJ COMPANY")
- **If missing**: Check that `requests_header_artist_name` was set during org creation

### Stripe Connect Banner
- [ ] **For new DJs**: Should see Stripe Connect requirement banner on dashboard
- [ ] **For M10 DJ Company**: Should NOT see banner (platform owner bypass)

## Test Scenarios

### Scenario 1: Clean Signup (No Conflicts)
1. Use a completely unique organization name
2. **Expected**: Clean slug, no random suffix
3. **Expected**: Artist name appears in requests page header

### Scenario 2: Duplicate Slug (Different User)
1. Create first account with "Test DJ"
2. Create second account with "Test DJ" (different email)
3. **Expected**: Second account gets slug like "test-dj-xxxxxx"
4. **Expected**: Console log shows: "Slug already taken by another user"

### Scenario 3: Starter Plan ($0)
1. Select Starter plan during onboarding
2. **Expected**: No Stripe checkout redirect
3. **Expected**: Direct redirect to dashboard
4. **Expected**: Can access basic features

## Console Logs to Check

Look for these logs in browser console:
- ✅ `Slug "[slug]" is available, using it` - Good, slug is unique
- ⚠️ `Slug "[slug]" already taken by another user` - Expected if duplicate
- ✅ `Auto-set requests_header_artist_name to: [name]` - Good, artist name fixed
- ❌ Any errors about organization creation

## Database Verification

After signup, verify in Supabase:
```sql
SELECT 
  id, 
  name, 
  slug, 
  owner_id,
  requests_header_artist_name,
  subscription_tier,
  subscription_status,
  is_platform_owner
FROM organizations
WHERE owner_id = '[your-user-id]';
```

**Expected values:**
- `slug`: Clean slug without random suffix (unless conflict)
- `requests_header_artist_name`: Should match `name`
- `subscription_tier`: 'starter'
- `subscription_status`: 'trial'
- `is_platform_owner`: false (unless you're M10 DJ Company)

## Next Steps After Testing

1. If slug has random suffix unnecessarily:
   - Check if slug actually exists in database
   - Verify `getOrganizationBySlug` is working correctly
   - Check browser console logs

2. If artist name missing:
   - Check that auto-fix ran in requests page
   - Verify `requests_header_artist_name` in database
   - May need to manually update in admin settings

3. If onboarding fails:
   - Check browser console for errors
   - Check network tab for API errors
   - Verify Supabase connection
