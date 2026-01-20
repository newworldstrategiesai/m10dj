import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { FeatureCard } from '@/components/tipjar/FeatureCard';
import { StickyCTA } from '@/components/tipjar/StickyCTA';
import {
  Mic,
  Users,
  Clock,
  Smartphone,
  Zap,
  Music,
  CheckCircle,
  ArrowRight,
  QrCode,
  Monitor,
  Bell,
  DollarSign,
  Star,
  Calendar,
  Sparkles,
  Radio
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Karaoke Mode Coming Soon to TipJar Live | DJ Karaoke Management',
  description: 'Professional karaoke queue management for DJs. Coming soon to TipJar Live - manage karaoke signups, SMS notifications, group requests, and display screens for events.',
  keywords: [
    'karaoke queue management',
    'DJ karaoke app',
    'karaoke signup app',
    'event karaoke management',
    'karaoke queue display',
    'SMS karaoke notifications',
    'DJ karaoke software',
    'karaoke management system',
    'event karaoke app'
  ],
  openGraph: {
    title: 'Karaoke Mode Coming Soon - TipJar Live',
    description: 'Professional karaoke queue management for DJs. Manage karaoke signups, SMS notifications, group requests, and display screens for events.',
    url: 'https://www.tipjar.live/karaoke',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-og-image.png',
        width: 1200,
        height: 630,
        alt: 'Karaoke Mode Coming Soon to TipJar Live',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karaoke Mode Coming Soon - TipJar Live',
    description: 'Professional karaoke queue management for DJs. Manage karaoke signups, SMS notifications, group requests, and display screens.',
    images: ['/assets/tipjar-og-image.png'],
  },
};

export default function KaraokePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 overflow-hidden pt-24 md:pt-32 pb-20 md:pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-white">Coming Soon to TipJar Live</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Professional Karaoke<br />
                  <span className="text-purple-200">Queue Management</span>
                </h1>

                <p className="text-xl md:text-2xl text-purple-50 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Take your karaoke events to the next level. Manage signups, send SMS notifications, handle groups, and display queues on TV screens—all integrated with your existing TipJar workflow.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button
                    size="lg"
                    asChild
                    className="bg-white text-purple-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
                  >
                    <Link href="/signup">
                      Join Waitlist
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Link href="/features">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
                    >
                      Explore TipJar Features
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-purple-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Integrated with TipJar</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>SMS Notifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>TV Display Support</span>
                  </div>
                </div>
              </div>

              {/* Right: Visual Mockup */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden">
                      <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Mic className="w-6 h-6" />
                            <span className="font-bold text-lg">TipJar Karaoke</span>
                          </div>
                          <QrCode className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Sign Up to Sing!</h3>
                        <p className="text-purple-50">Solo, duo, or group karaoke</p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Mic className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Choose your song...</p>
                              <p className="text-sm text-gray-600">Search our database</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Group Size</p>
                              <p className="text-sm text-gray-600">Solo • Duo • Trio • Group</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Bell className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Phone Number</p>
                              <p className="text-sm text-gray-600">Get SMS when you're up!</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating notification */}
                  <div className="absolute -right-4 top-1/2 transform translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span className="font-semibold">You're next!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Karaoke Made Professional
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Everything you need to run smooth, organized karaoke events. From signup to stage, manage every singer with professional tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                title="Smart Queue Management"
                description="Automatic queue organization with priority placement, rotation fairness, and real-time status updates. No more paper lists or lost signups."
                icon={<Clock className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Group Karaoke Support"
                description="Handle solos, duos, trios, and large groups seamlessly. Track individual singers within groups for fair rotation."
                icon={<Users className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="SMS Notifications"
                description="Automatic text messages when singers are next up or currently singing. No more shouting across the room."
                icon={<Bell className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="TV Display Integration"
                description="Show the karaoke queue on venue TV screens. Singers can see their position and upcoming songs from anywhere."
                icon={<Monitor className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Priority Placement"
                description="Optional paid priority system lets singers skip the line. Perfect for special occasions or VIP guests."
                icon={<Zap className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Song Database"
                description="Built-in song search with popular tracks, artist information, and easy song selection for all skill levels."
                icon={<Music className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Mobile-First Design"
                description="Works perfectly on phones, tablets, and computers. No app downloads required - just scan and sing."
                icon={<Smartphone className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Real-Time Updates"
                description="Live queue updates, instant notifications, and synchronized displays keep everyone in the loop."
                icon={<Radio className="w-8 h-8 text-purple-500" />}
              />

              <FeatureCard
                title="Integrated Analytics"
                description="Track popular songs, wait times, completion rates, and optimize your karaoke events over time."
                icon={<Star className="w-8 h-8 text-purple-500" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                How Karaoke Mode Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Three simple steps to professional karaoke management
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Share Your Link</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Display your unique karaoke signup QR code or share your link. Guests scan with their phone - no app downloads needed.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mic className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Manage Signups</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  View all karaoke requests in real-time. Organize the queue, send SMS notifications, and track who's singing next.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Monitor className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Display on Screen</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Show the karaoke queue on venue TV screens. Singers can see their position and get notified when it's their turn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Coming Soon</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Elevate Your Karaoke Events?
            </h2>

            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join the waitlist to be the first to know when karaoke mode launches. We'll notify you as soon as it's available in your TipJar dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="bg-white text-purple-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
              >
                <Link href="/signup">
                  Join Waitlist
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
              >
                <Link href="/pricing">
                  View TipJar Pricing
                </Link>
              </Button>
            </div>

            <div className="mt-8 text-purple-200">
              <p className="text-sm">
                Karaoke mode will be included with Pro and Professional plans at no extra cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  When will karaoke mode be available?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We're currently in the final stages of development and testing. We expect to launch karaoke mode within the next few weeks. Join our waitlist to be notified as soon as it's available.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  How much will karaoke mode cost?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Karaoke mode will be included at no extra cost for all Pro and Professional plan subscribers. Free plan users will have access to basic karaoke features with usage limits.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Do singers need to download an app?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No! Just like the rest of TipJar, karaoke signup works entirely in web browsers. Singers scan your QR code, open the link on their phone, and sign up - no downloads required.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Can I use karaoke mode with my existing TipJar setup?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Absolutely! Karaoke mode integrates seamlessly with your existing TipJar account. You'll access it from the same dashboard, and it uses your existing branding and settings.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  What SMS carriers do you support for notifications?
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We support all major US carriers including Verizon, AT&T, T-Mobile, and more. SMS notifications are sent through our secure, PCI-compliant messaging service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TipJarFooter />
      <StickyCTA />
    </div>
  );
}