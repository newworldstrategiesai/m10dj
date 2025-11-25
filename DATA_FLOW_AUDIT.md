# Data Flow Audit - Invoice & Contract Views

## Overview
This document outlines the data flow for edits made in the invoice and contract views, ensuring all changes are properly synchronized across the entire application.

## Data Storage Architecture

### Lead Data (Event Details)
**Storage Location:** `contacts` table (primary) or `contact_submissions` table (fallback)
**API Endpoint:** `/api/leads/[id]/update` (PATCH)
**Fields Stored:**
- Client name (`first_name`, `last_name`)
- Client email (`email_address`)
- Event date (`event_date`)
- Event start time (`event_time`)
- Event end time (`end_time`)
- Venue name (`venue_name`)
- Venue address (`venue_address`)

### Quote/Invoice Data
**Storage Location:** `quote_selections` table
**API Endpoint:** `/api/quote/[id]/update-invoice` (POST)
**Fields Stored:**
- Total price (`total_price`)
- Package price (`package_price`)
- Custom line items (`custom_line_items`)
- Custom addons (`custom_addons`)
- Discount type (`discount_type`)
- Discount value (`discount_value`)
- Discount note (`discount_note`)
- Show line item prices (`show_line_item_prices`)
- Due date type (`due_date_type`)
- Due date (`due_date`)
- Deposit due date (`deposit_due_date`)
- Remaining balance due date (`remaining_balance_due_date`)

## Edit Capabilities by View

### Invoice View (`/quote/[id]/invoice`)
**Editable Lead Fields:**
- ✅ Event Date → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Venue Name → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Venue Address → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`

**Editable Invoice Fields:**
- ✅ Package price → Updates `quote_selections` via `/api/quote/[id]/update-invoice`
- ✅ Line item prices → Updates `quote_selections` via `/api/quote/[id]/update-invoice`
- ✅ Addon prices → Updates `quote_selections` via `/api/quote/[id]/update-invoice`
- ✅ Discounts → Updates `quote_selections` via `/api/quote/[id]/update-invoice`
- ✅ Payment due dates → Updates `quote_selections` via `/api/quote/[id]/update-invoice`
- ✅ Show/hide line item prices → Updates `quote_selections` via `/api/quote/[id]/update-invoice`

### Contract View (`/quote/[id]/contract`)
**Editable Lead Fields:**
- ✅ Client Name → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Client Email → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Event Date → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Event Start Time → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Event End Time → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Venue Name → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`
- ✅ Venue Address → Updates `contacts`/`contact_submissions` via `/api/leads/[id]/update`

**Editable Invoice Fields:**
- ❌ None (contract view does not edit invoice/quote data)

## Data Fetching Strategy

### All Views Use:
1. **Cache-Busting Timestamps:** `?_t=${timestamp}` appended to all API calls
2. **No-Cache Headers:** `{ cache: 'no-store' }` on all fetch requests
3. **API Cache-Control Headers:** All API endpoints set:
   ```javascript
   res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
   res.setHeader('Pragma', 'no-cache');
   res.setHeader('Expires', '0');
   ```

### Views with Visibility Change Listeners:
All views now refetch data when the page becomes visible (e.g., navigating from another tab/page):
- ✅ Invoice View (`/quote/[id]/invoice`)
- ✅ Contract View (`/quote/[id]/contract`)
- ✅ Quote Index View (`/quote/[id]/index`)
- ✅ Payment View (`/quote/[id]/payment`)

## Update Flow

### When Invoice Edits Lead Fields (Event Date, Venue):
1. User edits field in invoice view
2. Save triggers `/api/leads/[id]/update` (PATCH)
3. API updates `contacts` or `contact_submissions` table
4. Invoice view updates local state immediately
5. Invoice view calls `fetchData()` after 100ms delay (ensures DB commit)
6. Contract view automatically refetches when page becomes visible
7. All other views refetch on visibility change

### When Invoice Edits Invoice Fields (Prices, Discounts):
1. User edits field in invoice view
2. Save triggers `/api/quote/[id]/update-invoice` (POST)
3. API updates `quote_selections` table
4. Invoice view updates local state immediately
5. Invoice view calls `fetchData()` after save
6. Contract view automatically refetches when page becomes visible
7. Payment view automatically refetches when page becomes visible

### When Contract Edits Lead Fields:
1. User edits field in contract view
2. Save triggers `/api/leads/[id]/update` (PATCH)
3. API updates `contacts` or `contact_submissions` table
4. Contract view updates local state immediately
5. Contract view calls `fetchData()` after 300ms delay (ensures DB commit)
6. Invoice view automatically refetches when page becomes visible
7. All other views refetch on visibility change

## Data Consistency Guarantees

### ✅ Implemented:
1. **Cache-Busting:** All API calls use timestamps to prevent stale data
2. **No-Cache Headers:** Client-side fetch requests bypass browser cache
3. **Server-Side Cache Control:** API endpoints prevent CDN/edge caching
4. **Visibility Change Listeners:** All views refetch when page becomes visible
5. **Post-Update Refetch:** All views refetch data after successful updates
6. **State Updates:** Local state is updated immediately for better UX
7. **Database Commit Delays:** Small delays (100-300ms) ensure DB commits complete before refetch

### 🔍 Data Sources:
All views fetch from the same sources:
- **Lead Data:** `/api/leads/get-lead?id=${id}` → Returns data from `contacts` or `contact_submissions`
- **Quote Data:** `/api/quote/${id}` → Returns data from `quote_selections`

## Testing Checklist

### Invoice View Edits:
- [ ] Edit event date in invoice → Verify contract view shows updated date
- [ ] Edit venue in invoice → Verify contract view shows updated venue
- [ ] Edit prices in invoice → Verify payment view shows updated prices
- [ ] Edit discount in invoice → Verify contract view shows updated total

### Contract View Edits:
- [ ] Edit client name in contract → Verify invoice view shows updated name
- [ ] Edit event date in contract → Verify invoice view shows updated date
- [ ] Edit venue in contract → Verify invoice view shows updated venue
- [ ] Edit event time in contract → Verify invoice view shows updated time

### Cross-View Navigation:
- [ ] Make edit in invoice → Navigate to contract → Verify changes appear
- [ ] Make edit in contract → Navigate to invoice → Verify changes appear
- [ ] Make edit in invoice → Navigate to payment → Verify changes appear
- [ ] Make edit in contract → Navigate to quote index → Verify changes appear

## API Endpoints Summary

### Lead Updates
- **Endpoint:** `/api/leads/[id]/update`
- **Method:** PATCH
- **Updates:** `contacts` or `contact_submissions` table
- **Cache Control:** ✅ Implemented

### Quote/Invoice Updates
- **Endpoint:** `/api/quote/[id]/update-invoice`
- **Method:** POST
- **Updates:** `quote_selections` table
- **Cache Control:** ✅ Implemented

### Data Fetching
- **Lead Data:** `/api/leads/get-lead?id=${id}`
- **Quote Data:** `/api/quote/${id}`
- **Cache Control:** ✅ Implemented on both endpoints

## Recent Fixes Applied

1. ✅ Added cache-control headers to all API endpoints
2. ✅ Added visibility change listeners to invoice, payment, and quote index views
3. ✅ Added cache-busting timestamps to payment and quote index views
4. ✅ Ensured all views use `cache: 'no-store'` on fetch requests
5. ✅ Verified all update handlers call `fetchData()` after successful saves

## Notes

- **Database Commit Timing:** Small delays (100-300ms) are used after updates to ensure database commits complete before refetching. This prevents race conditions where a refetch might occur before the database has fully committed the transaction.

- **State Management:** Local state is updated immediately after successful API responses for better UX, but `fetchData()` is still called to ensure consistency with the database.

- **Error Handling:** All update operations include proper error handling and user feedback via toast notifications.

