/**
 * Stripe Connect Requirement Banner
 * 
 * Shows a banner when Stripe Connect setup is required.
 * Platform owners (M10 DJ Company) never see this banner.
 * Admins can dismiss this banner.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, CreditCard, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Organization } from '@/utils/organization-context';
import { requiresStripeConnect, getStripeConnectMessage } from '@/utils/stripe-connect-requirements';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';

interface StripeConnectRequirementBannerProps {
  organization: Organization | null;
  className?: string;
}

const DISMISS_KEY = 'stripe_connect_banner_dismissed';

export default function StripeConnectRequirementBanner({
  organization,
  className = '',
}: StripeConnectRequirementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if banner was dismissed
    if (typeof window !== 'undefined') {
      const dismissedValue = localStorage.getItem(DISMISS_KEY);
      if (dismissedValue === 'true') {
        setDismissed(true);
      }
    }

    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const admin = isPlatformAdmin(user.email);
          setIsAdmin(admin);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, [supabase]);

  // Don't show if not required (includes platform owner bypass)
  if (!requiresStripeConnect(organization)) {
    return null;
  }

  // Don't show if dismissed
  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
      setDismissed(true);
    }
  };

  const { message, action, severity } = getStripeConnectMessage(organization);

  const bgColor =
    severity === 'error'
      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      : severity === 'warning'
      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';

  const textColor =
    severity === 'error'
      ? 'text-red-800 dark:text-red-200'
      : severity === 'warning'
      ? 'text-yellow-800 dark:text-yellow-200'
      : 'text-blue-800 dark:text-blue-200';

  const iconColor =
    severity === 'error'
      ? 'text-red-600 dark:text-red-400'
      : severity === 'warning'
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-blue-600 dark:text-blue-400';

  return (
    <div
      className={`${bgColor} border rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 relative ${className}`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <AlertCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h3 className={`font-semibold text-xs sm:text-sm ${textColor} mb-0.5`}>
                Stripe Connect Setup Required
              </h3>
              <p className={`text-xs ${textColor} opacity-90 line-clamp-1 sm:line-clamp-2`}>
                {message}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {action && (
                <Link href="/onboarding/stripe-setup" className="flex-shrink-0">
                  <Button
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs"
                  >
                    <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{action}</span>
                    <span className="sm:hidden">Setup</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className={`h-4 w-4 ${iconColor}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

