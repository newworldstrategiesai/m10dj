# 🧪 Testing the Bidding Rounds Cron Job

## Step 1: Verify CRON_SECRET in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings → Environment Variables**
4. Verify `CRON_SECRET` exists and matches: `f26cb6f8bccddac242fe175d212c3fc85a1467d07474d598018c526ae676c91c`
5. If missing, add it and **redeploy**

---

## Step 2: Wait for Deployment

Check Vercel deployment status:
- Go to **Deployments** tab
- Wait for latest deployment to show "Ready" (green checkmark)
- Usually takes 1-2 minutes

---

## Step 3: Test the Endpoint Manually

### Option A: Using curl (Terminal)
```bash
curl -X GET "https://www.m10djcompany.com/api/cron/process-bidding-rounds" \
  -H "Authorization: Bearer f26cb6f8bccddac242fe175d212c3fc85a1467d07474d598018c526ae676c91c" \
  -v
```

**Expected Response:**
- Status: `200 OK`
- Body: `{"success":true,"processed":0,"errors":0,"roundsProcessed":0}` (if no rounds to process)

### Option B: Using Browser (with extension)
Install a browser extension like "ModHeader" or "Header Editor"
- Add header: `Authorization: Bearer f26cb6f8bccddac242fe175d212c3fc85a1467d07474d598018c526ae676c91c`
- Visit: `https://www.m10djcompany.com/api/cron/process-bidding-rounds`

---

## Step 4: Check cron-job.org

1. Go to [cron-job.org dashboard](https://cron-job.org)
2. Find your "Bidding Rounds Processor" job
3. Click on it to view details
4. Check **"Execution history"** tab
5. Should show recent executions with status codes

**What to look for:**
- ✅ Status: `200 OK` = Working!
- ❌ Status: `401 Unauthorized` = CRON_SECRET mismatch
- ❌ Status: `404 Not Found` = Wrong URL
- ❌ Status: `500 Error` = Check Vercel logs

---

## Step 5: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Find `/api/cron/process-bidding-rounds`
4. Click on it
5. Check **Logs** tab

**What to look for:**
- `🔄 Processing bidding rounds...` = Function is being called
- `✅ No ended rounds to process` = Working, just no rounds to process
- `📊 Processing X ended round(s)` = Found rounds to process
- `❌ Error...` = Something went wrong

---

## Step 6: Test with a Real Bidding Round

### Create a Test Round:
1. Go to `/admin/bidding/dummy-data`
2. Create some dummy song requests
3. Wait for a round to end (or manually end one)
4. Check if it gets processed automatically

### Or Manually Trigger Processing:
1. Go to `/admin/bidding-rounds`
2. Find a round that has ended but shows "active"
3. Click **"Reprocess Round"** button
4. Verify it processes successfully

---

## ✅ Success Indicators

- [ ] Manual curl test returns `200 OK`
- [ ] cron-job.org shows `200 OK` in execution history
- [ ] Vercel logs show function being called
- [ ] No errors in Vercel logs
- [ ] Rounds are being processed automatically

---

## 🆘 Troubleshooting

### 401 Unauthorized
- **Fix:** Verify CRON_SECRET matches in both places
- **Check:** Vercel environment variable is set correctly
- **Check:** cron-job.org header has correct format: `Bearer SECRET`

### 404 Not Found
- **Fix:** Verify URL is correct: `https://www.m10djcompany.com/api/cron/process-bidding-rounds`
- **Check:** Deployment is complete

### 500 Error
- **Check:** Vercel function logs for specific error
- **Check:** Environment variables are all set (STRIPE_SECRET_KEY, SUPABASE keys, etc.)

### Cron not running
- **Check:** cron-job.org job is "Active" (green toggle)
- **Check:** Schedule is set to "Every minute"
- **Check:** Execution history shows recent attempts

---

## 📊 Monitoring

After setup, monitor:
- **cron-job.org** → Execution history (should show every minute)
- **Vercel** → Functions → Logs (should see processing logs)
- **Admin Dashboard** → Bidding Rounds (should see rounds completing)

