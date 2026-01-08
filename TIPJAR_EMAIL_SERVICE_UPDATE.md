# Tip Jar Batch Email Service Update ✅

## Changed from Resend to Mailgun

The batch creation email system has been updated to use **Mailgun** for Tip Jar emails (matching the auth hook pattern).

---

## ✅ Changes Made

### Email Service Selection

**Tip Jar Emails** (`product_context: 'tipjar'`):
- ✅ **Mailgun** (tipjar.live domain)
- Uses `MAILGUN_API_KEY` and `MAILGUN_DOMAIN_TIPJAR`

**Other Products** (M10DJ, DJDash):
- ✅ **Resend** (resend.com)
- Uses `RESEND_API_KEY`

---

## 📧 Email Functions Updated

All three email functions now automatically detect product context and use the appropriate service:

1. **`sendProspectWelcomeEmail()`**
   - Tip Jar → Mailgun
   - Other → Resend

2. **`sendClaimReminderEmail()`**
   - Tip Jar → Mailgun
   - Other → Resend

3. **`sendAccountClaimedEmail()`**
   - Tip Jar → Mailgun
   - Other → Resend

---

## 🔧 Implementation Details

### Mailgun Sending Function

```typescript
async function sendEmailViaMailgun(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; emailId?: string; error?: string }>
```

- Uses Mailgun API v3
- Domain: `MAILGUN_DOMAIN_TIPJAR` or defaults to `tipjar.live`
- Basic Auth with `MAILGUN_API_KEY`
- FormData format (required by Mailgun)

### Resend Sending Function

```typescript
async function sendEmailViaResend(
  to: string,
  from: string,
  subject: string,
  html: string,
  text: string
): Promise<{ success: boolean; emailId?: string; error?: string }>
```

- Uses Resend API
- JSON format
- For non-Tip Jar products

---

## 🔐 Environment Variables

### Required for Tip Jar Emails

```bash
MAILGUN_API_KEY=xxxxxxxxxxxxx
MAILGUN_DOMAIN_TIPJAR=tipjar.live  # Optional, defaults to tipjar.live
```

### Required for Other Products

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## 📋 Files Modified

- ✅ `lib/email/tipjar-batch-emails.ts`
  - Added `sendEmailViaMailgun()` function
  - Added `sendEmailViaResend()` function
  - Updated all three email functions to detect product context
  - Updated imports (Resend only imported when needed)

---

## 🎯 Product-Aware Email Routing

### Tip Jar (`product_context: 'tipjar'`)
```
Email Request → Check product_context → 
  'tipjar' → Use Mailgun → tipjar.live domain
```

### Other Products (`product_context: 'm10dj'` | `'djdash'`)
```
Email Request → Check product_context → 
  'm10dj' | 'djdash' → Use Resend → Resend domain
```

---

## ✅ Benefits

1. **Consistent with Auth Hook**: Uses same email service pattern as auth emails
2. **Product-Aware**: Automatically selects correct service based on product
3. **Domain Matching**: Tip Jar emails sent from tipjar.live domain (better deliverability)
4. **Flexible**: Easy to extend to other products later

---

## 🧪 Testing Checklist

- [ ] Test welcome email sending (Tip Jar) - should use Mailgun
- [ ] Test reminder email sending (Tip Jar) - should use Mailgun
- [ ] Test account claimed email (Tip Jar) - should use Mailgun
- [ ] Verify Mailgun API calls are successful
- [ ] Verify email delivery (check inbox/spam)
- [ ] Test with other products (should use Resend)
- [ ] Verify error handling for both services

---

## 🔄 Future Enhancements

- Add retry logic for failed sends
- Add email delivery tracking
- Add bounce/complaint handling
- Support additional email services if needed

---

## ✅ Status: Complete

All batch creation emails now use Mailgun for Tip Jar emails, matching the auth hook pattern. The system automatically detects product context and routes emails to the appropriate service.

