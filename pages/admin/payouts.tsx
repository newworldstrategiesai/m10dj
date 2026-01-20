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
  Loader2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { calculateTipJarInstantPayoutFee } from '@/utils/stripe/tipjar-instant-payout';

interface PaymentBalance {
  available: number;
  instant_available?: number; // Amount available for instant payouts
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

  // Calculate fee breakdown for display (simplified - single fee)
  const calculatePayoutBreakdown = (amount: number) => {
    if (!amount || isNaN(amount) || amount <= 0) return null;
    
    if (organization?.product_context === 'tipjar') {
      // Calculate total fee but present as single combined fee
      const tipjarFeePercentage = 1.0;
      const tipjarFeeFixed = 0.25;
      const stripeFeePercentage = 1.50;
      
      const tipjarFee = (amount * tipjarFeePercentage / 100) + tipjarFeeFixed;
      const amountAfterTipJarFee = amount - tipjarFee;
      const stripeFeeOnReduced = Math.max(amountAfterTipJarFee * stripeFeePercentage / 100, 0.50);
      const totalFee = stripeFeeOnReduced + tipjarFee;
      const payoutAmount = Math.max(amount - totalFee, 0);
      const feePercentage = (totalFee / amount) * 100;
      
      return {
        requestedAmount: amount,
        feeAmount: totalFee,
        feePercentage: feePercentage,
        payoutAmount: payoutAmount
      };
    } else {
      // Standard fee structure
      const feePercentage = 1.5;
      const feeAmount = Math.max(amount * (feePercentage / 100), 0.50);
      const payoutAmount = Math.max(amount - feeAmount, 0);
      
      return {
        requestedAmount: amount,
        feeAmount: feeAmount,
        feePercentage: feePercentage,
        payoutAmount: payoutAmount
      };
    }
  };

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
        // If organization fetch failed, show error message instead of redirecting
        // This allows users to retry or see what went wrong
        setError('Unable to load organization. Please refresh the page or try again later.');
        setLoading(false);
        return;
      }

      setOrganization(org);
      // Pass org directly to avoid race condition with state update
      await loadPayoutData(org);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const loadPayoutData = async (orgOverride?: Organization | null) => {
    try {
      setRefreshing(true);
      setError(null);

      // Use passed organization or fall back to state
      const orgToUse = orgOverride || organization;
      if (!orgToUse) return;

      // Only load if Stripe Connect is set up
      // Access optional fields with type assertion
      const orgData = orgToUse as any;
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
    const minAmount = organization?.product_context === 'tipjar' ? 0.75 : 0.50;
    
    if (isNaN(amount) || amount < minAmount || amount > instantAvailableAmount) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between ${formatCurrency(minAmount)} and ${formatCurrency(instantAvailableAmount)}`,
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
    // Show error message if organization failed to load
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
                      Error Loading Organization
                    </h2>
                    <p className="text-red-700 dark:text-red-300 mb-4">
                      {error}
                    </p>
                    <Button
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        checkAuthAndLoad();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading organization...</p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    );
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
  const instantAvailableAmount = balance ? (balance.instant_available || 0) / 100 : 0;
  const pendingAmount = balance ? balance.pending / 100 : 0;

  // Auto-fill max amount when instant available amount changes
  useEffect(() => {
    if (instantAvailableAmount > 0 && !instantPayoutAmount) {
      setInstantPayoutAmount(instantAvailableAmount.toFixed(2));
    }
  }, [instantAvailableAmount]);

  // Calculate breakdown for current amount
  const currentAmount = parseFloat(instantPayoutAmount) || 0;
  const breakdown = calculatePayoutBreakdown(currentAmount);
  
  // Generate preset amounts (only show if less than max)
  const presetAmounts = [10, 25, 50, 100].filter(amt => amt <= instantAvailableAmount);
  
  // Validation
  const minAmount = organization?.product_context === 'tipjar' ? 0.75 : 0.50;
  const isValidAmount = currentAmount >= minAmount && currentAmount <= instantAvailableAmount;

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
              {instantAvailableAmount > 0 && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  {formatCurrency(instantAvailableAmount)} available for instant payout
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {instantAvailableAmount > 0 ? 'Ready for instant or standard payout' : 'Ready for standard payout'}
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
          {instantAvailableAmount > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    Request Instant Payout
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get your money in 30 minutes
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full">
                  <Zap className="h-3.5 w-3.5 text-yellow-500" />
                  <span>Instant Processing</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInstantPayoutAmount(instantAvailableAmount.toFixed(2))}
                  className="font-semibold border-2 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                >
                  Use Max ({formatCurrency(instantAvailableAmount)})
                </Button>
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setInstantPayoutAmount(amount.toFixed(2))}
                    className={instantPayoutAmount === amount.toFixed(2) 
                      ? "bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-600" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payout Amount
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={instantPayoutAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for clearing
                      if (value === '') {
                        setInstantPayoutAmount('');
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        // Cap at maximum available
                        const cappedValue = Math.min(numValue, instantAvailableAmount);
                        setInstantPayoutAmount(cappedValue.toFixed(2));
                      }
                    }}
                    min={minAmount}
                    step="0.01"
                    max={instantAvailableAmount.toFixed(2)}
                    className={`w-full pl-10 text-lg font-semibold ${
                      !isValidAmount && currentAmount > 0
                        ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {!isValidAmount && currentAmount > 0 && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {currentAmount < minAmount 
                      ? `Minimum amount is ${formatCurrency(minAmount)}`
                      : `Maximum amount is ${formatCurrency(instantAvailableAmount)}`
                    }
                  </p>
                )}
              </div>

              {/* Real-time Fee Preview */}
              {breakdown && isValidAmount && (
                <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">You'll Receive:</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(breakdown.payoutAmount)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-green-200 dark:border-green-800">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Requested Amount:</span>
                      <span className="font-medium">{formatCurrency(breakdown.requestedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Processing Fee (~{breakdown.feePercentage.toFixed(1)}%):</span>
                      <span className="text-red-600 dark:text-red-400">-{formatCurrency(breakdown.feeAmount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleInstantPayout}
                disabled={requestingPayout || !isValidAmount || currentAmount === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                {requestingPayout ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Request Instant Payout
                  </>
                )}
              </Button>

              {/* Info Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  💰 Instant payouts arrive within 30 minutes. Standard payouts are free and arrive in 2-7 business days.
                </p>
                {instantAvailableAmount < availableAmount && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ℹ️ Only {formatCurrency(instantAvailableAmount)} is eligible for instant payout. The remaining {formatCurrency(availableAmount - instantAvailableAmount)} will process on your regular schedule.
                  </p>
                )}
              </div>
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

