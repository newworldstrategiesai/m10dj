# 📸 Venue Image Scraping Feature

## Overview

This feature automatically fetches venue images from Google Places API to display in the form submissions UI. When a lead submission includes a venue location, you can fetch and display venue photos directly in the admin interface.

## Features

- ✅ **Automatic Image Fetching**: Click a button to fetch venue images from Google Places
- ✅ **Google Places Integration**: Uses Google Places API for reliable venue photo retrieval
- ✅ **Database Storage**: Venue images are stored in the database for future reference
- ✅ **UI Integration**: Images display directly in the form submission detail modal
- ✅ **Error Handling**: Graceful fallback if API key is not configured

## Setup

### 1. Database Migration

Run the migration to add venue image fields:

```bash
# Apply the migration
supabase db push

# Or manually run in Supabase SQL Editor
# File: supabase/migrations/20250220000001_add_venue_image_to_submissions.sql
```

### 2. Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API**
   - **Maps JavaScript API** (optional, for future features)
4. Create an API key:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Restrict the key to "Places API" only (recommended for security)
   - Optionally restrict by IP/domain for production
5. Add to your environment variables:

```env
GOOGLE_PLACES_API_KEY=your-api-key-here
```

### 3. Deploy

After adding the API key, redeploy your application or restart your development server.

## Usage

### For Existing Submissions

1. Navigate to **Admin** → **Form Submissions**
2. Click on any submission to view details
3. Scroll to the **Event Details** section
4. If a venue location is present but no image is shown:
   - Click the **"Fetch Venue Image"** button
   - The system will search Google Places for the venue
   - If found, the image will be displayed automatically
   - The image URL is saved to the database

### For New Submissions

Venue images are not automatically fetched on submission. You can fetch them manually using the same process above.

## How It Works

1. **Location Parsing**: The system extracts venue name and address from the location string
2. **Google Places Search**: Searches Google Places API using the venue name/address
3. **Photo Retrieval**: Gets the first available photo from the place details
4. **Image URL Generation**: Constructs a Google Places photo URL (max width 800px)
5. **Database Storage**: Saves the image URL and timestamp to `contact_submissions` table

## Database Schema

The following fields were added to `contact_submissions`:

- `venue_image_url` (TEXT): URL of the venue image from Google Places
- `venue_image_fetched_at` (TIMESTAMP): When the image was last fetched

## API Endpoint

**POST** `/api/admin/fetch-venue-image`

**Request Body:**
```json
{
  "location": "D'LUXE Venue (Cordova), 11224 Trinity Rd, Cordova, TN 38016",
  "submissionId": "optional-submission-id"
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://maps.googleapis.com/maps/api/place/photo?...",
  "source": "google_places",
  "venueName": "D'LUXE Venue",
  "submissionId": "submission-id-if-provided"
}
```

## Error Handling

- **No API Key**: Shows error message instructing to configure Google Places API key
- **Venue Not Found**: Returns 404 with message that venue couldn't be found
- **No Photos Available**: Returns 404 if venue exists but has no photos
- **Network Errors**: Logs error and returns 500 status

## Security

- ✅ **Admin Only**: Only platform admins can fetch venue images
- ✅ **API Key Security**: Google Places API key is server-side only
- ✅ **Rate Limiting**: Google Places API has built-in rate limits
- ✅ **Key Restrictions**: Recommended to restrict API key to specific domains/IPs

## Cost Considerations

Google Places API pricing (as of 2024):
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Photos**: Free (included with Place Details)

**Estimated Cost**: ~$0.05 per venue image fetch

## Future Enhancements

Potential improvements:
- [ ] Automatic image fetching on new submissions
- [ ] Batch image fetching for multiple submissions
- [ ] Image caching to reduce API calls
- [ ] Support for multiple images (gallery)
- [ ] Fallback to other image sources (Yelp, Facebook, etc.)
- [ ] Image optimization and CDN storage

## Troubleshooting

### "No venue image found" Error

1. **Check API Key**: Verify `GOOGLE_PLACES_API_KEY` is set correctly
2. **Check API Status**: Verify Places API is enabled in Google Cloud Console
3. **Check Venue Name**: The venue must exist in Google Maps/Places
4. **Check Billing**: Ensure Google Cloud billing is enabled

### Image Not Displaying

1. **Check Image URL**: Verify the URL is accessible
2. **Check CORS**: Google Places photo URLs should work from any domain
3. **Check Browser Console**: Look for image loading errors
4. **Try Direct URL**: Open the image URL directly in a new tab

## Related Files

- `supabase/migrations/20250220000001_add_venue_image_to_submissions.sql` - Database migration
- `pages/api/admin/fetch-venue-image.js` - API endpoint
- `pages/admin/form-submissions.tsx` - UI integration
- `ENV_SETUP.md` - Environment variable documentation

