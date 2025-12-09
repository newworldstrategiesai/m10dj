import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/tipjar/FeatureCard';
import { TestimonialCard } from '@/components/tipjar/TestimonialCard';
import { StickyCTA } from '@/components/tipjar/StickyCTA';
import {
  CreditCard,
  Music,
  Smartphone,
  Zap,
  DollarSign,
  BarChart3,
  CheckCircle,
  ArrowRight,
  QrCode,
  Globe
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tip Jar App & Song Request App | DJ Tip Collection Made Easy | TipJar.Live',
  description: 'The best tip jar app and song request app for DJs. Easy DJ tip collection with QR codes—no app downloads required. Start free, upgrade when you\'re making money.',
  keywords: [
    'tip jar app',
    'song request app',
    'DJ tip collection',
    'song request app for events',
    'QR code tip jar',
    'event tipping app',
    'mobile tip jar',
    'DJ song request app'
  ],
};

export default function TipJarHomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="bg-tipjar-gradient dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Tip Jar App & Song Request App<br />
              Easy DJ Tip Collection
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              The best tip jar app and song request app for DJs. Easy DJ tip collection with QR codes—no app downloads required. Just instant tips and organized song requests from any phone browser.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold uppercase tracking-wider text-lg px-8 py-6"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              No credit card required • Free forever plan available • Setup in 2 minutes
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Create Your TipJar</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sign up free, customize your branding, and get your unique TipJar link in under 2 minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Share at Your Event</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Display your QR code or share your link. Guests open it on their phone—no app download needed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-tipjar-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 dark:text-white">Get Paid Instantly</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tips go straight to your account. Song requests appear in your queue. Automatic daily payouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TipJar - Keyword Rich Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 dark:text-white">
              The Best Tip Jar App & Song Request App for DJs
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              TipJar is the leading tip jar app and song request app designed specifically for DJs. Our DJ tip collection platform makes it easy to collect tips and manage song requests at any event—weddings, parties, corporate events, and more.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2 dark:text-white">Tip Jar App</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  The easiest tip jar app for DJs. Collect tips instantly with QR codes—no app downloads required.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2 dark:text-white">Song Request App</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Complete song request app for events. Guests request songs with integrated Spotify search.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2 dark:text-white">DJ Tip Collection</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Simple DJ tip collection that works. Automatic payouts, real-time analytics, and organized requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              title="Instant Payment Processing"
              description="Accept tips instantly with credit cards or Cash App Pay. All payments processed securely through Stripe."
              icon={<CreditCard className="w-8 h-8" />}
            />
            <FeatureCard
              title="Real-Time Song Requests"
              description="Guests request songs with integrated Spotify search. See requests in real-time and manage your queue."
              icon={<Music className="w-8 h-8" />}
            />
            <FeatureCard
              title="No App Download Required"
              description="Guests open your link in any browser. Works on iPhone, Android, or any device. Zero friction."
              icon={<Smartphone className="w-8 h-8" />}
            />
            <FeatureCard
              title="QR Code Generator"
              description="Generate unique QR codes for each event. Display on your DJ booth TV or print for tables."
              icon={<QrCode className="w-8 h-8" />}
            />
            <FeatureCard
              title="Automatic Payouts"
              description="Daily automatic payouts (free) or instant payouts (1.5% fee). Money goes straight to your bank account."
              icon={<DollarSign className="w-8 h-8" />}
            />
            <FeatureCard
              title="Analytics Dashboard"
              description="Track your earnings, see request trends, and understand your audience. Export data for taxes."
              icon={<BarChart3 className="w-8 h-8" />}
            />
            <FeatureCard
              title="Custom Branding"
              description="Add your logo, choose your colors, and customize your welcome message. Make it feel like your brand."
              icon={<Globe className="w-8 h-8" />}
            />
            <FeatureCard
              title="Embed Widget"
              description="One line of code to embed TipJar on your website. Works on WordPress, Wix, Squarespace, or any site."
              icon={<Zap className="w-8 h-8" />}
            />
            <FeatureCard
              title="Priority Requests"
              description="Guests can boost their requests with tips. Higher tips = higher priority in your queue."
              icon={<Zap className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 dark:text-white">
            Trusted by DJs Everywhere
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            <TestimonialCard
              quote="I've made $500+ in tips at a single wedding. TipJar makes it so easy for guests to tip—no awkward conversations needed."
              author="Mike R."
              location="Wedding DJ"
            />
            <TestimonialCard
              quote="The song request feature is a game-changer. No more shouting requests at me—everything is organized and I can see what people want."
              author="Sarah K."
              location="Event DJ"
            />
            <TestimonialCard
              quote="Setup took 2 minutes. I use it at every event now. The automatic payouts are perfect—I don't have to think about it."
              author="DJ Marcus"
              location="Corporate Event DJ"
            />
          </div>
          <div className="text-center">
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-tipjar-primary-600 dark:text-tipjar-primary-400 mb-2">1,200+</div>
                <div className="text-gray-600 dark:text-gray-400">DJs Using TipJar</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-tipjar-primary-600 dark:text-tipjar-primary-400 mb-2">$250K+</div>
                <div className="text-gray-600 dark:text-gray-400">Tips Collected</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-tipjar-primary-600 dark:text-tipjar-primary-400 mb-2">45K+</div>
                <div className="text-gray-600 dark:text-gray-400">Song Requests</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 dark:text-white">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Start free, upgrade when you're making money. 3.5% + $0.30 platform fee only when you get paid.
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 dark:text-white">Free Forever</h3>
                <div className="text-3xl font-bold mb-4 dark:text-white">$0<span className="text-lg text-gray-600 dark:text-gray-400">/month</span></div>
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">10 requests/month</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Basic features</span>
                  </li>
                </ul>
              </div>
              <div className="bg-tipjar-primary-600 text-white rounded-xl p-6 border-4 border-tipjar-success-500 relative">
                <div className="absolute top-0 right-0 bg-tipjar-success-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-4">$29<span className="text-lg text-tipjar-primary-100">/month</span></div>
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited requests</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Full tipping + Cash App Pay</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom branding</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-2 dark:text-white">Embed Pro</h3>
                <div className="text-3xl font-bold mb-4 dark:text-white">$49<span className="text-lg text-gray-600 dark:text-gray-400">/month</span></div>
                <ul className="space-y-2 text-left mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">Custom domain widget</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300 text-sm">White-label options</span>
                  </li>
                </ul>
              </div>
            </div>
            <Link href="/pricing">
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-tipjar-primary-600 text-tipjar-primary-600 hover:bg-tipjar-primary-600 hover:text-white font-semibold uppercase tracking-wider text-lg px-8 py-6"
              >
                View Full Pricing <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-tipjar-cta-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Making More Money?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join 1,200+ DJs who are making more money with TipJar. Setup takes 2 minutes. No credit card required.
          </p>
          <Link href="/signup">
            <Button 
              size="lg" 
              className="bg-white text-tipjar-primary-600 hover:bg-gray-100 font-semibold uppercase tracking-wider text-lg px-8 py-6"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <StickyCTA />
    </div>
  );
}

