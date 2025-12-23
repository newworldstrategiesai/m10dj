# Bidding Dummy Data Control Solution

## Problem

The bidding interface uses dummy/fake data to create urgency, but:
1. **No admin control** - Admins can't disable or adjust it
2. **Can artificially inflate bids** - Small events get same aggressive dummy data as large events
3. **No context awareness** - Doesn't scale down when real activity exists

## Solution Overview

A comprehensive admin-controlled system that:
1. **Organization-level settings** - Stored in `organizations` table
2. **Admin UI** - Easy-to-use interface for controlling dummy data
3. **Context-aware scaling** - Automatically reduces dummy data when real activity exists
4. **Configurable aggressiveness** - Low, Medium, High presets + custom multipliers

## Database Schema

Added to `organizations` table:
- `bidding_dummy_data_enabled` (boolean) - Master toggle
- `bidding_dummy_data_aggressiveness` (enum: none/low/medium/high) - Preset level
- `bidding_dummy_data_max_bid_multiplier` (decimal 1.0-5.0) - Max dummy bid vs winning bid
- `bidding_dummy_data_frequency_multiplier` (decimal 0.1-3.0) - How often dummy data appears
- `bidding_dummy_data_scale_with_real_activity` (boolean) - Auto-scale down with real bids

## Configuration System

### Aggressiveness Presets

**None** - Disabled
- No dummy data shown
- Only real bids/activity visible

**Low** - Subtle
- Max bid: 20% above current
- Frequency: 50% of normal
- Viewer count: 5-12
- Best for: Small events, intimate settings

**Medium** - Balanced (Default)
- Max bid: 50% above current
- Frequency: Normal
- Viewer count: 8-25
- Best for: Most events

**High** - Very Visible
- Max bid: 100% above current (double)
- Frequency: 150% of normal
- Viewer count: 15-40
- Best for: Large events, high-energy crowds

### Context-Aware Scaling

When `scale_with_real_activity` is enabled:
- **Real bids exist**: Reduce dummy data by 20% per real bid (exponential decay)
- **Real requests exist**: Reduce fake requests proportionally
- **High winning bid ($50+)**: Reduce dummy bids by 30%
- **Very high winning bid ($100+)**: Reduce dummy bids by another 50%

This prevents:
- Artificially inflating bids when real activity exists
- Overwhelming small events with aggressive dummy data
- Creating unrealistic bidding wars

## API Endpoints

### GET `/api/organizations/bidding-settings?organizationId=xxx`
Returns current dummy data settings for an organization.

### PUT `/api/organizations/bidding-settings`
Updates dummy data settings (requires admin auth).

## Admin UI Component

`components/admin/BiddingDummyDataSettings.js` - A user-friendly interface with:
- Toggle to enable/disable dummy data
- Aggressiveness selector (None/Low/Medium/High)
- Advanced controls (multipliers, scaling toggle)
- Real-time preview of settings
- Context-aware recommendations

## Implementation Status

✅ Database migration created
✅ Configuration utility (`utils/bidding-dummy-data-config.js`)
✅ API endpoints created
⏳ Admin UI component (next step)
⏳ Update BiddingInterface to use config (next step)

## Usage Example

```javascript
import { getDummyDataConfig } from '@/utils/bidding-dummy-data-config';

// In BiddingInterface component
const dummyConfig = getDummyDataConfig(organization, {
  realBidCount: requests.filter(r => !r.is_dummy).length,
  realRequestCount: requests.filter(r => !r.is_fake).length,
  currentWinningBid: Math.max(...requests.map(r => r.current_bid_amount || 0))
});

// Use config to control dummy data generation
if (dummyConfig.enabled) {
  const maxDummyBid = getMaxDummyBidAmount(currentWinningBid, dummyConfig);
  const dummyBidCount = getDummyBidCount(dummyConfig, realBidCount);
  // ... generate dummy data based on config
}
```

## Benefits

1. **Admin Control** - Full control over dummy data visibility
2. **Event-Appropriate** - Small events won't get overwhelmed
3. **Prevents Bid Inflation** - Auto-scales down with real activity
4. **Flexible** - Presets + custom multipliers for fine-tuning
5. **Transparent** - Admins know exactly what's happening

## Next Steps

1. Create admin UI component
2. Update BiddingInterface to use the config system
3. Test with different event sizes
4. Add analytics to track effectiveness

