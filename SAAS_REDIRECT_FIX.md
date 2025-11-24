# SaaS Customer Redirect Fix

## Problem
New SaaS customers (DJs signing up for the platform) were being redirected to the **Client Portal** (`/client/dashboard`) instead of the **SaaS Customer Dashboard** (`/admin/crowd-requests` or `/onboarding/welcome`).

## Solution
Updated the redirect logic to distinguish between:
- **SaaS Customers**: DJs who own organizations → Go to onboarding/admin dashboard
- **Event Clients**: People who booked events → Go to client portal

## Changes Made

### 1. Updated `utils/auth-helpers/role-redirect.ts`
- **Before**: Non-admin users → `/client/dashboard`
- **After**: 
  - Users with organizations → `/onboarding/welcome` (SaaS customers)
  - Users without organizations → `/onboarding/welcome` (new signups, org being created)

### 2. Updated `utils/auth-helpers/server.ts`
- **Before**: After signup with session → `/` (home page)
- **After**: After signup with session → Uses `getRoleBasedRedirectUrl()` to send to onboarding

## User Flow Now

### New SaaS Customer Signup:
1. User signs up → Organization auto-created via trigger
2. Redirected to `/onboarding/welcome`
3. Sees their organization URL, embed code, and quick actions
4. Can click "Go to SaaS Dashboard" → `/admin/crowd-requests`

### Existing SaaS Customer Sign In:
1. User signs in
2. System checks for organization
3. If organization exists → `/onboarding/welcome` (or could go directly to dashboard)
4. If no organization → `/onboarding/welcome` (to create one)

### Event Client (Different Flow):
- Event clients are people who booked events with M10 DJ Company
- They access `/client/dashboard` to view their booking details
- This is separate from SaaS customers

## Testing

After these changes:
1. ✅ Sign up a new user → Should go to `/onboarding/welcome`
2. ✅ Sign in existing SaaS customer → Should go to `/onboarding/welcome` or dashboard
3. ✅ Event clients → Still access `/client/dashboard` (if they have bookings)

## Next Steps (Optional)

You might want to:
- Create a dedicated SaaS customer dashboard page (separate from admin dashboard)
- Add a route like `/dashboard` for SaaS customers
- Update onboarding to redirect directly to dashboard if org already exists

