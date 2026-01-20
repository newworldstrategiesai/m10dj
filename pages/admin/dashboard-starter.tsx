/**
 * Simplified Dashboard for Starter Tier Users
 * Focuses only on request page features
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Music, 
  QrCode,
  TrendingUp,
  Settings,
  ExternalLink,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/components/layouts/AdminLayout';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import UsageDashboard from '@/components/subscription/UsageDashboard';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import StripeConnectSetup from '@/components/subscription/StripeConnectSetup';
import PaymentStatus from '@/components/subscription/PaymentStatus';

interface RequestStats {
  totalRequests: number;
  thisMonthRequests: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  pendingRequests: number;
}

export default function StarterDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/signin?redirect=/admin/dashboard-starter');
        return;
      }

      // Check if platform admin - they shouldn't be on starter dashboard
      if (isPlatformAdmin(user.email || '')) {
        router.push('/admin/dashboard');
        return;
      }

      const org = await getCurrentOrganization(supabase);
      
      if (!org) {
        router.push('/onboarding/request-page');
        return;
      }

      // Redirect non-starter users to full dashboard
      if (org.subscription_tier !== 'starter') {
        router.push('/admin/dashboard');
        return;
      }

      setOrganization(org);

      // Load data for starter tier
      await Promise.all([
        fetchRequestStats(org.id, org),
        fetchRecentRequests(org.id)
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestStats = async (orgId: string, org: Organization | null) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Total requests
      const { count: totalRequests } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      // This month's requests
      const { count: thisMonthRequests } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', startOfMonth.toISOString());

      // Pending requests (unpaid)
      const { count: pendingRequests } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('payment_status', 'pending');

      // Get organization fee settings for net revenue calculation
      const feePercentage = ((org?.platform_fee_percentage || 3.50) / 100); // Convert to decimal (3.5% -> 0.035)
      const feeFixed = org?.platform_fee_fixed || 0.30;

      // Revenue calculations - calculate NET revenue (after processing fees)
      const { data: paidRequests } = await supabase
        .from('crowd_requests')
        .select('amount_paid, created_at')
        .eq('organization_id', orgId)
        .eq('payment_status', 'paid');

      // Calculate net revenue: amount_paid (in cents) - (amount_paid * feePercentage) - (feeFixed in cents)
      // Note: amount_paid is stored in cents, feeFixed needs to be converted to cents too
      const calculateNetRevenue = (amountInCents: number) => {
        const feeAmountInCents = (amountInCents * feePercentage) + (feeFixed * 100); // Convert feeFixed to cents
        const netAmountInCents = Math.max(0, amountInCents - feeAmountInCents);
        return netAmountInCents / 100; // Convert back to dollars for display
      };

      const totalRevenue = (paidRequests || []).reduce((sum, r) => {
        const netAmount = calculateNetRevenue(r.amount_paid || 0);
        return sum + netAmount;
      }, 0);
      
      const thisMonthRevenue = (paidRequests || [])
        .filter(r => new Date(r.created_at) >= startOfMonth)
        .reduce((sum, r) => {
          const netAmount = calculateNetRevenue(r.amount_paid || 0);
          return sum + netAmount;
        }, 0);

      setStats({
        totalRequests: totalRequests || 0,
        thisMonthRequests: thisMonthRequests || 0,
        totalRevenue,
        thisMonthRevenue,
        pendingRequests: pendingRequests || 0
      });
    } catch (error) {
      console.error('Error fetching request stats:', error);
    }
  };

  const fetchRecentRequests = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('crowd_requests')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentRequests(data);
      }
    } catch (error) {
      console.error('Error fetching recent requests:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!organization) {
    return null;
  }

  const requestPageUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/organizations/${organization.slug}/requests`
    : `https://m10djcompany.com/organizations/${organization.slug}/requests`;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        {/* Header with Upgrade CTA */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome to Your Request Page!</h1>
                <p className="text-white/90">
                  Manage your song requests and shoutouts. Upgrade to unlock more features.
                </p>
              </div>
              <Link href="/onboarding/select-plan">
                <Button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/admin/requests-page">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Request Page Settings</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Customize your request page appearance and settings
              </p>
            </div>
          </Link>

          <Link href="/admin/crowd-requests">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Music className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">View Requests</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See all song requests and shoutouts
              </p>
            </div>
          </Link>

          <a href={requestPageUrl} target="_blank" rel="noopener noreferrer">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <ExternalLink className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">View Your Page</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See how your request page looks to visitors
              </p>
            </div>
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Music className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalRequests || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.thisMonthRequests || 0}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-orange-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.pendingRequests || 0}</p>
          </div>
        </div>

        {/* Stripe Connect Setup */}
        <div className="mb-6">
          <StripeConnectSetup />
        </div>

        {/* Payment Status (if Connect is set up) */}
        <div className="mb-6">
          <PaymentStatus />
        </div>

        {/* Usage Dashboard */}
        <div className="mb-6">
          <UsageDashboard />
        </div>

        {/* Recent Requests */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Requests</h2>
            <Link href="/admin/crowd-requests" className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Music className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No requests yet. Share your request page to get started!</p>
                <a 
                  href={requestPageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-purple-600 hover:text-purple-800"
                >
                  View Your Request Page →
                </a>
              </div>
            ) : (
              recentRequests.map(request => (
                <div key={request.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {request.request_type === 'song_request' 
                            ? `${request.song_title || 'Song'} - ${request.song_artist || 'Artist'}`
                            : `Shoutout for ${request.recipient_name || 'Someone'}`
                          }
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          request.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.payment_status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        From: {request.requester_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        (() => {
                          const amountInCents = request.amount_paid || 0;
                          const feePercentage = (organization?.platform_fee_percentage || 3.50) / 100;
                          const feeFixed = organization?.platform_fee_fixed || 0.30;
                          const feeAmountInCents = (amountInCents * feePercentage) + (feeFixed * 100); // Convert feeFixed to cents
                          const netAmountInCents = Math.max(0, amountInCents - feeAmountInCents);
                          return netAmountInCents / 100; // Convert to dollars for display
                        })()
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upgrade Prompts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Unlock Professional Features
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Get unlimited events, full CRM, invoicing, and more with Professional plan.
                </p>
                <Link href="/onboarding/select-plan">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-3">
                <Crown className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Go Enterprise
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  White-label branding, team members, API access, and priority support.
                </p>
                <Link href="/onboarding/select-plan">
                  <Button variant="outline" size="sm" className="w-full">
                    Explore Enterprise <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

