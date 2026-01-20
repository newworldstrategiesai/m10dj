# How to Clear Social Media Cache for OG Images

When you update Open Graph (OG) images or metadata, social media platforms cache the old data. Use these tools to force them to refresh.

## Facebook (Meta) Sharing Debugger
**URL:** https://developers.facebook.com/tools/debug/

1. Enter your TipJar URL: `https://www.tipjar.live/vitalinstigator/requests`
2. Click **"Debug"**
3. Review the current metadata shown
4. Click **"Scrape Again"** to force Facebook to fetch fresh data
5. Wait a few seconds for it to complete

**Note:** You may need to click "Scrape Again" multiple times if Facebook detects changes.

## Twitter/X Card Validator
**URL:** https://cards-dev.twitter.com/validator

1. Enter your TipJar URL: `https://www.tipjar.live/vitalinstigator/requests`
2. Click **"Preview card"**
3. Review the preview shown
4. If the image is still old, the cache will expire automatically (usually within 24-48 hours)
5. You can also try appending a query parameter: `?v=2`

## LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/

1. Enter your TipJar URL: `https://www.tipjar.live/vitalinstigator/requests`
2. Click **"Inspect"**
3. Review the metadata shown
4. LinkedIn will automatically show updated data on next fetch

## WhatsApp Cache Clearing
WhatsApp doesn't provide a public debugging tool, but you can:

1. **Add a query parameter** to the URL when sharing:
   - `https://www.tipjar.live/vitalinstigator/requests?v=2`
   - Or use a timestamp: `?t=1234567890`

2. **Wait 24-48 hours** - WhatsApp cache typically expires automatically

## Slack Link Unfurling
**URL:** https://api.slack.com/reference/messaging/link-unfurling#testing

1. Share the URL in a Slack test channel
2. Delete the message and share again
3. Cache may persist, but usually updates within a few hours

## General Tips

### Use Cache-Busting Query Parameters
When sharing links, append a unique parameter to bypass cache:
- `?v=2`
- `?t=1234567890`
- `?refresh=1`

### Verify Your OG Tags
Use these tools to verify your OG tags are correct:

- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Open Graph Checker:** https://www.opengraph.xyz/
- **Meta Tags Checker:** https://metatags.io/

### Testing Checklist
✅ Test URL in Facebook Debugger  
✅ Test URL in Twitter Card Validator  
✅ Test URL in LinkedIn Post Inspector  
✅ Verify OG image URL is accessible (try opening in browser)  
✅ Verify OG image dimensions are correct (1200x630 recommended)  
✅ Verify OG image file size is reasonable (< 5MB)  
✅ Check that OG image URL uses HTTPS  

## Common Issues

### Image Still Shows Old Version
- Wait a few minutes and scrape again
- Clear your browser cache
- Try the URL in an incognito/private window
- Verify the OG image URL in your HTML source is correct

### Image Not Showing At All
- Verify the OG image URL is publicly accessible
- Check that the image URL uses HTTPS (not HTTP)
- Ensure image dimensions meet platform requirements
- Check file size (should be under 5MB, ideally under 1MB)

### Wrong Image Showing
- Verify your `og:image` meta tag is correct in the HTML source
- Check if there are multiple `og:image` tags (use only one)
- Ensure you're testing the correct URL

## TipJar-Specific URLs to Test

After updating OG images, test these URLs:

- Public Requests: `https://www.tipjar.live/vitalinstigator/requests`
- Admin Dashboard: `https://www.tipjar.live/tipjar/dashboard`
- Admin Crowd Requests: `https://www.tipjar.live/admin/crowd-requests`

Each should show the appropriate TipJar-branded OG image.
