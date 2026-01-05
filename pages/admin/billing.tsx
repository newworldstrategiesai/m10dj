/**
 * Billing / Subscription Management Page
 * 
 * Allows DJs to view their current subscription, usage, and upgrade/downgrade options.
 * For TipJar.live users, this is accessible at /admin/billing
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ArrowRight, Crown, Zap, Sparkles, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';

interface Organization {
  id: string;
  name: string;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due';
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  trial_ends_at?: string | null;
}

interface UsageStats {
  requestsThisMonth: number;
  requestLimit: number;
  remainingRequests: number;
}

const TIER_INFO = {
  starter: {
    name: 'Free Forever',
    price: '$0',
    icon: Sparkles,
    color: 'text-gray-600 dark:text-gray-400',
    features: ['10 song requests/month', 'Basic request management', 'QR code generation', 'Community support']
  },
  professional: {
    name: 'Pro',
    price: '$29/month',
    icon: Zap,
    color: 'text-blue-600 dark:text-blue-400',
    features: ['Unlimited song requests', 'Full payment processing', 'Cash App Pay integration', 'Basic analytics', 'Custom branding', 'Priority support']
  },
  enterprise: {
    name: 'Embed Pro',
    price: '$49/month',
    icon: Crown,
    color: 'text-purple-600 dark:text-purple-400',
    features: ['Everything in Pro', 'Custom domain widget', 'Remove "Powered by TipJar"', 'Advanced analytics', 'White-label options', 'API access', 'Dedicated support']
  }
};

export default function BillingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [creatingPortal, setCreatingPortal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get organization
      const org = await getCurrentOrganization(supabase);
      if (!org) {
        router.push('/admin/dashboard');
        return;
      }
      setOrganization(org as Organization);

      // Get usage stats (pass org tier to avoid dependency on state)
      await loadUsageStats(org.id, org.subscription_tier);
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async (orgId: string, tier: 'starter' | 'professional' | 'enterprise' | 'white_label') => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const { count } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('request_type', ['song_request', 'shoutout'])
        .gte('created_at', startOfMonth.toISOString());

      const requestsThisMonth = count || 0;
      const requestLimit = tier === 'starter' ? 10 : -1; // -1 = unlimited
      const remainingRequests = requestLimit === -1 ? Infinity : Math.max(0, requestLimit - requestsThisMonth);

      setUsageStats({
        requestsThisMonth,
        requestLimit,
        remainingRequests,
      });
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handleManageBilling = async () => {
    if (!organization?.stripe_customer_id) {
      toast({
        title: 'Error',
        description: 'No billing account found. Please contact support.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingPortal(true);

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: organization.stripe_customer_id,
          returnUrl: `${window.location.origin}/admin/billing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create billing portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to open billing portal',
        variant: 'destructive',
      });
      setCreatingPortal(false);
    }
  };

  const handleUpgrade = (tier: 'professional' | 'enterprise') => {
    router.push(`/onboarding/select-plan?tier=${tier}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  if (!organization) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Organization Not Found</CardTitle>
              <CardDescription>Please complete onboarding to access billing.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const tierInfo = TIER_INFO[organization.subscription_tier];
  const TierIcon = tierInfo.icon;
  const isActive = organization.subscription_status === 'active' || organization.subscription_status === 'trial';

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Billing & Subscription</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, view usage, and upgrade your plan
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TierIcon className={`w-5 h-5 ${tierInfo.color}`} />
                Current Plan
              </CardTitle>
              <CardDescription>Your current subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {tierInfo.name}
                  </div>
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                    {tierInfo.price}
                  </div>
                  <Badge
                    variant={
                      organization.subscription_status === 'active'
                        ? 'default'
                        : organization.subscription_status === 'trial'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {organization.subscription_status === 'active'
                      ? 'Active'
                      : organization.subscription_status === 'trial'
                      ? 'Trial'
                      : organization.subscription_status === 'past_due'
                      ? 'Past Due'
                      : 'Cancelled'}
                  </Badge>
                </div>

                {organization.subscription_status === 'trial' && organization.trial_ends_at && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Trial ends: {new Date(organization.trial_ends_at).toLocaleDateString()}
                  </div>
                )}

                {organization.subscription_status === 'past_due' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="text-sm text-red-800 dark:text-red-200">
                      Your subscription payment failed. Please update your payment method to continue service.
                    </div>
                  </div>
                )}

                {isActive && organization.stripe_customer_id && (
                  <Button
                    onClick={handleManageBilling}
                    disabled={creatingPortal}
                    variant="outline"
                    className="w-full"
                  >
                    {creatingPortal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Usage This Month
              </CardTitle>
              <CardDescription>Your request usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Song Requests</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {usageStats.requestLimit === -1
                          ? `${usageStats.requestsThisMonth} (Unlimited)`
                          : `${usageStats.requestsThisMonth} / ${usageStats.requestLimit}`}
                      </span>
                    </div>
                    {usageStats.requestLimit !== -1 && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (usageStats.requestsThisMonth / usageStats.requestLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {usageStats.requestLimit !== -1 && usageStats.remainingRequests <= 3 && usageStats.remainingRequests > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        You have {usageStats.remainingRequests} request{usageStats.remainingRequests !== 1 ? 's' : ''} remaining this month.
                        {organization.subscription_tier === 'starter' && (
                          <Button
                            variant="link"
                            className="p-0 h-auto ml-1 text-yellow-800 dark:text-yellow-200 underline"
                            onClick={() => handleUpgrade('professional')}
                          >
                            Upgrade to Pro
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {usageStats.requestLimit !== -1 && usageStats.remainingRequests === 0 && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="text-sm text-red-800 dark:text-red-200">
                        You've reached your monthly limit. Upgrade to Pro for unlimited requests.
                        <Button
                          variant="link"
                          className="p-0 h-auto ml-1 text-red-800 dark:text-red-200 underline"
                          onClick={() => handleUpgrade('professional')}
                        >
                          Upgrade Now
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">Loading usage stats...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Plan Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Plan Features</CardTitle>
            <CardDescription>What's included in your {tierInfo.name} plan</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {tierInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        {organization.subscription_tier !== 'enterprise' && (
          <Card>
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>Get more features and unlimited requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {organization.subscription_tier === 'starter' && (
                  <>
                    <Card className="border-2 border-blue-200 dark:border-blue-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          Pro
                        </CardTitle>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$29/month</div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Unlimited song requests</li>
                          <li>• Full payment processing</li>
                          <li>• Custom branding</li>
                          <li>• Basic analytics</li>
                        </ul>
                        <Button
                          onClick={() => handleUpgrade('professional')}
                          className="w-full"
                          variant="default"
                        >
                          Upgrade to Pro
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-200 dark:border-purple-800">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          Embed Pro
                        </CardTitle>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">$49/month</div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Everything in Pro</li>
                          <li>• Embed widget</li>
                          <li>• White-label options</li>
                          <li>• Advanced analytics</li>
                          <li>• API access</li>
                        </ul>
                        <Button
                          onClick={() => handleUpgrade('enterprise')}
                          className="w-full"
                          variant="outline"
                        >
                          Upgrade to Embed Pro
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                )}

                {organization.subscription_tier === 'professional' && (
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Embed Pro
                      </CardTitle>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">$49/month</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Everything in Pro</li>
                        <li>• Embed widget</li>
                        <li>• White-label options</li>
                        <li>• Advanced analytics</li>
                        <li>• API access</li>
                      </ul>
                      <Button
                        onClick={() => handleUpgrade('enterprise')}
                        className="w-full"
                        variant="default"
                      >
                        Upgrade to Embed Pro
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

