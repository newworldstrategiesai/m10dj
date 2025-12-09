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
import { getCoverPhotoUrl } from '../../../utils/cover-photo-helper';
import GeneralRequestsPage from '../../requests'; // Reuse the existing requests page component

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrganization(forceRefresh = false) {
      if (!slug) {
        console.log('⏸️ No slug, skipping organization load');
        return;
      }

      try {
        // Force fresh data by using a timestamp in the query
        // Supabase client-side queries can be cached, so we need to bypass that
        const timestamp = Date.now();
        console.log(`🔄 [REQUESTS PAGE] Loading organization (${forceRefresh ? 'force refresh' : 'initial load'}) at ${new Date(timestamp).toISOString()}`);
        console.log(`📍 Slug: ${slug}`);
        
        // Add a small delay to ensure database changes are propagated
        if (forceRefresh) {
          console.log('⏳ Waiting 1 second for database propagation...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Query with explicit cache control - use a fresh query each time
        console.log('📡 Querying Supabase for organization...');
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();
        
        console.log('📥 Supabase response received:', { hasData: !!org, hasError: !!orgError });

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

        // Force update by creating a new object reference
        const freshOrg = { ...org };
        setOrganization(freshOrg);
        
        console.log('✅ Organization loaded on requests page:', {
          id: freshOrg.id,
          name: freshOrg.name,
          artist_name: freshOrg.requests_header_artist_name,
          location: freshOrg.requests_header_location,
          date: freshOrg.requests_header_date,
          updated_at: freshOrg.updated_at,
          timestamp: new Date().toISOString(),
          forceRefresh
        });
        
        // Also log the full object to verify data
        console.log('📋 Full organization data:', freshOrg);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
    
    // Set up interval to refresh organization data every 10 seconds
    // This ensures changes appear on the public page without requiring a full page reload
    const refreshInterval = setInterval(() => {
      if (slug) {
        loadOrganization(true);
      }
    }, 10000); // Refresh every 10 seconds

    // Also listen for focus events to refresh when user returns to tab
    const handleFocus = () => {
      if (slug) {
        loadOrganization(true);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [slug, supabase]);

  // Debug: Log when component renders
  useEffect(() => {
    console.log('🎬 [REQUESTS PAGE] OrganizationRequestsPage rendered:', {
      loading,
      hasOrganization: !!organization,
      slug,
      artistName: organization?.requests_header_artist_name,
      location: organization?.requests_header_location,
      date: organization?.requests_header_date
    });
  }, [loading, organization, slug]);

  if (loading) {
    console.log('⏳ [REQUESTS PAGE] Showing loading state...');
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
  const siteUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com');
  const coverPhoto = getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png');
  const getAbsoluteImageUrl = (imageUrl) => {
    if (!imageUrl) return `${siteUrl}/assets/DJ-Ben-Murray-Dodge-Poster.png`;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return `${siteUrl}${imageUrl}`;
    }
    return `${siteUrl}/${imageUrl}`;
  };
  const ogImageUrl = getAbsoluteImageUrl(coverPhoto);
  const pageTitle = organization.requests_page_title || `Request a Song or Shoutout | ${organization.name}`;
  const pageDescription = organization.requests_page_description || 
    (organization.requests_header_artist_name 
      ? `Request a song or shoutout for ${organization.requests_header_artist_name}`
      : `Request a song or shoutout for ${organization.name}`);
  const currentUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : `${siteUrl}/organizations/${organization.slug}/requests`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook / iPhone SMS Preview */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={organization.requests_header_artist_name || organization.name || 'Request a Song or Shoutout'} />
        <meta property="og:site_name" content={organization.name || 'M10 DJ Company'} />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:alt" content={organization.requests_header_artist_name || organization.name || 'Request a Song or Shoutout'} />
      </Head>
      <GeneralRequestsPage 
        key={`${organization.id}-${organization.updated_at || Date.now()}`}
        organizationId={organization.id} 
        organizationName={organization.name}
        organizationCoverPhoto={getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png')}
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

