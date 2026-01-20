# OG Images Analysis & Recommendations

## Current OG Images Inventory

### TipJar OG Images ✅
- `tipjar-og-image.png` - Main TipJar branding (homepage, default)
- `tipjar-open-graph-new.png` - Updated TipJar branding
- `tipjar-dashboard-og.png` - Admin dashboard page
- `tipjar-crowd-requests-og.png` - Admin crowd requests page
- `tipjar-public-requests-og.png` - Public requests page

### DJ Dash OG Images ✅
- `djdash-og-image.png` - Main DJ Dash branding (homepage, default)

### M10 DJ Company OG Images ✅
- `contract-og-image.png` - Contract signing pages
- `payment-og-image.png` - Payment pages
- `service-selection-og-image.png` - Service selection pages

---

## High-Priority OG Images to Implement

### 1. **TipJar Marketing Pages** (High Share Potential)

#### a. Pricing Page (`/tipjar/pricing`)
- **Why**: Pricing pages are frequently shared when users compare options
- **Suggested**: `tipjar-pricing-og.png`
- **Content**: Show pricing tiers visually with TipJar branding
- **Message**: "Simple, Transparent Pricing - Start Free"

#### b. Features Page (`/tipjar/features`)
- **Why**: Feature showcases are commonly shared to highlight product capabilities
- **Suggested**: `tipjar-features-og.png`
- **Content**: Visual showcase of key features with TipJar branding
- **Message**: "Powerful Features for Modern DJs"

#### c. How It Works Page (`/tipjar/how-it-works`)
- **Why**: Educational/informational pages get shared when explaining the product
- **Suggested**: `tipjar-how-it-works-og.png`
- **Content**: Simple visual flow showing the TipJar process
- **Message**: "Request Songs & Send Tips in 3 Easy Steps"

#### d. Embed Page (`/tipjar/embed`)
- **Why**: Technical integration pages are shared by developers/technical users
- **Suggested**: `tipjar-embed-og.png`
- **Content**: Code/embed visual with TipJar branding
- **Message**: "Embed TipJar - Just One Line of Code"

### 2. **DJ Dash Marketing Pages** (High Share Potential)

#### a. Pricing Page (`/djdash/pricing`)
- **Why**: Pricing pages are frequently shared when users compare options
- **Suggested**: `djdash-pricing-og.png`
- **Content**: Show pricing tiers visually with DJ Dash branding
- **Message**: "Find DJs & Manage Your Business - Free Forever"

#### b. Features Page (`/djdash/features`)
- **Why**: Feature showcases are commonly shared to highlight product capabilities
- **Suggested**: `djdash-features-og.png`
- **Content**: Visual showcase of key features with DJ Dash branding
- **Message**: "Everything You Need to Find & Book DJs"

#### b. Business Page (`/djdash/business`)
- **Why**: Business-focused pages are shared by DJs looking for tools
- **Suggested**: `djdash-business-og.png`
- **Content**: DJ business management tools visual
- **Message**: "DJ Business Management Made Simple"

#### d. How It Works Page (`/djdash/how-it-works`)
- **Why**: Educational/informational pages get shared when explaining the product
- **Suggested**: `djdash-how-it-works-og.png`
- **Content**: Simple visual flow showing the DJ Dash booking process
- **Message**: "Find, Compare & Book Professional DJs"

### 3. **DJ Profile Pages** (High Share Potential)

#### a. DJ Dash DJ Profiles (`/djdash/dj/[slug]`)
- **Current**: Uses profile cover image or profile image as OG
- **Issue**: If no custom images, falls back to default logo
- **Suggested**: `djdash-dj-profile-og.png` (fallback template)
- **Recommendation**: 
  - Primary: Use DJ's cover_image_url or profile_image_url (already implemented)
  - Fallback: Use branded template with DJ name, location, rating
  - Dynamic generation: Consider server-side OG image generation for individual DJs

### 4. **TipJar Artist Pages** (High Share Potential)

#### a. TipJar Artist Public Pages (`/tipjar/[...slug]`)
- **Current**: Uses default TipJar OG image
- **Issue**: Individual artist pages should show artist-specific branding
- **Suggested**: Dynamic OG images with artist name/customization
- **Recommendation**:
  - Primary: Use artist's custom cover photo if available
  - Fallback: TipJar-branded template with artist name
  - Consider: Server-side OG image generation with artist branding

### 5. **Blog Posts** (Medium-High Share Potential)

#### a. Blog Post Pages (`/blog/[slug]`)
- **Current**: May use default OG images
- **Why**: Blog posts are frequently shared on social media
- **Recommendation**:
  - Generate OG images per blog post with featured image
  - Fallback to blog category-specific OG images
  - Consider: Auto-generate OG images with blog post title + featured image

### 6. **City Pages** (Medium Share Potential)

#### a. DJ Dash City Pages (`/djdash/cities/[city]`)
- **Current**: Has fallback to `djdash-og-image.png`
- **Enhancement**: City-specific OG images when available
- **Recommendation**: Keep current fallback, but prioritize custom city OG images when `cityPage.og_image_url` exists

#### b. DJ Dash Event Type Pages (`/djdash/find-dj/[city]/[event-type]`)
- **Current**: Uses default logo PNG
- **Suggested**: `djdash-event-type-og.png` (template for event types)
- **Examples**: 
  - `djdash-wedding-djs-og.png`
  - `djdash-corporate-djs-og.png`
  - `djdash-party-djs-og.png`

### 7. **Quote/Booking Pages** (High Share Potential)

#### a. Quote Pages (`/quote/[id]`)
- **Current**: Has `contract-og-image.png` for contract pages
- **Missing**: OG image for initial quote/booking pages
- **Suggested**: `quote-booking-og.png`
- **Content**: "Get Your Personalized Quote - Free & Fast"

### 8. **Success/Thank You Pages** (Medium Share Potential)

#### a. DJ Dash Thank You Page (`/djdash/thank-you`)
- **Why**: Users might share successful booking confirmations
- **Suggested**: `djdash-thank-you-og.png`
- **Content**: "Thank You - Your Booking is Confirmed!"

#### b. Payment Success Pages
- **Current**: May have payment OG images
- **Enhancement**: Brand-specific success pages
  - `tipjar-payment-success-og.png`
  - `djdash-payment-success-og.png`

---

## Medium-Priority OG Images

### 9. **Admin Pages** (Low-Medium Share Potential)
- Most admin pages shouldn't be shared publicly
- **Exception**: Public-facing analytics or success stories
- **Recommendation**: Skip unless specific use case

### 10. **Venue Pages** (Medium Share Potential)

#### a. TipJar Venue Pages (`/tipjar/venue/[slug]`)
- **Current**: Uses default TipJar OG
- **Suggested**: Venue-specific OG with venue branding if available
- **Fallback**: TipJar-branded venue template

### 11. **M10 DJ Company City Pages** (Low-Medium Share Potential)
- Various city-specific landing pages
- **Recommendation**: Generic M10 DJ OG image sufficient unless specific campaign

---

## Implementation Priority Matrix

### 🔴 **CRITICAL** (Implement First)
1. TipJar Pricing Page OG Image
2. DJ Dash Pricing Page OG Image
3. TipJar Features Page OG Image
4. DJ Dash Features Page OG Image
5. TipJar How It Works OG Image
6. DJ Dash How It Works OG Image

### 🟠 **HIGH** (Implement Second)
7. DJ Dash Business Page OG Image
8. TipJar Embed Page OG Image
9. Quote/Booking Page OG Image
10. DJ Profile Fallback OG Template (dynamic generation)
11. TipJar Artist Page Fallback OG Template

### 🟡 **MEDIUM** (Implement Third)
12. DJ Dash Event Type OG Images (wedding, corporate, party)
13. TipJar Payment Success OG Image
14. DJ Dash Thank You OG Image
15. Blog Post OG Image Templates
16. TipJar Venue Page OG Template

### 🟢 **LOW** (Implement Last)
17. M10 DJ City-Specific OG Images (if needed for campaigns)
18. Other marketing pages as needed

---

## Technical Implementation Notes

### Dynamic OG Image Generation
For pages like DJ profiles and artist pages, consider:
- **Server-side generation**: Use libraries like `@vercel/og` or Puppeteer
- **Template-based**: Create branded templates that can be populated with dynamic data
- **CDN caching**: Cache generated OG images for performance

### Current OG Image Generation Setup
- HTML template: `public/assets/generate-og-images.html`
- Puppeteer script: `scripts/generate-og-image.js`
- Pattern: Use existing tools to generate new OG images

### Best Practices
1. **Consistent Branding**: All OG images should include brand logo/colors
2. **Readable Text**: Ensure text is large enough and readable at 1200x630
3. **Clear Value Proposition**: Include key message or tagline
4. **Visual Hierarchy**: Important elements should stand out
5. **Social Platform Optimization**: Test on Facebook, Twitter, LinkedIn previews

---

## Recommended Next Steps

1. **Generate Critical OG Images** using existing template/script
   - TipJar Pricing, Features, How It Works
   - DJ Dash Pricing, Features, How It Works, Business

2. **Update Page Metadata** to reference new OG images
   - Update `generateMetadata()` functions in App Router pages
   - Update `<Head>` components in Pages Router pages

3. **Implement Dynamic OG Generation** (if needed)
   - For DJ profiles with fallback templates
   - For artist pages with dynamic branding

4. **Test Social Sharing**
   - Use Facebook Debugger for all new OG images
   - Use Twitter Card Validator
   - Test on LinkedIn Post Inspector

5. **Document & Maintain**
   - Keep this document updated with new OG images
   - Maintain OG image generation scripts
   - Document any dynamic generation patterns

---

## OG Image Naming Convention

### Pattern: `{brand}-{page-type}-og.png`

Examples:
- `tipjar-pricing-og.png`
- `djdash-features-og.png`
- `tipjar-how-it-works-og.png`
- `djdash-dj-profile-fallback-og.png`

### Dimensions
- **Standard**: 1200x630px (Facebook, LinkedIn, Twitter)
- **Minimum**: 600x315px
- **Maximum**: 8MB file size

### File Location
- All OG images: `/public/assets/`
- Reference in code: `/assets/{filename}.png` or full URL

---

## Summary

**Total Recommended OG Images**: ~20 new images

**Breakdown**:
- Critical: 6 images
- High: 5 images  
- Medium: 6 images
- Low: 3 images (optional)

**Estimated Impact**: 
- Improved social sharing engagement
- Better brand recognition on social platforms
- Higher click-through rates from social shares
- Professional appearance across all shared links
