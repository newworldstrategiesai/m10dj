import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { getCurrentOrganization } from '@/utils/organization-context';
import VenueRosterManagement from '@/components/tipjar/venue/VenueRosterManagement';
import { 
  Users, 
  DollarSign, 
  Music,
  TrendingUp
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Venue Dashboard | TipJar.Live',
  description: 'Manage your venue roster and performers',
};

export default async function VenueDashboard() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/tipjar/signin');
  }

  // Get user's organization
  const organization = await getCurrentOrganization(supabase as any);
  
  if (!organization) {
    redirect('/tipjar/onboarding');
  }

  // Verify this is a venue organization
  if (organization.organization_type !== 'venue') {
    // Not a venue, redirect to regular dashboard
    redirect('/tipjar/dashboard');
  }

  // Get all performers for this venue
  const { data: performers } = await supabase
    .from('organizations')
    .select('id, name, performer_slug, slug, is_active, created_at')
    .eq('parent_organization_id', organization.id)
    .eq('organization_type', 'performer')
    .order('created_at', { ascending: false });

  type Performer = {
    id: string;
    name: string;
    performer_slug: string | null;
    slug: string;
    is_active: boolean | null;
    created_at: string;
  };

  const performerList = (performers as Performer[] | null) || [];
  const activePerformers = performerList.filter(p => p.is_active) || [];
  const totalPerformers = performerList.length || 0;

  // Get aggregated stats across all performers
  let totalTips = 0;
  let totalRequests = 0;
  let activeEvents = 0;

  if (performerList && performerList.length > 0) {
    const performerIds = performerList.map(p => p.id);
    
    const { data: requests } = await supabase
      .from('crowd_requests')
      .select('amount_paid, payment_status, event_qr_code, created_at')
      .in('organization_id', performerIds);
    
    if (requests && Array.isArray(requests)) {
      totalRequests = requests.length;
      totalTips = requests
        .filter((r: any) => r.payment_status === 'paid')
        .reduce((sum: number, r: any) => sum + (r.amount_paid || 0), 0) / 100; // Convert cents to dollars
      
      // Count unique event codes from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRequests = requests.filter((r: any) => 
        r.created_at && new Date(r.created_at) > thirtyDaysAgo
      );
      const uniqueEvents = new Set(recentRequests.map((r: any) => r.event_qr_code).filter(Boolean));
      activeEvents = uniqueEvents.size;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TipJarHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {organization.name} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your venue roster and performers
          </p>
        </div>

        {/* Venue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Performers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {totalPerformers}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activePerformers.length} active
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Tips</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${totalTips.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Song Requests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalRequests}</p>
              </div>
              <Music className="w-10 h-10 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Events (30d)</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeEvents}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Roster Management */}
        <VenueRosterManagement 
          venueOrganizationId={organization.id}
          venueSlug={organization.slug}
        />
      </main>

      <TipJarFooter />
    </div>
  );
}

