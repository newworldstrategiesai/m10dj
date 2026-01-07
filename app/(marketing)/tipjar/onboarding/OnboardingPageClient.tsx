'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import TipJarOnboardingWizard from '@/components/tipjar/OnboardingWizard';
import { Loader2 } from 'lucide-react';

interface OnboardingPageClientProps {
  user: any;
  organization?: any;
}

export default function OnboardingPageClient({
  user,
  organization: initialOrganization
}: OnboardingPageClientProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(initialOrganization);
  const [loading, setLoading] = useState(!initialOrganization);
  const [checking, setChecking] = useState(false);

  // Wait for organization to be created if it doesn't exist
  useEffect(() => {
    async function waitForOrganization() {
      if (initialOrganization || !user?.id) return;

      setChecking(true);
      let attempts = 0;
      const maxAttempts = 20; // 1 minute max

      const checkInterval = setInterval(async () => {
        attempts++;
        
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (org) {
            setOrganization(org);
            setLoading(false);
            clearInterval(checkInterval);
          } else if (attempts >= maxAttempts) {
            // Create organization if it doesn't exist after max attempts
            try {
              const response = await fetch('/api/organizations/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: user.email?.split('@')[0] || 'My TipJar Page'
                })
              });

              if (response.ok) {
                const data = await response.json();
                setOrganization(data.organization);
              }
            } catch (error) {
              console.error('Error creating organization:', error);
            }
            setLoading(false);
            clearInterval(checkInterval);
          }
        } catch (error) {
          console.error('Error checking organization:', error);
          if (attempts >= maxAttempts) {
            setLoading(false);
            clearInterval(checkInterval);
          }
        }
      }, 3000);

      return () => clearInterval(checkInterval);
    }

    waitForOrganization();
  }, [initialOrganization, user, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {checking ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return <TipJarOnboardingWizard user={user} organization={organization} />;
}

