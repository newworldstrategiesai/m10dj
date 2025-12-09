/**
 * Payout Dashboard
 * 
 * Shows DJ's payment balance, payout history, and allows requesting payouts
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface PaymentBalance {
  available: number;
  pending: number;
  currency: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  arrivalDate: string;
  created: number;
  method: string;
}

interface PayoutInfo {
  payoutSchedule: string;
  nextPayoutDate?: string;
  delayDays: number;
}

export default function PayoutsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [instantPayoutAmount, setInstantPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin?redirect=/admin/payouts');
        return;
      }

      if (isPlatformAdmin(user.email || '')) {
        router.push('/admin/dashboard');
        return;
      }

      const org = await getCurrentOrganization(supabase);
      if (!org) {
        router.push('/onboarding/request-page');
        return;
      }

      setOrganization(org);
      await loadPayoutData();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      if (!organization) return;

      // Only load if Stripe Connect is set up
      // Access optional fields with type assertion
      const orgData = organization as any;
      if (orgData.stripe_connect_account_id && orgData.stripe_connect_payouts_enabled) {
        // Load balance
        const balanceResponse = await fetch('/api/stripe-connect/balance');
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(balanceData.balance);
          setPayoutInfo(balanceData.payoutInfo);
        }

        // Load payout history
        const payoutsResponse = await fetch('/api/stripe-connect/payouts');
        if (payoutsResponse.ok) {
          const payoutsData = await payoutsResponse.json();
          setPayouts(payoutsData.payouts || []);
        }
      }
    } catch (err: any) {
      console.error('Error loading payout data:', err);
      setError(err.message || 'Failed to load payout information');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInstantPayout = async () => {
    if (!organization || !instantPayoutAmount) return;

    const amount = parseFloat(instantPayoutAmount);
    if (isNaN(amount) || amount < 0.50) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum instant payout is $0.50',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRequestingPayout(true);

      const response = await fetch('/api/stripe-connect/instant-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organization.id,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request payout');
      }

      toast({
        title: 'Payout Requested',
        description: `$${data.payout.amount.toFixed(2)} will be deposited to your account shortly.`,
      });

      setInstantPayoutAmount('');
      await loadPayoutData();
    } catch (err: any) {
      console.error('Error requesting instant payout:', err);
      toast({
        title: 'Payout Failed',
        description: err.message || 'Failed to process instant payout',
        variant: 'destructive',
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | number) => {
    const date = typeof dateString === 'number' 
      ? new Date(dateString * 1000) 
      : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payout information...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!organization) {
    return null;
  }

      // Check if Stripe Connect is set up
      // Access optional fields with type assertion
      const orgData = organization as any;
      const hasConnect = orgData.stripe_connect_account_id && 
                    orgData.stripe_connect_payouts_enabled;

  if (!hasConnect) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                    Payment Setup Required
                  </h2>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    You need to set up Stripe Connect to receive payments. Complete the onboarding process to start getting paid.
                  </p>
                  <Button
                    onClick={() => router.push('/admin/dashboard-starter')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Go to Dashboard to Set Up
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const availableAmount = balance ? balance.available / 100 : 0;
  const pendingAmount = balance ? balance.pending / 100 : 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Payouts & Payments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your payments and request payouts
              </p>
            </div>
            <Button
              onClick={loadPayoutData}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Available Balance</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(availableAmount)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ready for immediate payout
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Processing payments
              </p>
            </div>
          </div>

          {/* Instant Payout */}
          {availableAmount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Request Instant Payout
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get your money immediately (1% fee, minimum $0.50). Available balance: {formatCurrency(availableAmount)}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Amount (e.g., 50.00)"
                    value={instantPayoutAmount}
                    onChange={(e) => setInstantPayoutAmount(e.target.value)}
                    min="0.50"
                    step="0.01"
                    max={availableAmount.toFixed(2)}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleInstantPayout}
                  disabled={requestingPayout || !instantPayoutAmount}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {requestingPayout ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Instant payouts arrive within minutes. Standard payouts are free and arrive in 2-7 business days.
              </p>
            </div>
          )}

          {/* Payout Schedule */}
          {payoutInfo && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Payout Schedule
              </h2>
              <div className="flex items-center gap-4">
                <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {payoutInfo.payoutSchedule === 'daily' && 'Daily Payouts'}
                    {payoutInfo.payoutSchedule === 'weekly' && 'Weekly Payouts'}
                    {payoutInfo.payoutSchedule === 'monthly' && 'Monthly Payouts'}
                    {payoutInfo.payoutSchedule === 'manual' && 'Manual Payouts'}
                  </p>
                  {payoutInfo.nextPayoutDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Next payout: {formatDate(payoutInfo.nextPayoutDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payout History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Payout History
              </h2>
              {payouts.length > 0 && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>

            {payouts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payouts yet</p>
                <p className="text-sm mt-1">Payouts will appear here once you start receiving payments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                        Arrival Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {formatDate(payout.created)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(payout.amount / 100)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : payout.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {payout.method}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {payout.arrivalDate ? formatDate(payout.arrivalDate) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

