# Unified Documents System - Invoice & Contract Together

## 🎯 Overview

When a customer completes the service selection form, they now receive:

1. **Professional Documents Page** - Invoice and contract displayed together
2. **Branded Confirmation Email** - With direct link to view documents
3. **SMS Notification** - Quick link sent via text message
4. **Success Screen Link** - "View Full Documents" button on thank you page

---

## 📄 Documents Page Features

### What's Included
- **Invoice Section**
  - Company information with branding
  - Invoice number and dates
  - Line-by-line service breakdown
  - Subtotal, tax, and total pricing
  - Event details (type, date, venue, guest count)
  - Print button for physical copy

- **Contract Section**
  - Contract summary with key terms
  - Deposit required amount and percentage
  - Signing link and expiration date
  - Event details and venue information
  - "Next Steps" instructions
  - Blue call-to-action button to sign

### User Experience
- ✅ Professional, branded appearance with gold accent color
- ✅ Mobile-responsive design
- ✅ Print-friendly (hides buttons when printing)
- ✅ Quick navigation buttons (Invoice, Contract, Back)
- ✅ Status badges (DRAFT, SIGNED)
- ✅ Clear next steps guidance

---

## 📧 Confirmation Email

### What Gets Sent
When a customer submits their service selections:

1. **Branded Header**
   - M10 DJ Company logo
   - Gold gradient background
   - Personal greeting

2. **Main Content**
   - Confirmation of selections received
   - Highlighted "View Invoice & Contract" button
   - Summary of what they selected
   - Next steps (review, sign, deposit, confirm)
   - Contact information

3. **Styling**
   - Professional formatting
   - Logo at the top
   - Clear hierarchy with section dividers
   - Color-coded boxes for important info

### Subject Line
`✅ Your M10 DJ Service Selection Received - Documents Ready!`

---

## 📱 SMS Notification

### What Gets Sent
A text message to the customer's phone with:
- Confirmation of selection received
- Direct link to view documents
- Company phone number for questions

### Example Message
```
Hi [FirstName]! We received your service selections for your [EventType]. 
📋 View your invoice & contract: [LINK] 
- M10 DJ Company (901) 410-2020
```

### Requirements
- Customer has phone number in contact record
- Twilio is configured (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`)

---

## 🔗 Document Links

### Where Links Appear

1. **Service Selection Success Screen**
   - Green button below invoice: "View Full Documents (Invoice & Contract)"
   - Opens in new tab

2. **Confirmation Email**
   - Gold button in "Your Documents" section
   - Clickable text link

3. **SMS Message**
   - Direct URL included in text

### Link Format
```
https://m10djcompany.com/api/documents/[INVOICE_ID]
```

### Public Access
- ✅ No authentication required
- ✅ Links are secure (unique invoice IDs)
- ✅ Customers can share with event planning team
- ✅ Direct link works for 30 days (contract expiration)

---

## 🔄 Workflow

### Step 1: Customer Submits Service Selections
```
Customer fills form → Clicks "Submit Selections & Get Quote"
```

### Step 2: System Processes
```
Invoice generated → Contract generated → Documents created
```

### Step 3: Notifications Sent
```
Email sent with document link → SMS sent with document link (if phone exists)
```

### Step 4: Success Screen Shown
```
Thank you screen displays → Shows "View Full Documents" button
```

### Step 5: Customer Action
```
Customer clicks button or uses email/SMS link → Views documents
→ Can sign contract → Can share with others
```

---

## 📊 What the Invoice Shows

| Section | Details |
|---------|---------|
| Company Info | Name, address, phone, email |
| Invoice Details | Invoice #, dates, status |
| Bill To | Customer name, email, phone |
| Event Details | Type, date, venue, guest count |
| Line Items | Each service/package with pricing |
| Totals | Subtotal, tax, total due |
| Notes | Any special instructions |

### Line Items Example
```
DJ/MC Services (4 hours)         Qty: 1    $2,500.00
Ceremony Audio & Music           Qty: 1    $350.00
Monogram Projection              Qty: 1    $350.00
─────────────────────────────────────────
Subtotal:                                  $3,200.00
Tax:                                       $0.00
─────────────────────────────────────────
TOTAL DUE:                                 $3,200.00
```

---

## 🔐 Security & Permissions

### Who Can View
- ✅ The customer (via email/SMS link)
- ✅ Anyone with the invoice ID link
- ❌ No admin login required
- ❌ No authentication needed

### Data Protection
- Invoice data stored in Supabase (encrypted)
- Links use unique, non-sequential IDs
- HTTPS encryption for transmission
- No personal data exposed in URL

### Link Validity
- ✅ Valid indefinitely
- ✅ Works even after contract expires
- ✅ Can be shared with event coordinator
- ✅ Can be printed

---

## 🖨️ Printing

### Print Features
- Print button on document page
- Professional formatting for PDF output
- Hides navigation buttons
- Full page layout
- Logo and branding included

### How to Print
1. Click the "🖨️ Print All" button
2. Choose printer or "Print to PDF"
3. Save as PDF or send to printer

---

## ✍️ Contract Signing

### From Documents Page
1. View documents page
2. Scroll to "Service Agreement & Contract" section
3. Click "🔗 View & Sign Contract" button
4. Opens contract signing interface
5. Review and electronically sign

### Link Format
```
https://m10djcompany.com/sign-contract/[SIGNING_TOKEN]
```

### Expiration
- Contract links valid for 30 days
- Expiration date shown in documents
- After expiration, customer can still view but can't sign

---

## 📧 Email Customization

Current email includes:
- Logo image
- Branded colors (gold gradient)
- Professional layout
- Clear call-to-action
- Next steps instructions
- Contact information

### Customizable Fields
Located in `/pages/api/service-selection/submit.js`:
- Email subject
- Company contact details
- Logo URL
- Colors and styling
- Next steps text

---

## 🐛 Troubleshooting

### Issue: Document link not working
**Solutions:**
1. Check if invoice was created successfully
2. Verify `NEXT_PUBLIC_SITE_URL` environment variable
3. Check invoice ID is valid
4. Try link in different browser

### Issue: Email not sent
**Solutions:**
1. Check `RESEND_API_KEY` is configured
2. Verify `NEXT_PUBLIC_SITE_URL` is set
3. Check customer email address is correct
4. Look for errors in server logs

### Issue: SMS not sent
**Solutions:**
1. Check Twilio credentials configured
2. Verify customer has phone number
3. Check phone number is valid format
4. Verify `TWILIO_PHONE_NUMBER` is set

### Issue: Contract link expired
**Solutions:**
1. Generate new contract from service selection
2. Admin can regenerate from contact page
3. Link expires after 30 days

---

## 📈 Monitoring

### Check Email Sent
- Admin panel → Communications
- Look for confirmation email in sent logs
- Verify timestamp and recipient

### Check SMS Sent
- Twilio dashboard
- Look for recent messages
- Verify delivery status

### Check Document Views
- In server logs, look for requests to `/api/documents/[id]`
- Check access logs for viewing activity

---

## 🚀 Deployment Checklist

Before going live, ensure:

- [ ] Logo image uploaded to `/public/M10-Gold-Logo.png`
- [ ] `NEXT_PUBLIC_SITE_URL` environment variable set
- [ ] `RESEND_API_KEY` configured (for email)
- [ ] Twilio credentials set (optional, for SMS):
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
- [ ] Invoice and contract tables exist in Supabase
- [ ] Service selection endpoint deployed
- [ ] Test with demo link first

---

## 🧪 Testing

### Test Flow
1. Submit service selection form
2. Check success screen for document link
3. Check email inbox for confirmation
4. Check text inbox for SMS (if phone provided)
5. Click all links to verify they work
6. Try viewing documents
7. Try signing contract
8. Print documents and verify formatting

### Test Data
- Event Type: Wedding
- Guest Count: 150
- Venue: Local venue
- Date: Future date
- Phone: Your mobile number

---

## 📞 Support & Questions

If customers have questions:
- Call: (901) 410-2020
- Email: djbenmurray@gmail.com
- Website: m10djcompany.com

---

## 🎯 Key Metrics

Track these to monitor system health:

- **Email delivery rate**: Should be >99%
- **SMS delivery rate**: Should be >98%
- **Document view rate**: % of customers who click link
- **Contract sign rate**: % of customers who sign
- **Average time to sign**: Days from email to signature

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| Nov 2024 | 1.0 | Initial unified documents release |

---

## 🔄 Future Enhancements

Potential additions:
- Deposit payment link in email
- Automated follow-up if not signed in 5 days
- Document sharing via QR code
- Invoice PDF download
- Contract modification options
- Signed document archive

---

**Status:** ✅ Live in Production  
**Last Updated:** Today  
**Deployment:** Commit `36ca284`


