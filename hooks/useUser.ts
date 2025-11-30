'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Ignore refresh token errors - they'll be handled by middleware
        if (error && (error.message.includes('refresh_token_not_found') || 
                      error.message.includes('Invalid Refresh Token') ||
                      error.message.includes('over_request_rate_limit'))) {
          // Just set user to null and continue
          setUser(null);
        } else if (!error) {
          setUser(user);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Handle any other errors gracefully
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return { user, loading };
}