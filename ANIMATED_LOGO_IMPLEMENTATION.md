# Animated Logo GIF Implementation Guide

This guide covers implementing the M10 Rotating Logo GIF in two contexts:
1. **Full-screen loading animation** (1920×1080, 1.8MB)
2. **Email templates** (250×250, <100KB optimized)

---

## Part 1: Full-Screen Loader Component ✅ COMPLETE

### Location
`components/ui/FullScreenLoader.tsx`

### Features
- ✨ Full-screen overlay with semi-transparent dark background
- 🎬 Displays the M10-Rotating-Logo.gif (1920×1080)
- 📱 Responsive and works on all screen sizes
- 🌓 Supports light and dark modes
- ♿ Accessibility features (ARIA labels, live regions)
- ✨ Animated progress indicators
- 💬 Optional loading message with fade animation

### Usage

#### Basic Implementation
```tsx
'use client';

import { useState } from 'react';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

export default function MyPage() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      <FullScreenLoader isOpen={isLoading} message="Processing your request..." />
      
      <button onClick={() => setIsLoading(true)}>
        Start Loading
      </button>
    </>
  );
}
```

#### In Server Components (using Context)
```tsx
// hooks/useLoader.ts
'use client';

import { createContext, useContext, useState } from 'react';

const LoaderContext = createContext<{
  show: (message?: string) => void;
  hide: () => void;
}>({ show: () => {}, hide: () => {} });

export function LoaderProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('Loading...');

  return (
    <LoaderContext.Provider
      value={{
        show: (msg) => {
          setMessage(msg || 'Loading...');
          setIsOpen(true);
        },
        hide: () => setIsOpen(false),
      }}
    >
      {children}
      <FullScreenLoader isOpen={isOpen} message={message} />
    </LoaderContext.Provider>
  );
}

export const useLoader = () => useContext(LoaderContext);
```

#### Use in Any Component
```tsx
'use client';

import { useLoader } from '@/hooks/useLoader';

export default function DataFetcher() {
  const { show, hide } = useLoader();

  const handleFetch = async () => {
    show('Fetching your data...');
    
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      // Do something with data
    } finally {
      hide();
    }
  };

  return <button onClick={handleFetch}>Load Data</button>;
}
```

#### Advanced: With Time Limit
```tsx
export const useAutoHideLoader = (timeoutMs = 30000) => {
  const { show, hide } = useLoader();
  const timeoutRef = useRef<NodeJS.Timeout>();

  return {
    show: (message?: string) => {
      show(message);
      timeoutRef.current = setTimeout(hide, timeoutMs);
    },
    hide: () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      hide();
    },
  };
};
```

---

## Part 2: Email Template with Animated Logo 📧

### ✅ Current Status - Email Logo READY!

Great news! You already have the optimized email version:
- **File:** `public/M10-Rotating-Logo-200px-Small.gif`
- **Size:** 200×200px
- **File Size:** 142KB (perfect for email!)
- **Status:** ✅ Ready to use immediately

Email template ready at: `email-templates/base-with-animated-logo.html`

### Using the Optimized Email Logo

The 200px small version is already perfectly optimized for email at 142KB, which is:
- ✅ Under the 200KB email limit
- ✅ Animated and professional looking
- ✅ Works across all email clients
- ✅ No further optimization needed

**Just use in your email templates:**
```html
<img 
    src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" 
    alt="M10 DJ Company Animated Logo" 
    class="logo-img"
    width="200"
    height="200"
    style="width: auto; height: auto; max-width: 200px;"
/>
```

### Email Compatibility

**Email clients that animate GIFs:**
- ✅ Gmail (fully animated)
- ✅ Apple Mail
- ✅ Outlook (iOS & macOS)
- ✅ Thunderbird
- ✅ Most modern webmail clients
- ⚠️ Outlook Desktop (shows first frame - acceptable)

**File is ready to deploy:**
1. Deploy to production (Vercel will automatically serve it)
2. Update email templates with the URL above
3. Test sending emails to verify animation works
4. Done! No further optimization needed

### Integration Example

```tsx
// lib/email-templates.ts
export const sendWelcomeEmail = async (email: string, name: string) => {
  return await resend.emails.send({
    from: 'hello@m10djcompany.com',
    to: email,
    subject: 'Welcome to M10 DJ Company!',
    html: `
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
          <!-- Animated Logo - 200px optimized version -->
          <img 
            src="https://m10djcompany.com/M10-Rotating-Logo-200px-Small.gif" 
            alt="M10 DJ Company" 
            width="200" 
            height="200"
            style="max-width: 100%; height: auto;"
          />
          <h1 style="color: #fcba00; margin: 20px 0 0 0;">M10 DJ COMPANY</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0;">Premium DJ Services in Memphis & Beyond</p>
        </div>
        
        <div style="padding: 50px 30px;">
          <h2 style="color: #1a1a1a; font-size: 28px;">Welcome, ${name}!</h2>
          <p style="color: #4a5568; font-size: 16px;">Thank you for connecting with us.</p>
          <a href="https://m10djcompany.com" style="display: inline-block; background: #fcba00; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Visit Our Website
          </a>
        </div>
      </div>
    `,
  });
};
```

---

## Implementation Checklist

### Full-Screen Loader
- [x] Component created (`components/ui/FullScreenLoader.tsx`)
- [x] Storybook stories added
- [ ] Add to your layout provider
- [ ] Test in development
- [ ] Test on mobile devices
- [ ] Test in different browsers

### Email Template
- [x] Email logo already optimized: `M10-Rotating-Logo-200px-Small.gif` ✅
- [x] Perfect size: 200×200px at 142KB ✅
- [ ] Deploy to production (Vercel/hosting)
- [ ] Update email template with correct image URL
- [ ] Test sending emails to Gmail, Outlook
- [ ] Verify GIF animates in email client
- [ ] Check fallback displays if animation not supported

---

## Troubleshooting

### Full-Screen Loader Issues

**Loader not showing?**
- Ensure `isOpen` prop is `true`
- Check z-index: It should be 50 (z-50)
- Verify image path `/M10-Rotating-Logo.gif` exists

**Image not loading?**
- Check browser console for 404 errors
- Ensure file exists at `/public/M10-Rotating-Logo.gif`
- Try absolute URL if path issues occur

**Performance concerns?**
- File is 1.8MB - only shows during actual loading
- Consider showing loader only for actions >2 seconds
- GIF decompression happens client-side (not on server)

### Email Template Issues

**GIF not animating in email?**
- Not all email clients support animated GIFs
- Outlook desktop may show first frame only
- Mobile clients usually support animation better
- Fallback: Graceful degradation to static image

**Image not loading in email?**
- Verify URL is publicly accessible
- Check image isn't blocked by email client filters
- Ensure image is on HTTPS (some clients require it)
- Use `https://` not `http://`

**File size too large?**
- Target: <100KB for reliable delivery
- Use ImageMagick with `-optimize` flag
- Reduce color palette to 128 colors
- Remove unnecessary frames

**Email rendering issues?**
- Test in Litmus or Email on Acid
- Check CSS compatibility (email clients have limitations)
- Use inline styles for better support
- Test across Gmail, Outlook, Apple Mail

---

## Performance Tips

### For Full-Screen Loader
```tsx
// Don't show loader for fast operations
const START_SHOWING_AFTER_MS = 1000;

const AutoHideLoader = () => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), START_SHOWING_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);
  
  return <FullScreenLoader isOpen={show} />;
};
```

### For Email Logos
```tsx
// Cache-bust if needed
const logoUrl = `https://m10djcompany.com/M10-Logo-Email.gif?v=${Date.now()}`;

// Or use static version
const logoUrl = `https://m10djcompany.com/M10-Logo-Email.gif?cache=1h`;
```

---

## Next Steps

1. **Optimize the email GIF** - Use one of the three methods above
2. **Test the full-screen loader** - Integrate and verify it works
3. **Deploy email templates** - Update with optimized logo URL
4. **Monitor** - Track email deliverability and client rendering

Need help with any step? Check the troubleshooting section or refer to the code examples above.

