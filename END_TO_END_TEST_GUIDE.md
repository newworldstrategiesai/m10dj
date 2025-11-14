# 🧪 End-to-End Test Guide: Wedding Prospect to Payment

Complete manual test guide for testing the entire flow from wedding prospect submission to payment processing.

## 🎯 Test Flow Overview

1. **Submit Contact Form** as wedding prospect
2. **View Contact** in admin panel
3. **Generate Contract** from contact
4. **Send Contract** for signature
5. **Sign Contract** as client
6. **Create Invoice** from signed contract
7. **Send Payment Link** to client
8. **Process Payment** via Stripe
9. **Verify Payment** completion

---

## ✅ Step 1: Submit Contact Form as Wedding Prospect

### Action:
1. Open `http://localhost:3000` in your browser
2. Scroll down to find the contact form
3. Fill out the form with test data:

```
Name: Sarah Johnson
Email: sarah.johnson.test@example.com
Phone: (901) 555-9876
Event Type: Wedding
Event Date: September 20, 2025
Number of Guests: 150
Venue: The Peabody Memphis
Message: Looking for a professional DJ for our wedding. We need ceremony music, reception entertainment, and MC services. Our guests love country, pop, and R&B music.
```

4. Click "Send Message" or "Submit"

### Expected Result:
- ✅ Success message appears
- ✅ Form clears or shows confirmation
- ✅ No errors in browser console

### Verify:
- Check browser console (F12) for any errors
- Note the timestamp of submission

---

## ✅ Step 2: View Contact in Admin Panel

### Action:
1. Navigate to `http://localhost:3000/admin/contacts`
2. Sign in with admin credentials if prompted
3. Find the contact you just created (search for "Sarah Johnson" or filter by "New" status)
4. Click on the contact to view details

### Expected Result:
- ✅ Contact appears in the list
- ✅ All information matches what you submitted
- ✅ Status is "New" or "Initial Inquiry"
- ✅ Event type is "wedding"
- ✅ All fields are populated correctly

### Verify:
- First name: Sarah
- Last name: Johnson
- Email: sarah.johnson.test@example.com
- Event date: September 20, 2025
- Venue: The Peabody Memphis
- Guest count: 150

---

## ✅ Step 3: Generate Contract from Contact

### Action:
1. Navigate to `http://localhost:3000/admin/contracts`
2. Click the **"Contracts"** tab (if not already selected)
3. Click the **"Generate Contract"** button
4. In the modal:
   - Select "Sarah Johnson" from the contact dropdown
   - (Optional) Select a template if you have custom templates
   - Review contract details
   - Click **"Generate"**

### Expected Result:
- ✅ Contract is created successfully
- ✅ Contract appears in the contracts list
- ✅ Contract number is generated (format: `CONT-YYYYMMDD-###`)
- ✅ Status badge shows "Draft" (gray)
- ✅ Contract shows event details, pricing, etc.

### Verify:
- Contract number is displayed
- Event name includes "Sarah Johnson" and "Wedding"
- Event date shows September 20, 2025
- Venue shows "The Peabody Memphis"
- Total amount is calculated (or shows $0 if no invoice yet)

---

## ✅ Step 4: Send Contract for Signature

### Action:
1. In the contracts list, find the contract you just generated
2. Click the **eye icon (👁️)** to preview the contract
3. Review the contract content:
   - Check that all smart fields are replaced (no `{{variable}}` placeholders)
   - Verify client name, event details, pricing are correct
4. Close the preview
5. Click the **send icon (📤)** or "Send for Signature" button
6. Confirm the action

### Expected Result:
- ✅ Contract status changes to "Sent" (blue badge)
- ✅ Signing link is generated
- ✅ Email is sent to client (if email is configured)
- ✅ Signing token is created

### Verify:
- Status badge changes from "Draft" to "Sent"
- Copy icon (📋) appears next to the contract
- Click copy icon to get the signing URL (format: `/sign-contract/[token]`)

---

## ✅ Step 5: Sign Contract as Client

### Action:
1. Copy the signing link from the admin panel
2. Open the link in a **new incognito/private window** (to simulate client experience)
3. You should see the contract page with:
   - Contract preview at the top
   - Signature section below
4. Review the contract content
5. Enter your full name: **"Sarah Johnson"**
6. Choose signature method:
   - **Option A: Draw Signature**
     - Click and drag to draw your signature
     - Click "Clear" if you want to redraw
   - **Option B: Type Signature**
     - Select "Type Signature" tab
     - Type your name
     - Choose a cursive font (Dancing Script, Allura, etc.)
7. Check the box: **"I agree to the terms and conditions"**
8. Click **"Sign Contract"** button

### Expected Result:
- ✅ Signature is captured
- ✅ Success message appears
- ✅ Confirmation page shows
- ✅ Contract status updates to "Signed"
- ✅ Confirmation email sent (if email configured)

### Verify:
- Success message: "Contract signed successfully!"
- Contract number is displayed
- Date and time of signing is shown
- You can download a copy (if download button appears)

---

## ✅ Step 6: Create Invoice from Signed Contract

### Action:
1. Go back to the admin panel: `http://localhost:3000/admin/contracts`
2. Find the contract you just signed
3. Verify status shows **"Signed"** (green badge)
4. Look for an **"Create Invoice"** or **"Generate Invoice"** button
   - This may be in the contract details view
   - Or in a separate invoices section
5. Click to create invoice
6. Fill in invoice details:
   - Amount: $1,245 (or appropriate amount)
   - Description: "Wedding DJ Services - September 20, 2025"
   - Line items:
     - Professional DJ & MC Services: $1,245
   - Due date: Set to 30 days from today
7. Click **"Create Invoice"** or **"Generate"**

### Expected Result:
- ✅ Invoice is created successfully
- ✅ Invoice number is generated
- ✅ Invoice is linked to the contract
- ✅ Invoice status shows "Pending" or "Unpaid"
- ✅ Invoice appears in invoices list

### Verify:
- Invoice number is displayed
- Total amount matches contract amount
- Client information is correct
- Invoice is linked to the contract

---

## ✅ Step 7: Send Payment Link to Client

### Action:
1. Navigate to the invoice you just created
2. Look for **"Send Payment Link"** or **"Email Invoice"** button
3. Click to send payment link
4. Confirm email address: `sarah.johnson.test@example.com`
5. Click **"Send"**

### Expected Result:
- ✅ Payment link is generated
- ✅ Email is sent to client (if email configured)
- ✅ Payment link URL is displayed
- ✅ Invoice status may update to "Sent"

### Verify:
- Payment link URL is shown (format: `/invoice/[token]` or `/pay/[invoice-id]`)
- Copy the payment link for testing
- Check email inbox if email is configured

---

## ✅ Step 8: Process Payment via Stripe

### Action:
1. Open the payment link in a **new incognito/private window** (to simulate client)
2. You should see:
   - Invoice details
   - Total amount
   - Payment form or "Pay Now" button
3. Click **"Pay Now"** or payment button
4. You'll be redirected to Stripe Checkout (test mode)
5. Fill in test payment details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/25`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `38117`)
6. Click **"Pay"** or **"Complete Payment"**

### Expected Result:
- ✅ Payment processes successfully
- ✅ Redirect to success page
- ✅ Success message appears
- ✅ Payment confirmation is shown

### Verify:
- Success message: "Payment successful!" or similar
- Invoice number is displayed
- Payment amount is shown
- Transaction ID or receipt number is displayed

---

## ✅ Step 9: Verify Payment Completion

### Action:
1. Go back to admin panel: `http://localhost:3000/admin/contracts` or invoices section
2. Find the invoice you just paid
3. Check the status

### Expected Result:
- ✅ Invoice status shows **"Paid"** (green badge)
- ✅ Payment date is recorded
- ✅ Payment method is shown
- ✅ Transaction ID is stored
- ✅ Contract status may update to "Paid" or "Completed"

### Verify:
- Status is "Paid"
- Payment date matches today
- Amount matches invoice total
- Transaction details are visible
- Contract shows as completed/paid

---

## 🎉 Success Criteria

All steps completed successfully if:

- ✅ Contact form submission works
- ✅ Contact appears in admin panel
- ✅ Contract generates with correct data
- ✅ Contract sends for signature
- ✅ Signing link works
- ✅ Signature can be drawn or typed
- ✅ Contract signs successfully
- ✅ Invoice creates from contract
- ✅ Payment link generates
- ✅ Stripe checkout works
- ✅ Payment processes successfully
- ✅ Invoice status updates to "Paid"
- ✅ All data persists correctly
- ✅ No errors in console

---

## 🐛 Troubleshooting

### Contact Form Not Submitting
- Check browser console for errors
- Verify `/api/contact` endpoint is working
- Check Supabase connection
- Verify environment variables

### Contract Not Generating
- Check that contact exists in database
- Verify contract templates exist
- Check browser console for API errors
- Verify admin authentication

### Signing Link Not Working
- Check that token is valid (not expired)
- Verify contract status is "sent" not "draft"
- Check token format in URL
- Verify contract exists in database

### Invoice Not Creating
- Check that contract is signed
- Verify invoice creation API endpoint
- Check browser console for errors
- Verify admin permissions

### Payment Not Processing
- Verify Stripe test mode keys are set
- Check Stripe webhook configuration
- Verify payment intent creation
- Check browser console for Stripe errors

### Payment Status Not Updating
- Check Stripe webhook is receiving events
- Verify webhook secret is correct
- Check database for payment updates
- Refresh admin page

---

## 📊 Test Checklist

Use this checklist to track your progress:

- [ ] Step 1: Contact form submitted
- [ ] Step 2: Contact visible in admin
- [ ] Step 3: Contract generated
- [ ] Step 4: Contract sent for signature
- [ ] Step 5: Contract signed successfully
- [ ] Step 6: Invoice created from contract
- [ ] Step 7: Payment link sent/generated
- [ ] Step 8: Payment processed via Stripe
- [ ] Step 9: Payment verified in admin
- [ ] All data correct throughout flow
- [ ] No errors in console
- [ ] Emails sent (if configured)
- [ ] Webhooks processed (if configured)

---

## 🔄 Quick Test Notes

- Use unique email addresses for each test to avoid conflicts
- Test both signature methods (draw and type)
- Test on mobile device if possible
- Check email delivery if email is configured
- Verify all smart fields are replaced in contract
- Test with different event types (not just wedding)
- Use Stripe test mode cards for payments
- Verify webhook events in Stripe dashboard

---

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Fix any bugs** found during testing
2. **Document any issues** for future reference
3. **Optimize** any slow steps
4. **Add automation** if desired (auto-generate invoice after signing)
5. **Set up email** for production use
6. **Configure webhooks** for production
7. **Train team** on the complete flow

---

**Happy Testing! 🚀**

