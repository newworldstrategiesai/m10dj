# 🚀 Instagram + Messenger Webhook Status

## Current Status: **DEPLOYING** 🔄

The webhooks have been created and are now deploying. Testing in ~2 minutes.

---

## ✅ What's Been Created:

### 1. **Webhook Endpoints**
- ✅ `/api/instagram/webhook` - Instagram DMs, comments, mentions
- ✅ `/api/messenger/webhook` - Facebook Messenger messages

### 2. **Database Tables** (Need to run migrations)
- `instagram_messages` - Stores all Instagram interactions
- `messenger_messages` - Stores all Messenger conversations  
- `instagram_sync_log` - Tracks Instagram sync operations
- `messenger_sync_log` - Tracks Messenger sync operations
- Added fields to `contacts`: `instagram_id`, `instagram_username`, `facebook_id`

### 3. **Admin Dashboard**
- `/admin/instagram` - Unified social media dashboard
- Tabs for Instagram and Messenger
- Combined stats and analytics
- Recent messages feed

### 4. **Environment Variables Set** (in Vercel)
- ✅ `MESSENGER_VERIFY_TOKEN`
- ✅ `INSTAGRAM_VERIFY_TOKEN`
- ✅ `FACEBOOK_PAGE_ACCESS_TOKEN` 
- ⚠️ `INSTAGRAM_ACCESS_TOKEN` (need to generate from Meta)

---

## 📝 Next Steps (After Deployment):

### 1. Run Database Migrations

Go to **Supabase SQL Editor** and run:

```sql
-- First migration:
supabase/migrations/20250127000004_add_instagram_integration.sql

-- Second migration:
supabase/migrations/20250127000005_add_messenger_integration.sql
```

### 2. Get Instagram Access Token

1. In Meta Developer Console → Left sidebar → **"Instagram settings"**
2. Find your Instagram Business Account
3. Click **"Generate Token"**
4. Copy the token
5. Add to Vercel as `INSTAGRAM_ACCESS_TOKEN`

### 3. Verify Webhooks in Meta

Once deployment completes (check Vercel dashboard):

**Messenger Webhook:**
- URL: `https://m10djcompany.com/api/messenger/webhook`
- Verify Token: `4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616`
- Click "Verify and Save"

**Instagram Webhook:**
- URL: `https://m10djcompany.com/api/instagram/webhook`
- Verify Token: `f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202`
- Click "Verify and Save"

### 4. Subscribe to Webhook Events

For **M10 DJ Company** page, click "Add Subscriptions" and check:
- ☑️ `messages`
- ☑️ `messaging_postbacks`
- ☑️ `messaging_referrals`
- ☑️ `message_deliveries`
- ☑️ `message_reads`

For **Instagram**, subscribe to:
- ☑️ `messages`
- ☑️ `comments`
- ☑️ `mentions`

### 5. Test the Integration

**Test Messenger:**
```
Send message to Facebook Page: "How much for a wedding DJ?"
```

**Test Instagram:**
```
DM your Instagram: "Are you available for my event?"
```

**Check Results:**
- Go to `/admin/instagram`
- Should see message in recent messages
- New contact should be created at `/admin/contacts`

---

## 🔍 Troubleshooting

### If Webhook Verification Fails:

1. **Check Vercel deployment is complete**
   - Go to https://vercel.com/dashboard
   - Wait for green checkmark

2. **Test webhook manually:**
   ```bash
   curl "https://m10djcompany.com/api/messenger/webhook?hub.mode=subscribe&hub.verify_token=4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616&hub.challenge=test123"
   ```
   Should return: `test123`

3. **Check environment variables in Vercel**
   - All 4 tokens should be set
   - Applied to Production, Preview, and Development

4. **View Vercel logs**
   ```bash
   vercel logs --follow
   ```

### If Messages Aren't Creating Contacts:

1. Make sure migrations are run in Supabase
2. Check message contains inquiry keywords
3. View webhook logs in Vercel
4. Test database connection

---

## 📚 Documentation Created:

- `SOCIAL_MEDIA_INTEGRATION_SETUP.md` - Complete setup guide
- `META_SETUP_QUICK_GUIDE.md` - Quick reference
- `INSTAGRAM_INTEGRATION_SETUP.md` - Instagram-specific guide
- `test-webhook.sh` - Testing script

---

## 🎯 What Happens When It's Working:

1. **Customer sends message** via Instagram or Messenger
2. **Webhook receives notification** instantly
3. **System checks** if message contains inquiry keywords
4. **If inquiry detected:**
   - ✅ Creates contact in database
   - ✅ Saves message to contact notes
   - ✅ Tags with platform (instagram/messenger)
   - ✅ Sends admin notification
   - ✅ (Messenger only) Sends auto-reply to customer
5. **You see:**
   - New contact in `/admin/contacts`
   - Message in `/admin/instagram` dashboard
   - Stats increment

---

## ⏱️ Current Time: Waiting for Deployment

Check deployment status at: https://vercel.com/dashboard

Once deployed, come back and verify the webhooks in Meta! 🚀

