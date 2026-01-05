# 📧 Venue Account Email Notifications - Setup Guide

## ✅ Implementation Complete

Email notifications have been implemented for the venue invitation system.

---

## 📬 Email Types

### 1. Invitation Email (Performer)
**Sent when:** Venue invites a performer  
**Recipient:** Performer's email address  
**Content:**
- Welcome message from venue
- Invitation acceptance link
- Tip page URL preview
- Expiration notice (30 days)

**Template:** `lib/email/venue-invitation-email.ts`

### 2. Acceptance Confirmation (Venue)
**Sent when:** Performer accepts invitation  
**Recipient:** Venue owner's email  
**Content:**
- Confirmation that performer joined
- Link to performer's tip page
- Reminder about venue dashboard

---

## 🔧 Configuration

### Required Environment Variables

Add these to your `.env.local` or production environment:

```bash
# Resend API Key (required for sending emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Product-specific email addresses (recommended)
RESEND_FROM_EMAIL_TIPJAR=TipJar <noreply@tipjar.live>
RESEND_FROM_EMAIL_DJDASH=DJ Dash <noreply@djdash.net>
RESEND_FROM_EMAIL_M10DJ=M10 DJ Company <noreply@m10djcompany.com>

# Fallback email address (used if product-specific not set)
RESEND_FROM_EMAIL=TipJar <noreply@tipjar.live>

# Product base URLs (optional, for email links)
NEXT_PUBLIC_TIPJAR_URL=https://tipjar.live
NEXT_PUBLIC_DJDASH_URL=https://djdash.net
NEXT_PUBLIC_M10DJ_URL=https://m10djcompany.com
```

**Note:** The system automatically selects the correct email address based on the organization's `product_context`. If a product-specific variable isn't set, it falls back to `RESEND_FROM_EMAIL`.

### Resend Setup

1. **Create Resend Account**
   - Sign up at https://resend.com
   - Get your API key from dashboard

2. **Verify Domains (Recommended)**
   - Add all three domains to Resend:
     - `tipjar.live`
     - `djdash.net`
     - `m10djcompany.com`
   - Configure DNS records (SPF, DKIM) for each
   - Use verified domains in product-specific `RESEND_FROM_EMAIL_*` variables

3. **Test Email Sending**
   - Use Resend's test mode for development
   - Check Resend dashboard for delivery status

---

## 📝 Email Templates

### Invitation Email HTML
- Professional gradient header
- Clear call-to-action button
- Tip page URL preview
- Mobile-responsive design
- Dark mode compatible

### Acceptance Confirmation HTML
- Success-themed design (green gradient)
- Performer tip page link
- Venue dashboard reminder

---

## 🧪 Testing

### Test Invitation Flow

1. **Create Venue Account**
   - Sign up as venue
   - Access venue dashboard

2. **Send Invitation**
   - Click "Invite Performer"
   - Enter email, name, slug
   - Check email inbox for invitation

3. **Accept Invitation**
   - Click link in email
   - Sign in/create account
   - Accept invitation
   - Check venue owner's email for confirmation

### Email Delivery Checks

- ✅ Check Resend dashboard for sent emails
- ✅ Verify email appears in recipient inbox
- ✅ Check spam folder if not received
- ✅ Verify links work correctly
- ✅ Test on multiple email providers

---

## 🐛 Troubleshooting

### Emails Not Sending

**Issue:** No emails received  
**Solutions:**
1. Check `RESEND_API_KEY` is set correctly
2. Verify Resend account is active
3. Check Resend dashboard for errors
4. Verify email addresses are valid
5. Check spam/junk folders

### Email Format Issues

**Issue:** Email looks broken  
**Solutions:**
1. Test in multiple email clients
2. Check HTML template syntax
3. Verify CSS is inline (required for email)
4. Test with email testing service (Litmus, Email on Acid)

### API Errors

**Issue:** `RESEND_API_KEY is not configured`  
**Solution:** Add `RESEND_API_KEY` to environment variables

**Issue:** `Email service not configured`  
**Solution:** Verify Resend API key is valid and has sending permissions

---

## 📊 Email Analytics

### Resend Dashboard
- View sent email count
- Check delivery rates
- Monitor bounce rates
- Track open rates (if enabled)
- View click rates (if enabled)

### Custom Tracking
- Log email sends in database (optional)
- Track invitation acceptance rates
- Monitor email delivery success

---

## 🔒 Security Considerations

- ✅ Email addresses validated before sending
- ✅ Invitation tokens are secure (UUIDs)
- ✅ Links expire after 30 days
- ✅ No sensitive data in email content
- ✅ Email addresses not exposed in URLs

---

## 🚀 Future Enhancements

### Email Improvements
- [ ] Add email tracking (opens, clicks)
- [ ] Send reminder emails (7 days before expiration)
- [ ] Add unsubscribe option (if needed)
- [ ] Custom email templates per venue
- [ ] Multi-language support

### Notification Options
- [ ] SMS notifications (via Twilio)
- [ ] Push notifications (if mobile app)
- [ ] In-app notifications
- [ ] Webhook notifications

---

## 📚 Related Files

- `lib/email/venue-invitation-email.ts` - Email templates and sending logic
- `app/api/tipjar/venue/invite-performer/route.ts` - Invitation endpoint (sends email)
- `app/api/tipjar/venue/accept-invitation/route.ts` - Acceptance endpoint (sends confirmation)

---

**Status:** ✅ **IMPLEMENTED**  
**Last Updated:** 2025-02-21

