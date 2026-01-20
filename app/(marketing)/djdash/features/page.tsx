import { Metadata } from 'next';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'DJ Client Management Software & DJ Contract Software | DJ Dash Features',
  description: 'Complete DJ client management software with DJ contract software, automated invoicing, CRM pipeline, and event management. Built specifically for DJ businesses.',
  keywords: [
    'DJ client management software',
    'DJ contract software',
    'DJ CRM features',
    'DJ management software features',
    'DJ booking software features'
  ],
  openGraph: {
    title: 'DJ Dash Features - Everything You Need to Find & Book DJs',
    description: 'Complete DJ client management software with DJ contract software, automated invoicing, CRM pipeline, and event management. Built specifically for DJ businesses.',
    url: 'https://www.djdash.net/features',
    siteName: 'DJ Dash',
    images: [
      {
        url: '/assets/djdash-features-og.png',
        width: 1200,
        height: 630,
        alt: 'DJ Dash Features - Everything You Need to Find & Book DJs',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DJ Dash Features - Everything You Need to Find & Book DJs',
    description: 'Complete DJ client management software with automated invoicing, CRM pipeline, and event management.',
    images: ['/assets/djdash-features-og.png'],
  },
};

export default function UseCasesPage() {
  const useCases = [
    {
      title: 'Solo DJ',
      subtitle: 'Focus on Time-Saving',
      description: 'Perfect for independent DJs who want to spend less time on admin and more time performing.',
      features: [
        'Save 10+ hours per week on administrative tasks',
        'Never miss a follow-up with automated reminders',
        'Look professional with branded contracts and invoices',
        'Get paid faster with automated invoicing',
        'Track all client communication in one place',
      ],
      metrics: {
        timeSaved: '10+ hours/week',
        revenueIncrease: '15-25%',
        bookings: '+30%',
      },
      testimonial: {
        quote: 'DJ Dash turned my chaotic spreadsheets into a pro operation. Bookings up 35%!',
        author: 'Mike R.',
        company: 'Chicago DJ Company',
      },
    },
    {
      title: 'Growing Company',
      subtitle: 'Team Tools & Collaboration',
      description: 'Scale your business with team collaboration tools, advanced features, and multi-user support.',
      features: [
        'Manage multiple DJs from one dashboard',
        'Shared calendars and event scheduling',
        'Team permissions and access control',
        'Advanced reporting and analytics',
        'Unified client communication',
      ],
      metrics: {
        teamSize: '2-10 DJs',
        eventsManaged: '100-500/year',
        revenueIncrease: '28-40%',
      },
      testimonial: {
        quote: 'Finally, a tool built for DJs—not some generic CRM. Saved me hours every week.',
        author: 'Elena S.',
        company: 'Wedding DJ Pro',
      },
    },
    {
      title: 'Scaling Business',
      subtitle: 'Analytics for Growth',
      description: 'Enterprise features for multi-operation DJ firms with custom integrations and dedicated support.',
      features: [
        'Custom integrations with existing tools',
        'API access for advanced workflows',
        'White-label branding options',
        'Dedicated account manager',
        'Advanced analytics and forecasting',
      ],
      metrics: {
        teamSize: '10+ DJs',
        eventsManaged: '500+ /year',
        revenueIncrease: '40%+',
      },
      testimonial: {
        quote: 'From leads to payouts, it\'s all seamless. Worth every penny.',
        author: 'Team Lead',
        company: 'Multi-Op DJ Firm',
      },
    },
  ];

  const caseStudy = {
    title: 'How DJ Pro X Grew from 20 to 100 Events/Year',
    challenge: 'DJ Pro X was spending 15+ hours per week on administrative tasks, using spreadsheets and email to manage clients. They were losing leads and struggling to scale.',
    solution: 'They implemented DJ Dash and automated their entire workflow: contracts, invoicing, client communication, and analytics.',
    results: [
      { metric: 'Events/Year', before: '20', after: '100', increase: '+400%' },
      { metric: 'Admin Hours/Week', before: '15', after: '3', decrease: '-80%' },
      { metric: 'Revenue', before: '$50K', after: '$250K', increase: '+400%' },
      { metric: 'Client Satisfaction', before: '4.2/5', after: '4.9/5', increase: '+17%' },
    ],
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            DJ Client Management Software<br />& DJ Contract Software
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Complete DJ client management software with professional DJ contract software, automated invoicing, and full CRM pipeline. Built for every type of DJ business.
          </p>
        </div>
      </section>

      {/* CRM & Contract Software Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              DJ Client Management Software & DJ Contract Software
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Complete DJ client management software with professional DJ contract software. Track every lead, manage contracts with e-signatures, and automate your entire workflow.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                DJ Client Management Software (CRM)
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Our DJ client management software gives you a complete CRM pipeline to track every inquiry from first contact to booking. Never lose a lead again.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Automated lead tracking and follow-up reminders</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Complete client history and communication logs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Pipeline management with drag-and-drop status updates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Client segmentation and tagging for better organization</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                DJ Contract Software with E-Signatures
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Professional DJ contract software that generates contracts in seconds. Clients sign electronically—no printing, no scanning, no delays.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">One-click contract generation from templates</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Electronic signatures—signed in minutes, not days</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Automated contract storage and organization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">Custom contract templates for different event types</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-24">
            {useCases.map((useCase, idx) => (
              <div
                key={idx}
                className={`grid md:grid-cols-2 gap-12 items-center ${
                  idx % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold mb-4">
                    {useCase.subtitle}
                  </div>
                  <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {useCase.title}
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    {useCase.description}
                  </p>
                  <ul className="space-y-4 mb-8">
                    {useCase.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {Object.entries(useCase.metrics).map(([key, value], metricIdx) => (
                      <div key={metricIdx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {value}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                      &ldquo;{useCase.testimonial.quote}&rdquo;
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {useCase.testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {useCase.testimonial.company}
                    </p>
                  </div>
                </div>
                
                {/* Visual */}
                <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-8 h-96 flex items-center justify-center ${idx % 2 === 1 ? 'md:order-1' : ''}`}>
                  <div className="text-center text-gray-400">
                    <Users className="w-24 h-24 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Dashboard Preview</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            {caseStudy.title}
          </h2>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                The Challenge
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {caseStudy.challenge}
              </p>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                The Solution
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {caseStudy.solution}
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                The Results
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {caseStudy.results.map((result, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                      {result.metric}
                    </div>
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {result.after}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-through">
                          {result.before}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        result.increase ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {result.increase || result.decrease}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your DJ Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of DJs who&rsquo;ve streamlined their business with DJ Dash.
          </p>
          <Link
            href="/djdash/signup"
            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
          >
            Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <DJDashFooter />
    </div>
  );
}
