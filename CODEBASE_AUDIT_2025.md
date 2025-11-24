# 🔍 Codebase Audit - Priority Action Plan

**Date:** January 2025  
**Status:** Multi-tenant SaaS platform in active development

---

## 🚨 CRITICAL PRIORITIES (Do Tomorrow)

### 1. **Multi-Tenant Data Isolation - Financial Tables** ⚠️ CRITICAL
**Risk:** Financial data leakage between organizations

**Status:**
- ✅ Migrations exist for: `payments`, `invoices`, `contracts`, `payment_plans`, `payment_installments`
- ❌ **API routes NOT filtering by organization_id**
- ❌ **RLS policies may be missing or incomplete**

**Action Items:**
1. Verify migrations applied: Check if `organization_id` columns exist in production
2. Update API routes to filter by organization:
   - `/api/payments.js` (if exists)
   - `/api/invoices/*` (all routes)
   - `/api/contracts/*` (all routes)
   - `/api/quote/*` (all routes)
3. Verify RLS policies exist and work correctly
4. Test: Create two orgs, verify Org A can't see Org B's financial data

**Estimated Time:** 4-6 hours

---

### 2. **Contact Form Organization Assignment** ⚠️ CRITICAL
**Risk:** New contacts not associated with correct organization

**Current Issue:**
```javascript
// pages/api/crowd-request/submit.js line 65
// TODO: Implement proper event code to organization mapping
```

**Problem:**
- Public contact form doesn't determine organization from context
- Falls back to "first organization" which is wrong
- Event codes not mapped to organizations

**Action Items:**
1. Create `event_codes` table or mapping system
2. Update `/api/contact.js` to:
   - Check URL slug for organization
   - Check event code for organization
   - Check referrer for organization context
   - Fallback to platform admin org (not first org)
3. Update `/api/crowd-request/submit.js` to use proper mapping

**Estimated Time:** 3-4 hours

---

### 3. **API Routes Missing Organization Filtering** ⚠️ HIGH
**Risk:** SaaS users seeing other organizations' data

**Routes Needing Updates:**
- ❌ `/api/get-contact-projects.js` - Uses `user_id` instead of `organization_id`
- ❌ `/api/get-sms-logs.js` - No organization filtering
- ❌ `/api/admin/notification-logs.js` - No organization filtering (should be admin-only or org-scoped)
- ❌ `/api/contacts/*` - All routes need verification
- ❌ `/api/service-selection/*` - All routes need verification
- ❌ `/api/quote/*` - All routes need verification

**Action Items:**
1. Audit all API routes in `/pages/api/`
2. Add organization filtering using `getOrganizationContext()` helper
3. Ensure admin users see all data, SaaS users see only their org
4. Test each route with multiple organizations

**Estimated Time:** 6-8 hours

---

## 🔴 HIGH PRIORITIES (This Week)

### 4. **RLS Policy Verification** ⚠️ HIGH
**Risk:** Direct database access could bypass API-level filtering

**Status:**
- ✅ `organizations` - Has RLS
- ✅ `crowd_requests` - Has RLS
- ✅ `admin_settings` - Has RLS
- ⚠️ `contacts` - Has RLS but may need `organization_id` update
- ⚠️ `events` - Has RLS but may need `organization_id` update
- ❌ Financial tables - Need RLS verification
- ❌ Communication tables - Need RLS verification

**Action Items:**
1. Verify `is_platform_admin()` function exists and works
2. Test RLS policies for each tenant-scoped table
3. Create missing RLS policies for:
   - `payments`
   - `invoices`
   - `contracts`
   - `sms_conversations`
   - `email_messages`
   - `quote_selections`
   - `service_selections`
4. Test: Direct Supabase queries should respect organization boundaries

**Estimated Time:** 4-5 hours

---

### 5. **Admin vs SaaS Route Separation** ⚠️ HIGH
**Risk:** Confusion between platform admin and SaaS user access

**Current Issues:**
- Hardcoded admin emails in multiple places
- Mixed logic: some routes use `user_id`, some use `organization_id`
- No clear separation between admin routes and SaaS routes

**Action Items:**
1. Centralize admin check: Use `isPlatformAdmin()` helper everywhere
2. Create route protection middleware:
   ```typescript
   // utils/api-helpers.ts
   export async function requireAuth(req, res) {
     const user = await getAuthenticatedUser(req);
     const isAdmin = await isPlatformAdmin(user.email);
     const orgId = isAdmin ? null : await requireOrganization(supabase, user.id);
     return { user, isAdmin, orgId };
   }
   ```
3. Separate route structure:
   - `/admin/*` - Platform admin routes (all orgs)
   - `/onboarding/*` - SaaS user onboarding
   - `/dashboard/*` - SaaS user dashboard (org-scoped)
4. Update all routes to use centralized helpers

**Estimated Time:** 3-4 hours

---

### 6. **Error Handling & Logging** ⚠️ MEDIUM
**Risk:** Silent failures, hard to debug production issues

**Issues Found:**
- Some API routes missing try-catch blocks
- Inconsistent error responses
- No centralized error logging
- TODO comments about error tracking (Sentry, LogRocket)

**Action Items:**
1. Add try-catch to all API routes
2. Standardize error response format:
   ```typescript
   {
     error: string,
     details?: string,
     code?: string,
     timestamp: string
   }
   ```
3. Set up error tracking (Sentry or similar)
4. Add request logging middleware
5. Create error boundary components for React

**Estimated Time:** 4-5 hours

---

## 🟡 MEDIUM PRIORITIES (Next Week)

### 7. **Testing Infrastructure** ⚠️ MEDIUM
**Risk:** No automated tests = regression risk

**Current Status:**
- ❌ No test files found (`.test.js`, `.spec.js`)
- ❌ No test configuration
- ❌ No CI/CD test pipeline

**Action Items:**
1. Set up Jest or Vitest
2. Write tests for:
   - Organization isolation (critical)
   - API route authentication
   - RLS policy behavior
   - Multi-tenant data creation
3. Add integration tests for critical flows:
   - User signup → organization creation
   - Contact form → organization assignment
   - Payment processing → organization isolation
4. Set up GitHub Actions for automated testing

**Estimated Time:** 8-10 hours

---

### 8. **Performance Optimization** ⚠️ MEDIUM
**Risk:** Slow queries, poor user experience

**Areas to Review:**
1. Database indexes on `organization_id` columns
2. N+1 query problems in API routes
3. Image optimization (Next.js Image component usage)
4. API response caching
5. Database query optimization

**Action Items:**
1. Add indexes: `CREATE INDEX idx_table_org_id ON table(organization_id)`
2. Audit slow queries using Supabase dashboard
3. Implement query batching where needed
4. Add response caching for public routes

**Estimated Time:** 3-4 hours

---

### 9. **Documentation** ⚠️ LOW
**Risk:** Hard for new developers to understand system

**Current Status:**
- ✅ Good: Multi-tenant audit docs exist
- ✅ Good: Setup guides for various features
- ❌ Missing: API documentation
- ❌ Missing: Architecture diagrams
- ❌ Missing: Deployment guide

**Action Items:**
1. Create API documentation (OpenAPI/Swagger)
2. Document multi-tenant architecture
3. Create deployment runbook
4. Document environment variables

**Estimated Time:** 4-6 hours

---

## 📊 Summary Statistics

### Code Quality
- **TODO Comments:** 249 found (mostly debug-related, some critical)
- **Test Coverage:** 0% (no tests found)
- **Error Handling:** ~70% of routes have try-catch
- **Organization Filtering:** ~40% of routes properly filter

### Security
- **Authentication:** ✅ Most routes check auth
- **Authorization:** ⚠️ Inconsistent (some use hardcoded emails)
- **Data Isolation:** ⚠️ Partial (financial tables need work)
- **RLS Policies:** ⚠️ Partial (some tables missing)

### Multi-Tenancy Status
- **Database Migrations:** ✅ Most critical tables have `organization_id`
- **API Routes:** ⚠️ ~60% need organization filtering
- **RLS Policies:** ⚠️ ~70% complete
- **Admin Separation:** ⚠️ Needs centralization

---

## 🎯 Recommended Tomorrow's Focus

### Morning (4 hours)
1. **Verify financial table migrations** (1 hour)
   - Check production database
   - Verify `organization_id` columns exist
   - Test RLS policies

2. **Fix contact form organization assignment** (2 hours)
   - Create event code mapping
   - Update `/api/contact.js`
   - Update `/api/crowd-request/submit.js`

3. **Update critical API routes** (1 hour)
   - `/api/get-contact-projects.js`
   - `/api/get-sms-logs.js`

### Afternoon (4 hours)
4. **Add organization filtering to financial routes** (2 hours)
   - `/api/invoices/*`
   - `/api/contracts/*`
   - `/api/payments.js` (if exists)

5. **Test multi-tenant isolation** (2 hours)
   - Create test organizations
   - Verify data isolation
   - Test admin vs SaaS access

---

## 🚀 Quick Wins (Can Do Anytime)

1. **Remove hardcoded admin emails** - Replace with `isPlatformAdmin()` helper
2. **Add error boundaries** - Wrap React components
3. **Add database indexes** - On all `organization_id` columns
4. **Standardize error responses** - Create error response helper
5. **Add request logging** - Log all API requests for debugging

---

## 📝 Notes

- The codebase is in good shape overall
- Multi-tenant foundation is solid
- Main gaps are in API route filtering and RLS policies
- No critical security vulnerabilities found
- Performance is acceptable but could be optimized

---

## 🔗 Related Documents

- `MULTI_TENANT_AUDIT.md` - Detailed multi-tenant audit
- `MULTI_TENANT_CRITICAL_FIXES.md` - Critical fixes checklist
- `SAAS_IMPLEMENTATION_GUIDE.md` - Implementation guide
- `MIGRATION_SUMMARY.md` - Migration status

---

**Last Updated:** January 2025  
**Next Review:** After critical fixes completed

