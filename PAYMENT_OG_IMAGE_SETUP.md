# Payment OG Image Setup Guide

## Overview

This guide explains how to generate the custom Open Graph image for payment pages. The payment OG image is designed to look great when customers receive payment links via SMS, iMessage, or other messaging platforms.

## Design Specifications

- **Dimensions**: 1200x630px (standard Open Graph size)
- **Format**: PNG
- **Theme**: Gold/yellow gradient matching M10 DJ Company branding (#fcba00)
- **Location**: `public/assets/payment-og-image.png`

## Design Elements

The payment OG image features:
- **Background**: Warm gold gradient (from #fef3c7 to #f59e0b)
- **Icon**: Credit card emoji (💳) - 120px
- **Title**: "Secure Payment" - Large, bold (84px)
- **Subtitle**: "Complete your invoice payment quickly and securely" (36px)
- **Features**: 
  - ✓ Stripe Secured
  - ✓ PCI Compliant  
  - ✓ SSL Encrypted
- **Animated elements**: Subtle pulsing radial gradients

## How to Generate

### Option 1: Using the HTML Generator (Recommended)

1. Open `public/assets/generate-og-images.html` in your browser
2. You'll see the payment OG image displayed
3. Click the "Download Payment OG Image" button in the top-right corner
4. The image will be automatically generated and downloaded as `payment-og-image.png`
5. Move the downloaded file to `public/assets/payment-og-image.png`

**Note**: The HTML generator uses html2canvas, so make sure you have an internet connection when generating.

### Option 2: Manual Screenshot

1. Open `public/assets/generate-og-images.html` in your browser
2. Wait for the page to fully load
3. Take a screenshot of the payment OG image section
4. Crop to exactly 1200x630px
5. Save as `public/assets/payment-og-image.png`

### Option 3: Using Design Software

If you prefer using design software like Canva, Figma, or Photoshop:

1. Create a new canvas: 1200x630px
2. Apply background: Linear gradient from #fef3c7 to #f59e0b (135deg)
3. Add elements matching the design in `generate-og-images.html`
4. Export as PNG
5. Save to `public/assets/payment-og-image.png`

## Testing

After generating the image, test it:

1. **Open Graph Validator**: https://www.opengraph.xyz/
   - Enter a payment URL: `https://www.m10djcompany.com/pay/[token]`
   - Verify the image displays correctly

2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Test Twitter card preview

3. **iMessage Test**:
   - Send a payment link to yourself via iMessage
   - Verify the preview looks good on iPhone

4. **Browser Test**:
   - Open a payment page
   - Use browser dev tools to check `<meta property="og:image">` tag
   - Verify the image URL is correct

## Fallback Behavior

If `payment-og-image.png` doesn't exist, the payment page will fall back to:
- `/logo-static.jpg` (the default M10 DJ Company logo)

The payment page code automatically handles this fallback, so the page will still work even without the custom image.

## Current Implementation

The payment page (`pages/pay/[token].tsx`) includes:
- ✅ Comprehensive Open Graph meta tags
- ✅ Twitter Card meta tags
- ✅ Dynamic descriptions with invoice details
- ✅ Proper image dimensions (1200x630)
- ✅ Fallback to default logo

## Updating the Image

To update the payment OG image:
1. Edit `public/assets/generate-og-images.html` if needed
2. Regenerate the image using one of the methods above
3. Replace `public/assets/payment-og-image.png`
4. Clear any CDN/cache if you're using one
5. Test the preview on the platforms above

## Notes

- The image should be optimized for size (aim for < 200KB)
- Use PNG format for best quality
- Ensure text is readable on mobile devices
- The gold theme matches M10 DJ Company's brand color (#fcba00)
