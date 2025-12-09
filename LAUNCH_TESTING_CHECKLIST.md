# SaaS Launch Testing Checklist

**Date:** 2025-01-XX  
**Status:** Ready for Testing

---

## 🎯 Pre-Launch Testing Checklist

### 1. Multi-Tenant Data Isolation ✅

- [ ] **Test Organization A cannot see Organization B's data**
  - [ ] Create two test organizations
  - [ ] Create contacts in Org A
  - [ ] Login as Org B user
  - [ ] Verify Org B cannot see Org A's contacts
  - [ ] Verify Org B cannot access Org A's invoices
  - [ ] Verify Org B cannot access Org A's contracts
  - [ ] Verify Org B cannot access Org A's quotes

- [ ] **Test Platform Admin can see all data**
  - [ ] Login as platform admin
  - [ ] Verify admin can see all organizations
  - [ ] Verify admin can see all contacts across orgs
  - [ ] Verify admin can see all invoices across orgs
  - [ ] Test "view as" functionality

- [ ] **Test Team Members**
  - [ ] Create team member in Organization A
  - [ ] Login as team member
  - [ ] Verify team member can see Org A's data
  - [ ] Verify team member cannot see other orgs' data
  - [ ] Test role permissions (admin, member, viewer)

---

### 2. Subscription Enforcement ✅

- [ ] **Event Creation Limits**
  - [ ] Create Starter tier organization
  - [ ] Create 5 events (should succeed)
  - [ ] Try to create 6th event (should fail with upgrade message)
  - [ ] Upgrade to Professional
  - [ ] Verify unlimited events work

- [ ] **Team Member Feature Gating**
  - [ ] Try to invite team member on Starter tier (should fail)
  - [ ] Try to invite team member on Professional tier (should fail)
  - [ ] Upgrade to Enterprise
  - [ ] Verify team invites work

- [ ] **SMS AI Feature Gating**
  - [ ] Send SMS from Starter tier contact (should get basic reply)
  - [ ] Upgrade to Professional
  - [ ] Send SMS from Professional tier contact (should get AI reply)
  - [ ] Verify AI responses are gated correctly

- [ ] **Trial Expiration**
  - [ ] Create organization with expired trial
  - [ ] Try to create event (should fail)
  - [ ] Verify upgrade prompt appears
  - [ ] Upgrade subscription
  - [ ] Verify features work after upgrade

---

### 3. API Route Security ✅

- [ ] **Test all API routes with organization filtering**
  - [ ] `/api/invoices/*` - Verify org filtering
  - [ ] `/api/contracts/*` - Verify org filtering
  - [ ] `/api/quote/*` - Verify org filtering
  - [ ] `/api/crowd-request/*` - Verify org filtering
  - [ ] `/api/payments/*` - Verify org filtering

- [ ] **Test platform admin bypass**
  - [ ] Login as platform admin
  - [ ] Call API routes
  - [ ] Verify admin can access all data

- [ ] **Test unauthorized access**
  - [ ] Try to access other org's data via API
  - [ ] Verify 403 Forbidden responses
  - [ ] Verify proper error messages

---

### 4. Usage Dashboard ✅

- [ ] **Display Current Usage**
  - [ ] Events created this month
  - [ ] Events limit (or unlimited)
  - [ ] Team members count
  - [ ] Subscription tier and status
  - [ ] Trial expiration date (if applicable)

- [ ] **Upgrade Prompts**
  - [ ] Show upgrade prompt when limit reached
  - [ ] Show upgrade prompt when feature gated
  - [ ] Verify upgrade links work
  - [ ] Test upgrade flow

- [ ] **Visual Indicators**
  - [ ] Progress bars for usage
  - [ ] Warning colors when near limit
  - [ ] Success indicators for unlimited features

---

### 5. Onboarding Flow ✅

- [ ] **New User Signup**
  - [ ] Create new account
  - [ ] Verify organization is created
  - [ ] Verify trial period is set (14 days)
  - [ ] Verify default tier is Starter

- [ ] **Plan Selection**
  - [ ] Navigate to plan selection page
  - [ ] View all three tiers
  - [ ] Select a plan
  - [ ] Verify Stripe checkout works
  - [ ] Verify subscription is created

- [ ] **Post-Signup**
  - [ ] Complete onboarding
  - [ ] Verify user lands on dashboard
  - [ ] Verify usage dashboard is visible
  - [ ] Verify all features work for selected tier

---

### 6. Subscription Management ✅

- [ ] **Stripe Integration**
  - [ ] Create subscription via Stripe
  - [ ] Verify webhook updates organization
  - [ ] Test subscription cancellation
  - [ ] Test subscription renewal
  - [ ] Test payment failure handling

- [ ] **Subscription Status**
  - [ ] Verify status updates correctly
  - [ ] Test trial → active transition
  - [ ] Test active → cancelled transition
  - [ ] Test past_due handling

- [ ] **Customer Portal**
  - [ ] Access Stripe customer portal
  - [ ] Update payment method
  - [ ] Cancel subscription
  - [ ] Verify changes sync to database

---

### 7. Feature Gating ✅

- [ ] **Starter Tier**
  - [ ] 5 events/month limit enforced
  - [ ] No SMS AI features
  - [ ] No team members
  - [ ] No white-label
  - [ ] No API access

- [ ] **Professional Tier**
  - [ ] Unlimited events
  - [ ] SMS AI features enabled
  - [ ] No team members
  - [ ] No white-label
  - [ ] No API access

- [ ] **Enterprise Tier**
  - [ ] Unlimited events
  - [ ] SMS AI features enabled
  - [ ] Team members enabled
  - [ ] White-label enabled
  - [ ] API access enabled

---

### 8. Error Handling ✅

- [ ] **Graceful Degradation**
  - [ ] Test with missing organization
  - [ ] Test with expired trial
  - [ ] Test with cancelled subscription
  - [ ] Verify helpful error messages
  - [ ] Verify upgrade prompts appear

- [ ] **API Error Responses**
  - [ ] Test 401 Unauthorized
  - [ ] Test 403 Forbidden
  - [ ] Test 404 Not Found
  - [ ] Verify error messages are clear

---

### 9. Performance Testing ✅

- [ ] **Load Testing**
  - [ ] Test with 10+ organizations
  - [ ] Test with 100+ contacts per org
  - [ ] Test API response times
  - [ ] Verify no data leakage between orgs

- [ ] **Database Queries**
  - [ ] Verify RLS policies work correctly
  - [ ] Test query performance with org filtering
  - [ ] Verify indexes are used

---

### 10. User Experience ✅

- [ ] **Dashboard**
  - [ ] Usage dashboard displays correctly
  - [ ] Upgrade prompts are clear
  - [ ] Navigation works
  - [ ] Mobile responsive

- [ ] **Onboarding**
  - [ ] Flow is intuitive
  - [ ] Plan selection is clear
  - [ ] Stripe checkout works
  - [ ] Post-signup experience is smooth

- [ ] **Error Messages**
  - [ ] Messages are user-friendly
  - [ ] Upgrade prompts are actionable
  - [ ] Trial expiration warnings are clear

---

## 🚀 Launch Readiness Criteria

### Must Have (100% Complete)
- [x] Multi-tenant data isolation
- [x] Subscription enforcement
- [x] API route security
- [x] Feature gating
- [x] Usage dashboard
- [x] Upgrade prompts
- [x] Onboarding flow
- [x] Stripe integration

### Should Have (95% Complete)
- [x] Team member support
- [x] Platform admin support
- [x] Error handling
- [ ] SMS usage tracking (optional)
- [ ] Usage analytics (optional)

### Nice to Have (Future)
- [ ] Usage alerts
- [ ] Automated upgrade suggestions
- [ ] Usage reports
- [ ] A/B testing

---

## 📋 Testing Script

### Step 1: Create Test Organizations
```bash
# Create Org A (Starter)
# Create Org B (Professional)
# Create Org C (Enterprise)
```

### Step 2: Test Data Isolation
```bash
# Login as Org A user
# Create contacts, invoices, contracts
# Login as Org B user
# Verify cannot see Org A data
```

### Step 3: Test Subscription Limits
```bash
# Login as Org A (Starter)
# Create 5 events (should work)
# Try to create 6th (should fail)
# Verify upgrade prompt
```

### Step 4: Test Feature Gating
```bash
# Login as Org A (Starter)
# Try to invite team member (should fail)
# Try to use SMS AI (should get basic reply)
# Upgrade to Professional
# Verify SMS AI works
```

### Step 5: Test Platform Admin
```bash
# Login as platform admin
# Verify can see all organizations
# Test "view as" functionality
# Verify can access all data
```

---

## ✅ Sign-Off

- [ ] **Technical Lead:** All systems tested and working
- [ ] **Product Owner:** Features meet requirements
- [ ] **QA:** All test cases passed
- [ ] **Security:** Data isolation verified
- [ ] **Stakeholder:** Ready for launch

---

**Last Updated:** 2025-01-XX  
**Status:** Ready for Final Testing

