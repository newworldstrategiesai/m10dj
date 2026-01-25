import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { AffiliateService } from '@/utils/affiliate/affiliate-service';
import { redirect } from 'next/navigation';

interface RefPageProps {
  params: {
    code: string;
  };
  searchParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export async function generateMetadata({ params, searchParams }: RefPageProps): Promise<Metadata> {
  return {
    title: 'Join TipJar - DJ Tip Collection Made Easy',
    description: 'The best tip jar app for DJs. Collect tips instantly with QR codes, manage song requests, and get paid automatically.',
    openGraph: {
      title: 'TipJar - DJ Tip Collection & Song Request App',
      description: 'Join thousands of DJs using TipJar to collect tips and manage song requests at events.',
      url: `https://tipjar.live/ref/${params.code}`,
      siteName: 'TipJar Live',
      images: [
        {
          url: '/assets/tipjar-open-graph-new.png',
          width: 1200,
          height: 630,
          alt: 'TipJar - DJ Tip Collection App',
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
  };
}

export default async function ReferralPage({ params, searchParams }: RefPageProps) {
  const supabase = createClient();
  const affiliateService = new AffiliateService(supabase);

  // Validate affiliate code
  const affiliate = await affiliateService.getAffiliateByCode(params.code);

  if (!affiliate) {
    // Invalid affiliate code, redirect to regular signup
    redirect('/tipjar/signup');
  }

  // Track the referral click (this will be handled by the API route)
  // For now, redirect to signup with affiliate tracking
  const signupUrl = new URL('/tipjar/signup', 'https://tipjar.live');

  // Add UTM parameters if present
  if (searchParams.utm_source) signupUrl.searchParams.set('utm_source', searchParams.utm_source);
  if (searchParams.utm_medium) signupUrl.searchParams.set('utm_medium', searchParams.utm_medium);
  if (searchParams.utm_campaign) signupUrl.searchParams.set('utm_campaign', searchParams.utm_campaign);

  // Add affiliate code
  signupUrl.searchParams.set('ref', params.code);

  redirect(signupUrl.toString());
}