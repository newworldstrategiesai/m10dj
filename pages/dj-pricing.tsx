/**
 * DJ Subscription Pricing Page
 * 
 * This page shows subscription tiers for DJs signing up for the platform.
 * Separate from M10 DJ Company service pricing.
 */

import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Check, X, ArrowRight, Zap, TrendingUp, Crown } from 'lucide-react';

export default function DJPricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'month',
      description: 'Perfect for DJs just getting started',
      features: [
        'Basic contact management',
        '5 events per month',
        'Basic invoicing',
        'Email support',
        'Platform fees: 5% + $0.50'
      ],
      limitations: [
        'Limited to 5 events/month',
        'Basic features only',
        'Higher platform fees'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      price: '$49',
      period: 'month',
      description: 'For established DJs who want to grow',
      features: [
        'Unlimited events',
        'Full CRM & contact management',
        'Advanced invoicing & contracts',
        'E-signatures (no DocuSign fees)',
        'Song planning & questionnaires',
        'Analytics dashboard',
        'Crowd requests system',
        'Platform fees: 3.5% + $0.30',
        'Priority support'
      ],
      limitations: [],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$149',
      period: 'month',
      description: 'For high-volume DJ companies',
      features: [
        'Everything in Professional',
        'White-label branding',
        'Custom domain',
        'API access',
        'Multi-user accounts',
        'Advanced analytics',
        'Dedicated support',
        'Platform fees: 2.5% + $0.20',
        'Custom integrations'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <>
      <Head>
        <title>DJ Platform Pricing | Subscription Plans for Professional DJs</title>
        <meta 
          name="description" 
          content="Choose the perfect plan for your DJ business. Starter (free), Professional ($49/month), or Enterprise ($149/month). Start your free trial today." 
        />
        <link rel="canonical" href="/dj-pricing" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/platform" className="flex items-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  DJ Platform
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/platform"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Features
                </Link>
                <Link 
                  href="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 ${
                    plan.popular
                      ? 'border-purple-500 dark:border-purple-400 scale-105'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {plan.name === 'Enterprise' && (
                        <Crown className="w-6 h-6 text-yellow-500" />
                      )}
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /{plan.period}
                      </span>
                    </div>

                    <Link
                      href="/signup"
                      className={`block w-full text-center py-3 px-6 rounded-lg font-semibold mb-6 transition-colors ${
                        plan.popular
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {plan.cta}
                    </Link>

                    <div className="space-y-4">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Includes:
                      </div>
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {feature}
                          </span>
                        </div>
                      ))}
                      
                      {plan.limitations.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2 mt-4">
                            Limitations:
                          </div>
                          {plan.limitations.map((limitation, limitIndex) => (
                            <div key={limitIndex} className="flex items-start">
                              <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                {limitation}
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! All plans include a 14-day free trial. No credit card required to start.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  What are platform fees?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Platform fees apply to crowd requests (song requests, tips, shoutouts). 
                  Higher tiers have lower fees. Starter: 5% + $0.50, Professional: 3.5% + $0.30, Enterprise: 2.5% + $0.20.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes! You can upgrade or downgrade at any time. Changes take effect immediately.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Do I need Stripe Connect?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Yes, to receive payments from crowd requests, you'll need to set up Stripe Connect. 
                  It's free and takes about 5 minutes. We'll guide you through it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-12 text-white">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <Link 
              href="/signup"
              className="inline-flex items-center bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

