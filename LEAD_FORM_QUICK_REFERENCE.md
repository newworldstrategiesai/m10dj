# Lead Form - Quick Reference Guide

## 🚨 Quick Fixes

### Form Not Working?
```bash
# 1. Check health status
curl http://localhost:3000/api/health-check

# 2. Check logs in browser console
# Open DevTools → Console → Look for ✅ or ❌ messages

# 3. View error history
localStorage.getItem('form_error_logs')

# 4. Check environment variables
# Ensure these are set:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - DEFAULT_ADMIN_USER_ID (recommended)
```

---

## 📊 Monitoring Commands

### Health Check
```bash
# Production
curl https://your-domain.com/api/health-check

# Local
curl http://localhost:3000/api/health-check
```

### View Form Errors (Browser Console)
```javascript
// Get all logs
JSON.parse(localStorage.getItem('form_error_logs'))

// Get error summary
const logger = new FormErrorLogger();
logger.getErrorSummary();

// Clear logs
logger.clearLogs();
```

---

## 🔧 Configuration Checklist

### Required Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=         # ✅ Required
SUPABASE_SERVICE_ROLE_KEY=        # ✅ Required
```

### Recommended
```bash
DEFAULT_ADMIN_USER_ID=            # Prevents unassigned contacts
RESEND_API_KEY=                   # For email notifications
```

### Optional
```bash
TWILIO_ACCOUNT_SID=               # For SMS notifications
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ADMIN_PHONE_NUMBER=
```

---

## 🧪 Testing the Form

### Manual Test
1. Go to contact form
2. Fill out all required fields:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "9014102020"
   - Event Type: "Wedding"
3. Submit
4. Check browser console for success messages
5. Verify contact appears in admin panel

### Test API Directly
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "9014102020",
    "eventType": "Wedding",
    "eventDate": "2025-12-31",
    "location": "Memphis, TN",
    "message": "Test message"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Thank you for your message! We'll get back to you soon.",
  "submissionId": "...",
  "contactId": "..."
}
```

---

## 📝 What Changed?

### Frontend (`ContactForm.js`)
- ✅ Added validation before submission
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Better error messages
- ✅ Error logging to localStorage
- ✅ 30-second timeout per attempt

### Backend (`/api/contact.js`)
- ✅ Critical operation tracking
- ✅ No more silent failures
- ✅ Proper error propagation
- ✅ Better admin user handling
- ✅ Detailed logging

### New Files
- ✅ `/api/health-check.js` - Monitor system health
- ✅ `/utils/form-error-logger.js` - Track errors
- ✅ Documentation files

---

## 🚀 Key Features

### Reliability
- **3 automatic retries** with exponential backoff
- **30-second timeout** per attempt  
- **No silent failures** - all critical errors reported
- **Graceful degradation** - emails/SMS failures don't block submission

### Monitoring
- **Health check endpoint** - `/api/health-check`
- **Client-side logging** - Stored in localStorage
- **Detailed console logs** - Easy debugging
- **Operation tracking** - Know exactly what succeeded/failed

### User Experience
- **Clear error messages** - Users know what to do
- **Fast retries** - 1s, 2s, 4s wait times
- **Loading states** - Shows progress during submission
- **Validation** - Catches errors before submission

---

## 🔍 Debugging Common Issues

### Issue: "Failed to save your submission"
**Cause:** Database connection failed  
**Fix:** 
- Check Supabase credentials
- Run health check
- Verify network connectivity

### Issue: "Failed to save your contact information"
**Cause:** Contact creation failed  
**Fix:**
- Check Supabase permissions
- Verify contacts table exists
- Check database policies
- Look for detailed error in server logs

### Issue: "Request timeout"
**Cause:** Network too slow or server not responding  
**Fix:**
- Check server is running
- Verify API endpoint is accessible
- Check for network issues
- Review server performance

### Issue: Contact not assigned to admin
**Cause:** `DEFAULT_ADMIN_USER_ID` not set  
**Fix:**
```bash
# Set in .env.local
DEFAULT_ADMIN_USER_ID=your-user-id-here
```

---

## 📞 Support Contacts

### For Users
- **Phone:** (901) 410-2020
- **Email:** djbenmurray@gmail.com

### For Developers
- **Documentation:** See `LEAD_FORM_DOCUMENTATION.md`
- **Health Check:** `/api/health-check`
- **Logs:** Browser console + server logs

---

## ✅ Deployment Checklist

Before deploying:
- [ ] All environment variables set
- [ ] Health check returns 200
- [ ] Test form submission works
- [ ] Verify contacts appear in admin panel
- [ ] Check email notifications work
- [ ] Review error logging
- [ ] Test retry logic (throttle network)
- [ ] Verify mobile responsiveness

After deploying:
- [ ] Monitor health check endpoint
- [ ] Check form submissions in production
- [ ] Review error logs
- [ ] Test from different devices
- [ ] Verify notification emails sent

---

## 🎯 Success Metrics

The form is working correctly if:
- ✅ Health check returns status "healthy"
- ✅ Form submissions appear in database
- ✅ Contacts created in CRM
- ✅ Success rate > 99%
- ✅ No critical errors in logs
- ✅ Average submission time < 2 seconds

---

## 📚 Additional Resources

- Full documentation: `LEAD_FORM_DOCUMENTATION.md`
- Health check: `/api/health-check`
- Error logger code: `/utils/form-error-logger.js`
- API endpoint: `/pages/api/contact.js`
- Form component: `/components/company/ContactForm.js`

---

**Last Updated:** November 11, 2025  
**Version:** 2.0.0 (Major Overhaul)  
**Status:** Production Ready ✅

