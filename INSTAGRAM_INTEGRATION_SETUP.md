## 📱 Instagram Integration Setup Guide

### Overview
This integration allows you to automatically capture leads from Instagram DMs, comments, and mentions in real-time. When someone messages you about booking or pricing, a contact is automatically created in your CRM.

---

## 🚀 Features

✅ **Real-time Lead Capture**
- Automatically detects inquiry messages from Instagram DMs
- Creates contacts from comments with booking inquiries
- Monitors mentions for potential leads

✅ **Smart Detection**
- AI-powered keyword detection (book, price, available, wedding, event, etc.)
- Prevents duplicate contacts
- Adds Instagram messages to contact notes

✅ **Admin Dashboard**
- View all Instagram messages
- See lead inquiry stats
- Monitor recent conversations
- Track contacts created from Instagram

---

## 📋 Prerequisites

1. **Instagram Business Account** (not personal account)
2. **Facebook Page** connected to your Instagram
3. **Facebook Developer Account**
4. **Meta App** with Instagram API access

---

## 🔧 Setup Instructions

### Step 1: Create Facebook/Meta App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Name your app: "M10 DJ Instagram Integration"
5. Add your email and complete setup

### Step 2: Add Instagram Product

1. In your app dashboard, click "Add Product"
2. Find "Instagram" and click "Set Up"
3. Select "Instagram Business Account"
4. Connect your Instagram Business Account

### Step 3: Configure Webhook

1. In your app, go to **Instagram** → **Configuration** → **Webhooks**
2. Click "Add Webhook"
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/instagram/webhook
   ```
4. Generate a verify token (random string):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
5. Subscribe to these fields:
   - ☑️ `messages`
   - ☑️ `comments`
   - ☑️ `mentions`

### Step 4: Run Database Migration

Run this SQL in Supabase:
```bash
supabase/migrations/20250127000004_add_instagram_integration.sql
```

This creates:
- `instagram_messages` table
- `instagram_sync_log` table
- Instagram fields in `contacts` table

### Step 5: Add Environment Variables

Add to your `.env.local`:

```bash
# Instagram Integration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_VERIFY_TOKEN=your_verify_token_here
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
```

**To get Access Token:**
1. Go to your Meta App → Instagram → Configuration
2. Click "Generate Access Token"
3. Select your Instagram Business Account
4. Grant required permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `instagram_manage_comments`
5. Copy the token (starts with `IGQV...`)

### Step 6: Deploy to Vercel

```bash
# Push changes
git add .
git commit -m "Add Instagram integration"
git push origin main

# Add environment variables in Vercel
# Go to: Vercel Dashboard → Settings → Environment Variables
# Add all INSTAGRAM_* variables
```

### Step 7: Test the Integration

1. Send a test DM to your Instagram account with keywords like:
   - "How much does a wedding DJ cost?"
   - "Are you available for September 15th?"
   - "I'm interested in booking a DJ"

2. Check the admin dashboard at:
   ```
   /admin/instagram
   ```

3. Verify a new contact was created at:
   ```
   /admin/contacts
   ```

---

## 📊 Admin Dashboard

Access the Instagram integration dashboard:
```
/admin/instagram
```

### Features:
- **Connection Status**: Shows if Instagram is connected
- **Stats Cards**:
  - Total Instagram messages received
  - Lead inquiries detected
  - Contacts created from Instagram
- **Recent Messages**: List of latest Instagram interactions
- **Sync Button**: Manual sync of Instagram messages
- **Webhook URL**: Copy webhook URL for setup

---

## 🔍 How Lead Detection Works

The system automatically detects lead inquiries by looking for these keywords:

**Booking Keywords:**
- book, booking, available, reserve, schedule

**Pricing Keywords:**
- price, pricing, cost, quote, rate, fee, package

**Event Keywords:**
- wedding, event, party, celebration, reception, ceremony

**Inquiry Keywords:**
- interested, inquiry, contact, information, details, more info

**When detected, the system:**
1. ✅ Creates a new contact (if doesn't exist)
2. ✅ Adds Instagram username and ID
3. ✅ Sets lead source as "Instagram DM/Comment"
4. ✅ Adds message to contact notes
5. ✅ Tags contact with 'instagram' label
6. ✅ Sends admin notification

---

## 🔔 Notifications

When a lead is detected, you'll receive:
- Database notification in `notification_log` table
- Contact appears in "Recent Contacts" on dashboard
- Tagged as "Instagram Lead" for easy filtering

---

## 🛠️ Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook is verified:**
   - Go to Meta App → Instagram → Webhooks
   - Status should show "Active"

2. **Verify token matches:**
   - Token in `.env.local` must match Meta App settings

3. **Check webhook URL is accessible:**
   ```bash
   curl https://yourdomain.com/api/instagram/webhook
   ```

### Access Token Expired

Instagram access tokens expire. To refresh:
1. Go to Meta App → Instagram → Configuration
2. Click "Extend Access Token"
3. Update `INSTAGRAM_ACCESS_TOKEN` in `.env.local` and Vercel

### Messages Not Creating Contacts

1. **Check message contains keywords:**
   - Must include booking/pricing/event keywords

2. **Verify database permissions:**
   ```sql
   SELECT * FROM contacts WHERE instagram_id IS NOT NULL;
   ```

3. **Check webhook logs:**
   ```bash
   # View Vercel logs
   vercel logs --follow
   ```

---

## 📱 Instagram Best Practices

1. **Quick Response Times**
   - Respond to Instagram inquiries within 1 hour
   - Use templates for common questions

2. **Professional Profile**
   - Business account with contact button
   - Link to website in bio
   - Highlight stories with pricing/packages

3. **Call-to-Actions**
   - Add "DM for pricing" in posts
   - Use story stickers for easy contact
   - Include booking link in bio

4. **Regular Monitoring**
   - Check `/admin/instagram` daily
   - Review new contacts from Instagram
   - Follow up on lead inquiries promptly

---

## 🔐 Security Considerations

1. **Access Token Security**
   - Never commit tokens to git
   - Rotate tokens every 60 days
   - Use environment variables only

2. **Webhook Verification**
   - Always verify webhook signature
   - Use strong verify token
   - HTTPS required for webhook URL

3. **Data Privacy**
   - Store only necessary Instagram data
   - Follow Instagram's Platform Terms
   - Respect user privacy in DMs

---

## 📈 Next Steps

Once Instagram integration is working:

1. **Set up auto-responders** (optional)
   - Instant reply to Instagram DMs
   - Thank you message for inquiries

2. **Create Instagram templates**
   - Pricing information
   - Availability responses
   - Booking process steps

3. **Track conversion rates**
   - Monitor Instagram lead → booking rate
   - Optimize Instagram content
   - A/B test different CTAs

---

## 💡 Pro Tips

- **Use Instagram Stories** with question stickers to capture leads
- **Pin top comment** with booking link on popular posts
- **Create highlight reels** for FAQs, pricing, testimonials
- **Run Instagram ads** targeting engaged couples in Memphis
- **Cross-post** successful Instagram content to Facebook

---

## 🆘 Support

If you need help:
1. Check [Meta for Developers Docs](https://developers.facebook.com/docs/instagram-api/)
2. Review [Instagram Platform Terms](https://www.facebook.com/terms/instagram/platform/)
3. Test webhook using Meta's debugging tools
4. Check Supabase logs for database errors

---

## ✅ Quick Checklist

- [ ] Instagram Business Account connected
- [ ] Facebook Developer App created
- [ ] Webhook configured and verified
- [ ] Database migration run
- [ ] Environment variables set
- [ ] Deployed to Vercel
- [ ] Test message sent and received
- [ ] Contact created successfully
- [ ] Admin dashboard accessible

**Once complete, you'll have automatic lead capture from Instagram! 🎉**

