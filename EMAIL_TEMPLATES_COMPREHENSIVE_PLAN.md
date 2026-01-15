# 📧 Comprehensive Email Templates Plan
## All Email Scenarios & Templates Needed for M10 DJ / DJ Dash / TipJar Ecosystem

---

## 📊 Overview

This document outlines **ALL** email templates needed across the customer lifecycle, payment workflows, event management, and administrative functions. Templates are organized by:
1. **Customer Journey Stage** (Discovery → Booking → Event → Post-Event)
2. **Workflow Type** (Contracts, Payments, Events, Admin)
3. **Trigger Type** (Automated vs Manual)

---

## ✅ Already Implemented

### Authentication Templates
- ✅ `confirm-signup.html` - Account confirmation
- ✅ `reset-password.html` - Password reset
- ✅ `magic-link.html` - Magic link sign-in

### Client Communications
- ✅ `client-confirmation.html` - Initial inquiry confirmation
- ✅ `contract-invoice-ready.html` - Contract & Invoice ready (just created)

### Admin Notifications
- ✅ Contract signed notifications (admin)
- ✅ Payment received notifications (admin)
- ✅ New lead notifications (admin)

### TipJar Templates
- ✅ Welcome email (prospect)
- ✅ Claim reminder email
- ✅ Account claimed email

---

## 🎯 NEEDED: Customer Journey Emails

### Phase 1: Discovery & Inquiry

#### 1. **Initial Inquiry Confirmation** ✅ EXISTS
- **Status**: ✅ Implemented (`client-confirmation.html`)
- **Trigger**: Contact form submission
- **Purpose**: Welcome, set expectations, next steps

#### 2. **Quote/Service Selection Ready** ❌ NEEDED
- **File**: `quote-ready.html`
- **Trigger**: When quote selection is generated/completed
- **Recipients**: Client
- **Content**:
  - Thank you for your interest
  - Service selection link
  - Package details overview
  - Timeline expectations
  - Contact information

#### 3. **Abandoned Quote Follow-up** ❌ NEEDED
- **File**: `abandoned-quote-reminder.html`
- **Trigger**: Quote viewed but not completed after 2-3 days (automated)
- **Recipients**: Client
- **Variants**:
  - First reminder (3 days) - Gentle nudge
  - Second reminder (7 days) - Urgency
  - Final reminder (14 days) - Last chance
- **Content**:
  - Remind them of their quote
  - Highlight limited availability
  - Direct link to complete selection
  - Offer to answer questions

---

### Phase 2: Contract & Booking

#### 4. **Contract Ready to Sign** ❌ NEEDED (Partially exists in API)
- **File**: `contract-ready.html`
- **Trigger**: Contract generated, ready for signature
- **Recipients**: Client
- **Content**:
  - Event summary
  - Contract signing link
  - Expiration date
  - Important terms summary
  - Contact for questions

#### 5. **Contract & Invoice Ready** ✅ EXISTS
- **Status**: ✅ Just implemented (`contract-invoice-ready.html`)
- **Trigger**: Both contract and invoice ready
- **Recipients**: Client

#### 6. **Contract Signed Confirmation (Client)** ❌ NEEDED
- **File**: `contract-signed-client.html`
- **Trigger**: Client signs contract
- **Recipients**: Client
- **Content**:
  - Confirmation of signature
  - Contract number & PDF download
  - Event details reminder
  - Next steps (payment)
  - Payment link (if invoice unpaid)
  - Timeline to event
  - What to expect next

#### 7. **Contract Fully Executed** ❌ NEEDED (Partially exists in API)
- **File**: `contract-executed.html`
- **Trigger**: Both parties signed (counter-signed)
- **Recipients**: Client
- **Content**:
  - Contract is legally binding
  - Download fully executed contract
  - Payment next steps
  - Event planning timeline
  - Important dates/deadlines

#### 8. **Contract Expiring Soon** ❌ NEEDED
- **File**: `contract-expiring.html`
- **Trigger**: 7 days before signing token expires
- **Recipients**: Client
- **Variants**:
  - First warning (7 days before)
  - Final warning (1 day before)
- **Content**:
  - Urgency messaging
  - Link will expire soon
  - Impact of not signing
  - How to get help
  - Renew/extend option

#### 9. **Contract Expired** ❌ NEEDED
- **File**: `contract-expired.html`
- **Trigger**: Signing token expired
- **Recipients**: Client
- **Content**:
  - Link has expired
  - How to get new signing link
  - Contact admin
  - Alternative options

---

### Phase 3: Payment Workflow

#### 10. **Invoice Sent** ❌ NEEDED (Partially exists)
- **File**: `invoice-sent.html`
- **Trigger**: Invoice created and sent to client
- **Recipients**: Client
- **Content**:
  - Invoice details
  - Payment link
  - Due date
  - Payment options
  - Late fee information (if applicable)

#### 11. **Deposit Required** ❌ NEEDED
- **File**: `deposit-required.html`
- **Trigger**: Contract signed, deposit due
- **Recipients**: Client
- **Content**:
  - Deposit amount
  - Due date
  - Payment link
  - What happens after deposit
  - Refund policy reminder

#### 12. **Payment Reminder (First)** ❌ NEEDED
- **File**: `payment-reminder-1.html`
- **Trigger**: Invoice due in 7 days (automated)
- **Recipients**: Client
- **Content**:
  - Friendly reminder
  - Invoice details
  - Payment link
  - Due date reminder
  - Contact for questions

#### 13. **Payment Reminder (Second)** ❌ NEEDED
- **File**: `payment-reminder-2.html`
- **Trigger**: Invoice due in 3 days (automated)
- **Recipients**: Client
- **Content**:
  - More urgent tone
  - Payment required soon
  - Late fees mentioned
  - Payment link
  - Contact immediately if issues

#### 14. **Payment Reminder (Final)** ❌ NEEDED
- **File**: `payment-reminder-final.html`
- **Trigger**: Invoice due tomorrow (automated)
- **Recipients**: Client
- **Content**:
  - Final notice
  - Urgent payment needed
  - Late fees will apply
  - Payment link
  - Contact immediately

#### 15. **Invoice Overdue** ❌ NEEDED
- **File**: `invoice-overdue.html`
- **Trigger**: Invoice past due date (automated)
- **Recipients**: Client
- **Variants**:
  - 1-7 days overdue
  - 8-14 days overdue
  - 15-30 days overdue
  - 30+ days overdue (final notice)
- **Content**:
  - Overdue notice
  - Days overdue
  - Late fees applied
  - Payment required immediately
  - Collection notice (if applicable)
  - Contact for payment plan

#### 16. **Payment Received - Deposit** ✅ EXISTS (Partially in utils)
- **Status**: ✅ Implemented in `utils/client-notifications.js`
- **File**: `payment-received-deposit.html` (needs template)
- **Trigger**: Deposit payment received
- **Recipients**: Client
- **Content**:
  - Thank you
  - Deposit amount confirmed
  - Remaining balance
  - Next payment due date
  - Receipt PDF link

#### 17. **Payment Received - Final Payment** ✅ EXISTS (Partially in utils)
- **Status**: ✅ Implemented in `utils/client-notifications.js`
- **File**: `payment-received-final.html` (needs template)
- **Trigger**: Final/remaining balance paid
- **Recipients**: Client
- **Content**:
  - Thank you
  - Payment complete confirmation
  - Receipt PDF
  - Event details reminder
  - What to expect next

#### 18. **Payment Received - Partial** ❌ NEEDED
- **File**: `payment-received-partial.html`
- **Trigger**: Partial payment received
- **Recipients**: Client
- **Content**:
  - Thank you
  - Amount received
  - Remaining balance
  - Next payment due
  - Payment plan link

#### 19. **Payment Plan Confirmed** ❌ NEEDED
- **File**: `payment-plan-confirmed.html`
- **Trigger**: Payment plan set up
- **Recipients**: Client
- **Content**:
  - Payment plan details
  - Installment schedule
  - Due dates
  - Auto-pay information (if applicable)
  - Payment links for each installment

#### 20. **Payment Plan Reminder** ❌ NEEDED
- **File**: `payment-plan-reminder.html`
- **Trigger**: Next installment due in 3 days
- **Recipients**: Client
- **Content**:
  - Upcoming installment
  - Amount due
  - Due date
  - Payment link
  - Payment plan status

#### 21. **Late Fee Applied** ❌ NEEDED
- **File**: `late-fee-applied.html`
- **Trigger**: Late fee added to invoice
- **Recipients**: Client
- **Content**:
  - Late fee notice
  - Amount of late fee
  - Reason (days overdue)
  - New total balance
  - Payment link
  - Contact to dispute

---

### Phase 4: Pre-Event Communication

#### 22. **Event Confirmation - 2 Weeks Before** ❌ NEEDED
- **File**: `event-confirmation-2weeks.html`
- **Trigger**: 14 days before event (automated)
- **Recipients**: Client
- **Content**:
  - Event date reminder
  - Finalize details needed
  - Timeline discussion
  - Music preferences form
  - Special requests
  - Contact for changes

#### 23. **Event Confirmation - 1 Week Before** ❌ NEEDED
- **File**: `event-confirmation-1week.html`
- **Trigger**: 7 days before event (automated)
- **Recipients**: Client
- **Content**:
  - Final event details
  - Venue confirmation
  - Timeline review
  - DJ contact information
  - Day-of expectations
  - Emergency contact

#### 24. **Event Confirmation - 1 Day Before** ❌ NEEDED
- **File**: `event-confirmation-1day.html`
- **Trigger**: 1 day before event (automated)
- **Recipients**: Client
- **Content**:
  - Final reminder
  - Event details summary
  - Arrival time
  - Setup requirements
  - DJ contact info
  - Weather contingency (if outdoor)
  - Excitement messaging

#### 25. **Music Preferences Reminder** ❌ NEEDED
- **File**: `music-preferences-reminder.html`
- **Trigger**: No music preferences submitted 7 days before event
- **Recipients**: Client
- **Content**:
  - Request for music preferences
  - Link to music form
  - Why it's important
  - Deadline
  - Contact for help

#### 26. **Event Details Update** ❌ NEEDED
- **File**: `event-details-updated.html`
- **Trigger**: Admin updates event details
- **Recipients**: Client
- **Content**:
  - What changed
  - Updated details
  - Confirmation needed
  - Contact to confirm/change
  - Impact on timeline

#### 27. **Venue Change Notification** ❌ NEEDED
- **File**: `venue-change.html`
- **Trigger**: Venue changed
- **Recipients**: Client
- **Content**:
  - Venue change notice
  - Old venue
  - New venue
  - New address
  - Updated timeline
  - Impact on setup
  - Confirmation required

#### 28. **Event Rescheduled** ❌ NEEDED
- **File**: `event-rescheduled.html`
- **Trigger**: Event date/time changed
- **Recipients**: Client
- **Content**:
  - Rescheduling notice
  - Old date/time
  - New date/time
  - Reason (if provided)
  - Contract update needed
  - Confirmation required
  - Deposit handling

---

### Phase 5: Event Day

#### 29. **Event Day - Good Morning** ❌ NEEDED
- **File**: `event-day-morning.html`
- **Trigger**: Event day morning (automated)
- **Recipients**: Client
- **Content**:
  - Excitement messaging
  - Today's the day!
  - Final event summary
  - DJ contact info
  - Arrival timeline
  - Setup check-in
  - What to expect

#### 30. **DJ Arrived** ❌ NEEDED
- **File**: `dj-arrived.html`
- **Trigger**: Admin marks DJ as arrived (manual or automatic)
- **Recipients**: Client
- **Content**:
  - DJ has arrived
  - Setup in progress
  - Timeline status
  - Contact if needed
  - Enjoy your event!

---

### Phase 6: Post-Event

#### 31. **Thank You - Immediate** ❌ NEEDED
- **File**: `thank-you-immediate.html`
- **Trigger**: Event marked as completed (automated)
- **Recipients**: Client
- **Content**:
  - Thank you
  - Hope you enjoyed
  - Event highlights
  - Photos/videos (if available)
  - Review request (coming soon)
  - Social media sharing
  - Future bookings

#### 32. **Thank You - With Review Request** ✅ NEEDED (Partially exists)
- **Status**: Partially in automation system
- **File**: `thank-you-review-request.html`
- **Trigger**: 48 hours after event (automated)
- **Recipients**: Client
- **Content**:
  - Thank you message
  - Event recap
  - Review request (Google/Facebook)
  - Review link
  - Why reviews matter
  - Share photos option
  - Future bookings mention

#### 33. **Review Reminder - First** ✅ NEEDED (Partially exists)
- **Status**: Partially in automation system
- **File**: `review-reminder-1.html`
- **Trigger**: 7 days after event if no review (automated)
- **Recipients**: Client
- **Content**:
  - Gentle reminder
  - Review link
  - Quick to complete
  - Why it helps
  - Thank you

#### 34. **Review Reminder - Final** ✅ NEEDED (Partially exists)
- **Status**: Partially in automation system
- **File**: `review-reminder-final.html`
- **Trigger**: 14 days after event if no review (automated)
- **Recipients**: Client
- **Content**:
  - Final reminder
  - Review link
  - Last chance
  - Feedback welcome
  - Thank you

#### 35. **Review Received - Thank You** ❌ NEEDED
- **File**: `review-received-thank-you.html`
- **Trigger**: Review detected/submitted
- **Recipients**: Client
- **Content**:
  - Thank you for review
  - Appreciation message
  - Future bookings
  - Referral program (if applicable)
  - Social media sharing

---

### Phase 7: Cancellation & Issues

#### 36. **Event Cancellation - By Client** ❌ NEEDED
- **File**: `event-cancelled-client.html`
- **Trigger**: Event cancelled by client
- **Recipients**: Client
- **Content**:
  - Cancellation confirmation
  - Cancellation policy
  - Refund status
  - Deposit handling
  - Next steps
  - Future bookings welcome

#### 37. **Event Cancellation - By Vendor** ❌ NEEDED
- **File**: `event-cancelled-vendor.html`
- **Trigger**: Event cancelled by admin
- **Recipients**: Client
- **Content**:
  - Cancellation notice
  - Reason (if appropriate)
  - Apology
  - Full refund confirmation
  - Alternative options
  - Referrals (if applicable)
  - Contact information

#### 38. **Refund Processed** ❌ NEEDED
- **File**: `refund-processed.html`
- **Trigger**: Refund issued
- **Recipients**: Client
- **Content**:
  - Refund confirmation
  - Amount refunded
  - Method of refund
  - Timeline (3-5 business days)
  - Transaction ID
  - Questions contact

#### 39. **Dispute/Issue Resolution** ❌ NEEDED
- **File**: `dispute-resolution.html`
- **Trigger**: Issue resolved
- **Recipients**: Client
- **Content**:
  - Issue resolution
  - Steps taken
  - Compensation (if applicable)
  - Apology (if applicable)
  - Next steps
  - Contact for questions

---

## 🔔 Administrative & System Emails

### Admin Notifications

#### 40. **New Lead Notification** ✅ EXISTS
- **Status**: ✅ Implemented
- **Recipients**: Admin
- **Content**: Lead details, contact info, event details

#### 41. **Contract Signed Notification** ✅ EXISTS
- **Status**: ✅ Implemented
- **Recipients**: Admin
- **Content**: Contract details, signature info, next steps

#### 42. **Payment Received Notification** ✅ EXISTS
- **Status**: ✅ Implemented
- **Recipients**: Admin
- **Content**: Payment details, invoice status, client info

#### 43. **Large Payment Alert** ❌ NEEDED
- **File**: `admin-large-payment.html`
- **Trigger**: Payment > $X threshold
- **Recipients**: Admin
- **Content**:
  - Large payment alert
  - Amount
  - Client details
  - Invoice link
  - Verify notification

#### 44. **Overdue Invoice Alert** ❌ NEEDED
- **File**: `admin-overdue-alert.html`
- **Trigger**: Invoice overdue (daily summary)
- **Recipients**: Admin
- **Content**:
  - Overdue invoices list
  - Days overdue
  - Amounts
  - Client contact info
  - Action items

#### 45. **Contract Expiring Alert** ❌ NEEDED
- **File**: `admin-contract-expiring.html`
- **Trigger**: Contract expiring soon (daily summary)
- **Recipients**: Admin
- **Content**:
  - Expiring contracts list
  - Days until expiration
  - Client contact info
  - Action needed

#### 46. **Event Day Reminder** ❌ NEEDED
- **File**: `admin-event-day-reminder.html`
- **Trigger**: Event happening today (morning)
- **Recipients**: Admin
- **Content**:
  - Today's events
  - Client details
  - Event details
  - Timeline
  - Setup checklist
  - Contact info

#### 47. **Missing Payment Alert** ❌ NEEDED
- **File**: `admin-missing-payment.html`
- **Trigger**: Event in 7 days, deposit not paid
- **Recipients**: Admin
- **Content**:
  - Missing payment alert
  - Event details
  - Amount due
  - Client contact
  - Action required

#### 48. **Event Completion Reminder** ❌ NEEDED
- **File**: `admin-event-complete-reminder.html`
- **Trigger**: Event date passed, not marked complete
- **Recipients**: Admin
- **Content**:
  - Event completion reminder
  - Mark as complete
  - Trigger follow-up sequence
  - Review automation

---

### System & Error Emails

#### 49. **Failed Payment Notification** ❌ NEEDED
- **File**: `payment-failed.html`
- **Trigger**: Payment attempt failed
- **Recipients**: Client
- **Content**:
  - Payment failed notice
  - Reason (if available)
  - Amount attempted
  - Update payment method
  - Retry payment link
  - Contact for help

#### 50. **Payment Method Expired** ❌ NEEDED
- **File**: `payment-method-expired.html`
- **Trigger**: Stored payment method expired
- **Recipients**: Client
- **Content**:
  - Payment method expired
  - Update required
  - Impact (auto-pay failures)
  - Update payment method link
  - Contact for help

#### 51. **System Error Notification** ❌ NEEDED
- **File**: `system-error-admin.html`
- **Trigger**: Critical system error
- **Recipients**: Admin/Tech team
- **Content**:
  - Error details
  - Timestamp
  - User impacted (if applicable)
  - Error logs
  - Action taken
  - Fix status

---

## 📋 Special Purpose Templates

### Quote & Proposal

#### 52. **Custom Quote Ready** ❌ NEEDED
- **File**: `custom-quote-ready.html`
- **Trigger**: Custom quote created
- **Recipients**: Client
- **Content**:
  - Custom quote details
  - Pricing breakdown
  - Terms
  - Validity period
  - Accept quote link
  - Questions contact

#### 53. **Quote Accepted** ❌ NEEDED
- **File**: `quote-accepted.html`
- **Trigger**: Quote accepted by client
- **Recipients**: Client + Admin
- **Content**:
  - Quote acceptance confirmation
  - Next steps (contract generation)
  - Timeline expectations
  - What happens next

#### 54. **Quote Expired** ❌ NEEDED
- **File**: `quote-expired.html`
- **Trigger**: Quote validity period expired
- **Recipients**: Client
- **Content**:
  - Quote expired notice
  - Request new quote
  - Pricing may have changed
  - Contact for updated quote

---

### Booking & Scheduling

#### 55. **Consultation Scheduled** ✅ NEEDED (Partially exists)
- **Status**: Partially in booking system
- **File**: `consultation-scheduled.html`
- **Trigger**: Consultation booked
- **Recipients**: Client
- **Content**:
  - Consultation confirmation
  - Date/time
  - Meeting type (phone/video/in-person)
  - Meeting link (if virtual)
  - What to prepare
  - Reschedule/cancel link

#### 56. **Consultation Reminder** ❌ NEEDED
- **File**: `consultation-reminder.html`
- **Trigger**: 24 hours before consultation
- **Recipients**: Client
- **Content**:
  - Reminder of consultation
  - Date/time
  - Meeting link
  - What to expect
  - Reschedule if needed

#### 57. **Consultation Rescheduled** ❌ NEEDED
- **File**: `consultation-rescheduled.html`
- **Trigger**: Consultation time changed
- **Recipients**: Client
- **Content**:
  - Rescheduling confirmation
  - Old date/time
  - New date/time
  - Updated meeting link
  - Apology if last minute

---

### Referral & Marketing

#### 58. **Referral Thank You** ❌ NEEDED
- **File**: `referral-thank-you.html`
- **Trigger**: Referral converted to booking
- **Recipients**: Referrer
- **Content**:
  - Thank you for referral
  - Referral bonus (if applicable)
  - Booking confirmation
  - Appreciation message

#### 59. **Anniversary/Repeat Client** ❌ NEEDED
- **File**: `repeat-client-offer.html`
- **Trigger**: Event date anniversary or repeat inquiry
- **Recipients**: Previous clients
- **Content**:
  - Thank you for returning
  - Special offer (if applicable)
  - Memories from last event
  - Book again link
  - Referral program

---

### Multi-Product Templates

#### 60. **TipJar Welcome** ✅ EXISTS
- **Status**: ✅ Implemented

#### 61. **TipJar Claim Reminder** ✅ EXISTS
- **Status**: ✅ Implemented

#### 62. **TipJar Account Claimed** ✅ EXISTS
- **Status**: ✅ Implemented

#### 63. **DJ Dash Lead Notification** ❌ NEEDED
- **File**: `djdash-new-lead.html`
- **Trigger**: New lead assigned to DJ
- **Recipients**: DJ (in DJ Dash)
- **Content**:
  - New lead details
  - Client contact info
  - Event details
  - Lead score
  - Accept/decline link
  - Timeline expectations

#### 64. **DJ Dash Booking Confirmed** ❌ NEEDED
- **File**: `djdash-booking-confirmed.html`
- **Trigger**: DJ accepts booking
- **Recipients**: DJ
- **Content**:
  - Booking confirmed
  - Client details
  - Event details
  - Timeline
  - Contract link
  - Payment schedule
  - Next steps

---

## 🎯 Implementation Priority

### **Phase 1: Critical (Immediate Impact)**
1. ✅ Contract & Invoice Ready (DONE)
2. ❌ Contract Signed Confirmation (Client)
3. ❌ Payment Received Confirmation
4. ❌ Payment Reminder (First)
5. ❌ Invoice Overdue
6. ❌ Event Confirmation (1 Week Before)
7. ❌ Thank You with Review Request

### **Phase 2: High Value (Next Sprint)**
8. ❌ Quote Ready
9. ❌ Abandoned Quote Reminder
10. ❌ Contract Expiring
11. ❌ Payment Reminder (Final)
12. ❌ Event Confirmation (1 Day Before)
13. ❌ Review Reminder
14. ❌ Admin Overdue Alert

### **Phase 3: Nice to Have (Future)**
15. ❌ All other templates
16. ❌ Special purpose templates
17. ❌ Multi-product specific templates

---

## 📊 Template Statistics

- **Total Templates Needed**: 64
- **Already Implemented**: 8 ✅
- **Need Development**: 56 ❌
- **Phase 1 Priority**: 7
- **Phase 2 Priority**: 7
- **Phase 3 Priority**: 42

---

## 🔧 Template Features Required

### Universal Template Requirements
1. ✅ Product-aware (M10DJ / DJ Dash / TipJar)
2. ✅ Responsive design (mobile + desktop)
3. ✅ Dark mode support
4. ✅ Animated logo (where appropriate)
5. ✅ Clear CTAs
6. ✅ Contact information
7. ✅ Unsubscribe option (where applicable)

### Dynamic Content
- Client name personalization
- Event details
- Invoice/contract numbers
- Payment amounts
- Dates/timelines
- Links (signing, payment, review, etc.)
- Organization branding

### Template Variables
All templates should support:
- `{{client_first_name}}`
- `{{client_last_name}}`
- `{{client_email}}`
- `{{event_name}}`
- `{{event_date}}`
- `{{event_time}}`
- `{{venue_name}}`
- `{{venue_address}}`
- `{{total_amount}}`
- `{{contract_number}}`
- `{{invoice_number}}`
- `{{product_name}}` (M10 DJ Company / DJ Dash / TipJar)
- `{{base_url}}`
- `{{support_email}}`
- `{{support_phone}}`

---

## 📝 Notes

1. **Automation Integration**: Many templates need integration with automation queue system
2. **Timing**: Automated emails need cron jobs or scheduled task system
3. **A/B Testing**: Consider variants for high-value emails (payment reminders, review requests)
4. **Localization**: Future consideration for multi-language support
5. **Analytics**: Track open rates, click rates, conversion rates per template
6. **Compliance**: Ensure CAN-SPAM compliance (unsubscribe links, physical address)

---

**Last Updated**: January 30, 2025
**Version**: 1.0.0
