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
import { GeneralRequestsPage } from '../../requests'; // Reuse the existing requests page component (named export)
import TipJarChatWidget from '../../../components/tipjar/TipJarChatWidget';

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

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
        // Support normalized slug matching (e.g., "ben-spins" matches "benspins")
        console.log('📡 Querying Supabase for organization...');
        
        // Try exact match first
        let { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*, social_links, product_context, requests_assistant_enabled, requests_assistant_show_quick_actions, requests_assistant_quick_action_has_played, requests_assistant_quick_action_when_will_play, requests_accent_color, requests_theme_mode') // Explicitly select fields needed for chat widget
          .eq('slug', slug)
          .maybeSingle(); // Use maybeSingle to avoid errors on not found
        
        // If not found, try normalized match using RPC function
        if (!org && !orgError) {
          console.log('📡 Exact match not found, trying normalized slug match...');
          const { data: normalizedOrgs, error: rpcError } = await supabase
            .rpc('get_organization_by_normalized_slug', { input_slug: slug });
          
          if (!rpcError && normalizedOrgs && normalizedOrgs.length > 0) {
            // Get full organization data for the matched org
            const matchedSlug = normalizedOrgs[0].slug;
            const { data: fullOrg, error: fullOrgError } = await supabase
              .from('organizations')
              .select('*, social_links, product_context, requests_assistant_enabled, requests_assistant_show_quick_actions, requests_assistant_quick_action_has_played, requests_assistant_quick_action_when_will_play, requests_accent_color, requests_theme_mode')
              .eq('slug', matchedSlug)
              .maybeSingle();
            
            if (!fullOrgError && fullOrg) {
              org = fullOrg;
              orgError = null;
              console.log('✅ Found organization using normalized slug match:', matchedSlug);
            }
          }
        }
        
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

        // Auto-fix: If requests_header_artist_name is missing, set it to organization name
        // This ensures the header displays correctly for organizations created before this fix
        if (!org.requests_header_artist_name && org.name) {
          try {
            const { error: updateError } = await supabase
              .from('organizations')
              .update({ requests_header_artist_name: org.name })
              .eq('id', org.id);
            
            if (!updateError) {
              // Update the org object for this request
              org.requests_header_artist_name = org.name;
              console.log('✅ [ORGANIZATION REQUESTS] Auto-set requests_header_artist_name to:', org.name);
            } else {
              console.error('❌ [ORGANIZATION REQUESTS] Error auto-setting requests_header_artist_name:', updateError);
            }
          } catch (updateError) {
            console.error('❌ [ORGANIZATION REQUESTS] Error auto-setting requests_header_artist_name:', updateError);
            // Continue anyway - the page will fall back to using org.name
          }
        }

        // Force update by creating a new object reference
        // This ensures React detects the change and re-renders
        const freshOrg = { 
          ...org,
          // Ensure these fields are explicitly set (in case they're null/undefined)
          requests_header_artist_name: org.requests_header_artist_name || org.name || '',
          requests_header_location: org.requests_header_location || '',
          requests_header_date: org.requests_header_date || '',
          // Explicitly ensure social_links is an array (default to empty array if null/undefined)
          social_links: Array.isArray(org.social_links) ? org.social_links : (org.social_links ? [org.social_links] : []),
        };
        
        // Force a state update by using a new object reference with timestamp
        setOrganization({
          ...freshOrg,
          _refreshKey: Date.now(), // Force React to see this as new data
        });
        
        // Check if current user is the owner
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user && freshOrg.owner_id === user.id) {
            setIsOwner(true);
            console.log('✅ User is the owner of this organization');
          } else {
            setIsOwner(false);
          }
        } catch (authError) {
          console.log('User not logged in or auth error:', authError);
          setIsOwner(false);
        }
        
        console.log('✅ Organization loaded on requests page:', {
          id: freshOrg.id,
          name: freshOrg.name,
          slug: freshOrg.slug,
          artist_name: freshOrg.requests_header_artist_name,
          location: freshOrg.requests_header_location,
          date: freshOrg.requests_header_date,
          updated_at: freshOrg.updated_at,
          timestamp: new Date().toISOString(),
          forceRefresh,
          hasSocialLinks: !!freshOrg.social_links,
          socialLinksCount: Array.isArray(freshOrg.social_links) ? freshOrg.social_links.length : 0,
          socialLinks: freshOrg.social_links
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
      organizationName: organization?.name,
      location: organization?.requests_header_location,
      date: organization?.requests_header_date,
      // Log the actual values being used
      willDisplayArtistName: organization?.requests_header_artist_name || organization?.name || 'DJ'
    });
  }, [loading, organization, slug]);
  
  // Force a re-render when organization data changes (especially after auto-fix)
  // This ensures the page updates if the auto-fix runs and updates the database
  useEffect(() => {
    if (organization && !organization.requests_header_artist_name && organization.name) {
      console.log('🔄 [REQUESTS PAGE] Artist name missing, triggering refresh in 1 second...');
      // Wait a moment for auto-fix to complete, then refresh
      const timer = setTimeout(async () => {
        console.log('🔄 [REQUESTS PAGE] Refreshing organization data...');
        // Force a refresh by reloading the organization (with normalized slug matching)
        // Try exact match first
        let { data: freshOrg, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        
        // If not found, try normalized match
        if (!freshOrg && !error) {
          const { data: normalizedOrgs } = await supabase
            .rpc('get_organization_by_normalized_slug', { input_slug: slug });
          
          if (normalizedOrgs && normalizedOrgs.length > 0) {
            const matchedSlug = normalizedOrgs[0].slug;
            const { data: fullOrg } = await supabase
              .from('organizations')
              .select('*')
              .eq('slug', matchedSlug)
              .maybeSingle();
            
            if (fullOrg) {
              freshOrg = fullOrg;
              error = null;
            }
          }
        }
        
        if (!error && freshOrg) {
          console.log('✅ [REQUESTS PAGE] Refreshed organization:', {
            artist_name: freshOrg.requests_header_artist_name,
            name: freshOrg.name
          });
          setOrganization({
            ...freshOrg,
            _refreshKey: Date.now(),
          });
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [organization, slug, supabase]);

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
  
  // Detect if we're on TipJar domain
  const isTipJarDomain = typeof window !== 'undefined' && (
    window.location.hostname.includes('tipjar.live') || 
    window.location.hostname.includes('tipjar.com')
  ) || organization?.product_context === 'tipjar';
  
  const coverPhoto = getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png');
  const getAbsoluteImageUrl = (imageUrl) => {
    // For TipJar domains, always use TipJar OG image unless there's a custom cover photo
    // that's not the default M10 DJ Company image
    if (isTipJarDomain) {
      const defaultM10Image = '/assets/DJ-Ben-Murray-Dodge-Poster.png';
      // If no cover photo or it's the M10 default, use TipJar OG image
      if (!imageUrl || 
          imageUrl === defaultM10Image || 
          imageUrl.includes('DJ-Ben-Murray') ||
          imageUrl === `${siteUrl}${defaultM10Image}` ||
          imageUrl.includes('m10djcompany.com')) {
        return 'https://tipjar.live/assets/tipjar-public-requests-og.png';
      }
      // If there's a custom cover photo, use it
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      // If it starts with /, it's a relative path
      if (imageUrl.startsWith('/')) {
        return `${siteUrl}${imageUrl}`;
      }
      return `${siteUrl}/${imageUrl}`;
    }
    
    // For non-TipJar domains, use standard logic
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
        <meta property="og:site_name" content={isTipJarDomain ? (organization.name || 'TipJar.Live') : (organization.name || 'M10 DJ Company')} />
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
        key={`${organization.id}-${organization.updated_at || Date.now()}-${organization.requests_header_artist_name || ''}-${JSON.stringify(organization.social_links || [])}`}
        organizationId={organization.id} 
        organizationName={organization.name}
        organizationCoverPhoto={getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png')}
        organizationData={{
          ...organization,
          // Ensure these fields are explicitly set for the component
          requests_header_artist_name: organization.requests_header_artist_name || organization.name || '',
          requests_header_location: organization.requests_header_location || '',
          requests_header_date: organization.requests_header_date || '',
          // Explicitly include social_links to ensure it's passed through
          social_links: organization.social_links || [],
          // Ensure bidding minimum bid is included
          requests_bidding_minimum_bid: organization.requests_bidding_minimum_bid,
        }}
        isOwner={isOwner}
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
      
      {/* TipJar Chat Widget - Only show for TipJar organizations if enabled */}
      {(() => {
        // Check if this is a TipJar page - either by product_context or domain
        const isTipJarPage = organization.product_context === 'tipjar' || 
          (typeof window !== 'undefined' && (
            window.location.hostname.includes('tipjar.live') || 
            window.location.hostname.includes('www.tipjar.live')
          ));
        const isAssistantEnabled = organization.requests_assistant_enabled !== false;
        
        // Get event code from URL query params if available
        const eventQrCode = router.query.eventCode || router.query.code || null;
        
        return isTipJarPage && isAssistantEnabled ? (
          <TipJarChatWidget
            organizationId={organization.id}
            organizationName={organization.name}
            organizationData={organization}
            accentColor={organization.requests_accent_color || (isTipJarPage ? '#10b981' : '#fcba00')}
            themeMode={organization.requests_theme_mode || 'dark'}
            eventQrCode={eventQrCode}
          />
        ) : null;
      })()}
    </>
  );
}

