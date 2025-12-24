# 🧪 End-to-End Test Plan - Bidding System

## Test Scenario: Complete Bidding Round Flow

### Step 1: Create Test Bidding Round
**Action:**
1. Go to `https://www.m10djcompany.com/admin/bidding/dummy-data`
2. Create 3-5 dummy song requests
3. Verify they appear in the active round

**Expected Result:**
- Requests are created successfully
- They appear in `/admin/crowd-requests` with "Bidding" badge
- They appear in the active bidding round

---

### Step 2: Place Test Bids
**Action:**
1. Go to `https://www.m10djcompany.com/bid`
2. Place bids with different amounts:
   - Bid 1: $10.00 (use test card: `4242 4242 4242 4242`)
   - Bid 2: $15.00
   - Bid 3: $20.00 (should be the winner)
3. Use different test emails for each bid

**Expected Result:**
- Bids are placed successfully
- Each bid shows in admin dashboard
- Current winning bid updates in real-time
- Bid history shows all bids

---

### Step 3: Monitor Round End
**Action:**
1. Check when the round ends (look at `/admin/bidding-rounds`)
2. Wait 1-2 minutes after round ends
3. Check Vercel logs for processing

**Expected Result:**
- Cron job processes the round within 1-2 minutes
- Vercel logs show: `📊 Processing X ended round(s)`
- Round status changes to `completed`

---

### Step 4: Verify Payment Processing
**Action:**
1. Check Stripe Dashboard → Payments
2. Verify highest bidder was charged
3. Verify losing bidders' authorizations were released

**Expected Result:**
- Winner's payment intent shows as "Succeeded" or "Captured"
- Losing bids show as "Canceled" or "Released"
- All payment intents are in correct state

---

### Step 5: Verify Database Updates
**Action:**
1. Check `bidding_rounds` table:
   ```sql
   SELECT * FROM bidding_rounds 
   WHERE status = 'completed' 
   ORDER BY processed_at DESC 
   LIMIT 1;
   ```
2. Check `bid_history` table:
   ```sql
   SELECT * FROM bid_history 
   WHERE bidding_round_id = 'ROUND_ID'
   ORDER BY bid_amount DESC;
   ```

**Expected Result:**
- Round `status` = `'completed'`
- Round `processed_at` is set
- Round `winning_request_id` is set
- Winner bid has `payment_status` = `'charged'`
- Loser bids have `payment_status` = `'refunded'`

---

### Step 6: Verify Email Notifications
**Action:**
1. Check winner's email inbox
2. Check losers' email inboxes
3. Check Resend dashboard for delivery status

**Expected Result:**
- Winner receives "You Won!" email
- Losers receive "You Were Outbid" emails
- All emails delivered successfully (check Resend dashboard)

---

### Step 7: Verify Admin UI
**Action:**
1. Go to `/admin/bidding-rounds`
2. Verify round shows as "Completed"
3. Go to `/admin/crowd-requests`
4. Toggle to "Bids" view
5. Verify bidding requests show correct status

**Expected Result:**
- Round shows as completed with winner info
- Bidding requests show correct payment status
- "Charge Winning Bid" button works (if needed)
- "Cancel Authorization" button works (if needed)

---

## 🚨 Error Scenarios to Test

### Test 1: Payment Failure
**Action:**
1. Create a round with a bid that will fail (use card: `4000 0000 0000 0002`)
2. Wait for round to end
3. Verify system handles failure gracefully

**Expected Result:**
- System attempts to charge next highest bidder
- Admin receives failure alert email
- Round can be manually reprocessed

### Test 2: Manual Reprocess
**Action:**
1. Find a round that ended but wasn't processed
2. Click "Reprocess Round" button
3. Verify it processes correctly

**Expected Result:**
- Round processes successfully
- Payments are charged/refunded correctly
- Notifications are sent

---

## ✅ Success Criteria

All of these must pass:
- [ ] Bids can be placed successfully
- [ ] Round processes automatically when it ends
- [ ] Winner is charged correctly
- [ ] Losers' authorizations are released
- [ ] Winner receives email notification
- [ ] Losers receive email notifications
- [ ] Database is updated correctly
- [ ] Admin UI shows correct status
- [ ] No errors in Vercel logs
- [ ] No errors in Stripe dashboard

---

## 📊 Monitoring During Test

### Vercel Logs
Watch for:
- `🔄 Processing bidding rounds...`
- `📊 Processing X ended round(s)`
- `✅ Round processed successfully`
- `❌ Error...` (should not see this)

### Stripe Dashboard
Watch for:
- Payment intents changing status
- Successful charges
- Canceled authorizations

### Database
Watch for:
- Round status changing to `completed`
- Bid statuses updating
- `processed_at` timestamps being set

---

## 🎯 Quick Test (5 minutes)

If you want a quick test without waiting:

1. Create a test round with short duration (1-2 minutes)
2. Place 2-3 bids quickly
3. Wait for round to end
4. Check results immediately

This verifies the core flow works!

