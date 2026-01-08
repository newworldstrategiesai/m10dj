/**
 * Organization-Specific Request Page
 * 
 * Public page for each organization: /{slug}/requests
 * Allows event attendees to submit song requests and shoutouts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/company/Header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCoverPhotoUrl } from '../../utils/cover-photo-helper';
// Organization will be loaded via API
import { GeneralRequestsPage } from '../requests';

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadOrganization(forceRefresh = false) {
      if (!slug) {
        console.log('⏸️ [SLUG/REQUESTS] No slug, skipping organization load');
        return;
      }

      try {
        console.log(`🔄 [SLUG/REQUESTS] Loading organization (${forceRefresh ? 'force refresh' : 'initial load'}) for slug: ${slug}`);
        
        // Add a small delay to ensure database changes are propagated
        if (forceRefresh) {
          console.log('⏳ [SLUG/REQUESTS] Waiting 1 second for database propagation...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Load full organization data directly from Supabase to get all settings fields
        console.log('📡 [SLUG/REQUESTS] Querying Supabase for organization...');
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError) {
          console.error('❌ [SLUG/REQUESTS] Error loading organization:', orgError);
          setError('Organization not found');
          setLoading(false);
          return;
        }

        if (!org) {
          console.error('❌ [SLUG/REQUESTS] No organization found');
          setError('Organization not found');
          setLoading(false);
          return;
        }

        // Check if organization subscription is active
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          console.warn('⚠️ [SLUG/REQUESTS] Organization not active:', org.subscription_status);
          setError('This organization is not currently active');
          setLoading(false);
          return;
        }

        // Force update by creating a new object reference
        const freshOrg = { ...org };
        setOrganization(freshOrg);
        
        // Check if logged-in user is the owner
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && freshOrg.owner_id === user.id) {
            setIsOwner(true);
            console.log('✅ [SLUG/REQUESTS] User is owner of organization');
          } else {
            setIsOwner(false);
          }
        } catch (authError) {
          // User not logged in or error - not owner
          setIsOwner(false);
        }
        
        console.log('✅ [SLUG/REQUESTS] Organization loaded:', {
          id: freshOrg.id,
          name: freshOrg.name,
          artist_name: freshOrg.requests_header_artist_name,
          location: freshOrg.requests_header_location,
          date: freshOrg.requests_header_date,
          updated_at: freshOrg.updated_at,
          timestamp: new Date().toISOString()
        });
        
        // Load branding if available (use slug for public access)
        try {
          const brandingResponse = await fetch(`/api/organizations/branding/get?slug=${slug}`);
          if (brandingResponse.ok) {
            const brandingData = await brandingResponse.json();
            if (brandingData.branding) {
              setBranding(brandingData.branding);
            }
          }
        } catch (brandingErr) {
          console.warn('⚠️ [SLUG/REQUESTS] Error loading branding:', brandingErr);
          // Non-critical, continue without branding
        }
      } catch (err) {
        console.error('❌ [SLUG/REQUESTS] Error loading organization:', err);
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    loadOrganization();
    
    // Set up interval to refresh organization data every 10 seconds
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

  // Check owner status when auth state changes
  useEffect(() => {
    if (!organization) return;

    async function checkOwnerStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && organization.owner_id === user.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (authError) {
        setIsOwner(false);
      }
    }

    checkOwnerStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (organization) {
        if (session?.user && organization.owner_id === session.user.id) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [organization, supabase]);

  // Debug: Log when component renders
  useEffect(() => {
    console.log('🎬 [SLUG/REQUESTS] OrganizationRequestsPage rendered:', {
      loading,
      hasOrganization: !!organization,
      slug,
      artistName: organization?.requests_header_artist_name,
      location: organization?.requests_header_location,
      date: organization?.requests_header_date,
      organizationKeys: organization ? Object.keys(organization) : []
    });
  }, [loading, organization, slug]);

  if (loading) {
    console.log('⏳ [SLUG/REQUESTS] Showing loading state...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !organization) {
    console.log('❌ [SLUG/REQUESTS] Error or no organization:', { error, hasOrganization: !!organization });
    return (
      <>
        <Head>
          <title>Organization Not Found</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Organization Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The organization you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Apply custom branding styles if available
  const hasBranding = branding?.hasAccess || branding?.whiteLabelEnabled;

  return (
    <>
      {hasBranding && branding && (
        <style jsx global>{`
          :root {
            --brand-primary: ${branding.primaryColor || '#8B5CF6'};
            --brand-secondary: ${branding.secondaryColor || '#EC4899'};
            --brand-background: ${branding.backgroundColor || '#FFFFFF'};
            --brand-text: ${branding.textColor || '#1F2937'};
            --brand-font: ${branding.fontFamily || 'system-ui, sans-serif'};
          }
          body {
            font-family: ${branding.fontFamily || 'system-ui, sans-serif'} !important;
          }
        `}</style>
      )}
      {branding?.customFaviconUrl && (
        <Head>
          <link rel="icon" href={branding.customFaviconUrl} />
        </Head>
      )}
      <Head>
        {(() => {
          // Determine product context from organization or hostname
          let productContext = organization?.product_context || null;
          
          // If product context is not set, detect from hostname
          if (!productContext && typeof window !== 'undefined') {
            const hostname = window.location.hostname.toLowerCase();
            if (hostname.includes('tipjar.live')) {
              productContext = 'tipjar';
            } else if (hostname.includes('djdash.net') || hostname.includes('djdash.com')) {
              productContext = 'djdash';
            } else if (hostname.includes('m10djcompany.com')) {
              productContext = 'm10dj';
            }
          }
          
          // Fallback: default to tipjar if not detected
          productContext = productContext || 'tipjar';
          
          // Determine site name based on product context
          const siteName = productContext === 'tipjar' 
            ? 'TipJar.Live' 
            : productContext === 'djdash' 
            ? 'DJ Dash' 
            : 'M10 DJ Company';
          
          // Determine site URL based on product context
          let siteUrl = typeof window !== 'undefined' 
            ? window.location.origin 
            : null;
          
          if (!siteUrl) {
            switch (productContext) {
              case 'tipjar':
                siteUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || 'https://tipjar.live';
                break;
              case 'djdash':
                siteUrl = process.env.NEXT_PUBLIC_DJDASH_URL || 'https://djdash.net';
                break;
              case 'm10dj':
                siteUrl = process.env.NEXT_PUBLIC_M10DJ_URL || 'https://m10djcompany.com';
                break;
              default:
                siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live';
            }
          }
          
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
          
          // Use organization name or artist name for display, fallback to site name
          const displayName = organization?.requests_header_artist_name || organization?.name || siteName;
          
          // Generate page title - use custom title if set, otherwise use product-aware format
          const pageTitle = organization?.requests_page_title || 
            (productContext === 'tipjar'
              ? `TipJar.Live | ${displayName}`
              : productContext === 'djdash'
              ? `DJ Dash | ${displayName}`
              : `Request a Song or Shoutout | ${displayName}`
            );
          
          const pageDescription = organization?.requests_page_description || 
            (organization?.requests_header_artist_name 
              ? `Request a song or shoutout for ${organization.requests_header_artist_name}`
              : `Request a song or shoutout for ${organization?.name || 'your event'}`);
          
          const currentUrl = typeof window !== 'undefined' 
            ? window.location.href 
            : `${siteUrl}/${organization?.slug || 'requests'}/requests`;
          
          return (
            <>
              <title>{pageTitle}</title>
              <meta name="description" content={pageDescription} />
              <meta property="og:type" content="website" />
              <meta property="og:url" content={currentUrl} />
              <meta property="og:title" content={pageTitle} />
              <meta property="og:description" content={pageDescription} />
              <meta property="og:image" content={ogImageUrl} />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:alt" content={organization?.requests_header_artist_name || organization?.name || 'Request a Song or Shoutout'} />
              <meta property="og:site_name" content={organization?.name || siteName} />
              <meta property="og:locale" content="en_US" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:url" content={currentUrl} />
              <meta name="twitter:title" content={pageTitle} />
              <meta name="twitter:description" content={pageDescription} />
              <meta name="twitter:image" content={ogImageUrl} />
              <meta name="twitter:image:alt" content={organization?.requests_header_artist_name || organization?.name || 'Request a Song or Shoutout'} />
            </>
          );
        })()}
      </Head>
      {(() => {
        console.log('📤 [SLUG/REQUESTS] Passing organizationData to GeneralRequestsPage:', {
          hasOrganization: !!organization,
          artistName: organization?.requests_header_artist_name,
          organizationId: organization?.id,
          organizationDataKeys: organization ? Object.keys(organization).filter(k => k.startsWith('requests_')) : []
        });
        return null;
      })()}
      <GeneralRequestsPage
        key={`${organization.id}-${organization.updated_at || Date.now()}`}
        organizationId={organization.id}
        organizationName={organization.name}
        organizationCoverPhoto={getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png')}
        organizationData={organization}
        embedMode={false}
        isOwner={isOwner}
        customBranding={hasBranding ? {
          logoUrl: branding.customLogoUrl,
          faviconUrl: branding.customFaviconUrl,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
          textColor: branding.textColor,
          fontFamily: branding.fontFamily,
          companyName: organization.name,
        } : (organization.white_label_enabled ? {
          whiteLabelEnabled: organization.white_label_enabled,
          customLogoUrl: organization.custom_logo_url,
          primaryColor: organization.primary_color,
          secondaryColor: organization.secondary_color,
          backgroundColor: organization.background_color,
          textColor: organization.text_color,
          fontFamily: organization.font_family
        } : null)}
      />
    </>
  );
}

