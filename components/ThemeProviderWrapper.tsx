'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('dark'); // Default to dark for everyone
  const [forcedTheme, setForcedTheme] = useState<'light' | 'dark' | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);
    
    // Check if we're on the requests page - if so, don't apply theme (requests page handles its own dark mode)
    const isRequestsPage = typeof window !== 'undefined' && (
      window.location.pathname === '/requests' || 
      window.location.pathname.startsWith('/organizations/') && window.location.pathname.endsWith('/requests')
    );
    
    if (isRequestsPage) {
      // Force dark mode on requests pages to avoid mixed theme classes (e.g. "light dark")
      const root = document.documentElement;
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      return;
    }
    
    const supabase = createClient();
    
    // Load theme preference from admin settings
    async function loadThemePreference() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Handle AbortError gracefully (component unmounted or request cancelled)
        if (sessionError && (sessionError.name === 'AbortError' || sessionError.message?.includes('aborted'))) {
          return;
        }
        
        if (!isMountedRef.current) return;
        
        if (!session) {
          // No session, default to dark mode but allow users to toggle
          setDefaultTheme('dark');
          // Don't force the theme - allow users to toggle via ThemeToggle
          setForcedTheme(undefined);
          return;
        }
        
        // User is logged in, allow theme customization
        setForcedTheme(undefined);

        const response = await fetch('/api/admin-settings?settingKey=app_theme', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // The API returns { settings: { app_theme: '...' } } for GET
          const theme = data.settings?.app_theme;
          if (theme && (theme === 'light' || theme === 'dark' || theme === 'system')) {
            setDefaultTheme(theme);
            
            // Apply theme immediately (only if not on requests page)
            if (!isRequestsPage) {
              const root = document.documentElement;
              if (theme === 'dark') {
                root.classList.add('dark');
                root.classList.remove('light');
                root.style.colorScheme = 'dark';
              } else if (theme === 'light') {
                root.classList.remove('dark');
                root.classList.add('light');
                root.style.colorScheme = 'light';
              } else {
                // System theme
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  root.classList.add('dark');
                  root.classList.remove('light');
                  root.style.colorScheme = 'dark';
                } else {
                  root.classList.remove('dark');
                  root.classList.add('light');
                  root.style.colorScheme = 'light';
                }
              }
            }
          }
        }
      } catch (error: any) {
        // Handle AbortError gracefully (component unmounted or request cancelled)
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          return;
        }
        if (isMountedRef.current) {
          console.error('Error loading theme preference:', error);
          // Fall back to dark mode but allow users to toggle
          setDefaultTheme('dark');
          setForcedTheme(undefined);
        }
      }
    }

    loadThemePreference();
    
    // Listen for auth state changes to update theme when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!isMountedRef.current) return;
      
      if (!session) {
        // User logged out, default to dark mode but allow toggling
        setDefaultTheme('dark');
        setForcedTheme(undefined);
      } else {
        // User logged in, allow theme customization
        setForcedTheme(undefined);
        // Reload theme preference
        try {
          const response = await fetch('/api/admin-settings?settingKey=app_theme', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (response.ok && isMountedRef.current) {
            const data = await response.json();
            const theme = data.settings?.app_theme;
            if (theme && (theme === 'light' || theme === 'dark' || theme === 'system')) {
              setDefaultTheme(theme);
            }
          }
        } catch (error: any) {
          // Handle AbortError gracefully
          if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
            return;
          }
          if (isMountedRef.current) {
            console.error('Error loading theme preference after login:', error);
          }
        }
      }
    });
    
    return () => {
      isMountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  const isRequestsPage = typeof window !== 'undefined' && (
    window.location.pathname === '/requests' ||
    (window.location.pathname.startsWith('/organizations/') && window.location.pathname.endsWith('/requests'))
  );

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme={isRequestsPage ? 'dark' : defaultTheme}
      enableSystem={!isRequestsPage && defaultTheme === 'system'}
      disableTransitionOnChange={false}
      storageKey="app-theme"
      forcedTheme={isRequestsPage ? 'dark' : forcedTheme}
    >
      {children}
    </ThemeProvider>
  );
}

