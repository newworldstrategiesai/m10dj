import { Metadata } from 'next';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  Play, 
  CheckCircle, 
  Users, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Music, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  ArrowRight,
  Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Find a DJ | DJ Directory | DJ Booking Software | DJ Dash',
  description: 'Find professional DJs in your city or manage your DJ business with DJ Dash. The #1 DJ directory and booking software. Connect with 1,200+ verified DJs nationwide. Free quotes. Start your search or grow your business today.',
  keywords: [
    'find a DJ',
    'DJ directory',
    'DJs near me',
    'DJs in Memphis',
    'DJs in Nashville',
    'wedding DJs',
    'corporate DJs',
    'find DJ',
    'DJ booking',
    'DJ booking software',
    'DJ CRM',
    'DJ business management',
    'DJ management software',
    'DJ gigs',
    'DJ leads',
    'hire a DJ',
    'DJ services'
  ],
  openGraph: {
    title: 'DJ Dash - DJ Booking Software & DJ CRM',
    description: 'The best DJ booking software and DJ CRM for managing your entire DJ business. Handle bookings, client management, contracts, invoicing, and analytics all in one platform. Trusted by 1,200+ professional DJs.',
    url: 'https://www.djdash.net',
    siteName: 'DJ Dash',
    images: [
      {
        url: '/assets/DJ-Dash-Logo-Black-1.PNG', // Fallback to logo until OG image is created
        width: 1200,
        height: 630,
        alt: 'DJ Dash - DJ Booking Software & DJ CRM',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Dash - DJ Booking Software & DJ CRM',
    description: 'The best DJ booking software and DJ CRM for managing your entire DJ business. Trusted by 1,200+ professional DJs.',
    images: ['/assets/DJ-Dash-Logo-Black-1.PNG'],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'DJ Dash - DJ Gigs Management Software',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              priceValidUntil: '2025-12-31',
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              ratingCount: '1200',
              bestRating: '5',
              worstRating: '1',
            },
            featureList: [
              'DJ Gig Tracking',
              'Client Management',
              'Automated Invoicing',
              'Contract Management',
              'Payment Processing',
              'Calendar Management',
              'Analytics & Reporting',
            ],
            areaServed: {
              '@type': 'Country',
              name: 'United States',
            },
          }),
        }}
      />
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <DJDashHeader />
      
      {/* Epic Hero Section */}
      <section className="relative pt-32 pb-24 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Futuristic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-20"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trusted by 1,200+ Professional DJs</span>
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.1] tracking-tight">
                  <span className="block text-gray-900 dark:text-white">Find a DJ</span>
                  <span className="block bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent">
                    Or Grow Your
                  </span>
                  <span className="block text-gray-900 dark:text-white">DJ Business</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
                  The #1 DJ directory and booking software. Find professional DJs in your city or manage your DJ business with powerful tools. Connect with 1,200+ verified DJs nationwide.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/djdash/signup"
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                >
                  <Play className="mr-2 w-5 h-5" />
                  <span>Watch Demo</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>$4.5M+ revenue processed</span>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Glassmorphism Card */}
                <div className="relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 overflow-hidden">
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                  
                  {/* Content */}
                  <div className="relative space-y-6">
                    {/* Header Bar */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">DJ Dash Dashboard</div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-xl p-4 border border-blue-200/50 dark:border-blue-800/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">1,200+</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Active DJs</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl p-4 border border-purple-200/50 dark:border-purple-800/50">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">$4.5M+</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Revenue</div>
                      </div>
                    </div>

                    {/* Chart Area */}
                    <div className="h-48 bg-gradient-to-br from-gray-100/50 to-gray-200/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center">
                      <BarChart3 className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                    </div>

                    {/* Activity List */}
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50/50 dark:bg-gray-700/30">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"></div>
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl blur-xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-2xl blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Purpose: Directory + SaaS */}
      <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Two Powerful Platforms.<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">One Mission.</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Find professional DJs for your event, or grow your DJ business with powerful tools. DJ Dash does both.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Directory Side */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xl hover:shadow-2xl">
              <div className="absolute top-4 right-4 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                For Event Planners
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Find a Professional DJ
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Browse our directory of 1,200+ verified professional DJs. Get free quotes, read reviews, and find the perfect DJ for your wedding, corporate event, or party.
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  'Browse verified DJs by city',
                  'Get free quotes instantly',
                  'Read real reviews & portfolios',
                  'Compare pricing & availability',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/djdash/find-dj/memphis-tn"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all text-center"
                >
                  Find a DJ
                </Link>
                <Link
                  href="/djdash/find-dj/memphis-tn/wedding-djs"
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center"
                >
                  Wedding DJs
                </Link>
              </div>
            </div>
            
            {/* SaaS Side */}
            <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-xl hover:shadow-2xl">
              <div className="absolute top-4 right-4 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold">
                For DJs
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  Manage Your DJ Business
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  The all-in-one platform for DJs. Manage bookings, clients, contracts, invoicing, and analytics. Get leads from our directory network.
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  'Track all your gigs & clients',
                  'Automated invoicing & contracts',
                  'Get leads from our directory',
                  'Analytics & business insights',
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/djdash/signup"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-center"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/djdash/pricing"
                  className="px-6 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:border-purple-500 dark:hover:border-purple-500 transition-all text-center"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points & Solutions - Minimal Design */}
      <section className="py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Stop Juggling.<br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Start Scaling.</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              One platform replaces dozens of tools. Built specifically for DJ businesses.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                problem: 'Scattered Clients & Leads',
                description: 'Contacts in emails, spreadsheets everywhere? Miss follow-ups?',
                solution: 'Centralized CRM with automated pipelines—never lose a lead.',
                gradient: 'from-blue-500/10 to-cyan-500/10',
                border: 'border-blue-200/50 dark:border-blue-800/50'
              },
              {
                problem: 'Manual Contracts & Invoices',
                description: 'Time wasted on docs, chasing payments?',
                solution: 'Digital e-sign contracts and auto-invoicing—get paid 2x faster.',
                gradient: 'from-purple-500/10 to-pink-500/10',
                border: 'border-purple-200/50 dark:border-purple-800/50'
              },
              {
                problem: 'No Business Insights',
                description: 'Flying blind on revenue and trends?',
                solution: 'Real-time analytics—spot profitable gigs and grow smarter.',
                gradient: 'from-cyan-500/10 to-blue-500/10',
                border: 'border-cyan-200/50 dark:border-cyan-800/50'
              },
              {
                problem: 'Communication Overload',
                description: 'Messages across apps? Missing details?',
                solution: 'Unified inbox for email/SMS—respond faster, build better relationships.',
                gradient: 'from-pink-500/10 to-purple-500/10',
                border: 'border-pink-200/50 dark:border-pink-800/50'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {item.problem}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  <div className={`flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border}`}>
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">Solution</p>
                      <p className="text-gray-700 dark:text-gray-300">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/djdash/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>See How DJs Saved 10+ Hours/Week</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Futuristic Steps */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900"></div>
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Simple. Powerful.<br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Built for Speed.</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get up and running in minutes. Scale your business in weeks.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {[
              {
                step: '01',
                title: 'Sign Up & Import',
                description: 'Easy onboarding with import from spreadsheets/email. Get started in minutes.',
                icon: Users,
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                step: '02',
                title: 'Manage Clients & Events',
                description: 'Pipeline view with drag-drop status, event calendar, and full client history.',
                icon: Calendar,
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                step: '03',
                title: 'Automate Everything',
                description: 'Contract generation → e-sign → invoice → payout. All automated.',
                icon: TrendingUp,
                gradient: 'from-teal-500 to-emerald-500'
              },
              {
                step: '04',
                title: 'Analyze & Scale',
                description: 'Revenue graphs, client insights, and business intelligence to grow smarter.',
                icon: BarChart3,
                gradient: 'from-emerald-500 to-green-500'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative"
              >
                {/* Connection Line (Desktop) */}
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-800">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  </div>
                )}

                <div className="relative h-full bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  {/* Step Number */}
                  <div className="mb-6">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} text-white text-2xl font-bold shadow-lg shadow-${item.gradient.split(' ')[1]}/25`}>
                      {item.step}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`mb-6 w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} p-3 text-white`}>
                    <item.icon className="w-full h-full" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/djdash/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>Get Started Free – Takes Under 5 Minutes</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features - Glassmorphism */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background with gradient orbs */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need.<br />
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Nothing You Don't.</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              The only DJ booking software and DJ CRM you need. From event planning to client management, contracts to invoicing—everything in one platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: 'Full CRM & Pipeline', desc: 'Complete client management with automated workflows', gradient: 'from-blue-500 to-cyan-500' },
              { icon: FileText, title: 'Digital Contracts with E-Sign', desc: 'Professional contracts with electronic signatures', gradient: 'from-purple-500 to-pink-500' },
              { icon: CreditCard, title: 'Automated Invoicing & Payments', desc: 'Create, send, and track invoices with integrated payments', gradient: 'from-green-500 to-emerald-500' },
              { icon: BarChart3, title: 'Revenue Analytics & Reports', desc: 'Real-time insights into your business performance', gradient: 'from-cyan-500 to-blue-500' },
              { icon: Music, title: 'Real-Time Song Requests + Tips', desc: 'Handle requests and tips during events seamlessly', gradient: 'from-pink-500 to-rose-500' },
              { icon: MessageSquare, title: 'Unified Communication Hub', desc: 'Email, SMS, and chat all in one place', gradient: 'from-indigo-500 to-purple-500' },
              { icon: Calendar, title: 'Event Project Management', desc: 'Track events from inquiry to completion', gradient: 'from-teal-500 to-cyan-500' },
              { icon: Users, title: 'Team Collaboration Tools', desc: 'Manage multiple DJs and staff members', gradient: 'from-orange-500 to-red-500' },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Modern Stats */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>
        
        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-20">
            {[
              { value: '1,200+', label: 'Professional DJs', gradient: 'from-blue-500 to-cyan-500' },
              { value: '45,000+', label: 'Events Managed', gradient: 'from-purple-500 to-pink-500' },
              { value: '$4.5M+', label: 'Revenue Processed', gradient: 'from-cyan-500 to-teal-500' },
              { value: '28%', label: 'Avg Revenue Growth', gradient: 'from-teal-500 to-emerald-500' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg`}>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'DJ Dash turned my chaotic spreadsheets into a pro operation. Bookings up 35%!',
                author: 'Mike R.',
                company: 'Chicago DJ Company',
              },
              {
                quote: 'Finally, a tool built for DJs—not some generic CRM. Saved me hours every week.',
                author: 'Elena S.',
                company: 'Wedding DJ Pro',
              },
              {
                quote: 'From leads to payouts, it\'s all seamless. Worth every penny.',
                author: 'Team Lead',
                company: 'Multi-Op DJ Firm',
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="relative bg-white/5 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-white/90 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="pt-4 border-t border-white/10">
                  <p className="font-semibold text-white">{testimonial.author}</p>
                  <p className="text-white/60 text-sm">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Premium Cards */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Pricing That <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Scales</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              All plans include 14-day free trial. No hidden costs—3.5% + $0.30 fee only on payments.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
                <p className="text-gray-600 dark:text-gray-400">For Solo Pros</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$49</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 50 events/year', 'Core CRM, Contracts, Invoicing', 'Song Requests', 'Basic Analytics'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/djdash/signup"
                className="block w-full text-center px-6 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-all hover:border-gray-400 dark:hover:border-gray-600"
              >
                Start Trial
              </Link>
            </div>

            {/* Professional - Featured */}
            <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl scale-105 md:scale-100 border-4 border-cyan-400/50">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </span>
              </div>
              <div className="mb-6 mt-4">
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <p className="text-blue-100">For Growing Businesses</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited Events', 'Full Features + Advanced Analytics', 'Communication Hub', 'Priority Support'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/djdash/signup"
                className="block w-full text-center px-6 py-3.5 bg-white text-blue-600 rounded-xl font-bold transition-all hover:bg-gray-100 shadow-lg"
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Business */}
            <div className="relative bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/50 dark:border-gray-800/50 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business</h3>
                <p className="text-gray-600 dark:text-gray-400">For Scaling Teams</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">$199</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Pro + Team Tools', 'Custom Integrations', 'Dedicated Account Manager'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-400">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/djdash/signup"
                className="block w-full text-center px-6 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold transition-all hover:border-gray-400 dark:hover:border-gray-600"
              >
                Start Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Epic */}
      <section className="relative py-24 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black"></div>
        
        {/* Animated Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your DJ Business?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join pros averaging 28% more revenue. No more chaos—just growth.
          </p>
          <Link
            href="/djdash/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl shadow-2xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="w-6 h-6" />
          </Link>
          <p className="text-sm text-gray-400 mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Location-Based DJ Gigs Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Find DJ Gigs in Your City
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              DJ Dash helps DJs find and manage gigs in cities across the United States
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { city: 'Memphis', state: 'TN', slug: 'dj-gigs-memphis-tn' },
              { city: 'Nashville', state: 'TN', slug: 'dj-gigs/nashville-tn' },
              { city: 'Atlanta', state: 'GA', slug: 'dj-gigs/atlanta-ga' },
              { city: 'Los Angeles', state: 'CA', slug: 'dj-gigs/los-angeles-ca' },
              { city: 'New York', state: 'NY', slug: 'dj-gigs/new-york-ny' },
              { city: 'Chicago', state: 'IL', slug: 'dj-gigs/chicago-il' },
              { city: 'Houston', state: 'TX', slug: 'dj-gigs/houston-tx' },
              { city: 'Miami', state: 'FL', slug: 'dj-gigs/miami-fl' },
            ].map((location) => (
              <Link
                key={location.slug}
                href={`/djdash/${location.slug}`}
                className="p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center"
              >
                <div className="font-semibold text-gray-900 dark:text-white">
                  {location.city}, {location.state}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  DJ Gigs in {location.city}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/djdash/dj-gigs-memphis-tn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              View All Cities
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Find DJs by City - Directory Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Find Professional DJs in Your City
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Browse our directory of verified professional DJs across the United States
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { city: 'Memphis', state: 'TN', slug: 'find-dj/memphis-tn' },
              { city: 'Nashville', state: 'TN', slug: 'find-dj/nashville-tn' },
              { city: 'Atlanta', state: 'GA', slug: 'find-dj/atlanta-ga' },
              { city: 'Los Angeles', state: 'CA', slug: 'find-dj/los-angeles-ca' },
              { city: 'New York', state: 'NY', slug: 'find-dj/new-york-ny' },
              { city: 'Chicago', state: 'IL', slug: 'find-dj/chicago-il' },
              { city: 'Houston', state: 'TX', slug: 'find-dj/houston-tx' },
              { city: 'Miami', state: 'FL', slug: 'find-dj/miami-fl' },
            ].map((location) => (
              <Link
                key={location.slug}
                href={`/djdash/${location.slug}`}
                className="p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all text-center"
              >
                <div className="font-semibold text-gray-900 dark:text-white">
                  DJs in {location.city}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {location.city}, {location.state}
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <Link
              href="/djdash/find-dj/memphis-tn"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Browse All Cities
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <DJDashFooter />
    </div>
    </>
  );
}