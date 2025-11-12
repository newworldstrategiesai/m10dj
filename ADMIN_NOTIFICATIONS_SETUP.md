# Admin Notifications - Quick Setup

## ⚡ 5-Minute Setup

### Step 1: Configure Primary Admin Email (Required)

In your `.env.local` or Vercel dashboard:

```env
ADMIN_EMAIL=m10djcompany@gmail.com
```

That's it! Email notifications will now work.

---

### Step 2: Add Backup Email (Recommended)

```env
BACKUP_ADMIN_EMAIL=ben@m10djcompany.com
```

Both emails will receive notifications.

---

### Step 3: Setup SMS (Optional but Recommended)

Add your phone number to receive text alerts:

```env
ADMIN_PHONE=+19015551234
```

**Format:** Must be E.164 format
- `+1` = country code (USA)
- `901` = area code
- `5551234` = phone number

**Example valid formats:**
```
+19015551234
+1 (901) 555-1234
+1-901-555-1234
```

---

## ✅ Testing

### Test Email Notifications

1. Go to service selection form
2. Fill out and submit
3. Check email for:
   - Subject: `🎯 New Service Selection: [Name] - [Event Type]`
   - Contains lead details
   - Has action buttons
   - Shows pricing

### Test SMS Notifications

1. (Same as above)
2. Check phone for:
   - Text starting with `🎯 NEW BOOKING LEAD!`
   - Contains summary
   - Has admin panel link

---

## 🎯 What You'll Receive

### Email Contains:
- ✅ Customer name and contact info
- ✅ Event type and date
- ✅ Venue and guest count
- ✅ Package selected
- ✅ Add-ons purchased
- ✅ Total price
- ✅ Timeline details
- ✅ Action buttons to view details

### SMS Contains:
- ✅ Customer name
- ✅ Event type and date
- ✅ Package name
- ✅ Total price
- ✅ Link to admin panel

---

## 🔧 Environment Variables Cheat Sheet

```env
# EMAIL NOTIFICATIONS (Required)
ADMIN_EMAIL=m10djcompany@gmail.com

# Backup emails (Optional)
BACKUP_ADMIN_EMAIL=ben@m10djcompany.com
EMERGENCY_CONTACT_EMAIL=djbenmurray@gmail.com

# SMS NOTIFICATIONS (Optional)
ADMIN_PHONE=+19015551234

# Already configured (no changes needed)
RESEND_API_KEY=re_xxxxx
TWILIO_ACCOUNT_SID=AC_xxxxx
TWILIO_AUTH_TOKEN=auth_token_xxxxx
TWILIO_PHONE_NUMBER=+19014102020
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
```

---

## 📍 Where to Add Variables

### Local Development (`.env.local`)
```
ADMIN_EMAIL=m10djcompany@gmail.com
BACKUP_ADMIN_EMAIL=ben@m10djcompany.com
ADMIN_PHONE=+19015551234
```

### Production (Vercel Dashboard)
1. Go to: Project Settings → Environment Variables
2. Add each variable:
   - Name: `ADMIN_EMAIL`
   - Value: `m10djcompany@gmail.com`
   - Environments: Production
3. Click "Add"
4. Repeat for each variable
5. Redeploy project

---

## 🎯 Timeline After Customer Submits

```
0 seconds   → Customer clicks submit
1 second    → Invoice created
2 seconds   → Contract generated
3 seconds   → Customer email sent
5 seconds   → Customer SMS sent (if phone)
10 seconds  → Admin email sent
15 seconds  → Admin SMS sent (if configured)
60 seconds  → Everything complete
```

---

## ❌ Troubleshooting

### Issue: Not receiving admin email

**Check:**
1. Is `ADMIN_EMAIL` set in environment variables?
2. Is the email address correct?
3. Check spam/promotions folder
4. Submit test form and wait 60 seconds

**Solution:**
1. Verify email address is correct
2. Add to contacts/safe senders
3. Check Resend dashboard for delivery status

### Issue: Not receiving admin SMS

**Check:**
1. Is `ADMIN_PHONE` configured?
2. Is it in correct format? (`+19015551234`)
3. Are Twilio credentials correct?
4. Is Twilio account active?

**Solution:**
1. Verify phone number format
2. Test Twilio credentials
3. Submit test form and wait 30 seconds
4. Check Twilio dashboard

### Issue: Received email but info is wrong

**Check:**
1. Did customer fill form completely?
2. Are selections saved correctly?
3. Is database updated?

**Solution:**
1. Ask customer to re-submit
2. Check admin panel for correct data
3. Verify form validation

---

## 📊 What Happens

### When Customer Submits

```
Customer Form Submission
    ↓
System Validates & Processes
    ↓
Creates Invoice & Contract
    ↓
Generates Document Link
    ↓
Sends Email to Customer
    ├─ Branded confirmation email
    ├─ Document link
    └─ Next steps
    ↓
Sends SMS to Customer (if phone)
    ├─ Quick confirmation
    ├─ Document link
    └─ Company phone
    ↓
Sends Email to Admin
    ├─ Lead details
    ├─ Event info
    ├─ Service selection
    ├─ Pricing
    └─ Action buttons
    ↓
Sends SMS to Admin (if configured)
    ├─ Quick summary
    ├─ Admin panel link
    └─ Booking info
    ↓
Shows Success Screen to Customer
```

---

## 🚀 Deployment Steps

### 1. Add Environment Variables
```
ADMIN_EMAIL=m10djcompany@gmail.com
ADMIN_PHONE=+19015551234 (optional)
```

### 2. Deploy to Production
```bash
git push origin main
# Vercel auto-deploys on main branch
```

### 3. Test
- Submit service selection form
- Check email inbox
- Check text messages
- Verify all info is correct

### 4. Monitor
- Check new leads arrive
- Verify email delivery
- Monitor response times

---

## 🎉 You're Done!

Admin notifications are now active!

When customers submit service selections:
- ✅ You get an email with all details
- ✅ You get a text summary (if configured)
- ✅ Both include links to review details
- ✅ Never miss a booking lead again!

---

## 📞 Need Help?

**See Full Documentation:**
- `ADMIN_NOTIFICATIONS_GUIDE.md` - Complete guide with all details
- `UNIFIED_DOCUMENTS_GUIDE.md` - Customer document system
- Server logs - Check for error messages

**Contact:**
- Email: djbenmurray@gmail.com
- Phone: (901) 410-2020

---

**Deployment:** Commit `f219e9e`  
**Status:** ✅ Ready to Use


