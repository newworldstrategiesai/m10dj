# Lead Routing Infrastructure - Complete Implementation ✅

## Overview

Complete lead routing infrastructure for DJ Dash marketplace, including scoring, eligibility filtering, routing phases, response handling, call tracking, and multi-DJ blast capabilities.

---

## 🗄️ Database Schema

### Core Tables

1. **`leads`** - Incoming leads from planners
   - Scoring components (budget, urgency, completeness, demand)
   - Routing states (pending → scoring → routing → exclusive → tier_expansion → broadcast → responded → converted)
   - Form completeness tracking
   - Event urgency indicators

2. **`djs`** - DJ routing metrics and performance
   - Pricing tiers (premium, standard, budget)
   - Trust & performance metrics (reliability, response speed, conversion rate)
   - Routing scores (calculated)
   - Penalties (decay over time)
   - Cooldown tracking

3. **`dj_availability`** - Calendar availability with atomic locking
   - Date-based availability
   - Status (available, tentative, booked, unavailable)
   - Locking mechanism for concurrency (prevents double-booking)
   - Time slot support

4. **`lead_assignments`** - Lead-to-DJ assignments
   - Phase tracking (exclusive, tier_expansion, broadcast, concierge)
   - Exclusive window enforcement
   - Response tracking
   - Notification status

5. **`city_event_stats`** - Rolling statistics for routing
   - Demand/supply ratios
   - Price medians (30d, 90d)
   - Market tension indicators
   - Conversion stats

6. **`call_leads`** - Call tracking and attribution
   - Virtual number mapping
   - Call duration and quality
   - Conversion tracking
   - Source attribution

7. **`dj_virtual_numbers`** - DNI (Dynamic Number Insertion) mapping
   - Twilio virtual numbers
   - Rotation support
   - Call recording configuration

### Indexes

All tables include optimized indexes for:
- City + event type queries (most common routing query)
- Time-based queries (urgency, cooldowns)
- Routing state filtering
- Availability range queries
- Exclusive window enforcement

**Migration Files:**
- `supabase/migrations/20250219000000_create_lead_routing_infrastructure.sql`
- `supabase/migrations/20250219000001_create_call_tracking.sql`

---

## 🎯 Lead Scoring Engine

### `utils/leadScoring.ts`

**Scoring Components (0-100 total):**

1. **Budget Score (0-30 points)**
   - Compares lead budget midpoint to city median
   - Clamped: minimum 10 points (no <30 budget bias)
   - Premium budgets (+20%) = max score

2. **Urgency Score (0-25 points)**
   - Last minute (< 30 days) = max score
   - Urgent (30-60 days) = 20 points
   - Medium (60-90 days) = 15 points
   - Planned (90-180 days) = 12 points
   - Far out (> 180 days) = 8 points

3. **Completeness Score (0-15 points)**
   - Based on form_completeness (0-1)
   - Required fields worth more than optional

4. **Demand Score (0-20 points)**
   - Based on demand/supply ratio
   - High tension = max score
   - Low tension = lower score

5. **Event Type Priority (0-10 points)**
   - Wedding = 10 points
   - Corporate = 8 points
   - Private Party = 7 points
   - Other = 5-6 points

**Functions:**
- `calculateLeadScore(lead)` - Main scoring function
- `calculateFormCompleteness(lead)` - Form completeness calculator
- `saveLeadScore(leadId, result)` - Save scoring components

**Explainability:**
All score components stored in `scoring_components` JSONB field for audit trail.

---

## 🔍 DJ Eligibility Filter

### `utils/djEligibility.ts`

**Hard Filters (all must pass):**

1. **Availability Check**
   - DJ must be available on event date
   - Atomic check prevents double-booking
   - Status must be 'available' or 'tentative'
   - Not currently locked

2. **Pricing Overlap**
   - DJ price range must overlap with lead budget
   - Formula: `djPriceMin <= leadBudgetMax && djPriceMax >= leadBudgetMin`

3. **Reliability Score**
   - Must be >= 50 (minimum threshold)

4. **Status Checks**
   - `is_active = true`
   - `is_suspended = false`
   - Not on cooldown

**Functions:**
- `getEligibleDJs(filters)` - Get all eligible DJs, sorted by routing score
- `checkDJAvailability(djId, eventDate)` - Atomic availability check
- `lockDJAvailability(djId, eventDate, leadId, duration)` - Lock availability atomically
- `releaseDJAvailability(djId, eventDate)` - Release lock
- `batchCheckAvailability(djIds, eventDate)` - Optimized batch check

**Concurrency:**
Uses database-level locking to prevent race conditions when multiple leads target same DJ/date.

---

## 📊 DJ Routing Score Calculator

### `utils/djRoutingScore.ts`

**Components (total varies, typically 0-100):**

1. **Tier Weight (0-25 points)**
   - Premium = 25 points
   - Standard = 20 points
   - Budget = 15 points

2. **Response Speed (0-20 points)**
   - < 1 hour = max score
   - 1-4 hours = 18 points
   - 4-12 hours = 15 points
   - 12-24 hours = 12 points
   - > 48 hours = 5 points

3. **Conversion Rate (0-20 points)**
   - > 50% = max score
   - 40-50% = 18 points
   - 30-40% = 15 points
   - < 10% = 5 points

4. **Price Alignment (0-15 points)**
   - Within 10% of city median = max score
   - Within 20% = 12 points
   - Within 30% = 10 points
   - > 50% difference = 5 points (outlier)
   - **Note:** Rewards market alignment, not specific prices (avoids price fixing)

5. **Trust Score (0-15 points)**
   - Based on reliability_score (0-100)
   - Mapped linearly to 0-15 points

6. **Penalty Adjustment (negative)**
   - Recent lead penalty (decays over time)
   - Default decay: 10% per day
   - Max penalty: 20 points

**Functions:**
- `calculateDJRoutingScore(djId, city?, eventType?)` - Main calculation
- `updateDJRoutingScore(djId, result)` - Update in database
- `recalculateAllRoutingScores()` - Batch recalculation (run daily)

**Deterministic:**
All calculations are deterministic and stored for audit.

---

## 🚀 Routing Phases Orchestrator

### `utils/leadRouting.ts`

**Phases (sequential):**

1. **Exclusive Phase (15 minutes)**
   - Top 1 DJ only
   - Exclusive window enforced at DB level
   - DJ notified immediately
   - If no response, transitions to tier expansion

2. **Tier Expansion (30 minutes)**
   - Top 3 DJs (excluding already assigned)
   - No exclusive window
   - All DJs notified simultaneously
   - If no responses, transitions to broadcast

3. **Market Broadcast**
   - Up to 10 DJs
   - No exclusive window
   - Open market

4. **Concierge Escalation**
   - Triggered if no eligible DJs found
   - Manual intervention required

**Functions:**
- `routeLead(leadId, config?)` - Main routing function
- `routeExclusivePhase(leadId, eligibleDJs, config)` - Phase 1
- `routeTierExpansionPhase(leadId, eligibleDJs, config)` - Phase 2
- `routeBroadcastPhase(leadId, eligibleDJs, config)` - Phase 3
- `transitionToNextPhase(leadId)` - Background worker function

**Configuration:**
```typescript
{
  exclusiveWindowMinutes: 15,
  tierExpansionWindowMinutes: 30,
  maxExclusiveDJs: 1,
  maxTierExpansionDJs: 3,
  maxBroadcastDJs: 10
}
```

**Failure Handling:**
- If exclusive phase fails (no availability), falls through to tier expansion
- If tier expansion fails, falls through to broadcast
- All phases log errors but don't fail the routing

---

## ✅ Response Handling & Reputation Updates

### `utils/responseHandling.ts`

**Response Actions:**
- `accepted` - DJ accepts lead
- `declined` - DJ declines lead
- `ignored` - DJ doesn't respond (timeout)

**Metric Updates:**

1. **Acceptance**
   - Increases reliability (+1 to +2 based on speed)
   - Reduces penalty (-2 if fast response)
   - Updates acceptance rate

2. **Decline**
   - Reduces reliability (-1, -2 if high decline rate)
   - Updates decline rate

3. **Ignore**
   - Significantly reduces reliability (-3 to -8)
   - Increases penalty (+5, max 20)
   - Updates ignore rate

**Response Speed Tracking:**
- Rolling average (70% old, 30% new)
- Fast responses (< 1 hour) get bonus

**Functions:**
- `handleLeadResponse(assignmentId, action)` - Main handler
- `markLeadConverted(leadId, djId)` - Mark as booking
- `updateDJMetrics(djId, action, responseTime)` - Update metrics

**Incentives:**
- Fast responses = higher routing priority
- Ignoring leads = reduced future exposure
- High decline rate = lower reliability

---

## 📞 Call Tracking & Attribution

### `utils/callTracking.ts`

**Features:**
- Dynamic Number Insertion (DNI) via Twilio
- Call attribution to DJs, cities, leads
- Call duration tracking
- Conversion tracking
- Repeat caller detection

**Attribution Logic:**
- Calls >= 60 seconds = billable lead
- Calls < 30 seconds = ignored
- Repeat callers within 7 days = same lead

**Functions:**
- `getVirtualNumberForDJ(djProfileId)` - Get virtual number (with rotation)
- `logCallEvent(event, attribution)` - Log call
- `attributeCallToLead(callId, leadId)` - Link call to lead
- `markCallConverted(callId, bookingId, value)` - Mark as booking
- `getDJCallStats(djId, daysBack)` - Get call statistics

**API:**
- `POST /api/calls/webhook` - Twilio webhook handler

**Privacy:**
- Caller numbers hashed (SHA-256)
- Recording requires consent (state-dependent)
- Optional recording (Elite tier only)

---

## 💥 Multi-DJ Blast Engine

### `utils/multiDJBlast.ts`

**Flow:**
1. User submits single form
2. Lead created and scored
3. Eligible DJs identified
4. Routing phases triggered automatically
5. DJs respond in DJ Dash
6. Customer sees comparison UI
7. DJs pay to unlock customer contact

**Functions:**
- `processMultiDJInquiry(inquiry)` - Main processing function
- `getDJResponsesForLead(leadId)` - Get responses for comparison UI
- `unlockCustomerContact(leadId, djId)` - Unlock contact (after payment)

**API:**
- `POST /api/inquiries/multi-dj` - Submit multi-DJ inquiry

**Benefits:**
- Customer never sees DJ emails/phones initially
- Responses in comparison UI
- Prevents race-to-bottom pricing
- DJs pay to unlock contact (monetization)

---

## 🔒 Legal & Trust Safety

### What DJs See (Trust-Building)

**Public-Facing Explanation:**
- "DJ Dash prioritizes DJs who respond quickly"
- "Accurate calendars = more bookings"
- "Competitive pricing increases exposure"
- "Fast replies unlock priority placement"

**What We Don't Say:**
- Exact scoring formulas
- Penalty amounts
- Exclusive timing mechanics
- Price fixing language

### Price Guidance (Union-Like)

- "Most DJs in Memphis charge between $X–$Y"
- DJs can override pricing
- Outliers still get leads (just less frequently)
- Market naturally converges

**Avoids:**
- Price fixing
- Legal exposure
- DJ backlash

---

## 📈 Success Metrics

### Track These:

1. **Lead Acceptance Rate**
   - % of leads accepted by DJs
   - Target: > 60%

2. **Response Time**
   - Average time to first response
   - Target: < 4 hours

3. **Conversion Rate**
   - % of leads that convert to bookings
   - Target: > 25%

4. **Price Distribution**
   - Distribution by city/event type
   - Should converge toward median

5. **Supply vs Demand**
   - Ratio of leads to available DJs
   - Target: 1.0-2.0 (healthy tension)

6. **Calculator → Inquiry Conversion**
   - % of calculator users who create inquiry
   - Target: > 15%

7. **Call Attribution Rate**
   - % of calls attributed to leads
   - Target: > 40%

---

## 🚀 Next Steps

1. **Run Migrations**
   ```bash
   # Apply database migrations
   supabase migration up
   ```

2. **Set Up Background Workers**
   - Phase transition worker (check exclusive windows)
   - Routing score recalculation (daily)
   - City stats computation (daily)

3. **Configure Twilio**
   - Set up virtual numbers
   - Configure webhook URLs
   - Enable call recording (optional)

4. **Test Routing Flow**
   - Create test lead
   - Verify scoring
   - Verify eligibility filtering
   - Verify routing phases
   - Test response handling

5. **Monitor Metrics**
   - Set up dashboards
   - Track conversion rates
   - Monitor response times
   - Watch price distribution

---

## 📝 Files Created

### Database
- `supabase/migrations/20250219000000_create_lead_routing_infrastructure.sql`
- `supabase/migrations/20250219000001_create_call_tracking.sql`

### Services
- `utils/leadScoring.ts` - Lead scoring engine
- `utils/djEligibility.ts` - DJ eligibility filter
- `utils/djRoutingScore.ts` - DJ routing score calculator
- `utils/leadRouting.ts` - Routing phases orchestrator
- `utils/responseHandling.ts` - Response handling & reputation
- `utils/callTracking.ts` - Call tracking service
- `utils/multiDJBlast.ts` - Multi-DJ blast engine

### APIs
- `app/api/inquiries/multi-dj/route.ts` - Multi-DJ inquiry endpoint
- `app/api/calls/webhook/route.ts` - Twilio webhook handler

---

## 🎯 System Architecture

```
User Inquiry
    ↓
Lead Created → Scoring → Eligibility Filter → Routing Phases
    ↓                                              ↓
Multi-DJ Blast                              Exclusive → Tier → Broadcast
    ↓                                              ↓
DJ Responses ← Notifications              Response Handling
    ↓                                              ↓
Comparison UI                            Reputation Updates
    ↓                                              ↓
Contact Unlock                          Routing Score Recalc
```

---

## ✅ Implementation Status

- ✅ Database schema & migrations
- ✅ Lead scoring engine
- ✅ DJ eligibility filter
- ✅ DJ routing score calculator
- ✅ Routing phases orchestrator
- ✅ Response handling & reputation
- ✅ Call tracking system
- ✅ Multi-DJ blast engine

**Ready for:**
- Background workers
- Twilio integration
- Testing & monitoring

The infrastructure is complete and ready to route leads! 🚀

