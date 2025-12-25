# 🎫 Event Ticketing System - Comprehensive Plan

**Event:** DJ Ben Murray Live at Silky O'Sullivan's  
**Date:** December 27, 2026, 10:00 PM  
**Goal:** Sell tickets online AND handle in-person admission

---

## 🎯 Overview

This plan outlines a complete ticketing system that supports:
1. **Online Ticket Sales** - Stripe-powered checkout
2. **In-Person Admission** - Cash/card at the door with QR code validation
3. **Ticket Management** - Admin dashboard for tracking sales
4. **Check-In System** - QR code scanning for validation

---

## 📊 System Architecture

### Three-Tier Approach:

```
┌─────────────────────────────────────────────────────────┐
│                    TICKET SALES                          │
├─────────────────────────────────────────────────────────┤
│  Online (Stripe)  │  In-Person (Cash/Card) │  Reserved  │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              TICKET DATABASE (Supabase)                  │
│  - Ticket records                                       │
│  - Payment tracking                                     │
│  - Check-in status                                      │
│  - QR codes                                             │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              CHECK-IN SYSTEM (Mobile/Web)                │
│  - QR code scanner                                     │
│  - Ticket validation                                      │
│  - Entry tracking                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🛒 Phase 1: Online Ticket Sales (Stripe)

### 1.1 Database Schema

**New Table: `event_tickets`**
```sql
CREATE TABLE event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL, -- e.g., 'dj-ben-murray-silky-osullivans-2026-12-27'
  ticket_type TEXT NOT NULL, -- 'general_admission', 'vip', 'early_bird'
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_ticket DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_method TEXT, -- 'stripe', 'cash', 'card_at_door'
  qr_code TEXT UNIQUE NOT NULL, -- Unique QR code for each ticket
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP,
  checked_in_by TEXT, -- Staff member who checked them in
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_qr_code ON event_tickets(qr_code);
CREATE INDEX idx_event_tickets_payment_status ON event_tickets(payment_status);
```

### 1.2 Ticket Types & Pricing

**For Silky O'Sullivan's Event:**
- **General Admission**: $10-15 (suggested)
- **VIP/Reserved Seating**: $25-30 (optional)
- **Early Bird** (first 50 tickets): $8-10 (optional)

**Configuration:**
```javascript
const TICKET_TYPES = {
  'general_admission': {
    name: 'General Admission',
    price: 12.00,
    description: 'Entry to DJ Ben Murray Live at Silky O\'Sullivan\'s',
    available: true,
    maxQuantity: 10 // Per purchase
  },
  'early_bird': {
    name: 'Early Bird',
    price: 10.00,
    description: 'Limited early bird pricing (first 50 tickets)',
    available: true,
    maxQuantity: 4,
    maxTotal: 50 // Total tickets available
  }
};
```

### 1.3 Stripe Integration

**Create Stripe Product & Price:**
1. In Stripe Dashboard, create product: "DJ Ben Murray Live - General Admission"
2. Create price: $12.00 one-time payment
3. Or use Stripe API to create dynamically

**Checkout Flow:**
```
User clicks "Buy Tickets" 
  → Select quantity
  → Enter name/email/phone
  → Redirect to Stripe Checkout
  → Payment processed
  → Webhook creates ticket records
  → Email confirmation with QR code
```

### 1.4 Implementation Files

**New Files to Create:**
1. `pages/events/live/dj-ben-murray-silky-osullivans-2026-12-27/tickets.js` - Ticket purchase page
2. `pages/api/events/tickets/purchase.js` - Create Stripe checkout session
3. `pages/api/events/tickets/webhook.js` - Handle Stripe webhook
4. `pages/api/events/tickets/[ticketId].js` - Get ticket details
5. `components/events/TicketPurchaseForm.js` - Purchase form component
6. `components/events/TicketQRCode.js` - QR code display component

---

## 💳 Phase 2: In-Person Admission

### 2.1 At-the-Door Sales

**Two Options:**

#### Option A: Simple Cash/Card (Recommended for First Event)
- Staff collects cash/card payments at door
- Staff creates ticket record in admin dashboard
- Generate QR code on-the-spot
- Print or show QR code to attendee

#### Option B: Stripe Terminal (Advanced)
- Use Stripe Terminal for card payments
- Automatic ticket creation
- Real-time inventory sync

**For First Event, Recommend Option A** (simpler, no additional hardware)

### 2.2 Admin Interface for Door Sales

**New Admin Page:**
- `pages/admin/events/[eventId]/door-sales.js`
- Quick ticket creation form:
  - Name
  - Email (optional)
  - Phone (optional)
  - Quantity
  - Payment method (Cash/Card)
  - Generate QR code immediately

---

## 📱 Phase 3: Check-In System

### 3.1 QR Code Generation

**Format:**
- Unique ticket ID (UUID)
- Encoded in QR code
- URL format: `https://m10djcompany.com/tickets/validate/[ticketId]`
- Or shorter: `https://m10djcompany.com/t/[shortCode]`

**QR Code Library:**
- Use `qrcode` npm package
- Generate on ticket purchase
- Include in email confirmation
- Display on ticket page

### 3.2 Check-In Interface

**Two Options:**

#### Option A: Mobile Web App (Recommended)
- Access via phone browser: `m10djcompany.com/admin/events/checkin`
- QR code scanner using device camera
- Simple interface: scan → validate → mark checked in

#### Option B: Native Mobile App
- More complex, requires app development
- Better offline support

**For First Event, Recommend Option A**

### 3.3 Check-In Flow

```
Staff opens check-in page on phone
  → Click "Scan QR Code"
  → Camera opens
  → Scan attendee's QR code
  → System validates:
     - Ticket exists
     - Not already checked in
     - Event matches
  → Mark as checked in
  → Show confirmation
  → Next attendee
```

### 3.4 Implementation Files

**New Files:**
1. `pages/admin/events/checkin/[eventId].js` - Check-in interface
2. `pages/api/events/tickets/validate/[ticketId].js` - Validate ticket
3. `components/events/QRCodeScanner.js` - Camera scanner component
4. `utils/qr-code-generator.js` - QR code generation utility

---

## 📧 Phase 4: Email Confirmations

### 4.1 Ticket Confirmation Email

**Sent After Purchase:**
- Ticket details (event, date, time)
- QR code image
- Link to ticket page
- Check-in instructions
- Venue information

**Template:**
```
Subject: Your Tickets for DJ Ben Murray Live at Silky O'Sullivan's

Hi [Name],

Thank you for your purchase! Here are your tickets:

Event: DJ Ben Murray Live at Silky O'Sullivan's
Date: December 27, 2026
Time: 10:00 PM
Venue: Silky O'Sullivan's, 183 Beale St, Memphis, TN

Tickets: [Quantity] x General Admission
Total: $[Amount]

[QR CODE IMAGE]

Please present this QR code at the door for entry.

View your tickets: [Link]
```

### 4.2 Reminder Emails

**Send 24 hours before event:**
- Event reminder
- QR code again
- Venue details
- What to expect

---

## 📊 Phase 5: Admin Dashboard

### 5.1 Ticket Sales Dashboard

**New Admin Page:**
- `pages/admin/events/[eventId]/tickets.js`

**Features:**
- Total tickets sold
- Revenue breakdown (online vs. door)
- Ticket sales over time (chart)
- List of all ticket holders
- Check-in status
- Export to CSV

### 5.2 Real-Time Stats

**Display:**
- Tickets sold: X / Y available
- Revenue: $X
- Check-ins: X / Y
- Online sales: X
- Door sales: X

---

## 🔒 Phase 6: Security & Validation

### 6.1 Ticket Validation Rules

**Check Before Entry:**
1. Ticket exists in database
2. Event ID matches
3. Payment status = 'paid' (or 'cash'/'card_at_door')
4. Not already checked in
5. Event date hasn't passed

### 6.2 Fraud Prevention

**Measures:**
- Unique QR codes (can't be duplicated)
- One-time use (checked in = can't reuse)
- Server-side validation (can't fake)
- Rate limiting on check-in API

### 6.3 Refund Policy

**Handle Refunds:**
- Admin can mark ticket as 'refunded'
- Stripe refund integration
- Update ticket status
- QR code becomes invalid

---

## 💰 Pricing Strategy

### Recommended Pricing for Silky O'Sullivan's:

**Option 1: Simple Single Price**
- General Admission: $12
- No tiers, easy to manage

**Option 2: Tiered Pricing**
- Early Bird (first 50): $10
- General Admission: $12
- At Door: $15 (encourages advance purchase)

**Option 3: Free Entry (Current)**
- Keep free, but sell VIP upgrades:
  - VIP table: $25 (reserved seating)
  - VIP + drink ticket: $35
  - General admission: Free

**Recommendation:** Start with Option 1 or 3, add tiers later if needed.

---

## 📱 User Experience Flow

### Online Purchase Flow:
```
1. User visits event page
2. Clicks "Buy Tickets" button
3. Selects quantity (1-10)
4. Enters name, email, phone
5. Redirected to Stripe Checkout
6. Completes payment
7. Redirected to confirmation page
8. Receives email with QR code
9. Shows QR code at door
10. Staff scans QR code
11. Entry granted
```

### In-Person Purchase Flow:
```
1. Attendee arrives at door
2. Staff opens admin door sales page
3. Enters attendee info
4. Selects payment method (cash/card)
5. System generates QR code
6. Staff shows/prints QR code
7. Attendee receives QR code
8. Staff scans QR code to check in
9. Entry granted
```

---

## 🛠️ Implementation Priority

### Phase 1: MVP (Week 1) - Get It Working
1. ✅ Database schema
2. ✅ Basic ticket purchase page
3. ✅ Stripe checkout integration
4. ✅ Webhook handler
5. ✅ Email confirmation
6. ✅ QR code generation

### Phase 2: Check-In (Week 1-2)
1. ✅ Check-in interface
2. ✅ QR code scanner
3. ✅ Validation logic
4. ✅ Check-in tracking

### Phase 3: Door Sales (Week 2)
1. ✅ Admin door sales interface
2. ✅ Manual ticket creation
3. ✅ Payment method tracking

### Phase 4: Dashboard (Week 2-3)
1. ✅ Sales dashboard
2. ✅ Analytics
3. ✅ Export functionality

### Phase 5: Polish (Week 3+)
1. ✅ Reminder emails
2. ✅ Mobile optimization
3. ✅ Offline support
4. ✅ Advanced features

---

## 📋 Database Migration

**Create migration file:**
```sql
-- File: supabase/migrations/[timestamp]_create_event_tickets.sql

CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  ticket_type TEXT NOT NULL DEFAULT 'general_admission',
  purchaser_name TEXT NOT NULL,
  purchaser_email TEXT NOT NULL,
  purchaser_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_ticket DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cash', 'card_at_door')),
  payment_method TEXT CHECK (payment_method IN ('stripe', 'cash', 'card_at_door')),
  qr_code TEXT UNIQUE NOT NULL,
  qr_code_short TEXT UNIQUE, -- Shorter code for easier scanning
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP,
  checked_in_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_tickets_event_id ON event_tickets(event_id);
CREATE INDEX idx_event_tickets_qr_code ON event_tickets(qr_code);
CREATE INDEX idx_event_tickets_qr_code_short ON event_tickets(qr_code_short);
CREATE INDEX idx_event_tickets_payment_status ON event_tickets(payment_status);
CREATE INDEX idx_event_tickets_checked_in ON event_tickets(checked_in);

-- RLS Policies
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Public can read their own tickets (by email)
CREATE POLICY "Users can view their own tickets"
  ON event_tickets FOR SELECT
  USING (true); -- For now, allow public read (we'll validate by QR code)

-- Only service role can insert/update
CREATE POLICY "Service role can manage tickets"
  ON event_tickets FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 🎨 UI/UX Design

### Ticket Purchase Page
- Clean, simple form
- Quantity selector
- Price display
- "Buy Tickets" CTA button
- Mobile-responsive

### Ticket Confirmation Page
- Large QR code display
- Ticket details
- Download/print option
- Add to calendar
- Share option

### Check-In Interface
- Full-screen camera view
- Large "Scan" button
- Success/error messages
- Check-in count display
- Simple, fast interface

---

## 🔧 Technical Stack

**Already Have:**
- ✅ Stripe integration
- ✅ Supabase database
- ✅ Email system (Resend)
- ✅ Admin dashboard structure

**Need to Add:**
- QR code generation library (`qrcode` or `qrcode.react`)
- QR code scanner (`html5-qrcode` or `@zxing/library`)
- Ticket management utilities

---

## 💡 Additional Features (Future)

### Phase 6: Advanced Features
1. **Waitlist System** - If sold out, collect emails
2. **Group Discounts** - Buy 5+ tickets, get 10% off
3. **Promo Codes** - Discount codes
4. **Transfer Tickets** - Allow ticket transfers
5. **Mobile Wallet** - Add to Apple Wallet / Google Pay
6. **Social Sharing** - "I'm going!" share buttons
7. **Event Updates** - Push notifications for event changes

---

## 📊 Success Metrics

**Track:**
- Total tickets sold
- Online vs. door sales ratio
- Revenue per ticket
- Check-in rate
- No-shows
- Refund rate

---

## 🚀 Quick Start (MVP)

**Minimum Viable Product:**
1. Create database table
2. Add "Buy Tickets" button to event page
3. Stripe checkout integration
4. Email with QR code
5. Simple check-in page (manual entry for first event)
6. Basic admin view of tickets

**Timeline:** 2-3 days for MVP

---

## ❓ Questions to Decide

1. **Pricing:** Free entry or charge? If charge, how much?
2. **Capacity:** How many tickets available? (Venue capacity?)
3. **Ticket Types:** Single price or multiple tiers?
4. **Door Sales:** Cash only, or also card? Use Stripe Terminal?
5. **Check-In:** Mobile web app or need native app?
6. **Refunds:** Allow refunds? What's the policy?

---

## ✅ Next Steps

1. **Review this plan** - Approve/modify as needed
2. **Decide on pricing** - Free or paid? How much?
3. **Set capacity** - How many tickets?
4. **Start with MVP** - Get basic system working
5. **Test thoroughly** - Before event day
6. **Train staff** - On check-in process

---

**Status:** 📋 Ready for Review  
**Last Updated:** $(date)  
**Next:** Awaiting approval to proceed with implementation

