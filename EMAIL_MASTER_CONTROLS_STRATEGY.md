# 📧 Email Master Controls Strategy

**Date:** January 2025  
**Priority:** HIGH - Platform Safety & Development Workflow  
**Status:** 📋 STRATEGY PHASE

---

## 🎯 Goal

Create master controls where:
1. **Super Admin (Platform Level)**: Can control email communications for the entire platform
2. **Organization Admins**: Can control email communications for their specific organization

Both levels support:
- **Disable ALL email communications** (emergency stop)
- **Allow admin/dev emails only** (development mode - no customer emails)
- **Allow all emails** (normal production mode)

This protects against:
- Accidental email sends during development
- Email spam during testing
- Emergency situations requiring immediate email shutdown
- Compliance issues
- Organization-specific testing without affecting other orgs

---

## 🏗️ Architecture Overview

### Control Hierarchy

Email sending follows this priority order:

1. **Organization-Level Control** (if exists)
   - If organization has a custom email control setting, use that
   - Only affects emails for that specific organization
   - Organization admins/owners can manage

2. **Platform-Level Control** (fallback)
   - If organization has no custom setting, use platform default
   - Affects all organizations without custom settings
   - Only super admin can manage

3. **Default Behavior** (if no controls exist)
   - All emails enabled (normal production mode)

4. **Critical Emails** (always allowed)
   - Auth emails (password reset, signup verification)
   - Security alerts
   - Payment confirmations
   - Always bypass all controls

### Example Scenarios

**Scenario 1: Platform set to "Admin/Dev Only", Org A has no custom setting**
- Org A emails: Blocked (uses platform default)
- Org B emails: Blocked (uses platform default)
- Admin emails: Allowed
- Critical emails: Allowed

**Scenario 2: Platform set to "Admin/Dev Only", Org A set to "All Enabled"**
- Org A emails: Allowed (org override)
- Org B emails: Blocked (uses platform default)
- Admin emails: Allowed
- Critical emails: Allowed

**Scenario 3: Platform set to "All Enabled", Org A set to "Admin/Dev Only"**
- Org A emails: Blocked (org override)
- Org B emails: Allowed (uses platform default)
- Admin emails: Allowed
- Critical emails: Allowed

---

### Email Classification System

All emails must be classified into one of these categories:

1. **ADMIN_DEV** - Internal/admin/development emails
   - Admin notifications
   - System alerts
   - Development/test emails
   - Error reports
   - Internal communications

2. **CUSTOMER** - Customer-facing emails
   - Lead notifications
   - Invoice emails
   - Contract emails
   - Password resets
   - Welcome emails
   - Tip Jar notifications
   - Venue invitations
   - Follow-up emails
   - Any email sent to end users/customers

3. **CRITICAL** - System-critical emails (always allowed)
   - Authentication emails (signup, password reset)
   - Security alerts
   - Payment confirmations
   - Account verification

---

## 📊 Database Schema

### Option 1: Use Feature Flags Table (Recommended)

Leverage existing `feature_flags` table for consistency:

```sql
-- Add email control flags to feature_flags table
INSERT INTO feature_flags (flag_name, enabled, description) VALUES
  ('EMAIL_ALL_ENABLED', true, 'Master switch: Allow all email communications'),
  ('EMAIL_ADMIN_DEV_ONLY', false, 'Development mode: Only admin/dev emails allowed'),
  ('EMAIL_CRITICAL_ONLY', false, 'Emergency mode: Only critical system emails allowed')
ON CONFLICT (flag_name) DO NOTHING;
```

**Pros:**
- Reuses existing infrastructure
- Consistent with other feature flags
- Already has admin update policies
- Simple to implement

**Cons:**
- Less granular control
- Flags are boolean, not enum

### Option 2: New `email_controls` Table (More Flexible) - RECOMMENDED

```sql
CREATE TABLE IF NOT EXISTS email_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Platform-level control (organization_id is NULL)
  -- Organization-level control (organization_id is set)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  control_mode TEXT NOT NULL DEFAULT 'all' 
    CHECK (control_mode IN ('all', 'admin_dev_only', 'critical_only', 'disabled')),
  
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Only one platform control, one per organization
  UNIQUE(organization_id) -- NULL for platform, UUID for org
);

-- Insert default platform control (all enabled)
INSERT INTO email_controls (organization_id, control_mode) 
VALUES (NULL, 'all')
ON CONFLICT (organization_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_controls_org_id ON email_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_controls_platform ON email_controls(organization_id) WHERE organization_id IS NULL;

-- RLS: Platform and organization admins can manage
ALTER TABLE email_controls ENABLE ROW LEVEL SECURITY;

-- Platform admins can view/update platform controls
CREATE POLICY "Platform admins can manage platform email controls"
  ON email_controls FOR ALL
  USING (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization owners/admins can view/update their org controls
CREATE POLICY "Org admins can manage their org email controls"
  ON email_controls FOR ALL
  USING (
    organization_id IS NOT NULL
    AND (
      -- User is owner of the organization
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = email_controls.organization_id
        AND owner_id = auth.uid()
      )
      -- OR user is admin/owner member
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = email_controls.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );

-- Platform admins can view all controls
CREATE POLICY "Platform admins can view all email controls"
  ON email_controls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = true
    )
  );

-- Organization admins can view their org's control
CREATE POLICY "Org admins can view their org email controls"
  ON email_controls FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND (
      EXISTS (
        SELECT 1 FROM organizations
        WHERE id = email_controls.organization_id
        AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = email_controls.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
      )
    )
  );
```

**Pros:**
- Supports both platform and organization-level controls
- Organization admins can manage their own org's emails
- Platform admins can manage platform-wide settings
- Clear audit trail (updated_by, notes)
- Organization-level controls override platform defaults
- Can add product-specific controls later

**Cons:**
- New table to maintain
- More complex logic (check org first, then platform)

**RECOMMENDATION: Use Option 2** for better control and auditability.

---

## 🔧 Implementation Strategy

### Phase 1: Database & Core Utilities

1. **Create migration** for `email_controls` table
2. **Create utility function** `lib/email/email-controls.ts`:
   ```typescript
   export type EmailCategory = 'ADMIN_DEV' | 'CUSTOMER' | 'CRITICAL';
   export type EmailControlMode = 'all' | 'admin_dev_only' | 'critical_only' | 'disabled';
   
   /**
    * Check if email can be sent based on platform and organization controls
    * Priority: Organization-level > Platform-level > Default (all enabled)
    */
   export async function canSendEmail(
     category: EmailCategory,
     recipientEmail?: string,
     organizationId?: string | null
   ): Promise<{ allowed: boolean; reason?: string; controlLevel?: 'platform' | 'organization' }>
   ```

3. **Create helper function** to check if email is admin/dev:
   ```typescript
   export function isAdminDevEmail(email: string): boolean {
     // Check against admin_roles table
     // Check against hardcoded admin emails
     // Check against development/test email patterns
   }
   ```

### Phase 2: Integration Points

Update ALL email sending functions to check controls:

#### Critical Email Functions (Must Update):
1. ✅ `app/api/auth/hook/route.ts` - Auth emails (CRITICAL)
2. ✅ `pages/api/admin/communications/send-email.js` - Admin communications (ADMIN_DEV)
3. ✅ `pages/api/contact.js` - Lead notifications (CUSTOMER)
4. ✅ `pages/api/invoices/[id]/send.js` - Invoice emails (CUSTOMER)
5. ✅ `utils/payment-link-helper.js` - Payment emails (CUSTOMER)
6. ✅ `lib/email/tipjar-batch-emails.ts` - Tip Jar emails (CUSTOMER)
7. ✅ `lib/email/venue-invitation-email.ts` - Venue emails (CUSTOMER)
8. ✅ `pages/api/followups/check-and-send.js` - Follow-up emails (CUSTOMER)
9. ✅ `lib/email/email-assistant.ts` - Email assistant (CUSTOMER)
10. ✅ `utils/notification-system.js` - Notification emails (ADMIN_DEV)

#### Integration Pattern:

```typescript
import { canSendEmail } from '@/lib/email/email-controls';

// Before sending email:
// Get organization context (from request, user session, etc.)
const organizationId = req.body.organizationId || user.organization_id || null;

const emailCheck = await canSendEmail('CUSTOMER', recipientEmail, organizationId);
if (!emailCheck.allowed) {
  console.warn(`[Email Blocked] ${emailCheck.reason} (${emailCheck.controlLevel} level)`);
  // Option 1: Silently skip (for automated emails)
  // Option 2: Return error (for user-initiated emails)
  return { success: false, blocked: true, reason: emailCheck.reason };
}

// Proceed with sending...
```

### Phase 3: Admin UI

Create admin pages:
1. **Platform Controls**: `pages/admin/email-controls.tsx` (super admin only)
2. **Organization Controls**: `pages/admin/organization/email-controls.tsx` (org admins)

**Platform Controls Page (Super Admin):**
- Radio buttons for platform-wide control mode
- Shows current platform status
- Warning that this affects ALL organizations
- Last updated timestamp
- Confirmation dialogs for restrictive modes

**Organization Controls Page (Org Admins):**
- Radio buttons for organization-specific control mode
- Shows current org status
- Shows platform default (if org has no override)
- Option to "Use Platform Default" or set custom
- Last updated timestamp
- Note: Organization settings override platform settings

**Access Control:**
- Platform controls: Only super admin can change
- Organization controls: Organization owners/admins can change their org's settings
- Both can view their respective controls

### Phase 4: Logging & Monitoring

1. **Log all blocked emails** to `email_logs` or similar table
2. **Add metrics**:
   - Emails blocked count
   - Emails sent count
   - Control mode changes
3. **Alert super admin** when emails are blocked (optional)

---

## 📋 Email Classification Guide

### ADMIN_DEV Emails
- Admin notification emails (lead alerts, system alerts)
- Development/test emails
- Error reports
- Internal system communications
- Admin-to-admin emails

**Recipients:**
- `djbenmurray@gmail.com`
- `m10djcompany@gmail.com`
- Any email in `admin_roles` table
- Emails matching patterns: `*@m10djcompany.com`, `*@djdash.net` (admin domains)

### CUSTOMER Emails
- Lead confirmation emails
- Invoice emails
- Contract emails
- Welcome emails
- Tip Jar notifications
- Venue invitations
- Follow-up emails
- Quote emails
- Payment receipts
- Review requests

**Recipients:**
- Any email NOT in admin/dev list
- Customer email addresses
- End-user emails

### CRITICAL Emails
- Password reset emails
- Email verification (signup)
- Account security alerts
- Payment confirmations (transactional)
- Two-factor authentication codes

**Recipients:**
- Any email (these are always allowed)

---

## 🔒 Security Considerations

1. **Access Control**:
   - Platform controls: Only super admin can change
   - Organization controls: Only org owners/admins can change their org's settings
   - Users cannot change settings for other organizations
2. **Audit Trail**: Log all control changes (who, when, what, which level)
3. **Graceful Degradation**: System should continue working even if emails are blocked
4. **Critical Emails Always Work**: Auth emails must always work regardless of settings
5. **No Silent Failures**: Log all blocked emails for review
6. **Organization Isolation**: Organization-level controls only affect that organization's emails
7. **Platform Override**: Platform controls apply to all orgs unless org has its own setting

---

## 🧪 Testing Strategy

### Test Cases:

#### Platform-Level Controls:

1. **Platform: All Enabled Mode:**
   - ✅ Customer emails send (all orgs)
   - ✅ Admin emails send
   - ✅ Critical emails send

2. **Platform: Admin/Dev Only Mode:**
   - ❌ Customer emails blocked (all orgs)
   - ✅ Admin emails send
   - ✅ Critical emails send

3. **Platform: Critical Only Mode:**
   - ❌ Customer emails blocked (all orgs)
   - ❌ Admin emails blocked
   - ✅ Critical emails send

#### Organization-Level Controls:

4. **Platform: All Enabled, Org: Admin/Dev Only:**
   - ❌ Customer emails blocked (for that org only)
   - ✅ Customer emails send (for other orgs)
   - ✅ Admin emails send
   - ✅ Critical emails send

5. **Platform: Admin/Dev Only, Org: All Enabled:**
   - ✅ Customer emails send (for that org only - org overrides platform)
   - ❌ Customer emails blocked (for other orgs)
   - ✅ Admin emails send
   - ✅ Critical emails send

6. **Platform: Disabled, Org: All Enabled:**
   - ✅ Customer emails send (for that org only - org overrides platform)
   - ❌ Customer emails blocked (for other orgs)
   - ✅ Critical emails send (always)

#### Edge Cases:

7. **Edge Cases:**
   - Email to admin email from customer flow
   - Email to customer email from admin flow
   - Missing recipient email
   - Invalid email addresses
   - Organization with no control setting (uses platform default)
   - Multiple organizations with different settings

---

## 📁 Files to Create/Modify

### New Files:
1. `supabase/migrations/[timestamp]_create_email_controls.sql`
2. `lib/email/email-controls.ts` - Core utility functions
3. `pages/admin/email-controls.tsx` - Platform-level admin UI (super admin)
4. `pages/admin/organization/email-controls.tsx` - Organization-level admin UI
5. `components/admin/EmailControlsPanel.tsx` - Reusable component (used by both pages)

### Files to Modify:
1. All email sending functions (see Phase 2 list)
2. `utils/auth-helpers/super-admin.ts` - Add email control check helper
3. `types/supabase.ts` - Add email_controls type (if using new table)

---

## 🚀 Rollout Plan

### Step 1: Database & Utilities (Day 1)
- Create migration
- Create utility functions
- Test utility functions in isolation

### Step 2: Integration - Critical Path (Day 2)
- Update auth emails (CRITICAL category)
- Update admin communications (ADMIN_DEV)
- Test with different control modes

### Step 3: Integration - Customer Emails (Day 3-4)
- Update all customer-facing email functions
- Test each category
- Verify blocking works correctly

### Step 4: Admin UI (Day 5)
- Create admin page
- Add access controls
- Test UI interactions

### Step 5: Monitoring & Logging (Day 6)
- Add logging for blocked emails
- Add metrics dashboard
- Set up alerts (optional)

### Step 6: Documentation & Training (Day 7)
- Document for team
- Create runbook for emergency situations
- Test full workflow

---

## ⚠️ Risk Mitigation

1. **Default to Enabled**: New system defaults to "all enabled" to avoid breaking production
2. **Gradual Rollout**: Test in staging first, then production
3. **Rollback Plan**: Can quickly revert to "all enabled" if issues
4. **Critical Emails Protected**: Auth emails always work regardless of settings
5. **Clear Logging**: All blocked emails logged for review

---

## 📊 Success Metrics

- ✅ Zero customer emails sent during development mode (platform or org level)
- ✅ All critical emails always deliver
- ✅ Super admin can toggle platform controls in < 30 seconds
- ✅ Organization admins can toggle org controls in < 30 seconds
- ✅ Organization controls properly override platform controls
- ✅ No production email incidents during testing
- ✅ Clear audit trail of all control changes (platform and org level)
- ✅ Organization isolation works correctly (one org's settings don't affect others)

---

## 🔄 Future Enhancements

1. **Product-Specific Controls**: Different settings per product (DJDash, M10DJ, TipJar)
2. **Time-Based Controls**: Auto-disable during certain hours
3. **Email Type Granularity**: Control specific email types (invoices, contracts, etc.)
4. **Whitelist/Blacklist**: Specific email addresses always allowed/blocked
5. **Scheduled Changes**: Schedule control mode changes
6. **Email Queue**: Queue blocked emails for later sending when enabled
7. **Bulk Organization Controls**: Super admin can set controls for multiple orgs at once
8. **Organization Templates**: Pre-configured control settings for common scenarios

---

## ✅ Next Steps

1. Review and approve strategy
2. Choose database approach (Feature Flags vs New Table)
3. Create migration
4. Implement core utilities
5. Begin integration with email functions

---

**Status:** Ready for implementation approval
