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
  title: 'DJ Booking Software & DJ CRM | DJ Business Management Software | DJ Dash',
  description: 'The best DJ booking software and DJ CRM for managing your entire DJ business. Handle bookings, client management, contracts, invoicing, and analytics all in one platform. Trusted by 1,200+ professional DJs.',
  keywords: [
    'DJ booking software',
    'DJ CRM',
    'DJ business management software',
    'DJ management software',
    'event DJ software',
    'mobile DJ software',
    'DJ client management software',
    'DJ event management software'
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                DJ Booking Software & DJ CRM<br />All-in-One DJ Business Management Software
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                The complete DJ business management software for bookings, client management, contracts, invoicing, and analytics. Professional DJ CRM and booking software trusted by 1,200+ DJs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href="/signup"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors text-center"
                >
                  Start Free Trial – No Credit Card Needed
                </Link>
                <Link
                  href="/how-it-works"
                  className="border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors text-center hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Watch Demo →
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Trusted by 1,200+ pro DJs • $4.5M+ revenue managed • Powered by Stripe
              </p>
            </div>
            <div className="hidden lg:block">
              {/* Placeholder for dashboard mockup */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg"></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-lg"></div>
                    <div className="h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points & Solutions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Tired of Juggling Tools? DJ Dash Fixes That.
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Pain 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Scattered Clients & Leads
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Contacts in emails, spreadsheets everywhere? Miss follow-ups?
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution:</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Centralized CRM with automated pipelines—never lose a lead.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Manual Contracts & Invoices
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Time wasted on docs, chasing payments?
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution:</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Digital e-sign contracts and auto-invoicing—get paid 2x faster.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Business Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Flying blind on revenue and trends?
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution:</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Real-time analytics—spot profitable gigs and grow smarter.
                  </p>
                </div>
              </div>
            </div>

            {/* Pain 4 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Communication Overload
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Messages across apps? Missing details?
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Solution:</p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Unified inbox for email/SMS—respond faster, build better relationships.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
            >
              See How DJs Like You Saved 10+ Hours/Week →
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Sign Up & Import Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Easy onboarding with import from spreadsheets/email. Get started in minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Manage Clients & Events
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Pipeline view with drag-drop status, event calendar, and full client history.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Automate Contracts & Payments
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Contract generation → e-sign → invoice → payout. All automated.
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Analyze & Scale
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Revenue graphs, client insights, and business intelligence to grow smarter.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
            >
              Get Started Free – Takes Under 5 Minutes
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Complete DJ Business Management Software
          </h2>
          <p className="text-center text-xl text-gray-600 dark:text-gray-300 mb-16 max-w-3xl mx-auto">
            The only DJ booking software and DJ CRM you need. From event planning to client management, contracts to invoicing—everything in one platform.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: 'Full CRM & Pipeline', desc: 'Complete client management with automated workflows' },
              { icon: FileText, title: 'Digital Contracts with E-Sign', desc: 'Professional contracts with electronic signatures' },
              { icon: CreditCard, title: 'Automated Invoicing & Payments', desc: 'Create, send, and track invoices with integrated payments' },
              { icon: BarChart3, title: 'Revenue Analytics & Reports', desc: 'Real-time insights into your business performance' },
              { icon: Music, title: 'Real-Time Song Requests + Tips', desc: 'Handle requests and tips during events seamlessly' },
              { icon: MessageSquare, title: 'Unified Communication Hub', desc: 'Email, SMS, and chat all in one place' },
              { icon: Calendar, title: 'Event Project Management', desc: 'Track events from inquiry to completion' },
              { icon: Users, title: 'Team Collaboration Tools', desc: 'Manage multiple DJs and staff members' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">1,200+</div>
                <div className="text-green-100">DJs</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">45,000+</div>
                <div className="text-green-100">Events Managed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">$4.5M+</div>
                <div className="text-green-100">Revenue Processed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">28%</div>
                <div className="text-green-100">Avg Revenue Growth</div>
              </div>
            </div>
          </div>

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
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
                <p className="text-lg mb-4">"{testimonial.quote}"</p>
                <p className="font-semibold">{testimonial.author}</p>
                <p className="text-green-100 text-sm">{testimonial.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Transparent Pricing That Scales With You
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-16 max-w-2xl mx-auto">
            All plans include 14-day free trial. No hidden costs—3.5% + $0.30 fee only on payments.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Starter */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Starter</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For Solo Pros</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$49</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Up to 50 events/year</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Core CRM, Contracts, Invoicing</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Song Requests</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Basic Analytics</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Start Trial
              </Link>
            </div>

            {/* Professional */}
            <div className="bg-blue-600 text-white rounded-xl p-8 border-4 border-green-500 relative">
              <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-blue-100 mb-6">For Growing Businesses</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-blue-100">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                  <span>Unlimited Events</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                  <span>Full Features + Advanced Analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                  <span>Communication Hub</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-white mr-2 flex-shrink-0 mt-0.5" />
                  <span>Priority Support</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Free Trial →
              </Link>
            </div>

            {/* Business */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Business</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">For Scaling Teams</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">$199</span>
                <span className="text-gray-600 dark:text-gray-300">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Everything in Pro + Team Tools</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Custom Integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Dedicated Account Manager</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Start Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Professionalize Your DJ Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join pros averaging 28% more revenue. No more chaos—just growth.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
          >
            Sign Up Free Now
          </Link>
        </div>
      </section>

      <DJDashFooter />
    </div>
  );
}