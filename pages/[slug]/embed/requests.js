/**
 * Organization-Specific Embed Request Page
 * 
 * Embeddable version: /{slug}/embed/requests
 * Designed to be embedded in external websites via iframe
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// Organization will be loaded via API
import { GeneralRequestsPage } from '../../requests';

export default function OrganizationEmbedRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        const response = await fetch(`/api/organizations/get-by-slug?slug=${slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setOrganization(data.organization);
          } else {
            setError('Organization not found');
          }
        } else {
          setError('Failed to load organization');
        }
      } catch (err) {
        console.error('Error loading organization:', err);
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <>
        <Head>
          <title>Organization Not Found</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center p-8">
            <p className="text-gray-600 dark:text-gray-400">
              Organization not found
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Request a Song | {organization.name}</title>
      </Head>
      <GeneralRequestsPage
        organizationId={organization.id}
        organizationName={organization.name}
        organizationData={organization}
        organizationCoverPhoto={organization?.requests_cover_photo_url || organization?.requests_artist_photo_url || organization?.requests_venue_photo_url || null}
        embedMode={true}
      />
    </>
  );
}

