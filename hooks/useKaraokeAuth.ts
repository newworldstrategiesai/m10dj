import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-context';
import { useToast } from '@/components/ui/Toasts/use-toast';

export function useKaraokeAuth() {
  const router = useRouter();

  // Use the singleton client from utils/supabase/client
  const supabase = createClient();

  const { toast } = useToast();

  // Simple rate limiting for development
  const lastAuthCheck = useRef<number>(0);
  const AUTH_CHECK_THROTTLE = 5000; // 5 seconds

  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    async function checkAuth() {
      // Rate limiting check
      const now = Date.now();
      if (now - lastAuthCheck.current < AUTH_CHECK_THROTTLE) {
        console.log('Auth check throttled, skipping');
        setIsLoading(false);
        return;
      }
      lastAuthCheck.current = now;

      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        // If component unmounted, don't update state
        if (!isMounted) return;

        if (authError) {
          // Handle rate limiting gracefully - don't redirect, just set loading to false
          if (authError.message?.includes('rate limit') || authError.status === 429) {
            console.warn('Auth rate limited, skipping check');
            setIsLoading(false);
            return;
          }
          console.error('Auth error:', authError);
          redirectToLogin();
          return;
        }

        if (!user) {
          console.log('No user found, redirecting to login');
          redirectToLogin();
          return;
        }

        setUser(user);

        // Check organization access with error handling for rate limits
        let org;
        try {
          org = await getCurrentOrganization(supabase);
        } catch (orgError: any) {
          if (!isMounted) return;
          console.warn('Organization lookup failed:', orgError);
          // If rate limited, don't redirect - just set loading to false
          if (orgError?.status === 429 || orgError?.message?.includes('rate limit')) {
            setIsLoading(false);
            return;
          }
          throw orgError; // Re-throw other errors
        }

        if (!isMounted) return;

        if (!org) {
          console.log('No organization access, redirecting to dashboard');
          toast({
            title: 'Access Denied',
            description: 'You do not have access to karaoke features. Please contact your administrator.',
            variant: 'destructive'
          });
          router.push('/admin/dashboard');
          return;
        }

        setOrganization(org);
        setSubscriptionTier(org.subscription_tier || 'free');
        setIsAuthenticated(true);

      } catch (error: any) {
        if (!isMounted) return;

        // Handle rate limiting gracefully
        if (error?.status === 429 || error?.message?.includes('rate limit')) {
          console.warn('Auth rate limited, will retry later');
          setIsLoading(false);
          return;
        }

        console.error('Authentication check failed:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to verify your access. Please try logging in again.',
          variant: 'destructive'
        });
        redirectToLogin();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    function redirectToLogin() {
      // Store current path to redirect back after login
      const currentPath = router.asPath;
      if (currentPath !== '/signin') {
        router.push(`/signin?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        router.push('/signin');
      }
    }

    checkAuth();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Remove all dependencies to prevent re-runs

  return {
    user,
    organization,
    subscriptionTier,
    isLoading,
    isAuthenticated,
    supabase
  };
}