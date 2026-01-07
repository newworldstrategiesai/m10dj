import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/utils/organization-context';
import OnboardingPageClient from './OnboardingPageClient';

export const metadata: Metadata = {
  title: 'Getting Started | TipJar.Live',
  description: 'Complete your TipJar setup',
};

export default async function TipJarOnboardingPage() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/tipjar/signin');
  }

  // Verify user has TipJar product context
  const productContext = user.user_metadata?.product_context;
  if (productContext !== 'tipjar') {
    // User signed up through different product, redirect appropriately
    redirect('/signin');
  }

  // Check if organization exists
  const organization = await getCurrentOrganization(supabase);

  // If organization exists and has basic info, redirect to admin
  // Otherwise show wizard to complete setup
  if (organization && organization.requests_header_artist_name) {
    redirect('/admin/crowd-requests');
  }

  // Show onboarding wizard
  return <OnboardingPageClient user={user} organization={organization} />;
}

