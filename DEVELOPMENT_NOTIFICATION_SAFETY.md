# 🔒 Development Notification Safety

## Overview
The multi-inquiry system has built-in safeguards to prevent accidentally sending real emails, SMS, or phone calls to DJs during development and testing.

## Safety Features

### 1. Environment-Based Protection
- **Development Mode**: Notifications are automatically disabled when `NODE_ENV !== 'production'`
- **Manual Override**: Set `DISABLE_DJ_NOTIFICATIONS=true` in `.env.local` to disable notifications even in production (useful for testing)

### 2. Console Logging
During development, all notification attempts are logged to the console instead of being sent:
```
[NOTIFICATION SKIPPED - Development Mode] Would notify DJ {dj_id} about new inquiry {inquiry_id}
  - Inquiry details: {planner_name} ({planner_email}) - {event_type} on {event_date}
  - Lead score: {score} ({quality})
```

### 3. Current Implementation
The notification code is commented out with clear TODOs. When ready to enable:
1. Uncomment the notification code in `/app/api/djdash/multi-inquiry/route.ts`
2. Ensure `NODE_ENV=production` in production environment
3. Remove or set `DISABLE_DJ_NOTIFICATIONS=false` in production

## Testing Multi-Inquiries Safely

### What Works in Development:
✅ Creating multi-inquiry records in database  
✅ Creating individual DJ inquiry records  
✅ Availability checking  
✅ Lead scoring  
✅ All database operations  

### What's Disabled in Development:
❌ Real email notifications to DJs  
❌ Real SMS notifications to DJs  
❌ Real phone calls to DJs  

### How to Test:
1. Submit a form on any city page (e.g., `/djdash/cities/memphis`)
2. Check the console logs to see what notifications would have been sent
3. Verify database records are created correctly:
   - `multi_inquiries` table should have the parent record
   - `dj_inquiries` table should have individual records for each DJ
4. Check that unavailable DJs are marked as "skipped"

## Enabling Notifications for Production

When ready to go live:

1. **Update the API endpoint** (`app/api/djdash/multi-inquiry/route.ts`):
   ```typescript
   if (isProduction && !notificationsDisabled) {
     // Uncomment and implement notification code
     import { sendEnhancedNotifications } from '@/utils/notification-system';
     await sendEnhancedNotifications({...}, inquiry);
   }
   ```

2. **Set environment variables**:
   - `NODE_ENV=production` (automatically set by Vercel)
   - `DISABLE_DJ_NOTIFICATIONS` should NOT be set (or set to `false`)

3. **Test in staging first** with a test DJ account before enabling for all DJs

## Environment Variables

| Variable | Purpose | Development | Production |
|----------|---------|-------------|------------|
| `NODE_ENV` | Node environment | `development` | `production` |
| `DISABLE_DJ_NOTIFICATIONS` | Force disable notifications | `true` (optional) | Not set or `false` |

## Current Status

✅ **Notifications are SAFE** - All notification code is disabled by default in development mode.  
✅ **Database operations work** - All inquiry records are created normally.  
✅ **Console logging active** - You can see what would be sent in development logs.

