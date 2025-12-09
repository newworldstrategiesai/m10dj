# Feature Testing Guide

This document outlines how to test the three new features that were implemented.

## Prerequisites

1. **Database Migrations**: Run these migrations in Supabase SQL Editor:
   - `supabase/migrations/20250201000001_add_charity_donation_to_organizations.sql`
   - `supabase/migrations/20250201000002_add_audio_upload_to_crowd_requests.sql`

2. **Supabase Storage**: Create a storage bucket named `crowd-requests` with public access for audio files.

3. **Environment Variables**: Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`

## Feature 1: Charity Donation

### Setup
1. Go to your organization settings (or update directly in Supabase)
2. Set the following fields:
   - `charity_donation_enabled` = `true`
   - `charity_donation_percentage` = `50` (or any value 0-100)
   - `charity_name` = `"St. Jude Children's Research Hospital"`
   - `charity_url` = `"https://www.stjude.org"`
   - `charity_description` = `"Supporting children's cancer research"` (optional)

### Testing Steps

1. **Display Test**:
   - Navigate to `/requests` or `/organizations/[slug]/requests`
   - Check the hero section - you should see a charity info box showing:
     - "💝 Supporting [Charity Name]"
     - Percentage or "All proceeds go to charity" if 100%
     - "Learn more →" link if URL is provided

2. **Payment Processing Test**:
   - Submit a song request with a $10 tip
   - If percentage is 50%, $5 should be calculated for charity
   - Check Stripe checkout metadata - should include charity info
   - Verify the calculation: `charity_donation_amount = total_amount * (percentage / 100)`

3. **Edge Cases**:
   - Test with 0% donation (should not show charity info)
   - Test with 100% donation (should show "All proceeds go to charity")
   - Test with no charity URL (should not show "Learn more" link)

## Feature 2: Audio File Upload

### Setup
1. Ensure Supabase Storage bucket `crowd-requests` exists and is public
2. Verify file upload endpoint is accessible

### Testing Steps

1. **UI Test**:
   - Navigate to `/crowd-request/[code]` or `/requests`
   - Select "Song Request"
   - Scroll to "Upload Your Own Audio File" section
   - Verify:
     - File input is visible
     - Shows "$100 per file" message
     - Upload button is styled correctly

2. **Upload Test**:
   - Select an audio file (MP3, WAV, etc.)
   - Verify upload progress indicator shows
   - After upload, verify:
     - File name is displayed
     - "Remove" button appears
     - Two checkboxes appear:
       - "I confirm that I own the rights to this music"
       - "I am the artist (this is for promotion, not just a play)"
     - "$100.00 for audio upload" message is shown

3. **Validation Test**:
   - Try to submit without checking "I own the rights" checkbox
   - Should show error: "Please confirm that you own the rights to the music"
   - Check the checkbox and try again - should work

4. **Pricing Test**:
   - Upload an audio file
   - Check payment amount - should include $100.00
   - Example: Base $5.00 + Audio $100.00 = $105.00 total

5. **Database Test**:
   - After successful submission, check `crowd_requests` table:
     - `audio_file_url` should contain the Supabase Storage URL
     - `is_custom_audio` should be `true`
     - `audio_upload_fee` should be `10000` (cents)
     - `artist_rights_confirmed` should be `true`
     - `is_artist` should match checkbox state

6. **Stripe Checkout Test**:
   - Complete payment with audio upload
   - Check Stripe dashboard - should see line item for "Custom Audio Upload" ($100.00)

## Feature 3: Apple Music Links

### Testing Steps

1. **Link Extraction Test**:
   - Navigate to song request form
   - Paste an Apple Music link: `https://music.apple.com/us/album/song-name/123456789?i=987654321`
   - Or iTunes link: `https://itunes.apple.com/us/album/song-name/id123456789`
   - Verify:
     - Song title is automatically extracted
     - Artist name is automatically extracted
     - Link field clears after extraction

2. **Form Acceptance Test**:
   - Try pasting Apple Music link in:
     - Song Title field
     - Artist Name field
     - Music Link field
   - All should trigger extraction

3. **Placeholder Text Test**:
   - Check placeholder text in link field
   - Should say: "Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"

4. **API Test**:
   - Test the extraction API directly:
   ```bash
   curl -X POST http://localhost:3000/api/crowd-request/extract-song-info \
     -H "Content-Type: application/json" \
     -d '{"url": "https://music.apple.com/us/album/test/123456789?i=987654321"}'
   ```
   - Should return `{ title: "...", artist: "...", source: "apple_music" }`

5. **Error Handling Test**:
   - Try invalid Apple Music URL
   - Should gracefully fail and allow manual entry
   - Try timeout scenario (if network is slow)
   - Should show user-friendly error message

## Integration Tests

### Combined Features Test

1. **Full Flow with All Features**:
   - Enable charity donation (50%)
   - Upload audio file
   - Use Apple Music link for another song
   - Submit request
   - Verify:
     - Total includes: base amount + audio fee + charity calculation
     - All data saved correctly
     - Stripe checkout shows all line items
     - Charity info displayed in hero section

2. **Payment Calculation Test**:
   - Base: $5.00
   - Audio Upload: $100.00
   - Fast Track: $2.00
   - Total: $107.00
   - Charity (50%): $53.50
   - Verify calculations are correct

## Common Issues & Solutions

### Issue: Audio upload fails
- **Solution**: Check Supabase Storage bucket exists and has correct permissions
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Issue: Charity info not showing
- **Solution**: Check organization data is being passed to the component
- Verify `charity_donation_enabled` is `true` in database

### Issue: Apple Music extraction fails
- **Solution**: Check network connectivity
- Verify the URL format is correct
- Check API endpoint logs for errors

### Issue: Payment amount incorrect
- **Solution**: Verify `useCrowdRequestPayment` hook includes `audioFileUrl`
- Check that audio upload fee is added to total

## Database Verification Queries

```sql
-- Check charity donation settings
SELECT name, charity_donation_enabled, charity_donation_percentage, charity_name 
FROM organizations 
WHERE charity_donation_enabled = true;

-- Check audio uploads
SELECT id, song_title, is_custom_audio, audio_file_url, audio_upload_fee, artist_rights_confirmed, is_artist
FROM crowd_requests 
WHERE is_custom_audio = true
ORDER BY created_at DESC
LIMIT 10;

-- Check payment amounts with audio uploads
SELECT 
  id,
  amount_requested,
  audio_upload_fee,
  (amount_requested - audio_upload_fee) as base_amount,
  is_custom_audio
FROM crowd_requests
WHERE is_custom_audio = true;
```

## Next Steps After Testing

1. If all tests pass, features are ready for production
2. Consider adding admin UI for charity donation settings
3. Monitor audio upload storage usage
4. Set up alerts for failed uploads
5. Consider adding audio file validation (size limits, format checks)

