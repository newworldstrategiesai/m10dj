# 📧 Follow-Up Walkthrough System - Setup Guide

## Overview

This system automatically sends personalized follow-up emails/SMS to leads who viewed pricing on their quote page but didn't make a selection. After 2-3 days, they receive an interactive walkthrough guide to help them choose the perfect package.

## 🎯 Features

1. **Automatic Tracking**: Tracks when leads view pricing without making a selection
2. **Scheduled Follow-Ups**: Sends follow-up 2-3 days after viewing
3. **Interactive Walkthrough**: Personalized guide with questions to recommend the perfect package
4. **Smart Recommendations**: AI-powered package suggestions based on answers
5. **Email & SMS**: Multi-channel follow-up delivery

## 📋 Setup Steps

### 1. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Run this file in Supabase SQL Editor
database/followup-system-schema.sql
```

This creates:
- `quote_page_views` - Tracks quote page views
- `followup_sent` - Prevents duplicate follow-ups
- `quote_analytics` - General analytics tracking

### 2. Environment Variables

Add to your `.env.local`:

```env
# Cron job secret (for scheduled follow-ups)
CRON_SECRET=your-secret-key-here

# Existing variables (should already be set)
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
RESEND_API_KEY=your-resend-key
ADMIN_PHONE_NUMBER=your-phone-number
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### 3. Set Up Cron Job

You need to call the follow-up check endpoint daily. Options:

#### Option A: Vercel Cron Jobs (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/followups/check-and-send",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### Option B: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free)

Set up to call:
```
POST https://m10djcompany.com/api/followups/check-and-send
Headers:
  x-cron-secret: your-secret-key-here
```

Schedule: Daily at 10 AM (or your preferred time)

### 4. Test the System

1. **Test Tracking**:
   - Visit a quote page: `/quote/[id]`
   - Don't make a selection
   - Check Supabase `quote_page_views` table - should see entry

2. **Test Follow-Up** (Manual):
   ```bash
   curl -X POST https://your-site.com/api/followups/check-and-send \
     -H "x-cron-secret: your-secret-key" \
     -H "Content-Type: application/json"
   ```

3. **Test Walkthrough**:
   - Visit: `/quote/[id]/walkthrough`
   - Answer questions
   - See package recommendation

## 🎨 How It Works

### Flow Diagram

```
1. Lead views quote page
   ↓
2. System tracks view (if no selection exists)
   ↓
3. 2-3 days later, cron job runs
   ↓
4. System checks for leads needing follow-up
   ↓
5. Sends email/SMS with walkthrough link
   ↓
6. Lead clicks link → Interactive walkthrough
   ↓
7. Answers questions → Gets package recommendation
   ↓
8. Clicks "View Package" → Returns to quote page
```

### Walkthrough Questions

The walkthrough asks 5 key questions:

1. **Event Size**: How many guests? (Small/Medium/Large/XLarge)
2. **Budget Range**: What's your budget? (Budget/Standard/Premium/Luxury)
3. **Priorities**: What matters most? (Sound quality, lighting, MC service, etc.)
4. **Event Type**: Wedding/Corporate/Party/School
5. **Timeline**: How long do you need services? (2-4hrs/4-6hrs/6+hrs)

### Package Recommendation Logic

Based on answers, the system recommends:
- **Essential Package**: Small events, budget-conscious
- **Standard Package**: Medium events, standard budget
- **Premium Package**: Large events, premium budget, multiple priorities

## 📧 Email Template

The follow-up email includes:
- Personalized greeting
- Explanation of the walkthrough
- Clear CTA button
- Phone number for direct contact
- Professional branding

## 🔧 Customization

### Adjust Follow-Up Timing

Edit `pages/api/followups/check-and-send.js`:

```javascript
// Change from 2-3 days to 3-4 days
const twoDaysAgo = new Date();
twoDaysAgo.setDate(twoDaysAgo.getDate() - 3); // Changed from 2
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 4); // Changed from 3
```

### Customize Questions

Edit `pages/quote/[id]/walkthrough.js` - modify the `questions` array.

### Customize Recommendations

Edit the `calculateRecommendation()` function in `walkthrough.js` to adjust package logic.

## 📊 Monitoring

### Check Follow-Ups Sent

```sql
SELECT 
  fs.*,
  c.first_name,
  c.email_address
FROM followup_sent fs
JOIN contacts c ON c.id = fs.contact_id
WHERE fs.followup_type = 'pricing_walkthrough'
ORDER BY fs.sent_at DESC;
```

### Check Leads Needing Follow-Up

```sql
SELECT 
  qpv.*,
  c.first_name,
  c.email_address
FROM quote_page_views qpv
JOIN contacts c ON c.id = qpv.contact_id
WHERE qpv.event_type = 'page_view'
  AND qpv.created_at < NOW() - INTERVAL '2 days'
  AND qpv.created_at > NOW() - INTERVAL '3 days'
  AND NOT EXISTS (
    SELECT 1 FROM quote_selections qs 
    WHERE qs.contact_id = qpv.contact_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM followup_sent fs 
    WHERE fs.contact_id = qpv.contact_id 
    AND fs.followup_type = 'pricing_walkthrough'
  );
```

## 🚀 Next Steps

1. ✅ Run database schema
2. ✅ Set up environment variables
3. ✅ Configure cron job
4. ✅ Test the system
5. ✅ Monitor first follow-ups
6. ✅ Adjust timing/questions based on results

## 💡 Tips

- **Best Time to Send**: 10 AM - 2 PM (when people check email)
- **Follow-Up Frequency**: Only once per lead (prevents spam)
- **A/B Testing**: Try different email subject lines
- **Track Results**: Monitor click-through rates on walkthrough links

## 🐛 Troubleshooting

**Follow-ups not sending?**
- Check cron job is running
- Verify `CRON_SECRET` matches
- Check Supabase tables exist
- Review server logs

**Walkthrough not working?**
- Verify quote ID is valid
- Check lead data exists
- Review browser console for errors

**Recommendations seem off?**
- Adjust `calculateRecommendation()` logic
- Test with different answer combinations
- Review package tiers in your system

