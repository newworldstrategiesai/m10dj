import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-context';
import { useToast } from '@/components/ui/Toasts/use-toast';

// Global client instance to avoid multiple instances
let globalSupabaseClient: any = null;

export function useKaraokeAuth() {
  const router = useRouter();

  // Use global client instance to avoid creating multiple clients
  if (!globalSupabaseClient) {
    globalSupabaseClient = createClient();
  }
  const supabase = globalSupabaseClient;

  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
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

        // Check organization access
        const org = await getCurrentOrganization(supabase);
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

      } catch (error) {
        console.error('Authentication check failed:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to verify your access. Please try logging in again.',
          variant: 'destructive'
        });
        redirectToLogin();
      } finally {
        setIsLoading(false);
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
  }, [supabase, router, toast]);

  return {
    user,
    organization,
    subscriptionTier,
    isLoading,
    isAuthenticated,
    supabase
  };
}