# 🎬 Animated Logo GIF - Quick Reference

## TL;DR Setup

### 1️⃣ Full-Screen Loader (5 mins)
```tsx
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// In your component
<FullScreenLoader isOpen={loading} message="Loading..." />
```

### 2️⃣ Email Logo (Already Optimized! ✅)
✨ **Already done!** Use: `M10-Rotating-Logo-200px-Small.gif`
- Size: 200×200px 
- File: 142KB (perfect for email!)
- Use in emails: `<img src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" width="200" height="200" />`

---

## File Locations

```
components/ui/
├── FullScreenLoader.tsx ✨ (Full-screen loader component)
└── FullScreenLoader.stories.tsx (Storybook stories)

email-templates/
└── base-with-animated-logo.html (Email template ready-to-use)

public/
├── M10-Rotating-Logo.gif (1920x1080, 1.7MB - for full-screen)
└── M10-Rotating-Logo-200px-Small.gif ✅ (200×200, 142KB - perfect for email!)

scripts/
└── optimize-logo-gif.js (Optimization reference)

docs/
└── ANIMATED_LOGO_IMPLEMENTATION.md (Full guide)
```

---

## Quick Commands

```bash
# Show optimization options
npm run optimize:logo-gif

# Check email logo file size
ls -lh public/M10-Logo-Email.gif

# Test full-screen loader
# Just import and use in a component
```

---

## Email Template Sizes

| Use Case | Dimension | File Size | Where | Status |
|----------|-----------|-----------|-------|--------|
| Full Screen | 1920×1080 | 1.7MB | Loading states | ✅ Ready |
| Email Header | 200×200 | 142KB | Email templates | ✅ Done! |

---

## Implementation Examples

### Full-Screen Loader Context (Recommended)
```tsx
// hooks/useLoader.ts
export function LoaderProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('Loading...');

  return (
    <LoaderContext.Provider value={{ show: (msg) => { /* ... */ }, hide: () => { /* ... */ } }}>
      {children}
      <FullScreenLoader isOpen={isOpen} message={message} />
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
```

### Use in Any Component
```tsx
'use client';
import { useLoader } from '@/hooks/useLoader';

export function DataFetcher() {
  const { show, hide } = useLoader();

  const handleLoad = async () => {
    show('Fetching data...');
    try {
      const data = await fetch('/api/data');
    } finally {
      hide();
    }
  };
}
```

### In Email Templates
```html
<!-- Use the optimized 200px version -->
<img 
  src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" 
  alt="M10 DJ Company" 
  width="200" 
  height="200"
  style="max-width: 100%; height: auto;"
/>
```

---

## Email Logo - Already Optimized! ✅

You already have the perfect email version:
- **File:** `M10-Rotating-Logo-200px-Small.gif`
- **Size:** 200×200px
- **File Size:** 142KB (perfect for email - under 200KB limit!)
- **Status:** ✅ Ready to use

Just use this filename in your email templates!

---

## Verification Checklist

### Full-Screen Loader
- [ ] Component created ✅
- [ ] Imported in your page/layout
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Works in light mode
- [ ] Works in dark mode

### Email Logo
- [x] Original GIF identified: `public/M10-Rotating-Logo.gif` ✅
- [x] Optimized version ready: `M10-Rotating-Logo-200px-Small.gif` ✅
- [x] Perfect size: 200×200px at 142KB ✅
- [ ] Deploy to production
- [ ] Email template updated with URL
- [ ] Tested in Gmail
- [ ] Tested in Outlook
- [ ] Tested in mobile email

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Loader not showing | Check `isOpen` prop is `true` |
| Image 404 in loader | Verify `/M10-Rotating-Logo.gif` exists in public |
| Email gif won't animate | Not all clients support - fallback to static OK |
| Email gif won't load | Check URL is HTTPS and public |
| File size too large | Use ImageMagick `-optimize` flag |
| Performance slow | Don't show loader for <2sec operations |

---

## Next Steps

1. **Now:** Review the full guide in `ANIMATED_LOGO_IMPLEMENTATION.md`
2. **Step 1:** Optimize email logo (use ezgif.com - fastest)
3. **Step 2:** Test full-screen loader in your app
4. **Step 3:** Integrate email template
5. **Step 4:** Deploy and verify both work

---

## File Size Summary

```
Original Full-Screen:   1920×1080 = 1.7MB  ✅ Perfect for loading
Email Optimized:        200×200   = 142KB  ✅ Already done!
```

---

Need more details? See: `ANIMATED_LOGO_IMPLEMENTATION.md`

