# 🎤 Karaoke Database Seeding Scripts

This directory contains scripts to populate your karaoke system with initial data for a better user experience.

## 📋 Available Scripts

### 1. `seed-karaoke-songs.js`
**Purpose:** Populates the `karaoke_song_videos` table with popular karaoke songs.

**What it does:**
- Adds 15 popular karaoke songs to your database
- Uses placeholder YouTube data (satisfies NOT NULL constraints)
- Songs have low quality scores to encourage real video searches
- All songs are marked as "bulk_import" source

**Usage:**
```bash
node scripts/seed-karaoke-songs.js
```

**Songs included:**
- Tennessee Whiskey (Chris Stapleton)
- I Want It That Way (Backstreet Boys)
- Sweet Caroline (Neil Diamond)
- Bohemian Rhapsody (Queen)
- Dancing Queen (ABBA)
- Before He Cheats (Carrie Underwood)
- Espresso (Sabrina Carpenter)
- Good Luck, Babe! (Chappell Roan)
- Please Please Please (Sabrina Carpenter)
- Birds of a Feather (Billie Eilish)
- Wagon Wheel (Old Crow Medicine Show)
- Take Me Home, Country Roads (John Denver)
- Wonderwall (Oasis)
- Don't Stop Believin' (Journey)
- Livin' on a Prayer (Bon Jovi)

### 2. `create-sample-playlist.js`
**Purpose:** Creates a single demo playlist with popular songs.

**What it does:**
- Creates "🎤 Popular Karaoke Hits" playlist
- Includes 8 songs from the seeded library
- Sets playlist as public

**Usage:**
```bash
node scripts/create-sample-playlist.js
```

### 3. `seed-karaoke-playlists.js`
**Purpose:** Creates multiple themed playlists for comprehensive seeding.

**What it does:**
- Creates 6 different themed playlists
- Each playlist contains 4 songs
- All playlists are public and ready to browse

**Usage:**
```bash
node scripts/seed-karaoke-playlists.js
```

**Playlists created:**
1. **🎤 80s & 90s Hits** - Classic karaoke favorites
2. **💃 Dance Party** - High-energy dance songs
3. **🎸 Rock Classics** - Legendary rock songs
4. **🎻 Country Nights** - Country songs for cozy evenings
5. **🎵 Pop Sensations** - Current pop hits
6. **🎺 Guilty Pleasures** - Fun, cheesy songs

## 🚀 Quick Start

To fully seed your karaoke system:

```bash
# 1. Seed the songs
node scripts/seed-karaoke-songs.js

# 2. Create comprehensive playlists
node scripts/seed-karaoke-playlists.js
```

## 📊 Expected Results

After running both scripts, your karaoke admin will have:
- **15 songs** in the database (ready for YouTube video linking)
- **7 playlists** total (1 demo + 6 themed)
- **28 song-playlist relationships**
- All content marked as public and discoverable

## 🔄 How It Works

1. **Songs are seeded** with placeholder YouTube data
2. **Users can search** for real karaoke videos via YouTube API
3. **Videos get linked** to songs when found
4. **Playlists grow** as users add more songs
5. **System becomes self-sustaining** through user activity

## 🛠️ Technical Notes

- Scripts use `SUPABASE_SERVICE_ROLE_KEY` for database access
- All data is scoped to the first organization found
- Songs use placeholder YouTube IDs (users search for real videos)
- Playlists are created under an admin user account
- Scripts are idempotent (safe to run multiple times)

## 🎵 User Experience

After seeding, users will see:
- Multiple playlists to browse in the "Discover" tab
- Songs ready to search for karaoke videos
- A fully functional playlist system
- Immediate content to interact with

The system then grows organically as users discover and add more songs!