import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureCard } from '@/components/tipjar/FeatureCard';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { StickyCTA } from '@/components/tipjar/StickyCTA';
import {
  CreditCard,
  Music,
  Globe,
  BarChart3,
  DollarSign,
  Palette,
  Smartphone,
  Zap,
  Search,
  Clock,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  QrCode,
  Sparkles
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Song Request App for Events & QR Code Tip Jar | TipJar.Live Features',
  description: 'Complete song request app for events with QR code tip jar functionality. Mobile tip jar, real-time requests, instant payments, and QR code song requests for DJs.',
  keywords: [
    'song request app for events',
    'QR code tip jar',
    'mobile tip jar',
    'QR code song requests DJ',
    'event song request app',
    'tip jar for events'
  ],
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <TipJarHeader />
      
      {/* Hero Section - Redesigned */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 overflow-hidden pt-32 pb-20">
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">Complete Feature Set</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Powerful Features<br />
              Built for DJs
            </h1>
            
            <p className="text-xl md:text-2xl text-emerald-50 mb-8 leading-relaxed max-w-3xl mx-auto">
              Everything you need to collect tips and manage song requests. From instant payments to real-time analytics—all in one simple platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold text-lg px-8 py-6 h-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Instant Payments</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Real-Time Requests</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">No App Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Automatic Payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabbed Features - Redesigned */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              Features for Everyone
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful tools for DJs. Simple experience for guests.
            </p>
          </div>
          
          <Tabs defaultValue="djs" className="max-w-7xl mx-auto">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-16 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
              <TabsTrigger 
                value="djs" 
                className="text-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400 rounded-lg"
              >
                For DJs
              </TabsTrigger>
              <TabsTrigger 
                value="guests" 
                className="text-lg font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-emerald-400 rounded-lg"
              >
                For Guests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="djs" className="space-y-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  title="Instant Payment Processing"
                  description="Accept tips instantly with credit cards or Cash App Pay. All payments processed securely through Stripe with automatic payouts to your bank account."
                  icon={<CreditCard className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Real-Time Dashboard"
                  description="See all tips and song requests as they come in. Monitor your earnings, manage requests, and track performance in real-time with live updates."
                  icon={<BarChart3 className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Priority Song Requests"
                  description="Guests can boost their requests with tips. Higher tips = higher priority in your queue. Keep the dance floor packed with the songs people want most."
                  icon={<Music className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Custom Branding"
                  description="Add your logo, choose your colors, and customize your welcome message. Make it feel like your brand, not ours. Professional appearance guaranteed."
                  icon={<Palette className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Embed Widget"
                  description="One line of code to embed TipJar on your website. Works on WordPress, Wix, Squarespace, or any website. No technical knowledge needed."
                  icon={<Globe className="w-8 h-8" />}
                />
                <FeatureCard
                  title="QR Code Generator"
                  description="Generate unique QR codes for each event. Display on your DJ booth TV, print for tables, or share on social media. Each code is trackable."
                  icon={<QrCode className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Automatic Payouts"
                  description="Daily automatic payouts (free) or instant payouts (1.5% fee). Money goes straight to your bank account. No manual collection needed."
                  icon={<DollarSign className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Analytics & Reports"
                  description="Track your earnings, see request trends, and understand your audience. Export data for tax purposes or business planning."
                  icon={<TrendingUp className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Multi-Event Management"
                  description="Use the same TipJar link for all events, or create separate ones for tracking. Organize and manage multiple events from one dashboard."
                  icon={<Users className="w-8 h-8" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="guests" className="space-y-12">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  title="No App Download"
                  description="Open the link on your phone and start tipping. Works in any browser - no app download, no account creation, no hassle. Just scan and go."
                  icon={<Smartphone className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Easy Song Requests"
                  description="Search for songs with our integrated Spotify search. Request your favorite tracks and see them added to the DJ's queue instantly."
                  icon={<Search className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Quick Payment"
                  description="Tip with any credit card or Cash App Pay. Secure, fast checkout that takes seconds. No need to carry cash or download apps."
                  icon={<CreditCard className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Priority Requests"
                  description="Want your song played next? Add a tip to boost your request to the top of the queue. Higher tips = higher priority."
                  icon={<Zap className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Instant Confirmation"
                  description="Get instant confirmation when your tip is processed and your request is added. See your request status in real-time."
                  icon={<Clock className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Secure Payments"
                  description="All payments processed securely through Stripe. Your card information is never stored. Safe, trusted, and reliable."
                  icon={<Shield className="w-8 h-8" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Feature Highlights - Visual Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 dark:text-white">
              See It In Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Beautiful, intuitive interfaces for both DJs and guests
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* DJ Dashboard Preview */}
            <Card className="p-8 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 mb-6 aspect-[9/16] flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Dashboard Preview
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Real-time analytics & request management
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 dark:text-white">DJ Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Real-time view of all tips and requests. Manage your queue, see earnings, and track performance with beautiful, easy-to-read charts.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Live earnings tracker</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Request queue management</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Performance analytics</span>
                </li>
              </ul>
            </Card>
            
            {/* Guest Experience Preview */}
            <Card className="p-8 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl transition-shadow">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 mb-6 aspect-[9/16] flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800">
                <div className="text-center">
                  <Smartphone className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    Guest View Preview
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Clean, mobile-optimized interface
                  </p>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 dark:text-white">Guest Experience</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Clean, mobile-optimized interface. Guests can tip and request songs in seconds with an intuitive, beautiful design.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">One-tap song requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Fast, secure checkout</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300 text-sm">Works on any device</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">Lightning Fast</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Setup takes 2 minutes. Payments process instantly. Requests appear in real-time. No waiting, no delays.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">Bank-Level Security</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  All payments processed through Stripe. Your data is encrypted and secure. We never store card information.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">Works Everywhere</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No app downloads required. Works on iPhone, Android, tablets, or any device with a browser. Universal compatibility.
                </p>
              </div>
            </div>
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
              Ready to Try All These Features?
            </h2>
            <p className="text-xl md:text-2xl text-emerald-50 mb-10 leading-relaxed">
              Start your free trial today. No credit card required. Get access to all features in under 2 minutes.
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
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <TipJarFooter />
      <StickyCTA />
    </div>
  );
}
