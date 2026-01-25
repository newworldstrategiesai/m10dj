import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AffiliateDashboard from '@/components/tipjar/affiliate/AffiliateDashboard';

export const metadata: Metadata = {
  title: 'Affiliate Program | TipJar.Live',
  description: 'Earn commissions by referring DJs and performers to TipJar. Share your unique affiliate link and start making money.',
  openGraph: {
    title: 'TipJar Affiliate Program - Earn Money Referring DJs',
    description: 'Earn commissions by referring DJs and performers to TipJar. Share your unique affiliate link and start making money.',
    url: 'https://www.tipjar.live/tipjar/affiliate',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-affiliate-og.png',
        width: 1200,
        height: 630,
        alt: 'TipJar Affiliate Program',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJar Affiliate Program - Earn Money Referring DJs',
    description: 'Earn commissions by referring DJs and performers to TipJar.',
    images: ['/assets/tipjar-affiliate-og.png'],
  },
};

export default async function AffiliatePage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/tipjar/signin?redirect=/tipjar/affiliate');
  }

  // Verify user has TipJar product context
  const productContext = user.user_metadata?.product_context;
  if (productContext !== 'tipjar') {
    redirect('/signin?redirect=/tipjar/affiliate');
  }

  // Get user's organization
  const organization = await supabase
    .from('organizations')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!organization) {
    redirect('/tipjar/onboarding');
  }

  return <AffiliateDashboard user={user} organization={organization} />;
}