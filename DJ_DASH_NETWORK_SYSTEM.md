# DJ Dash Network & Lead Distribution System

## 🎯 Overview
Complete lead distribution system for DJ Dash directory. Captures leads from directory pages and automatically distributes them to matching DJs in the network.

## ✅ Implementation Complete

### 1. Database Schema (`supabase/migrations/20250131000000_create_dj_network_system.sql`)

#### `dj_network_profiles` Table
Stores DJ profiles for directory listing and lead distribution:
- **Profile Info**: Business name, DJ name, bio, experience
- **Service Areas**: Cities and states where DJ operates
- **Event Types**: Types of events DJ handles
- **Pricing**: Starting price, price range
- **Portfolio**: Images, videos, testimonials
- **Ratings**: Average rating, total reviews
- **Lead Settings**: Accepts leads, max leads per month, response time
- **Subscription**: Tier, status, expiration
- **Performance**: Leads received, booking rate, response time

#### `lead_distributions` Table
Tracks which leads have been distributed to which DJs:
- Links contacts to DJ profiles
- Tracks distribution method (auto, manual, round_robin, best_match)
- Records DJ response (viewed, contacted, declined, accepted)
- Tracks outcome (contacted, declined, booked, lost, no_response)

#### Views & Indexes
- `active_djs_by_city` view for fast city-based queries
- GIN indexes on arrays (service_cities, service_states, event_types)
- RLS policies for security

### 2. Lead Distribution Logic (`utils/djdash/lead-distribution.ts`)

#### `findMatchingDJs(leadData)`
Finds DJs matching lead criteria:
- Filters by city/state
- Filters by event type
- Checks subscription status
- Checks monthly lead limits
- Sorts by priority (featured → verified → rating → booking rate)

#### `distributeLeadToDJs(leadData, maxDJs)`
Distributes lead to top matching DJs:
- Finds matching DJs
- Limits to maxDJs (default: 5)
- Creates distribution records
- Updates DJ lead counts
- Returns distribution IDs

#### Priority Calculation
DJs are prioritized by:
- Featured status (+100)
- Verified status (+50)
- Average rating (0-25 points)
- Booking rate (0-20 points)
- Review count (0-25 points)
- Subscription tier (0-30 points)

### 3. Lead Capture API (`app/api/djdash/lead-capture/route.ts`)

**Flow:**
1. Receives form submission from directory pages
2. Validates required fields
3. Saves lead to `contacts` table
4. Distributes lead to matching DJs (up to 5)
5. Redirects to thank you page

**Features:**
- Standardizes event types
- Stores source as "DJ Dash Directory"
- Includes custom fields (city, state, form URL)
- Error handling with graceful degradation

### 4. DJ Directory API (`app/api/djdash/djs/[city]/route.ts`)

**GET `/api/djdash/djs/[city]`**
Returns available DJs for a city:
- Filters by city, state, event type
- Returns public profile data only
- Sorted by featured, verified, rating
- Excludes sensitive information

**Query Parameters:**
- `eventType`: Filter by event type
- `state`: Filter by state

## 🔄 Lead Distribution Flow

```
1. Client submits form on directory page
   ↓
2. Lead saved to contacts table
   ↓
3. findMatchingDJs() finds eligible DJs
   ↓
4. DJs sorted by priority
   ↓
5. Top 5 DJs selected
   ↓
6. Distribution records created
   ↓
7. DJ lead counts updated
   ↓
8. (Future) Notifications sent to DJs
```

## 📊 Matching Criteria

### Location Matching
- **City Match**: Lead city in DJ's `service_cities` array
- **State Match**: Lead state in DJ's `service_states` array
- **Either Match**: If city OR state matches, DJ is eligible

### Event Type Matching
- **Exact Match**: Lead event type in DJ's `event_types` array
- **All Types**: DJ accepts "all" event types
- **Specific Match**: Lead event type in DJ's `lead_types_accepted` array

### Availability Checks
- DJ must be `is_active = true`
- DJ must have `accepts_leads = true`
- DJ must have active subscription (or no expiration)
- DJ must not have reached monthly lead limit

## 🎯 Priority System

DJs are ranked by:
1. **Featured** (highest priority)
2. **Verified**
3. **Average Rating** (0-5 stars)
4. **Booking Rate** (0-100%)
5. **Review Count**
6. **Subscription Tier** (Premium > Pro > Basic > Free)

## 📈 Performance Metrics

Each DJ profile tracks:
- `leads_received_total`: Total leads ever received
- `leads_contacted`: Leads that were contacted
- `leads_booked`: Leads that resulted in bookings
- `booking_rate`: Percentage of leads that booked
- `average_response_time_hours`: Average time to respond
- `current_month_leads`: Leads received this month

## 🔐 Security (RLS Policies)

### DJ Network Profiles
- **DJs**: Can view/update their own profile
- **Public**: Can view active profiles (for directory)
- **Admins**: Can manage all profiles

### Lead Distributions
- **DJs**: Can view their own distributions
- **Admins**: Can view all distributions

## 🚀 Next Steps

### Immediate
1. ✅ Database migration created
2. ✅ Lead distribution logic implemented
3. ✅ Lead capture API updated
4. ✅ DJ directory API created
5. ⏳ Run migration in Supabase
6. ⏳ Test lead distribution flow

### Short Term
7. **Notification System**: Email/SMS to DJs when they receive leads
8. **Admin Dashboard**: Manage DJ network, view distributions
9. **DJ Dashboard**: View received leads, respond/decline
10. **Lead Response Tracking**: Track when DJs contact leads

### Medium Term
11. **Round-Robin Distribution**: Alternate leads evenly
12. **Best-Match Algorithm**: ML-based matching
13. **Lead Quality Scoring**: Rate leads before distribution
14. **Automated Follow-ups**: Remind DJs to respond
15. **Analytics Dashboard**: Distribution performance metrics

## 📝 Usage Examples

### Creating a DJ Profile
```sql
INSERT INTO dj_network_profiles (
  user_id,
  organization_id,
  business_name,
  service_cities,
  service_states,
  event_types,
  accepts_leads,
  subscription_tier
) VALUES (
  'user-uuid',
  'org-uuid',
  'Memphis DJ Services',
  ARRAY['Memphis', 'Nashville'],
  ARRAY['TN', 'MS'],
  ARRAY['wedding', 'corporate'],
  true,
  'pro'
);
```

### Finding Matching DJs (via API)
```typescript
const matchingDJs = await findMatchingDJs({
  contact_id: 'contact-uuid',
  city: 'Memphis',
  state: 'TN',
  event_type: 'wedding',
  event_date: '2025-06-15'
});
```

### Distributing a Lead
```typescript
const distributions = await distributeLeadToDJs({
  contact_id: 'contact-uuid',
  city: 'Memphis',
  state: 'TN',
  event_type: 'wedding',
  event_date: '2025-06-15'
}, 5); // Distribute to top 5 DJs
```

## 🔍 Testing Checklist

- [ ] Run database migration
- [ ] Create test DJ profiles
- [ ] Submit test lead via directory form
- [ ] Verify lead saved to contacts table
- [ ] Verify distributions created
- [ ] Verify DJ lead counts updated
- [ ] Test matching logic with various criteria
- [ ] Test priority sorting
- [ ] Test monthly lead limits
- [ ] Test API endpoints

## 📚 Related Files

- `supabase/migrations/20250131000000_create_dj_network_system.sql` - Database schema
- `utils/djdash/lead-distribution.ts` - Distribution logic
- `app/api/djdash/lead-capture/route.ts` - Lead capture endpoint
- `app/api/djdash/djs/[city]/route.ts` - DJ directory API
- `app/(marketing)/djdash/find-dj/[city]/page.tsx` - Directory pages

