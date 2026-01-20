# 📱 Karaoke SMS Notifications Implementation

## Overview

Automatic SMS notifications for karaoke singers when they're next up or currently singing. Phone numbers are now required for all karaoke signups.

## Features

### ✅ Required Phone Numbers
- Phone number is now **required** (not optional) for all karaoke signups
- Validates phone number format (minimum 10 digits)
- Formats phone numbers for Twilio (E.164 format)

### ✅ Automatic Notifications
- **"Next Up" Notification**: Sent when status changes to `next`
- **"Currently Singing" Notification**: Sent when status changes to `singing` (optional)
- Prevents duplicate notifications (tracks if notification was sent)
- Stores notification errors for debugging

### ✅ Notification Tracking
- `next_up_notification_sent` - Boolean flag
- `next_up_notification_sent_at` - Timestamp
- `currently_singing_notification_sent` - Boolean flag
- `currently_singing_notification_sent_at` - Timestamp
- `sms_notification_error` - Error message if SMS fails

## Implementation

### Database Changes

**Migration**: `20260121000001_add_karaoke_sms_notifications.sql`
- Adds notification tracking columns
- Makes `singer_phone` required (NOT NULL)
- Adds indexes for notification queries

### API Updates

**`/api/karaoke/signup`**:
- Validates phone number is provided
- Validates phone number format (10+ digits)
- Returns error if phone number missing or invalid

**`/api/karaoke/update-status`**:
- Detects status changes to `next` or `singing`
- Sends SMS notifications automatically
- Tracks notification status in database
- Handles auto-advance with notifications

### Notification Messages

**Next Up Message**:
```
🎤 You're next up for karaoke!

Hi [Name]!

You're next in the queue. Get ready to sing:
"[Song Title]" by [Artist]

Head to the stage when the current performer finishes! 🎵
```

**Currently Singing Message**:
```
🎤 It's your turn!

Hi [Name]!

You're up! Time to sing:
"[Song Title]" by [Artist]

Break a leg! 🎵
```

## Configuration

### Twilio Setup

Requires Twilio credentials in `.env.local`:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

**Note**: If Twilio is not configured, notifications are skipped gracefully (no errors).

## User Experience

### Sign-Up Flow
1. User enters phone number (required field)
2. Sees helper text: "We'll text you when you're next up! 📱"
3. Phone number validated before submission
4. Error shown if phone number invalid

### Notification Flow
1. DJ marks singer as "Next" in admin dashboard
2. System automatically sends SMS: "You're next up!"
3. Notification tracked in database (prevents duplicates)
4. If SMS fails, error stored for debugging

### Auto-Advance Flow
1. DJ marks current singer as "Completed"
2. If auto-advance enabled, next singer automatically marked as "Next"
3. Next singer receives SMS notification automatically
4. No manual intervention needed

## Error Handling

- **Missing Twilio Config**: Notifications skipped (no errors)
- **Invalid Phone Number**: Error stored, signup still created
- **SMS Send Failure**: Error stored in `sms_notification_error` field
- **Non-blocking**: Notification failures don't break status updates

## Admin Dashboard Integration

DJs can:
- See notification status in signup details
- See if SMS was sent successfully
- See error messages if SMS failed
- Manually resend notifications if needed (future feature)

## Future Enhancements

- [ ] Manual "Resend Notification" button in admin
- [ ] Notification preferences (opt-out option)
- [ ] Custom notification messages per organization
- [ ] SMS delivery status tracking
- [ ] Notification history log
- [ ] Reminder notifications (5 minutes before)

## Testing

### Test Scenarios
1. Sign up with valid phone number → Should succeed
2. Sign up without phone number → Should fail with error
3. Sign up with invalid phone (too short) → Should fail with error
4. Mark singer as "Next" → Should send SMS
5. Mark singer as "Next" again → Should NOT send duplicate SMS
6. Auto-advance enabled → Next singer should get SMS automatically

### Twilio Testing
- Use Twilio test credentials for development
- Test with real phone numbers in staging
- Monitor Twilio logs for delivery status
