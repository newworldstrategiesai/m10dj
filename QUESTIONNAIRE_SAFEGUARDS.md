# Questionnaire Submission Safeguards

## Problem
Users were losing their questionnaire data when submissions failed silently. The database showed "started" but had no actual data.

## Solutions Implemented

### 1. **Database-Backed Auto-Save** ✅
- Auto-saves to database every 3 seconds (not just localStorage)
- Falls back to localStorage if database save fails
- Shows visual status indicators (Saving... / Saved / Error)

### 2. **Manual Save Button** ✅
- Added "Save Now" button in the header
- Users can manually save their progress at any time
- Provides immediate feedback on save status

### 3. **Periodic Sync** ✅
- Every 30 seconds, attempts to sync localStorage data to database
- Ensures data is never lost even if auto-save temporarily fails
- Runs silently in the background

### 4. **Retry Logic** ✅
- API endpoint retries failed saves up to 3 times
- Handles network errors and connection issues
- Only retries on retryable errors (network, timeout)

### 5. **Failure Detection & Warnings** ✅
- Tracks consecutive auto-save failures
- Shows warning toast after 3 consecutive failures
- Guides users to use manual save button

### 6. **Pre-Submit Data Merge** ✅
- Before final submission, merges localStorage data with form data
- Ensures no data is lost between auto-saves
- Prioritizes current form data but includes localStorage backup

### 7. **Browser Warning** ✅
- Warns users before leaving page if there's unsaved data
- Prevents accidental data loss from closing tab/browser

### 8. **Enhanced Error Handling** ✅
- Detailed error messages in API responses
- Client-side validation before submission
- Clear feedback when saves fail

### 9. **Data Validation** ✅
- Validates leadId format (UUID)
- Verifies contact exists before saving
- Checks for meaningful data before warnings

## Files Modified

1. **`pages/quote/[id]/questionnaire.js`**
   - Added `saveQuestionnaireToDatabase()` function
   - Enhanced auto-save with database persistence
   - Added manual save button
   - Added periodic sync
   - Added browser warning
   - Enhanced submit handler with data merge

2. **`pages/api/questionnaire/save.js`**
   - Added retry logic (3 attempts)
   - Enhanced error messages
   - Better validation and error handling

## User Experience Improvements

- **Visual Feedback**: Users see "Saving...", "Saved", or "Error" status
- **Manual Control**: "Save Now" button for peace of mind
- **Automatic Recovery**: Periodic sync ensures data is never lost
- **Clear Warnings**: Users are warned if auto-save fails multiple times
- **Data Safety**: Multiple layers of backup (database + localStorage)

## Testing Recommendations

1. Test auto-save by filling out form and checking database
2. Test manual save button
3. Test with network disconnected (should fall back to localStorage)
4. Test periodic sync by waiting 30+ seconds
5. Test browser warning by trying to close tab with unsaved data
6. Test retry logic by temporarily breaking database connection

## Monitoring

- Check `autoSaveFailureCount` in browser console if issues occur
- Monitor API logs for retry attempts
- Check localStorage for backup data if database saves fail

