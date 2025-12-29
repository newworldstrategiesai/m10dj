# Serato Play Detection & Notifications - Master Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for Serato play detection and notifications across all three products (DJDash.net, M10DJCompany.com, TipJar.live). The solution will detect when requested songs start playing in Serato DJ Pro and automatically notify requesters in real-time.

**Architecture**: Local Node.js companion app → REST API → Supabase → Real-time dashboard + Notifications

**Timeline**: 6-8 weeks (phased approach)

**Tech Stack**: Node.js/TypeScript, Next.js API routes, Supabase (PostgreSQL + Realtime), Existing notification system

---

## Phase 0: Foundation & Research (Week 1)

### Objectives
- Finalize architecture decisions
- Set up development environment
- Research Serato file formats

### Tasks

#### 0.1 Research & Documentation ✅ (COMPLETE)
- [x] Research Serato file formats and history structure
- [x] Review existing tools (Now-Playing-Serato Python tool)
- [x] Document architecture decisions
- [x] Create master plan

#### 0.2 Development Environment Setup
- [ ] Create companion app directory structure
- [ ] Set up TypeScript configuration
- [ ] Initialize npm package for companion app
- [ ] Set up shared types package (optional but recommended)

#### 0.3 Serato File Format Analysis
- [ ] Obtain sample Serato history files (from test machine)
- [ ] Document binary format structure
- [ ] Create parsing test cases
- [ ] Validate file locations (macOS/Windows)

**Deliverables**:
- Companion app skeleton
- File format documentation
- Test cases

---

## Phase 1: Database Schema (Week 1-2)

### Objectives
- Create database tables for play history and connections
- Set up RLS policies
- Add feature flags

### Tasks

#### 1.1 Create Database Tables

**Migration File**: `supabase/migrations/YYYYMMDDHHMMSS_create_serato_tables.sql`

```sql
-- Table: serato_play_history
CREATE TABLE IF NOT EXISTS serato_play_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Track metadata
  artist TEXT NOT NULL,
  title TEXT NOT NULL,
  normalized_artist TEXT, -- For matching
  normalized_title TEXT,  -- For matching
  
  -- Play details
  played_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deck TEXT, -- 'A', 'B', or NULL
  bpm DECIMAL(4,2),
  
  -- Matching status
  matched_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  matched_at TIMESTAMP WITH TIME ZONE,
  
  -- Detection method
  detection_method TEXT DEFAULT 'text_file' 
    CHECK (detection_method IN ('text_file', 'serato_history', 'live_playlists', 'manual')),
  source_file TEXT, -- File path if from text file
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_play UNIQUE (dj_id, artist, title, played_at)
);

-- Table: serato_connections
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
  platform TEXT CHECK (platform IN ('macos', 'windows', 'linux')),
  detection_method TEXT DEFAULT 'text_file',
  
  -- Constraints
  CONSTRAINT unique_active_connection UNIQUE (dj_id) WHERE is_connected = TRUE
);

-- Add columns to crowd_requests table
ALTER TABLE crowd_requests 
  ADD COLUMN IF NOT EXISTS normalized_artist TEXT,
  ADD COLUMN IF NOT EXISTS normalized_title TEXT,
  ADD COLUMN IF NOT EXISTS matched_play_id UUID REFERENCES serato_play_history(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;

-- Add feature flag to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS serato_play_detection_enabled BOOLEAN DEFAULT FALSE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_serato_play_history_dj_id ON serato_play_history(dj_id);
CREATE INDEX IF NOT EXISTS idx_serato_play_history_played_at ON serato_play_history(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_serato_play_history_matched_request ON serato_play_history(matched_request_id);
CREATE INDEX IF NOT EXISTS idx_serato_play_history_normalized ON serato_play_history(normalized_artist, normalized_title);
CREATE INDEX IF NOT EXISTS idx_serato_play_history_organization ON serato_play_history(organization_id);

CREATE INDEX IF NOT EXISTS idx_serato_connections_dj_id ON serato_connections(dj_id);
CREATE INDEX IF NOT EXISTS idx_serato_connections_connected ON serato_connections(is_connected, last_heartbeat);

CREATE INDEX IF NOT EXISTS idx_crowd_requests_normalized ON crowd_requests(normalized_artist, normalized_title) 
  WHERE normalized_artist IS NOT NULL AND normalized_title IS NOT NULL;

-- RLS Policies
ALTER TABLE serato_play_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE serato_connections ENABLE ROW LEVEL SECURITY;

-- serato_play_history policies
CREATE POLICY "DJs can view own play history"
  ON serato_play_history FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

CREATE POLICY "Service role can insert play history"
  ON serato_play_history FOR INSERT
  TO service_role
  WITH CHECK (true);

-- serato_connections policies
CREATE POLICY "DJs can view own connections"
  ON serato_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = dj_id);

CREATE POLICY "Service role can manage connections"
  ON serato_connections FOR ALL
  TO service_role
  USING (true);

-- Functions
CREATE OR REPLACE FUNCTION normalize_track_string(str TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(trim(regexp_replace(regexp_replace(str, '[^\w\s]', '', 'g'), '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### 1.2 Create Normalization Helper Function
- [ ] Implement database function for string normalization
- [ ] Test with various artist/title formats

#### 1.3 Set Up Feature Flags
- [ ] Add feature flag column to organizations table
- [ ] Create admin UI to enable/disable per organization (future)

**Deliverables**:
- Database migration file
- RLS policies tested
- Feature flags configured

---

## Phase 2: Backend API Endpoints (Week 2)

### Objectives
- Create REST API endpoints for companion app
- Implement authentication
- Set up request matching logic

### Tasks

#### 2.1 Create API Route: `/api/serato/now-playing`

**File**: `app/api/serato/now-playing/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeTrackString } from '@/utils/serato/normalize';
import { matchTrackToRequest } from '@/utils/serato/matching';
import { sendRequestPlayingNotification } from '@/utils/serato/notifications';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate DJ
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { track, detection_method = 'text_file', source_file } = body;

    if (!track?.artist || !track?.title || !track?.played_at) {
      return NextResponse.json(
        { error: 'Missing required fields: artist, title, played_at' },
        { status: 400 }
      );
    }

    // 3. Get organization_id (if available)
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // 4. Normalize track strings
    const normalizedArtist = normalizeTrackString(track.artist);
    const normalizedTitle = normalizeTrackString(track.title);

    // 5. Store play history
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: playHistory, error: insertError } = await serviceSupabase
      .from('serato_play_history')
      .insert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        artist: track.artist,
        title: track.title,
        normalized_artist: normalizedArtist,
        normalized_title: normalizedTitle,
        played_at: track.played_at,
        deck: track.deck || null,
        bpm: track.bpm || null,
        detection_method,
        source_file: source_file || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting play history:', insertError);
      // Continue anyway - don't fail the request
    }

    // 6. Match to requests (async - don't block response)
    if (playHistory) {
      matchTrackToRequest(playHistory, serviceSupabase).catch(err => {
        console.error('Error matching track to request:', err);
      });
    }

    // 7. Update connection heartbeat
    await serviceSupabase
      .from('serato_connections')
      .upsert({
        dj_id: user.id,
        organization_id: organization?.id || null,
        last_heartbeat: new Date().toISOString(),
        is_connected: true,
        platform: body.platform || null,
        app_version: body.app_version || null,
        detection_method
      }, {
        onConflict: 'dj_id'
      });

    // 8. Return success
    return NextResponse.json({
      success: true,
      play_id: playHistory?.id,
      message: 'Play history recorded'
    });

  } catch (error) {
    console.error('Error in /api/serato/now-playing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 2.2 Create Matching Logic

**File**: `utils/serato/matching.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { calculateSimilarity } from './normalize';

interface PlayHistory {
  id: string;
  dj_id: string;
  organization_id: string | null;
  artist: string;
  title: string;
  normalized_artist: string;
  normalized_title: string;
  played_at: string;
}

export async function matchTrackToRequest(
  playHistory: PlayHistory,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // 1. Find active requests for this DJ/organization
    let query = supabase
      .from('crowd_requests')
      .select('id, song_artist, song_title, normalized_artist, normalized_title, status, notification_sent')
      .eq('request_type', 'song_request')
      .in('status', ['new', 'acknowledged']);

    // Filter by organization if available
    if (playHistory.organization_id) {
      query = query.eq('organization_id', playHistory.organization_id);
    } else {
      // Fallback: match by DJ user_id if organization not available
      // (this assumes crowd_requests has a dj_id or user_id field - adjust as needed)
    }

    const { data: activeRequests, error } = await query;

    if (error || !activeRequests || activeRequests.length === 0) {
      return; // No active requests to match
    }

    // 2. Try exact match first
    const exactMatch = activeRequests.find(req => 
      req.normalized_artist === playHistory.normalized_artist &&
      req.normalized_title === playHistory.normalized_title
    );

    let matchedRequest = exactMatch;

    // 3. Try fuzzy match if no exact match
    if (!matchedRequest) {
      const SIMILARITY_THRESHOLD = 0.85; // 85% similarity required

      for (const request of activeRequests) {
        if (!request.normalized_artist || !request.normalized_title) {
          continue; // Skip if not normalized
        }

        const artistSimilarity = calculateSimilarity(
          playHistory.normalized_artist,
          request.normalized_artist
        );
        const titleSimilarity = calculateSimilarity(
          playHistory.normalized_title,
          request.normalized_title
        );

        if (artistSimilarity >= SIMILARITY_THRESHOLD && 
            titleSimilarity >= SIMILARITY_THRESHOLD) {
          matchedRequest = request;
          break;
        }
      }
    }

    // 4. Update request if matched
    if (matchedRequest) {
      await supabase
        .from('crowd_requests')
        .update({
          status: 'playing',
          played_at: playHistory.played_at,
          matched_play_id: playHistory.id
        })
        .eq('id', matchedRequest.id);

      // 5. Send notification (one time only)
      if (!matchedRequest.notification_sent) {
        await sendRequestPlayingNotification(matchedRequest, supabase);
      }

      // 6. Update play history with match
      await supabase
        .from('serato_play_history')
        .update({
          matched_request_id: matchedRequest.id,
          matched_at: new Date().toISOString()
        })
        .eq('id', playHistory.id);
    }

  } catch (error) {
    console.error('Error matching track to request:', error);
    throw error;
  }
}
```

#### 2.3 Create Normalization Utilities

**File**: `utils/serato/normalize.ts`

```typescript
/**
 * Normalize a track string for matching
 * - Convert to lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Normalize whitespace
 * - Remove common prefixes/suffixes
 */
export function normalizeTrackString(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .replace(/\b(feat|ft|featuring)\b/gi, '')  // Remove "feat"
    .replace(/\b(remix|remix)\b/gi, '');       // Optional: remove "remix"
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 * Returns a value between 0 and 1 (1 = identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
```

#### 2.4 Create Connection Status Endpoint

**File**: `app/api/serato/connection-status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update heartbeat
    await serviceSupabase
      .from('serato_connections')
      .upsert({
        dj_id: user.id,
        last_heartbeat: new Date().toISOString(),
        is_connected: true,
        platform: body.platform,
        app_version: body.app_version
      }, {
        onConflict: 'dj_id'
      });

    return NextResponse.json({
      connected: true,
      last_heartbeat: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in connection-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Deliverables**:
- API endpoint `/api/serato/now-playing`
- API endpoint `/api/serato/connection-status`
- Matching logic implementation
- Normalization utilities

---

## Phase 3: Companion App - Text File Watcher (Week 3)

### Objectives
- Build Node.js companion app
- Implement text file detection and watching
- Set up authentication

### Tasks

#### 3.1 Set Up Companion App Structure

**Directory**: `companion-app/`

```
companion-app/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration
│   ├── auth/
│   │   └── supabase.ts       # Supabase authentication
│   ├── detection/
│   │   ├── text-file.ts      # Text file watcher
│   │   └── detector.ts       # Detection method manager
│   ├── api/
│   │   └── backend.ts        # Backend API client
│   └── utils/
│       ├── logger.ts         # Logging utilities
│       └── paths.ts          # File path utilities
├── package.json
├── tsconfig.json
└── README.md
```

#### 3.2 Implement Text File Detector

**File**: `companion-app/src/detection/text-file.ts`

```typescript
import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface Track {
  artist: string;
  title: string;
  detectedAt: string;
  sourceFile: string;
}

export class TextFileDetector {
  private watcher: chokidar.FSWatcher | null = null;
  private lastContent: string | null = null;
  private onTrackChange: (track: Track) => void;
  private filePath: string;

  constructor(filePath: string, onTrackChange: (track: Track) => void) {
    this.filePath = filePath;
    this.onTrackChange = onTrackChange;
  }

  async start(): Promise<void> {
    // Read initial content
    await this.readFile();

    // Watch for changes
    this.watcher = chokidar.watch(this.filePath, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 100, // Wait 100ms after file stops changing
        pollInterval: 50
      }
    });

    this.watcher.on('change', () => {
      this.readFile().catch(err => {
        console.error('Error reading file:', err);
      });
    });

    this.watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });
  }

  private async readFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const trimmedContent = content.trim();

      if (trimmedContent !== this.lastContent && trimmedContent.length > 0) {
        this.lastContent = trimmedContent;
        this.parseAndEmit(trimmedContent);
      }
    } catch (error) {
      console.error(`Error reading file ${this.filePath}:`, error);
    }
  }

  private parseAndEmit(content: string): void {
    // Parse "Artist - Title" format
    const parts = content.split(' - ');

    if (parts.length >= 2) {
      const artist = parts[0].trim();
      const title = parts.slice(1).join(' - ').trim();

      if (artist && title) {
        this.onTrackChange({
          artist,
          title,
          detectedAt: new Date().toISOString(),
          sourceFile: this.filePath
        });
      }
    }
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

export async function findTextFile(): Promise<string | null> {
  const homeDir = os.homedir();
  const isMac = process.platform === 'darwin';

  const pathsToCheck = [
    path.join(homeDir, 'Music', 'NowPlaying', 'current.txt'),
    path.join(homeDir, 'Documents', 'NowPlaying', 'current.txt'),
    path.join(homeDir, 'Documents', 'djctl', 'nowplaying.txt'),
    path.join(homeDir, 'Music', '_Serato_', 'nowplaying.txt'),
  ];

  for (const filePath of pathsToCheck) {
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      const hoursSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceModified < 1) {
        const content = await fs.readFile(filePath, 'utf-8');
        if (content.trim().length > 0) {
          return filePath;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}
```

#### 3.3 Implement Backend API Client

**File**: `companion-app/src/api/backend.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export interface TrackEvent {
  artist: string;
  title: string;
  played_at: string;
  deck?: string;
  bpm?: number;
  detection_method: string;
  source_file?: string;
}

export class BackendAPI {
  private apiUrl: string;
  private authToken: string | null = null;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  async sendNowPlaying(
    track: TrackEvent,
    platform: string,
    appVersion: string
  ): Promise<void> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${this.apiUrl}/api/serato/now-playing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        track,
        platform,
        app_version: appVersion,
        detection_method: track.detection_method,
        source_file: track.source_file
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to send now playing: ${error.error || response.statusText}`);
    }
  }

  async sendHeartbeat(platform: string, appVersion: string): Promise<void> {
    if (!this.authToken) {
      return; // Silent fail for heartbeat
    }

    try {
      await fetch(`${this.apiUrl}/api/serato/connection-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          platform,
          app_version: appVersion
        })
      });
    } catch (error) {
      // Silent fail for heartbeat - don't spam logs
    }
  }
}
```

#### 3.4 Implement Main Application

**File**: `companion-app/src/index.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { TextFileDetector, findTextFile } from './detection/text-file';
import { BackendAPI } from './api/backend';
import * as readline from 'readline';

const API_URL = process.env.API_URL || 'https://m10djcompany.com';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

async function main() {
  console.log('🎵 Serato Play Detection Companion App');
  console.log('=====================================\n');

  // 1. Authenticate
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('Please sign in to continue...');
  // TODO: Implement interactive login or token input
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('❌ Not authenticated. Please sign in.');
    process.exit(1);
  }

  console.log('✅ Authenticated\n');

  // 2. Find text file
  console.log('🔍 Searching for "Now Playing" text file...');
  const textFilePath = await findTextFile();

  if (!textFilePath) {
    console.error('❌ No text file found. Please ensure you have a "Now Playing" tool running.');
    process.exit(1);
  }

  console.log(`✅ Found text file: ${textFilePath}\n`);

  // 3. Set up backend API
  const backendAPI = new BackendAPI(API_URL);
  backendAPI.setAuthToken(session.access_token);

  // 4. Set up text file watcher
  const detector = new TextFileDetector(textFilePath, async (track) => {
    console.log(`🎵 Track detected: ${track.artist} - ${track.title}`);

    try {
      await backendAPI.sendNowPlaying({
        artist: track.artist,
        title: track.title,
        played_at: track.detectedAt,
        detection_method: 'text_file',
        source_file: track.sourceFile
      }, process.platform === 'darwin' ? 'macos' : 'windows', '1.0.0');

      console.log('✅ Track sent to backend\n');
    } catch (error) {
      console.error('❌ Error sending track:', error);
    }
  });

  await detector.start();
  console.log('👂 Watching for track changes...\n');

  // 5. Set up heartbeat (every 30 seconds)
  setInterval(() => {
    backendAPI.sendHeartbeat(
      process.platform === 'darwin' ? 'macos' : 'windows',
      '1.0.0'
    );
  }, 30000);

  // 6. Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down...');
    detector.stop();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

#### 3.5 Create Package Configuration

**File**: `companion-app/package.json`

```json
{
  "name": "@m10dj/serato-companion",
  "version": "1.0.0",
  "description": "Serato play detection companion app",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.43.4",
    "chokidar": "^3.5.3"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "tsx": "^4.7.0",
    "typescript": "^5.4.5"
  }
}
```

**Deliverables**:
- Working companion app
- Text file detection
- Authentication flow
- Backend API integration

---

## Phase 4: Notifications (Week 4)

### Objectives
- Integrate with existing notification system
- Send SMS/Email when request is matched
- Ensure one-time notifications only

### Tasks

#### 4.1 Create Notification Function

**File**: `utils/serato/notifications.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { sendAdminSMS } from '@/utils/sms-helper';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendRequestPlayingNotification(
  request: any,
  supabase: SupabaseClient
): Promise<void> {
  try {
    const message = `Your song is playing 🎶\n\n"${request.song_title}" by ${request.song_artist}`;

    // Send SMS if phone exists
    if (request.requester_phone) {
      try {
        await sendAdminSMS(message, request.requester_phone);
        console.log(`✅ SMS sent to ${request.requester_phone}`);
      } catch (error) {
        console.error('Error sending SMS:', error);
      }
    }

    // Send email if email exists
    if (request.requester_email && resend) {
      try {
        await resend.emails.send({
          from: 'M10 DJ Company <notifications@m10djcompany.com>',
          to: request.requester_email,
          subject: 'Your song is playing! 🎶',
          html: `
            <h2>Your song is playing! 🎶</h2>
            <p><strong>"${request.song_title}"</strong> by <strong>${request.song_artist}</strong></p>
            <p>Enjoy!</p>
          `
        });
        console.log(`✅ Email sent to ${request.requester_email}`);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    // Mark notification as sent
    await supabase
      .from('crowd_requests')
      .update({ notification_sent: true })
      .eq('id', request.id);

  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}
```

**Deliverables**:
- Notification function
- SMS integration
- Email integration
- One-time notification logic

---

## Phase 5: Frontend Dashboard Integration (Week 5)

### Objectives
- Add real-time "Now Playing" display
- Show connection status
- Update request list with playing status

### Tasks

#### 5.1 Create Real-Time Subscription Hook

**File**: `hooks/useSeratoNowPlaying.ts`

```typescript
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel } from '@supabase/supabase-js';

interface NowPlaying {
  artist: string;
  title: string;
  playedAt: string;
}

export function useSeratoNowPlaying(djId: string | null) {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!djId) return;

    // Subscribe to play history
    const channel = supabase
      .channel('serato-now-playing')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'serato_play_history',
          filter: `dj_id=eq.${djId}`
        },
        (payload) => {
          const play = payload.new;
          setNowPlaying({
            artist: play.artist,
            title: play.title,
            playedAt: play.played_at
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crowd_requests',
          filter: `status=eq.playing`
        },
        (payload) => {
          // Request status updated to playing
          // Could trigger UI updates here
        }
      )
      .subscribe();

    // Check connection status
    const checkConnection = async () => {
      const { data } = await supabase
        .from('serato_connections')
        .select('is_connected, last_heartbeat')
        .eq('dj_id', djId)
        .eq('is_connected', true)
        .single();

      setIsConnected(!!data);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [djId, supabase]);

  return { nowPlaying, isConnected };
}
```

#### 5.2 Create Dashboard Component

**File**: `components/serato/NowPlayingDisplay.tsx`

```typescript
'use client';

import { useSeratoNowPlaying } from '@/hooks/useSeratoNowPlaying';
import { Music, Circle, Wifi, WifiOff } from 'lucide-react';

interface NowPlayingDisplayProps {
  djId: string | null;
}

export function NowPlayingDisplay({ djId }: NowPlayingDisplayProps) {
  const { nowPlaying, isConnected } = useSeratoNowPlaying(djId);

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <>
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-green-600">Serato Connected</span>
          </>
        ) : (
          <>
            <Circle className="w-2 h-2 fill-red-500 text-red-500" />
            <span className="text-red-600">Serato Disconnected</span>
          </>
        )}
      </div>

      {/* Now Playing */}
      {nowPlaying && (
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Now Playing</h3>
          </div>
          <p className="text-lg font-medium">{nowPlaying.title}</p>
          <p className="text-sm text-muted-foreground">{nowPlaying.artist}</p>
        </div>
      )}
    </div>
  );
}
```

**Deliverables**:
- Real-time subscription hook
- Now Playing display component
- Connection status indicator

---

## Phase 6: Testing & Polish (Week 6-7)

### Objectives
- End-to-end testing
- Error handling improvements
- Performance optimization
- Documentation

### Tasks

#### 6.1 Testing
- [ ] Test text file detection on macOS
- [ ] Test text file detection on Windows
- [ ] Test matching logic with various artist/title formats
- [ ] Test notification delivery
- [ ] Test real-time updates
- [ ] Test connection status

#### 6.2 Error Handling
- [ ] Handle file deletion gracefully
- [ ] Handle network errors
- [ ] Handle authentication expiry
- [ ] Add retry logic for API calls

#### 6.3 Performance
- [ ] Optimize file watching
- [ ] Optimize database queries
- [ ] Add rate limiting
- [ ] Optimize real-time subscriptions

#### 6.4 Documentation
- [ ] User guide for DJs
- [ ] Installation instructions
- [ ] Troubleshooting guide
- [ ] API documentation

**Deliverables**:
- Tested and polished feature
- Documentation
- User guides

---

## Phase 7: Direct Serato History Parser (Week 8 - Optional)

### Objectives
- Implement direct Serato history file parsing
- Fallback for DJs not using text file tools

### Tasks
- [ ] Study Serato history file format
- [ ] Implement binary parser
- [ ] Test with various file versions
- [ ] Integrate as fallback detection method

**Deliverables**:
- Direct Serato history parser
- Fallback detection method

---

## File Structure Summary

```
m10dj/
├── app/
│   └── api/
│       └── serato/
│           ├── now-playing/
│           │   └── route.ts
│           └── connection-status/
│               └── route.ts
├── utils/
│   └── serato/
│       ├── matching.ts
│       ├── normalize.ts
│       └── notifications.ts
├── hooks/
│   └── useSeratoNowPlaying.ts
├── components/
│   └── serato/
│       └── NowPlayingDisplay.tsx
├── companion-app/          # Separate Node.js app
│   ├── src/
│   │   ├── index.ts
│   │   ├── detection/
│   │   ├── api/
│   │   └── auth/
│   └── package.json
└── supabase/
    └── migrations/
        └── YYYYMMDDHHMMSS_create_serato_tables.sql
```

---

## Dependencies to Add

### Backend (package.json)
```json
{
  "dependencies": {
    // Already have these:
    "@supabase/supabase-js": "^2.43.4",
    "next": "13.5.6"
    // No new dependencies needed!
  }
}
```

### Companion App (companion-app/package.json)
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.43.4",
    "chokidar": "^3.5.3"
  },
  "devDependencies": {
    "@types/node": "^20.14.2",
    "tsx": "^4.7.0",
    "typescript": "^5.4.5"
  }
}
```

---

## Environment Variables

### Backend (.env.local)
```env
# Already have these:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### Companion App (companion-app/.env)
```env
API_URL=https://m10djcompany.com
SUPABASE_URL=<same as backend>
SUPABASE_ANON_KEY=<same as backend>
```

---

## Success Metrics

- ✅ DJ can install companion app and connect
- ✅ Companion app detects text file changes
- ✅ Track plays are recorded in database
- ✅ Requests are matched to plays
- ✅ Requesters receive notifications
- ✅ Dashboard shows "Now Playing" in real-time
- ✅ Connection status is displayed

---

## Risk Mitigation

### Risk: Text file not found
**Mitigation**: Clear error messages, fallback to direct Serato parsing (Phase 7)

### Risk: Matching false positives
**Mitigation**: High similarity threshold (85%), exact match preferred, manual override option

### Risk: Notification spam
**Mitigation**: `notification_sent` flag, one-time only, DJ can disable

### Risk: Connection drops
**Mitigation**: Heartbeat mechanism, reconnection logic, graceful degradation

---

## Next Steps

1. **Week 1**: Set up development environment, create database migration
2. **Week 2**: Implement API endpoints and matching logic
3. **Week 3**: Build companion app with text file watcher
4. **Week 4**: Integrate notifications
5. **Week 5**: Build frontend dashboard components
6. **Week 6-7**: Testing and polish
7. **Week 8**: Direct Serato parser (optional)

---

## Questions & Decisions Needed

1. **Authentication Flow**: How should DJs authenticate in companion app?
   - Option A: Interactive login (email/password)
   - Option B: Token input (copy from web dashboard)
   - Option C: OAuth flow

2. **Distribution**: How to distribute companion app?
   - Option A: npm package (`npx @m10dj/serato-companion`)
   - Option B: Electron app with installer
   - Option C: Simple executable

3. **Normalization**: Should we normalize requests at creation time or on-the-fly?
   - Recommendation: At creation time (store normalized fields)

---

This master plan provides a complete roadmap for implementation. Each phase builds on the previous one, allowing for incremental development and testing.

