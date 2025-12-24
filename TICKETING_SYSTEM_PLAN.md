# 🎫 Event Ticketing System - Implementation Plan

## Executive Summary

**Difficulty:** Medium (3-4 weeks for MVP, 6-8 weeks for full-featured)  
**Estimated Cost:** $0 additional (uses existing infrastructure)  
**Revenue Potential:** High (new revenue stream, minimal overhead)

---

## 🎯 Objectives

1. Enable ticket sales directly from event pages
2. Provide seamless checkout experience using existing Stripe integration
3. Generate unique QR codes for each ticket
4. Enable mobile-friendly check-in system for event staff
5. Provide comprehensive admin dashboard for ticket management

---

## 📋 Phase 1: MVP (2-3 Weeks)

### Week 1: Database & Core Infrastructure

#### 1.1 Database Schema (2-3 days)
**Migration:** `supabase/migrations/YYYYMMDD_create_ticketing_tables.sql`

```sql
-- Ticket Types (pricing tiers)
CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "General Admission", "VIP", "Early Bird"
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets (individual purchases)
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE CASCADE,
  case_study_id UUID REFERENCES case_studies(id) ON DELETE CASCADE,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT NOT NULL,
  purchaser_phone TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  qr_code TEXT UNIQUE NOT NULL, -- Unique identifier for QR code
  qr_code_hash TEXT NOT NULL, -- Security hash for validation
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES auth.users(id),
  metadata JSONB, -- Additional data (seat numbers, special requests, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in Logs (audit trail)
CREATE TABLE ticket_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  checked_in_by UUID REFERENCES auth.users(id),
  location TEXT, -- Optional: GPS coordinates or venue location
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tickets_case_study_id ON tickets(case_study_id);
CREATE INDEX idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_purchaser_email ON tickets(purchaser_email);
CREATE INDEX idx_ticket_types_case_study_id ON ticket_types(case_study_id);
CREATE INDEX idx_ticket_check_ins_ticket_id ON ticket_check_ins(ticket_id);
```

**RLS Policies:**
- Public can view active ticket types for published events
- Public can create tickets (for purchase)
- Admins can view/edit all tickets
- Ticket owners can view their own tickets via QR code

#### 1.2 QR Code Generation Utility (1 day)
**File:** `utils/ticket-qr-generator.ts`

- Generate unique ticket IDs
- Create secure hash for validation
- Generate QR code images (using `qrcode` npm package)
- Validate QR codes on scan

#### 1.3 API Endpoints (2-3 days)

**`/api/tickets/types/[eventId]`** - GET
- Fetch available ticket types for an event
- Filter by active status and sale dates

**`/api/tickets/create-checkout`** - POST
- Create Stripe checkout session
- Reserve tickets (prevent overselling)
- Generate ticket records with pending status

**`/api/tickets/verify-payment`** - POST
- Webhook handler for Stripe payment confirmation
- Update ticket status to 'paid'
- Send confirmation email with QR codes

**`/api/tickets/validate-qr`** - POST
- Validate QR code on check-in
- Prevent duplicate scans
- Record check-in event

**`/api/tickets/[ticketId]`** - GET
- Fetch ticket details by ID or QR code
- For ticket holders to view their tickets

### Week 2: Public-Facing UI

#### 2.1 Ticket Purchase Page (3-4 days)
**File:** `pages/events/[slug]/tickets.tsx`

**Features:**
- Display event details from case study
- Show available ticket types with pricing
- Quantity selector
- Real-time availability (prevent overselling)
- "Buy Tickets" button → Stripe Checkout
- Mobile-responsive design

**UI Components:**
- Ticket type cards with pricing
- Quantity selector
- Total price calculator
- Countdown timer for sale end dates
- Sold out indicators

#### 2.2 Ticket Confirmation Page (1-2 days)
**File:** `pages/tickets/[ticketId]/confirmation.tsx`

**Features:**
- Display purchase confirmation
- Show QR code(s) for each ticket
- Download PDF option
- Email confirmation sent automatically
- Add to calendar button

#### 2.3 Email Templates (1 day)
**File:** `utils/email-templates/ticket-confirmation.tsx`

**Content:**
- Event details
- Ticket information
- QR code image(s)
- Check-in instructions
- Contact information
- Add to calendar link

### Week 3: Admin Interface

#### 3.1 Admin Ticket Dashboard (2-3 days)
**File:** `pages/admin/events/[id]/tickets.tsx`

**Features:**
- Ticket sales overview (total sold, revenue, availability)
- Ticket type management (create, edit, delete)
- Sales chart/graph
- Recent purchases list
- Export functionality (CSV)

#### 3.2 Check-in Interface (2-3 days)
**File:** `pages/admin/tickets/check-in.tsx`

**Features:**
- QR code scanner (camera-based)
- Manual entry option
- Real-time validation
- Check-in success/failure feedback
- Check-in history/logs
- Mobile-optimized for event staff

**Components:**
- Camera scanner component
- Check-in status indicators
- Search by name/email
- Bulk check-in (for groups)

#### 3.3 Ticket Management (1-2 days)
**File:** `pages/admin/tickets/[ticketId].tsx`

**Features:**
- View ticket details
- Manual check-in override
- Refund processing
- Resend confirmation email
- Transfer ticket (future feature)

---

## 📋 Phase 2: Enhanced Features (2-3 Weeks)

### Week 4-5: Advanced Features

#### 4.1 Multiple Ticket Types (3-4 days)
- Support for VIP, General Admission, Early Bird, etc.
- Different pricing tiers
- Separate inventory tracking
- Visual distinction in UI

#### 4.2 Inventory Management (2-3 days)
- Real-time availability updates
- Waitlist functionality (when sold out)
- Automatic notifications when tickets become available
- Oversell prevention with database locks

#### 4.3 Refund Processing (2-3 days)
- Admin-initiated refunds
- Automatic Stripe refund processing
- Refund confirmation emails
- Refund analytics

#### 4.4 Analytics Dashboard (2-3 days)
- Sales trends over time
- Revenue reports
- Check-in rates
- Popular ticket types
- Geographic data (if collected)

### Week 6: Polish & Testing

#### 6.1 Testing (3-4 days)
- End-to-end purchase flow testing
- QR code validation testing
- Check-in system testing
- Payment webhook testing
- Mobile device testing

#### 6.2 Documentation (1-2 days)
- Admin user guide
- Check-in staff guide
- API documentation
- Troubleshooting guide

---

## 📋 Phase 3: Advanced Features (Optional, 2-3 Weeks)

### Promo Codes & Discounts
- Create discount codes
- Percentage or fixed amount discounts
- Usage limits
- Expiration dates

### Ticket Transfers
- Allow ticket holders to transfer tickets
- Email-based transfer system
- Transfer confirmation

### Group Bookings
- Bulk purchase discounts
- Group check-in
- Group management

### Advanced Analytics
- Customer lifetime value
- Repeat purchase tracking
- Marketing attribution
- A/B testing for pricing

---

## 🔧 Technical Implementation Details

### Dependencies to Add
```json
{
  "qrcode": "^1.5.3",           // QR code generation
  "@types/qrcode": "^1.5.5",    // TypeScript types
  "html5-qrcode": "^2.3.8"      // QR code scanning
}
```

### Stripe Integration Points
- **Checkout Sessions:** Already configured, reuse existing setup
- **Webhooks:** Extend existing webhook handler
- **Payment Intents:** Track payment status
- **Refunds:** Use Stripe refund API

### Email Service
- Reuse existing email infrastructure
- Use Resend or current email provider
- Template-based emails

### Security Considerations
1. **QR Code Validation:**
   - Hash-based validation (not just ID)
   - Prevent brute force scanning
   - Rate limiting on validation endpoint

2. **Payment Security:**
   - Server-side validation only
   - Webhook signature verification
   - Idempotency keys for duplicate prevention

3. **Data Privacy:**
   - GDPR compliance for EU customers
   - Secure storage of purchaser data
   - RLS policies for data access

---

## 📊 Success Metrics

### Key Performance Indicators
- **Ticket Sales:** Number of tickets sold per event
- **Revenue:** Total revenue generated
- **Conversion Rate:** % of visitors who purchase tickets
- **Check-in Rate:** % of tickets actually used
- **Refund Rate:** % of tickets refunded
- **Average Order Value:** Average purchase amount

### Reporting
- Daily sales reports
- Event-specific analytics
- Revenue forecasting
- Customer insights

---

## 💰 Revenue Model

### Pricing Strategy
- **Platform Fee:** 2.9% + $0.30 per transaction (Stripe fees)
- **Optional Service Fee:** Add small fee to cover platform costs
- **No Monthly Fees:** Pay-as-you-go model

### Revenue Opportunities
1. **Direct Ticket Sales:** Primary revenue stream
2. **Service Fees:** Optional per-ticket fee
3. **Premium Features:** Advanced analytics, custom branding (future)

---

## 🚀 Deployment Plan

### Pre-Launch Checklist
- [ ] Database migrations tested
- [ ] Stripe webhooks configured
- [ ] Email templates tested
- [ ] QR code generation tested
- [ ] Check-in system tested on mobile devices
- [ ] Admin training completed
- [ ] Documentation finalized

### Launch Strategy
1. **Soft Launch:** Test with 1-2 events
2. **Monitor:** Watch for issues, gather feedback
3. **Iterate:** Fix bugs, improve UX
4. **Full Launch:** Roll out to all events

### Rollback Plan
- Database migrations are reversible
- Feature flags for gradual rollout
- Ability to disable ticketing per event

---

## 📝 Risk Assessment

### Low Risk
- ✅ Payment processing (proven Stripe integration)
- ✅ QR code generation (standard libraries)
- ✅ Email delivery (existing infrastructure)

### Medium Risk
- ⚠️ Inventory management (race conditions)
- ⚠️ QR code validation security
- ⚠️ Mobile check-in UX

### Mitigation Strategies
- Database transactions for inventory
- Rate limiting on validation
- Extensive mobile testing
- Comprehensive error handling

---

## 🎯 Approval Checklist

### For MVP Approval:
- [ ] Database schema approved
- [ ] UI/UX mockups reviewed
- [ ] Technical approach confirmed
- [ ] Timeline agreed upon
- [ ] Budget confirmed ($0 additional cost)
- [ ] Success metrics defined

### For Full Launch:
- [ ] MVP tested and validated
- [ ] User feedback incorporated
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation finalized

---

## 📅 Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 1: MVP** | 2-3 weeks | Basic ticketing system with purchase, QR codes, and check-in |
| **Phase 2: Enhanced** | 2-3 weeks | Multiple ticket types, refunds, analytics |
| **Phase 3: Advanced** | 2-3 weeks | Promo codes, transfers, group bookings |
| **Total** | 6-9 weeks | Full-featured ticketing platform |

---

## ✅ Next Steps

1. **Review and approve this plan**
2. **Prioritize features** (MVP vs. full-featured)
3. **Assign resources** (developer time)
4. **Set launch date** for first event
5. **Begin Phase 1 implementation**

---

## 💬 Questions for Discussion

1. **Pricing:** Should we add a service fee, or just pass through Stripe fees?
2. **Inventory:** Do we need waitlist functionality in MVP?
3. **Check-in:** Should check-in be mobile-only, or also support desktop?
4. **Refunds:** Manual only in MVP, or automated refunds?
5. **Integration:** Should tickets link to existing `events` table, or only `case_studies`?

---

**Prepared by:** AI Assistant  
**Date:** January 2025  
**Status:** Awaiting Approval

