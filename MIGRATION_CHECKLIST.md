# Lead Routing Infrastructure - Migration Checklist

## Pre-Migration

- [ ] Backup database
- [ ] Review existing `dj_profiles`, `dj_availability`, `dj_inquiries` data
- [ ] Verify `organizations` table has `product_context` column
- [ ] Check for any existing RLS policies on `dj_availability` and `dj_virtual_numbers`

## Migration Files

1. **`20250219000000_create_lead_routing_infrastructure.sql`**
   - Creates `leads` table
   - Creates `dj_routing_metrics` table
   - Extends `dj_availability` with locking fields
   - Creates `lead_assignments` table
   - Creates `city_event_stats` table
   - Sets up RLS policies
   - Creates triggers

2. **`20250219000001_create_call_tracking.sql`**
   - Creates `call_leads` table
   - Extends `dj_virtual_numbers` with routing fields
   - Creates RLS policies
   - Creates functions

## Post-Migration

### Data Population

1. **Initialize DJ Routing Metrics**
   ```sql
   -- Create routing metrics for all existing DJ profiles
   INSERT INTO dj_routing_metrics (dj_profile_id, is_active)
   SELECT id, is_published
   FROM dj_profiles
   WHERE NOT EXISTS (
     SELECT 1 FROM dj_routing_metrics 
     WHERE dj_profile_metrics.dj_profile_id = dj_profiles.id
   );
   ```

2. **Populate Pricing Data**
   ```sql
   -- Sync pricing from dj_profiles to dj_routing_metrics
   UPDATE dj_routing_metrics drm
   SET 
     price_range_min = dp.price_range_min,
     price_range_max = dp.price_range_max,
     price_range_midpoint = (dp.price_range_min + dp.price_range_max) / 2
   FROM dj_profiles dp
   WHERE drm.dj_profile_id = dp.id
     AND dp.price_range_min IS NOT NULL
     AND dp.price_range_max IS NOT NULL;
   ```

3. **Calculate Initial Routing Scores**
   - Run `recalculateAllRoutingScores()` function
   - Or use background job to calculate scores

### Testing

- [ ] Test lead creation
- [ ] Test lead scoring
- [ ] Test DJ eligibility filtering
- [ ] Test availability locking
- [ ] Test routing phases
- [ ] Test response handling
- [ ] Test call tracking
- [ ] Verify RLS policies work correctly

### Integration Points

1. **Link to Existing `dj_inquiries`**
   - When converting `dj_inquiries` to `leads`, set `dj_inquiry_id`
   - Allows tracking conversion from old system

2. **Sync with `dj_profiles`**
   - Keep `dj_routing_metrics` in sync with profile changes
   - Update pricing when profile pricing changes
   - Update service areas when profile service areas change

3. **Availability Sync**
   - Existing `dj_availability` records work as-is
   - New routing system adds locking on top
   - No data migration needed

## Rollback Plan

If issues occur:

1. **Drop new tables** (if needed):
   ```sql
   DROP TABLE IF EXISTS call_leads CASCADE;
   DROP TABLE IF EXISTS lead_assignments CASCADE;
   DROP TABLE IF EXISTS city_event_stats CASCADE;
   DROP TABLE IF EXISTS dj_routing_metrics CASCADE;
   DROP TABLE IF EXISTS leads CASCADE;
   ```

2. **Remove extended columns** (if needed):
   ```sql
   ALTER TABLE dj_availability 
     DROP COLUMN IF EXISTS locked_until,
     DROP COLUMN IF EXISTS locked_by_lead_id,
     DROP COLUMN IF EXISTS time_slots,
     DROP COLUMN IF EXISTS auto_blocked;
   
   ALTER TABLE dj_virtual_numbers
     DROP COLUMN IF EXISTS call_recording_enabled,
     DROP COLUMN IF EXISTS transcription_enabled,
     DROP COLUMN IF EXISTS rotation_weight,
     DROP COLUMN IF EXISTS total_calls,
     DROP COLUMN IF EXISTS total_duration_seconds,
     DROP COLUMN IF EXISTS last_call_at;
   ```

3. **Drop functions**:
   ```sql
   DROP FUNCTION IF EXISTS get_dj_virtual_number(UUID);
   ```

## Notes

- All migrations use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` for safety
- RLS policies check for existence before creating
- No existing data is modified or deleted
- System is backward compatible with existing `dj_inquiries`

