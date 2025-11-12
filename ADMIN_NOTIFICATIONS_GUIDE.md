# Admin Notifications for Service Selections

## 🎯 Overview

When a customer completes and submits their service selection, the admin automatically receives notifications via **email** and **SMS** to stay informed of new booking leads.

---

## 📧 Admin Email Notification

### What Gets Sent

A professional branded email with:
- ✅ Lead details (name, email, phone)
- ✅ Event information (type, date, venue, guests)
- ✅ Service selection (package, add-ons)
- ✅ Timeline details (ceremony, cocktail, reception, etc.)
- ✅ Pricing total
- ✅ Next steps checklist
- ✅ Action buttons (View in Admin Panel, View Documents)
- ✅ Urgency messaging ("Respond within 24 hours")

### Email Content Sections

```
┌─────────────────────────────────────────┐
│ 🎯 New Service Selection Received!      │
│ (Branded header with M10 DJ logo)       │
├─────────────────────────────────────────┤
│ 📊 Lead Details                         │
│ • Name: John Smith                      │
│ • Email: john@email.com                 │
│ • Phone: (901) 555-1234                 │
│                                          │
│ 🎉 Event Information                    │
│ • Type: Wedding                         │
│ • Date: December 15, 2024               │
│ • Venue: Grand Ballroom                 │
│ • Guests: 150                           │
│                                          │
│ 💰 Service Selection                    │
│ • Package: Package 2 - $2,500           │
│ • Add-ons: Monogram ($350), Clouds ($500)
│ • Total: $3,350                         │
│                                          │
│ ⏰ Timeline                              │
│ ✓ Ceremony Music                        │
│ ✓ Reception                             │
│                                          │
│ 📋 Next Steps                           │
│ 1. Review the customer's selections    │
│ 2. Prepare a detailed custom quote     │
│ 3. Review and sign the contract        │
│ 4. Send follow-up email                │
│ 5. Confirm booking and collect deposit │
│                                          │
│ ⏱️ RESPOND WITHIN 24 HOURS              │
│                                          │
│ [👁️ View in Admin Panel]                │
│ [📄 View Documents]                     │
└─────────────────────────────────────────┘
```

### Subject Line
```
🎯 New Service Selection: [First Name] [Last Name] - [Event Type]

Example:
🎯 New Service Selection: John Smith - Wedding
```

### Recipients

The email is sent to multiple addresses for redundancy:

1. **Primary Admin Email**
   - Environment variable: `ADMIN_EMAIL`
   - Default: `m10djcompany@gmail.com`

2. **Backup Admin Email** (optional)
   - Environment variable: `BACKUP_ADMIN_EMAIL`
   - Example: `ben@m10djcompany.com`

3. **Emergency Contact Email** (optional)
   - Environment variable: `EMERGENCY_CONTACT_EMAIL`
   - Example: `djbenmurray@gmail.com`

---

## 📱 Admin SMS Notification

### What Gets Sent

A concise text message with:
- 🎯 Lead name
- 🎉 Event type and date
- 💰 Package selected
- 💵 Total price
- 🔗 Link to admin panel

### Message Format

```
🎯 NEW BOOKING LEAD! [First Name] [Last Name] selected [Event Type] 
for [Event Date]. Package: [Package]. Total: $[Amount]. 
Review: [Admin Panel Link]
```

### Example SMS

```
🎯 NEW BOOKING LEAD! John Smith selected Wedding for December 15, 2024. 
Package: Package 2. Total: $3,350. 
Review: https://m10dj.com/admin/contacts/550e8400-e29b-41d4-a716-446655440000
```

### Recipients

The SMS is sent to the admin phone number:
- Environment variable: `ADMIN_PHONE`
- Example: `(901) 410-2020`
- Format: Must be valid Twilio format (E.164)

---

## 🔧 Configuration

### Required Environment Variables

#### For Email Notifications
```env
# Resend email service (already configured)
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com

# Admin email addresses
ADMIN_EMAIL=m10djcompany@gmail.com

# Optional backup addresses
BACKUP_ADMIN_EMAIL=ben@m10djcompany.com
EMERGENCY_CONTACT_EMAIL=djbenmurray@gmail.com
```

#### For SMS Notifications
```env
# Twilio SMS service (optional but recommended)
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=auth_token_xxxxx
TWILIO_PHONE_NUMBER=+19014102020

# Admin phone to receive SMS
ADMIN_PHONE=+19015551234
```

### Setting Environment Variables

1. **In `.env.local`** (local development)
   ```env
   ADMIN_EMAIL=m10djcompany@gmail.com
   BACKUP_ADMIN_EMAIL=ben@m10djcompany.com
   ADMIN_PHONE=+19015551234
   ```

2. **In Vercel** (production)
   - Go to: Settings → Environment Variables
   - Add each variable and value
   - Redeploy after changes

3. **In Docker/Server**
   - Add to `.env` file
   - Source before running application

---

## 🔄 Workflow

### Step 1: Customer Submits Selection
```
Customer fills form → Clicks "Submit" → System processes
```

### Step 2: System Generates Documents
```
Invoice created → Contract created → Document link generated
```

### Step 3: Customer Notified
```
Email sent to customer → SMS sent to customer (if phone)
```

### Step 4: Admin Notified
```
Email sent to all admin addresses → SMS sent to admin phone
```

### Step 5: Admin Takes Action
```
Receives email/SMS → Clicks link → Views admin panel → Reviews details
```

---

## ⚙️ Technical Details

### Email Implementation

**File:** `/pages/api/service-selection/submit.js`

```javascript
// Admin emails are sent after customer notifications
const adminEmails = [
  process.env.ADMIN_EMAIL || 'm10djcompany@gmail.com',
  ...(process.env.BACKUP_ADMIN_EMAIL ? [process.env.BACKUP_ADMIN_EMAIL] : []),
  ...(process.env.EMERGENCY_CONTACT_EMAIL ? [process.env.EMERGENCY_CONTACT_EMAIL] : [])
].filter(Boolean);

// Send via Resend
await fetch(`${siteUrl}/api/email/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: adminEmails,
    subject: `🎯 New Service Selection: ...`,
    body: adminEmailHtml,
    contactId: contact.id
  })
});
```

### SMS Implementation

**File:** `/pages/api/service-selection/submit.js`

```javascript
// Admin SMS is sent after emails
if (process.env.ADMIN_PHONE && process.env.TWILIO_ACCOUNT_SID) {
  const twilio = require('twilio');
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  
  const adminSmsMessage = `🎯 NEW BOOKING LEAD! ...`;
  
  await client.messages.create({
    body: adminSmsMessage,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.ADMIN_PHONE
  });
}
```

### Error Handling

- ✅ Email failures don't block SMS
- ✅ SMS failures don't block customer experience
- ✅ All errors logged to console
- ✅ Customer transaction completes regardless

---

## 📊 What Information Is Included

### Lead Information
| Field | Source | Example |
|-------|--------|---------|
| Name | Contact record | John Smith |
| Email | Contact record | john@email.com |
| Phone | Contact record | (901) 555-1234 |

### Event Details
| Field | Source | Example |
|-------|--------|---------|
| Event Type | Selection form | Wedding |
| Event Date | Selection form | December 15, 2024 |
| Venue | Selection form | Grand Ballroom |
| Guest Count | Selection form | 150 |

### Service Details
| Field | Source | Example |
|-------|--------|---------|
| Package | Selection form | Package 2 |
| Add-ons | Selection form | Monogram, Cloud Effects |
| Total Price | Invoice | $3,350.00 |

### Timeline
| Field | Source | Example |
|-------|--------|---------|
| Ceremony Music | Selection form | Yes ✓ |
| Cocktail Hour | Selection form | Yes ✓ |
| Reception | Selection form | Yes ✓ |
| After Party | Selection form | No |

---

## 📞 Action Items in Email

### Button 1: View in Admin Panel
- **Text:** 👁️ View in Admin Panel
- **Link:** `/admin/contacts/[contact_id]`
- **Function:** Takes admin directly to contact details
- **Color:** Gold (brand color)

### Button 2: View Documents
- **Text:** 📄 View Documents
- **Link:** `/api/documents/[invoice_id]`
- **Function:** Shows invoice and contract
- **Color:** Blue

---

## 🎯 Key Features

### ✅ Multiple Recipients
- Primary admin email
- Backup admin email (if configured)
- Emergency contact email (if configured)
- Admin phone SMS (if configured)

### ✅ Professional Formatting
- Branded M10 DJ logo
- Gold gradient header
- Organized sections
- Clear hierarchy
- Action buttons

### ✅ Complete Information
- All customer details
- Event information
- Service selections
- Pricing breakdown
- Timeline
- Next steps

### ✅ Urgency Messaging
- "RESPOND WITHIN 24 HOURS" banner
- New Booking Lead emoji (🎯)
- Yellow urgency box
- Motivational messaging

### ✅ Reliable Delivery
- Multiple email addresses
- Non-blocking SMS
- Error logging
- Fallback options

---

## 🔍 Monitoring & Debugging

### Check Notifications Were Sent

**Look at Server Logs:**
```
✅ Admin email sent to m10djcompany@gmail.com, ben@m10djcompany.com
✅ Admin SMS sent to +19015551234
```

**Check Email Inbox:**
- Subject: `🎯 New Service Selection: John Smith - Wedding`
- From: `M10 DJ Company <hello@m10djcompany.com>`
- Contains action buttons

**Check SMS:**
- Received on admin phone
- Contains booking summary
- Includes admin panel link

### Troubleshooting

| Issue | Solution |
|-------|----------|
| No email received | Check `ADMIN_EMAIL` environment variable |
| Email to wrong address | Verify `ADMIN_EMAIL` is correct |
| Email not branded | Check logo URL and styling |
| No SMS received | Check `ADMIN_PHONE` is configured and valid |
| SMS not received | Verify `TWILIO_` credentials are correct |
| Incomplete information | Check customer form was filled completely |

---

## 📈 Expected Timeline

| Event | Timing |
|-------|--------|
| Customer submits | Time 0 |
| Documents generated | ~1 second |
| Customer email sent | ~60 seconds |
| Customer SMS sent | ~30 seconds |
| Admin email sent | ~60 seconds |
| Admin SMS sent | ~30 seconds |
| **Total time to admin notification** | **~90 seconds** |

---

## 🎯 Best Practices

### For Admin Email Setup

1. **Primary Email**
   - Use: A monitored, active account
   - Avoid: Auto-reply enabled
   - Best: Business email with notifications

2. **Backup Emails**
   - Setup: At least one backup
   - Purpose: Redundancy for important leads
   - Benefit: Never miss a booking

3. **Emergency Contact**
   - Purpose: Critical business continuity
   - Use case: If primary and backup fail
   - Contact: Owner's personal email

### For Admin SMS Setup

1. **Phone Number Format**
   - Must be: E.164 format
   - Example: `+19015551234`
   - Verify: Test before production

2. **Notification Settings**
   - Enable: SMS notifications on phone
   - Add: To VIP contacts for urgent alerts
   - Test: Send test message first

---

## 🔐 Privacy & Security

### What's Shared
- ✅ Customer name and contact info
- ✅ Event details
- ✅ Service selections
- ✅ Pricing

### What's Protected
- ✅ Customer passwords
- ✅ Payment information
- ✅ Internal company data
- ✅ Other customer information

### Data in Transit
- ✅ HTTPS encryption (email links)
- ✅ SMS via Twilio (secure)
- ✅ No unencrypted data sent

---

## 📱 SMS Character Limits

### Current SMS Message
```
🎯 NEW BOOKING LEAD! [Name] selected [Type] for [Date]. 
Package: [Package]. Total: $[Amount]. Review: [LINK]
```

### Character Count
- Typical: ~155-160 characters
- Fits in: 1 SMS (160 char limit)
- Rarely: 2 SMS if long names/details

---

## 💡 Future Enhancements

Potential improvements:
- Webhook integration for custom systems
- Slack/Discord notifications
- Admin dashboard real-time alerts
- Customizable email templates
- Notification preferences UI
- Auto-response templates
- Lead scoring

---

## 🚀 Deployment

### Before Going Live

- [ ] Set `ADMIN_EMAIL` environment variable
- [ ] Set `ADMIN_PHONE` (optional for SMS)
- [ ] Test email delivery
- [ ] Test SMS delivery (if enabled)
- [ ] Verify contact details appear
- [ ] Check links work in email

### After Deployment

- [ ] Submit test form
- [ ] Verify admin email received
- [ ] Verify admin SMS received (if applicable)
- [ ] Click links to verify they work
- [ ] Check admin panel shows new lead
- [ ] Confirm urgency messaging appears

---

## 📞 Support

### For Issues

1. Check environment variables are set
2. Verify Resend/Twilio credentials
3. Check server logs for errors
4. Test with demo form
5. Contact support if persists

### For Questions

- Email: djbenmurray@gmail.com
- Phone: (901) 410-2020
- Website: m10djcompany.com

---

**Status:** ✅ Live in Production  
**Deployment Commit:** `7c8920d`  
**Last Updated:** Today


