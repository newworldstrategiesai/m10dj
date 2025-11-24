/**
 * Organization-Specific Request Page
 * 
 * Public page for each organization: /{slug}/requests
 * Allows event attendees to submit song requests and shoutouts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/company/Header';
// Organization will be loaded via API
import GeneralRequestsPage from '../requests';

export default function OrganizationRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [organization, setOrganization] = useState(null);
  const [branding, setBranding] = useState(null);
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
            
            // Load branding if available (use slug for public access)
            const brandingResponse = await fetch(`/api/organizations/branding/get?slug=${slug}`);
            if (brandingResponse.ok) {
              const brandingData = await brandingResponse.json();
              if (brandingData.branding) {
                setBranding(brandingData.branding);
              }
            }
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
      <div className="min-h-screen flex items-center justify-center">
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Organization Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The organization you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <a
              href="/"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Go to Home
            </a>
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
      <GeneralRequestsPage
        organizationId={organization.id}
        organizationName={organization.name}
        embedMode={false}
        customBranding={hasBranding ? {
          logoUrl: branding.customLogoUrl,
          faviconUrl: branding.customFaviconUrl,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
          textColor: branding.textColor,
          fontFamily: branding.fontFamily,
          companyName: organization.name,
        } : null}
      />
    </>
  );
}

