# 🚀 Quick Start: Send Service Selection Links from Admin Panel

## **WHERE TO FIND IT**

1. Go to **Admin Dashboard** → **Contacts**
2. Click on any **wedding contact**
3. Look for the **"Service Selection"** section (appears below the contact header)

---

## **STEP-BY-STEP GUIDE**

### **Step 1: Open a Wedding Contact**

Navigate to: `/admin/contacts/[contact-id]`

You'll see the service selection section **only if**:
- ✅ Event type is "wedding"
- ✅ Lead status is NOT "Lost" or "Completed"
- ✅ Contact has an email address

---

### **Step 2: Generate the Link**

In the **Service Selection** section, you'll see:

```
┌────────────────────────────────────────────┐
│ Service Selection                          │
│                                            │
│ Send Sarah a personalized link to select   │
│ their wedding DJ package and add-ons.      │
│                                            │
│ [Generate Service Selection Link]          │
└────────────────────────────────────────────┘
```

**Click the button** → Wait 1-2 seconds

---

### **Step 3: Send to Lead**

After generation, you'll see:

```
┌────────────────────────────────────────────┐
│ ✓ Link Generated!                          │
│                                            │
│ https://m10djcompany.com/select-services/  │
│ eyJjb250YWN0SWQiOiIxMjM0NS...              │
│                                            │
│ [Copy Link]     [Send Email]               │
│                                            │
│ This link is unique to Sarah Smith         │
└────────────────────────────────────────────┘
```

**Two Options:**

#### **Option A: Send Email** (Recommended)
1. Click **"Send Email"** button
2. Your default email app opens with:
   - **To:** Contact's email
   - **Subject:** "Select Your Wedding DJ Services - M10 DJ Company"
   - **Body:** Pre-filled professional message with link
3. Review and click Send

#### **Option B: Copy Link**
1. Click **"Copy Link"** button
2. Paste into:
   - Your preferred email client
   - Text message
   - Slack/WhatsApp
   - Follow-up call notes

---

## **WHAT HAPPENS NEXT**

### **Lead's Experience:**

1. **Lead clicks link** → Sees personalized page:
   ```
   Hi Sarah! Select Your Perfect Package
   ```

2. **Lead selects package** → Chooses from 3 options:
   - Package 1: $2,000
   - Package 2: $2,500 ⭐ MOST POPULAR
   - Package 3: $3,000

3. **Lead adds enhancements** (optional):
   - Dancing on Clouds: $500
   - Monogram Projection: $350
   - Cold Spark Effects: $600
   - Additional hours, etc.

4. **Lead sees total** → Updates in real-time

5. **Lead adds notes** → "We want purple uplighting for our theme"

6. **Lead submits** → Gets thank you page:
   ```
   ✓ Thank You, Sarah!
   Your Investment: $3,000
   We'll be in touch within 24 hours
   ```

---

### **What You See:**

Go to **Business Details** tab in the contact → You'll see:

```
┌─────────────────────────────────────────────┐
│ ✓ Selected Services                         │
│                                             │
│ Package                                     │
│ Package 2         $2,500                    │
│                                             │
│ Add-Ons                                     │
│ Dancing on Clouds                    $500   │
│                                             │
│ ─────────────────────────────────────────   │
│ Total Investment:              $3,000       │
│                                             │
│ Additional Notes                            │
│ "We want purple uplighting to match our     │
│  theme. Also, can you play country music?"  │
│                                             │
│ Submitted: 1/27/2025, 2:30 PM              │
└─────────────────────────────────────────────┘
```

**Also automatically updated:**
- ✅ `lead_status` → "Proposal Sent"
- ✅ `notes` → Appended with selection summary
- ✅ `custom_fields` → Full JSON of selections stored

---

## **EMAIL TEMPLATE (PRE-FILLED)**

When you click "Send Email", this is what populates:

```
To: sarah@example.com
Subject: Select Your Wedding DJ Services - M10 DJ Company

Hi Sarah,

Thank you for your interest in M10 DJ Company for your special day!

I've created a personalized service selection page where you can 
choose your perfect package and add-ons. This will help me prepare 
an accurate proposal tailored to your needs.

Click here to select your services:
[LINK]

Once you submit your selections, I'll prepare a detailed proposal 
and follow up within 24 hours.

If you have any questions, feel free to call me at (901) 410-2020.

Looking forward to making your celebration unforgettable!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
www.m10djcompany.com
```

**You can edit this before sending!**

---

## **VISUAL WALKTHROUGH**

### **1. Contact Detail Page - Before Generation**

```
┌──────────────────────────────────────────────────┐
│ Admin Contacts                                   │
│                                                  │
│ [← Back to Contacts]            [Edit Contact]   │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │  SM   Sarah Smith                        │    │
│ │       sarah@example.com                  │    │
│ │       [New] [Hot]                        │    │
│ │                       [☎] [✉] [💬]        │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ Service Selection                        │    │
│ │                                          │    │
│ │ Send Sarah a personalized link to select │    │
│ │ their wedding DJ package and add-ons.    │    │
│ │                                          │    │
│ │ [Generate Service Selection Link]        │ ← CLICK HERE
│ └──────────────────────────────────────────┘    │
│                                                  │
│ [Contact Details] [Event Information] [Business Details]
│                                                  │
└──────────────────────────────────────────────────┘
```

### **2. After Generation**

```
┌──────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────┐    │
│ │ ✓ Link Generated!                        │    │
│ │                                          │    │
│ │ https://m10djcompany.com/select-services/│    │
│ │ eyJjb250YWN0SWQiOiIxMjM0NS...           │    │
│ │                                          │    │
│ │ [Copy Link]     [Send Email]             │ ← USE THESE
│ │                                          │    │
│ │ This link is unique to Sarah Smith       │    │
│ └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

### **3. Business Details Tab - After Lead Submits**

```
┌──────────────────────────────────────────────────┐
│ [Contact Details] [Event Information] [Business Details] ← THIS TAB
│                                                  │
│ Lead Status: Proposal Sent                       │
│ Lead Temperature: Hot                            │
│ Communication Preference: Email                  │
│                                                  │
│ Notes: [Initial inquiry notes...]                │
│                                                  │
│ ┌──────────────────────────────────────────┐    │
│ │ ✓ Selected Services                      │    │
│ │                                          │    │
│ │ Package                                  │    │
│ │ Package 2                       $2,500   │    │
│ │                                          │    │
│ │ Add-Ons                                  │    │
│ │ Dancing on Clouds                 $500   │    │
│ │ Monogram Projection               $350   │    │
│ │                                          │    │
│ │ ──────────────────────────────────────   │    │
│ │ Total Investment:              $3,350    │    │
│ │                                          │    │
│ │ Additional Notes                         │    │
│ │ "We love country music and want purple   │    │
│ │  uplighting to match our theme."         │    │
│ │                                          │    │
│ │ Submitted: 1/27/2025, 2:30 PM           │    │
│ └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## **TIPS & BEST PRACTICES**

### **When to Send:**

✅ **Immediately after first contact**
- Lead filled out website form
- Lead called and you took basic info
- Lead messaged on social media

✅ **After initial phone call**
- You've discussed their event
- They seem interested
- They asked about pricing

✅ **Following up on quotes**
- They requested pricing information
- They're comparing vendors
- They need specifics to decide

### **What to Say:**

**First Contact:**
> "Thanks for reaching out! I've created a personalized page where you can explore our packages and build your perfect quote. Takes just 2 minutes: [LINK]"

**After Phone Call:**
> "Great talking with you about your June wedding! Here's the link I mentioned where you can select your package and add-ons: [LINK]"

**Follow-Up:**
> "Just checking in on your wedding DJ search! In case you need it, here's a link to customize your package: [LINK]"

---

## **TROUBLESHOOTING**

### **Button Not Showing?**

Check if:
- ❌ Event type is NOT "wedding" → Only shows for weddings
- ❌ Lead status is "Lost" or "Completed" → Won't show
- ❌ No email address → Need email to send link

**Fix:** Update the contact details and refresh

### **Link Not Working?**

- Check if URL was copied completely
- Verify contact hasn't been deleted
- Try regenerating the link

### **Lead Says They Can't Access It?**

- Verify the link wasn't truncated in email
- Ask them to try a different browser
- Generate a new link and resend

---

## **FREQUENTLY ASKED QUESTIONS**

**Q: Can I generate multiple links for the same contact?**  
A: Yes! Each generation creates a new token. The latest one will work.

**Q: Do links expire?**  
A: No, they remain valid until the contact is deleted. (You can add expiration in production if needed)

**Q: Can leads edit their selections after submitting?**  
A: Not currently. They'd need to contact you. You can generate a new link for them.

**Q: What if a lead selects services but doesn't book?**  
A: Their selections remain in `custom_fields` so you can reference them in future follow-ups.

**Q: Can I see all leads who have selected services?**  
A: Yes! In Contacts list, filter by `lead_status = "Proposal Sent"` or query `custom_fields` directly.

**Q: Can I customize the packages or pricing?**  
A: Yes! Edit `pages/select-services/[token].tsx` to modify packages and add-ons.

**Q: Does this work for corporate events or other event types?**  
A: Currently only for weddings. You can duplicate and customize for other event types.

---

## **NEXT STEPS AFTER LEAD SUBMITS**

1. ✅ **Review their selections** in Business Details tab
2. ✅ **Check their notes** for special requests
3. ✅ **Prepare detailed proposal** based on exact selections
4. ✅ **Follow up within 24 hours** (as promised)
5. ✅ **Reference their choices** in your proposal:
   > "Based on your selection of Package 2 plus Dancing on the Clouds..."

---

## **QUICK CHECKLIST**

Use this for every wedding lead:

- [ ] Contact has email address
- [ ] Event type set to "wedding"
- [ ] Lead status is NOT "Lost" or "Completed"
- [ ] Open contact detail page
- [ ] Click "Generate Service Selection Link"
- [ ] Click "Send Email" or "Copy Link"
- [ ] Send to lead with personal message
- [ ] Wait for their submission
- [ ] Review in Business Details tab
- [ ] Follow up with proposal

---

**Ready to streamline your wedding quotes? Start using this today!** 🎉

**Questions?** See `SERVICE_SELECTION_SYSTEM.md` for complete technical documentation.

