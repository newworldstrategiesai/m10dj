# Image Optimization Guide - Fast Loading Images

## 🚀 Current Setup

Your Next.js app already has:
- ✅ WebP/AVIF format support
- ✅ Image caching (1 hour TTL)
- ✅ Preloading for critical images
- ✅ Responsive device sizes configured

## 📋 Best Practices for Fast Image Loading

### 1. **Always Use Next.js Image Component**

**DO:**
```jsx
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={true} // For above-the-fold images
  quality={85} // Good balance (75-85)
  placeholder="blur" // For better perceived performance
/>
```

**DON'T:**
```jsx
// ❌ Avoid regular img tags for production images
<img src="/path/to/image.jpg" alt="Description" />
```

### 2. **Preload Critical Images**

For images that appear above the fold (hero images, logos):

```jsx
// In Head component or _document.js
<link rel="preload" as="image" href="/critical-image.jpg" />
```

Or in Next.js:
```jsx
<Image
  src="/critical-image.jpg"
  priority={true} // Automatically preloads
  ...
/>
```

### 3. **Use Appropriate Image Formats**

Priority order:
1. **AVIF** - Best compression (30-50% smaller than WebP)
2. **WebP** - Good compression, wide support
3. **JPEG/PNG** - Fallback for older browsers

Your `next.config.js` already handles this automatically!

### 4. **Optimize Image Sizes**

**Before Upload:**
- Compress images to 80-85% quality
- Resize to maximum needed dimensions
- Use tools like:
  - [Squoosh](https://squoosh.app/) - Browser-based
  - [ImageOptim](https://imageoptim.com/) - Mac app
  - [TinyPNG](https://tinypng.com/) - Online tool

**Responsive Sizes:**
```jsx
<Image
  src="/image.jpg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  ...
/>
```

### 5. **Lazy Load Below-the-Fold Images**

```jsx
<Image
  src="/image.jpg"
  loading="lazy" // Default for non-priority images
  ...
/>
```

### 6. **Use Blur Placeholders**

For better perceived performance:

```jsx
<Image
  src="/image.jpg"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // Low-quality base64
  ...
/>
```

Generate blur data URL:
```bash
# Using sharp (Node.js)
const sharp = require('sharp');
const buffer = await sharp('image.jpg')
  .resize(10)
  .jpeg({ quality: 20 })
  .toBuffer();
const base64 = buffer.toString('base64');
```

### 7. **CDN for Images**

Consider using:
- **Vercel Image Optimization** (built-in with Next.js)
- **Cloudinary** - Advanced image transformations
- **ImageKit** - Fast CDN with optimization
- **Cloudflare Images** - Automatic optimization

### 8. **Caching Strategy**

Your current setup:
```js
minimumCacheTTL: 3600 // 1 hour
```

For static images, consider longer cache:
```js
minimumCacheTTL: 31536000 // 1 year for static assets
```

### 9. **Service Worker Caching**

Cache images in service worker for offline/instant loading:
```javascript
// In service worker
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((response) => {
          return caches.open('images').then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
```

### 10. **Image Dimensions**

Always specify width and height to prevent layout shift:

```jsx
<Image
  src="/image.jpg"
  width={800}
  height={600}
  // or use fill with aspect ratio
  fill
  style={{ objectFit: 'cover' }}
/>
```

## 🎯 Quick Wins

### Immediate Actions:

1. **Audit all images:**
   ```bash
   # Find all img tags that should use Next.js Image
   grep -r '<img' pages/ components/
   ```

2. **Compress existing images:**
   - Use Squoosh.app to compress all images
   - Target 80-85% quality
   - Convert to WebP/AVIF

3. **Add priority to hero images:**
   ```jsx
   <Image priority={true} ... />
   ```

4. **Preload critical images in Head:**
   ```jsx
   <Head>
     <link rel="preload" as="image" href="/hero.jpg" />
   </Head>
   ```

## 📊 Monitoring

Track image performance:
- **LCP (Largest Contentful Paint)** - Should be < 2.5s
- **CLS (Cumulative Layout Shift)** - Should be < 0.1
- Use Chrome DevTools Network tab
- Use Lighthouse for audits

## 🔧 Advanced: Image Optimization API

For dynamic image optimization, consider:

```javascript
// pages/api/image-optimize.js
export default async function handler(req, res) {
  const { url, width, quality } = req.query;
  
  // Use sharp or similar to optimize
  const optimized = await optimizeImage(url, width, quality);
  
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(optimized);
}
```

## ✅ Checklist

- [ ] All images use Next.js Image component
- [ ] Critical images have `priority={true}`
- [ ] All images have proper width/height
- [ ] Images are compressed (80-85% quality)
- [ ] WebP/AVIF formats enabled
- [ ] Lazy loading for below-fold images
- [ ] Blur placeholders for hero images
- [ ] Preload critical images
- [ ] Proper caching headers
- [ ] CDN configured (if applicable)

