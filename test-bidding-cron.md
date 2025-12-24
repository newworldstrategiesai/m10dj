# 🧪 Testing Bidding Rounds Cron Job

## ✅ Step 1: Endpoint is Working
The cron endpoint is responding correctly:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://www.m10djcompany.com/api/cron/process-bidding-rounds
```

Response: `{"success":true,"message":"No ended rounds","processed":0}`

---

## ✅ Step 2: Verify cron-job.org Setup

1. **Go to cron-job.org dashboard**
2. **Check your job status:**
   - Should be "Active" (green toggle)
   - Schedule: Every minute (`* * * * *`)
   - URL: `https://www.m10djcompany.com/api/cron/process-bidding-rounds`
   - Header: `Authorization: Bearer f26cb6f8bccddac242fe175d212c3fc85a1467d07474d598018c526ae676c91c`

3. **Check Execution History:**
   - Click on your job
   - Go to "Execution history" tab
   - Should show recent executions with `200 OK` status
   - If you see `401 Unauthorized`, check the header format

---

## ✅ Step 3: Check Vercel Function Logs

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Functions tab**
4. **Find `/api/cron/process-bidding-rounds`**
5. **Click on it → View Logs**

**What to look for:**
- `🔄 Processing bidding rounds...` - Function is being called
- `✅ No ended rounds to process` - Working correctly, just no rounds to process
- `📊 Processing X ended round(s)` - Found rounds to process
- `❌ Error...` - Something went wrong

---

## 🧪 Step 4: Test with a Real Bidding Round

### Option A: Create a Test Round via Admin UI

1. **Go to `/admin/bidding/dummy-data`**
2. **Create some dummy song requests**
3. **Wait for a round to end** (or manually end one in database)
4. **Check if it gets processed automatically**

### Option B: Create a Test Round via Database

```sql
-- Create a test bidding round that ends in 1 minute
INSERT INTO bidding_rounds (
  organization_id,
  round_number,
  started_at,
  ends_at,
  status
) VALUES (
  'YOUR_ORG_ID',
  999,
  NOW() - INTERVAL '5 minutes',
  NOW() + INTERVAL '1 minute',
  'active'
);

-- Add a test request to the round
INSERT INTO crowd_requests (
  organization_id,
  event_qr_code,
  request_type,
  song_title,
  song_artist,
  requester_name,
  requester_email,
  amount_requested,
  payment_status,
  bidding_enabled,
  bidding_round_id,
  current_bid_amount
) VALUES (
  'YOUR_ORG_ID',
  'TEST-EVENT',
  'song_request',
  'Test Song',
  'Test Artist',
  'Test User',
  'test@example.com',
  0,
  'pending',
  true,
  (SELECT id FROM bidding_rounds WHERE round_number = 999),
  500
);

-- Add a test bid
INSERT INTO bid_history (
  bidding_round_id,
  crowd_request_id,
  bidder_name,
  bidder_email,
  bid_amount,
  payment_intent_id,
  status
) VALUES (
  (SELECT id FROM bidding_rounds WHERE round_number = 999),
  (SELECT id FROM crowd_requests WHERE song_title = 'Test Song'),
  'Test Bidder',
  'bidder@example.com',
  500,
  'pi_test_123',
  'authorized'
);
```

**Then:**
- Wait 1-2 minutes for the round to end
- Check Vercel logs to see if it processed
- Check the database to see if the round status changed to 'completed'

---

## ✅ Step 5: Verify Processing Results

After a round ends and is processed, check:

1. **Database:**
   ```sql
   SELECT * FROM bidding_rounds 
   WHERE round_number = 999;
   ```
   - `status` should be `'completed'`
   - `processed_at` should be set
   - `winning_request_id` should be set

2. **Bid History:**
   ```sql
   SELECT * FROM bid_history 
   WHERE bidding_round_id = (SELECT id FROM bidding_rounds WHERE round_number = 999);
   ```
   - Winning bid should have `status = 'charged'`
   - Losing bids should have `status = 'refunded'`

3. **Email Notifications:**
   - Winner should receive email
   - Losers should receive email
   - Admin should receive email if there were errors

---

## 🆘 Troubleshooting

### Cron job not running
- **Check:** cron-job.org job is "Active"
- **Check:** Execution history shows attempts
- **Check:** Vercel logs show function calls

### Getting 401 Unauthorized
- **Check:** CRON_SECRET matches in Vercel and cron-job.org
- **Check:** Header format is exactly: `Bearer SECRET`

### Rounds not processing
- **Check:** Round `ends_at` is in the past
- **Check:** Round `status` is `'active'`
- **Check:** Round ended within last 2 minutes (cron checks last 2 minutes)
- **Check:** Vercel logs for errors

### Processing fails
- **Check:** Stripe credentials are set
- **Check:** Payment intents exist
- **Check:** Vercel function logs for specific errors

---

## 📊 Expected Behavior

- **Every minute:** cron-job.org calls the endpoint
- **If rounds ended:** They get processed (winners charged, losers refunded)
- **If no rounds:** Endpoint returns success with `processed: 0`
- **On errors:** Admin gets notified via email

