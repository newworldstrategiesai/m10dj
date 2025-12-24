# Music Link Validation & Admin Rejection System

## 🎯 Objective
Automatically validate song requests by finding links on major streaming platforms. When no links are found, display visible warnings to admins. **Requests are NEVER automatically rejected** - admins must manually reject requests if needed. This ensures DJs can always access the requested songs while giving admins full control.

## 📋 Implementation Plan

### Phase 1: Database Schema Updates

#### 1.1 Add New Status Value
**File**: `supabase/migrations/20250127000000_add_rejected_status_to_crowd_requests.sql`

```sql
-- Add 'rejected' status to crowd_requests
ALTER TABLE crowd_requests 
DROP CONSTRAINT IF EXISTS crowd_requests_status_check;

ALTER TABLE crowd_requests 
ADD CONSTRAINT crowd_requests_status_check 
CHECK (status IN ('new', 'acknowledged', 'playing', 'played', 'cancelled', 'rejected'));

-- Add index for filtering rejected requests
CREATE INDEX IF NOT EXISTS idx_crowd_requests_rejected 
ON crowd_requests(status, created_at) 
WHERE status = 'rejected';

COMMENT ON COLUMN crowd_requests.status IS 'Request status: new, acknowledged, playing, played, cancelled, rejected (no links found)';
```

#### 1.2 Add Link Validation Tracking Fields
**File**: `supabase/migrations/20250127000001_add_link_validation_fields.sql`

```sql
-- Add fields to track link validation attempts and results
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS link_validation_status TEXT DEFAULT 'pending' 
  CHECK (link_validation_status IN ('pending', 'validating', 'verified', 'not_found', 'failed')),
ADD COLUMN IF NOT EXISTS link_validation_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS link_validation_last_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS link_validation_rejection_reason TEXT;

-- Add index for filtering by validation status
CREATE INDEX IF NOT EXISTS idx_crowd_requests_link_validation 
ON crowd_requests(link_validation_status, created_at) 
WHERE link_validation_status IN ('not_found', 'failed');

COMMENT ON COLUMN crowd_requests.link_validation_status IS 'Link validation status: pending (not checked), validating (in progress), verified (links found), not_found (no links on any platform), failed (validation error)';
COMMENT ON COLUMN crowd_requests.link_validation_attempts IS 'Number of times link validation has been attempted';
COMMENT ON COLUMN crowd_requests.link_validation_last_attempted_at IS 'Timestamp of last validation attempt';
COMMENT ON COLUMN crowd_requests.link_validation_rejection_reason IS 'Reason for rejection if no links found (e.g., "No links found on Spotify, YouTube, Tidal, or Apple Music")';
```

### Phase 2: Automatic Link Validation on Request Creation

#### 2.1 Update Submit API to Auto-Validate
**File**: `pages/api/crowd-request/submit.js`

**Changes**:
- After creating request, immediately trigger link validation (async, non-blocking)
- Set `link_validation_status` to 'validating'
- If no links found, set `link_validation_status` to 'not_found' (but keep request status as 'new' - NEVER auto-reject)
- Request remains active and visible, but with warning indicators

**Implementation**:
```javascript
// After successful request creation
if (requestType === 'song_request' && songTitle && songArtist) {
  // Trigger async link validation (don't block response)
  validateRequestLinks(crowdRequest.id, songTitle, songArtist, postedLink)
    .catch(err => console.error('Link validation error:', err));
}
```

#### 2.2 Create Link Validation Service
**File**: `utils/link-validation-service.js`

**Functions**:
- `validateRequestLinks(requestId, songTitle, songArtist, postedLink)`: Main validation function
- `checkIfLinksFound(musicServiceLinks)`: Check if at least one link exists
- `updateValidationStatus(requestId, status, reason)`: Update database with results

**Logic**:
1. Call `findMusicLinks()` with all services
2. Check if at least ONE link was found (Spotify, YouTube, Tidal, or Apple Music)
3. Update `link_validation_status`:
   - `verified` if at least one link found
   - `not_found` if no links found
4. Update `music_service_links` in database
5. Increment `link_validation_attempts`

### Phase 3: Admin UI Enhancements

#### 3.1 Visual Indicators in Request List
**File**: `pages/admin/crowd-requests.tsx`

**Add**:
- **Prominent warning badge** for requests with `link_validation_status = 'not_found'` (visible by default)
- Visual indicator (red/yellow) in status column
- Highlight entire row with subtle background color for unverified requests
- Filter option: "Show only verified requests" / "Show unverified requests"
- Bulk action: "Reject selected unverified requests" (manual action only)

**Badge Design** (Always visible when no links found):
```tsx
{request.link_validation_status === 'not_found' && (
  <Badge variant="destructive" className="ml-2 animate-pulse">
    <AlertTriangle className="w-3 h-3 mr-1" />
    ⚠️ No Links Found
  </Badge>
)}
```

**Row Highlighting**:
```tsx
<tr className={request.link_validation_status === 'not_found' 
  ? 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500' 
  : ''}>
  {/* row content */}
</tr>
```

#### 3.2 Request Details Modal Enhancements
**File**: `pages/admin/crowd-requests.tsx` (modal section)

**Add**:
- **Prominent warning section at the top** if no links found (always visible, cannot be missed)
- Warning should appear immediately when modal opens if `link_validation_status = 'not_found'`
- "Reject Request - No Links Found" button (red, destructive) - manual action only
- "Retry Link Search" button
- Display validation attempt count and last attempt time
- Show which platforms were checked
- Option to "Approve Anyway" (manual override) if admin wants to proceed despite no links

**Warning Section** (Always visible at top of modal when no links found):
```tsx
{selectedRequest.request_type === 'song_request' && 
 selectedRequest.link_validation_status === 'not_found' && (
  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700 rounded-lg p-5 mb-6 shadow-lg">
    <div className="flex items-start gap-4">
      <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
      <div className="flex-1">
        <h4 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2 flex items-center gap-2">
          ⚠️ Warning: No Streaming Links Found
        </h4>
        <p className="text-sm text-red-800 dark:text-red-300 mb-4">
          This song could not be found on Spotify, YouTube, Tidal, or Apple Music. 
          The DJ may not be able to play this request. Please review before proceeding.
        </p>
        {selectedRequest.link_validation_rejection_reason && (
          <p className="text-xs text-red-700 dark:text-red-400 mb-4 italic">
            {selectedRequest.link_validation_rejection_reason}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            onClick={() => handleRejectRequest(selectedRequest.id, 'no_links_found')}
            className="font-semibold"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Reject Request
          </Button>
          <Button
            variant="outline"
            onClick={() => handleRetryLinkValidation(selectedRequest.id)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Link Search
          </Button>
          <Button
            variant="outline"
            onClick={() => handleApproveAnyway(selectedRequest.id)}
            className="border-green-500 text-green-700 hover:bg-green-50 dark:text-green-400"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Anyway
          </Button>
        </div>
      </div>
    </div>
  </div>
)}
```

#### 3.3 Status Filter Updates
**Add filter options**:
- "All Requests" (default)
- "⚠️ Needs Attention (No Links)" - requests without links (highlighted)
- "Verified (Links Found)" - only requests with links
- "Rejected" - rejected requests (manual rejections only)

### Phase 4: Admin Actions API

#### 4.1 Reject Request API
**File**: `pages/api/crowd-request/reject.js`

**Endpoint**: `POST /api/crowd-request/reject`

**Body**:
```json
{
  "requestId": "uuid",
  "reason": "no_links_found" | "manual_rejection" | "other",
  "adminNotes": "Optional notes"
}
```

**Actions**:
1. Update `status` to 'rejected' (manual admin action only)
2. Set `link_validation_rejection_reason` with detailed explanation
3. Add to `admin_notes` with rejection timestamp and admin info
4. If payment was made, handle refund logic (optional - configurable)
5. Log rejection action for audit trail

#### 4.2 Retry Link Validation API
**File**: `pages/api/crowd-request/retry-validation.js`

**Endpoint**: `POST /api/crowd-request/retry-validation`

**Body**:
```json
{
  "requestId": "uuid"
}
```

**Actions**:
1. Fetch request details
2. Call `validateRequestLinks()` again
3. Update validation status based on results
4. Increment attempt count

### Phase 5: Manual Override Option

#### 5.1 Approve Anyway Functionality
Allow admins to manually approve requests even when no links are found

**Implementation**:
- Add "Approve Anyway" button in warning section
- Sets `link_validation_status` to 'approved_manually'
- Adds note to `admin_notes` explaining manual approval
- Request proceeds normally despite no links found
- Useful for: obscure songs, local artists, special requests

### Phase 6: Background Validation Job (Optional Enhancement)

#### 6.1 Cron Job for Re-validation
**File**: `pages/api/cron/validate-pending-requests.js`

**Purpose**: Periodically re-check requests that failed validation (in case they become available)

**Logic**:
- Find requests with `link_validation_status = 'not_found'` and `status = 'new'`
- Re-run validation (maybe once per day)
- Update if links are now found

## 🎨 UI/UX Considerations

### Visual Hierarchy
1. **Highest Priority**: Requests with no links should be **impossible to miss** (red warning, prominent badges, highlighted rows)
2. **High Priority**: Requests being validated (yellow, loading spinner)
3. **Medium Priority**: Verified requests (green checkmark, subtle)
4. **Default Visibility**: Warnings are always visible by default - no hiding or auto-filtering

### Warning Visibility Rules
- **Always show warnings** - never hide unverified requests by default
- **Prominent placement** - warnings appear at top of modal, in list view, and in status column
- **Multiple indicators** - badge, row highlight, and modal warning for maximum visibility
- **Persistent** - warnings remain until admin takes action (reject, approve, or links found)

### User Experience
- **Non-blocking**: Link validation should not delay request creation
- **Transparent**: Show validation status clearly
- **Actionable**: Provide clear actions (reject, retry, approve)
- **Informative**: Explain why a request might be rejected

### Admin Workflow
1. Admin views request list → **Sees warning badges immediately** for requests with no links
2. Admin opens request details → **Warning appears at top of modal** (cannot be missed)
3. Admin can:
   - **Reject** - Mark request as rejected (manual action)
   - **Retry Search** - Re-run link validation (maybe song name was misspelled)
   - **Approve Anyway** - Manually approve despite no links (for special cases)
   - **Add Notes** - Document decision for future reference
4. Request remains active until admin takes action

## 🔒 Edge Cases & Considerations

### 1. Payment Handling
- **Important**: Requests are never auto-rejected, so payment handling is only for manual rejections
- If admin manually rejects request after payment, consider:
  - Auto-refund (recommended)
  - Manual refund process
  - Keep payment but mark as rejected (with clear communication to user)

### 2. False Negatives
- Song might exist but with different spelling
- Song might be on platform not checked
- Solution: **Retry validation** button + **Approve Anyway** option for manual override
- Admin can always manually approve if they know the song exists

### 3. Rate Limiting
- Link validation makes external API calls
- Implement rate limiting to avoid blocking
- Use queue system for high-volume events

### 4. Performance
- Validation should be async (non-blocking)
- Cache results to avoid re-checking same songs
- Batch validation for multiple requests

### 5. User Communication
- Should users be notified if their request is rejected?
- Email/SMS notification option
- Explain why (song not found on major platforms)

## 📊 Metrics to Track

1. **Validation Success Rate**: % of requests with links found
2. **Rejection Rate**: % of requests rejected due to no links
3. **False Positive Rate**: Requests rejected but later found
4. **Platform Coverage**: Which platforms most commonly have links
5. **Validation Time**: Average time to validate a request

## 🚀 Implementation Priority

### Must Have (MVP)
1. ✅ Database schema updates
2. ✅ Automatic link validation on creation (non-blocking, async)
3. ✅ **Prominent visual warnings** in admin UI (always visible by default)
4. ✅ Manual reject button in request details (admin action only)
5. ✅ Status filter for verified/unverified
6. ✅ **Never auto-reject** - all rejections are manual admin decisions

### Should Have
6. Retry validation button
7. Bulk reject action (manual selection required)
8. Approve Anyway option (manual override)
9. Validation attempt tracking and history

### Nice to Have
10. Background re-validation job (periodic re-check of failed validations)
11. User notifications on rejection (when admin manually rejects)
12. Analytics dashboard (validation success rates, rejection reasons)
13. Smart retry suggestions (e.g., "Did you mean 'Song Title' by Artist?")

## 🧪 Testing Checklist

- [ ] Request with valid song → links found → status = 'verified' → no warnings shown
- [ ] Request with invalid song → no links → status = 'not_found' → **warning always visible**
- [ ] **Request is never auto-rejected** - remains active until admin action
- [ ] Admin can manually reject request with no links
- [ ] Warning badges visible in list view by default
- [ ] Warning section visible at top of modal by default
- [ ] Retry validation works correctly
- [ ] Approve Anyway works correctly (manual override)
- [ ] Payment handling works for manually rejected paid requests
- [ ] Bulk actions work correctly (manual selection required)
- [ ] Filters work correctly
- [ ] Visual indicators are prominent and impossible to miss
- [ ] Performance is acceptable (non-blocking validation)

## 📝 Notes

### Critical Principles
- **NEVER auto-reject requests** - all rejections are manual admin decisions
- **Always show warnings** - unverified requests must be visible by default
- **Admin has final say** - can approve, reject, or retry validation
- **Transparency** - clear visual indicators at every level (list, modal, status)

### Implementation Notes
- Validation runs async and non-blocking - doesn't delay request creation
- Warnings are persistent until admin takes action or links are found
- Consider adding "validation_confidence" score (how many platforms found the song)
- Consider caching validation results for popular songs
- Think about international platforms (e.g., Deezer, Amazon Music) for future expansion
- Manual approval option allows for edge cases (local artists, obscure songs, etc.)

