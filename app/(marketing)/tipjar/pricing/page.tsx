import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/tipjar/PricingCard';
import { Card } from '@/components/ui/card';
import { FAQ } from '@/components/tipjar/FAQ';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Event Tipping App Pricing | Best Tip Jar App for DJs | TipJar.Live',
  description: 'Pricing for the best tip jar app for DJs and event tipping app. Start free, upgrade when you\'re making money. All plans include 3.5% + $0.30 platform fee only when you get paid.',
  keywords: [
    'event tipping app',
    'best tip jar app for DJs',
    'tip jar app pricing',
    'DJ tip collection pricing',
    'song request app pricing'
  ],
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-tipjar-gradient dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Event Tipping App Pricing<br />Best Tip Jar App for DJs
          </h1>
          <p className="text-xl text-center text-gray-300 max-w-2xl mx-auto">
            Simple, fair pricing for the best tip jar app for DJs and event tipping app. Start free, upgrade when you&apos;re making money. No credit card required.
          </p>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              All plans: <span className="font-semibold">3.5% + $0.30 platform fee</span> only when you get paid (Stripe standard rates apply)
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            <PricingCard
              name="Free Forever"
              price="$0"
              period="/month"
              description="Great for testing"
              features={[
                '10 requests/month',
                'No payment processing',
                'Basic features',
                'Community support'
              ]}
              cta="Get Started"
              ctaLink="/signup"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              description="Most Popular"
              features={[
                'Unlimited requests',
                'Full tipping + Cash App Pay',
                'Basic analytics',
                'Priority support',
                'Custom branding'
              ]}
              cta="Start Free Trial"
              ctaLink="/signup"
              popular={true}
            />
            <PricingCard
              name="Embed Pro"
              price="$49"
              period="/month"
              description="For professionals"
              features={[
                'Everything in Pro',
                'Custom domain widget',
                'Remove "Powered by TipJar"',
                'Advanced branding',
                'White-label options'
              ]}
              cta="Start Free Trial"
              ctaLink="/signup"
            />
          </div>

          {/* Annual Discount Toggle */}
          <div className="text-center mb-12">
            <Card className="inline-block p-6 dark:bg-gray-900 dark:border-gray-800">
              <p className="text-lg font-semibold mb-2 dark:text-white">
                Save 17% with Annual Billing
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pro: $290/year (save $58) • Embed Pro: $490/year (save $98)
              </p>
            </Card>
          </div>

          {/* Comparison Table */}
          <div className="max-w-5xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">
              Feature Comparison
            </h2>
            <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800">
                      <th className="text-left p-4 font-semibold dark:text-white">Feature</th>
                      <th className="text-center p-4 font-semibold dark:text-white">Free</th>
                      <th className="text-center p-4 font-semibold dark:text-white">Pro</th>
                      <th className="text-center p-4 font-semibold dark:text-white">Embed Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Monthly Requests</td>
                      <td className="p-4 text-center dark:text-gray-300">10</td>
                      <td className="p-4 text-center dark:text-gray-300">Unlimited</td>
                      <td className="p-4 text-center dark:text-gray-300">Unlimited</td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Payment Processing</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Cash App Pay</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Analytics Dashboard</td>
                      <td className="p-4 text-center dark:text-gray-300">Basic</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Custom Branding</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Embed Widget</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center dark:text-gray-300">Basic</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b dark:border-gray-800">
                      <td className="p-4 dark:text-gray-300">Custom Domain</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="p-4 dark:text-gray-300">Remove Branding</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center dark:text-gray-300">—</td>
                      <td className="p-4 text-center"><Check className="w-5 h-5 text-tipjar-success-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
              Frequently Asked Questions
            </h2>
            <FAQ
              items={[
                {
                  question: "Do I pay if I don't get tips?",
                  answer: "No! The 3.5% + $0.30 platform fee only applies when you actually receive a tip. If you don't get any tips, you don't pay any fees. The monthly subscription fee (for Pro and Embed Pro) is separate and covers the platform access."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes, you can cancel your subscription instantly at any time. You'll continue to have access until the end of your billing period, and then your account will revert to the Free plan."
                },
                {
                  question: "How quickly do I get paid?",
                  answer: "By default, payouts are automatic and happen daily. If you need money instantly, you can request an instant payout for a 1.5% fee. All payments are processed securely through Stripe."
                },
                {
                  question: "What payment methods do guests use?",
                  answer: "Guests can pay with any major credit card (Visa, Mastercard, Amex, Discover) or Cash App Pay. All payments are processed securely through Stripe, so guests never need to download an app."
                },
                {
                  question: "Can I use this at multiple events?",
                  answer: "Absolutely! Your TipJar link works for all your events. You can generate new QR codes for each event if you want to track them separately, or use the same link everywhere."
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-tipjar-cta-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Making More Money?
          </h2>
          <Link href="/signup">
            <Button 
              size="lg" 
              className="bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6"
            >
              Start Free Trial – No Credit Card
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

