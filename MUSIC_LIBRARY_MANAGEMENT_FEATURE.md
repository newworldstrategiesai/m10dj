# Music Library Management Feature

## Overview

This feature allows admins to manage song requests through multiple control mechanisms:
1. **Music Library Upload** - Upload a list of songs that acts as a boundary
2. **Blacklist** - Immediately deny specific songs
3. **Special Pricing Rules** - Set custom prices for specific songs
4. **Duplicate Detection** - Handle duplicate requests (already played songs)

## Database Schema

### Tables Created

1. **`music_library`** - Stores organization's music library (boundary list)
   - Organization-scoped
   - Normalized title/artist for matching
   - Supports metadata (genre, BPM, key signature)
   - Tracks import batches

2. **`song_blacklist`** - Stores blacklisted songs
   - Organization-scoped
   - Immediate denial on match
   - Optional reason field

3. **`song_pricing_rules`** - Special pricing for specific songs
   - Organization-scoped
   - Custom price in cents (-1 = deny, 0 = free, or positive amount)
   - Can apply to fast-track and/or regular requests separately

4. **`song_duplicate_rules`** - Organization-level duplicate handling rules
   - One record per organization
   - Configurable time window (default: 60 minutes)
   - Actions: deny, premium_price, allow
   - Premium pricing: multiplier or fixed amount

### Organization Settings

Added to `organizations` table:
- `music_library_enabled` (boolean)
- `music_library_action` ('deny' | 'premium_price' | 'allow')
- `music_library_premium_multiplier` (decimal, default 2.0)
- `music_library_premium_fixed_cents` (integer, optional)

## API Endpoints

All endpoints require authentication and organization access.

### `/api/music-library/library`
- **GET**: List songs in library (with pagination and search)
- **POST**: Add songs (single or bulk)
- **DELETE**: Remove songs by IDs

### `/api/music-library/blacklist`
- **GET**: List blacklisted songs (with pagination and search)
- **POST**: Add song to blacklist
- **DELETE**: Remove songs from blacklist by IDs

### `/api/music-library/pricing-rules`
- **GET**: List pricing rules (with pagination and search)
- **POST**: Create or update pricing rule (upsert by song)
- **DELETE**: Remove pricing rules by IDs

### `/api/music-library/duplicate-rules`
- **GET**: Get duplicate rules for organization (returns defaults if none exist)
- **POST/PUT**: Update duplicate rules

### `/api/music-library/settings`
- **GET**: Get music library settings for organization
- **POST/PUT**: Update music library settings

## Request Validation Logic

Integrated into `/api/crowd-request/submit`:

1. **Blacklist Check** (first priority)
   - If blacklisted → Request denied immediately

2. **Pricing Rules Check**
   - If custom pricing rule exists → Apply price (or deny if -1)

3. **Music Library Check** (if enabled)
   - If not in library and action is 'deny' → Request denied
   - If not in library and action is 'premium_price' → Apply premium pricing
   - If not in library and action is 'allow' → No change

4. **Duplicate Detection** (if enabled)
   - Checks `crowd_requests`, `songs_played`, and `serato_play_history` tables
   - Uses configurable time window
   - If duplicate found and action is 'deny' → Request denied
   - If duplicate found and action is 'premium_price' → Apply premium pricing
   - If duplicate found and action is 'allow' → No change

## Validation Utility Functions

Located in `utils/music-library-validation.js`:

- `normalizeSongString()` - Normalizes song titles/artists for matching
- `checkBlacklist()` - Checks if song is blacklisted
- `checkPricingRule()` - Gets custom pricing for song
- `checkMusicLibrary()` - Checks if song is in library
- `checkDuplicate()` - Checks if song was recently played
- `validateSongRequest()` - Comprehensive validation (calls all checks in order)

## Cross-Product Considerations

✅ **Safe for multi-product system**:
- All tables are organization-scoped
- RLS policies enforce organization isolation
- Validation only applies when organization_id is present
- Fails open (validation errors don't block requests)

⚠️ **Impact areas**:
- Request submission API (`/api/crowd-request/submit`)
- Affects all products that use song requests (TipJar, DJDash, M10DJ)
- No data migration required (new feature, opt-in)

## Remaining Work

### Admin UI Components (Not Yet Built)
1. **Music Library Management Page**
   - Upload CSV/JSON file
   - View/manage library entries
   - Search and filter
   - Bulk operations

2. **Blacklist Management Page**
   - Add/remove songs
   - View blacklist
   - Search and filter

3. **Pricing Rules Management Page**
   - Create/edit/delete pricing rules
   - View all rules
   - Search and filter

4. **Duplicate Rules Settings**
   - Configure duplicate detection settings
   - Set time window
   - Choose action (deny/premium/allow)
   - Set premium pricing

5. **Library Settings Page**
   - Enable/disable library boundary
   - Choose action for songs not in library
   - Set premium pricing

### Integration Points
- Add to admin settings navigation
- Add to requests page settings (if appropriate)
- Consider adding to organization onboarding

## Usage Examples

### Enable Music Library Boundary
```javascript
// POST /api/music-library/settings
{
  "musicLibraryEnabled": true,
  "musicLibraryAction": "premium_price",
  "musicLibraryPremiumMultiplier": 2.0
}
```

### Add Songs to Library (Bulk)
```javascript
// POST /api/music-library/library
{
  "songs": [
    { "songTitle": "Bohemian Rhapsody", "songArtist": "Queen" },
    { "songTitle": "Stairway to Heaven", "songArtist": "Led Zeppelin" }
  ]
}
```

### Blacklist a Song
```javascript
// POST /api/music-library/blacklist
{
  "songTitle": "Never Gonna Give You Up",
  "songArtist": "Rick Astley",
  "reason": "Too overplayed"
}
```

### Set Special Pricing
```javascript
// POST /api/music-library/pricing-rules
{
  "songTitle": "Free Bird",
  "songArtist": "Lynyrd Skynyrd",
  "customPriceCents": 5000, // $50.00
  "appliesToFastTrack": true,
  "appliesToRegular": true
}
```

### Configure Duplicate Rules
```javascript
// POST /api/music-library/duplicate-rules
{
  "enableDuplicateDetection": true,
  "duplicateAction": "premium_price",
  "duplicateTimeWindowMinutes": 60,
  "duplicatePremiumMultiplier": 1.5
}
```

## Migration

Run the migration:
```bash
# Apply the migration
supabase migration up 20260115000000_create_music_library_management
```

The migration:
- Creates all tables
- Adds organization settings columns
- Creates indexes for performance
- Sets up RLS policies
- Creates triggers for normalization
- Uses existing `normalize_track_string` function

## Testing Checklist

- [ ] Upload music library CSV/JSON
- [ ] Test blacklist denial
- [ ] Test custom pricing rules
- [ ] Test duplicate detection
- [ ] Test library boundary (deny/premium/allow)
- [ ] Test with multiple organizations (isolation)
- [ ] Test validation failures (fail open)
- [ ] Test with fast-track requests
- [ ] Test with bundle requests
- [ ] Test edge cases (null values, empty strings)

## Notes

- Normalization uses the same function as Serato system (`normalize_track_string`)
- All validation is organization-scoped
- Validation errors are logged but don't block requests (fail open)
- Duplicate detection checks multiple sources (crowd_requests, songs_played, serato_play_history)
- Premium pricing can use multiplier or fixed amount (fixed takes precedence)
