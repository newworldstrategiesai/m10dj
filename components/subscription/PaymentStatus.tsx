/**
 * Payment Status Component
 * 
 * Shows DJ's payment balance, pending payouts, and recent transactions
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import { DollarSign, Clock, CheckCircle, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface PaymentBalance {
  available: number;
  pending: number;
  currency: string;
}

interface PayoutInfo {
  nextPayoutDate?: string;
  payoutSchedule: string;
}

export default function PaymentStatus() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const org = await getCurrentOrganization(supabase);
      if (!org) {
        setError('No organization found');
        setLoading(false);
        return;
      }

      setOrganization(org);

      // Only fetch balance if Stripe Connect is set up
      if (org.stripe_connect_account_id && org.stripe_connect_payouts_enabled) {
        const response = await fetch('/api/stripe-connect/balance');
        if (response.ok) {
          const data = await response.json();
          setBalance(data.balance);
          setPayoutInfo(data.payoutInfo);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load balance');
        }
      } else {
        // No Connect account - show message
        setBalance(null);
      }
    } catch (err: any) {
      console.error('Error loading payment status:', err);
      setError(err.message || 'Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // If no Stripe Connect account, don't show this component
  if (!organization?.stripe_connect_account_id || !organization?.stripe_connect_payouts_enabled) {
    return null;
  }

  if (!balance) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No payment information available</p>
        </div>
      </div>
    );
  }

  const availableAmount = balance.available / 100; // Convert cents to dollars
  const pendingAmount = balance.pending / 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Status</h2>
        <Link href="/admin/payouts">
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Available Balance */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Available Now</p>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(availableAmount)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Ready for payout
          </p>
        </div>

        {/* Pending Balance */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {formatCurrency(pendingAmount)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Processing payments
          </p>
        </div>
      </div>

      {/* Payout Schedule */}
      {payoutInfo && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Payout Schedule</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {payoutInfo.payoutSchedule === 'daily' && 'Daily payouts'}
            {payoutInfo.payoutSchedule === 'weekly' && 'Weekly payouts'}
            {payoutInfo.payoutSchedule === 'monthly' && 'Monthly payouts'}
            {payoutInfo.payoutSchedule === 'manual' && 'Manual payouts'}
            {payoutInfo.nextPayoutDate && (
              <span className="ml-2">
                • Next payout: {new Date(payoutInfo.nextPayoutDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {availableAmount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link href="/admin/payouts">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

