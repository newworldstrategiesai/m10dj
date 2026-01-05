import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import Link from 'next/link';
import { 
  Music, 
  QrCode, 
  DollarSign, 
  Settings,
  BarChart3,
  Users,
  ArrowRight
} from 'lucide-react';
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

  // If this is a performer organization, show performer dashboard
  // (For now, show regular dashboard, but could customize later)
  
  // Fetch crowd requests stats
  let totalTips = 0;
  let totalRequests = 0;
  let activeEvents = 0;
  
  if (organization?.id) {
    const { data: requests } = await supabase
      .from('crowd_requests')
      .select('amount_paid, payment_status, event_qr_code, created_at')
      .eq('organization_id', organization.id);
    
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
            Welcome back!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your tips, song requests, and events
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <Users className="w-10 h-10 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link 
            href="/admin/crowd-requests"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Song Requests
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage song requests, tips, and shoutouts from your events
            </p>
          </Link>

          <Link 
            href="/tipjar/dashboard/go-live"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Go Live
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Start a live stream and collect tips in real-time
            </p>
          </Link>

          <Link 
            href="/tipjar/dashboard/stream-alerts"
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Stream Alerts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure alerts and notifications for your streams
            </p>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              QR Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Generate QR codes for easy tip collection at events
            </p>
            <button className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
              Generate QR Code
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No activity yet. Start collecting tips to see your activity here!
            </p>
          </div>
        </div>
      </main>

      <TipJarFooter />
    </div>
  );
}

