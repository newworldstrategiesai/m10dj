# Product Context & Onboarding Flow

## Overview

This document explains how `product_context` is handled during the onboarding process for TipJar, DJ Dash, and M10 DJ Company customers.

## Current Flow

### 1. Signup Phase

**TipJar Signup** (`app/api/auth/signup/route.ts`):
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      organization_name: businessName || undefined,
      product_context: 'tipjar', // ✅ Set during signup
    }
  }
});
```

**M10 DJ Signup** (`utils/auth-helpers/server.ts`):
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      organization_name: businessName || undefined,
      product_context: 'm10dj', // ✅ Set during signup
    }
  }
});
```

**Result**: `product_context` is stored in `auth.users.raw_user_meta_data->>'product_context'`

### 2. Organization Creation (Automatic Trigger)

When a user signs up, the database trigger `handle_new_user_organization()` automatically:
1. Creates an organization for the user
2. **Sets `product_context` from user metadata** (via the migration we just created)

```sql
-- From migration: 20250203000000_add_product_context_to_organizations.sql
INSERT INTO public.organizations (
  name,
  slug,
  owner_id,
  subscription_tier,
  subscription_status,
  trial_ends_at,
  product_context  -- ✅ Automatically set from user metadata
) VALUES (
  org_name,
  org_slug,
  NEW.id,
  'starter',
  'trial',
  trial_end_date,
  user_product_context  -- From NEW.raw_user_meta_data->>'product_context'
);
```

### 3. Post-Signup Redirect

**Auth Callback** (`app/auth/callback/route.ts`):
```typescript
// Uses product-based redirect
const redirectUrl = await getProductBasedRedirectUrl(requestUrl.origin);
```

**Product-Based Redirect** (`utils/auth-helpers/product-redirect.ts`):
```typescript
switch (productContext) {
  case 'tipjar':
    return `${baseUrl}/tipjar/dashboard`;  // ✅ Direct to TipJar dashboard
    
  case 'djdash':
    return `${baseUrl}/djdash/dashboard`;  // Future DJ Dash dashboard
    
  case 'm10dj':
  default:
    // Uses role-based redirect (handles onboarding)
    return await getRoleBasedRedirectUrl(baseUrl);
}
```

**Role-Based Redirect** (`utils/auth-helpers/role-redirect.ts`):
```typescript
// For M10 DJ Company users:
if (organizationResult.data) {
  return `${baseUrl}/onboarding/welcome`;  // ✅ Send to onboarding
}
return `${baseUrl}/onboarding/welcome`;  // ✅ New users go to onboarding
```

## Key Differences by Product

### TipJar Users
- ✅ **No onboarding flow** - Direct to `/tipjar/dashboard`
- ✅ Organization created automatically with `product_context = 'tipjar'`
- ✅ Dashboard checks for organization, redirects to `/tipjar/onboarding` if missing
- ✅ Simple flow: Signup → Dashboard (or onboarding if org missing)

### M10 DJ Company Users
- ✅ **Has onboarding flow** - Goes to `/onboarding/welcome`
- ✅ Organization created automatically with `product_context = 'm10dj'`
- ✅ Multi-step wizard: Welcome → Organization → Profile → Plan → Complete
- ✅ Complex flow: Signup → Onboarding → Dashboard

### DJ Dash Users (Future)
- ✅ Will go to `/djdash/dashboard` (when implemented)
- ✅ Organization created with `product_context = 'djdash'`
- ✅ Can have its own onboarding flow if needed

## Onboarding Flow Details

### M10 DJ Company Onboarding

**Location**: `pages/onboarding/wizard.tsx`

**Steps**:
1. **Welcome** - Introduction
2. **Organization Details** - Business name, slug, etc.
3. **Profile** - User profile setup
4. **Plan Selection** - Choose subscription tier
5. **Complete** - Finish setup

**Organization Check**:
```typescript
// If organization already exists, skip to plan selection
const org = await getCurrentOrganization(supabase);
if (org) {
  setCurrentStep(3); // Skip to plan selection
}
```

### TipJar "Onboarding"

**Location**: `app/(marketing)/tipjar/dashboard/page.tsx`

**Current Behavior**:
```typescript
const organization = await getCurrentOrganization(supabase);

if (!organization) {
  // If no organization, redirect to onboarding
  redirect('/tipjar/onboarding'); // ⚠️ This route may not exist yet
}
```

**Note**: TipJar dashboard checks for organization but there's no dedicated TipJar onboarding page yet. If organization is missing, it would redirect to a non-existent route.

## Issues & Recommendations

### Issue 1: TipJar Missing Onboarding Route

**Problem**: TipJar dashboard redirects to `/tipjar/onboarding` if organization is missing, but this route doesn't exist.

**Solution Options**:
1. **Create TipJar onboarding page** (`app/(marketing)/tipjar/onboarding/page.tsx`)
2. **Or**: Let the database trigger create the organization automatically (already does)
3. **Or**: Show a message on dashboard to wait for organization creation

### Issue 2: Product Context Not Checked in Onboarding

**Problem**: The M10 DJ onboarding wizard doesn't check `product_context`, so TipJar users could theoretically access it.

**Solution**: Add product context check to onboarding pages:
```typescript
// In pages/onboarding/wizard.tsx
const productContext = user?.user_metadata?.product_context;
if (productContext === 'tipjar') {
  redirect('/tipjar/dashboard');
}
```

### Issue 3: Organization Creation Timing

**Current**: Organization is created via database trigger immediately on user signup.

**Potential Issue**: If trigger fails or is slow, user might see "no organization" error.

**Solution**: The trigger has error handling, but you could also:
- Show a loading state while organization is being created
- Poll for organization existence
- Have a fallback manual creation button

## Recommended Improvements

### 1. Add Product Context Check to Onboarding

```typescript
// pages/onboarding/wizard.tsx
useEffect(() => {
  async function checkProductContext() {
    const { data: { user } } = await supabase.auth.getUser();
    const productContext = user?.user_metadata?.product_context;
    
    if (productContext === 'tipjar') {
      router.push('/tipjar/dashboard');
    } else if (productContext === 'djdash') {
      router.push('/djdash/dashboard');
    }
    // m10dj users continue with onboarding
  }
  checkProductContext();
}, []);
```

### 2. Create TipJar Onboarding Page (Optional)

If you want a simplified onboarding for TipJar users:

```typescript
// app/(marketing)/tipjar/onboarding/page.tsx
export default async function TipJarOnboarding() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if organization exists
  const organization = await getCurrentOrganization(supabase);
  
  if (organization) {
    redirect('/tipjar/dashboard');
  }
  
  // Show simple setup form or wait for organization creation
  return <TipJarOnboardingForm />;
}
```

### 3. Update Product-Based Redirect to Handle Missing Organizations

```typescript
// utils/auth-helpers/product-redirect.ts
case 'tipjar':
  const org = await getCurrentOrganization(supabase);
  if (!org) {
    // Organization being created, redirect to onboarding or wait page
    return `${baseUrl}/tipjar/onboarding`;
  }
  return `${baseUrl}/tipjar/dashboard`;
```

## Summary

**Current State**:
- ✅ `product_context` is set during signup (user metadata)
- ✅ Organization gets `product_context` automatically (database trigger)
- ✅ TipJar users → Dashboard directly (no onboarding)
- ✅ M10 DJ users → Onboarding flow
- ⚠️ TipJar onboarding route missing (but org is auto-created)
- ⚠️ Onboarding doesn't check product context (could allow cross-product access)

**Recommendations**:
1. Add product context checks to onboarding pages
2. Create TipJar onboarding page OR handle missing org gracefully
3. Add loading states for organization creation
4. Consider product-specific onboarding flows if needed

