'use client';

/**
 * Usage Dashboard Component
 * 
 * Displays current subscription usage vs limits
 * Shows upgrade prompts when approaching or at limits
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import { getUsageStats } from '@/utils/subscription-helpers';
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface UsageStats {
  eventsThisMonth: number;
  eventsLimit: number;
  smsSentThisMonth?: number;
  teamMembersCount?: number;
  teamMembersLimit?: number;
}

interface Organization {
  id: string;
  name: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise' | 'white_label';
  subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
  trial_ends_at?: string | null;
}

export default function UsageDashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const org = await getCurrentOrganization(supabase);
      
      if (!org) {
        setError('No organization found');
        setLoading(false);
        return;
      }

      setOrganization(org);
      const stats = await getUsageStats(supabase, org);
      setUsageStats(stats);
    } catch (err: any) {
      console.error('Error loading usage data:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !organization || !usageStats) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p>{error || 'Unable to load usage data'}</p>
        </div>
      </div>
    );
  }

  const getTierIcon = () => {
    switch (organization.subscription_tier) {
      case 'starter':
        return <Sparkles className="w-5 h-5" />;
      case 'professional':
        return <Zap className="w-5 h-5" />;
      case 'enterprise':
        return <Crown className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTierColor = () => {
    switch (organization.subscription_tier) {
      case 'starter':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'professional':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'enterprise':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const eventsPercentage = usageStats.eventsLimit === -1 
    ? 0 
    : Math.min(100, (usageStats.eventsThisMonth / usageStats.eventsLimit) * 100);
  
  const eventsWarning = eventsPercentage >= 80;
  const eventsCritical = eventsPercentage >= 100;

  const isTrialExpired = organization.subscription_status === 'trial' && 
    organization.trial_ends_at && 
    new Date(organization.trial_ends_at) < new Date();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Subscription Usage</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current usage vs your plan limits</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getTierColor()}`}>
            {getTierIcon()}
            <span className="text-sm font-medium capitalize">{organization.subscription_tier}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Trial Expired Warning */}
        {isTrialExpired && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Trial Expired</h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your trial period has ended. Please upgrade to continue using the platform.
                </p>
                <Link 
                  href="/onboarding/select-plan"
                  className="inline-flex items-center mt-3 text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-200"
                >
                  Upgrade Now <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Events Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Events This Month</span>
            </div>
            <div className="flex items-center gap-2">
              {eventsCritical ? (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Limit Reached</span>
              ) : eventsWarning ? (
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Near Limit</span>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {usageStats.eventsThisMonth} {usageStats.eventsLimit === -1 ? '' : `/ ${usageStats.eventsLimit}`}
                </span>
              )}
            </div>
          </div>
          
          {usageStats.eventsLimit !== -1 && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  eventsCritical
                    ? 'bg-red-500'
                    : eventsWarning
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${eventsPercentage}%` }}
              />
            </div>
          )}
          
          {usageStats.eventsLimit === -1 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Unlimited events</span>
            </div>
          )}

          {eventsCritical && organization.subscription_tier === 'starter' && (
            <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    You've reached your monthly event limit. Upgrade to Professional for unlimited events.
                  </p>
                  <Link
                    href="/onboarding/select-plan"
                    className="inline-flex items-center mt-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200"
                  >
                    Upgrade to Professional <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Members Usage */}
        {usageStats.teamMembersCount !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Members</span>
              </div>
              <div className="flex items-center gap-2">
                {usageStats.teamMembersLimit === -1 ? (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Unlimited</span>
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {usageStats.teamMembersCount} / {usageStats.teamMembersLimit}
                  </span>
                )}
              </div>
            </div>
            {usageStats.teamMembersLimit === -1 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Unlimited team members</span>
              </div>
            )}
          </div>
        )}

        {/* SMS Usage (if tracked) */}
        {usageStats.smsSentThisMonth !== undefined && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Messages</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {usageStats.smsSentThisMonth} sent this month
              </span>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Subscription Status</span>
            <span className={`text-sm font-medium ${
              organization.subscription_status === 'active' 
                ? 'text-green-600 dark:text-green-400' 
                : organization.subscription_status === 'trial'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {organization.subscription_status.charAt(0).toUpperCase() + organization.subscription_status.slice(1)}
            </span>
          </div>
          
          {organization.subscription_status === 'trial' && organization.trial_ends_at && !isTrialExpired && (
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Trial ends: {new Date(organization.trial_ends_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {organization.subscription_tier !== 'enterprise' && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/onboarding/select-plan"
              className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-black bg-brand-gold rounded-lg hover:bg-yellow-500 transition-colors"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade Plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

