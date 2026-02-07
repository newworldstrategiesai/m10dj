# Song Request SMS Notification – Code Trace

This doc traces how the admin SMS (and email) is fired when a crowd request payment succeeds, and how we ensure **exactly one** notification per paid request.

---

## Flow overview

1. **User pays** via Stripe Checkout (song request / shoutout).
2. **Two things can happen in parallel:**
   - **Client:** Stripe redirects to success page → page calls **process-payment-success** with `sessionId` + `requestId`.
   - **Stripe:** Webhook sends **checkout.session.completed** and/or **payment_intent.succeeded**.
3. **Dedupe:** Only one of these paths is allowed to send the admin SMS. We use `crowd_requests.admin_sms_sent_at`: the first path to set it “wins” and sends the notification; others see it already set and skip.

---

## Entry points (all use same dedupe)

### 1. Process Payment Success (client after redirect)

**File:** `pages/api/crowd-request/process-payment-success.js`  
**Trigger:** Success page `pages/crowd-request/success.js` calls `POST /api/crowd-request/process-payment-success` with `{ sessionId, requestId }`.

**Flow:**
1. Retrieve Stripe checkout session and payment intent.
2. Update `crowd_requests` with payment info (`payment_status`, `amount_paid`, `paid_at`, customer details, etc.).
3. If payment is paid and payment intent succeeded:
   - **Claim:** `UPDATE crowd_requests SET admin_sms_sent_at = now() WHERE id = ? AND admin_sms_sent_at IS NULL RETURNING id`.
   - If the update returns a row (`claimRow`), we “won” the race → call **sendAdminNotification('crowd_request_payment', data)**.
4. Notification payload: `requestDetail` (song title/artist or shoutout), `requesterName`, `amount`, `eventCode`, `paymentIntentId`.

---

### 2. Stripe Webhook – checkout.session.completed

**File:** `pages/api/stripe/webhook.js`  
**Trigger:** Stripe sends `checkout.session.completed`; handler uses `metadata.request_id` for crowd requests.

**Flow:**
1. Update `crowd_requests` with payment info (same shape as above; also updates bundle requests by `payment_code` if present).
2. **Claim:** `UPDATE crowd_requests SET admin_sms_sent_at = now() WHERE id = ? AND admin_sms_sent_at IS NULL RETURNING id`.
3. If `claimRow` exists → fetch full request row, then **sendAdminNotification('crowd_request_payment', data)** (same payload shape).

---

### 3. Stripe Webhook – payment_intent.succeeded

**File:** `pages/api/stripe/webhook.js`  
**Trigger:** Stripe sends `payment_intent.succeeded`; handler uses `metadata.request_id` for crowd requests.

**Flow:**
1. Update `crowd_requests` with payment info.
2. **Claim:** Same `admin_sms_sent_at` update as above; if we get a row, **sendAdminNotification('crowd_request_payment', data)**.

---

## Who actually sends the SMS?

- **Typical case:** User lands on success page and the client calls **process-payment-success** quickly. That path usually wins the claim and sends the SMS (and email).
- **If the client never calls** (e.g. user closes tab before success page loads), the **webhook** (checkout.session.completed or payment_intent.succeeded) will win and send the notification.
- **Only one** of the three paths can win per request, because of `WHERE admin_sms_sent_at IS NULL` and the atomic update.

---

## Notification implementation

**File:** `utils/admin-notifications.js`

- **sendAdminNotification(eventType, data)** is used with `eventType === 'crowd_request_payment'`.
- It does three things (all non-blocking):
  1. **SMS:** `sendAdminSMSNotification('crowd_request_payment', data)` → builds message (song/shoutout, requester, amount, event, Stripe id) → **sendAdminSMS(message)** in `utils/sms-helper.js` (Twilio).
  2. **Email:** `sendAdminEmailNotification('crowd_request_payment', data)` (Resend).
  3. **Log:** `logNotificationToDatabase(...)` (if configured).

SMS message format (same in all paths):

```text
🎵 SONG REQUEST PAID

<requestDetail>
From: <requesterName>
Amount: $<amount>
Event: <eventCode>
Stripe: <paymentIntentId>
```

---

## Database

- **Column:** `crowd_requests.admin_sms_sent_at` (timestamptz, nullable).
- **Migration:** `supabase/migrations/20260206110000_add_crowd_request_admin_sms_sent_at.sql`.
- Used only to dedupe: first path to set it sends the notification; others skip.

---

## Summary

| Entry point                    | File                                      | Dedupe (admin_sms_sent_at) | Sends SMS/email |
|--------------------------------|-------------------------------------------|----------------------------|-----------------|
| Success page → API             | `pages/api/crowd-request/process-payment-success.js` | Yes (claim then send)      | Yes             |
| Webhook checkout.session.completed | `pages/api/stripe/webhook.js`             | Yes (claim then send)      | Yes             |
| Webhook payment_intent.succeeded   | `pages/api/stripe/webhook.js`             | Yes (claim then send)      | Yes             |

All three paths use the same claim pattern, so the admin receives exactly one song-request SMS (and one email) per paid crowd request.
