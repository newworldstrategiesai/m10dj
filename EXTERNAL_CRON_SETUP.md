# 🔄 External Cron Setup for Bidding Rounds

## ⚠️ IMPORTANT: Vercel Free Tier Limitation

**Vercel's free (Hobby) tier only allows:**
- 2 cron jobs per account
- Each cron job can run **once per day maximum**

**Our bidding system needs to run EVERY MINUTE**, so we must use an external cron service.

## ✅ Solution: Use External Cron Service

We'll use a free external service to call our endpoint every minute.

### Recommended Services (Free):
1. **cron-job.org** (Recommended - Free, reliable)
2. **UptimeRobot** (Free tier: 50 monitors)
3. **EasyCron** (Free tier available)

---

## 📋 Setup Instructions: cron-job.org

### Step 1: Create Account
1. Go to [cron-job.org](https://cron-job.org)
2. Sign up for free account
3. Verify your email

### Step 2: Create Cron Job
1. Click "Create cronjob"
2. Fill in the details:

**Title:** `Bidding Rounds Processor`

**Address (URL):**
```
https://yourdomain.com/api/cron/process-bidding-rounds
```

**Schedule:**
- Select "Every minute"
- Or use cron expression: `* * * * *`

**Request Method:** `GET` or `POST` (both work)

**Request Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Where to get YOUR_CRON_SECRET:**
- Set this in Vercel environment variables as `CRON_SECRET`
- Use a strong random string (e.g., generate with: `openssl rand -hex 32`)

### Step 3: Test
1. Click "Run now" to test
2. Check Vercel function logs to verify it's working
3. Check that rounds are being processed

---

## 📋 Setup Instructions: UptimeRobot

### Step 1: Create Account
1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up for free account

### Step 2: Create Monitor
1. Click "Add New Monitor"
2. Select "HTTP(s)" type
3. Fill in:
   - **Friendly Name:** `Bidding Rounds Processor`
   - **URL:** `https://yourdomain.com/api/cron/process-bidding-rounds`
   - **Monitoring Interval:** 1 minute (minimum on free tier is 5 minutes - use cron-job.org instead)
   - **HTTP Method:** GET
   - **HTTP Headers:** 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

**Note:** UptimeRobot free tier minimum interval is 5 minutes, which is too slow. Use cron-job.org instead.

---

## 🔐 Security: CRON_SECRET

**IMPORTANT:** Always use the `CRON_SECRET` header to prevent unauthorized access.

1. Generate a secure secret:
   ```bash
   openssl rand -hex 32
   ```

2. Add to Vercel environment variables:
   - Variable: `CRON_SECRET`
   - Value: (the generated secret)

3. Add to your cron service:
   - Header: `Authorization`
   - Value: `Bearer YOUR_CRON_SECRET`

---

## ✅ Verification

After setup, verify it's working:

1. **Check cron service logs:**
   - cron-job.org: View execution history
   - Verify requests are being sent every minute

2. **Check Vercel logs:**
   - Go to Vercel Dashboard → Functions
   - Check `/api/cron/process-bidding-rounds` logs
   - Should see requests every minute

3. **Test with a bidding round:**
   - Create a test round
   - Wait for it to end
   - Verify it gets processed automatically

---

## 🆘 Troubleshooting

### Cron job not running
- Check cron service status
- Verify URL is correct
- Check `CRON_SECRET` matches in both places
- Check Vercel function logs for errors

### 401 Unauthorized errors
- Verify `CRON_SECRET` is set in Vercel
- Verify header format: `Authorization: Bearer YOUR_SECRET`
- Check for typos in the secret

### Rounds not processing
- Check Vercel function logs
- Verify cron is actually calling the endpoint
- Check that rounds have actually ended (check `ends_at` timestamp)

---

## 💡 Alternative: Upgrade to Vercel Pro

If you upgrade to Vercel Pro ($20/month):
- Unlimited cron jobs
- Can run every minute
- More reliable scheduling
- Better for production

But for now, external cron service works perfectly on free tier!
