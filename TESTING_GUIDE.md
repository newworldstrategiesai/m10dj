# 🧪 Multi-Tenant Testing Guide

## Automated Tests

### 1. Database Schema Test
```bash
node scripts/test-multi-tenant-isolation.js
```
**What it tests:**
- ✅ All critical tables have `organization_id` columns
- ✅ Organization slug uniqueness
- ✅ Orphaned records detection
- ✅ Data distribution across organizations

### 2. API Isolation Test
```bash
node scripts/test-api-isolation.js
```
**What it tests:**
- ✅ Data isolation between organizations
- ✅ No cross-contamination of records
- ✅ Proper organization filtering

### 3. Backfill Orphaned Records
```bash
node scripts/backfill-contacts-organization.js
```
**What it does:**
- Assigns orphaned contacts to platform admin's organization
- Run this once to migrate existing data

---

## Manual Testing Checklist

### Prerequisites
1. ✅ At least 2 organizations exist in database
2. ✅ At least 2 users (one per organization)
3. ✅ Test data in each organization

### Test 1: API Route Isolation

#### Setup:
1. Log in as User A (Org A owner)
2. Log in as User B (Org B owner) in different browser/incognito

#### Test Steps:

**Contacts API:**
- [ ] User A calls `/api/get-contact-projects.js?contactId=<orgA-contact>`
  - ✅ Should see Org A contacts only
  - ❌ Should NOT see Org B contacts
- [ ] User B calls same endpoint
  - ✅ Should see Org B contacts only
  - ❌ Should NOT see Org A contacts

**Payments API:**
- [ ] User A calls `/api/payments.js?contact_id=<orgA-contact>`
  - ✅ Should see Org A payments only
- [ ] User B calls same endpoint
  - ✅ Should see Org B payments only

**Invoices API:**
- [ ] User A calls `/api/invoices/[id]` with Org A invoice
  - ✅ Should succeed
- [ ] User A calls `/api/invoices/[id]` with Org B invoice
  - ❌ Should return 403 Forbidden
- [ ] User B calls `/api/invoices/[id]` with Org B invoice
  - ✅ Should succeed

**Contracts API:**
- [ ] User A calls `/api/contracts/[id]` with Org A contract
  - ✅ Should succeed
- [ ] User A calls `/api/contracts/[id]` with Org B contract
  - ❌ Should return 403 Forbidden

**SMS Logs API:**
- [ ] User A calls `/api/get-sms-logs.js`
  - ✅ Should only see contacts from Org A
- [ ] User B calls same endpoint
  - ✅ Should only see contacts from Org B

### Test 2: Contact Form Organization Assignment

#### Test Steps:

**Test A: Submit from Organization URL**
1. Navigate to: `http://localhost:3000/{org-slug}/requests`
2. Fill out contact form
3. Submit form
4. Check database:
   - [ ] Contact should have `organization_id` = org-slug's organization
   - [ ] `contact_submission` should have same `organization_id`

**Test B: Submit from Platform Homepage**
1. Navigate to: `http://localhost:3000/`
2. Fill out contact form
3. Submit form
4. Check database:
   - [ ] Contact should have `organization_id` = platform admin's organization
   - [ ] Logs should show organization detection from referrer/origin

**Test C: Submit with Explicit Organization**
1. Use API directly: `POST /api/contact` with `organizationSlug` in body
2. Check database:
   - [ ] Contact should have correct `organization_id`

### Test 3: Platform Admin Access

#### Test Steps:
1. Log in as platform admin (djbenmurray@gmail.com)
2. Access admin dashboard
3. Verify:
   - [ ] Can see all organizations' data
   - [ ] No organization filtering applied
   - [ ] Can access all contacts, payments, invoices, contracts

### Test 4: Service Selection Flow

#### Test Steps:
1. Create contact in Org A
2. Generate service selection link for that contact
3. Submit service selection
4. Verify:
   - [ ] `service_selection` has `organization_id` = Org A
   - [ ] Generated `invoice` has `organization_id` = Org A
   - [ ] Generated `contract` has `organization_id` = Org A

### Test 5: Crowd Request Flow

#### Test Steps:
1. Navigate to: `http://localhost:3000/{org-slug}/requests`
2. Submit crowd request
3. Verify:
   - [ ] `crowd_request` has `organization_id` = org-slug's organization
   - [ ] Request appears in Org A's dashboard only
   - [ ] Org B cannot see this request

---

## Browser Testing

### Test Organization URL Detection

1. **Test Referrer Detection:**
   ```javascript
   // In browser console on /org-slug/requests page
   fetch('/api/contact', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Test User',
       email: 'test@example.com',
       // ... other fields
     })
   })
   ```
   - Check server logs for organization detection
   - Verify contact is assigned to correct organization

2. **Test Origin Detection:**
   - Submit form from different origin
   - Verify organization is detected correctly

---

## Expected Results

### ✅ Success Criteria:
- Org A users see only Org A data
- Org B users see only Org B data
- Platform admins see all data
- Contact forms assign correct organization
- No data leakage between organizations
- All API routes filter correctly

### ❌ Failure Indicators:
- User A can see User B's contacts
- User A can access User B's invoices/contracts
- Contact forms assign wrong organization
- API routes return data from wrong organization
- 403 errors when accessing own data

---

## Debugging Tips

### Check Organization Assignment:
```sql
-- In Supabase SQL Editor
SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.organization_id,
  o.name as organization_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE c.organization_id IS NULL
LIMIT 10;
```

### Check API Route Logs:
- Look for `✅ Using organization_id from...` messages
- Check for `⚠️ WARNING: No organization_id determined` warnings

### Verify RLS Policies:
1. Go to Supabase Dashboard
2. Navigate to Database > Policies
3. Verify policies exist for:
   - `contacts`
   - `payments`
   - `invoices`
   - `contracts`
   - `crowd_requests`

---

## Test Data Setup

### Create Test Organizations:
```sql
-- Create test organization A
INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
VALUES ('Test Org A', 'test-org-a', '<user-a-id>', 'starter', 'trial');

-- Create test organization B
INSERT INTO organizations (name, slug, owner_id, subscription_tier, subscription_status)
VALUES ('Test Org B', 'test-org-b', '<user-b-id>', 'starter', 'trial');
```

### Create Test Contacts:
```sql
-- Org A contact
INSERT INTO contacts (first_name, last_name, email_address, organization_id, user_id)
VALUES ('John', 'Doe', 'john@orga.com', '<org-a-id>', '<user-a-id>');

-- Org B contact
INSERT INTO contacts (first_name, last_name, email_address, organization_id, user_id)
VALUES ('Jane', 'Smith', 'jane@orgb.com', '<org-b-id>', '<user-b-id>');
```

---

## Next Steps After Testing

1. ✅ Fix any isolation issues found
2. ✅ Backfill orphaned records
3. ✅ Verify RLS policies
4. ✅ Test in production environment
5. ✅ Monitor for organization assignment issues

