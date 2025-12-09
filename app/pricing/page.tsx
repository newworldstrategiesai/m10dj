'use client';

import { useState } from 'react';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { CheckCircle, X } from 'lucide-react';
import { Metadata } from 'next';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      tagline: 'For Solo Pros',
      monthlyPrice: 49,
      annualPrice: 490,
      features: [
        'Up to 50 events/year',
        'Core CRM & Pipeline',
        'Digital Contracts with E-Sign',
        'Automated Invoicing',
        'Song Requests & Tips',
        'Basic Analytics',
        'Email Support',
      ],
      missingFeatures: [
        'Unlimited Events',
        'Advanced Analytics',
        'Communication Hub',
        'Priority Support',
        'Team Collaboration',
      ],
    },
    {
      name: 'Professional',
      tagline: 'Most Popular',
      popular: true,
      monthlyPrice: 99,
      annualPrice: 990,
      features: [
        'Unlimited Events',
        'Full CRM & Pipeline',
        'Digital Contracts with E-Sign',
        'Automated Invoicing & Payments',
        'Song Requests & Tips',
        'Advanced Analytics & Reports',
        'Communication Hub (Email/SMS)',
        'Event Project Management',
        'Priority Support',
      ],
      missingFeatures: [
        'Team Collaboration Tools',
        'Custom Integrations',
        'Dedicated Account Manager',
      ],
    },
    {
      name: 'Business',
      tagline: 'For Scaling Teams',
      monthlyPrice: 199,
      annualPrice: 1990,
      features: [
        'Everything in Professional',
        'Team Collaboration Tools',
        'Multiple User Accounts',
        'Advanced Permissions',
        'Custom Integrations',
        'API Access',
        'White-label Options',
        'Dedicated Account Manager',
        'Custom Onboarding',
      ],
      missingFeatures: [],
    },
  ];

  const allFeatures = [
    'Up to 50 events/year',
    'Unlimited Events',
    'Core CRM & Pipeline',
    'Full CRM & Pipeline',
    'Digital Contracts with E-Sign',
    'Automated Invoicing',
    'Automated Invoicing & Payments',
    'Song Requests & Tips',
    'Basic Analytics',
    'Advanced Analytics & Reports',
    'Communication Hub (Email/SMS)',
    'Event Project Management',
    'Email Support',
    'Priority Support',
    'Team Collaboration Tools',
    'Multiple User Accounts',
    'Advanced Permissions',
    'Custom Integrations',
    'API Access',
    'White-label Options',
    'Dedicated Account Manager',
    'Custom Onboarding',
  ];

  const getPlanFeatureStatus = (plan: typeof plans[0], feature: string) => {
    if (plan.features.includes(feature)) return 'included';
    if (plan.missingFeatures.includes(feature)) return 'missing';
    // For features that don't apply to this tier
    if (plan.name === 'Starter' && feature === 'Unlimited Events') return 'missing';
    if (plan.name === 'Starter' && feature === 'Advanced Analytics & Reports') return 'missing';
    if (plan.name === 'Starter' && feature === 'Communication Hub (Email/SMS)') return 'missing';
    if (plan.name === 'Starter' && feature === 'Priority Support') return 'missing';
    if (plan.name !== 'Business' && feature.includes('Team')) return 'missing';
    if (plan.name !== 'Business' && feature === 'Custom Integrations') return 'missing';
    if (plan.name !== 'Business' && feature === 'Dedicated Account Manager') return 'missing';
    return 'not-applicable';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Transparent Pricing That Scales With You
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            All plans include 14-day free trial. 3.5% + $0.30 fee only on payments (no hidden costs).
          </p>
          
          {/* Annual Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isAnnual ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isAnnual ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
            <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              Annual
              <span className="ml-2 text-sm text-green-600 dark:text-green-400">(Save 17%)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border-2 ${
                  plan.popular
                    ? 'bg-blue-600 text-white border-green-500 relative'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`mb-6 ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                  {plan.tagline}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className={`text-lg ml-2 ${plan.popular ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                  {isAnnual && (
                    <p className={`text-sm mt-2 ${plan.popular ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      ${Math.round(plan.monthlyPrice * 0.83)}/month billed annually
                    </p>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle
                        className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                          plan.popular ? 'text-white' : 'text-green-500'
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Feature Comparison
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Feature
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.name}
                        className={`px-6 py-4 text-center text-sm font-semibold ${
                          plan.popular
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Unlimited Events',
                    'Full CRM & Pipeline',
                    'Digital Contracts with E-Sign',
                    'Automated Invoicing & Payments',
                    'Song Requests & Tips',
                    'Advanced Analytics & Reports',
                    'Communication Hub (Email/SMS)',
                    'Event Project Management',
                    'Priority Support',
                    'Team Collaboration Tools',
                    'Custom Integrations',
                    'Dedicated Account Manager',
                  ].map((feature) => (
                    <tr
                      key={feature}
                      className="border-b border-gray-200 dark:border-gray-700"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {feature}
                      </td>
                      {plans.map((plan) => {
                        const status = getPlanFeatureStatus(plan, feature);
                        return (
                          <td key={plan.name} className="px-6 py-4 text-center">
                            {status === 'included' ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : status === 'missing' ? (
                              <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Objection Handling */}
          <div className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Too expensive? Our users see ROI in 1-2 months via time savings and higher bookings.
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              DJ Dash users report saving 10+ hours per week on administrative tasks. That's time you can spend on more bookings, better client relationships, or actually enjoying your life. Many users see a 5x return on investment within the first quarter.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  10+
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Hours saved per week
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  28%
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  Average revenue growth
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                  5x
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  ROI within first quarter
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Choose Your Plan & Start Trial
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <DJDashFooter />
    </div>
  );
}