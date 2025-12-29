# Serato Play Detection Companion App

Detects "Now Playing" tracks from Serato DJ Pro and sends them to your SaaS backend for request matching and automatic notifications.

## How It Works

1. **DJ Tools** (like "Now Playing" app) write track info to a text file
2. **This companion app** watches that text file for changes
3. **When a track changes**, it sends the info to your backend
4. **Backend matches** the track to song requests
5. **Requesters get notified** automatically when their song plays

## Prerequisites

You need a "Now Playing" tool that writes track information to a text file. Popular options:

- **Now Playing** by DJ Flipside: [djflipside.com/pages/now-playing](https://djflipside.com/en-usd/pages/now-playing)
- **What's Now Playing**: [whatsnowplaying.github.io](https://whatsnowplaying.github.io)
- **Now-Playing-Serato**: [github.com/aw-was-here/Now-Playing-Serato](https://github.com/aw-was-here/Now-Playing-Serato)

These tools are commonly used by DJs streaming to Twitch for "Now Playing" overlays.

## Installation

```bash
# Clone or navigate to the companion-app directory
cd companion-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
```

## Configuration

Edit `.env` with your settings:

```env
# API URL - Your SaaS backend
API_URL=https://m10djcompany.com

# Supabase Configuration (same as your web app)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Auto-login credentials
SUPABASE_EMAIL=your-email@example.com
SUPABASE_PASSWORD=your-password

# Optional: Custom text file path
TEXT_FILE_PATH=/path/to/nowplaying.txt
```

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
# Build
npm run build

# Run
npm start
```

### What Happens

1. App starts and prompts for login (if not using env credentials)
2. Searches for active "Now Playing" text files
3. Watches the text file for changes
4. When track changes, sends to backend
5. Backend matches to requests and notifies requesters

## Text File Locations

The app automatically searches these common locations:

- `~/Music/NowPlaying/current.txt` (Now Playing app)
- `~/Documents/NowPlaying/current.txt` (What's Now Playing)
- `~/Documents/djctl/nowplaying.txt` (djctl)
- `~/Music/_Serato_/nowplaying.txt` (Now-Playing-Serato)

Or set a custom path with `TEXT_FILE_PATH` in your `.env` file.

## Text File Formats

The app understands these formats:

```
# Format 1: Artist - Title (most common)
Daft Punk - Get Lucky

# Format 2: Title by Artist
Get Lucky by Daft Punk

# Format 3: Multi-line
Daft Punk
Get Lucky

# Format 4: JSON
{"artist": "Daft Punk", "title": "Get Lucky"}
```

## Troubleshooting

### "No active text file found"

Make sure your "Now Playing" tool is running and writing to a text file. Check that:
- The tool is configured to output to a text file
- The file has been recently modified (within the last hour)
- The file contains track information

### "Authentication failed"

- Check your Supabase URL and anon key are correct
- Make sure your email/password are correct
- Verify your account exists in the system

### "Failed to send track"

- Check your internet connection
- Verify the API URL is correct
- Check the backend server is running

## Architecture

```
┌─────────────────────────────────────────────┐
│  DJ's Laptop                                │
│                                             │
│  Serato DJ Pro                              │
│       ↓                                     │
│  Now Playing Tool (writes text file)        │
│       ↓                                     │
│  This Companion App (watches file)          │
│       ↓                                     │
│  HTTP POST to Backend API                   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  SaaS Backend                               │
│                                             │
│  /api/serato/now-playing                    │
│       ↓                                     │
│  Match to requests → Notify requesters      │
└─────────────────────────────────────────────┘
```

## License

MIT

