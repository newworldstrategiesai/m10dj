# ⚡ Quick Guide: Email Forwarding Setup

**Goal:** Receive emails sent to hello@m10djcompany.com in your Gmail  
**Time:** 5 minutes  
**Cost:** Free

---

## Step-by-Step Instructions

### 1. Log into Namecheap
Go to: https://www.namecheap.com
- Login with your Namecheap account

### 2. Navigate to Your Domain
- Click "Domain List" (left sidebar)
- Find "m10djcompany.com"
- Click "Manage"

### 3. Go to Email Settings
- Click "Advanced DNS" tab
- Scroll down to find "Mail Settings" or "Email Forwarding" section
- Click "Add Forwarder" or "Manage Email Forwarding"

### 4. Add Forwarder
```
Mailbox/Alias: hello
Domain: @m10djcompany.com
Forward To: m10djcompany@gmail.com
```

Click "Add Forwarder" or "Save"

### 5. Wait for Propagation
- Usually takes 10-30 minutes
- Can take up to 2 hours in rare cases

### 6. Test It
Send a test email to: hello@m10djcompany.com

Check: m10djcompany@gmail.com inbox (and spam folder)

---

## Visual Example

```
┌─────────────────────────────────┐
│  Email sent to:                 │
│  hello@m10djcompany.com         │
└────────────┬────────────────────┘
             │
             │ (Auto-forwarded)
             ↓
┌─────────────────────────────────┐
│  Arrives in:                    │
│  m10djcompany@gmail.com         │
└─────────────────────────────────┘
```

---

## Alternative: Use Namecheap Private Email (Paid)

If email forwarding isn't available or you want a full inbox:

1. Go to Namecheap Dashboard
2. Products → Private Email
3. Purchase plan ($0.83/month per mailbox)
4. Create mailbox: hello@m10djcompany.com
5. Access via webmail or configure in Gmail

---

## ✅ Done!

After setup, all emails to hello@m10djcompany.com will automatically appear in m10djcompany@gmail.com!

**This includes:**
- ✅ Client replies to your automated emails
- ✅ Direct emails from leads
- ✅ Any correspondence sent to hello@m10djcompany.com

---

## 🎁 Bonus: Reply FROM hello@m10djcompany.com

Want to reply using hello@m10djcompany.com instead of your Gmail address?

See: `EMAIL_RECEIVING_SETUP.md` → Option 2 for Gmail "Send Mail As" setup.

