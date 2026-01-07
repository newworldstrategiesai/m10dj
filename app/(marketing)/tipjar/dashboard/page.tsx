import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentOrganization } from '@/utils/organization-context';

export const metadata: Metadata = {
  title: 'Dashboard | TipJar.Live',
  description: 'Manage your tips, song requests, and events',
};

export default async function TipJarDashboard() {
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

  // Get user's organization for stats
  const organization = await getCurrentOrganization(supabase as any);
  
  // If no organization exists yet, redirect to onboarding
  // (Organization should be auto-created by trigger, but handle edge case)
  if (!organization) {
    redirect('/tipjar/onboarding');
  }

  // If this is a venue organization, redirect to venue dashboard
  if (organization.organization_type === 'venue') {
    redirect('/tipjar/dashboard/venue');
  }

  // If user is logged in, redirect to admin crowd requests page
  // This ensures they see the admin navigation instead of the public marketing header
  redirect('/admin/crowd-requests');
}

