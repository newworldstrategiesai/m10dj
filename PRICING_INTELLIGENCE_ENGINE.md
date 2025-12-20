# Pricing Intelligence Engine - Implementation Complete ✅

## Overview

The Pricing Intelligence Engine aggregates real inquiry and booking data to provide market-based pricing insights for DJ Dash. All pricing claims are data-backed and properly hedged with "based on recent DJ Dash bookings."

## Core Philosophy

**Pricing must be data-backed, not opinion-based.**
Always hedge claims with "based on recent DJ Dash bookings."

---

## 🗄️ Database Schema

### Tables Created

1. **`city_pricing_stats`** - Cached aggregated pricing statistics
   - Stores percentiles (25th, 50th, 75th)
   - Tracks data quality and sample sizes
   - Includes trend indicators
   - Scoped to DJ Dash product context

2. **`dj_pricing_insights`** - Individual DJ market comparisons
   - Compares DJ's pricing to city median
   - Shows market position (below/at/above market)
   - Provides non-binding insights

3. **`pricing_history`** - Historical snapshots for trend analysis
   - Tracks pricing changes over time
   - Enables trend detection

### Migration File
- `supabase/migrations/20250218000000_create_pricing_intelligence_engine.sql`

---

## 🔧 Core Services

### `utils/pricingEngine.ts`

Main pricing engine service with functions:

- **`getCityPricing(city, eventType, state?)`** - Get cached pricing stats
- **`getCityPricingRange(city, eventType, state?)`** - Get formatted price range
- **`computeCityPricingStats(city, eventType, state?, daysBack?)`** - Compute and cache stats
- **`getDJPricingInsight(djProfileId, city, eventType, state?)`** - Get DJ market comparison
- **`normalizePriceTo4Hour(price, pricingModel, durationHours)`** - Normalize pricing models
- **`formatPriceRange(low, high)`** - Format prices for display

### Data Sources

The engine aggregates from:
1. **`dj_inquiries`** - Budget amounts and ranges from inquiries
2. **`contacts`** - Quoted and final prices from converted bookings
3. **`dj_profiles`** - Price ranges from DJ profiles

All pricing is normalized to 4-hour equivalent for comparison.

---

## 🌐 API Endpoints

### `GET /api/pricing/city`
Returns pricing statistics for a city and event type.

**Query Parameters:**
- `city` (required) - City name
- `event_type` (optional) - Event type filter
- `state` (optional) - State abbreviation

**Response:**
```json
{
  "low": 900,
  "median": 1250,
  "high": 1600,
  "formatted": "$900–$1.6k"
}
```

### `GET /api/pricing/dj`
Returns pricing insights comparing DJ's rates to market (authenticated).

**Query Parameters:**
- `dj_profile_id` (required) - DJ profile ID
- `city` (required) - City name
- `event_type` (required) - Event type
- `state` (optional) - State abbreviation

**Response:**
```json
{
  "market_position": "below_market",
  "position_percentage": -12.5,
  "market_median": 1250,
  "market_low": 900,
  "market_high": 1600,
  "market_range_text": "$900–$1.6k",
  "insight_text": "DJs in Memphis typically charge $900–$1,600 for wedding events...",
  "positioning_text": "You are currently priced 12% below the city median."
}
```

---

## 🎨 UI Components

### `components/djdash/PricingInsightWidget.tsx`

DJ dashboard widget showing market comparison.

**Props:**
- `djProfileId` - DJ profile ID
- `city` - City name
- `eventType` - Event type
- `state` (optional) - State abbreviation

**Features:**
- Visual market position indicator
- Price range display
- Market median comparison
- Trend indicators
- Legal disclaimer

### `components/djdash/CityPricingDisplay.tsx`

City page pricing display component.

**Props:**
- `city` - City name
- `eventType` - Event type
- `state` (optional) - State abbreviation
- `className` (optional) - Additional CSS classes

**Features:**
- Price range card
- Trend indicators
- Data quality indicators
- Proper hedging language

**Also includes:**
- `CityPricingText` - Inline text component for paragraphs

---

## 📊 Structured Data

### `utils/pricingAggregateOffer.ts`

Generates AggregateOffer JSON-LD schema for AI search optimization.

**Functions:**
- `generateAggregateOffer(city, eventType, state?)` - Single event type
- `generateMultipleAggregateOffers(city, eventTypes, state?)` - Multiple event types

**Example Output:**
```json
{
  "@type": "AggregateOffer",
  "priceCurrency": "USD",
  "lowPrice": 900,
  "highPrice": 1600,
  "offerCount": 45,
  "availability": "https://schema.org/InStock"
}
```

---

## ⏰ Automated Computation

### `supabase/functions/compute-pricing-stats/index.ts`

Supabase Edge Function for daily computation of pricing stats.

**Setup Cron Job:**
```sql
SELECT cron.schedule(
  'compute-pricing-stats',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/compute-pricing-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**Manual Trigger:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/compute-pricing-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔒 Legal Safety Guardrails

All pricing displays include:

1. **Hedging Language:**
   - "Based on recent DJ Dash bookings"
   - "Market insights are informational only"
   - "Pricing decisions remain at your discretion"

2. **No Mandatory Pricing:**
   - No enforced minimums
   - No "recommended price" language
   - Use "market range" and "insight" wording only

3. **Non-Binding Recommendations:**
   - Suggestions are informational
   - Avoid language implying collusion
   - Phrase as market insight, not instruction

---

## 📈 Aggregation Logic

### Grouping
- **City** (required)
- **State** (optional)
- **Event Type** (wedding, corporate, private_party, etc.)
- **Time Window** (last 90 days, weighted highest)

### Calculations
- **Low** - 25th percentile
- **Median** - 50th percentile
- **High** - 75th percentile
- **Outliers** - Excluded using IQR method (1.5 × IQR)

### Data Quality
- **High** - 30+ samples
- **Medium** - 10-29 samples
- **Low** - <10 samples (not displayed publicly)

### Trend Detection
- Compare current period to previous period
- **Rising** - >5% increase
- **Stable** - -5% to +5% change
- **Declining** - <-5% decrease

---

## 🎯 Usage Examples

### City Page Integration

```tsx
import CityPricingDisplay from '@/components/djdash/CityPricingDisplay';

<CityPricingDisplay
  city="Memphis"
  eventType="wedding"
  state="TN"
/>
```

### DJ Dashboard Integration

```tsx
import PricingInsightWidget from '@/components/djdash/PricingInsightWidget';

<PricingInsightWidget
  djProfileId={profile.id}
  city={profile.city}
  eventType="wedding"
  state={profile.state}
/>
```

### Structured Data Integration

```tsx
import { generateAggregateOffer } from '@/utils/pricingAggregateOffer';

const aggregateOffer = await generateAggregateOffer('Memphis', 'wedding', 'TN');

// Add to page structured data
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(aggregateOffer)
  }}
/>
```

---

## ✅ Success Metrics

Track these metrics to measure success:

1. **Inquiry → Conversion Rate**
   - Increased bookings from price-aligned inquiries

2. **Price-Related Lead Drop-off**
   - Reduced abandonment due to pricing concerns

3. **DJ Price Adjustments**
   - DJs adjusting prices toward market median

4. **AI Search References**
   - Pricing stats appearing in AI search responses

5. **Data Quality**
   - Sample sizes increasing over time
   - More cities with high-quality data

---

## 🚀 Next Steps

1. **Run Initial Computation:**
   ```bash
   # Trigger computation for all cities
   curl -X POST https://your-project.supabase.co/functions/v1/compute-pricing-stats
   ```

2. **Set Up Cron Job:**
   - Configure daily computation in Supabase
   - Monitor function logs for errors

3. **Integrate Components:**
   - Add `CityPricingDisplay` to city pages
   - Add `PricingInsightWidget` to DJ dashboard
   - Add AggregateOffer to structured data

4. **Monitor & Iterate:**
   - Track conversion rates
   - Gather DJ feedback
   - Refine aggregation logic as needed

---

## 📝 Notes

- All pricing is normalized to 4-hour equivalent
- Outliers are excluded using IQR method
- Minimum sample size of 10 required for public display
- All data is scoped to DJ Dash product context
- Historical data is preserved for trend analysis

---

## 🔗 Related Files

- Database: `supabase/migrations/20250218000000_create_pricing_intelligence_engine.sql`
- Engine: `utils/pricingEngine.ts`
- API: `app/api/pricing/city/route.ts`, `app/api/pricing/dj/route.ts`
- Components: `components/djdash/PricingInsightWidget.tsx`, `components/djdash/CityPricingDisplay.tsx`
- Structured Data: `utils/pricingAggregateOffer.ts`
- Cron Job: `supabase/functions/compute-pricing-stats/index.ts`

