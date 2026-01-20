# 🎤 Karaoke Mode Implementation Plan

## Executive Summary

Karaoke Mode is a specialized feature for DJs who host karaoke events. It extends the existing crowd requests system with singer management, a dedicated karaoke queue, rotation controls, and public display screens.

**Affected Products:**
- **DJDash.net** - Primary use case (DJ SaaS platform)
- **M10DJCompany.com** - Direct DJ service brand
- **TipJar.live** - Potential use for karaoke events with tipping

**Cross-Product Considerations:**
- Uses shared `crowd_requests` infrastructure
- Leverages existing payment system
- Extends event management system
- Must respect organization/product boundaries

---

## 🎯 Feature Overview

### Core Features

1. **Singer Sign-Up System**
   - Attendees sign up via QR code or direct link
   - **Group Support**: Sign up as single, duo, trio, or larger groups
   - Enter name(s), song selection, and optional payment for priority
   - Integration with existing crowd request flow

2. **Karaoke Queue Management**
   - Dedicated queue separate from regular song requests
   - Priority ordering (paid priority, rotation fairness)
   - DJ controls: skip, move up, remove, mark as done

3. **Rotation System**
   - Prevent same singer/group from going twice in a row
   - Track singer history per event (individual and group)
   - Fair rotation algorithm (considers all group members)
   - Group members tracked individually for rotation fairness

4. **Public Display Screens**
   - Real-time queue display for venue screens
   - Shows current singer, next up, and queue
   - Mobile-responsive for tablets/TVs

5. **DJ Admin Dashboard**
   - Manage karaoke queue alongside regular requests
   - View singer history and statistics
   - Control queue order and status

6. **Song Library Integration**
   - Link to existing music library validation
   - Song availability checking
   - Duplicate prevention

---

## 📊 Database Schema

### New Table: `karaoke_signups`

```sql
CREATE TABLE IF NOT EXISTS karaoke_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  event_qr_code TEXT, -- Links to crowd_requests event system
  
  -- Singer/Group info
  group_size INTEGER DEFAULT 1 CHECK (group_size >= 1 AND group_size <= 10), -- 1 = solo, 2 = duo, etc.
  singer_name TEXT NOT NULL, -- Primary singer/group name
  group_members JSONB, -- Array of member names: ["John Doe", "Jane Smith"] for groups
  singer_email TEXT,
  singer_phone TEXT,
  
  -- Song selection
  song_title TEXT NOT NULL,
  song_artist TEXT,
  song_key TEXT, -- Optional: key signature for karaoke
  
  -- Queue management
  queue_position INTEGER DEFAULT 0, -- Calculated dynamically, not stored
  priority_order INTEGER DEFAULT 1000, -- Lower = higher priority
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'next', 'singing', 'completed', 'skipped', 'cancelled')),
  
  -- Payment/priority
  is_priority BOOLEAN DEFAULT FALSE,
  priority_fee INTEGER DEFAULT 0, -- Amount paid for priority (in cents)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled', 'free')),
  payment_intent_id TEXT,
  stripe_session_id TEXT,
  
  -- Rotation tracking
  singer_rotation_id TEXT, -- Groups singers by name/phone for rotation tracking
  group_rotation_ids TEXT[], -- Array of rotation IDs for all group members (for rotation fairness)
  times_sung INTEGER DEFAULT 0, -- How many times this singer/group has sung
  last_sung_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE, -- When they started singing
  completed_at TIMESTAMP WITH TIME ZONE, -- When they finished
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Links to crowd_requests (if created through that system)
  crowd_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_organization_id ON karaoke_signups(organization_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_qr_code ON karaoke_signups(event_qr_code);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_event_id ON karaoke_signups(event_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_status ON karaoke_signups(status);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_priority_order ON karaoke_signups(priority_order);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_singer_rotation_id ON karaoke_signups(singer_rotation_id);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_rotation_ids ON karaoke_signups USING GIN(group_rotation_ids); -- GIN index for array searches
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_group_size ON karaoke_signups(group_size);
CREATE INDEX IF NOT EXISTS idx_karaoke_signups_created_at ON karaoke_signups(created_at DESC);
```

### New Table: `karaoke_settings`

```sql
CREATE TABLE IF NOT EXISTS karaoke_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  
  -- Feature flags
  karaoke_enabled BOOLEAN DEFAULT FALSE,
  priority_pricing_enabled BOOLEAN DEFAULT TRUE,
  rotation_enabled BOOLEAN DEFAULT TRUE,
  
  -- Pricing
  priority_fee_cents INTEGER DEFAULT 1000, -- $10.00 default
  free_signups_allowed BOOLEAN DEFAULT TRUE,
  
  -- Rotation settings
  max_singers_before_repeat INTEGER DEFAULT 3, -- Must wait for 3 others before singing again
  rotation_fairness_mode TEXT DEFAULT 'strict' CHECK (rotation_fairness_mode IN ('strict', 'flexible', 'disabled')),
  
  -- Display settings
  display_show_queue_count INTEGER DEFAULT 5, -- Show next 5 in queue
  display_theme TEXT DEFAULT 'default' CHECK (display_theme IN ('default', 'dark', 'colorful', 'minimal')),
  
  -- Queue settings
  auto_advance BOOLEAN DEFAULT FALSE, -- Auto-advance to next when current completes
  allow_skips BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Extend `crowd_requests` table

```sql
-- Add karaoke flag to existing crowd_requests
ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS is_karaoke BOOLEAN DEFAULT FALSE;

ALTER TABLE crowd_requests 
ADD COLUMN IF NOT EXISTS karaoke_signup_id UUID REFERENCES karaoke_signups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crowd_requests_is_karaoke ON crowd_requests(is_karaoke);
```

---

## 🎨 User Interface Components

### 1. Public Sign-Up Page (`/karaoke/[event-code]`)

**Purpose:** Allow attendees to sign up for karaoke

**Features:**
- QR code scanning or direct link access
- Simple form: Name, Song Title, Artist (optional)
- Priority option (pay to skip queue)
- Real-time queue position display
- Mobile-optimized

**Design:**
- Similar to existing `/crowd-request/[code]` page
- Clean, simple interface
- Shows current singer and queue length
- Payment integration for priority

### 2. DJ Admin Dashboard (`/admin/karaoke`)

**Purpose:** Manage karaoke queue and singers

**Features:**
- Live queue view with drag-and-drop reordering
- Current singer display with timer
- Next up preview
- Singer history per event
- Quick actions: Skip, Move Up, Remove, Mark Done
- Statistics: Total singers, average wait time, most popular songs

**Design:**
- Tabbed interface: Queue | History | Settings
- Real-time updates via Supabase subscriptions
- Color-coded status indicators
- Search and filter capabilities

### 3. Public Display Screen (`/karaoke/display/[event-code]`)

**Purpose:** Show queue on venue screens/TVs

**Features:**
- Large, readable text
- Current singer/group with song
- **Group indicators**: Show "Duo", "Trio", etc. badges for groups
- **Group member names**: Display all names for groups
- Next 5-10 singers/groups in queue
- Auto-refresh
- Full-screen mode
- Customizable themes

**Design:**
- Minimal, high-contrast design
- Large fonts for visibility
- Group badges/icons for visual distinction
- Animated transitions
- Dark/light mode support

### 4. Queue Widget Component

**Purpose:** Embeddable queue display

**Features:**
- Compact view for DJ booth
- Real-time updates
- Customizable size
- Can be embedded in other pages

---

## 🔧 Implementation Details

### Phase 1: Database & Core Infrastructure

**Files to Create:**
1. `supabase/migrations/[timestamp]_create_karaoke_tables.sql`
2. `types/karaoke.ts` - TypeScript types
3. `utils/karaoke-queue.ts` - Queue calculation logic
4. `utils/karaoke-rotation.ts` - Rotation fairness algorithm

**Queue Calculation Logic:**
```typescript
// Priority order calculation
// 1. Priority paid singers (priority_order = 0-99)
// 2. Regular singers by rotation fairness (priority_order = 100-999)
// 3. Within same priority, by creation time

function calculateQueuePosition(signup: KaraokeSignup, allSignups: KaraokeSignup[]): number {
  // Filter active signups
  const active = allSignups.filter(s => 
    s.status === 'queued' || s.status === 'next'
  );
  
  // Sort by priority_order, then created_at
  const sorted = active.sort((a, b) => {
    if (a.priority_order !== b.priority_order) {
      return a.priority_order - b.priority_order;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
  
  return sorted.findIndex(s => s.id === signup.id) + 1;
}
```

**Rotation Fairness Algorithm (with Group Support):**
```typescript
function calculateRotationPriority(
  signup: KaraokeSignup,
  allSignups: KaraokeSignup[],
  settings: KaraokeSettings
): number {
  if (!settings.rotation_enabled) {
    return 1000; // Default priority
  }
  
  // For groups, check all group members' rotation history
  const rotationIdsToCheck = signup.group_rotation_ids || [signup.singer_rotation_id];
  
  // Find the most recent performance by any group member
  let mostRecentPerformance: KaraokeSignup | null = null;
  
  for (const rotationId of rotationIdsToCheck) {
    const sameSinger = allSignups.filter(s => 
      (s.singer_rotation_id === rotationId || 
       (s.group_rotation_ids && s.group_rotation_ids.includes(rotationId))) &&
      s.status === 'completed' &&
      s.completed_at &&
      s.id !== signup.id
    );
    
    const lastSung = sameSinger
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];
    
    if (lastSung && (!mostRecentPerformance || 
        new Date(lastSung.completed_at!) > new Date(mostRecentPerformance.completed_at!))) {
      mostRecentPerformance = lastSung;
    }
  }
  
  if (!mostRecentPerformance) {
    return 100; // First time for all group members, higher priority
  }
  
  // Count how many others have sung since any group member last sang
  const othersSince = allSignups.filter(s =>
    s.id !== signup.id &&
    s.status === 'completed' &&
    s.completed_at &&
    new Date(s.completed_at) > new Date(mostRecentPerformance.completed_at!)
  ).length;
  
  // If enough others have sung, allow this singer/group again
  if (othersSince >= settings.max_singers_before_repeat) {
    return 100; // Can sing again
  }
  
  // Otherwise, lower priority
  return 500 + (settings.max_singers_before_repeat - othersSince) * 100;
}
```

### Phase 2: API Endpoints

**Files to Create:**
1. `pages/api/karaoke/signup.js` - Create karaoke signup
2. `pages/api/karaoke/queue.js` - Get queue for event
3. `pages/api/karaoke/update-status.js` - Update singer status (DJ only)
4. `pages/api/karaoke/reorder.js` - Reorder queue (DJ only)
5. `pages/api/karaoke/priority-checkout.js` - Create Stripe checkout for priority
6. `pages/api/karaoke/stats.js` - Get statistics

**API Examples:**

```javascript
// POST /api/karaoke/signup
{
  event_qr_code: "wedding-2025-01-15",
  group_size: 2, // 1 = solo, 2 = duo, 3 = trio, etc.
  singer_name: "John & Jane", // Primary/group name
  group_members: ["John Doe", "Jane Smith"], // Array of all member names
  song_title: "Don't Stop Believin'",
  song_artist: "Journey",
  is_priority: false,
  organization_id: "uuid"
}

// GET /api/karaoke/queue?event_code=wedding-2025-01-15
{
  current: { 
    id, 
    group_size: 2,
    singer_name: "John & Jane", 
    group_members: ["John Doe", "Jane Smith"],
    song_title: "Don't Stop Believin'", 
    song_artist: "Journey", 
    started_at 
  },
  next: { 
    id, 
    group_size: 1,
    singer_name: "Sarah", 
    group_members: ["Sarah"],
    song_title: "Bohemian Rhapsody", 
    song_artist: "Queen" 
  },
  queue: [
    { 
      id, 
      group_size: 2,
      singer_name: "Mike & Lisa", 
      group_members: ["Mike", "Lisa"],
      song_title: "Sweet Caroline", 
      song_artist: "Neil Diamond", 
      queue_position: 2, 
      estimated_wait: "15 min" 
    }
  ],
  total_in_queue: 12
}

// PATCH /api/karaoke/update-status
{
  signup_id: "uuid",
  status: "singing" | "completed" | "skipped",
  admin_notes: "Optional notes"
}
```

### Phase 3: Frontend Pages

**Files to Create:**
1. `pages/karaoke/[code].tsx` - Public sign-up page
2. `pages/karaoke/display/[code].tsx` - Public display screen
3. `pages/admin/karaoke.tsx` - DJ admin dashboard
4. `components/karaoke/KaraokeSignupForm.tsx`
5. `components/karaoke/KaraokeQueue.tsx`
6. `components/karaoke/KaraokeDisplay.tsx`
7. `components/karaoke/KaraokeAdminDashboard.tsx`

**Component Structure:**
```
components/karaoke/
├── KaraokeSignupForm.tsx      # Sign-up form
├── KaraokeQueue.tsx            # Queue list component
├── KaraokeDisplay.tsx          # Public display screen
├── KaraokeAdminDashboard.tsx  # Admin interface
├── QueueItem.tsx              # Individual queue item
├── CurrentSinger.tsx           # Current singer display
└── QueueStats.tsx              # Statistics component
```

### Phase 4: Integration with Existing Systems

**Crowd Requests Integration:**
- Add "Karaoke Mode" toggle in crowd requests admin
- When enabled, show karaoke queue alongside regular requests
- Allow conversion: song request → karaoke signup

**Payment Integration:**
- Reuse existing Stripe checkout flow
- Priority fee goes to same Stripe account
- Track in existing payment system

**Event Integration:**
- Link karaoke signups to events via `event_qr_code`
- Show karaoke stats in event dashboard
- Export karaoke history with event data

---

## 🎯 Feature Set Details

### 1. Singer Sign-Up (with Group Support)

**User Flow:**
1. Scan QR code or visit `/karaoke/[event-code]`
2. **Select group size**: Single, Duo, Trio, or Custom (up to 10)
3. **Enter names**:
   - Single: One name
   - Duo/Trio/etc.: Multiple name fields (one per person)
4. Enter song selection
5. Optionally pay for priority placement
6. See queue position and estimated wait time
7. Receive confirmation

**Group Size Options:**
- **Single** (1 person) - Default
- **Duo** (2 people)
- **Trio** (3 people)
- **Group** (4-10 people) - Custom size selector

**Validation:**
- Group size required (1-10)
- At least one name required (primary singer)
- All group member names required if group size > 1
- Song title required
- Check against music library (if enabled)
- Prevent duplicate signups (same group members + song)
- Rotation check (if enabled) - checks all group members

### 2. Queue Management

**Queue States:**
- `queued` - Waiting in queue
- `next` - Next to sing (DJ can see this)
- `singing` - Currently performing
- `completed` - Finished singing
- `skipped` - DJ skipped this singer
- `cancelled` - Singer cancelled

**DJ Actions:**
- **Mark Next**: Move singer to "next" position
- **Start**: Mark as "singing" (starts timer)
- **Complete**: Mark as "completed" (moves to history)
- **Skip**: Skip this singer (moves to end or removes)
- **Move Up**: Increase priority
- **Move Down**: Decrease priority
- **Remove**: Remove from queue entirely

### 3. Rotation System (with Group Support)

**Fairness Rules:**
- Track singers by name/phone (rotation_id)
- **For Groups**: Track all individual group members
- Prevent same singer/group from going twice in a row
- **Group Rotation Logic**: 
  - If any group member has sung recently, the group waits
  - Checks all members' last performance time
  - Uses most recent performance by any member
- Configurable: wait for N other singers before repeat
- Priority singers/groups can bypass rotation (if paid)

**Group Rotation Example:**
- John sings solo at 8:00 PM
- John & Jane sign up as duo at 8:15 PM
- System checks: John last sang at 8:00 PM (15 min ago)
- If `max_singers_before_repeat = 3` and only 2 others have sung since, duo waits
- If 3+ others have sung since John's solo, duo can proceed

**Settings:**
- `max_singers_before_repeat`: Default 3
- `rotation_fairness_mode`:
  - `strict`: Enforce rotation strictly (all group members checked)
  - `flexible`: Allow exceptions for priority or if only some members have sung
  - `disabled`: No rotation enforcement

### 4. Display Screens

**Public Display Features:**
- Current singer (large text)
- Song title and artist
- Timer (how long they've been singing)
- Next 5-10 singers in queue
- Total queue length
- Auto-refresh every 5 seconds
- Full-screen mode
- Customizable themes

**Admin Display Features:**
- All of above, plus:
- DJ controls overlay
- Statistics sidebar
- Search and filter

### 5. Statistics & Analytics

**Track:**
- Total signups per event
- Average wait time
- Most popular songs
- Singer participation (who sang multiple times)
- Priority vs free signups ratio
- Completion rate
- Skip rate

**Display:**
- Dashboard widgets
- Event summary reports
- Export to CSV

---

## 🔄 Integration Points

### With Crowd Requests System

**Shared Infrastructure:**
- Same `event_qr_code` system
- Same organization/event structure
- Same payment processing
- Same admin dashboard layout

**Differences:**
- Separate queue (karaoke vs song requests)
- Different status workflow
- Rotation tracking (karaoke-specific)

**Unified View Option:**
- Toggle in admin to show both queues together
- Or separate tabs: "Song Requests" | "Karaoke"

### With Music Library

**Validation:**
- Check if song exists in library
- Check if song is blacklisted
- Check duplicate prevention rules
- Suggest similar songs if not found

**Enhancement:**
- Link karaoke songs to library entries
- Track karaoke song popularity
- Auto-suggest based on library

### With Payment System

**Priority Pricing:**
- Configurable fee (default $10)
- Stripe checkout integration
- Same payment methods as crowd requests
- Track in existing payment analytics

**Free Option:**
- Allow free signups (default: enabled)
- Free signups go to regular queue
- Paid signups get priority

---

## 📱 Mobile & Responsive Design

### Public Sign-Up Page
- Mobile-first design
- Large touch targets
- Simple form (minimal fields)
- Quick submission

### Display Screen
- Tablet/TV optimized
- Large fonts (minimum 24px)
- High contrast
- Landscape orientation preferred
- Touch-friendly controls (if interactive)

### Admin Dashboard
- Responsive grid layout
- Mobile: Stack queue items
- Tablet: Side-by-side view
- Desktop: Full dashboard

---

## 🎨 UI/UX Design Principles

### Color Scheme
- **Current Singer**: Green/primary color
- **Next Up**: Yellow/warning color
- **Queued**: Gray/default
- **Priority**: Orange/accent color
- **Completed**: Blue/success color
- **Skipped**: Red/error color

### Typography
- **Display Screen**: Large, bold sans-serif (minimum 48px for current singer)
- **Admin Dashboard**: Standard UI font (14-16px)
- **Sign-Up Form**: Readable, medium size (16px)

### Animations
- Smooth transitions between queue positions
- Pulse animation for current singer
- Slide-in for new signups
- Fade-out for completed singers

---

## 🔒 Security & Permissions

### Public Access
- Sign-up page: Public (via event code)
- Display screen: Public (via event code)
- No authentication required for sign-ups

### Admin Access
- Queue management: Requires admin authentication
- Status updates: Requires organization membership
- Settings: Requires organization admin role

### Data Protection
- Singer PII (email/phone) only visible to admins
- Public display: Only shows name and song
- RLS policies on karaoke_signups table

**RLS Policies:**
```sql
-- Public can read their own signup
CREATE POLICY "Public can read own signup"
ON karaoke_signups FOR SELECT
USING (true); -- Public display needs read access

-- Admins can manage their organization's signups
CREATE POLICY "Admins can manage organization signups"
ON karaoke_signups FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM organization_members
    WHERE organization_id = karaoke_signups.organization_id
    AND role IN ('admin', 'owner')
  )
);
```

---

## 🧪 Testing Strategy

### Unit Tests
- Queue calculation logic
- Rotation fairness algorithm
- Priority ordering
- Status transitions

### Integration Tests
- Sign-up flow
- Payment processing
- Queue updates
- Display screen refresh

### E2E Tests
- Complete sign-up → queue → completion flow
- DJ admin actions
- Display screen updates
- Mobile responsiveness

---

## 📈 Analytics & Metrics

### Track Events
- `karaoke_signup_created`
- `karaoke_signup_priority_paid`
- `karaoke_singer_started`
- `karaoke_singer_completed`
- `karaoke_singer_skipped`
- `karaoke_queue_reordered`

### Metrics Dashboard
- Signups per day/week/month
- Priority conversion rate
- Average queue length
- Average wait time
- Most popular songs
- Singer retention (repeat singers)

---

## 🚀 Deployment Plan

### Phase 1: MVP (Week 1-2)
- Database migrations
- Basic sign-up page
- Simple queue display
- Admin queue management
- Priority payment

### Phase 2: Enhanced Features (Week 3-4)
- Rotation system
- Public display screen
- Statistics dashboard
- Mobile optimization

### Phase 3: Polish (Week 5-6)
- UI/UX improvements
- Performance optimization
- Analytics integration
- Documentation

### Phase 4: Advanced Features (Future)
- Song library integration
- Auto-advance mode
- SMS notifications
- Multi-language support
- Custom themes

---

## 🎯 Success Metrics

### Adoption
- % of DJs with karaoke events who use the feature
- Number of signups per event
- Repeat usage rate

### Engagement
- Average queue length
- Priority payment conversion rate
- Singer satisfaction (if we add feedback)

### Revenue
- Priority fee revenue per event
- Average priority fee per signup
- Total karaoke-related revenue

---

## 🔧 Technical Considerations

### Performance
- Queue calculations: Cache results, update on changes
- Display screen: Poll every 5 seconds (or use Supabase realtime)
- Admin dashboard: Real-time subscriptions for live updates

### Scalability
- Queue size: Handle 100+ singers efficiently
- Concurrent events: Support multiple karaoke events simultaneously
- Database: Indexes on all query fields

### Reliability
- Handle payment failures gracefully
- Queue state consistency (prevent race conditions)
- Backup queue data

---

## 📝 Documentation Needs

### User Documentation
- How to enable karaoke mode
- How to generate karaoke QR code
- How to manage queue
- How to use display screen

### Developer Documentation
- API endpoints
- Database schema
- Component architecture
- Integration guide

### Admin Documentation
- Settings explanation
- Best practices
- Troubleshooting

---

## 🎨 Design Mockups (Conceptual)

### Sign-Up Page
```
┌─────────────────────────────────┐
│  🎤 Karaoke Sign-Up              │
│  Event: Wedding Reception       │
│                                 │
│  Group Size:                    │
│  ○ Single  ● Duo  ○ Trio  ○ 4+ │
│                                 │
│  Singer 1: [____________]       │
│  Singer 2: [____________]       │
│                                 │
│  Song Title: [____________]      │
│  Artist (optional): [______]    │
│                                 │
│  ⚡ Skip the Line ($10) [ ]     │
│                                 │
│  [Join Queue]                   │
│                                 │
│  Currently Singing:             │
│  👥 John & Jane - "Don't..."   │
│                                 │
│  Queue: 5 ahead                  │
└─────────────────────────────────┘
```

### Display Screen
```
┌─────────────────────────────────┐
│         NOW SINGING              │
│                                 │
│      👥 DUO - JOHN & JANE       │
│    "Don't Stop Believin'"       │
│         Journey                  │
│                                 │
│    ⏱️ 2:34                      │
│                                 │
│         NEXT UP                 │
│  1. 👤 Sarah - "Bohemian..."    │
│  2. 👥 Mike & Lisa - "Sweet..."│
│  3. 👤 Tom - "Livin' on..."    │
│  4. 👥 Trio - "Wonderwall"     │
│                                 │
│  Total in Queue: 12             │
└─────────────────────────────────┘
```

### Admin Dashboard
```
┌─────────────────────────────────────────────┐
│  Karaoke Queue          [Settings] [Stats]  │
├─────────────────────────────────────────────┤
│  CURRENT:                                   │
│  👥 Duo: John & Jane                        │
│  "Don't Stop Believin'" - Journey          │
│  [Start] [Skip] [Complete]                  │
│                                             │
│  QUEUE (5):                                 │
│  1. ⚡ 👤 Sarah - "Bohemian..." [Move Up] │
│  2. 👥 Mike & Lisa - "Sweet..." [Move Up] │
│  3. 👤 Tom - "Livin' on..." [Move Up]     │
│  4. 👥 Trio: A, B, C - "Wonderwall" [Up]   │
│  5. 👤 Emma - "Shake It Off" [Move Up]     │
│                                             │
│  [Add Singer] [Display Screen]              │
└─────────────────────────────────────────────┘
```

---

## 🔄 Migration Strategy

### Existing Data
- No migration needed (new feature)
- Can optionally convert song requests to karaoke signups

### Rollout
1. **Beta**: Enable for select organizations
2. **Gradual**: Roll out to all DJs
3. **Marketing**: Announce feature to karaoke DJs

### Backward Compatibility
- Existing crowd requests continue to work
- Karaoke mode is opt-in (disabled by default)
- No breaking changes to existing features

---

## 🎯 Future Enhancements

### Phase 2 Features
- **Song Library Integration**: Full integration with music library
- **Auto-Advance**: Automatically move to next singer
- **SMS Notifications**: Text singers when they're next
- **Multi-Language**: Support for multiple languages
- **Custom Themes**: DJ-branded display screens

### Phase 3 Features
- **Karaoke History**: Archive of all karaoke events
- **Singer Profiles**: Track singers across events
- **Song Suggestions**: AI-powered song recommendations
- **Social Sharing**: Share karaoke moments
- **Video Integration**: Link to karaoke videos

### Advanced Features
- **Group Rotation Tracking**: Track individual group members across different groups
- **Voting System**: Audience votes for next singer/group
- **Leaderboard**: Top singers/groups of the night
- **Integration with Karaoke Apps**: Link to karaoke software
- **Group History**: Track which groups performed together

---

## 📋 Implementation Checklist

### Database
- [ ] Create `karaoke_signups` table
- [ ] Create `karaoke_settings` table
- [ ] Add karaoke columns to `crowd_requests`
- [ ] Create indexes
- [ ] Set up RLS policies
- [ ] Create migration file

### Backend
- [ ] Create API endpoints
- [ ] Implement queue calculation logic
- [ ] Implement rotation algorithm
- [ ] Payment integration
- [ ] Validation logic
- [ ] Error handling

### Frontend
- [ ] Sign-up page
- [ ] Display screen
- [ ] Admin dashboard
- [ ] Queue components
- [ ] Settings page
- [ ] Mobile optimization

### Integration
- [ ] Crowd requests integration
- [ ] Payment system integration
- [ ] Event system integration
- [ ] Music library integration (optional)

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance testing
- [ ] Mobile testing

### Documentation
- [ ] User guide
- [ ] API documentation
- [ ] Admin guide
- [ ] Developer guide

### Deployment
- [ ] Database migration
- [ ] Feature flag setup
- [ ] Monitoring setup
- [ ] Rollout plan

---

## 🎉 Conclusion

Karaoke Mode extends the existing DJ platform with specialized features for karaoke events. It leverages existing infrastructure (events, payments, admin dashboard) while adding karaoke-specific functionality (singer management, rotation, display screens).

The implementation is modular and can be rolled out gradually. It respects the multi-product architecture and maintains data isolation between organizations.

**Key Benefits:**
- Professional karaoke management
- Increased engagement at events
- Additional revenue stream (priority fees)
- Better organization for DJs
- Enhanced attendee experience

**Next Steps:**
1. Review and approve plan
2. Create database migrations
3. Build MVP (Phase 1)
4. Test with beta users
5. Roll out to all DJs
