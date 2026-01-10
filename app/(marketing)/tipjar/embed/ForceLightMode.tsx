'use client';

import { useEffect } from 'react';

export default function ForceLightMode() {
  useEffect(() => {
    // Force light mode for embed page (marketing page should always use light mode)
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    
    // Monitor for theme changes and re-apply light mode
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDark = root.classList.contains('dark');
          if (hasDark) {
            root.classList.remove('dark');
            root.classList.add('light');
            root.style.colorScheme = 'light';
          }
        }
      });
    });
    
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}

