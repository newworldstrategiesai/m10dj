import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/company/Header';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCoverPhotoUrl } from '../utils/cover-photo-helper';
import { GeneralRequestsPage } from './requests';

const DEFAULT_COVER_PHOTO = '/assets/DJ-Ben-Murray-Dodge-Poster.png';

// Dedicated bidding page at /bid - always shows bidding mode
export default function BidPageWrapper() {
  const router = useRouter();
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadDefaultOrganization() {
      try {
        console.log('🔄 [BID PAGE] Loading default organization for /bid route...');
        
        // Load the default organization (M10 DJ Company with slug 'm10dj')
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', 'm10dj')
          .single();

        if (error) {
          console.error('❌ [BID PAGE] Error loading organization:', error);
          setLoading(false);
          return;
        }

        if (org && (org.subscription_status === 'active' || org.subscription_status === 'trial')) {
          // Auto-fix: If requests_header_artist_name is missing, set it to organization name
          if (!org.requests_header_artist_name && org.name) {
            try {
              const { error: updateError } = await supabase
                .from('organizations')
                .update({ requests_header_artist_name: org.name })
                .eq('id', org.id);
              
              if (!updateError) {
                org.requests_header_artist_name = org.name;
                console.log('✅ [BID PAGE] Auto-set requests_header_artist_name to:', org.name);
              }
            } catch (updateError) {
              console.error('❌ [BID PAGE] Error auto-setting requests_header_artist_name:', updateError);
            }
          }
          
          setOrganization(org);
          console.log('✅ [BID PAGE] Organization loaded:', {
            id: org.id,
            name: org.name,
            artist_name: org.requests_header_artist_name
          });
        }
      } catch (err) {
        console.error('❌ [BID PAGE] Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDefaultOrganization();
    
    // Set up interval to refresh organization data every 10 seconds
    const refreshInterval = setInterval(() => {
      loadDefaultOrganization();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Don't modify organization data - just pass forceBiddingMode prop
  // This ensures /bid always uses bidding mode regardless of organization setting
  return (
    <GeneralRequestsPage
      key={`${organization?.id || 'default'}-bid-mode`}
      organizationId={organization?.id || null}
      organizationName={organization?.name || null}
      organizationCoverPhoto={getCoverPhotoUrl(organization, DEFAULT_COVER_PHOTO)}
      organizationData={organization} // Pass original organization data (don't modify)
      isOwner={isOwner}
      customBranding={organization?.white_label_enabled ? {
        whiteLabelEnabled: organization.white_label_enabled,
        customLogoUrl: organization.custom_logo_url,
        primaryColor: organization.primary_color,
        secondaryColor: organization.secondary_color,
        backgroundColor: organization.background_color,
        textColor: organization.text_color,
        fontFamily: organization.font_family
      } : null}
      forceBiddingMode={true} // Force bidding mode for /bid route - overrides organization setting
    />
  );
}

