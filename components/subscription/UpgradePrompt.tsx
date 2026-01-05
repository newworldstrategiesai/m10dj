/**
 * Upgrade Prompt Component
 * 
 * Displays a prominent call-to-action for users to upgrade their subscription
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Crown, Sparkles, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradePromptProps {
  message?: string;
  featureName?: string;
  tier?: 'professional' | 'enterprise';
  className?: string;
}

export default function UpgradePrompt({ 
  message, 
  featureName, 
  tier = 'professional',
  className = '' 
}: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this notification
    const dismissedKey = `upgrade_prompt_dismissed_${tier}`;
    const dismissed = localStorage.getItem(dismissedKey) === 'true';
    setIsDismissed(dismissed);
  }, [tier]);

  const handleDismiss = () => {
    const dismissedKey = `upgrade_prompt_dismissed_${tier}`;
    localStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  const defaultMessage = featureName 
    ? `Unlock ${featureName} and more with a ${tier === 'enterprise' ? 'Professional or Enterprise' : tier} plan.`
    : `Upgrade your plan to unlock more features and capabilities.`;

  const tierIcon = tier === 'enterprise' ? Crown : Zap;
  const TierIcon = tierIcon;

  return (
    <div className={`bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg relative ${className}`}>
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="bg-white/20 rounded-lg p-3 flex-shrink-0">
            <TierIcon className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Upgrade Your Subscription</h3>
            <p className="text-sm opacity-90">{message || defaultMessage}</p>
          </div>
        </div>
        <Link href="/onboarding/select-plan" className="flex-shrink-0">
          <Button className="bg-white text-purple-600 font-semibold hover:bg-gray-100 transition-colors">
            Upgrade Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

/**
 * Feature Lock Component
 * Shows a locked feature with upgrade prompt
 */
export function FeatureLock({ 
  featureName, 
  description,
  requiredTier = 'professional'
}: { 
  featureName: string; 
  description?: string;
  requiredTier?: 'professional' | 'enterprise';
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Lock className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {featureName} is Locked
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {description || `This feature is available on ${requiredTier === 'enterprise' ? 'Professional or Enterprise' : requiredTier} plans. Upgrade to unlock it.`}
      </p>
      <Link href="/onboarding/select-plan">
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to {requiredTier === 'enterprise' ? 'Professional+' : requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
        </Button>
      </Link>
    </div>
  );
}
