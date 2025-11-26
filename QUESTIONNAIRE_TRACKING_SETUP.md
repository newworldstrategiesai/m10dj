# Questionnaire Tracking and Reminder System

## Overview

This system tracks when questionnaires are started, completed, and reviewed, and automatically sends reminder emails to clients who haven't finished their questionnaires.

## Features

- **Started Tracking**: Records when a client first accesses the questionnaire
- **Completed Tracking**: Records when a client completes and submits the questionnaire
- **Reviewed Tracking**: Records each time a client views their questionnaire
- **Automatic Reminders**: Sends email reminders to clients with incomplete questionnaires
- **Reminder Limits**: Maximum of 3 reminders per questionnaire with smart scheduling

## Database Migration

First, run the migration to add the tracking fields:

```sql
-- Run this migration in your Supabase SQL editor
-- File: database/migrations/add_questionnaire_tracking.sql
```

This adds:
- `started_at`: Timestamp when questionnaire was first accessed
- `reviewed_at`: Timestamp when questionnaire was last viewed
- `last_reminder_sent_at`: Timestamp of last reminder sent
- `reminder_count`: Number of reminders sent

## API Endpoints

### 1. Get Questionnaire (Updated)
**Endpoint**: `GET /api/questionnaire/get?leadId={id}`

- Automatically sets `started_at` if this is the first access
- Updates `reviewed_at` each time the questionnaire is viewed
- Returns tracking timestamps in the response

### 2. Save Questionnaire (Updated)
**Endpoint**: `POST /api/questionnaire/save`

**Body**:
```json
{
  "leadId": "uuid",
  "isComplete": true,  // Set to true when submitting final review
  // ... other questionnaire fields
}
```

- Sets `started_at` on first save if not already set
- Sets `completed_at` when `isComplete: true`

### 3. Send Reminder (New)
**Endpoint**: `POST /api/questionnaire/send-reminder`

**Body**:
```json
{
  "leadId": "uuid",
  "manual": false  // Set to true for manual/admin-triggered reminders
}
```

Sends a personalized email reminder to the client with:
- Link to complete the questionnaire
- List of missing information
- Event date (if available)
- Professional, friendly tone

**Rate Limiting**: 
- Automatic reminders: Minimum 24 hours between reminders
- Manual reminders: No rate limiting

## Automatic Reminder Schedule

The cron job sends reminders based on this schedule:

1. **First Reminder**: 2 days after `started_at`
2. **Second Reminder**: 5 days after `started_at` (at least 2 days after first reminder)
3. **Third Reminder**: 10 days after `started_at` (at least 3 days after second reminder)
4. **Maximum**: 3 reminders per questionnaire

## Setting Up the Cron Job

### Option 1: Vercel Cron (Recommended)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/questionnaire-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

This runs daily at 10:00 AM UTC.

### Option 2: External Cron Service

Set up a cron job to call:
```
POST https://yourdomain.com/api/cron/questionnaire-reminders
Authorization: Bearer YOUR_CRON_SECRET
```

Schedule: Daily at your preferred time

### Environment Variables

Add to `.env.local`:

```env
# Required for cron job security
CRON_SECRET=your-secure-random-string-here

# Required for email reminders
RESEND_API_KEY=your-resend-api-key

# Required for site URLs in emails
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Manual Reminder Sending

You can manually trigger a reminder via API:

```javascript
const response = await fetch('/api/questionnaire/send-reminder', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    leadId: 'uuid-here',
    manual: true  // Bypasses rate limiting
  })
});
```

## Monitoring

The cron job returns statistics:

```json
{
  "success": true,
  "message": "Processed 5 questionnaires, sent 2 reminders",
  "results": {
    "checked": 5,
    "remindersSent": 2,
    "errors": []
  }
}
```

## Email Template

The reminder email includes:
- Personalized greeting with client's first name
- Event date (if available)
- List of missing information
- Direct link to questionnaire
- Professional branding
- Contact information

## Testing

1. **Test Started Tracking**: 
   - Access a questionnaire for the first time
   - Check database: `started_at` should be set

2. **Test Reviewed Tracking**:
   - View an existing questionnaire
   - Check database: `reviewed_at` should update

3. **Test Completion Tracking**:
   - Complete and submit questionnaire
   - Check database: `completed_at` should be set

4. **Test Reminder**:
   - Create an incomplete questionnaire
   - Wait 2+ days (or manually trigger)
   - Check email and database: `last_reminder_sent_at` and `reminder_count` should update

## Troubleshooting

### Reminders not sending
- Check `RESEND_API_KEY` is set
- Verify contact has `email_address`
- Check cron job logs for errors
- Verify `CRON_SECRET` matches in cron job and environment

### Tracking not working
- Verify migration was run successfully
- Check API responses for errors
- Verify database permissions

### Cron job not running
- Check Vercel cron configuration
- Verify `CRON_SECRET` in environment variables
- Check cron job endpoint is accessible
- Review Vercel function logs

