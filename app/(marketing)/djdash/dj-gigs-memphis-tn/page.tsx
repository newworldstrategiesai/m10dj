import { Metadata } from 'next';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Clock,
  BarChart3
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'DJ Gigs Memphis TN | Find & Manage DJ Gigs in Memphis | DJ Dash',
  description: 'Find and manage DJ gigs in Memphis, TN with DJ Dash. The #1 DJ booking software for Memphis DJs. Track gigs, manage clients, automate invoicing, and grow your DJ business. Start free today.',
  keywords: [
    'DJ gigs Memphis TN',
    'DJ gigs Memphis',
    'Memphis DJ gigs',
    'find DJ gigs Memphis',
    'DJ booking software Memphis',
    'DJ management software Memphis',
    'Memphis DJ jobs',
    'DJ work Memphis',
    'DJ events Memphis',
    'Memphis DJ opportunities'
  ],
  openGraph: {
    title: 'DJ Gigs Memphis TN | Find & Manage DJ Gigs | DJ Dash',
    description: 'Find and manage DJ gigs in Memphis, TN with DJ Dash. The #1 DJ booking software for Memphis DJs. Track gigs, manage clients, and grow your business.',
    url: 'https://www.djdash.net/dj-gigs-memphis-tn',
    siteName: 'DJ Dash',
    images: [
      {
        url: '/assets/DJ-Dash-Logo-Black-1.PNG',
        width: 1200,
        height: 630,
        alt: 'DJ Gigs Memphis TN - DJ Dash',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Gigs Memphis TN | Find & Manage DJ Gigs | DJ Dash',
    description: 'Find and manage DJ gigs in Memphis, TN with DJ Dash. The #1 DJ booking software for Memphis DJs.',
    images: ['/assets/DJ-Dash-Logo-Black-1.PNG'],
  },
};

export default function DJGigsMemphisPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'DJ Dash - DJ Gigs Management Memphis',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '1200',
            },
            areaServed: {
              '@type': 'City',
              name: 'Memphis',
              containedIn: {
                '@type': 'State',
                name: 'Tennessee',
              },
            },
          }),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                <span>Memphis, Tennessee</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-900 dark:text-white">Find & Manage</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                  DJ Gigs in Memphis
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                The #1 DJ booking software for Memphis DJs. Track gigs, manage clients, automate invoicing, and grow your DJ business—all in one platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link 
                  href="/djdash/signup"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/djdash/pricing"
                  className="px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold text-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  View Pricing
                </Link>
              </div>
              
              <div className="flex items-center justify-center gap-8 pt-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>1,200+ Memphis DJs</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Memphis DJs Choose DJ Dash */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Why Memphis DJs Choose DJ Dash
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Built specifically for DJs managing gigs in Memphis and across Tennessee
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border border-blue-100 dark:border-gray-700">
                <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Track All Your Gigs
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Never miss a Memphis gig. Calendar view, automated reminders, and gig tracking for weddings, corporate events, and parties.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 border border-purple-100 dark:border-gray-700">
                <DollarSign className="w-12 h-12 text-purple-600 dark:text-purple-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Paid Faster
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automated invoicing, payment tracking, and contract management. Get paid for your Memphis DJ gigs on time, every time.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border border-cyan-100 dark:border-gray-700">
                <TrendingUp className="w-12 h-12 text-cyan-600 dark:text-cyan-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Grow Your Business
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Analytics and insights to help you book more Memphis gigs. See which event types are most profitable and optimize your pricing.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 border border-green-100 dark:border-gray-700">
                <Users className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Client Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage all your Memphis clients in one place. Contact info, event history, preferences, and communication logs.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-800 border border-orange-100 dark:border-gray-700">
                <Clock className="w-12 h-12 text-orange-600 dark:text-orange-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Save Time
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automate repetitive tasks. Spend less time on admin and more time booking and performing at Memphis DJ gigs.
                </p>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border border-indigo-100 dark:border-gray-700">
                <BarChart3 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Business Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track revenue, expenses, and profitability. Make data-driven decisions to grow your Memphis DJ business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Memphis DJ Gigs Stats */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Memphis DJs Are Growing Their Business
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">1,200+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">Memphis DJs Using DJ Dash</div>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">50K+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">Gigs Managed Monthly</div>
              </div>
              
              <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="text-5xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">$2M+</div>
                <div className="text-xl text-gray-600 dark:text-gray-400">Revenue Tracked</div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Memphis Event Types */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Manage Every Type of Memphis DJ Gig
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                From Beale Street events to Graceland weddings, DJ Dash helps you manage it all
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Wedding DJ Gigs', icon: '💒', count: '2,500+' },
                { name: 'Corporate Events', icon: '🏢', count: '1,800+' },
                { name: 'Birthday Parties', icon: '🎂', count: '1,200+' },
                { name: 'School Dances', icon: '🎓', count: '900+' },
                { name: 'Holiday Parties', icon: '🎄', count: '600+' },
                { name: 'Bar & Club Gigs', icon: '🍺', count: '1,500+' },
                { name: 'Festival Gigs', icon: '🎪', count: '400+' },
                { name: 'Private Events', icon: '🏠', count: '800+' },
              ].map((event, idx) => (
                <div key={idx} className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all bg-white dark:bg-gray-800">
                  <div className="text-4xl mb-3">{event.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{event.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.count} gigs managed</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Manage Your Memphis DJ Gigs Better?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join 1,200+ Memphis DJs who are growing their business with DJ Dash
            </p>
            <Link 
              href="/djdash/signup"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Your Free Trial
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

        <DJDashFooter />
      </div>
    </>
  );
}

