# 🛒 Buyer Simulation Guide - 100% Off Test

This guide walks you through a complete buyer simulation using the TEST100 discount code (100% off).

## Prerequisites

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Create the test discount code:**
   ```bash
   node scripts/create-test-discount-code.js
   ```

## 🎯 Complete Buyer Journey Simulation

### Step 1: Submit Contact Form
1. Navigate to `http://localhost:3001`
2. Click "Get Quote" button
3. Fill out the contact form:
   - **Name:** Test Buyer
   - **Email:** test.buyer@example.com
   - **Phone:** (901) 555-1234
   - **Event Type:** Wedding
   - **Event Date:** Select a future date
   - **Location:** Memphis, TN
   - **Message:** "Testing 100% off discount code"
4. Submit the form
5. **Note the quote link** from the success message (e.g., `/quote/[id]`)

### Step 2: View Quote Page
1. Navigate to the quote link from Step 1
2. You should see:
   - Welcome message with lead's name
   - Package options
   - Add-ons section

### Step 3: Select a Package
1. Choose any package (e.g., Package 1, Package 2, or Package 3)
2. Optionally select some add-ons
3. Note the **Subtotal** amount

### Step 4: Apply Discount Code
1. Scroll to the discount code section (below package selection)
2. Enter code: **TEST100**
3. Click "Apply"
4. You should see:
   - ✅ "TEST100 Applied" message
   - "You saved $[amount]" message
   - Price breakdown showing:
     - Subtotal: $[original amount]
     - Discount (TEST100): -$[full amount]
     - **Total: $0.00**

### Step 5: Save Selection
1. Click "Save Selection" button
2. You should be redirected to `/quote/[id]/confirmation`
3. On the confirmation page, verify:
   - Total shows $0.00
   - Discount code is mentioned
   - Payment button shows $0.00

### Step 6: Make Payment (Free)
1. Click "Make Payment" button
2. You'll be redirected to Stripe Checkout
3. Since the amount is $0, Stripe may:
   - Show $0.00 and allow instant completion
   - Or require a payment method (use test card: 4242 4242 4242 4242)
4. Complete the payment flow
5. You'll be redirected to `/quote/[id]/thank-you`

### Step 7: Sign Contract
1. From confirmation page, click "Sign Contract"
2. Review the contract
3. Sign the contract
4. Submit

### Step 8: Complete Music Questionnaire
1. After payment, return to confirmation page
2. Click "Music Planning" button (should appear after payment)
3. Complete the questionnaire:
   - Big No songs
   - Special dances
   - Playlist links
   - Ceremony music details
4. Submit the questionnaire

## ✅ Verification Checklist

After completing the simulation, verify:

- [ ] Discount code TEST100 was applied successfully
- [ ] Total price shows $0.00
- [ ] Quote was saved with discount_code = "TEST100"
- [ ] Discount amount was recorded in quote_selections
- [ ] Payment processed (even if $0)
- [ ] Contract was signed
- [ ] Music questionnaire was completed
- [ ] All data saved correctly in database

## 🔍 Database Verification

Check the database to verify:

```sql
-- Check discount code usage
SELECT * FROM discount_code_usage 
WHERE discount_code_id = (
  SELECT id FROM discount_codes WHERE code = 'TEST100'
);

-- Check quote with discount
SELECT 
  lead_id,
  package_name,
  total_price,
  discount_code,
  discount_amount
FROM quote_selections
WHERE discount_code = 'TEST100'
ORDER BY created_at DESC
LIMIT 1;

-- Check payments
SELECT * FROM payments
WHERE contact_id = '[lead_id_from_above]'
ORDER BY created_at DESC;
```

## 🧹 Cleanup (Optional)

After testing, you can:

1. **Deactivate the code:**
   - Go to `/admin/discount-codes`
   - Find TEST100
   - Toggle it to "Inactive"

2. **Or delete test data:**
   ```sql
   -- Delete test discount code
   DELETE FROM discount_codes WHERE code = 'TEST100';
   
   -- Delete test quote selections (optional)
   DELETE FROM quote_selections WHERE discount_code = 'TEST100';
   ```

## 🎉 Success Criteria

The simulation is successful if:
- ✅ All steps complete without errors
- ✅ Discount code applies 100% discount correctly
- ✅ Total shows $0.00 throughout the flow
- ✅ All data is saved to database
- ✅ Payment flow works (even for $0)
- ✅ Contract signing works
- ✅ Questionnaire submission works

