import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
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
  Globe,
  Sparkles,
  TrendingUp,
  Shield,
  Clock
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
  openGraph: {
    title: 'TipJar Live - DJ Tip Collection & Song Request App',
    description: 'The best tip jar app and song request app for DJs. Easy DJ tip collection with QR codes—no app downloads required. Start free, upgrade when you\'re making money.',
    url: 'https://www.tipjar.live',
    siteName: 'TipJar Live',
    images: [
      {
        url: '/assets/tipjar-open-graph-new.png',
        width: 1200,
        height: 630,
        alt: 'TipJar Live - DJ Tip Collection & Song Request App',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TipJar Live - DJ Tip Collection & Song Request App',
    description: 'The best tip jar app and song request app for DJs. Easy DJ tip collection with QR codes—no app downloads required.',
    images: ['/assets/tipjar-open-graph-new.png'],
  },
};

export default function TipJarHomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section - Redesigned */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden pt-24 md:pt-32 pb-20 md:pb-32">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-green-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span className="text-sm font-medium text-white">Trusted by 1,200+ DJs</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Get Tipped Instantly.<br />
                  Request Songs Easily.
                </h1>
                
                <p className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  The simple way for DJs to collect tips and song requests. No app downloads. No awkward conversations. Just instant tips and organized requests—all from any phone browser.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link href="/signup">
                    <Button 
                      size="lg" 
                      className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
                    >
                      Start Free Trial
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
                    >
                      See How It Works
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-emerald-50">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Setup in 2 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Free forever plan</span>
                  </div>
                </div>
              </div>
              
              {/* Right: Visual Mockup */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Phone Mockup */}
                  <div className="bg-gray-900 rounded-[3rem] p-4 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <div className="bg-white rounded-[2.5rem] overflow-hidden">
                      <div className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Music className="w-6 h-6" />
                            <span className="font-bold text-lg">TipJar</span>
                          </div>
                          <QrCode className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Request a Song</h3>
                        <p className="text-emerald-50">Or send a tip to boost your request!</p>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                              <Music className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">Search for a song...</p>
                              <p className="text-sm text-gray-500">Powered by Spotify</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">Send a Tip</p>
                              <p className="text-sm text-gray-600">Support the DJ</p>
                            </div>
                            <DollarSign className="w-8 h-8 text-green-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Badge */}
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">$250K+</p>
                        <p className="text-xs text-gray-600">Tips Collected</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">1,200+ DJs</span>
              <span className="text-gray-600 dark:text-gray-400">using TipJar</span>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">$250K+</span>
              <span className="text-gray-600 dark:text-gray-400">tips collected</span>
            </div>
            <div className="flex items-center space-x-2">
              <Music className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900 dark:text-white">45K+</span>
              <span className="text-gray-600 dark:text-gray-400">song requests</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Secure</span>
              <span className="text-gray-600 dark:text-gray-400">Stripe powered</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Redesigned */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Get started in minutes. No technical knowledge required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create Your TipJar</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Sign up free, customize your branding, and get your unique TipJar link in under 2 minutes. No credit card required.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 right-0 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-transparent transform translate-x-1/2" />
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Share at Your Event</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Display your QR code or share your link. Guests open it on their phone—no app download needed. Works on any device.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 right-0 w-full h-0.5 bg-gradient-to-r from-emerald-200 to-transparent transform translate-x-1/2" />
            </div>
            
            <div>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border border-emerald-100 dark:border-emerald-800 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Get Paid Instantly</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Tips go straight to your account. Song requests appear in your queue. Automatic daily payouts or instant payouts available.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features - Redesigned */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features designed for DJs and performers
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            <FeatureCard
              title="Instant Payment Processing"
              description="Accept tips instantly with credit cards or Cash App Pay. All payments processed securely through Stripe with automatic payouts."
              icon={<CreditCard className="w-8 h-8" />}
            />
            <FeatureCard
              title="Real-Time Song Requests"
              description="Guests request songs with integrated Spotify search. See requests in real-time and manage your queue with priority boosting."
              icon={<Music className="w-8 h-8" />}
            />
            <FeatureCard
              title="No App Download Required"
              description="Guests open your link in any browser. Works on iPhone, Android, or any device. Zero friction, maximum convenience."
              icon={<Smartphone className="w-8 h-8" />}
            />
            <FeatureCard
              title="QR Code Generator"
              description="Generate unique QR codes for each event. Display on your DJ booth TV or print for tables. One scan, instant access."
              icon={<QrCode className="w-8 h-8" />}
            />
            <FeatureCard
              title="Automatic Payouts"
              description="Daily automatic payouts (free) or instant payouts (1.5% fee). Money goes straight to your bank account via Stripe Connect."
              icon={<DollarSign className="w-8 h-8" />}
            />
            <FeatureCard
              title="Analytics Dashboard"
              description="Track your earnings, see request trends, and understand your audience. Export data for taxes and business insights."
              icon={<BarChart3 className="w-8 h-8" />}
            />
            <FeatureCard
              title="Custom Branding"
              description="Add your logo, choose your colors, and customize your welcome message. Make it feel like your brand, not ours."
              icon={<Globe className="w-8 h-8" />}
            />
            <FeatureCard
              title="Embed Widget"
              description="One line of code to embed TipJar on your website. Works on WordPress, Wix, Squarespace, or any site. Fully customizable."
              icon={<Zap className="w-8 h-8" />}
            />
            <FeatureCard
              title="Priority Requests"
              description="Guests can boost their requests with tips. Higher tips = higher priority in your queue. Make more money while playing what people want."
              icon={<TrendingUp className="w-8 h-8" />}
            />
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              Trusted by DJs Everywhere
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              See what DJs are saying about TipJar
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
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
          
          {/* Stats */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 md:p-12 border border-emerald-100 dark:border-emerald-800">
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                    1,200+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">DJs Using TipJar</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                    $250K+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">Tips Collected</div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2">
                    45K+
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">Song Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview - Redesigned */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Start free, upgrade when you&apos;re making money. 3.5% + $0.30 platform fee only when you get paid.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Free Forever</h3>
                <div className="text-4xl font-bold mb-1 text-gray-900 dark:text-white">$0<span className="text-lg text-gray-600 dark:text-gray-400">/month</span></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Perfect for trying it out</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">10 requests/month</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Basic song requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">QR code generation</span>
                </li>
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full border-2 border-gray-300 dark:border-gray-600">
                  Get Started Free
                </Button>
              </Link>
            </div>
            
            {/* Pro Plan - Featured */}
            <div className="bg-gradient-to-br from-emerald-600 to-green-500 text-white rounded-2xl p-8 border-4 border-emerald-300 relative shadow-2xl transform scale-105">
              <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 rounded-bl-xl rounded-tr-2xl text-sm font-bold">
                Most Popular
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-1">$29<span className="text-lg text-emerald-50">/month</span></div>
                <p className="text-sm text-emerald-50">For active DJs</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span>Unlimited requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span>Full tipping + Cash App Pay</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span>Custom branding</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0 mt-0.5" />
                  <span>Analytics dashboard</span>
                </li>
              </ul>
              <Link href="/signup" className="block">
                <Button className="w-full bg-white text-emerald-600 hover:bg-gray-100 font-semibold">
                  Start Free Trial
                </Button>
              </Link>
            </div>
            
            {/* Embed Pro Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Embed Pro</h3>
                <div className="text-4xl font-bold mb-1 text-gray-900 dark:text-white">$49<span className="text-lg text-gray-600 dark:text-gray-400">/month</span></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">For professionals</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Custom domain widget</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">White-label options</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Advanced analytics</span>
                </li>
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="text-center">
            <Link href="/pricing">
              <Button 
                variant="outline"
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-semibold px-8 py-6 text-lg"
              >
                View Full Pricing Details <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA - Redesigned */}
      <section className="py-24 bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ready to Start Making More Money?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed">
              Join 1,200+ DJs who are making more money with TipJar. Setup takes 2 minutes. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-10 py-7 h-auto shadow-2xl hover:shadow-3xl transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-10 py-7 h-auto"
                >
                  Watch Demo
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-emerald-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Secure payments via Stripe</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Setup in 2 minutes</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
                <span>No credit card required</span>
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
