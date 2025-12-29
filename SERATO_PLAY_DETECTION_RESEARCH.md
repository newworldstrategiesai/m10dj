# Serato Play Detection & Notifications - Implementation Research

## Quick Reference Summary

**Approach**: Local companion app (Node.js) monitors Serato history files → WebSocket/Realtime → Backend matches to requests → Notifications sent

**Key Technologies**:
- Node.js companion app with file watcher (chokidar)
- Supabase Realtime or WebSocket for communication
- Existing notification system (SMS/Email)
- Fuzzy string matching for track-to-request matching

**Database Changes**: 2 new tables (`serato_play_history`, `serato_connections`), 1 table update (`crowd_requests`)

**Estimated Timeline**: 4-5 weeks

**Main Unknown**: Serato history file parser (binary format, need to research/implement)

---

## Executive Summary

This document outlines the optimal approach for implementing Serato play detection and notifications in your multi-product SaaS platform. The solution leverages your existing infrastructure (Supabase Realtime, JWT auth, notification systems) while following proven patterns already used by DJs for Twitch streaming overlays.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DJ's Laptop (Local)                          │
│                                                                 │
│  ┌─────────────┐         ┌──────────────────┐                 │
│  │ Serato DJ   │         │ Companion App    │                 │
│  │ Pro         │────────▶│ (Node.js/Electron)│                 │
│  │             │         │                  │                 │
│  │ Writes to:  │         │ • Monitors       │                 │
│  │ ~/Music/    │         │   History files  │                 │
│  │ _Serato_/   │         │ • Parses tracks  │                 │
│  │ History/    │         │ • Emits events   │                 │
│  └─────────────┘         └────────┬─────────┘                 │
│                                    │                            │
│                                    │ WebSocket (w/ JWT)         │
└────────────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SaaS Backend (Supabase + Next.js)            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API: /api/serato/now-playing (WebSocket endpoint)        │  │
│  │ • Authenticates DJ via JWT                               │  │
│  │ • Receives NOW_PLAYING events                            │  │
│  │ • Stores in serato_play_history table                    │  │
│  │ • Triggers matching logic                                │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                        │
│         ┌───────────────┼───────────────┐                       │
│         │               │               │                       │
│         ▼               ▼               ▼                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │ Match to    │ │ Update      │ │ Send        │              │
│  │ Requests    │ │ Status      │ │ Notifications│              │
│  │ (Fuzzy)     │ │ (played_at) │ │ (SMS/Email) │              │
│  └─────────────┘ └─────────────┘ └─────────────┘              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Supabase Realtime → Web Dashboard                        │  │
│  │ • Real-time status updates                               │  │
│  │ • Connection status indicators                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Integration with Existing Infrastructure

### ✅ What We Can Reuse

1. **Supabase Realtime**: Already configured and used for SMS updates
   - Can subscribe to `crowd_requests` table changes
   - Can subscribe to new `serato_play_history` table

2. **Authentication**: JWT token system already in place
   - Companion app can authenticate using existing Supabase auth
   - Same pattern as your API routes

3. **Notification System**: SMS/Email infrastructure exists
   - `utils/notification-system.js` can be extended
   - Twilio SMS integration already working
   - Resend email integration ready

4. **Database**: Supabase PostgreSQL with RLS
   - Existing `crowd_requests` table has `song_artist`, `song_title`, `status`, `played_at`
   - Can add new tables for Serato tracking

### 🔧 What Needs to Be Added

1. **New Database Tables**:
   - `serato_play_history` - Track all plays from Serato
   - `serato_connections` - Track companion app connections
   - Updates to `crowd_requests` table (optional normalization fields)

2. **New API Endpoints**:
   - `/api/serato/now-playing` - WebSocket endpoint for companion app
   - `/api/serato/connection-status` - REST endpoint for connection health
   - `/api/serato/match-request` - Internal endpoint for matching logic

3. **Companion App** (Separate Node.js/Electron project):
   - Serato history file watcher
   - Track metadata parser
   - WebSocket client with auth
   - Cross-platform (macOS/Windows)

4. **Matching Logic**:
   - Fuzzy string matching algorithm
   - Normalized string comparison
   - Deduplication logic

## Database Schema Changes

### 1. New Table: `serato_play_history`

```sql
CREATE TABLE IF NOT EXISTS serato_play_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Track metadata
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_artist TEXT, -- For matching (lowercase, trimmed, punctuation removed)
  normalized_title TEXT,  -- For matching
  
  -- Play details
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deck TEXT, -- 'A', 'B', or NULL if unknown
  bpm DECIMAL(4,2), -- Optional BPM if available
  
  -- Matching status
  matched_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_play UNIQUE (dj_id, artist, title, played_at)
);

CREATE INDEX idx_serato_play_history_dj_id ON serato_play_history(dj_id);
CREATE INDEX idx_serato_play_history_played_at ON serato_play_history(played_at DESC);
CREATE INDEX idx_serato_play_history_matched_request ON serato_play_history(matched_request_id);
CREATE INDEX idx_serato_play_history_normalized ON serato_play_history(normalized_artist, normalized_title);

-- Enable RLS
ALTER TABLE serato_play_history ENABLE ROW LEVEL SECURITY;

-- Policy: DJs can view their own play history
CREATE POLICY "DJs can view own play history"
  ON serato_play_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

-- Policy: Service role can insert (for API)
CREATE POLICY "Service role can insert play history"
  ON serato_play_history
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### 2. New Table: `serato_connections`

```sql
CREATE TABLE IF NOT EXISTS serato_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Connection details
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  is_connected BOOLEAN DEFAULT TRUE,
  connection_ip TEXT,
  
  -- Companion app info
  app_version TEXT,
  platform TEXT, -- 'macos', 'windows'
  
  -- Indexes
  CONSTRAINT unique_active_connection UNIQUE (dj_id) WHERE is_connected = TRUE
);

CREATE INDEX idx_serato_connections_dj_id ON serato_connections(dj_id);
CREATE INDEX idx_serato_connections_connected ON serato_connections(is_connected, last_heartbeat);

-- Enable RLS
ALTER TABLE serato_connections ENABLE ROW LEVEL SECURITY;

-- Policy: DJs can view their own connections
CREATE POLICY "DJs can view own connections"
  ON serato_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);
```

### 3. Update `crowd_requests` Table

Add normalization fields for better matching:

```sql
ALTER TABLE crowd_requests 
  ADD COLUMN IF NOT EXISTS normalized_artist TEXT,
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS matched_play_id UUID REFERENCES serato_play_history(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crowd_requests_normalized 
  ON crowd_requests(normalized_artist, normalized_title) 
  WHERE normalized_artist IS NOT NULL AND normalized_title IS NOT NULL;
```

## API Endpoints

### 1. WebSocket Endpoint: `/api/serato/now-playing`

**Purpose**: Accept real-time NOW_PLAYING events from companion app

**Authentication**: JWT token in WebSocket connection header

**Message Format** (from companion app):
```json
{
  "event": "NOW_PLAYING",
  "track": {
    "artist": "Artist Name",
    "title": "Track Title",
    "played_at": "2025-01-27T20:30:00Z",
    "deck": "A",
    "bpm": 128.0
  }
}
```

**Response Format**:
```json
{
  "event": "ACKNOWLEDGED",
  "play_id": "uuid",
  "matched": true,
  "matched_request_id": "uuid"
}
```

**Implementation Notes**:
- Use Next.js WebSocket support or upgrade to WebSocket server
- Alternative: Use Supabase Realtime for bidirectional communication
- Validate JWT token on connection
- Store play history immediately
- Trigger matching logic asynchronously
- Return acknowledgment with match status

### 2. REST Endpoint: `/api/serato/connection-status`

**Purpose**: Check connection status and update heartbeat

**Method**: POST

**Auth**: JWT token in Authorization header

**Request Body**:
```json
{
  "app_version": "1.0.0",
  "platform": "macos"
}
```

**Response**:
```json
{
  "connected": true,
  "last_heartbeat": "2025-01-27T20:30:00Z"
}
```

### 3. Internal Function: Match Track to Request

**Location**: Server-side function (can be in API route or database function)

**Logic**:
```typescript
async function matchTrackToRequest(
  artist: string,
  title: string,
  djId: string,
  organizationId?: string
): Promise<{ matched: boolean; requestId?: string }> {
  // Normalize input
  const normalizedArtist = normalizeString(artist);
  const normalizedTitle = normalizeString(title);
  
  // Find active requests for this DJ/organization
  const activeRequests = await supabase
    .from('crowd_requests')
    .select('id, song_artist, song_title, normalized_artist, normalized_title, status')
    .eq('request_type', 'song_request')
    .in('status', ['new', 'acknowledged'])
    .or(`dj_id.eq.${djId}${organizationId ? `,organization_id.eq.${organizationId}` : ''}`);
  
  // Try exact match first
  const exactMatch = activeRequests.find(req => 
    req.normalized_artist === normalizedArtist &&
    req.normalized_title === normalizedTitle
  );
  
  if (exactMatch) {
    return { matched: true, requestId: exactMatch.id };
  }
  
  // Try fuzzy match (Levenshtein distance or similar)
  const fuzzyMatch = findFuzzyMatch(
    normalizedArtist,
    normalizedTitle,
    activeRequests
  );
  
  return { matched: !!fuzzyMatch, requestId: fuzzyMatch?.id };
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ');    // Normalize whitespace
}
```

## Companion App Architecture

### Technology Stack

- **Node.js**: Core runtime
- **Electron**: Optional desktop app wrapper (future)
- **chokidar**: File system watcher (cross-platform)
- **ws**: WebSocket client
- **@supabase/supabase-js**: Authentication

### File Structure

```
companion-app/
├── src/
│   ├── index.js                 # Main entry point
│   ├── serato/
│   │   ├── detector.js          # Detect Serato installation
│   │   ├── parser.js            # Parse history files
│   │   └── watcher.js           # Watch for file changes
│   ├── api/
│   │   ├── websocket.js         # WebSocket client
│   │   └── auth.js              # Supabase auth
│   └── utils/
│       ├── normalize.js         # String normalization
│       └── logger.js            # Logging
├── package.json
└── README.md
```

### Core Logic Flow

```javascript
// 1. Detect Serato installation
const seratoPath = await detectSeratoPath(); // macOS: ~/Music/_Serato_/History/
if (!seratoPath) {
  console.error('Serato not detected');
  return;
}

// 2. Authenticate with Supabase
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Prompt user to log in
  await promptLogin();
}

// 3. Connect to WebSocket endpoint
const ws = new WebSocket('wss://your-domain.com/api/serato/now-playing', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});

// 4. Watch Serato history directory
const watcher = chokidar.watch(seratoPath, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true
});

let lastTrack = null;

watcher.on('change', async (path) => {
  if (!path.endsWith('.session')) return;
  
  // Parse the session file
  const tracks = await parseSeratoSession(path);
  const latestTrack = tracks[tracks.length - 1];
  
  // Deduplicate: only emit if it's a new track
  if (!lastTrack || 
      lastTrack.artist !== latestTrack.artist || 
      lastTrack.title !== latestTrack.title ||
      Math.abs(lastTrack.played_at - latestTrack.played_at) > 5000) {
    
    lastTrack = latestTrack;
    
    // Emit NOW_PLAYING event
    ws.send(JSON.stringify({
      event: 'NOW_PLAYING',
      track: {
        artist: latestTrack.artist,
        title: latestTrack.title,
        played_at: latestTrack.played_at.toISOString(),
        deck: latestTrack.deck,
        bpm: latestTrack.bpm
      }
    }));
  }
});

// 5. Heartbeat (every 30 seconds)
setInterval(() => {
  fetch('/api/serato/connection-status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_version: '1.0.0',
      platform: process.platform === 'darwin' ? 'macos' : 'windows'
    })
  });
}, 30000);
```

### Serato History File Format

**Key Research Findings**:
- Serato stores history in `.session` files in binary format
- Files are named with timestamps (e.g., `2025-01-27.session`)
- Track metadata includes: artist, title, played timestamp, deck, BPM
- Format is binary but can be parsed (reverse-engineered by community)

**Parsing Approach**:
1. Use existing Node.js libraries if available (research needed)
2. Or implement binary parser based on community documentation
3. Alternative: Use Python script called from Node.js (if needed)

**Libraries to Research**:
- `serato-history-parser` (if exists on npm)
- Or implement custom parser based on file format documentation

## Matching Logic Details

### Normalization Function

```typescript
function normalizeTrackString(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')           // Remove punctuation
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/\b(feat|ft|featuring)\b/gi, '')  // Remove "feat" variations
    .replace(/\b(remix|remix)\b/gi, '');       // Optional: remove "remix"
}
```

### Fuzzy Matching

Use Levenshtein distance or similar:

```typescript
function fuzzyMatch(
  trackArtist: string,
  trackTitle: string,
  requestArtist: string,
  requestTitle: string,
  threshold: number = 0.85 // 85% similarity required
): boolean {
  const artistSimilarity = calculateSimilarity(trackArtist, requestArtist);
  const titleSimilarity = calculateSimilarity(trackTitle, requestTitle);
  
  // Both artist and title must meet threshold
  return artistSimilarity >= threshold && titleSimilarity >= threshold;
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}
```

### Matching Strategy

1. **Exact Match First**: Check normalized strings exactly
2. **Fuzzy Match Second**: Use similarity threshold (85%+)
3. **Prevent Duplicates**: Only match to requests with status 'new' or 'acknowledged'
4. **One Match Per Play**: Each play can only match one request (even if multiple requests exist)
5. **Priority**: Match to oldest request first (FIFO)

## Notification Flow

### When a Match is Found

1. **Update Request Status**:
   ```sql
   UPDATE crowd_requests
   SET 
     status = 'playing',
     played_at = NOW(),
     matched_play_id = :play_id
   WHERE id = :request_id;
   ```

2. **Send Notification** (one time only):
   - Check if notification already sent (add `notification_sent` flag)
   - Send SMS if `requester_phone` exists and user opted in
   - Send email if `requester_email` exists
   - Send web push notification (if subscriber exists)

3. **Notification Message**:
   ```
   "Your song is playing 🎶"
   
   "{song_title}" by {song_artist}
   ```

### Notification Implementation

Extend existing `utils/notification-system.js`:

```javascript
export async function sendRequestPlayingNotification(request) {
  const results = {
    sms: { success: false, error: null },
    email: { success: false, error: null },
    push: { success: false, error: null }
  };
  
  const message = `Your song is playing 🎶\n\n"${request.song_title}" by ${request.song_artist}`;
  
  // SMS notification
  if (request.requester_phone) {
    try {
      await sendSMS(request.requester_phone, message);
      results.sms.success = true;
    } catch (error) {
      results.sms.error = error.message;
    }
  }
  
  // Email notification
  if (request.requester_email) {
    try {
      await sendEmail({
        to: request.requester_email,
        subject: 'Your song is playing! 🎶',
        body: message
      });
      results.email.success = true;
    } catch (error) {
      results.email.error = error.message;
    }
  }
  
  // Web push (if subscribed)
  // ... implementation
  
  // Mark notification as sent
  await supabase
    .from('crowd_requests')
    .update({ notification_sent: true })
    .eq('id', request.id);
  
  return results;
}
```

## Real-Time Dashboard Updates

### Frontend Subscription

Use Supabase Realtime to update dashboard when:
1. Request status changes to "playing"
2. New play history is added
3. Connection status changes

```typescript
// In dashboard component
useEffect(() => {
  if (!user) return;
  
  // Subscribe to request status changes
  const channel = supabase
    .channel('serato-updates')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'crowd_requests',
        filter: `status=eq.playing`
      },
      (payload) => {
        // Update UI with playing status
        const request = payload.new;
        updateRequestStatus(request.id, 'playing');
        showNotification(`${request.song_title} is now playing!`);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'serato_play_history',
        filter: `dj_id=eq.${user.id}`
      },
      (payload) => {
        // Show "Now Playing" in dashboard
        const play = payload.new;
        setNowPlaying({
          artist: play.artist,
          title: play.title,
          playedAt: play.played_at
        });
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

### Connection Status Indicator

```typescript
// Check connection status
const { data: connection } = await supabase
  .from('serato_connections')
  .select('*')
  .eq('dj_id', user.id)
  .eq('is_connected', true)
  .single();

// Display in UI
{connection ? (
  <div className="flex items-center gap-2 text-green-600">
    <Circle className="w-2 h-2 fill-current" />
    <span>Serato Connected</span>
  </div>
) : (
  <div className="flex items-center gap-2 text-red-600">
    <Circle className="w-2 h-2 fill-current" />
    <span>Serato Disconnected</span>
  </div>
)}
```

## Cross-Product Considerations

### Product Isolation

Since this is a multi-product system (DJDash.net, M10DJCompany.com, TipJar.live), ensure:

1. **Organization Scoping**:
   - Store `organization_id` in `serato_play_history` and `serato_connections`
   - Match requests only within the same organization
   - Display connection status per organization

2. **Feature Flags**:
   - Add feature flag: `serato_play_detection_enabled` to `organizations` table
   - Only enable for organizations that have this feature

3. **Data Isolation**:
   - RLS policies ensure DJs only see their own data
   - Organization-level filtering in queries
   - No cross-product data leakage

### Which Products Use This?

- **TipJar.live**: ✅ Primary use case (song requests at events)
- **M10DJCompany.com**: ✅ Could use for their events
- **DJDash.net**: ✅ Could be a premium feature for DJs

### Billing Considerations

- Could be a premium/paid feature
- Track usage in `serato_play_history` table
- Add to subscription tiers if needed

## Security Considerations

1. **Authentication**:
   - Companion app uses Supabase JWT tokens
   - Tokens expire and must be refreshed
   - Store tokens securely (keychain on macOS, Credential Manager on Windows)

2. **Rate Limiting**:
   - Limit NOW_PLAYING events (e.g., max 1 per 2 seconds)
   - Prevent spam/malicious connections

3. **Input Validation**:
   - Sanitize artist/title strings
   - Validate timestamps
   - Prevent SQL injection (use parameterized queries)

4. **File System Access**:
   - Companion app only reads from Serato directory
   - No write access needed
   - No audio access required

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create database migrations
- [ ] Implement WebSocket endpoint (or use Supabase Realtime)
- [ ] Create basic companion app (file watcher + WebSocket client)
- [ ] Implement Serato history file parser
- [ ] Test basic flow (play → detect → store)

### Phase 2: Matching & Notifications (Week 3)
- [ ] Implement normalization functions
- [ ] Implement fuzzy matching logic
- [ ] Create match-to-request function
- [ ] Integrate with notification system
- [ ] Test end-to-end flow

### Phase 3: Dashboard Integration (Week 4)
- [ ] Add real-time subscriptions to dashboard
- [ ] Create connection status UI
- [ ] Add "Now Playing" display
- [ ] Update request list with playing status
- [ ] Add connection/disconnection indicators

### Phase 4: Polish & Testing (Week 5)
- [ ] Error handling and edge cases
- [ ] Deduplication improvements
- [ ] Performance optimization
- [ ] Cross-platform testing (macOS/Windows)
- [ ] Documentation for DJs

## Open Questions & Research Needed

1. **Serato File Parser** ⚠️ **CRITICAL**:
   - **Status**: No ready-made npm libraries found in research
   - **Options**:
     - **Option A**: Use Python script (call from Node.js) - Python has better binary parsing tools
     - **Option B**: Implement custom Node.js binary parser based on file format docs
     - **Option C**: Use existing tools like "Now Playing" app and read their output files
   - **Recommended**: Start with Option A (Python script) for quick POC, migrate to Node.js later if needed
   - **Research Needed**: 
     - Obtain actual Serato `.session` file samples
     - Document binary format structure
     - Test parsing with various file versions

2. **WebSocket vs Supabase Realtime**:
   - **Supabase Realtime**: Good for backend → frontend, but companion app → backend is trickier
   - **Recommendation**: Use REST API + Supabase Realtime combination:
     - Companion app sends events via REST POST `/api/serato/now-playing`
     - Backend stores in `serato_play_history` table
     - Frontend subscribes to table changes via Supabase Realtime
   - **Alternative**: Dedicated WebSocket server if real-time bidirectional needed
   - **Best Fit**: REST + Realtime (simpler, leverages existing infra)

3. **Companion App Distribution**:
   - Electron app? Or simple Node.js executable?
   - Auto-update mechanism?
   - Code signing for macOS/Windows?

4. **Matching Edge Cases**:
   - How to handle remixes vs originals?
   - How to handle "feat." vs "ft." variations?
   - What similarity threshold works best in practice?

## Recommended Next Steps

### Phase 0: Research & POC (Week 0)
1. **Serato Parser Research** (Priority 1):
   - Obtain sample Serato `.session` files from test machine
   - Try Python approach first (faster to prototype)
   - Create minimal parser that can extract artist/title/timestamp
   - Test with multiple file versions

2. **Communication Method Decision**:
   - ✅ **Recommended**: REST API + Supabase Realtime (simpler)
   - Build simple POST endpoint `/api/serato/now-playing`
   - Test with curl/Postman
   - Verify Realtime subscription works

### Phase 1: Foundation (Week 1-2)
3. **Database Migration**:
   - Create and test migrations locally
   - Add feature flags to organizations table
   - Set up RLS policies
   - Test with sample data

4. **Minimal Companion App**:
   - Node.js script that watches one directory
   - Parses one `.session` file (using Python or Node parser)
   - Sends POST request to test endpoint
   - Verify data appears in database

### Phase 2: Integration (Week 3-4)
5. **Matching Logic**:
   - Implement normalization functions
   - Build fuzzy matching
   - Test with various artist/title variations
   - Integrate with request matching

6. **Notifications**:
   - Extend existing notification system
   - Test SMS/Email delivery
   - Verify one-time notification logic

7. **Dashboard Integration**:
   - Add real-time subscriptions
   - Build connection status UI
   - Test end-to-end flow

## Conclusion

This implementation leverages your existing infrastructure while following proven patterns. The approach is:
- ✅ **Safe**: Read-only, no Serato control
- ✅ **Familiar**: Same method DJs use for Twitch
- ✅ **Integrated**: Uses existing auth, notifications, real-time
- ✅ **Scalable**: Works across all three products
- ✅ **Maintainable**: Clear separation of concerns

The main unknown is the Serato file parser, which needs further research. Once that's solved, the rest is straightforward integration with your existing systems.

