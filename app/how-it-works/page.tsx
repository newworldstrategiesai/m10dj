import { Metadata } from 'next';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { 
  ArrowRight, 
  CheckCircle,
  Play,
  Zap,
  Users,
  Calendar,
  FileText,
  CreditCard,
  BarChart3,
  MessageSquare,
  Music
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works | DJ Dash - Simple DJ Business Management',
  description: 'See how DJ Dash works: from signup to managing your entire DJ business. 60-second demo and step-by-step workflow guide.',
};

export default function HowItWorksPage() {
  const workflowSteps = [
    {
      icon: Users,
      title: 'Inquiry',
      description: 'Client contacts you through your website or phone. Lead automatically appears in your DJ Dash dashboard.',
      bgColor: 'bg-blue-600',
      badgeColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    },
    {
      icon: FileText,
      title: 'Quote',
      description: 'Create a professional quote in seconds. Send via email or SMS with a branded quote page.',
      bgColor: 'bg-purple-600',
      badgeColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    },
    {
      icon: CheckCircle,
      title: 'Book',
      description: 'Client accepts quote. Generate a contract with one click. Client signs electronically—no printing needed.',
      bgColor: 'bg-green-600',
      badgeColor: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    },
    {
      icon: Calendar,
      title: 'Event',
      description: 'Manage event details, music preferences, timeline. Collect song requests and tips in real-time during the event.',
      bgColor: 'bg-yellow-600',
      badgeColor: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    },
    {
      icon: CreditCard,
      title: 'Payment',
      description: 'Automated invoicing after the event. Client pays online. Money goes directly to your account.',
      bgColor: 'bg-indigo-600',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    },
    {
      icon: BarChart3,
      title: 'Analyze',
      description: 'Track revenue, profitability, client lifetime value. Spot trends and grow your business smarter.',
      bgColor: 'bg-pink-600',
      badgeColor: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
    },
  ];

  const integrations = [
    { name: 'Stripe', description: 'Secure payment processing' },
    { name: 'Twilio', description: 'SMS messaging integration' },
    { name: 'Google Calendar', description: 'Sync your calendar' },
    { name: 'Email Providers', description: 'Gmail, Outlook, and more' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      
      {/* Hero with Video */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            See How DJ Dash Works
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            From inquiry to payment—see how DJ Dash streamlines your entire business workflow.
          </p>
          
          {/* Video Placeholder */}
          <div className="bg-gray-900 rounded-xl aspect-video flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 opacity-50"></div>
            <button className="relative z-10 w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <Play className="w-10 h-10 text-blue-600 ml-1" fill="currentColor" />
            </button>
            <p className="absolute bottom-4 left-4 text-white text-sm">
              60-Second Demo Video
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Diagram */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Your Complete Workflow
          </h2>
          
          <div className="relative">
            {/* Connection Lines - Desktop */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="hidden lg:block absolute top-24 left-[16.66%] w-[16.66%] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="hidden lg:block absolute top-24 left-[33.33%] w-[16.66%] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="hidden lg:block absolute top-24 left-[50%] w-[16.66%] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="hidden lg:block absolute top-24 left-[66.66%] w-[16.66%] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="hidden lg:block absolute top-24 left-[83.33%] w-[16.66%] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            <div className="grid lg:grid-cols-6 gap-8">
              {workflowSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  {/* Step Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center mb-2">
                      <div className={`inline-block px-3 py-1 ${step.badgeColor} rounded-full text-sm font-semibold mb-2`}>
                        Step {idx + 1}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                      {step.description}
                    </p>
                  </div>
                  
                  {/* Arrow - Mobile */}
                  {idx < workflowSteps.length - 1 && (
                    <div className="lg:hidden flex justify-center my-4">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Highlight */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Everything You Need, All in One Place
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'CRM & Pipeline',
                description: 'Never lose a lead. Track every inquiry from first contact to booking.',
              },
              {
                icon: FileText,
                title: 'Contracts & E-Sign',
                description: 'Professional contracts with electronic signatures. Signed in minutes, not days.',
              },
              {
                icon: CreditCard,
                title: 'Invoicing & Payments',
                description: 'Automated invoicing with integrated payments. Get paid faster.',
              },
              {
                icon: Music,
                title: 'Song Requests',
                description: 'Real-time song requests and tip collection during events.',
              },
              {
                icon: MessageSquare,
                title: 'Communication',
                description: 'Unified inbox for email and SMS. All client communication in one place.',
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                description: 'Real-time insights into revenue, profitability, and business trends.',
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Easy Integrations
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12">
            Connect DJ Dash with the tools you already use. Setup takes minutes.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {integration.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {integration.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Time */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Get Started in Under 5 Minutes
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Sign up, import your data, and start managing your business professionally. Our guided onboarding makes it easy.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="text-3xl font-bold mb-2">2 min</div>
              <div className="text-green-100">Sign up</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">2 min</div>
              <div className="text-green-100">Import data</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">1 min</div>
              <div className="text-green-100">First contract</div>
            </div>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center bg-white hover:bg-gray-100 text-green-600 px-8 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
          >
            Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <DJDashFooter />
    </div>
  );
}