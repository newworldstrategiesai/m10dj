'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { isRateLimited, setRateLimited, getRemainingCooldown } from '@/utils/supabase/rate-limiter';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use singleton client to prevent multiple instances
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Get initial user
    const getUser = async () => {
      // Check global rate limiter first
      if (isRateLimited()) {
        console.log(`⏳ Skipping auth check - rate limited (${getRemainingCooldown()}s remaining)`);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        // Don't update state if component unmounted
        if (!isMounted) return;

        // Handle rate limiting globally
        if (error?.message?.includes('over_request_rate_limit') || error?.status === 429) {
          setRateLimited();
          setUser(null);
          return;
        }

        // Ignore refresh token errors - they'll be handled by middleware
        if (error && (error.message.includes('refresh_token_not_found') ||
                      error.message.includes('Invalid Refresh Token'))) {
          // Just set user to null and continue
          setUser(null);
        } else if (!error) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        // Handle AbortError gracefully (component unmounted or request cancelled)
        if (error?.name === 'AbortError') {
          return; // Don't update state if request was aborted
        }

        // Handle rate limiting in catch block too
        if (error?.message?.includes('over_request_rate_limit') || error?.status === 429) {
          setRateLimited();
        }

        // Handle any other errors gracefully
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getUser();

    // Listen for auth changes
    try {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });
      
      subscription = authSubscription;
    } catch (error: any) {
      // Handle errors in subscription setup
      if (error?.name !== 'AbortError' && isMounted) {
        console.error('Error setting up auth subscription:', error);
      }
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);

  return { user, loading };
}