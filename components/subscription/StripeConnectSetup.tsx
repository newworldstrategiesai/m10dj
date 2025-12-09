/**
 * Stripe Connect Setup Component
 * 
 * Prompts DJs to set up Stripe Connect to receive payments
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import { CreditCard, CheckCircle, AlertCircle, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  isComplete: boolean;
  accountId?: string;
}

export default function StripeConnectSetup() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const org = await getCurrentOrganization(supabase);
      if (!org) {
        setLoading(false);
        return;
      }

      setOrganization(org);

      // Check if organization has Stripe Connect account
      // Access optional fields with type assertion (fields exist in DB but may not be in type)
      const orgData = org as any;
      const hasAccount = !!orgData.stripe_connect_account_id;
      const chargesEnabled = orgData.stripe_connect_charges_enabled || false;
      const payoutsEnabled = orgData.stripe_connect_payouts_enabled || false;
      const detailsSubmitted = orgData.stripe_connect_details_submitted || false;

      setConnectStatus({
        hasAccount,
        chargesEnabled,
        payoutsEnabled,
        detailsSubmitted,
        isComplete: chargesEnabled && payoutsEnabled,
        accountId: org.stripe_connect_account_id || undefined,
      });

      // If account exists but not complete, get onboarding URL
      if (hasAccount && !(chargesEnabled && payoutsEnabled)) {
        await fetchOnboardingUrl();
      }
    } catch (error) {
      console.error('Error loading Stripe Connect status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnboardingUrl = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/stripe-connect/onboarding-link');
      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
      }
    } catch (error) {
      console.error('Error fetching onboarding URL:', error);
    }
  };

  const handleSetup = async () => {
    try {
      setSettingUp(true);

      // First, create the account if it doesn't exist
      if (!connectStatus?.hasAccount) {
        const createResponse = await fetch('/api/stripe-connect/create-account', {
          method: 'POST',
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || 'Failed to create Stripe account');
        }
      }

      // Then get the onboarding link
      const linkResponse = await fetch('/api/stripe-connect/onboarding-link');
      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        throw new Error(error.error || 'Failed to get onboarding link');
      }

      const data = await linkResponse.json();
      
      // Redirect to Stripe onboarding
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (error: any) {
      console.error('Error setting up Stripe Connect:', error);
      alert(error.message || 'Failed to start setup. Please try again.');
    } finally {
      setSettingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!organization || !connectStatus) {
    return null;
  }

  // If setup is complete, show success status
  if (connectStatus.isComplete) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3 flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              Payment Setup Complete
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-3">
              Your Stripe account is connected and ready to receive payments. All payments from requests will automatically be deposited to your account.
            </p>
            <Link href="/admin/payouts">
              <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                View Payouts <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If account exists but not complete, show completion prompt
  if (connectStatus.hasAccount && !connectStatus.isComplete) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-lg p-3 flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Complete Payment Setup
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
              Your Stripe account is created but needs to be activated. Complete the onboarding process to start receiving payments.
            </p>
            <Button
              onClick={handleSetup}
              disabled={settingUp}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Complete Setup <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If no account, show setup prompt
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex-shrink-0">
          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Set Up Payments to Receive Money
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your Stripe account to automatically receive payments from song requests and shoutouts. 
            Payments are deposited directly to your bank account with a small platform fee (3.5% + $0.30).
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSetup}
              disabled={settingUp}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {settingUp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting Up...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Set Up Stripe Payments
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://stripe.com/docs/connect', '_blank')}
              className="border-gray-300"
            >
              Learn More <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Secure payment processing powered by Stripe. You'll need a bank account to receive payouts.
          </p>
        </div>
      </div>
    </div>
  );
}

