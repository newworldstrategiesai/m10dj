# 🧪 Contract Flow Test Guide - Wedding Prospect

Complete step-by-step guide to test the contract flow from start to finish as a new wedding prospect.

## 📋 Prerequisites

- Dev server running on `http://localhost:3001`
- Admin access (logged in as admin user)
- Test email address (or use a real one for testing)

---

## 🎯 Test Flow Overview

1. **Submit Contact Form** as wedding prospect
2. **View Contact** in admin panel
3. **Generate Contract** from contact
4. **Send Contract** for signature
5. **Sign Contract** as client
6. **Verify** contract status

---

## ✅ Step 1: Submit Contact Form as Wedding Prospect

### Action:
1. Open `http://localhost:3001` in your browser
2. Scroll down to the contact form
3. Fill out the form with test data:

```
Name: Emily Williams
Email: emily.williams.test@example.com
Phone: (901) 555-1234
Event Type: Wedding
Event Date: August 15, 2025
Guests: 200
Venue: Memphis Botanic Garden
Message: Looking for a DJ for our wedding. Need someone who can play a mix of country, pop, and R&B. Need microphones for speeches.
```

4. Click "Send Message" or "Submit"

### Expected Result:
- ✅ Success message appears
- ✅ Form clears or shows confirmation
- ✅ No errors in browser console

### Verify:
- Check browser console for any errors
- Note the timestamp of submission

---

## ✅ Step 2: View Contact in Admin Panel

### Action:
1. Navigate to `http://localhost:3001/admin/contacts`
2. Find the contact you just created (search for "Emily Williams" or filter by "New" status)
3. Click on the contact to view details

### Expected Result:
- ✅ Contact appears in the list
- ✅ All information matches what you submitted
- ✅ Status is "New"
- ✅ Lead stage is "Initial Inquiry"
- ✅ Event type is "wedding"

### Verify:
- First name: Emily
- Last name: Williams
- Email: emily.williams.test@example.com
- Event date: August 15, 2025
- Venue: Memphis Botanic Garden
- Guest count: 200

---

## ✅ Step 3: Generate Contract from Contact

### Action:
1. Navigate to `http://localhost:3001/admin/contracts`
2. Click the **"Contracts"** tab (if not already selected)
3. Click the **"Generate Contract"** button
4. In the modal:
   - Select "Emily Williams" from the contact dropdown
   - (Optional) Select a template if you have custom templates
   - Click **"Generate"**

### Expected Result:
- ✅ Contract is created successfully
- ✅ Contract appears in the contracts list
- ✅ Contract number is generated (format: `CONT-YYYYMMDD-###`)
- ✅ Status badge shows "Draft" (gray)
- ✅ Contract shows event details, pricing, etc.

### Verify:
- Contract number is displayed
- Event name includes "Emily Williams" and "Wedding"
- Event date shows August 15, 2025
- Venue shows "Memphis Botanic Garden"
- Total amount is calculated (or shows $0 if no invoice)

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
5. Enter your full name: **"Emily Williams"**
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

## ✅ Step 6: Verify Contract Status

### Action:
1. Go back to the admin panel: `http://localhost:3001/admin/contracts`
2. Find the contract you just signed
3. Check the status badge

### Expected Result:
- ✅ Status badge shows **"Signed"** (green)
- ✅ Contract details show:
   - Signed date and time
   - Signer name: "Emily Williams"
   - Signature method (draw/type)
   - IP address (if logged)

### Verify:
- Status is "signed" (green badge)
- Click eye icon to preview - signature should be visible
- Contract shows as completed

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
- ✅ Status updates to "signed"
- ✅ All data persists correctly

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

### Signature Not Saving
- Check browser console for errors
- Verify signature data is captured
- Check API endpoint `/api/contracts/sign`
- Verify database connection

### Status Not Updating
- Refresh the admin page
- Check database directly
- Verify contract ID matches
- Check for API errors

---

## 📊 Test Checklist

Use this checklist to track your progress:

- [ ] Step 1: Contact form submitted
- [ ] Step 2: Contact visible in admin
- [ ] Step 3: Contract generated
- [ ] Step 4: Contract sent for signature
- [ ] Step 5: Contract signed successfully
- [ ] Step 6: Status verified as "signed"
- [ ] All data correct throughout flow
- [ ] No errors in console
- [ ] Emails sent (if configured)

---

## 🔄 Quick Test Script

For faster testing, you can also use the test page:

1. Navigate to `http://localhost:3001/test-contract-flow`
2. Click "Start End-to-End Test"
3. Follow the on-screen instructions

---

## 📝 Notes

- Use unique email addresses for each test to avoid conflicts
- Test both signature methods (draw and type)
- Test on mobile device if possible
- Check email delivery if email is configured
- Verify all smart fields are replaced in contract
- Test with different event types (not just wedding)

---

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Fix any bugs** found during testing
2. **Document any issues** for future reference
3. **Optimize** any slow steps
4. **Add automation** if desired (auto-generate contract after contact)
5. **Set up email** for production use
6. **Train team** on the contract flow

---

**Happy Testing! 🚀**

