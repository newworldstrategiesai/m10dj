/**
 * Plan Selection Page
 * 
 * Shows pricing tiers and allows DJs to select their subscription plan
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    description: 'Perfect for part-time DJs',
    features: [
      '5 events per month',
      'Basic song requests',
      'Shoutouts',
      'Stripe payments',
      'QR code generation',
      'Basic analytics',
      'Email support',
    ],
    popular: false,
    icon: Sparkles,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 49,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
    description: 'For serious DJs who want it all',
    features: [
      'Unlimited events',
      'Full request system',
      'All payment methods (Stripe, CashApp, Venmo)',
      'Fast-track & Next options',
      'Bundle discounts',
      'Advanced analytics',
      'QR code generation',
      'Full business management',
      'Email + SMS support',
    ],
    popular: true,
    icon: Zap,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    description: 'For DJ companies and agencies',
    features: [
      'Everything in Professional',
      'White-label branding',
      'Custom domain support',
      'Subdomain URLs',
      'API access',
      'Multi-user accounts',
      'Priority support',
      'Custom integrations',
    ],
    popular: false,
    icon: Crown,
  },
];

export default function SelectPlanPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganization() {
      const org = await getCurrentOrganization(supabase);
      if (org) {
        setOrganization(org);
      } else {
        // No organization - redirect to signup
        router.push('/signup');
      }
      setLoading(false);
    }
    loadOrganization();
  }, [supabase, router]);

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (!organization) return;

    setProcessing(true);
    setSelectedPlan(plan.id);

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          organizationId: organization.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Select Your Plan | {organization.name}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Select the plan that best fits your DJ business. All plans include a 14-day free trial. No credit card required.
            </p>
          </div>

          {/* Trial Status */}
          {organization.subscription_status === 'trial' && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                <strong>Free Trial Active:</strong> You have {Math.ceil(
                  (new Date(organization.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )} days remaining. Upgrade anytime during your trial.
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              const isProcessing = processing && isSelected;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-8 transition-all ${
                    plan.popular
                      ? 'border-purple-500 scale-105 shadow-xl'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      plan.popular
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <Icon className={`w-8 h-8 ${
                        plan.popular ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                      }`} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={processing}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </span>
                    ) : (
                      organization.subscription_tier === plan.id ? 'Current Plan' : 'Select Plan'
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Can I change plans later?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  What happens after the trial?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your subscription will automatically continue. You can cancel anytime with no penalties.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Do I need a credit card for the trial?
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No! Start your 14-day free trial without a credit card. You only need to add payment when you're ready to continue.
                </p>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Link
              href="/onboarding/welcome"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              ← Back to welcome page
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

