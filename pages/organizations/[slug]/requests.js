/**
 * Organization-specific public requests page
 * URL: /organizations/[slug]/requests
 * Example: /organizations/m10dj/requests
 * 
 * This page allows anyone to submit song requests/shoutouts for a specific DJ organization
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import GeneralRequestsPage from '../../requests'; // Reuse the existing requests page component

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;

      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError) {
          console.error('Error loading organization:', orgError);
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Check if organization subscription is active
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          setError('This organization is not currently active');
          setLoading(false);
          return;
        }

        setOrganization(org);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
  }, [slug, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600">{error || 'The organization you\'re looking for doesn\'t exist or is not active.'}</p>
        </div>
      </div>
    );
  }

  // Pass organization context to the requests page
  // The GeneralRequestsPage will use this to set organization_id when creating requests
  return (
    <>
      <Head>
        <title>Request a Song or Shoutout | {organization.name}</title>
        <meta name="description" content={`Request a song or shoutout for ${organization.name}`} />
      </Head>
      <GeneralRequestsPage 
        organizationId={organization.id} 
        organizationName={organization.name}
        organizationCoverPhoto={organization.requests_cover_photo_url || organization.requests_artist_photo_url || organization.requests_venue_photo_url || '/assets/DJ-Ben-Murray-Dodge-Poster.png'}
        organizationData={organization}
        customBranding={organization.white_label_enabled ? {
          whiteLabelEnabled: organization.white_label_enabled,
          customLogoUrl: organization.custom_logo_url,
          primaryColor: organization.primary_color,
          secondaryColor: organization.secondary_color,
          backgroundColor: organization.background_color,
          textColor: organization.text_color,
          fontFamily: organization.font_family
        } : null}
      />
    </>
  );
}

