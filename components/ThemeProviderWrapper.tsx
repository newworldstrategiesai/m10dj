'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('light'); // Default to light for non-logged-in users
  const [forcedTheme, setForcedTheme] = useState<'light' | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if we're on the requests page - if so, don't apply theme (requests page handles its own dark mode)
    const isRequestsPage = typeof window !== 'undefined' && (
      window.location.pathname === '/requests' || 
      window.location.pathname.startsWith('/organizations/') && window.location.pathname.endsWith('/requests')
    );
    
    if (isRequestsPage) {
      // Don't apply theme on requests page - let the page handle its own dark mode
      return;
    }
    
    const supabase = createClientComponentClient();
    
    // Load theme preference from admin settings
    async function loadThemePreference() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // No session, force light mode for non-logged-in users
          setDefaultTheme('light');
          setForcedTheme('light');
          const root = document.documentElement;
          root.classList.remove('dark');
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
              } else if (theme === 'light') {
                root.classList.remove('dark');
              } else {
                // System theme
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fall back to light mode for non-logged-in users
        setDefaultTheme('light');
        setForcedTheme('light');
      }
    }

    loadThemePreference();
    
    // Listen for auth state changes to update theme when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session) {
        // User logged out, force light mode
        setDefaultTheme('light');
        setForcedTheme('light');
        const root = document.documentElement;
        root.classList.remove('dark');
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
          if (response.ok) {
            const data = await response.json();
            const theme = data.settings?.app_theme;
            if (theme && (theme === 'light' || theme === 'dark' || theme === 'system')) {
              setDefaultTheme(theme);
            }
          }
        } catch (error) {
          console.error('Error loading theme preference after login:', error);
        }
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme={defaultTheme}
      enableSystem={defaultTheme === 'system'}
      disableTransitionOnChange={false}
      storageKey="app-theme"
      forcedTheme={forcedTheme}
    >
      {children}
    </ThemeProvider>
  );
}

