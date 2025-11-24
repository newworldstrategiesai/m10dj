# Multi-Tenant Critical Fixes - Implementation Plan

## Summary

Based on the comprehensive audit, here are the **CRITICAL** fixes needed to make this truly multi-tenant with proper admin separation.

## ✅ What's Already Done

1. ✅ `organizations` table created
2. ✅ `crowd_requests` has `organization_id` and RLS
3. ✅ `contacts` has migration (needs verification)
4. ✅ `events` has migration (needs verification)
5. ✅ `admin_settings` has `organization_id`
6. ✅ Basic organization context helpers exist

## 🔴 CRITICAL FIXES NEEDED (Do These First)

### 1. Update `get-contacts.js` API Route ✅ DONE
- **Status**: Fixed to use `organization_id` instead of `user_id`
- **Impact**: Prevents SaaS users from seeing other orgs' contacts

### 2. Update `contact.js` to Set `organization_id`
- **Problem**: Public contact form doesn't set `organization_id` when creating contacts
- **Solution**: Determine organization from:
  - URL slug (if form is on organization-specific page)
  - Event code (if provided)
  - Default to platform admin's organization (for now)
- **Priority**: CRITICAL - New contacts won't be associated with organizations

### 3. Create Migrations for Financial Tables
- **Tables**: `payments`, `invoices`, `contracts`, `payment_plans`, `payment_installments`
- **Priority**: CRITICAL - Financial data must be isolated

### 4. Update All API Routes to Filter by Organization
- **Pattern**: Use `getOrganizationContext()` helper
- **Admin**: Platform admins see all data (no filter)
- **SaaS**: SaaS users see only their organization

### 5. Create RLS Helper Function
- **Function**: `is_platform_admin()` in SQL
- **Purpose**: Allow RLS policies to check if user is platform admin

## 📋 Implementation Checklist

### Phase 1: Database (IMMEDIATE)

- [ ] Verify `contacts` table has `organization_id` column
- [ ] Verify `events` table has `organization_id` column
- [ ] Create migration: Add `organization_id` to `payments`
- [ ] Create migration: Add `organization_id` to `invoices`
- [ ] Create migration: Add `organization_id` to `contracts`
- [ ] Create migration: Add `organization_id` to `payment_plans`
- [ ] Create migration: Add `organization_id` to `payment_installments`
- [ ] Create migration: Add `organization_id` to `contact_submissions`
- [ ] Create SQL function: `is_platform_admin()`
- [ ] Update RLS policies for all tenant-scoped tables

### Phase 2: API Routes (IMMEDIATE)

- [x] Update `/api/get-contacts.js` - Use `organization_id`
- [ ] Update `/api/contact.js` - Set `organization_id` on creation
- [ ] Update `/api/get-contact-projects.js` - Filter by `organization_id`
- [ ] Update `/api/contacts/*` - All routes
- [ ] Update `/api/invoices/*` - All routes
- [ ] Update `/api/payments.js` - Filter by `organization_id`
- [ ] Update `/api/contracts/*` - All routes
- [ ] Update `/api/quote/*` - All routes
- [ ] Update `/api/service-selection/*` - All routes

### Phase 3: Admin Separation (HIGH)

- [x] Create `platform-admin.ts` helper
- [ ] Update all admin route checks to use `isPlatformAdmin()`
- [ ] Separate admin routes from SaaS routes
- [ ] Update middleware to handle admin vs SaaS differently

### Phase 4: Testing (HIGH)

- [ ] Test data isolation (Org A can't see Org B's data)
- [ ] Test admin access (Admin can see all orgs)
- [ ] Test RLS policies (Direct DB queries respect isolation)
- [ ] Test API routes with organization filtering

## 🚀 Quick Start: Fix Contact Form First

The contact form is the most critical because it's public-facing and creates data without organization context.

**Current Problem:**
```javascript
// contact.js creates contacts without organization_id
const contactData = {
  user_id: adminUserId, // ❌ No organization_id
  // ... other fields
};
```

**Solution:**
1. Determine organization from request context (slug, event code, etc.)
2. Set `organization_id` on contact creation
3. Fallback to platform admin's organization if no context

## Next Steps

1. **IMMEDIATE**: Fix `contact.js` to set `organization_id`
2. **IMMEDIATE**: Create migrations for financial tables
3. **HIGH**: Update all API read routes to filter by organization
4. **HIGH**: Create RLS helper function
5. **MEDIUM**: Update remaining API routes

## Estimated Time

- Critical fixes: 1-2 days
- Full implementation: 1-2 weeks
- Testing & validation: 3-5 days

**Total: 2-3 weeks for complete multi-tenant isolation**

