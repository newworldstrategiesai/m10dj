# Bidding War Feature - Implementation Plan

## Feature Overview
Add a bidding war system to the M10 DJ Company requests page where:
- Crowd can send requests to the DJ
- Multiple users can bid on the same request
- Every 30 minutes, the highest bidder wins and their request is played
- Real-time bid updates visible to all users
- Automatic payment processing for winners

## Affected Products
- **M10DJCompany.com** - Primary product (this is where the feature lives)
- **DJDash.net** - No impact (different product)
- **TipJar.live** - No impact (different product)

## Database Schema Changes

### 1. New Table: `bidding_rounds`
Tracks each 30-minute auction period:
```sql
CREATE TABLE bidding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL, -- Sequential round number
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 30 minutes after started_at
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winning_request_id UUID REFERENCES crowd_requests(id),
  winning_bid_amount INTEGER, -- In cents
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. New Table: `bid_history`
Tracks all bids placed:
```sql
CREATE TABLE bid_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidding_round_id UUID REFERENCES bidding_rounds(id) ON DELETE CASCADE,
  request_id UUID REFERENCES crowd_requests(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  bidder_email TEXT,
  bidder_phone TEXT,
  bid_amount INTEGER NOT NULL, -- In cents
  payment_intent_id TEXT, -- Stripe payment intent (held, not charged yet)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'charged', 'refunded', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Updates to `crowd_requests` table
Add bidding-related fields:
```sql
ALTER TABLE crowd_requests
  ADD COLUMN IF NOT EXISTS bidding_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS current_bid_amount INTEGER DEFAULT 0, -- In cents
  ADD COLUMN IF NOT EXISTS highest_bidder_name TEXT,
  ADD COLUMN IF NOT EXISTS highest_bidder_email TEXT,
  ADD COLUMN IF NOT EXISTS bidding_round_id UUID REFERENCES bidding_rounds(id),
  ADD COLUMN IF NOT EXISTS is_auction_winner BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auction_won_at TIMESTAMP WITH TIME ZONE;
```

## API Endpoints

### 1. `POST /api/bidding/place-bid`
- Validates bid amount (must be higher than current bid)
- Creates payment intent (hold funds, don't charge yet)
- Creates bid_history record
- Updates crowd_requests.current_bid_amount
- Refunds previous highest bidder (if exists)
- Returns updated bid status

### 2. `GET /api/bidding/current-round`
- Returns current active bidding round
- Includes all requests in the round with current bids
- Includes countdown timer
- Real-time data

### 3. `GET /api/bidding/round/:roundId`
- Get details of a specific bidding round
- Includes all bids and winner information

### 4. `POST /api/cron/process-bidding-rounds` (Cron Job)
- Runs every minute (checks for rounds ending)
- Finds rounds that ended in the last minute
- Selects winner (highest bidder)
- Charges winner's payment intent
- Refunds all losing bidders
- Creates new bidding round for next 30 minutes
- Moves winning request to "playing" status

## Real-Time Updates

### Supabase Realtime Channels
- Subscribe to `bidding_rounds` table changes
- Subscribe to `bid_history` table changes
- Subscribe to `crowd_requests` table changes (for bid amount updates)

## Frontend Changes

### Requests Page (`pages/requests.js`)
1. **Bidding Mode Toggle**
   - Admin setting to enable/disable bidding for organization
   - If enabled, show bidding interface instead of regular payment

2. **Bidding Interface**
   - Display current highest bid
   - Countdown timer (time until round ends)
   - Bid input field (minimum bid = current bid + $1)
   - List of recent bids
   - Real-time updates via Supabase subscriptions

3. **Post-Auction Display**
   - Show winner announcement
   - Show next round start time
   - Display request queue

## Admin Interface

### New Admin Page: `/admin/bidding-rounds`
- View all bidding rounds
- See winners and bid amounts
- Manual round processing (if cron fails)
- Statistics (total revenue, average bid, etc.)

## Payment Flow

### When Bid is Placed:
1. Create Stripe Payment Intent with `capture_method: 'manual'`
2. Hold funds (authorize but don't charge)
3. Store payment_intent_id in bid_history
4. If user was previous highest bidder, refund their previous payment intent

### When Round Ends:
1. Find highest bidder
2. Charge their payment intent
3. Refund all other payment intents
4. Mark request as winner
5. Move request to "playing" status

## Edge Cases & Safety

1. **Tie Bids**: First bidder wins (or earliest timestamp)
2. **No Bids**: Round ends with no winner, next round starts
3. **Payment Failures**: 
   - If winner payment fails, try next highest bidder
   - If all fail, round ends with no winner
4. **Multiple Requests**: Each request can have its own bidding round, or all requests share one round
5. **Refund Failures**: Log error, manual intervention required
6. **Cron Job Failures**: Admin can manually process rounds

## Security Considerations

1. **Rate Limiting**: Limit bid submissions per user/IP
2. **Bid Validation**: Server-side validation of bid amounts
3. **Payment Security**: Use Stripe Payment Intents (not direct charges)
4. **Data Isolation**: Ensure organization_id filtering on all queries
5. **RLS Policies**: Update RLS for new tables

## Testing Strategy

1. **Unit Tests**: Bid validation, payment processing logic
2. **Integration Tests**: Full bidding flow, payment processing
3. **E2E Tests**: User places bid, round ends, winner selected
4. **Load Tests**: Multiple simultaneous bids
5. **Payment Tests**: Stripe test mode for refunds/charges

## Migration Strategy

1. Create new tables (non-breaking)
2. Add columns to crowd_requests (nullable, default values)
3. Deploy API endpoints
4. Deploy frontend changes (feature flag)
5. Enable for M10DJCompany.com organization
6. Monitor for issues
7. Roll out to other organizations if needed

## Rollback Plan

1. Disable bidding feature flag
2. Process any active rounds manually
3. Refund any held payments
4. Revert database migrations (if needed)

## Timeline Estimate

- Database schema: 2 hours
- API endpoints: 4 hours
- Cron job: 2 hours
- Frontend UI: 4 hours
- Real-time updates: 2 hours
- Admin interface: 2 hours
- Testing & bug fixes: 4 hours
- **Total: ~20 hours**

