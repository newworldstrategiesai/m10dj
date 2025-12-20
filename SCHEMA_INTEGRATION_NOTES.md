# Schema Integration Notes

## Changes Made to Integrate with Existing Schema

### Key Adaptations

1. **DJ Routing Metrics Table**
   - Changed from `djs` table to `dj_routing_metrics` table
   - Links directly to `dj_profiles(id)` via `dj_profile_id`
   - Extends existing `dj_profiles` rather than replacing it

2. **DJ Availability**
   - Extended existing `dj_availability` table instead of creating new one
   - Added columns: `locked_until`, `locked_by_lead_id`, `time_slots`, `auto_blocked`
   - Uses `dj_profile_id` (existing column) instead of `dj_id`

3. **Lead Assignments**
   - Uses `dj_profile_id` instead of `dj_id`
   - References `dj_profiles(id)` directly

4. **Call Tracking**
   - Uses existing `dj_calls` table structure as reference
   - Created `call_leads` for routing-specific call tracking
   - Links to `dj_profiles` via `dj_profile_id`
   - Extended `dj_virtual_numbers` with routing fields

5. **Leads Table**
   - New table for routing system
   - Links to `dj_inquiries` via `dj_inquiry_id` for compatibility
   - Can coexist with existing `dj_inquiries` system

### Foreign Key Relationships

```
leads
  ├─ dj_inquiry_id → dj_inquiries(id) [optional, for compatibility]
  └─ multi_inquiry_id → multi_inquiries(id) [if applicable]

dj_routing_metrics
  └─ dj_profile_id → dj_profiles(id) [required, unique]

dj_availability (extended)
  ├─ dj_profile_id → dj_profiles(id) [existing]
  └─ locked_by_lead_id → leads(id) [new]

lead_assignments
  ├─ lead_id → leads(id)
  └─ dj_profile_id → dj_profiles(id)

call_leads
  └─ dj_profile_id → dj_profiles(id)

city_event_stats
  └─ product_context = 'djdash' [scoped]
```

### Compatibility Notes

1. **Existing `dj_inquiries` System**
   - `leads` table is separate but can link via `dj_inquiry_id`
   - Both systems can coexist
   - Migration path: convert `dj_inquiries` to `leads` when ready

2. **Existing `dj_availability`**
   - Extended with routing fields
   - Existing data preserved
   - Locking mechanism added for concurrency

3. **Existing `dj_calls`**
   - `call_leads` is routing-specific
   - Can sync data between tables if needed
   - Both track calls but serve different purposes

4. **Service Area Matching**
   - Uses `dj_profiles.service_areas` array
   - Also checks `dj_profiles.city` for matching
   - Compatible with existing service area logic

### Migration Safety

- All new tables use `IF NOT EXISTS`
- All new columns use `ADD COLUMN IF NOT EXISTS`
- RLS policies check for existence before creating
- No data loss - only additions
- Backward compatible with existing systems

### Next Steps

1. Run migrations to create new tables/extend existing
2. Populate `dj_routing_metrics` from existing `dj_profiles` data
3. Sync `dj_availability` status with routing system
4. Optionally migrate `dj_inquiries` to `leads` over time
5. Set up background workers for routing phases

