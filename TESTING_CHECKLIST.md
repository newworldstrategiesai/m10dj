# ✅ Testing Checklist
## Verify Platform Implementation Works Correctly

**Date:** 2025-01-XX  
**Status:** Ready for Testing

---

## 🧪 TESTING PROCEDURES

### **Test 1: Platform Pages (No Login Required)** ✅

#### **1.1 Platform Landing Page**
- [ ] Visit `/platform`
- [ ] Verify page loads without errors
- [ ] Check all links work:
  - [ ] "Start Free Trial" → `/signup`
  - [ ] "View Pricing" → `/dj-pricing`
  - [ ] "Pricing" in nav → `/dj-pricing`
- [ ] Verify responsive design (mobile/tablet/desktop)
- [ ] Check dark mode works

#### **1.2 Pricing Page**
- [ ] Visit `/dj-pricing`
- [ ] Verify all 3 plans display:
  - [ ] Starter: $0/month
  - [ ] Professional: $49/month (Most Popular)
  - [ ] Enterprise: $149/month
- [ ] Check feature lists are correct
- [ ] Verify "Start Free Trial" buttons work
- [ ] Check FAQ section displays
- [ ] Verify responsive design

#### **1.3 Signup Page**
- [ ] Visit `/signup`
- [ ] Verify form displays correctly
- [ ] Test form validation:
  - [ ] Email required
  - [ ] Password required (min 6 chars)
  - [ ] Business name optional
- [ ] Check responsive design
- [ ] Verify links work:
  - [ ] "Sign in" link → `/signin`
  - [ ] "Features" → `/platform`
  - [ ] "Pricing" → `/dj-pricing`

---

### **Test 2: M10 DJ Company (Critical - Must Work)** 🔴

#### **2.1 Homepage**
- [ ] Visit `/` (root)
- [ ] Verify M10 DJ Company homepage loads
- [ ] Check all existing features work:
  - [ ] Contact form
  - [ ] Navigation
  - [ ] All links

#### **2.2 Admin Dashboard**
- [ ] Login as `djbenmurray@gmail.com`
- [ ] Visit `/admin/dashboard`
- [ ] Verify dashboard loads
- [ ] Check all features accessible:
  - [ ] Contacts
  - [ ] Quotes
  - [ ] Contracts
  - [ ] Invoices
  - [ ] Analytics
  - [ ] Crowd requests
- [ ] Verify no subscription restrictions

#### **2.3 Payments**
- [ ] Test crowd request payment flow
- [ ] Verify payments process correctly
- [ ] Check Stripe Connect not required (uses platform account)
- [ ] Verify no errors

#### **2.4 All Existing Features**
- [ ] Contact management
- [ ] Quote generation
- [ ] Contract signing
- [ ] Invoice creation
- [ ] Analytics dashboard
- [ ] All existing pages

**Expected Result:** ✅ **Everything works exactly as before**

---

### **Test 3: New DJ Signup Flow** 🟡

#### **3.1 Signup Process**
- [ ] Visit `/signup`
- [ ] Fill out form:
  - [ ] Business name: "Test DJ Company"
  - [ ] Email: `testdj@example.com`
  - [ ] Password: `testpassword123`
- [ ] Submit form
- [ ] Verify success message
- [ ] Check redirect to `/onboarding/wizard`

#### **3.2 Onboarding Wizard**
- [ ] Verify wizard loads
- [ ] Complete Step 1: Welcome
- [ ] Complete Step 2: Organization Details
  - [ ] Enter organization name
  - [ ] Verify organization created
- [ ] Complete Step 3: Profile
- [ ] Complete Step 4: Plan Selection
  - [ ] Verify all 3 plans show
  - [ ] Select Professional plan
  - [ ] Verify pricing correct ($49/month)
- [ ] Complete Step 5: Complete

#### **3.3 Subscription Checkout** (After Stripe Setup)
- [ ] Click "Select Plan" on Professional
- [ ] Verify redirects to Stripe Checkout
- [ ] Complete test payment
- [ ] Verify redirects to success page
- [ ] Check organization updated:
  - [ ] `subscription_tier` = 'professional'
  - [ ] `subscription_status` = 'active'
  - [ ] `stripe_subscription_id` set

#### **3.4 New DJ Dashboard Access**
- [ ] After subscription, login as new DJ
- [ ] Verify can access dashboard
- [ ] Check features available based on tier
- [ ] Verify data isolated (can't see M10 DJ data)

---

### **Test 4: Data Isolation** 🔴 CRITICAL

#### **4.1 M10 DJ Company Data**
- [ ] Login as `djbenmurray@gmail.com`
- [ ] View contacts
- [ ] Verify only M10 DJ Company contacts visible
- [ ] Check other DJs' data NOT visible

#### **4.2 New DJ Data**
- [ ] Login as new test DJ
- [ ] View contacts (should be empty)
- [ ] Create test contact
- [ ] Verify contact saved
- [ ] Check M10 DJ Company data NOT visible

#### **4.3 Platform Admin Access**
- [ ] Login as platform admin
- [ ] Verify can see all organizations (if needed)
- [ ] Check admin features work

---

### **Test 5: Platform Owner Protection** 🔴 CRITICAL

#### **5.1 Subscription Bypass**
- [ ] Login as `djbenmurray@gmail.com`
- [ ] Verify M10 DJ Company organization:
  - [ ] `is_platform_owner` = TRUE
- [ ] Test subscription checks:
  - [ ] Access features without subscription
  - [ ] No "Upgrade" prompts
  - [ ] Full access to everything

#### **5.2 Stripe Connect Bypass**
- [ ] Test crowd request payment
- [ ] Verify can use platform account
- [ ] No "Set up Stripe Connect" prompts
- [ ] Payments process correctly

#### **5.3 Feature Access**
- [ ] Verify all features accessible
- [ ] No tier restrictions
- [ ] No usage limits
- [ ] Everything works as before

---

### **Test 6: Error Handling** 🟡

#### **6.1 Invalid Inputs**
- [ ] Test signup with invalid email
- [ ] Test signup with short password
- [ ] Verify error messages display
- [ ] Check form doesn't submit

#### **6.2 Edge Cases**
- [ ] Test signup with existing email
- [ ] Verify appropriate error message
- [ ] Test onboarding with no organization
- [ ] Verify redirects correctly

---

## 🐛 KNOWN ISSUES TO CHECK

### **Build Warnings:**
- ⚠️ Duplicate page warning (should be fixed after removing signup.js)
- ⚠️ Edge Runtime warnings (Supabase - not critical)

### **Potential Issues:**
- [ ] Check if `/onboarding/welcome` exists (may need to create)
- [ ] Verify role-based redirect works
- [ ] Check organization creation trigger works

---

## ✅ SUCCESS CRITERIA

### **Must Pass:**
- [x] Platform pages load without errors
- [ ] M10 DJ Company homepage works
- [ ] M10 DJ Company admin dashboard works
- [ ] All M10 DJ Company features work
- [ ] New DJ can sign up
- [ ] Onboarding wizard works
- [ ] Data isolation works
- [ ] Platform owner protection works

### **Nice to Have:**
- [ ] Subscription checkout works (after Stripe setup)
- [ ] Email confirmations work
- [ ] All responsive designs work
- [ ] Dark mode works everywhere

---

## 🚨 ROLLBACK PLAN

### **If Something Breaks:**

1. **Revert Code:**
   ```bash
   git revert HEAD
   git push
   ```

2. **Restore Old Signup:**
   ```bash
   # Restore pages/signup.js if needed
   ```

3. **Verify M10 DJ Company:**
   - Test all critical features
   - Verify no disruption

---

## 📊 TEST RESULTS

### **Test Date:** ___________

### **Results:**
- Platform Pages: [ ] Pass [ ] Fail
- M10 DJ Company: [ ] Pass [ ] Fail
- New DJ Signup: [ ] Pass [ ] Fail
- Data Isolation: [ ] Pass [ ] Fail
- Platform Owner: [ ] Pass [ ] Fail

### **Issues Found:**
1. 
2. 
3. 

### **Notes:**
- 

---

## 🎯 NEXT STEPS AFTER TESTING

1. **If All Tests Pass:**
   - Set up Stripe products
   - Test subscription checkout
   - Launch to first beta DJ

2. **If Issues Found:**
   - Document issues
   - Fix critical issues first
   - Re-test
   - Continue when stable

---

**Status:** Ready for testing! 🧪

