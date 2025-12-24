# 🚀 Bidding System Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Environment Variables
Add these to your Vercel project settings:

```bash
# Required for cron job authentication
CRON_SECRET=your-secure-random-string-here

# Required for Stripe webhooks
STRIPE_WEBHOOK_SECRET=whsec_xxx (from Stripe Dashboard)

# Required for email notifications
RESEND_API_KEY=re_xxx (from Resend dashboard)

# Required for admin alerts
ADMIN_EMAIL=your-admin@email.com
EMERGENCY_CONTACT_EMAIL=backup@email.com (optional)
```

### 2. Stripe Webhook Configuration
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
5. Copy the "Signing secret" (starts with `whsec_`)
6. Add it as `STRIPE_WEBHOOK_SECRET` in Vercel

### 3. Set Up External Cron Job (REQUIRED)
**⚠️ Vercel free tier only allows 2 cron jobs (once per day max). We need every minute!**

**Use external cron service (cron-job.org recommended):**
- ✅ Sign up at [cron-job.org](https://cron-job.org) (free)
- ✅ Create cron job pointing to: `https://yourdomain.com/api/cron/process-bidding-rounds`
- ✅ Schedule: Every minute (`* * * * *`)
- ✅ Add header: `Authorization: Bearer YOUR_CRON_SECRET`
- ✅ `CRON_SECRET` is set in Vercel environment variables
- ✅ Test the cron job manually

**See `EXTERNAL_CRON_SETUP.md` for detailed step-by-step instructions.**

## 🧪 Testing Checklist

### Test Bidding Flow
- [ ] Create a test bidding round
- [ ] Place a test bid (use Stripe test card: `4242 4242 4242 4242`)
- [ ] Verify bid appears in admin dashboard
- [ ] Wait for round to end (or manually trigger cron)
- [ ] Verify winner is charged
- [ ] Verify losing bidders' authorizations are released
- [ ] Verify winner receives email notification
- [ ] Verify losers receive email notifications
- [ ] Verify admin receives alerts on failures

### Test Error Handling
- [ ] Test with expired payment intent
- [ ] Test with failed payment
- [ ] Test manual reprocess button
- [ ] Verify admin gets alerts

### Test Webhook
- [ ] Use Stripe CLI to send test webhook: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] Trigger test events and verify they're handled

## 📋 Post-Deployment Verification

1. **Check Cron Job Logs**
   - Go to Vercel Dashboard → Functions
   - Check `/api/cron/process-bidding-rounds` logs
   - Verify it runs every minute

2. **Check Webhook Logs**
   - Go to Stripe Dashboard → Webhooks
   - Check delivery logs for your endpoint
   - Verify events are being received

3. **Test Notifications**
   - Place a test bid with a real email
   - Verify emails are received

4. **Monitor Admin Dashboard**
   - Check `/admin/bidding-rounds` for any stuck rounds
   - Use "Reprocess Round" button if needed

## 🆘 Troubleshooting

### Cron Job Not Running
- Check Vercel logs for errors
- Verify `CRON_SECRET` is set
- Check Vercel cron configuration

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check Stripe webhook delivery logs
- Verify endpoint URL is correct

### Notifications Not Sending
- Check `RESEND_API_KEY` is set
- Verify email addresses are valid
- Check Resend dashboard for delivery status

### Payments Not Charging
- Check Stripe dashboard for payment intent status
- Verify payment intents are in `requires_capture` state
- Check cron job logs for errors
- Use manual reprocess button if needed

## 📞 Support

If issues persist:
1. Check Vercel function logs
2. Check Stripe dashboard for payment status
3. Check Resend dashboard for email delivery
4. Review admin email alerts for error details

