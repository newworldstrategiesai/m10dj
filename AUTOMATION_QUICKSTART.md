# Automation System - Quick Start

## 🚀 5-Minute Setup

### Step 1: Run Migration
```bash
cd /Users/benmurray/m10dj
supabase db push
```

### Step 2: Add to `.env.local`
```bash
# Get your Google Place ID: https://developers.google.com/maps/documentation/places/web-service/place-id
GOOGLE_PLACE_ID=ChIJxxxxxxxxxxxxx

# Your name for email signatures
OWNER_NAME="Ben Murray"

# Your calendar booking link
NEXT_PUBLIC_CALENDAR_LINK=https://calendly.com/m10djcompany
```

### Step 3: Deploy to Vercel
```bash
git add .
git commit -m "Add automation system"
git push origin main
```

Cron job will auto-deploy and run every 15 minutes! ✅

---

## 💡 How to Use

### When Event is Complete
```javascript
// Call this API when event finishes
await fetch('/api/automation/trigger-event-complete', {
  method: 'POST',
  body: JSON.stringify({ eventId: 'uuid-here' })
});

// This schedules:
// ✅ Thank you + review request (48 hours)
// ✅ Reminder 1 (7 days)
// ✅ Reminder 2 (14 days with $10 gift card)
```

### When New Lead Comes In
```javascript
// Call this for new inquiries
await fetch('/api/automation/trigger-lead', {
  method: 'POST',
  body: JSON.stringify({ contactId: 'uuid-here' })
});

// This schedules:
// ✅ Follow-up 1 (3 days)
// ✅ Follow-up 2 (7 days)
```

### When Review is Received
```javascript
// Cancels pending reminders
await fetch('/api/automation/mark-review-complete', {
  method: 'POST',
  body: JSON.stringify({ contactId: 'uuid-here' })
});
```

---

## 📊 Monitor Progress

Visit: **`/admin/automation`**

You'll see:
- 📧 Emails scheduled and sent
- ⭐ Reviews collected
- 📈 Conversion rate
- ⏰ Upcoming automations

---

## 🎯 Expected Results

**Current State:**
- 22 reviews
- Manual follow-ups
- Inconsistent review collection

**With Automation (90 days):**
- 50+ reviews (28 new)
- 25-35% review conversion rate
- $0 spent on review collection
- 2-3 reviews per week automatically

**ROI:**
- Cost: $0 (automated)
- Each review = ~$2,000 in future bookings
- 28 new reviews = **$56,000 in potential revenue**

---

## 📝 Quick Commands

**Process queue manually:**
```bash
curl -X POST https://yourdomain.com/api/automation/process-queue
```

**Check pending automations:**
```sql
SELECT * FROM automation_queue 
WHERE status = 'pending' 
ORDER BY scheduled_for;
```

**See review stats:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE review_requested_at IS NOT NULL) as requested,
  COUNT(*) FILTER (WHERE review_completed) as completed
FROM contacts;
```

---

## 🎨 Customize Templates

Edit in Supabase dashboard:

```sql
-- Change email timing
UPDATE automation_templates 
SET delay_hours = 24  -- Instead of 48
WHERE template_name = 'post_event_thank_you';

-- Update email content
UPDATE automation_templates 
SET body_template = '<p>Your new template...</p>'
WHERE template_name = 'post_event_thank_you';
```

---

## ✅ Integration Checklist

- [ ] Migration run (`supabase db push`)
- [ ] Environment variables added
- [ ] Cron job configured (Vercel)
- [ ] Test event completion trigger
- [ ] Test lead trigger
- [ ] Check `/admin/automation` dashboard
- [ ] Verify first email sends
- [ ] Monitor conversion rate

---

## 🆘 Troubleshooting

**Emails not sending?**
- Check Gmail integration is connected
- Verify cron job is running (Vercel logs)
- Check automation_queue table for 'failed' status

**Want to stop reminders?**
```sql
UPDATE automation_queue 
SET status = 'cancelled'
WHERE contact_id = 'uuid-here' 
AND status = 'pending';
```

---

## 📚 Full Documentation

See **`AUTOMATION_SETUP.md`** for:
- Complete API reference
- Template customization
- Advanced integrations
- Monitoring queries
- Best practices

---

**You're automated!** 🎉

Your review collection is now hands-free. Watch the reviews roll in!

