# Plan: Combine Song Title & Artist Name into Single Field

## Executive Summary
Combine the separate "Song Title" and "Artist Name" input fields into a single unified field on the frontend while maintaining all existing functionality. The backend will continue to store `song_title` and `song_artist` separately for database queries and filtering.

## Current State Analysis

### Frontend Implementation
- **Location**: `pages/requests.js` lines ~5145-5262
- **Current Fields**:
  - `songTitle` - Separate input field (required)
  - `songArtist` - Separate input field (required)
- **Features**:
  - Music link detection and extraction
  - Autocomplete/song search (searches by title, returns both)
  - URL parsing from various services
  - Bundle songs support (also uses separate fields)

### Backend/Database
- **Schema**: `crowd_requests` table has `song_title` and `song_artist` as separate TEXT columns
- **API**: `/api/crowd-request/submit.js` expects `songTitle` and `songArtist` separately
- **Storage**: Always stored separately for:
  - Search/filtering capabilities
  - Display formatting ("Song Title by Artist Name")
  - Analytics and reporting
  - Music library matching

### Parsing Logic
- **Music Links**: Already parse "Title - Artist" or "Artist - Title" formats
- **Normalization**: `utils/song-normalizer.js` handles "Track - Artist" format
- **Extraction**: Multiple utilities parse various formats (YouTube, Spotify, Apple Music, Tidal)

## Implementation Plan

### Phase 1: Create Combined Field Parser Utility
**File**: `utils/song-field-parser.js` (NEW)

**Purpose**: Parse combined input ("Song Title - Artist Name") into separate title and artist

**Features**:
- Support multiple formats:
  - `"Song Title - Artist Name"` (most common)
  - `"Song Title by Artist Name"`
  - `"Artist Name - Song Title"` (less common, but exists)
  - `"Song Title"` (just title, artist empty - trigger prompt or autocomplete)
- Smart parsing heuristics (length, word count, common patterns)
- Preserve user intent (if user types both, split correctly)
- Handle edge cases (multiple dashes, URLs, etc.)

**Functions**:
```javascript
parseCombinedSongInput(input: string): { title: string, artist: string, format: string }
// Returns parsed title and artist, plus detected format for display

isValidCombinedFormat(input: string): boolean
// Check if input appears to be in combined format

splitCombinedInput(input: string): { title: string, artist: string }
// Split input into title and artist parts
```

### Phase 2: Update Frontend Form State
**File**: `pages/requests.js`

**Changes**:
1. **Add new state**: `songInput` (combined field)
2. **Keep internal state**: `formData.songTitle` and `formData.songArtist` (for submission)
3. **Derive logic**: Parse `songInput` to update `songTitle` and `songArtist`
4. **Display**: Show combined field, but maintain separate values internally

**State Management**:
```javascript
const [songInput, setSongInput] = useState(''); // Combined user input
const [formData, setFormData] = useState({
  songTitle: '',
  songArtist: '',
  // ... other fields
});
```

### Phase 3: Update Input Handling
**File**: `pages/requests.js` - `handleInputChange` function

**Logic Flow**:
1. User types in combined field → Update `songInput`
2. Parse `songInput` → Extract `title` and `artist`
3. Update `formData.songTitle` and `formData.songArtist`
4. Trigger autocomplete/search if needed (search on title portion)
5. Handle URL detection (existing logic)

**Key Considerations**:
- Autocomplete: Search using title portion (before " - " or " by ")
- Music link extraction: Already returns separate title/artist (works as-is)
- Bundle songs: Also convert to combined field format
- Validation: Ensure both title and artist are extracted or prompt user

### Phase 4: Preserve All Existing Features

#### A. Music Link Extraction
- **Status**: ✅ Works automatically
- **Reason**: Extraction APIs already return `{ title, artist }` separately
- **Action**: Parse combined input → extract → populate both fields → show combined format

#### B. Autocomplete/Song Search
- **Status**: ⚠️ Needs adjustment
- **Current**: Searches on `formData.songTitle`
- **Change**: Search on title portion of combined input (before separator)
- **Display**: Show suggestions with both title and artist
- **Selection**: Populate combined field as "Title - Artist"

#### C. Bundle Songs
- **Status**: ⚠️ Needs update
- **Current**: Separate fields per song in bundle
- **Change**: Combined field per song (consistent UX)
- **Parsing**: Same parser utility per bundle song

#### D. Validation
- **Status**: ⚠️ Needs enhancement
- **Current**: Both fields required
- **Change**: Combined field required, but must parse to get both title and artist
- **Edge Case**: If only title provided, show helpful message or trigger autocomplete

#### E. Display/Edit Forms
- **Status**: ⚠️ Needs update
- **Locations**:
  - `pages/admin/crowd-requests.tsx` (admin edit modal)
  - `components/crowd-request/PaymentSuccessScreen.js` (bundle song entry)
  - `pages/crowd-request/[code].js` (legacy form - optional update)

### Phase 5: Admin Panel Display
**File**: `pages/admin/crowd-requests.tsx`

**Current**: Shows separate columns for `song_title` and `song_artist`

**Options**:
1. **Keep separate columns** (recommended for admin filtering/search)
2. **Add combined column** while keeping separate columns
3. **Display combined in details view**: "Song Title by Artist Name"

**Recommendation**: Keep separate columns for admin (filtering/search), but show combined format in detail views and edit modals.

### Phase 6: Backward Compatibility

#### Existing Data
- **Status**: ✅ No migration needed
- **Reason**: Backend stores separately (no schema change)
- **Action**: Display existing data as "Title - Artist" when editing

#### API Compatibility
- **Status**: ✅ Maintained
- **Reason**: API still expects/receives `songTitle` and `songArtist` separately
- **Action**: Frontend parsing happens before API submission

#### Legacy Forms
- **Status**: Optional update
- **Files**: 
  - `pages/crowd-request/[code].js` (can keep separate fields or update)
  - Other forms can be updated incrementally

## Implementation Steps

### Step 1: Create Parser Utility
1. Create `utils/song-field-parser.js`
2. Implement parsing for multiple formats
3. Add unit tests for edge cases
4. Handle special characters and edge cases

### Step 2: Update Main Requests Page
1. Add `songInput` state
2. Update `handleInputChange` to parse combined input
3. Update input field to single combined field
4. Remove separate artist field from UI
5. Update autocomplete to work with combined input
6. Update music link extraction flow
7. Update bundle songs to use combined fields

### Step 3: Update Form Validation
1. Ensure combined input parses to both title and artist
2. Show helpful error if only title provided
3. Update validation messages
4. Maintain required field indicators

### Step 4: Update Display Components
1. Update admin edit modals to show combined field
2. Update bundle song entry forms
3. Ensure all edit forms parse/display correctly

### Step 5: Testing & Edge Cases
1. Test various input formats ("Title - Artist", "Title by Artist", etc.)
2. Test URL detection and extraction
3. Test autocomplete with combined input
4. Test bundle songs with combined fields
5. Test validation and error handling
6. Test backward compatibility (editing existing requests)

## Edge Cases to Handle

1. **User types only title**: 
   - Parse as title only
   - Show hint: "Add artist: 'Title - Artist Name'"
   - Trigger autocomplete suggestions
   
2. **Multiple separators**: 
   - Handle "Song - Remix - Artist" correctly
   - Use heuristics (first or last dash is separator)
   
3. **URLs in combined field**: 
   - Detect and extract (existing logic)
   - Populate as "Title - Artist" after extraction
   
4. **Copy/paste scenarios**: 
   - Handle clipboard data with various formats
   - Normalize to "Title - Artist" format
   
5. **Special characters**: 
   - Preserve hyphens in titles/artists
   - Distinguish separator vs. title hyphens (e.g., "AT-LONG-LAST - ASAP Rocky")
   
6. **Empty/partial input**: 
   - Show placeholder: "Song Name - Artist Name or paste link"
   - Clear both title and artist when field is cleared
   
7. **Artist-first formats**: 
   - Detect "Artist - Title" patterns (Tidal, some YouTube)
   - Parse correctly using heuristics

## Benefits

1. **Simpler UX**: One field instead of two (faster input)
2. **Natural format**: Matches how users think ("Song - Artist")
3. **Mobile-friendly**: Less scrolling, better mobile UX
4. **Link-friendly**: Paste combined text or links seamlessly
5. **Maintains functionality**: All features preserved
6. **Backend unchanged**: No database/API changes needed

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Parsing ambiguity | User frustration | Smart heuristics + autocomplete suggestions |
| Breaking existing flows | Functional regression | Comprehensive testing + backward compatibility |
| Admin confusion | UX issue | Keep separate columns in admin, combined in edit |
| Edge case failures | Bugs | Extensive edge case testing + fallback to manual split |

## Success Criteria

1. ✅ Combined field works for all input formats
2. ✅ Music link extraction still works
3. ✅ Autocomplete still works (searches on title portion)
4. ✅ Bundle songs work with combined fields
5. ✅ Backend receives separate `songTitle` and `songArtist`
6. ✅ Admin can still filter/search by separate columns
7. ✅ Existing requests display/edit correctly
8. ✅ Validation ensures both title and artist are present
9. ✅ No regression in any existing functionality

## Optional Enhancements

1. **Smart suggestions**: When user types title, suggest popular artists
2. **Format detection**: Highlight detected format in UI ("Title - Artist" vs "Artist - Title")
3. **Validation hints**: Show helpful messages for incomplete input
4. **Keyboard shortcuts**: Quick format conversion (Ctrl/Cmd + Shift to toggle format)
5. **Admin preference**: Toggle between combined/split fields (for power users)

## Migration Path

1. **Phase 1** (Week 1): Create parser utility, test thoroughly
2. **Phase 2** (Week 1-2): Update main requests page
3. **Phase 3** (Week 2): Update bundle songs and admin forms
4. **Phase 4** (Week 2-3): Testing and edge case handling
5. **Phase 5** (Week 3): Deploy and monitor

## Rollback Plan

If issues arise:
1. Feature flag to toggle combined/split fields
2. Database unchanged (no migration needed)
3. API unchanged (can revert frontend only)
4. Keep separate fields in admin (always available)
