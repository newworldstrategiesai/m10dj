# 🧪 TipJar Production Testing Checklist

**Status**: Ready for production testing  
**Model**: SaaS Platform with Stripe-owned pricing  
**Account Type**: Express accounts with Destination Charges (application fees)

---

## ✅ Pre-Launch Verification

### Stripe Configuration
- [x] Platform verification completed
- [x] Express accounts enabled
- [x] Environment variables set (production keys)
- [x] Webhook endpoint configured
- [ ] Webhook events tested (account.updated, payment_intent.succeeded, transfer.created)

### Database
- [x] Organization product_context fixed (tipjar)
- [x] Stripe Connect fields exist in organizations table
- [x] User metadata has product_context

### Code
- [x] Stripe Connect setup button fixed
- [x] Setup component added to crowd-requests page
- [x] Application fees configured (3.5% + $0.30)
- [x] Destination charges implementation verified (application_fee_amount + transfer_data)

---

## 🧪 Production Testing Flow

### Test 1: User Onboarding & Account Creation

**Steps:**
1. Sign in as TipJar user (memphismillennial@gmail.com)
2. Navigate to `/admin/crowd-requests`
3. Verify "Stripe Connect Setup Required" banner appears
4. Click "Set up Stripe Connect" button
5. Verify setup component appears below banner
6. Click "Set Up Stripe Payments" button

**Expected Results:**
- ✅ Button scrolls to setup component smoothly
- ✅ Setup component loads without errors
- ✅ "Set Up Stripe Payments" button is clickable
- ✅ Redirects to Stripe onboarding page
- ✅ No 500 errors in console

**What to Check:**
- Browser console for errors
- Network tab for failed API calls
- Stripe Dashboard → Connect → Accounts (should see new account)

---

### Test 2: Stripe Onboarding Flow

**Steps:**
1. Complete Stripe Express account onboarding:
   - Business information
   - Identity verification
   - Bank account details
2. Return to TipJar after completion

**Expected Results:**
- ✅ Onboarding completes successfully
- ✅ Redirects back to TipJar
- ✅ Account status updates in database
- ✅ Banner disappears or shows success message
- ✅ Setup component shows "Payment Setup Complete"

**What to Check:**
- Stripe Dashboard → Connect → Accounts → [Account ID]
  - `charges_enabled: true`
  - `payouts_enabled: true`
  - `details_submitted: true`
- TipJar dashboard shows success state
- Database: `stripe_connect_onboarding_complete: true`

---

### Test 3: Payment Processing

**Steps:**
1. Create a test song request
2. Add payment amount (e.g., $10.00)
3. Click "Pay" or "Request Song"
4. Complete Stripe Checkout
5. Use test card: `4242 4242 4242 4242`

**Expected Results:**
- ✅ Payment processes successfully
- ✅ Platform fee calculated correctly (3.5% + $0.30)
- ✅ Payment routed to connected account
- ✅ Request marked as paid
- ✅ Confirmation email sent (if configured)

**Fee Calculation Example:**
- Payment: $10.00
- Platform fee: ($10.00 × 3.5%) + $0.30 = $0.65
- DJ receives: $10.00 - $0.65 = $9.35
- Stripe fee: ~$0.59 (charged to DJ's account)

**What to Check:**
- Stripe Dashboard → Payments (verify payment)
- Stripe Dashboard → Connect → Accounts → [Account] → Transfers
- Database: `crowd_requests` table (payment_status, amount_paid)
- Platform fee calculation in logs

---

### Test 4: Payout Verification

**Steps:**
1. Wait for payout schedule (daily by default)
2. Check Stripe Dashboard for payout
3. Verify payout amount

**Expected Results:**
- ✅ Payout created automatically
- ✅ Amount matches expected (payment - fees)
- ✅ Payout status: `paid` or `pending`
- ✅ Bank account receives funds (test mode: instant, live: 2-7 days)

**What to Check:**
- Stripe Dashboard → Connect → Accounts → [Account] → Payouts
- Payout amount = Payment amount - Platform fee - Stripe fee
- Payout schedule: Daily (as configured)

---

### Test 5: Error Handling

**Test Scenarios:**
1. **Payment Failure:**
   - Use declined test card: `4000 0000 0000 0002`
   - Verify error message displays
   - Verify request status remains unpaid

2. **Onboarding Incomplete:**
   - Start onboarding but don't complete
   - Return to TipJar
   - Verify banner still shows
   - Verify can resume onboarding

3. **Account Requirements:**
   - Check for any pending requirements
   - Verify requirements are displayed
   - Complete any missing requirements

**Expected Results:**
- ✅ Errors display clearly to user
- ✅ No crashes or 500 errors
- ✅ User can retry failed operations
- ✅ Requirements are clearly communicated

---

## 🔍 Monitoring During Testing

### Browser Console
Watch for:
- ❌ 500 errors
- ❌ Network failures
- ❌ JavaScript errors
- ⚠️ Warnings (non-critical)

### Stripe Dashboard
Monitor:
- Connect → Accounts (new accounts created)
- Payments (test payments processing)
- Events (webhook deliveries)
- Logs (API errors)

### Application Logs
Check:
- Server logs for API errors
- Database query errors
- Stripe API errors

---

## 📊 Success Criteria

### Must Have (Critical)
- ✅ Users can create Stripe Connect accounts
- ✅ Onboarding flow completes successfully
- ✅ Payments process correctly
- ✅ Platform fees are collected
- ✅ Payouts are created automatically
- ✅ No 500 errors

### Nice to Have (Important)
- ✅ Error messages are clear
- ✅ Loading states work properly
- ✅ Success messages display
- ✅ Email notifications work (if configured)

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot create connected accounts"
**Solution:** Platform verification not complete
- Check Stripe Dashboard → Connect → Accounts overview
- Complete any pending verification steps

### Issue: Payment fails with "account not ready"
**Solution:** Connected account onboarding incomplete
- Check `charges_enabled` and `payouts_enabled` status
- Complete any pending requirements

### Issue: Platform fee not calculated correctly
**Solution:** Check fee calculation logic
- Verify `PLATFORM_FEE_PERCENTAGE` and `PLATFORM_FEE_FIXED` constants
- Check `calculatePlatformFee()` function

### Issue: Webhook not receiving events
**Solution:** Verify webhook configuration
- Check webhook endpoint URL in Stripe Dashboard
- Verify webhook secret in environment variables
- Test webhook endpoint manually

---

## 📝 Testing Notes Template

```
Date: ___________
Tester: ___________
Environment: Production

Test Results:
- Onboarding: [ ] Pass [ ] Fail - Notes: ___________
- Payment: [ ] Pass [ ] Fail - Notes: ___________
- Payout: [ ] Pass [ ] Fail - Notes: ___________
- Errors: [ ] None [ ] Found - Details: ___________

Issues Found:
1. ___________
2. ___________

Next Steps:
___________
```

---

## 🚀 Post-Testing Actions

After successful testing:
1. ✅ Document any issues found
2. ✅ Fix critical bugs
3. ✅ Update documentation
4. ✅ Notify team of launch readiness
5. ✅ Monitor first few real transactions closely

---

## 📚 Reference Links

- [Stripe Connect Dashboard](https://dashboard.stripe.com/connect/accounts/overview)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [TipJar Production URL](https://www.tipjar.live)

---

**Ready to test!** 🎉

