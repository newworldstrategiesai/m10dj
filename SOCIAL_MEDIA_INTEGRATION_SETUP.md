## 📱 Instagram + Facebook Messenger Integration Setup Guide

### Overview
This integration captures leads from **both Instagram DMs and Facebook Messenger** in real-time. When someone messages you about booking, pricing, or events, contacts are automatically created in your CRM.

---

## 🚀 Combined Features

✅ **Instagram Integration**
- DM monitoring for lead inquiries
- Comment tracking on posts
- Story mentions detection
- Automatic contact creation

✅ **Messenger Integration**
- Facebook Messenger conversation tracking
- Postback button click detection (Get Started, Pricing, etc.)
- Referral source tracking
- Auto-reply to new inquiries

✅ **Unified Dashboard**
- Single interface for both platforms
- Combined stats and analytics
- Unified recent messages feed
- Quick setup for both webhooks

---

## 📋 Prerequisites

**What You Need:**
1. Instagram Business Account (not personal)
2. Facebook Business Page
3. Facebook Developer Account
4. Meta App with Instagram + Messenger API access
5. Instagram connected to your Facebook Page

---

## 🔧 Complete Setup Steps

### Step 1: Create Meta App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Name: "M10 DJ Social Media Integration"
5. Add your email and complete setup

### Step 2: Add Products to Your App

**Add Instagram:**
1. In app dashboard → "Add Product"
2. Find "Instagram" → Click "Set Up"
3. Select "Instagram Business Account"
4. Connect your Instagram Business Account

**Add Messenger:**
1. In app dashboard → "Add Product"
2. Find "Messenger" → Click "Set Up"
3. Connect your Facebook Page
4. Grant required permissions

### Step 3: Configure Webhooks (Both Platforms)

**Instagram Webhook:**
1. Go to Instagram → Configuration → Webhooks
2. Click "Add Webhook"
3. Webhook URL: `https://yourdomain.com/api/instagram/webhook`
4. Verify Token: (generate random string - see below)
5. Subscribe to fields:
   - ☑️ `messages`
   - ☑️ `comments`
   - ☑️ `mentions`

**Messenger Webhook:**
1. Go to Messenger → Configuration → Webhooks
2. Click "Add Webhook"
3. Webhook URL: `https://yourdomain.com/api/messenger/webhook`
4. Verify Token: (generate random string - see below)
5. Subscribe to fields:
   - ☑️ `messages`
   - ☑️ `messaging_postbacks`
   - ☑️ `messaging_referrals`
   - ☑️ `message_deliveries`
   - ☑️ `message_reads`

**Generate Verify Tokens:**
```bash
# Instagram verify token
node -e "console.log('INSTAGRAM_VERIFY_TOKEN='+require('crypto').randomBytes(32).toString('hex'))"

# Messenger verify token  
node -e "console.log('MESSENGER_VERIFY_TOKEN='+require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Get Access Tokens

**Instagram Access Token:**
1. Meta App → Instagram → Configuration
2. Click "Generate Access Token"
3. Select your Instagram Business Account
4. Grant permissions: `instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`
5. Copy token (starts with `IGQV...`)

**Facebook Page Access Token:**
1. Meta App → Messenger → Configuration
2. Under "Access Tokens" → Select your Facebook Page
3. Click "Generate Token"
4. Grant permissions: `pages_messaging`, `pages_manage_metadata`
5. Copy token (starts with `EAA...`)

### Step 5: Run Database Migrations

Run both migrations in Supabase SQL Editor:

```sql
-- Run these in order:
-- 1. Instagram migration
supabase/migrations/20250127000004_add_instagram_integration.sql

-- 2. Messenger migration
supabase/migrations/20250127000005_add_messenger_integration.sql
```

This creates:
- `instagram_messages` and `messenger_messages` tables
- `instagram_sync_log` and `messenger_sync_log` tables
- Instagram and Facebook fields in `contacts` table
- All necessary indexes and RLS policies

### Step 6: Add Environment Variables

Add to `.env.local` (local development):

```bash
# Instagram Integration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_VERIFY_TOKEN=your_instagram_verify_token_here

# Facebook Messenger Integration
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
MESSENGER_VERIFY_TOKEN=your_messenger_verify_token_here

# Optional - Meta App credentials
INSTAGRAM_APP_ID=your_app_id_here
INSTAGRAM_APP_SECRET=your_app_secret_here
```

Add same variables in **Vercel** (production):
1. Vercel Dashboard → Your Project → Settings
2. Environment Variables
3. Add all variables above
4. Apply to Production, Preview, and Development

### Step 7: Deploy to Vercel

```bash
# Commit and push
git add .
git commit -m "Add Instagram + Messenger integration"
git push origin main

# Vercel will auto-deploy
# Or manually deploy: vercel --prod
```

### Step 8: Test Both Integrations

**Test Instagram:**
1. Send DM to your Instagram account: "How much for a wedding DJ?"
2. Check `/admin/instagram` → Instagram tab
3. Verify contact created at `/admin/contacts`

**Test Messenger:**
1. Send message to your Facebook Page: "Are you available September 15th?"
2. Check `/admin/instagram` → Messenger tab
3. Verify contact created at `/admin/contacts`

---

## 📊 Unified Admin Dashboard

Access at: `/admin/instagram`

**Features:**
- **Tabs** for Instagram and Messenger
- **Combined Stats Card** at top showing totals
- **Individual Platform Stats** in each tab
- **Unified Recent Messages** feed (all platforms)
- **Webhook URLs** for easy copy/paste
- **Sync Buttons** for manual refresh
- **Last Sync Times** for monitoring

---

## 🔍 Lead Detection Keywords

Both platforms detect these inquiry keywords:

**Booking Terms:**
- book, booking, available, reserve, schedule, hire

**Pricing Terms:**
- price, pricing, cost, quote, rate, fee, package, budget

**Event Terms:**
- wedding, event, party, celebration, reception, ceremony, corporate

**Inquiry Terms:**
- interested, inquiry, contact, information, details, more info

**Action Taken When Detected:**
1. ✅ Create new contact (if doesn't exist)
2. ✅ Add platform username/ID
3. ✅ Set lead source (Instagram DM/Comment or Facebook Messenger)
4. ✅ Add message to contact notes
5. ✅ Tag with platform label
6. ✅ Send admin notification
7. ✅ Send auto-reply to user (Messenger only)

---

## 🤖 Messenger Auto-Reply

When lead inquiry detected on Messenger:
```
Thanks for reaching out! We received your message about DJ services. 
We'll get back to you shortly. In the meantime, check out our services 
at m10djcompany.com or call us at (901) 410-2020.
```

**To customize:**
Edit `pages/api/messenger/webhook.ts` → `sendMessengerReply()` function

---

## 🛠️ Troubleshooting

### Webhooks Not Receiving Events

**Instagram:**
1. Verify webhook URL is accessible (must be HTTPS)
2. Check verify token matches in Meta App and `.env`
3. Ensure Instagram account is Business (not Personal)
4. Verify Facebook Page is connected to Instagram

**Messenger:**
1. Check Facebook Page Access Token is valid
2. Verify webhook subscribed to correct page
3. Test with Messenger Test Tool in Meta App
4. Check Vercel logs for errors

### Access Tokens Expired

**Instagram tokens expire after 60 days:**
1. Go to Meta App → Instagram → Configuration
2. Click "Extend Access Token"
3. Update `INSTAGRAM_ACCESS_TOKEN` in `.env` and Vercel

**Facebook Page tokens (long-lived):**
1. Generate new token in Meta App
2. Update `FACEBOOK_PAGE_ACCESS_TOKEN`

### Messages Not Creating Contacts

1. **Check message contains keywords**
2. **Verify database RLS policies:**
   ```sql
   SELECT * FROM contacts WHERE instagram_id IS NOT NULL OR facebook_id IS NOT NULL;
   ```
3. **Check webhook logs in Vercel:**
   ```bash
   vercel logs --follow
   ```
4. **Test webhook locally with ngrok**

---

## 📱 Best Practices

### Instagram
- Respond to DMs within 1 hour (boosts algorithm)
- Use Stories with question stickers
- Pin comment with booking link on posts
- Create FAQ highlights
- Use Instagram ads for targeting

### Messenger
- Set up Messenger Menu with quick actions
- Create "Get Started" postback button
- Use persistent menu for FAQs
- Enable instant replies for common questions
- Set business hours for expectations

### Both Platforms
- Check `/admin/instagram` dashboard daily
- Follow up on lead inquiries within 24 hours
- Use templates for common responses
- Track conversion rates
- A/B test different CTAs

---

## 🔐 Security

1. **Never commit tokens to git**
   - Use `.env.local` (already in `.gitignore`)
   - Store in Vercel environment variables only

2. **Rotate tokens regularly**
   - Instagram: Every 60 days
   - Messenger: Every 90 days recommended

3. **Webhook verification**
   - Always verify tokens
   - Use HTTPS only
   - Validate payload signatures

4. **Data privacy**
   - Store only necessary data
   - Follow Meta Platform Terms
   - Comply with GDPR/privacy laws

---

## 📈 Analytics & Monitoring

**Track These Metrics:**
- Total messages received (both platforms)
- Lead inquiry rate
- Contact creation rate
- Response time
- Lead → Booking conversion rate

**Available in Dashboard:**
- `/admin/instagram` - Social media stats
- `/admin/contacts` - Filter by "instagram" or "facebook-messenger" tags
- `/admin/dashboard` - Overall business metrics

---

## 🆘 Support Resources

**Meta Documentation:**
- [Instagram Graph API](https://developers.facebook.com/docs/instagram-api/)
- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform/)
- [Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks/)

**Testing Tools:**
- [Messenger Test Tool](https://developers.facebook.com/tools/messenger-platform/)
- [Instagram Test Tool](https://developers.facebook.com/tools/instagram-api/)
- [Webhook Debugger](https://developers.facebook.com/tools/webhooks/)

---

## ✅ Complete Setup Checklist

**Meta App Setup:**
- [ ] Created Meta Developer App
- [ ] Added Instagram product
- [ ] Added Messenger product
- [ ] Connected Instagram Business Account
- [ ] Connected Facebook Page

**Webhook Configuration:**
- [ ] Instagram webhook configured
- [ ] Messenger webhook configured
- [ ] Both webhooks verified
- [ ] Correct fields subscribed

**Tokens & Access:**
- [ ] Instagram Access Token obtained
- [ ] Facebook Page Access Token obtained
- [ ] Verify tokens generated
- [ ] All tokens added to .env.local
- [ ] All tokens added to Vercel

**Database:**
- [ ] Instagram migration run
- [ ] Messenger migration run
- [ ] Tables created successfully
- [ ] RLS policies active

**Testing:**
- [ ] Instagram test message sent
- [ ] Messenger test message sent
- [ ] Contacts created successfully
- [ ] Webhooks receiving events
- [ ] Admin dashboard accessible

**Production:**
- [ ] Deployed to Vercel
- [ ] Webhooks URLs updated in Meta App
- [ ] Test in production
- [ ] Auto-replies working
- [ ] Admin notifications working

**Once complete, you have automatic lead capture from Instagram AND Messenger! 🎉**

---

## 💡 Pro Tips

1. **Create Instagram Story Highlights:**
   - Pricing
   - FAQs
   - Testimonials
   - Recent Events

2. **Set Up Messenger Menu:**
   ```
   - Get Pricing
   - Check Availability  
   - View Services
   - Contact Us
   ```

3. **Use Meta Business Suite:**
   - Unified inbox for both platforms
   - Scheduled posts
   - Analytics dashboard
   - Ads management

4. **Automate More:**
   - Create chatbot flows for common questions
   - Set up saved replies for FAQs
   - Use Instagram Quick Replies

5. **Track ROI:**
   - Tag leads with source
   - Monitor conversion rates
   - Calculate cost per lead
   - Optimize best-performing content

---

**Questions? Check the logs or Meta's documentation!** 🚀

