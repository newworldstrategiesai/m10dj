# 🎵 Song Search Feature Implementation

## Overview

A comprehensive song search and autocomplete feature for karaoke signups and song requests. Combines database search with external music APIs (Spotify, Apple Music, iTunes) to provide accurate, real-time song suggestions.

## Features

### ✅ Multi-Source Search
- **Database Search**: Searches previously requested songs from `crowd_requests` table
- **Spotify API**: Real-time search via Spotify Web API (if credentials configured)
- **Apple Music API**: Search via Apple Music API (if credentials configured)
- **iTunes Search**: Fallback search using iTunes Search API (no API key required)

### ✅ Smart Autocomplete
- Debounced search (300ms default)
- Keyboard navigation (arrow keys, enter, escape)
- Click-outside to close
- Loading states
- Empty states
- Album art display
- Source badges (database, Spotify, Apple Music, etc.)

### ✅ User Experience
- Auto-fills both song title and artist when selected
- Shows album artwork when available
- Displays source of each suggestion
- Prioritizes database results (previously requested songs)
- Sorts by popularity and recency

## Components

### `SongAutocomplete` Component
**Location**: `components/karaoke/SongAutocomplete.tsx`

**Props**:
- `value`: Current input value
- `onChange`: Callback when input changes
- `onSelect`: Callback when song is selected (receives `{ title, artist }`)
- `placeholder`: Input placeholder text
- `organizationId`: Optional organization ID for filtering database results
- `className`: Additional CSS classes
- `disabled`: Disable the input
- `minLength`: Minimum characters before searching (default: 2)
- `debounceMs`: Debounce delay in milliseconds (default: 300)

**Usage**:
```tsx
<SongAutocomplete
  value={songTitle}
  onChange={(value) => setSongTitle(value)}
  onSelect={(song) => {
    setSongTitle(song.title);
    setSongArtist(song.artist);
  }}
  placeholder="Search for a song..."
  organizationId={organizationId}
/>
```

## API Endpoint

### `POST /api/karaoke/search-songs`

**Request Body**:
```json
{
  "query": "don't stop believin",
  "organizationId": "uuid-optional",
  "limit": 10
}
```

**Response**:
```json
{
  "suggestions": [
    {
      "id": "spotify-4uLU6hMCjMI75M1c2t",
      "title": "Don't Stop Believin'",
      "artist": "Journey",
      "albumArt": "https://...",
      "spotifyUrl": "https://open.spotify.com/track/...",
      "source": "spotify",
      "popularity": 85
    },
    {
      "id": "db-0-Don't Stop Believin'-Journey",
      "title": "Don't Stop Believin'",
      "artist": "Journey",
      "source": "database",
      "popularity": 5
    }
  ],
  "query": "don't stop believin"
}
```

## Integration

### Karaoke Signup Page
Already integrated in:
- `/pages/organizations/[slug]/sing.tsx`
- `/pages/karaoke/[code].tsx`

### Song Request Pages
To integrate into existing song request forms:

1. Import the component:
```tsx
import SongAutocomplete from '@/components/karaoke/SongAutocomplete';
```

2. Replace the song title input:
```tsx
<SongAutocomplete
  value={songTitle}
  onChange={(value) => setSongTitle(value)}
  onSelect={(song) => {
    setSongTitle(song.title);
    setSongArtist(song.artist);
  }}
  organizationId={organizationId}
  placeholder="Search for a song..."
/>
```

## Configuration

### Environment Variables

For full functionality, add these to `.env.local`:

```bash
# Spotify API (optional but recommended)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Apple Music API (optional)
APPLE_MUSIC_API_KEY=your_apple_music_api_key
```

### Spotify API Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Get Client ID and Client Secret
4. Add to environment variables

### Apple Music API Setup
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a Music API key
3. Add to environment variables

**Note**: The feature works without API keys - it will use database search and iTunes fallback.

## Search Priority

Results are sorted by:
1. **Source**: Database results first (previously requested songs)
2. **Popularity**: Higher popularity scores first
3. **Alphabetical**: Title A-Z as tiebreaker

## Keyboard Navigation

- **Arrow Down**: Navigate to next suggestion
- **Arrow Up**: Navigate to previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown

## Mobile Optimization

- Touch-friendly suggestion items
- Responsive dropdown
- Optimized for small screens
- Source badges hide on mobile (icon only)

## Future Enhancements

- [ ] Search history (recent searches)
- [ ] Favorite songs
- [ ] Search by artist only
- [ ] Search by genre
- [ ] Play preview (30-second clip)
- [ ] Add to playlist functionality
- [ ] Search karaoke-specific databases
- [ ] Language-specific search

## Performance

- Debounced requests (300ms) to reduce API calls
- Cached Spotify access tokens
- Graceful degradation (works without API keys)
- Database queries are indexed and optimized
- Results limited to 10 per source

## Error Handling

- All API failures are caught and logged
- Empty results returned on error (graceful degradation)
- User sees "No songs found" message
- No breaking errors - form still works without search
