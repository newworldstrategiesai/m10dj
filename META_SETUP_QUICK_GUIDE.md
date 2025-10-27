# 🚀 Meta Setup Quick Reference

Based on your current Meta console screenshot, here's what you need to do:

## ✅ What You've Already Done:
- [x] Created Meta App
- [x] Generated verify tokens
- [x] Have 2 Facebook Pages connected

## 📝 Steps to Complete:

### 1. Subscribe to Webhook Events

For **each page** you want to monitor (M10 DJ Company and/or DJ Ben Murray):

1. Click **"Add Subscriptions"** button
2. Check these boxes:
   - ☑️ `messages`
   - ☑️ `messaging_postbacks`
   - ☑️ `messaging_referrals`  
   - ☑️ `message_deliveries`
   - ☑️ `message_reads`
3. Click **Save**

### 2. Generate Page Access Tokens

For each page:
1. Click the **"Generate"** button next to "Token generated"
2. Copy the token that appears
3. Save it - you'll need this for Vercel

**Token Names:**
- M10 DJ Company → `FACEBOOK_PAGE_ACCESS_TOKEN`
- DJ Ben Murray → `FACEBOOK_PAGE_ACCESS_TOKEN_2` (if using both)

### 3. Get Instagram Access Token

1. In left sidebar, click **"Instagram settings"**
2. Find your Instagram Business Account
3. Click **"Generate Token"**
4. Copy the token → This is your `INSTAGRAM_ACCESS_TOKEN`

### 4. Add to Vercel

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

```bash
# Use the tokens from your terminal:
MESSENGER_VERIFY_TOKEN=4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616
INSTAGRAM_VERIFY_TOKEN=f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202

# Use tokens generated from Meta:
FACEBOOK_PAGE_ACCESS_TOKEN=(paste token from step 2)
INSTAGRAM_ACCESS_TOKEN=(paste token from step 3)
```

### 5. Verify Webhooks (After Vercel Deploy)

Once your site is deployed:

1. In Meta console, go back to webhook configuration
2. Update callback URL to: `https://m10djcompany.com/api/messenger/webhook`
3. Paste verify token: `4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616`
4. Click **"Verify and Save"**

For Instagram webhook:
1. URL: `https://m10djcompany.com/api/instagram/webhook`
2. Verify token: `f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202`

### 6. Test It!

**Test Messenger:**
- Send message to your Facebook Page: "How much for a wedding?"
- Check `/admin/instagram` dashboard
- Verify contact created

**Test Instagram:**
- DM your Instagram: "Are you available?"
- Check dashboard
- Verify contact created

---

## 🔧 Troubleshooting

### "Callback URL couldn't be validated"

**This means:**
- Your webhook endpoint isn't deployed yet, OR
- Environment variables aren't set in Vercel, OR
- Wrong verify token

**Fix:**
1. Wait for Vercel deploy to complete
2. Make sure environment variables are added
3. Try "Verify and Save" again

### "No fields subscribed"

**This means:**
- You need to click "Add Subscriptions"
- Check the boxes for events you want
- Click Save

---

## 📱 Your Current Tokens:

```bash
# Save these - you'll need them!
MESSENGER_VERIFY_TOKEN=4dc7fdb1e875ce0c8b97570e2c7b9d3d12545c23038e3f7fc88a4cf855988616
INSTAGRAM_VERIFY_TOKEN=f46e19ef1587bf5f6800224810eb48f354ad225958941197a4d186d2c4444202
```

**Still need from Meta:**
- [ ] FACEBOOK_PAGE_ACCESS_TOKEN (from "Generate" button)
- [ ] INSTAGRAM_ACCESS_TOKEN (from Instagram settings)

---

## 🎯 Next Steps Right Now:

1. **Click "Add Subscriptions"** on M10 DJ Company page
2. **Click "Generate"** to get page access token  
3. **Go to "Instagram settings"** in left sidebar
4. **Generate Instagram token**
5. **Add all 4 tokens to Vercel**
6. **Wait for auto-deploy** (or redeploy)
7. **Come back to Meta** and verify webhooks

You're almost there! 🚀

