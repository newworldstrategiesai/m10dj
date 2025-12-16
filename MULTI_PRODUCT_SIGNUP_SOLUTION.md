# Multi-Product Signup & Routing Solution

## Problem Statement

You have three separate products sharing the same database:
1. **TipJar** (`/tipjar/signup`) - DJs/performers collecting tips & song requests
2. **DJ Dash** (`/djdash/signup`) - DJ directory/network system  
3. **M10 DJ Company** (`/signup`) - Main company platform

**Challenge:** When users sign up through different products, they need to be routed to the correct dashboard/experience, but all use the same authentication system.

## Proposed Solution

### 1. Store Product Context in User Metadata

Add a `product_context` field to user metadata during signup to track which product they signed up for.

**Products:**
- `tipjar` - TipJar.Live users
- `djdash` - DJ Dash users  
- `m10dj` - M10 DJ Company users (default/legacy)

### 2. Create Product-Aware Redirect Function

Create a new function `getProductBasedRedirectUrl()` that:
- Checks user metadata for `product_context`
- Routes to appropriate dashboard based on product
- Falls back to role-based redirect if no product context

### 3. Update Signup Flows

Each signup endpoint should:
- Set `product_context` in user metadata
- Use product-aware redirect after signup

### 4. Product-Specific Dashboards

- **TipJar:** `/tipjar/dashboard` (song requests admin)
- **DJ Dash:** `/djdash/dashboard` (directory management)
- **M10 DJ:** `/onboarding/welcome` or `/admin/dashboard` (existing flow)

## Implementation Plan

### Step 1: Update Signup API Routes

**File:** `app/api/auth/signup/route.ts`
- Add `product_context: 'tipjar'` to user metadata

**File:** `utils/auth-helpers/server.ts` (for M10 DJ signup)
- Add `product_context: 'm10dj'` to user metadata

**File:** Create `app/api/djdash/signup/route.ts` (if needed)
- Add `product_context: 'djdash'` to user metadata

### Step 2: Create Product-Aware Redirect Function

**File:** `utils/auth-helpers/product-redirect.ts` (new file)
```typescript
export async function getProductBasedRedirectUrl(baseUrl: string = ''): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return `${baseUrl}/signin`;
  }
  
  // Check product context from user metadata
  const productContext = user.user_metadata?.product_context;
  
  switch (productContext) {
    case 'tipjar':
      return `${baseUrl}/tipjar/dashboard`;
    case 'djdash':
      return `${baseUrl}/djdash/dashboard`;
    case 'm10dj':
    default:
      // Use existing role-based redirect for M10 DJ
      return await getRoleBasedRedirectUrl(baseUrl);
  }
}
```

### Step 3: Update Auth Callback

**File:** `app/auth/callback/route.ts`
- Use `getProductBasedRedirectUrl()` instead of `getRoleBasedRedirectUrl()`

### Step 4: Create TipJar Dashboard

**File:** `app/(marketing)/tipjar/dashboard/page.tsx` (create if doesn't exist)
- Main dashboard for TipJar users
- Show song requests, tips, QR codes, etc.

### Step 5: Handle Cross-Product Access

**Consideration:** Users might want to access multiple products. Options:
- Allow users to switch products via a product selector
- Store multiple product contexts in metadata
- Use organization-level product associations

## Alternative Approach: Organization-Level Product Context

Instead of user-level, store product context at organization level:

1. When user signs up, create organization with `product_type` field
2. Check organization's `product_type` for routing
3. Allows users to have multiple organizations for different products

**Pros:**
- More flexible (users can have multiple products)
- Better for multi-tenant architecture
- Cleaner separation

**Cons:**
- Requires organization creation during signup
- More complex routing logic

## Recommended Approach

**Hybrid Solution:**
1. Store `product_context` in user metadata (quick routing)
2. Also store `product_type` in organization (long-term, flexible)
3. Check user metadata first, fall back to organization product_type
4. Allow users to switch products if they have access to multiple

## Migration Strategy

1. **Phase 1:** Add product context to new signups
2. **Phase 2:** Update redirect logic to use product context
3. **Phase 3:** Create product-specific dashboards
4. **Phase 4:** Add organization-level product tracking
5. **Phase 5:** Migrate existing users (optional)

## Files to Create/Modify

### New Files:
- `utils/auth-helpers/product-redirect.ts`
- `app/(marketing)/tipjar/dashboard/page.tsx` (if doesn't exist)

### Files to Modify:
- `app/api/auth/signup/route.ts` - Add tipjar product context
- `utils/auth-helpers/server.ts` - Add m10dj product context  
- `app/auth/callback/route.ts` - Use product-based redirect
- `app/(marketing)/tipjar/signin/[id]/page.tsx` - Use product-based redirect
- `app/signin/[id]/page.tsx` - Keep role-based for M10 DJ

## Testing Checklist

- [ ] TipJar signup → routes to `/tipjar/dashboard`
- [ ] DJ Dash signup → routes to `/djdash/dashboard`
- [ ] M10 DJ signup → routes to existing flow
- [ ] Existing users still work (backward compatible)
- [ ] Auth callback handles all products correctly
- [ ] Product context persists across sessions

