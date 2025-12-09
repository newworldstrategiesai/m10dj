import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeatureCard } from '@/components/tipjar/FeatureCard';
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
  Users
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
      {/* Hero Section */}
      <section className="bg-tipjar-gradient dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-4">
            Song Request App for Events<br />& QR Code Tip Jar
          </h1>
          <p className="text-xl text-center text-gray-300 max-w-2xl mx-auto">
            Complete song request app for events with QR code tip jar functionality. Mobile tip jar, real-time requests, and instant payments—all in one platform.
          </p>
        </div>
      </section>

      {/* Tabbed Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="djs" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-12">
              <TabsTrigger value="djs" className="text-lg">For DJs</TabsTrigger>
              <TabsTrigger value="guests" className="text-lg">For Guests</TabsTrigger>
            </TabsList>

            <TabsContent value="djs" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  title="Instant Payment Processing"
                  description="Accept tips instantly with credit cards or Cash App Pay. All payments processed securely through Stripe with automatic payouts to your bank account."
                  icon={<CreditCard className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Real-Time Dashboard"
                  description="See all tips and song requests as they come in. Monitor your earnings, manage requests, and track performance in real-time."
                  icon={<BarChart3 className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Priority Song Requests"
                  description="Guests can boost their requests with tips. Higher tips = higher priority in your queue. Keep the dance floor packed with the songs people want most."
                  icon={<Music className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Custom Branding"
                  description="Add your logo, choose your colors, and customize your welcome message. Make it feel like your brand, not ours."
                  icon={<Palette className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Embed Widget"
                  description="One line of code to embed TipJar on your website. Works on WordPress, Wix, Squarespace, or any website. No technical knowledge needed."
                  icon={<Globe className="w-8 h-8" />}
                />
                <FeatureCard
                  title="QR Code Generator"
                  description="Generate QR codes for each event. Display on your DJ booth TV, print for tables, or share on social media. Each code is unique and trackable."
                  icon={<Zap className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Automatic Payouts"
                  description="Daily automatic payouts (free) or instant payouts (1.5% fee). Money goes straight to your bank account. No manual collection needed."
                  icon={<DollarSign className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Analytics & Reports"
                  description="Track your earnings, see request trends, and understand your audience. Export data for tax purposes or business planning."
                  icon={<BarChart3 className="w-8 h-8" />}
                />
                <FeatureCard
                  title="Multi-Event Management"
                  description="Use the same TipJar link for all events, or create separate ones for tracking. Organize and manage multiple events from one dashboard."
                  icon={<Users className="w-8 h-8" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="guests" className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  title="No App Download"
                  description="Open the link on your phone and start tipping. Works in any browser - no app download, no account creation, no hassle."
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

      {/* Screenshots Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 dark:text-white">
            See It In Action
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 mb-4 aspect-[9/16] flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Dashboard Screenshot<br />
                  (Replace with actual screenshot)
                </p>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">DJ Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time view of all tips and requests. Manage your queue, see earnings, and track performance.
              </p>
            </Card>
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 mb-4 aspect-[9/16] flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Guest View Screenshot<br />
                  (Replace with actual screenshot)
                </p>
              </div>
              <h3 className="text-xl font-bold mb-2 dark:text-white">Guest Experience</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Clean, mobile-optimized interface. Guests can tip and request songs in seconds.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-tipjar-cta-gradient">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
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
    </div>
  );
}
