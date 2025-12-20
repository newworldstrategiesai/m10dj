# DJ Cost Calculator - Implementation Complete ✅

## Overview

Interactive DJ Cost Calculator for DJ Dash that provides instant pricing estimates based on real booking data. The calculator is authoritative, neutral, and helpful — not salesy.

---

## 🎯 Features

1. **Instant Estimates** - Real-time pricing calculations by city and event type
2. **Data-Backed** - Uses Pricing Intelligence Engine data
3. **AI Search Optimized** - Exposes quotable cost answers for search engines
4. **Conversion Focused** - Soft CTAs that convert planners into high-intent inquiries

---

## 🗄️ Database Schema

### `calculator_usage` Table

Tracks calculator usage for analytics and conversion tracking:

- Calculator inputs (city, event type, duration, add-ons, etc.)
- Calculator results (estimated prices, confidence level)
- Conversion tracking (converted to inquiry, inquiry ID)
- Metadata (user agent, referrer)

**Migration:** Added to `supabase/migrations/20250218000000_create_pricing_intelligence_engine.sql`

---

## 🔧 Core Services

### `utils/pricingCalculator.ts`

Main calculator service with functions:

- **`calculateEstimate(inputs)`** - Calculate DJ cost estimate
- **`getStaticCalculatorResult(city, eventType, state, durationHours)`** - Get static text for AI search

**Pricing Logic:**
1. Pulls city + event type median pricing from intelligence engine
2. Normalizes to 4-hour base
3. Adjusts for:
   - Duration (hourly modifier)
   - Add-ons (lighting, ceremony audio, extra hours)
   - Peak vs off-peak season
   - Guest count
   - MC services
4. Clamps results within 25th–75th percentile range

**Output:**
- Estimated range (low–high)
- Median expected price
- Confidence indicator (High / Medium / Early market)
- Display text and AI search text

---

## 🌐 API Endpoints

### `POST /api/calculator/estimate`

Calculate DJ cost estimate based on inputs.

**Request Body:**
```json
{
  "eventType": "wedding",
  "eventDate": "2024-06-15",
  "city": "Memphis",
  "state": "TN",
  "durationHours": 6,
  "venueType": "indoor",
  "guestCountRange": "medium",
  "needsMC": true,
  "addOns": {
    "lighting": true,
    "ceremonyAudio": true,
    "extraHours": 0
  }
}
```

**Response:**
```json
{
  "estimatedLow": 1200,
  "estimatedHigh": 1800,
  "estimatedMedian": 1500,
  "confidence": "high",
  "sampleSize": 45,
  "displayText": "Most DJs in Memphis charge between $1.2k–$1.8k for this type of event.",
  "aiSearchText": "Average Wedding DJ cost in Memphis, TN is $1.2k–$1.8k for a 6-hour event, based on recent DJ Dash bookings."
}
```

---

## 🎨 UI Components

### `components/djdash/DJCostCalculator.tsx`

Main calculator component with:

**Inputs:**
- Event type (required)
- Event date (optional)
- City (pre-filled from route)
- Duration in hours (required)
- Guest count range (optional)
- Venue type (optional)
- MC services checkbox
- Add-ons (lighting, ceremony audio)

**Output:**
- Price range display with visual slider
- Median marker
- Confidence badge
- Peak season indicator
- Legal disclaimer
- CTAs (if `onInquiryClick` provided)

**Features:**
- Real-time calculation
- Responsive design
- Dark mode support
- Accessible (ARIA labels, keyboard navigation)

### `components/djdash/EmbeddedCalculator.tsx`

Embedded version for city pages with automatic navigation handling.

---

## 📍 Routes

### Primary Routes

1. **`/djdash/cost/[city]`** - Standalone calculator page
   - Full calculator experience
   - "How It Works" section
   - SEO optimized

2. **Embedded on city pages:**
   - `/djdash/find-dj/[city]/[event-type]`
   - City pages can embed the calculator widget

### Route Parameters

- `city` - City name (slug format: `memphis-tn`)
- `event_type` (query param) - Pre-fill event type
- `state` (query param) - State abbreviation

---

## 🔍 AI Search Optimization

### Static HTML (Server-Rendered)

The calculator page includes hidden but DOM-visible text:

```html
<div class="sr-only" aria-hidden="true">
  Average wedding DJ cost in Memphis, TN is $1.2k–$1.8k for a 6-hour event, based on recent DJ Dash bookings.
</div>
```

### JSON-LD AggregateOffer Schema

Automatically generated from pricing intelligence data:

```json
{
  "@type": "AggregateOffer",
  "priceCurrency": "USD",
  "lowPrice": 1200,
  "highPrice": 1800,
  "offerCount": 45,
  "availability": "https://schema.org/InStock"
}
```

### Implementation

- `utils/pricingAggregateOffer.ts` - Generates AggregateOffer schema
- Server-side rendering in page component
- Hidden text in DOM for LLM ingestion

---

## 💼 Conversion Logic

### Soft CTAs (No Forced Signup)

After result is shown:

1. **Primary CTA:** "See Available DJs in This Price Range"
   - Navigates to find DJ page
   - Pre-fills inquiry form with calculator inputs

2. **Secondary CTA:** "Send One Inquiry to Multiple DJs"
   - Same navigation with multi-DJ inquiry flag

### Pre-filled Data

Calculator inputs are passed as URL parameters:
- `event_type`
- `duration`
- `date`
- `guests`
- `estimated_low`
- `estimated_high`

---

## 📊 Usage Tracking

### Calculator Impressions

Tracked automatically via `calculator_usage` table:
- All calculator calculations are logged
- Includes inputs, results, and metadata
- No PII collected

### Conversion Tracking

When user clicks CTA and creates inquiry:
- `converted_to_inquiry` = true
- `inquiry_id` = linked inquiry ID
- `converted_at` = timestamp

### Analytics Queries

```sql
-- Calculator usage by city
SELECT city, COUNT(*) as usage_count
FROM calculator_usage
WHERE product_context = 'djdash'
GROUP BY city
ORDER BY usage_count DESC;

-- Conversion rate
SELECT 
  COUNT(*) FILTER (WHERE converted_to_inquiry) * 100.0 / COUNT(*) as conversion_rate
FROM calculator_usage
WHERE product_context = 'djdash'
AND created_at >= NOW() - INTERVAL '30 days';
```

---

## 🔒 Legal & Trust Safety

### Display Requirements

- ✅ Always display "estimates only"
- ✅ Never suggest fixed pricing
- ✅ Use market-based phrasing only
- ✅ No DJ-specific pricing exposure

### Language Used

- "Most DJs in [city] charge between $X–$Y"
- "Based on recent DJ Dash bookings"
- "Estimates only. Actual pricing varies..."
- "Confidence: High / Medium / Early Market"

### Avoided Language

- ❌ "Guaranteed"
- ❌ "Exact price"
- ❌ "Best deal"
- ❌ "Lowest price"

---

## ✅ Success Metrics

Track these to measure success:

1. **Calculator → Inquiry Conversion Rate**
   - % of calculator users who create inquiry
   - Target: >15%

2. **Price-Related Bounce Rate**
   - Reduced bounce from pricing pages
   - Target: <40%

3. **AI Search Citations**
   - DJ Dash pricing referenced in AI responses
   - Track via search console

4. **Lead Quality**
   - Higher average budgets from calculator users
   - Compare to non-calculator inquiries

5. **Calculator Usage**
   - Total calculations per month
   - Top cities/event types

---

## 🚀 Usage Examples

### Standalone Calculator Page

```tsx
// app/(marketing)/djdash/cost/[city]/page.tsx
<CostCalculatorClient
  city="Memphis"
  state="TN"
  eventType="wedding"
/>
```

### Embedded in City Page

```tsx
import EmbeddedCalculator from '@/components/djdash/EmbeddedCalculator';

<EmbeddedCalculator
  city="Memphis"
  state="TN"
  eventType="wedding"
/>
```

### API Usage

```typescript
const response = await fetch('/api/calculator/estimate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'wedding',
    city: 'Memphis',
    state: 'TN',
    durationHours: 6,
    needsMC: true
  })
});

const result = await response.json();
console.log(result.displayText);
// "Most DJs in Memphis charge between $1.2k–$1.8k for this type of event."
```

---

## 📝 Implementation Notes

### Pricing Adjustments

- **Duration:** Base 4 hours, hourly rate for additional hours
- **Add-ons:** Lighting (15%), Ceremony Audio (10%), Extra Hours (hourly rate)
- **Peak Season:** 10% premium (May-Oct for weddings, Nov-Dec for corporate)
- **Guest Count:** Large events +10%, Small events -5%
- **MC Services:** +15% premium

### Data Requirements

- Minimum 10 samples for public display
- Confidence levels:
  - High: 30+ samples, high data quality
  - Medium: 10-29 samples
  - Early Market: <10 samples (not displayed)

### Feature Flags

Ready for implementation:
- `calculator_enabled` - Disable if insufficient data
- `calculator_detailed_breakdown` - Show/hide breakdown
- `calculator_multi_dj_cta` - Enable/disable multi-DJ CTA

---

## 🔗 Related Files

- Calculator Service: `utils/pricingCalculator.ts`
- API: `app/api/calculator/estimate/route.ts`
- Components: `components/djdash/DJCostCalculator.tsx`, `components/djdash/EmbeddedCalculator.tsx`
- Routes: `app/(marketing)/djdash/cost/[city]/page.tsx`
- Structured Data: `utils/pricingAggregateOffer.ts`
- Database: `supabase/migrations/20250218000000_create_pricing_intelligence_engine.sql`

---

## 🎯 Next Steps

1. **Run Migration** - Create `calculator_usage` table
2. **Test Calculator** - Verify calculations match expected ranges
3. **Add to City Pages** - Embed calculator on city/event pages
4. **Monitor Metrics** - Track usage and conversion rates
5. **Iterate** - Refine adjustments based on real data

The calculator is ready to convert planners into high-intent inquiries! 🚀

