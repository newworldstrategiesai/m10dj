/**
 * Admin Manual Payouts Dashboard
 * 
 * Platform admin interface for viewing and processing manual payouts
 * for organizations that received payments before Stripe Connect setup
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import AdminLayout from '@/components/layouts/AdminLayout';
import { 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Loader2,
  ArrowRight,
  Building2,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface OrganizationPayout {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  productContext: string;
  hasConnect: boolean;
  connectAccountId: string | null;
  totalPayments: number;
  totalAmount: number; // in cents
  totalAfterFees: number; // in cents
  platformFees: number; // in cents
  payments: Array<{
    paymentIntentId: string;
    amount: number;
    created: string;
  }>;
}

export default function ManualPayoutsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState<OrganizationPayout[]>([]);
  const [transferring, setTransferring] = useState<string | null>(null); // organizationId being transferred
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalAmount: 0,
    totalAfterFees: 0,
  });

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/signin?redirect=/admin/manual-payouts');
        return;
      }

      const isAdmin = isPlatformAdmin(user.email || '');
      if (!isAdmin) {
        router.push('/admin/dashboard');
        return;
      }

      await loadPayouts();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const response = await fetch('/api/admin/manual-payouts/list');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load payouts');
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);
      setStats({
        totalOrganizations: data.totalOrganizations || 0,
        totalAmount: data.totalAmount || 0,
        totalAfterFees: data.totalAfterFees || 0,
      });
    } catch (err: any) {
      console.error('Error loading payouts:', err);
      setError(err.message || 'Failed to load manual payouts');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load manual payouts',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleTransfer = async (organizationId: string) => {
    if (!confirm('Are you sure you want to transfer accumulated funds for this organization?')) {
      return;
    }

    try {
      setTransferring(organizationId);
      setError(null);

      const response = await fetch('/api/admin/manual-payouts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer funds');
      }

      toast({
        title: 'Transfer Successful',
        description: data.message || 'Funds transferred successfully',
      });

      // Reload payouts to reflect changes
      await loadPayouts();
    } catch (err: any) {
      console.error('Error transferring funds:', err);
      setError(err.message || 'Failed to transfer funds');
      toast({
        title: 'Transfer Failed',
        description: err.message || 'Failed to transfer funds',
        variant: 'destructive',
      });
    } finally {
      setTransferring(null);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProductBadgeColor = (context: string) => {
    switch (context) {
      case 'tipjar':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'djdash':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'm10dj':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading manual payouts...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Manual Payouts
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Organizations with payments in platform account awaiting transfer
                </p>
              </div>
              <Button
                onClick={loadPayouts}
                disabled={refreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Organizations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalOrganizations}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">After Platform Fees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(stats.totalAfterFees)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Organizations List */}
          {organizations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Pending Manual Payouts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All organizations either have Stripe Connect set up or have no accumulated payments.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  key={org.organizationId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {org.organizationName}
                        </h3>
                        <Badge className={getProductBadgeColor(org.productContext)}>
                          {org.productContext === 'tipjar' ? 'TipJar' : 
                           org.productContext === 'djdash' ? 'DJ Dash' : 'M10 DJ'}
                        </Badge>
                        {org.hasConnect && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Connect Ready
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {org.ownerEmail}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {org.totalPayments} payment{org.totalPayments !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {formatCurrency(org.totalAfterFees)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(org.platformFees)} in fees
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Total: {formatCurrency(org.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Details:
                    </p>
                    <div className="space-y-2">
                      {org.payments.slice(0, 5).map((payment) => (
                        <div
                          key={payment.paymentIntentId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {formatDate(payment.created)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))}
                      {org.payments.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          + {org.payments.length - 5} more payment{org.payments.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-end gap-3">
                    {org.hasConnect ? (
                      <Button
                        onClick={() => handleTransfer(org.organizationId)}
                        disabled={transferring === org.organizationId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {transferring === org.organizationId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Transferring...
                          </>
                        ) : (
                          <>
                            Transfer to Connect Account
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Connect not set up - Manual payout required</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

