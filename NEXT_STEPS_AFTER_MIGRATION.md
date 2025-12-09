# Next Steps After Migration

## ✅ Migration Complete!

The `questionnaire_submission_log` table has been created. Here's what to do next:

## 1. Verify Migration Success

### Option A: Run Test Script
```bash
node scripts/test-questionnaire-submission.js
```

This will:
- ✅ Check if table exists
- ✅ Verify table structure
- ✅ Count existing logs
- ✅ Find any failed submissions
- ✅ Find any unverified submissions

### Option B: Check in Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Look for `questionnaire_submission_log` table
4. Verify it has all the columns from the migration

## 2. Test the System

### Test 1: Normal Submission
1. Go to a questionnaire page (e.g., `/quote/[leadId]/questionnaire`)
2. Fill out the questionnaire
3. Submit it
4. Check the audit log:
   ```sql
   SELECT * FROM questionnaire_submission_log 
   WHERE lead_id = 'YOUR_LEAD_ID' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

### Test 2: Verify Logging Works
After a submission, check:
- ✅ Log entry created with status 'attempted'
- ✅ Log updated with status 'success' or 'failed'
- ✅ Request data stored in `request_data` column
- ✅ Response data stored in `response_data` column

### Test 3: Test Failure Scenario
1. Open browser dev tools
2. Go to Network tab
3. Set throttling to "Offline"
4. Try to submit questionnaire
5. Check:
   - ✅ Error logged in audit table
   - ✅ Admin receives alert (if configured)
   - ✅ Local storage kept (data not lost)

## 3. Check for Existing Issues

### Find Failed Submissions
```sql
SELECT 
  id,
  lead_id,
  submission_status,
  error_type,
  error_message,
  created_at,
  request_data
FROM questionnaire_submission_log 
WHERE submission_status = 'failed'
ORDER BY created_at DESC;
```

### Find Unverified Submissions
```sql
SELECT 
  id,
  lead_id,
  submission_status,
  verification_status,
  created_at
FROM questionnaire_submission_log 
WHERE submission_status = 'success' 
  AND verification_status = 'pending'
ORDER BY created_at DESC;
```

## 4. Recover Lost Submissions (If Any)

If you find failed submissions in the audit log, you can recover them:

### Option A: Use API Endpoint
```bash
# Get submission data
curl http://localhost:3000/api/admin/questionnaire-submissions?status=failed
```

### Option B: Manual Recovery
1. Query the audit log for the failed submission
2. Extract `request_data` from the log entry
3. Use the data to manually create/update the questionnaire

## 5. Monitor the System

### Set Up Monitoring Queries

**Daily Failed Submissions**:
```sql
SELECT COUNT(*) as failed_count
FROM questionnaire_submission_log 
WHERE submission_status = 'failed' 
  AND created_at >= CURRENT_DATE;
```

**Success Rate**:
```sql
SELECT 
  submission_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM questionnaire_submission_log
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY submission_status;
```

## 6. Configure Admin Alerts

Make sure admin notifications are configured:

1. **SMS Alerts**: Set `ADMIN_PHONE_NUMBER` in environment variables
2. **Email Alerts**: Set `ADMIN_EMAIL` in environment variables
3. **Twilio**: Configure Twilio credentials for SMS (optional)

Test by triggering a failure (see Test 3 above) and verify you receive alerts.

## 7. Create Recovery Dashboard (Optional)

You can create an admin page to view and recover failed submissions:

1. Create page: `pages/admin/questionnaire-recovery.js`
2. Use API: `/api/admin/questionnaire-submissions?status=failed`
3. Display failed submissions with recovery options

## 8. Verify Everything Works

### Checklist:
- [ ] Migration applied successfully
- [ ] Table exists and has correct structure
- [ ] Test submission creates log entry
- [ ] Failed submission creates log entry with error
- [ ] Admin receives alerts on failure
- [ ] Verification endpoint works
- [ ] Client-side verification works
- [ ] Local storage kept until verified

## 9. Monitor Going Forward

### Daily Checks:
- Check for failed submissions
- Review error types
- Monitor success rate

### Weekly Reviews:
- Analyze failure patterns
- Review recovery needs
- Update error handling if needed

## 🎯 Quick Test Commands

```bash
# Test the API endpoint
curl http://localhost:3000/api/admin/questionnaire-submissions?status=failed

# Test verification endpoint (replace with real leadId)
curl -X POST http://localhost:3000/api/questionnaire/verify \
  -H "Content-Type: application/json" \
  -d '{"leadId": "YOUR_LEAD_ID"}'
```

## 📊 Useful SQL Queries

**Recent Activity**:
```sql
SELECT 
  submission_status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM questionnaire_submission_log
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY submission_status;
```

**Error Breakdown**:
```sql
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(created_at) as latest_error
FROM questionnaire_submission_log
WHERE submission_status = 'failed'
GROUP BY error_type
ORDER BY count DESC;
```

**Recovery Candidates**:
```sql
SELECT 
  l.id,
  l.lead_id,
  l.created_at,
  l.error_message,
  c.first_name,
  c.last_name,
  c.email_address
FROM questionnaire_submission_log l
LEFT JOIN contacts c ON c.id = l.lead_id
WHERE l.submission_status = 'failed'
  AND l.created_at >= NOW() - INTERVAL '7 days'
ORDER BY l.created_at DESC;
```

## 🚨 If Something's Not Working

1. **Check logs**: Look at server logs for errors
2. **Verify env vars**: Make sure all required env vars are set
3. **Test endpoints**: Use curl or Postman to test APIs directly
4. **Check database**: Verify table exists and has data
5. **Review code**: Check for any syntax errors in modified files

## 📝 Notes

- The audit log will grow over time - consider archiving old logs periodically
- Failed submissions are recoverable as long as they're in the audit log
- Admin alerts require proper configuration (SMS/Email)
- Verification adds a small delay but ensures data integrity

