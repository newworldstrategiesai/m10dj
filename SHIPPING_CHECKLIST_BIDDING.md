# 🚀 Bidding System Shipping Checklist

## ✅ Critical Environment Variables

Verify these are set in **Vercel Production**:

- [ ] `CRON_SECRET` - Set and matches cron-job.org header
- [ ] `STRIPE_SECRET_KEY` - Production Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook signing secret (starts with `whsec_`)
- [ ] `RESEND_API_KEY` - For email notifications (starts with `re_`)
- [ ] `ADMIN_EMAIL` - Admin email for alerts
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production service role key

**Quick Test:**
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://www.m10djcompany.com/api/cron/process-bidding-rounds
```
Should return: `{"success":true,"message":"No ended rounds","processed":0}`

---

## ✅ Stripe Webhook Configuration

### Production Webhook Setup:
- [ ] Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
- [ ] Create endpoint: `https://www.m10djcompany.com/api/webhooks/stripe`
- [ ] Select events:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
  - [ ] `payment_intent.canceled`
- [ ] Copy signing secret (starts with `whsec_`)
- [ ] Add as `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] Test webhook delivery (Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries)

**Test Webhook:**
```bash
# Use Stripe CLI to test
stripe listen --forward-to https://www.m10djcompany.com/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

---

## ✅ External Cron Job (cron-job.org)

- [ ] Job is **Active** (green toggle)
- [ ] URL: `https://www.m10djcompany.com/api/cron/process-bidding-rounds`
- [ ] Schedule: Every minute (`* * * * *`)
- [ ] Header: `Authorization: Bearer YOUR_CRON_SECRET`
- [ ] Execution history shows `200 OK` responses
- [ ] No `401 Unauthorized` errors in history

**Verify:**
1. Go to cron-job.org dashboard
2. Click "Run now" on your job
3. Check execution history - should show `200 OK`
4. Check Vercel logs - should see `🔄 Processing bidding rounds...`

---

## ✅ Database Migrations

Verify all migrations are applied in **Production Supabase**:

- [ ] `bidding_rounds` table exists
- [ ] `bid_history` table exists
- [ ] `crowd_requests` has `bidding_enabled`, `bidding_round_id`, `current_bid_amount` columns
- [ ] `music_service_links` JSONB column exists in `crowd_requests`
- [ ] All indexes are created
- [ ] RLS policies are set correctly

**Check:**
```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bidding_rounds', 'bid_history');

-- Check crowd_requests columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'crowd_requests' 
AND column_name IN ('bidding_enabled', 'bidding_round_id', 'current_bid_amount', 'music_service_links');
```

---

## ✅ Email Notifications

### Test Email Configuration:
- [ ] `RESEND_API_KEY` is set in Vercel
- [ ] Resend dashboard shows API key is active
- [ ] Test email sending works

**Test:**
1. Place a test bid
2. Wait for round to end
3. Verify winner receives email
4. Verify losers receive emails
5. Check Resend dashboard for delivery status

---

## ✅ End-to-End Bidding Flow Test

### Test Scenario 1: Complete Bidding Round
- [ ] Create a test bidding round via `/admin/bidding/dummy-data`
- [ ] Place a test bid (use Stripe test card: `4242 4242 4242 4242`)
- [ ] Verify bid appears in admin dashboard (`/admin/crowd-requests`)
- [ ] Verify bid appears in bid history modal
- [ ] Wait for round to end (or manually trigger cron)
- [ ] Verify winner is charged (check Stripe dashboard)
- [ ] Verify losing bidders' authorizations are released
- [ ] Verify round status changes to `completed` in database
- [ ] Verify winner receives email notification
- [ ] Verify losers receive email notifications

### Test Scenario 2: Multiple Bids
- [ ] Create round with multiple bidders
- [ ] Place bids with different amounts
- [ ] Verify highest bidder wins
- [ ] Verify all losing bids are refunded
- [ ] Verify all notifications are sent

### Test Scenario 3: Payment Failure
- [ ] Create round with a bid that will fail payment
- [ ] Wait for round to end
- [ ] Verify system attempts to charge next highest bidder
- [ ] Verify admin receives failure alert email
- [ ] Verify round can be manually reprocessed

---

## ✅ Admin UI Functionality

### Bidding Rounds Admin (`/admin/bidding-rounds`)
- [ ] Can view all bidding rounds
- [ ] Can see round status, end time, winner
- [ ] "Reprocess Round" button works for stuck rounds
- [ ] Real-time updates work (rounds refresh automatically)

### Crowd Requests Admin (`/admin/crowd-requests`)
- [ ] Can toggle between "All", "Requests", and "Bids" views
- [ ] Bidding requests show "Bidding" badge
- [ ] Can view bid history for each request
- [ ] "Charge Winning Bid" button works
- [ ] "Cancel Authorization" button works
- [ ] Music service links display correctly
- [ ] "Find Music Links" button works

### Dummy Data Admin (`/admin/bidding/dummy-data`)
- [ ] Can create dummy song requests
- [ ] Can copy/paste JSON or CSV
- [ ] Can upload file
- [ ] Preview shows correctly
- [ ] Requests are added to active round

---

## ✅ User-Facing Features

### Bidding Interface (`/bid`)
- [ ] Page loads correctly
- [ ] Shows current winning bid
- [ ] Bid amount selector works (preset and custom)
- [ ] Custom amount input validates correctly (must be > winning bid)
- [ ] Submit button enables/disables correctly
- [ ] Bid submission works
- [ ] Success modal shows after bid
- [ ] Real-time bid updates work
- [ ] Album art displays correctly
- [ ] Song autocomplete works
- [ ] Music link extraction works (Spotify, YouTube, etc.)

### Requests Page (`/requests`)
- [ ] Bidding mode activates when enabled
- [ ] Shows bidding context banner
- [ ] Unified song name/link input works
- [ ] Album art displays correctly
- [ ] Autocomplete works
- [ ] Music link extraction works

---

## ✅ Error Handling & Recovery

### Test Error Scenarios:
- [ ] **Stripe API failure**: Verify admin gets alert email
- [ ] **Database connection failure**: Verify graceful error handling
- [ ] **Email sending failure**: Verify doesn't block round processing
- [ ] **Cron job failure**: Verify round can be manually reprocessed
- [ ] **Webhook failure**: Verify payment status still updates via cron

### Manual Recovery:
- [ ] "Reprocess Round" button works (`/admin/bidding-rounds`)
- [ ] "Charge Winning Bid" button works (`/admin/crowd-requests`)
- [ ] "Cancel Authorization" button works (`/admin/crowd-requests`)

---

## ✅ Security & Authentication

- [ ] Cron endpoint requires `CRON_SECRET` (returns 401 without it)
- [ ] Webhook endpoint verifies Stripe signature
- [ ] Admin endpoints require authentication (`requireAdmin`)
- [ ] User-facing endpoints don't expose sensitive data
- [ ] RLS policies prevent cross-organization data access

**Test:**
```bash
# Should return 401
curl https://www.m10djcompany.com/api/cron/process-bidding-rounds

# Should return 401
curl -H "Authorization: Bearer wrong-secret" \
  https://www.m10djcompany.com/api/cron/process-bidding-rounds
```

---

## ✅ Performance & Monitoring

### Vercel Function Logs:
- [ ] Check `/api/cron/process-bidding-rounds` logs
- [ ] Verify no excessive errors
- [ ] Verify function completes within timeout (10s default)
- [ ] Check function execution time (should be < 5s typically)

### Database Performance:
- [ ] Queries complete quickly (< 1s)
- [ ] No N+1 query issues
- [ ] Indexes are being used

### Real-time Updates:
- [ ] Bidding interface updates smoothly
- [ ] No excessive re-renders
- [ ] No memory leaks

---

## ✅ Production Readiness

### Final Checks:
- [ ] All environment variables are set in **Production** (not just Preview)
- [ ] Stripe is in **Production mode** (not test mode)
- [ ] All database migrations are applied to **Production** database
- [ ] cron-job.org job is pointing to **Production** URL
- [ ] Stripe webhook is pointing to **Production** URL
- [ ] No console errors in browser
- [ ] No TypeScript/build errors
- [ ] All tests pass (if you have tests)

### Documentation:
- [ ] `EXTERNAL_CRON_SETUP.md` is up to date
- [ ] `DEPLOYMENT_CHECKLIST_BIDDING.md` is up to date
- [ ] Team knows how to monitor and troubleshoot

---

## 🧪 Final Integration Test

**Complete End-to-End Test:**

1. **Create Test Round:**
   - Go to `/admin/bidding/dummy-data`
   - Create 3-5 dummy song requests
   - Verify they appear in active round

2. **Place Test Bids:**
   - Go to `/bid`
   - Place bids with different amounts (use test cards)
   - Verify bids appear in admin dashboard

3. **Wait for Round to End:**
   - Either wait naturally or manually end round in database
   - Cron job should process within 1-2 minutes

4. **Verify Results:**
   - Check Stripe dashboard: Winner charged, losers refunded
   - Check database: Round status = `completed`
   - Check emails: Winner and losers received notifications
   - Check admin dashboard: Round shows as completed

5. **Test Manual Recovery:**
   - If anything fails, use "Reprocess Round" button
   - Verify it works correctly

---

## 🎉 Ready to Ship Checklist

- [ ] All critical environment variables set
- [ ] Stripe webhook configured and tested
- [ ] Cron job running and verified
- [ ] End-to-end test completed successfully
- [ ] Admin UI fully functional
- [ ] User-facing features working
- [ ] Error handling tested
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Documentation complete

**If all items are checked, you're ready to ship! 🚀**

---

## 🆘 If Something Fails

1. **Check Vercel Function Logs** - Most errors will show here
2. **Check Stripe Dashboard** - Payment status and webhook deliveries
3. **Check Resend Dashboard** - Email delivery status
4. **Check cron-job.org** - Execution history
5. **Check Database** - Round status, bid history
6. **Review Admin Email Alerts** - System will email you on critical failures

