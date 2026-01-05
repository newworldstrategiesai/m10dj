# 🔧 TipJar Routing Fix - Organization Requests Page 404

## Issue
The page at `https://www.tipjar.live/organizations/m22/requests` is returning a 404 error.

## Root Causes

### 1. **Wrong Product Context** ⚠️ CRITICAL
The organization was created with `product_context: "m10dj"` instead of `"tipjar"`.

**Current State:**
```json
{
  "email": "memphismillennial@gmail.com",
  "organization_name": "m22",
  "organization_slug": "m22",
  "subscription_tier": "starter",
  "subscription_status": "trial",
  "product_context": "m10dj"  // ❌ WRONG - should be "tipjar"
}
```

**Expected State:**
```json
{
  "product_context": "tipjar"  // ✅ CORRECT
}
```

### 2. **Middleware Routing**
The middleware now explicitly handles `/organizations/` paths to ensure they fall through to the pages router correctly.

## Fix Steps

### Step 1: Run SQL Fix Script
Execute `FIX_ORGANIZATION_PRODUCT_CONTEXT.sql` in Supabase SQL Editor:

```sql
-- This will:
-- 1. Update user metadata product_context to 'tipjar'
-- 2. Update organization product_context to 'tipjar'
-- 3. Verify the changes
```

### Step 2: Verify Organization Exists
Check that the organization exists and is active:

```sql
SELECT 
  id,
  name,
  slug,
  product_context,
  subscription_tier,
  subscription_status
FROM organizations
WHERE slug = 'm22';
```

**Expected:**
- `product_context` = `'tipjar'`
- `subscription_status` = `'trial'` or `'active'`

### Step 3: Test the Route
After running the SQL fix, test these URLs:

1. **Direct route:** `https://www.tipjar.live/organizations/m22/requests`
2. **Short route:** `https://www.tipjar.live/m22/requests` (should redirect to above)

## Why This Happened

The organization was likely created before the product_context trigger was properly set up, or the user's metadata didn't have `product_context: 'tipjar'` when the organization was created.

## Prevention

The organization creation trigger (`handle_new_user_organization`) now:
1. Checks user metadata for `product_context`
2. Sets organization `product_context` from user metadata
3. Defaults to `'m10dj'` if not specified (for backward compatibility)

**For TipJar signups:**
- User metadata should have `product_context: 'tipjar'` (set during signup)
- Organization will inherit this automatically

## Testing Checklist

- [ ] Run SQL fix script
- [ ] Verify organization has `product_context: 'tipjar'`
- [ ] Verify user metadata has `product_context: 'tipjar'`
- [ ] Test `/organizations/m22/requests` - should load
- [ ] Test `/m22/requests` - should redirect to `/organizations/m22/requests`
- [ ] Page should show song request form (not blank)
- [ ] User should be able to submit requests

## Related Files

- `FIX_ORGANIZATION_PRODUCT_CONTEXT.sql` - SQL fix script
- `middleware.ts` - Updated to handle `/organizations/` paths
- `pages/organizations/[slug]/requests.js` - Requests page component
- `supabase/migrations/20250203000000_add_product_context_to_organizations.sql` - Product context migration

