/**
 * Kiosk mode for requests: /[slug]/requests/kiosk
 * Same flow as /[slug]/requests but tablet-optimized; after submit shows
 * a QR code to complete payment on phone (scan → /[slug]/requests/pay?code=XXX).
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { getCoverPhotoUrl } from '@/utils/cover-photo-helper';
import { GeneralRequestsPage } from '@/pages/requests';

export default function KioskRequestsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const supabase = useMemo(() => createClient(), []);
  const [organization, setOrganization] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadOrganization() {
      if (!slug) return;
      try {
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', slug)
          .single();

        if (orgError || !org) {
          setError('Organization not found');
          setLoading(false);
          return;
        }
        if (org.subscription_status !== 'active' && org.subscription_status !== 'trial') {
          setError('This organization is not currently active');
          setLoading(false);
          return;
        }
        setOrganization({ ...org });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          setIsOwner(!!(user && org.owner_id === user.id));
        } catch {
          setIsOwner(false);
        }
        try {
          const res = await fetch(`/api/organizations/branding/get?slug=${slug}`);
          if (res.ok) {
            const data = await res.json();
            if (data.branding) setBranding(data.branding);
          }
        } catch {
          // non-critical
        }
      } catch (err) {
        setError('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }
    loadOrganization();
  }, [slug, supabase]);

  const hasBranding = branding?.hasAccess || branding?.whiteLabelEnabled;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <>
        <Head>
          <title>Kiosk – Not found</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-muted/30 dark:bg-muted/10 p-4">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Organization not found</h1>
            <p className="text-muted-foreground mb-4">{error || 'Not found.'}</p>
            <Link href="/" className="text-primary hover:underline">Go home</Link>
          </div>
        </div>
      </>
    );
  }

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
          body { font-family: ${branding.fontFamily || 'system-ui, sans-serif'} !important; }
        `}</style>
      )}
      {branding?.customFaviconUrl && (
        <Head>
          <link rel="icon" href={branding.customFaviconUrl} />
        </Head>
      )}
      <Head>
        <title>Request – Kiosk{organization?.name ? ` | ${organization.name}` : ''}</title>
      </Head>
      <GeneralRequestsPage
        key={`${organization.id}-kiosk-${organization.updated_at || Date.now()}`}
        organizationId={organization.id}
        organizationName={organization.name}
        organizationCoverPhoto={getCoverPhotoUrl(organization, '/assets/DJ-Ben-Murray-Dodge-Poster.png')}
        organizationData={organization}
        embedMode={false}
        isOwner={isOwner}
        kiosk={true}
        customBranding={hasBranding && branding ? {
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
          fontFamily: organization.font_family,
        } : null)}
      />
    </>
  );
}
