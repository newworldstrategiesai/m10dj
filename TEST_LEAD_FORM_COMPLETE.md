# 🧪 Complete Lead Form Test

**Purpose:** Test the entire lead capture workflow end-to-end  
**What We'll Verify:** Form submission → Database → Emails → SMS → Service Selection

---

## Step 1: Start Your Dev Server

```bash
cd /Users/benmurray/m10dj
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

## Step 2: Test via Form (RECOMMENDED)

### Option A: Use Your Live Website
1. Go to: https://m10djcompany.com
2. Scroll to contact form
3. Fill out with test data:
   ```
   Name: Sarah Johnson
   Email: m10djcompany@gmail.com
   Phone: 901-555-9876
   Event Type: Wedding
   Event Date: 9/12/2026
   Location: The Peabody Hotel, Memphis
   Message: Looking for DJ and lighting for 150 guests
   ```
4. Click "Get My Free Quote"

### Option B: Use Localhost
1. Go to: http://localhost:3000
2. Same steps as Option A

---

## Step 3: What Should Happen

### ✅ Immediate (1-2 seconds)
- Form submits successfully
- See success message: "Thank You!"
- Form clears or shows confirmation

### ✅ Within 5-10 seconds
1. **Database Entry Created**
   - New row in `contact_submissions` table
   - New row in `contacts` table
   - New row in `projects` table (maybe)

2. **Emails Sent (Check Both Inboxes!)**
   - **Customer Email** → m10djcompany@gmail.com
     - Subject: "Thank you for contacting M10 DJ Company - Wedding Inquiry"
     - Professional branded email
   
   - **Admin Notification** → djbenmurray@gmail.com AND m10djcompany@gmail.com
     - Subject: "🎉 New Wedding Inquiry from Sarah Johnson"
     - Contains lead details and admin panel link
   
   - **Service Selection Email** → m10djcompany@gmail.com (for weddings only!)
     - Subject: "Select Your Perfect Package"
     - Contains "GET STARTED" button
     - Links to personalized package selection page

3. **SMS Notification** → Your phone (+19014977001)
   ```
   🎉 New Lead!
   Name: Sarah Johnson
   Event: Wedding
   📧 m10djcompany@gmail.com
   📞 901-555-9876
   Check your email for details.
   ```

---

## Step 4: Verify in Admin Panel

1. Go to: http://localhost:3000/admin/contacts
2. You should see: **Sarah Johnson** as newest contact
3. Click to view details
4. Verify all data saved correctly

---

## Step 5: Test Service Selection Page (WEDDING ONLY)

1. **Check your email** (m10djcompany@gmail.com)
2. **Find email:** "Select Your Perfect Package"
3. **Click:** "GET STARTED" button
4. **You should see:**
   - Service selection page loads
   - Pre-filled with Sarah's info
   - 3 package options
   - Add-ons section
   - Total pricing calculator

---

## 🧪 Alternative: Test via API

If dev server is running, you can test via command line:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Johnson",
    "email": "m10djcompany@gmail.com",
    "phone": "9015559876",
    "eventType": "Wedding",
    "eventDate": "2026-09-12",
    "location": "The Peabody Hotel, Memphis",
    "message": "Looking for DJ and lighting for 150 guests"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon.",
  "submissionId": "uuid-here",
  "contactId": "uuid-here"
}
```

---

## 📊 Complete Checklist

After submitting the test lead, verify:

### Database
- [ ] Entry in admin panel under Contacts
- [ ] All fields populated correctly
- [ ] No duplicate entries created

### Emails (Check BOTH Gmail accounts!)
- [ ] Customer confirmation email received
- [ ] Admin notification email received (both addresses)
- [ ] Service selection email received (wedding only)
- [ ] All emails from hello@m10djcompany.com
- [ ] All emails have proper formatting

### SMS
- [ ] SMS received on your phone
- [ ] Contains lead details
- [ ] Sent from correct number

### Service Selection (Wedding Only)
- [ ] Email contains service selection link
- [ ] Link opens package selection page
- [ ] Page pre-filled with lead data
- [ ] Can select packages and add-ons
- [ ] Price calculator works

---

## 🎯 What to Look For

### ✅ Success Indicators
- Form submits without errors
- Success message displays
- All emails arrive within 1 minute
- SMS arrives within 1 minute
- Lead appears in admin panel
- No duplicate database entries
- Service selection page works

### ❌ Failure Indicators
- Form shows error message
- Email doesn't arrive (check spam!)
- SMS doesn't arrive
- Lead not in database
- Duplicate entries created
- Service selection link broken

---

## 🔍 Debugging

### If Form Shows Error
1. Check browser console (F12)
2. Check server logs in terminal
3. Verify all environment variables set
4. Run health check: `curl http://localhost:3000/api/health-check`

### If Emails Don't Arrive
1. Check spam/junk folders (BOTH Gmail accounts!)
2. Check Resend dashboard: https://resend.com/emails
3. Look for email IDs in server logs
4. Verify domain is verified in Resend

### If SMS Doesn't Arrive
1. Check Twilio dashboard
2. Verify phone number correct
3. Check Twilio account credits
4. Look for SMS SID in server logs

### If Service Selection Link Doesn't Work
1. Check that it's a Wedding event type
2. Verify token generation in logs
3. Check `/select-services/[token]` page exists
4. Look for errors in browser console

---

## 🧹 Cleanup After Testing

If you don't want test data cluttering your database:

1. Go to Admin Panel → Contacts
2. Find "Sarah Johnson"
3. Delete the test contact
4. Or mark as "Test" for future reference

---

## 📝 Test Different Event Types

Try these variations:

### Test 1: Wedding (Full Workflow)
```
Event Type: Wedding
→ Should trigger service selection email
```

### Test 2: Corporate Event
```
Event Type: Corporate Event
→ No service selection email
→ Regular admin notification only
```

### Test 3: Duplicate Prevention
```
Submit same data twice within 5 minutes
→ Second submission should be blocked or reuse existing
→ No duplicate database entries
```

### Test 4: Invalid Data
```
Email: invalid-email
→ Should show validation error
→ Form should not submit
```

---

## 🎉 Success Criteria

**Your lead form is working perfectly if:**
- ✅ Form submits smoothly
- ✅ Success message shows immediately
- ✅ Database entry created
- ✅ 2+ admin emails received
- ✅ 1 customer email received
- ✅ 1 SMS received
- ✅ Service selection email sent (for weddings)
- ✅ No errors in console
- ✅ No duplicate entries
- ✅ All data accurate

---

## 📊 Expected Timeline

```
0s: Click "Submit"
1s: Button disabled, spinner shows
2s: API processes request
3s: Database saves complete
4s: Emails queue
5s: SMS queues
6s: Success message shows
10s: First email arrives
15s: All emails arrived
20s: SMS arrives
```

**Total: ~20 seconds for complete workflow**

---

## 🚀 Production Test

Once local test passes, test on production:

1. Go to: https://m10djcompany.com
2. Submit real test inquiry
3. Verify same workflow works
4. Check production database
5. Verify emails sent from production

---

**Ready to test? Start your dev server and submit that form!** 🎯

