import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PricingCard } from '@/components/tipjar/PricingCard';
import { Card } from '@/components/ui/card';
import { FAQ } from '@/components/tipjar/FAQ';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { 
  Check, 
  Zap, 
  Shield, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Smartphone,
  BarChart3,
  Globe,
  Sparkles,
  ArrowRight,
  Star,
  Clock,
  DollarSign,
  Gift,
  Music
} from 'lucide-react';

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
  openGraph: {
    title: 'TipJar Live Pricing - Best Tip Jar App for DJs',
    description: 'Pricing for the best tip jar app for DJs and event tipping app. Start free, upgrade when you\'re making money. All plans include 3.5% + $0.30 platform fee only when you get paid.',
    url: 'https://www.tipjar.live/pricing',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-og-image.png',
        width: 1200,
        height: 630,
        alt: 'TipJar Live Pricing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJar Live Pricing - Best Tip Jar App for DJs',
    description: 'Start free, upgrade when you\'re making money. All plans include 3.5% + $0.30 platform fee only when you get paid.',
    images: ['/assets/tipjar-og-image.png'],
  },
};

export default function PricingPage() {
  const valueProps = [
    {
      icon: Zap,
      title: 'No Setup Fees',
      description: 'Start completely free. Only pay when you upgrade and start making money.'
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Bank-level security with Stripe. Your money and your guests\' data are protected.'
    },
    {
      icon: TrendingUp,
      title: 'Increase Tips',
      description: 'DJs report 2-3x more tips with TipJar compared to traditional methods.'
    },
    {
      icon: Clock,
      title: 'Daily Payouts',
      description: 'Get paid automatically every day. Need it faster? Instant payouts available.'
    }
  ];

  const useCases = [
    {
      title: 'Wedding DJs',
      description: 'Collect tips and song requests seamlessly during receptions',
      icon: Gift
    },
    {
      title: 'Event DJs',
      description: 'Perfect for corporate events, parties, and celebrations',
      icon: Users
    },
    {
      title: 'Mobile DJs',
      description: 'Take your tip jar anywhere with QR codes and mobile links',
      icon: Smartphone
    },
    {
      title: 'Club DJs',
      description: 'Let guests request songs and tip directly from their phones',
      icon: Music
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-600 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/30 dark:bg-white/20 backdrop-blur-md border border-white/40 dark:border-white/30 rounded-full px-4 py-2 mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm text-white font-semibold">No credit card required • Cancel anytime</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Simple Pricing That
              <span className="block text-white">Grows With You</span>
            </h1>
            <p className="text-xl md:text-2xl text-white max-w-2xl mx-auto mb-8 leading-relaxed">
              Start free forever. Upgrade when you&apos;re ready to make more money. 
              <span className="block mt-2 font-semibold">Only pay fees when you get paid.</span>
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-white text-sm font-medium">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-400" />
                <span>14-day free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {valueProps.map((prop, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 dark:from-emerald-600 dark:to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <prop.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {prop.title}
                </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {prop.description}
            </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              All plans include secure payment processing. 
              <span className="font-semibold text-gray-900 dark:text-white">3.5% + $0.30</span> platform fee only applies when you receive a tip.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            <PricingCard
              name="Free Forever"
              price="$0"
              period="/month"
              description="Perfect for trying out TipJar"
              features={[
                '10 song requests/month',
                'Basic request management',
                'QR code generation',
                'Community support',
                'No payment processing'
              ]}
              cta="Get Started Free"
              ctaLink="/signup"
            />
            <PricingCard
              name="Pro"
              price="$29"
              period="/month"
              description="Most Popular - For active DJs"
              features={[
                'Unlimited song requests',
                'Full payment processing',
                'Cash App Pay integration',
                'Basic analytics dashboard',
                'Custom branding & colors',
                'Priority email support',
                'QR codes & shareable links'
              ]}
              cta="Start Free Trial"
              ctaLink="/signup"
              popular={true}
            />
            <PricingCard
              name="Embed Pro"
              price="$49"
              period="/month"
              description="For professional DJ businesses"
              features={[
                'Everything in Pro',
                'Custom domain widget',
                'Remove "Powered by TipJar"',
                'Advanced analytics & reports',
                'White-label options',
                'API access',
                'Dedicated support',
                'Multi-event management'
              ]}
              cta="Start Free Trial"
              ctaLink="/signup"
            />
          </div>

          {/* Annual Billing Discount */}
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Save 17% with Annual Billing
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Pro: <span className="font-semibold text-gray-900 dark:text-white">$290/year</span> (save $58) • 
                    Embed Pro: <span className="font-semibold text-gray-900 dark:text-white">$490/year</span> (save $98)
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                >
                  Learn More
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Perfect For Every Type of DJ
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Whether you&apos;re a wedding DJ, club DJ, or mobile DJ, TipJar works for you
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {useCases.map((useCase, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow dark:bg-gray-900 dark:border-gray-800">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {useCase.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Compare Plans
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                See exactly what&apos;s included in each plan
              </p>
            </div>
            <Card className="overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left p-4 font-semibold text-gray-900 dark:text-white">Feature</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Free</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white bg-emerald-50 dark:bg-emerald-900/20">Pro</th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-white">Embed Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: 'Monthly Song Requests', free: '10', pro: 'Unlimited', embed: 'Unlimited' },
                      { feature: 'Payment Processing', free: '—', pro: '✓', embed: '✓' },
                      { feature: 'Cash App Pay', free: '—', pro: '✓', embed: '✓' },
                      { feature: 'Analytics Dashboard', free: 'Basic', pro: 'Full', embed: 'Advanced' },
                      { feature: 'Custom Branding', free: '—', pro: '✓', embed: '✓' },
                      { feature: 'QR Codes', free: '✓', pro: '✓', embed: '✓' },
                      { feature: 'Embed Widget', free: '—', pro: 'Basic', embed: 'Advanced' },
                      { feature: 'Custom Domain', free: '—', pro: '—', embed: '✓' },
                      { feature: 'Remove Branding', free: '—', pro: '—', embed: '✓' },
                      { feature: 'API Access', free: '—', pro: '—', embed: '✓' },
                      { feature: 'Support', free: 'Community', pro: 'Priority', embed: 'Dedicated' },
                    ].map((row, index) => (
                      <tr key={index} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{row.feature}</td>
                        <td className="p-4 text-center text-gray-700 dark:text-gray-300">{row.free}</td>
                        <td className="p-4 text-center bg-emerald-50/50 dark:bg-emerald-900/10">
                          {row.pro === '✓' ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300">{row.pro}</span>
                          )}
                        </td>
                        <td className="p-4 text-center text-gray-700 dark:text-gray-300">
                          {row.embed === '✓' ? (
                            <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          ) : (
                            <span>{row.embed}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Trusted by hundreds of DJs nationwide
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
              &quot;TipJar increased my tips by 200% in the first month. The setup was so easy, and my guests love being able to request songs and tip from their phones.&quot;
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                DJ
              </div>
              <span className="font-medium">DJ Mike, Wedding DJ</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Everything you need to know about TipJar pricing
              </p>
            </div>
            <FAQ
              items={[
                {
                  question: "Do I pay if I don't get tips?",
                  answer: "No! The 3.5% + $0.30 platform fee only applies when you actually receive a tip. If you don't get any tips, you don't pay any fees. The monthly subscription fee (for Pro and Embed Pro) is separate and covers the platform access."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes, you can cancel your subscription instantly at any time. You'll continue to have access until the end of your billing period, and then your account will revert to the Free plan. No questions asked, no penalties."
                },
                {
                  question: "How quickly do I get paid?",
                  answer: "By default, payouts are automatic and happen daily. Your tips are deposited directly to your bank account. If you need money instantly, you can request an instant payout for a 1.5% fee. All payments are processed securely through Stripe."
                },
                {
                  question: "What payment methods do guests use?",
                  answer: "Guests can pay with any major credit card (Visa, Mastercard, Amex, Discover) or Cash App Pay. All payments are processed securely through Stripe, so guests never need to download an app or create an account."
                },
                {
                  question: "Can I use this at multiple events?",
                  answer: "Absolutely! Your TipJar link works for all your events. You can generate new QR codes for each event if you want to track them separately, or use the same link everywhere. Pro and Embed Pro plans include multi-event management."
                },
                {
                  question: "Is there a free trial?",
                  answer: "Yes! Pro and Embed Pro plans come with a 14-day free trial. You can explore all features risk-free. No credit card required to start your trial."
                },
                {
                  question: "What happens if I exceed my free plan limits?",
                  answer: "If you exceed 10 requests on the Free plan, you'll be prompted to upgrade. Your existing requests remain accessible, and you can upgrade at any time to continue accepting unlimited requests."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied for any reason, contact us within 30 days for a full refund."
                }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-tipjar-cta-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Increase Your Tips?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of DJs who are making more money with TipJar. 
            Start your free trial today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              asChild
              className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Link href="/how-it-works">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 font-semibold text-lg px-8 py-6"
              >
                See How It Works
              </Button>
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-6">
            ✓ 14-day free trial • ✓ No credit card required • ✓ Cancel anytime
          </p>
        </div>
      </section>
      
      <TipJarFooter />
    </div>
  );
}
