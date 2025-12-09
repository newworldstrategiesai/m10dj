/**
 * Stripe Connect Requirement Banner
 * 
 * Shows a banner when Stripe Connect setup is required.
 * Platform owners (M10 DJ Company) never see this banner.
 */

import Link from 'next/link';
import { AlertCircle, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Organization } from '@/utils/organization-context';
import { requiresStripeConnect, getStripeConnectMessage } from '@/utils/stripe-connect-requirements';

interface StripeConnectRequirementBannerProps {
  organization: Organization | null;
  className?: string;
}

export default function StripeConnectRequirementBanner({
  organization,
  className = '',
}: StripeConnectRequirementBannerProps) {
  // Don't show if not required (includes platform owner bypass)
  if (!requiresStripeConnect(organization)) {
    return null;
  }

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
      className={`${bgColor} border rounded-lg p-4 mb-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`font-semibold ${textColor} mb-1`}>
                Stripe Connect Setup Required
              </h3>
              <p className={`text-sm ${textColor} opacity-90`}>
                {message}
              </p>
            </div>
            {action && (
              <Link href="/onboarding/stripe-setup">
                <Button
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <CreditCard className="h-4 w-4" />
                  {action}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

