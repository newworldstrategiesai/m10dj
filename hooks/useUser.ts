'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  isRateLimited,
  setRateLimited,
  getRemainingCooldown,
  shouldThrottleAuthCall,
  recordAuthCall,
} from '@/utils/supabase/rate-limiter';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const loadUser = async () => {
      if (isRateLimited()) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      if (shouldThrottleAuthCall()) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        recordAuthCall();
        if (!isMounted) return;

        if (error && (error.message?.includes('refresh_token_not_found') || error.message?.includes('Invalid Refresh Token'))) {
          setUser(null);
          setLoading(false);
          return;
        }
        if (error?.message?.includes('over_request_rate_limit') || error?.status === 429) {
          setRateLimited();
          setUser(null);
          setLoading(false);
          return;
        }
        if (!error && session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch (err: any) {
        recordAuthCall();
        if (!isMounted) return;
        if (err?.message?.includes('over_request_rate_limit') || err?.status === 429) setRateLimited();
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (isMounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      });
      subscription = authSubscription;
    } catch (_err) {
      if (isMounted) setLoading(false);
    }

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}