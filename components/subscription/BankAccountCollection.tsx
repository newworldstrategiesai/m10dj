/**
 * Bank Account Collection Component using Stripe Financial Connections
 * 
 * This component uses stripe.collectBankAccountToken to show an on-page modal
 * for users to securely link their bank account for payouts.
 */

'use client';

import { useState, useEffect } from 'react';
import { getStripe } from '@/utils/stripe/client';
import { Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BankAccountCollectionProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function BankAccountCollection({ 
  onSuccess, 
  onError 
}: BankAccountCollectionProps) {
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCollectBankAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      setCollecting(false);

      // Step 1: Create a Financial Connections Session
      const sessionResponse = await fetch('/api/stripe-connect/financial-connections-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create Financial Connections session');
      }

      const { clientSecret } = await sessionResponse.json();

      // Step 2: Load Stripe.js
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Step 3: Show the Financial Connections modal
      setCollecting(true);
      const result = await stripe.collectBankAccountToken({
        clientSecret: clientSecret,
      });

      setCollecting(false);

      // Handle error case
      if ('error' in result && result.error) {
        // User cancelled or there was an error
        if (result.error.message?.includes('expired') || 
            result.error.message?.includes('already been used')) {
          throw new Error('The bank account link has expired. Please try again.');
        }
        throw new Error(result.error.message || 'Failed to collect bank account');
      }

      // Handle success case with token
      if ('token' in result && result.token) {
        // Step 4: Attach the bank account token to the Connect account
        const attachResponse = await fetch('/api/stripe-connect/attach-bank-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: result.token.id,
          }),
        });

        if (!attachResponse.ok) {
          const errorData = await attachResponse.json();
          throw new Error(errorData.error || 'Failed to attach bank account');
        }

        // Success!
        setSuccess(true);
        onSuccess?.();
      } else {
        // User exited without linking an account
        // Check if we have a session with no accounts
        const session = (result as any).financialConnectionsSession;
        if (session && session.accounts && session.accounts.length === 0) {
          setError('No bank account was linked. Please try again if you want to set up payouts.');
        }
      }
    } catch (err: any) {
      console.error('Error collecting bank account:', err);
      const errorMessage = err.message || 'Failed to link bank account. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
      setCollecting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3 flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
              Bank Account Linked Successfully
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your bank account has been securely linked. Payouts will be automatically deposited to this account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 flex-shrink-0">
          <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            Link Your Bank Account
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Securely link your bank account to receive automatic payouts. This process is secure and takes less than a minute.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={handleCollectBankAccount}
            disabled={loading || collecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading || collecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {collecting ? 'Opening secure connection...' : 'Preparing...'}
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Link Bank Account
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            🔒 Secured by Stripe. Your bank credentials are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

