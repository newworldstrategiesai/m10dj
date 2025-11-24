/**
 * Embed version of requests page
 * URL: /organizations/[slug]/embed/requests
 * 
 * This is a minimal version without header/footer for embedding in iframes
 * Query params: ?theme=dark&height=600
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GeneralRequestsPage from '../../../requests';

export default function EmbedRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { theme = 'light', height } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error || !org) {
          setLoading(false);
          return;
        }

        // Check subscription status
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          setLoading(false);
          return;
        }

        setOrganization(org);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600">Organization not found</p>
      </div>
    );
  }

  // Apply theme
  const themeClass = theme === 'dark' ? 'dark' : '';

  return (
    <>
      <Head>
        <title>Request a Song | {organization.name}</title>
        <meta name="robots" content="noindex, nofollow" />
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          /* Hide scrollbar but allow scrolling */
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        `}</style>
      </Head>
      <div className={`min-h-screen ${themeClass}`} style={{ minHeight: height ? `${height}px` : '100vh' }}>
        <GeneralRequestsPage 
          organizationId={organization.id} 
          organizationName={organization.name}
          embedMode={true}
        />
      </div>
    </>
  );
}

