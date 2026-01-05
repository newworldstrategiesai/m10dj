# 🧪 TipJar Live Production Testing - Session Notes

**Date**: ___________  
**Tester**: ___________  
**Environment**: Production (tipjar.live)

---

## Test 1: User Onboarding & Account Creation

### Steps:
1. [ ] Sign in as TipJar user: `memphismillennial@gmail.com`
2. [ ] Navigate to: `https://www.tipjar.live/admin/crowd-requests`
3. [ ] Verify "Stripe Connect Setup Required" banner appears
4. [ ] Click "Set up Stripe Connect" button
5. [ ] Verify setup component appears below banner
6. [ ] Click "Set Up Stripe Payments" button

### Results:
- [ ] Button scrolls to setup component smoothly
- [ ] Setup component loads without errors
- [ ] "Set Up Stripe Payments" button is clickable
- [ ] Redirects to Stripe onboarding page
- [ ] No 500 errors in console

### Issues Found:
- 

### Screenshots/Notes:
- 

---

## Test 2: Stripe Onboarding Flow

### Steps:
1. [ ] Complete Stripe Express account onboarding:
   - Business information
   - Identity verification
   - Bank account details
2. [ ] Return to TipJar after completion

### Results:
- [ ] Onboarding completes successfully
- [ ] Redirects back to TipJar
- [ ] Account status updates in database
- [ ] Banner disappears or shows success message
- [ ] Setup component shows "Payment Setup Complete"

### Stripe Dashboard Check:
- [ ] Go to: https://dashboard.stripe.com/connect/accounts
- [ ] Find new account
- [ ] Verify: `charges_enabled: true`
- [ ] Verify: `payouts_enabled: true`
- [ ] Verify: `details_submitted: true`

### Database Check:
- [ ] Organization has `stripe_connect_account_id`
- [ ] `stripe_connect_onboarding_complete: true`
- [ ] `stripe_connect_charges_enabled: true`
- [ ] `stripe_connect_payouts_enabled: true`

### Issues Found:
- 

---

## Test 3: Payment Processing

### Steps:
1. [ ] Create a test song request
2. [ ] Add payment amount (e.g., $10.00)
3. [ ] Click "Pay" or "Request Song"
4. [ ] Complete Stripe Checkout
5. [ ] Use test card: `4242 4242 4242 4242`

### Expected Fee Calculation:
- Payment: $10.00
- Platform fee: ($10.00 × 3.5%) + $0.30 = $0.65
- DJ receives: $10.00 - $0.65 = $9.35
- Stripe fee: ~$0.59 (charged to DJ's account)

### Results:
- [ ] Payment processes successfully
- [ ] Platform fee calculated correctly
- [ ] Payment routed to connected account
- [ ] Request marked as paid
- [ ] Success page displays

### Stripe Dashboard Check:
- [ ] Go to: https://dashboard.stripe.com/payments
- [ ] Find test payment
- [ ] Verify amount: $10.00
- [ ] Verify application fee: $0.65
- [ ] Verify transfer to connected account

### Issues Found:
- 

---

## Test 4: Webhook Verification

### Steps:
1. [ ] Check Stripe Dashboard → Webhooks → Recent deliveries
2. [ ] Verify `account.updated` event received (after onboarding)
3. [ ] Verify `payment_intent.succeeded` event received (after payment)

### Results:
- [ ] Webhook events are being received
- [ ] Events are processed successfully (200 status)
- [ ] Database updates from webhooks

### Issues Found:
- 

---

## Test 5: Error Handling

### Test Payment Failure:
- [ ] Use declined card: `4000 0000 0000 0002`
- [ ] Verify error message displays
- [ ] Verify request status remains unpaid

### Test Incomplete Onboarding:
- [ ] Start onboarding but don't complete
- [ ] Return to TipJar
- [ ] Verify banner still shows
- [ ] Verify can resume onboarding

### Issues Found:
- 

---

## Browser Console Check

### Errors Found:
- [ ] None
- [ ] Errors: (list below)
  - 

### Warnings Found:
- [ ] None
- [ ] Warnings: (list below)
  - 

---

## Overall Status

### Critical Issues:
- [ ] None
- [ ] Issues: (list below)
  - 

### Minor Issues:
- [ ] None
- [ ] Issues: (list below)
  - 

### Ready for Launch:
- [ ] Yes
- [ ] No - Blockers: (list below)
  - 

---

## Next Steps

1. 
2. 
3. 

---

## Additional Notes

