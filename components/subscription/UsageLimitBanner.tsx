/**
 * Usage Limit Banner Component
 * 
 * Displays usage statistics and upgrade prompts when approaching or reaching limits
 */

import { AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface UsageLimitBannerProps {
  currentUsage: number;
  limit: number;
  subscriptionTier: 'starter' | 'professional' | 'enterprise' | 'white_label';
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'past_due';
  featureName?: string;
  onUpgrade?: () => void;
}

export default function UsageLimitBanner({
  currentUsage,
  limit,
  subscriptionTier,
  subscriptionStatus,
  featureName = 'requests',
  onUpgrade,
}: UsageLimitBannerProps) {
  // Don't show banner for unlimited plans or cancelled/past_due subscriptions
  if (limit === -1 || subscriptionStatus === 'cancelled' || subscriptionStatus === 'past_due') {
    return null;
  }

  const isUnlimited = limit === -1;
  const remaining = limit - currentUsage;
  const usagePercent = (currentUsage / limit) * 100;
  const isNearLimit = remaining <= 3 && remaining > 0;
  const isAtLimit = remaining === 0;

  // Only show banner for starter tier
  if (subscriptionTier !== 'starter') {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      window.location.href = '/onboarding/select-plan?tier=professional';
    }
  };

  if (isAtLimit) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  Monthly {featureName} limit reached
                </h3>
                <Badge variant="destructive">Limit Reached</Badge>
              </div>
              <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                You&apos;ve used all {limit} {featureName} this month. Upgrade to Pro for unlimited {featureName}.
              </p>
              <Button
                onClick={handleUpgrade}
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Upgrade to Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isNearLimit) {
    return (
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Approaching monthly limit
                </h3>
                <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  {remaining} remaining
                </Badge>
              </div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                You have {remaining} {featureName} remaining this month ({currentUsage} of {limit} used).
              </p>
              <div className="w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2 mb-4">
                <div
                  className="bg-yellow-600 dark:bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <Button
                onClick={handleUpgrade}
                variant="outline"
                size="sm"
                className="border-yellow-600 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-100 dark:hover:bg-yellow-900"
              >
                Upgrade to Pro for Unlimited
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show subtle usage indicator for other cases (50%+ usage)
  if (usagePercent >= 50) {
    return (
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 mb-6">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-200">
                {currentUsage} of {limit} {featureName} used this month
              </span>
            </div>
            <div className="w-32 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <Link href="/admin/billing">
              <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                View Usage
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

