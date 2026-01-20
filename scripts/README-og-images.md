# 🎨 OG Image Generation Scripts

Generate professional PNG images for Karaoke Open Graph sharing from HTML/SVG templates.

## 📋 Prerequisites

Choose one of these methods:

### Method 1: Puppeteer (Recommended)
```bash
npm install puppeteer
```
- ✅ Most reliable
- ✅ Handles complex CSS/SVG
- ✅ Browser-accurate rendering

### Method 2: Sharp + JSDOM (Faster)
```bash
npm install sharp jsdom
```
- ✅ No browser required
- ✅ Faster execution
- ✅ Smaller dependencies

## 🚀 Quick Start

### Generate All Images
```bash
# Using Puppeteer (default)
npm run generate-og-images

# Using Sharp/SVG
npm run generate-og-images -- --svg
```

### Direct Script Execution
```bash
# Puppeteer method
node scripts/generate-og-images.js

# SVG method
node scripts/generate-og-images.js --svg
```

## 📁 Output

Images are saved to: `public/assets/`

- `tipjar-karaoke-signup-og.png` - Signup page sharing
- `tipjar-karaoke-status-og.png` - Status page sharing
- `tipjar-karaoke-display-og.png` - Display page sharing

## 🎯 What Gets Generated

### 1. Signup OG Image (1200×630)
- **Theme**: Exciting call-to-action
- **Content**: "JOIN KARAOKE - SIGN UP NOW!"
- **Visual**: Microphone, stage lighting, feature points

### 2. Status OG Image (1200×630)
- **Theme**: Progress tracking
- **Content**: "YOUR KARAOKE QUEUE STATUS"
- **Visual**: Queue position visualization

### 3. Display OG Image (1200×630)
- **Theme**: Live event promotion
- **Content**: "LIVE KARAOKE QUEUE DISPLAY"
- **Visual**: TV/projector style queue display

## 🛠️ Customization

### Modify Templates
Edit `karaoke-og-image-templates.html` to customize:
- Colors and gradients
- Text content
- Iconography and layout
- Branding elements

### Change Output Settings
Edit the script for:
- Different dimensions
- Quality settings
- Output formats
- File naming

## 📊 Quality Specifications

- **Format**: PNG (lossless)
- **Dimensions**: 1200×630 pixels (1.91:1 ratio)
- **Color Depth**: 32-bit RGBA
- **File Size**: < 200KB each
- **Resolution**: 72 DPI (web optimized)

## 🧪 Testing

### Validate Images
```bash
# Check dimensions
file public/assets/tipjar-karaoke-signup-og.png

# Test Open Graph
curl -s "https://opengraph.xyz/url?url=https://tipjar.live/organizations/example/sing"
```

### Social Platform Testing
- **Facebook**: https://developers.facebook.com/tools/debug/
- **Twitter**: https://cards-dev.twitter.com/validator
- **LinkedIn**: Share test post

## 🔧 Troubleshooting

### Puppeteer Issues
```bash
# Install dependencies
npm install puppeteer

# For Linux, you might need:
sudo apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

### Sharp Issues
```bash
# Install dependencies
npm install sharp jsdom

# For Linux, you might need:
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

### Permission Issues
```bash
# Ensure output directory exists
mkdir -p public/assets

# Check permissions
chmod +x scripts/generate-og-images.js
```

## 📈 Performance

- **Puppeteer**: ~5-10 seconds per image
- **Sharp**: ~1-2 seconds per image
- **Memory Usage**: ~100MB peak
- **Disk Space**: ~500KB total

## 🤖 Automation

### CI/CD Integration
Add to your build pipeline:
```yaml
# GitHub Actions example
- name: Generate OG Images
  run: npm run generate-og-images
```

### Git Hooks
Auto-generate on template changes:
```bash
# .husky/pre-commit
npx husky add .husky/pre-commit "npm run generate-og-images"
```

## 🎯 Best Practices

- ✅ **Version Control**: Commit generated images
- ✅ **CDN**: Serve from CDN for performance
- ✅ **Fallbacks**: Have fallback images ready
- ✅ **Monitoring**: Track social sharing metrics
- ✅ **Updates**: Regenerate when branding changes

## 📞 Support

If images don't generate correctly:
1. Check console output for errors
2. Verify dependencies are installed
3. Try the alternative method (`--svg` flag)
4. Check file permissions
5. Review browser console in non-headless mode

---

**Generated images are production-ready for all social platforms!** 🚀🎨📸