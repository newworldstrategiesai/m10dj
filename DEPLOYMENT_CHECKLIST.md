# Production Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migrations ⚠️ CRITICAL

Run these migrations in your Supabase SQL Editor **BEFORE** deploying:

#### Migration 1: Questionnaire Tracking
**File**: `database/migrations/add_questionnaire_tracking.sql`

```sql
-- Add tracking fields to music_questionnaires table
ALTER TABLE music_questionnaires 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_started_at ON music_questionnaires(started_at);
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_reviewed_at ON music_questionnaires(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_last_reminder_sent_at ON music_questionnaires(last_reminder_sent_at);
CREATE INDEX IF NOT EXISTS idx_music_questionnaires_incomplete 
ON music_questionnaires(lead_id) 
WHERE completed_at IS NULL AND started_at IS NOT NULL;
```

#### Migration 2: MC Introduction Field
**File**: `database/migrations/add_mc_introduction.sql`

```sql
-- Add MC introduction field to music_questionnaires table
ALTER TABLE music_questionnaires 
ADD COLUMN IF NOT EXISTS mc_introduction TEXT;
```

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration
3. Run them in order
4. Verify columns were added successfully

### 2. Environment Variables

Ensure these are set in your Vercel production environment:

#### Required for Questionnaire Reminders
```env
# Cron job security
CRON_SECRET=your-secure-random-string-here

# Email service (for reminders)
RESEND_API_KEY=your-resend-api-key

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=https://m10djcompany.com
```

#### Already Required (verify these exist)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# YouTube API (optional, for video embedding)
YOUTUBE_API_KEY=your-youtube-api-key
```

**How to set in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/verify each variable
3. Ensure they're set for "Production" environment

### 3. Vercel Cron Configuration

The cron job is already configured in `vercel.json`:
- **Questionnaire Reminders**: Runs daily at 11:00 AM UTC
- **Followups**: Runs daily at 10:00 AM UTC

Verify `vercel.json` is committed and will be deployed.

### 4. Code Review Checklist

✅ **New Features Added:**
- [x] Questionnaire tracking (started, completed, reviewed)
- [x] Automatic reminder system
- [x] MC Introduction question
- [x] "Start Over" button in questionnaire
- [x] "My Songs" navigation link
- [x] YouTube video embedding for song verification

✅ **API Endpoints Updated:**
- [x] `/api/questionnaire/get` - Added tracking
- [x] `/api/questionnaire/save` - Added tracking and MC introduction
- [x] `/api/questionnaire/send-reminder` - New endpoint
- [x] `/api/cron/questionnaire-reminders` - New cron job
- [x] `/api/youtube/search` - New endpoint for video search

✅ **Database Changes:**
- [x] Added tracking fields to `music_questionnaires`
- [x] Added `mc_introduction` field
- [x] Created indexes for performance

## Deployment Steps

### Step 1: Run Database Migrations
1. Open Supabase SQL Editor
2. Run `add_questionnaire_tracking.sql`
3. Run `add_mc_introduction.sql`
4. Verify no errors

### Step 2: Verify Environment Variables
1. Check Vercel environment variables
2. Ensure all required variables are set
3. Test that `CRON_SECRET` is set (required for cron job)

### Step 3: Deploy to Vercel
```bash
# If using Git:
git add .
git commit -m "Add questionnaire tracking, MC introduction, and reminder system"
git push origin main

# Vercel will automatically deploy
```

Or deploy manually:
```bash
vercel --prod
```

### Step 4: Post-Deployment Verification

#### Test Questionnaire Flow
1. ✅ Access a questionnaire - verify `started_at` is set
2. ✅ View questionnaire again - verify `reviewed_at` updates
3. ✅ Complete questionnaire - verify `completed_at` is set
4. ✅ Test MC Introduction question
5. ✅ Test "Start Over" button
6. ✅ Verify "My Songs" link appears in navigation

#### Test Reminder System
1. ✅ Create an incomplete questionnaire
2. ✅ Wait or manually trigger reminder via API:
   ```bash
   curl -X POST https://yourdomain.com/api/questionnaire/send-reminder \
     -H "Content-Type: application/json" \
     -d '{"leadId": "test-lead-id", "manual": true}'
   ```
3. ✅ Verify email is sent
4. ✅ Check database: `last_reminder_sent_at` and `reminder_count` updated

#### Test Cron Job
1. ✅ Wait for scheduled time OR trigger manually:
   ```bash
   curl -X GET https://yourdomain.com/api/cron/questionnaire-reminders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
2. ✅ Check logs for successful execution
3. ✅ Verify reminders were sent

#### Test My-Songs Page
1. ✅ Navigate to `/quote/[id]/my-songs`
2. ✅ Verify MC Introduction section appears
3. ✅ Verify YouTube thumbnails appear for songs
4. ✅ Test editing functionality

## Rollback Plan

If issues occur:

1. **Database Rollback** (if needed):
   ```sql
   -- Remove tracking fields (only if necessary)
   ALTER TABLE music_questionnaires 
   DROP COLUMN IF EXISTS started_at,
   DROP COLUMN IF EXISTS reviewed_at,
   DROP COLUMN IF EXISTS last_reminder_sent_at,
   DROP COLUMN IF EXISTS reminder_count,
   DROP COLUMN IF EXISTS mc_introduction;
   ```

2. **Code Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

## Monitoring

After deployment, monitor:

1. **Vercel Function Logs**
   - Check for errors in cron job execution
   - Monitor API endpoint errors

2. **Email Delivery**
   - Verify reminder emails are being sent
   - Check spam folders if clients report missing emails

3. **Database Performance**
   - Monitor query performance with new indexes
   - Check for any slow queries

4. **Error Tracking**
   - Monitor for any runtime errors
   - Check browser console for client-side errors

## Support Contacts

If issues arise:
- Check Vercel deployment logs
- Check Supabase logs
- Review error messages in browser console
- Check email service (Resend) dashboard for delivery issues

---

## Quick Reference

**Migration Files:**
- `database/migrations/add_questionnaire_tracking.sql`
- `database/migrations/add_mc_introduction.sql`

**New API Endpoints:**
- `POST /api/questionnaire/send-reminder`
- `GET /api/cron/questionnaire-reminders`
- `POST /api/youtube/search`

**Updated Files:**
- `pages/quote/[id]/questionnaire.js`
- `pages/quote/[id]/my-songs.js`
- `pages/api/questionnaire/get.js`
- `pages/api/questionnaire/save.js`
- `components/company/Header.js`
- `vercel.json`

**Documentation:**
- `QUESTIONNAIRE_TRACKING_SETUP.md`
- `DEPLOYMENT_CHECKLIST.md` (this file)

