# 🚀 Quick Start: cron-job.org Setup

## Step 1: Generate CRON_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -hex 32
```

Copy the output - you'll need it in steps 2 and 3.

---

## Step 2: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add new variable:
   - **Key:** `CRON_SECRET`
   - **Value:** (paste the secret from Step 1)
   - **Environment:** Production, Preview, Development (all)
4. Click "Save"
5. **Redeploy** your project for the variable to take effect

---

## Step 3: Create cron-job.org Account

1. Go to [https://cron-job.org](https://cron-job.org)
2. Click "Sign up" (top right)
3. Enter your email and password
4. Verify your email address

---

## Step 4: Create the Cron Job

1. After logging in, click **"Create cronjob"** (big green button)

2. Fill in the form:

   **Title:**
   ```
   Bidding Rounds Processor
   ```

   **Address (URL):**
   ```
   https://www.m10djcompany.com/api/cron/process-bidding-rounds
   ```
   *(Replace with your actual domain if different)*

   **Schedule:**
   - Click "Every minute" OR
   - Select "Cron expression" and enter: `* * * * *`

   **Request Method:**
   - Select: `GET` (simpler, works fine)

   **Request Headers:**
   - Click "Add Header"
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_CRON_SECRET_HERE`
   - *(Replace YOUR_CRON_SECRET_HERE with the secret from Step 1)*

   **Notifications:**
   - Optional: Add your email to get notified if cron fails

3. Click **"Create cronjob"**

---

## Step 5: Test It

1. In cron-job.org, find your new cron job
2. Click the **"Run now"** button (play icon)
3. Check the "Execution history" tab
4. Should show "200 OK" status

5. **Verify in Vercel:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on `/api/cron/process-bidding-rounds`
   - Check "Logs" tab
   - Should see: `🔄 Processing bidding rounds...`

---

## ✅ Verification Checklist

- [ ] CRON_SECRET is set in Vercel environment variables
- [ ] Vercel project has been redeployed (after adding CRON_SECRET)
- [ ] cron-job.org account created and verified
- [ ] Cron job created with correct URL
- [ ] Authorization header added with Bearer token
- [ ] Schedule set to "Every minute"
- [ ] Test run shows "200 OK"
- [ ] Vercel logs show the function is being called

---

## 🆘 Troubleshooting

### Getting 401 Unauthorized
- Check that CRON_SECRET in Vercel matches the one in cron-job.org header
- Make sure header format is: `Bearer YOUR_SECRET` (with space after Bearer)
- Verify Vercel project was redeployed after adding CRON_SECRET

### Cron job not running
- Check cron-job.org execution history
- Verify the URL is correct (no typos)
- Make sure cron job is "Active" (green toggle)

### Function not processing rounds
- Check Vercel function logs for errors
- Verify rounds have actually ended (check `ends_at` timestamp)
- Check that bidding is enabled for your organization

---

## 📝 Example Configuration

**cron-job.org Settings:**
```
Title: Bidding Rounds Processor
URL: https://www.m10djcompany.com/api/cron/process-bidding-rounds
Schedule: Every minute (* * * * *)
Method: GET
Header: Authorization: Bearer abc123def456... (your 64-char hex secret)
```

---

## 🎉 Done!

Once set up, the cron job will:
- Run every minute automatically
- Process any ended bidding rounds
- Charge winning bidders
- Send notifications
- Create new rounds

You can monitor it in:
- cron-job.org → Execution history
- Vercel Dashboard → Functions → Logs

