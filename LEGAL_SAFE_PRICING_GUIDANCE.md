# Legal-Safe Pricing Guidance Framework

## Overview

This document outlines the legal-safe pricing guidance system for DJ Dash, designed to provide market insights to DJs while maintaining legal compliance and avoiding anti-trust exposure.

## Core Principles

### 1. Inform, Don't Enforce
- DJs are **never required** to follow "recommended pricing"
- All data is clearly labeled as "market insight" or "suggested"
- Language emphasizes informational nature: "based on anonymized local market data"

### 2. Transparency with Disclaimers
- Every pricing guidance response includes required legal disclaimers
- Clear language: "You may adjust as you see fit"
- Explicit statement: "Pricing decisions are entirely at your discretion"

### 3. Avoid Explicit Collusion
- **Never** suggest "everyone must charge X"
- **Never** facilitate communication between DJs to coordinate pricing
- **Never** publish individual competitor pricing
- Only show aggregated, anonymized ranges

### 4. Opt-in for Data
- Only include DJs who consent to anonymized pricing data aggregation
- Privacy protection and legal compliance built-in
- Individual DJ data is never exposed

### 5. Tiered Access
- **Free tier**: Minimal insight (market range only)
- **Pro/Elite tier**: Full quartiles, market positioning, personalized insights
- Encourages upgrades without restricting free tier access

## Architecture

### Data Sources

1. **Historical Booking Data**
   - `dj_inquiries` table (budget_amount, budget_range)
   - `contacts` table (quoted_price, final_price)
   - `dj_profiles` table (price_range_min, price_range_max)

2. **Aggregation Rules**
   - Calculate median, quartiles (Q1, Q3) per city and event type
   - Normalize all pricing to 4-hour equivalent
   - Remove outliers using IQR method (1.5 × IQR)
   - Minimum sample size: 10 bookings

3. **Display Format**
   - Ranges only: "$900-$1,600" (never exact numbers)
   - Color-coded ranges (green = typical, yellow = below median, red = high)
   - Weekly automatic updates

### API Endpoints

#### GET `/api/djdash/pricing-guidance`
Returns pricing guidance with required disclaimers.

**Parameters:**
- `city` (required): City name
- `event_type` (required): Event type (wedding, corporate, etc.)
- `state` (optional): State abbreviation
- `dj_profile_id` (optional): DJ profile ID for personalized insights

**Response Structure:**
```json
{
  "city": "Memphis",
  "event_type": "wedding",
  "market_range": {
    "low": 900,
    "median": 1200,
    "high": 1600,
    "formatted": "$900–$1,600"
  },
  "suggested_range": {
    "low": 960,
    "high": 1440,
    "formatted": "$960–$1,440"
  },
  "disclaimer": "The following pricing is based on anonymized local market data...",
  "data_source_note": "Based on 45 anonymized bookings...",
  "educational_notes": {
    "higher_pricing_impact": "...",
    "lower_pricing_impact": "..."
  },
  "dj_comparison": {
    "current_price": 1100,
    "market_position": "below_market",
    "position_percentage": -8.33,
    "positioning_text": "You are currently priced 8% below the city median."
  }
}
```

#### POST `/api/cron/update-pricing-stats`
Weekly cron job to update pricing statistics.

**Security:** Requires `CRON_SECRET` header

**Process:**
1. Get all active cities and event types
2. Compute pricing stats for each combination
3. Update `city_pricing_stats` table
4. Generate DJ pricing insights

### Database Tables

#### `city_pricing_stats`
Cached aggregated pricing statistics by city and event type.

**Key Fields:**
- `price_low` (25th percentile)
- `price_median` (50th percentile)
- `price_high` (75th percentile)
- `sample_size`
- `data_quality` (high/medium/low)

#### `dj_pricing_insights`
Individual DJ pricing insights comparing their rates to market.

**Key Fields:**
- `market_position` (below_market/market_aligned/premium)
- `position_percentage`
- `insight_text`
- `positioning_text`

## UI Components

### PricingGuidanceWidget

Reusable React component for displaying pricing guidance in DJ dashboards.

**Props:**
- `city`: City name
- `eventType`: Event type
- `state`: Optional state
- `djProfileId`: Optional DJ profile ID

**Features:**
- Market range display
- Suggested range (median ± 20%)
- DJ comparison (if profile provided)
- Educational notes
- Legal disclaimers
- Subscription tier-based data access

## Legal Compliance Measures

### 1. Document Everything
- Data aggregation rules documented
- Disclaimers standardized
- Opt-in consent tracked
- Audit logs maintained

### 2. Avoid Communication Between DJs
- No chat features between DJs
- No email distribution lists
- Data is strictly platform-controlled
- No competitor names exposed

### 3. Use Ranges Only
- Never publish exact competitor rates
- Always show ranges: "$900-$1,600"
- Aggregate data only
- Anonymize all sources

### 4. Clear Disclaimers
Every response includes:
- "Based on anonymized local market data"
- "Informational purposes only"
- "You are not required to follow any suggested pricing"
- "Pricing decisions are entirely at your discretion"

### 5. Educational Context
- Explain impact of higher/lower pricing
- Provide market insights, not directives
- Focus on data, not recommendations

## Weekly Update Process

1. **Cron Job Trigger**
   - External service (cron-job.org, uptimerobot.com)
   - Weekly schedule: Every Monday at 2 AM
   - Endpoint: `/api/cron/update-pricing-stats`

2. **Data Collection**
   - Query last 90 days of bookings
   - Aggregate by city/event_type
   - Normalize to 4-hour equivalent

3. **Statistics Calculation**
   - Calculate quartiles
   - Remove outliers
   - Determine data quality
   - Calculate trends

4. **Storage**
   - Update `city_pricing_stats`
   - Update `pricing_history`
   - Generate `dj_pricing_insights`

## Subscription Tiers

### Free Tier
- Market range (formatted only)
- Basic suggested range
- Sample size indicator
- Data quality badge
- Upgrade message

### Pro/Elite Tier
- Full quartiles (Q1, median, Q3)
- Market positioning
- Personalized insights
- DJ comparison data
- Trend indicators
- Educational notes

## Risk Mitigation

### Anti-Trust Protection
- No price fixing or coordination
- Individual pricing never exposed
- Ranges only, never exact rates
- Educational context, not directives

### Data Privacy
- Anonymized aggregation only
- No individual DJ identification
- Opt-in consent required
- RLS policies enforce access control

### Legal Defensibility
- All disclaimers documented
- Audit logs maintained
- Clear "informational only" language
- No enforcement mechanisms

## Testing Checklist

- [ ] API returns proper disclaimers
- [ ] Free tier shows limited data
- [ ] Pro/Elite tier shows full data
- [ ] No individual DJ pricing exposed
- [ ] Ranges formatted correctly
- [ ] Weekly cron job runs successfully
- [ ] Outlier removal works correctly
- [ ] Sample size validation works
- [ ] DJ comparison calculates correctly
- [ ] Widget displays all required elements

## Future Enhancements

1. **AI Recommendations** (Optional)
   - "Based on your event type and availability, consider adjusting to $X–$Y"
   - Clearly labeled as "AI suggestion" not "requirement"

2. **Trend Analysis**
   - Show pricing trends over time
   - "Market is rising 5% vs last quarter"

3. **City Expansion**
   - Support multiple cities
   - Regional comparisons

4. **Event Type Expansion**
   - More granular event types
   - Custom event type support

## Support & Questions

For legal questions or concerns, consult local counsel, especially when expanding to multiple states.

