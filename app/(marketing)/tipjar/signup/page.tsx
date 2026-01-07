import { Metadata } from 'next';
import Link from 'next/link';
import TipJarHeader from '@/components/tipjar/Header';
import TipJarFooter from '@/components/tipjar/Footer';
import { 
  CheckCircle,
  ArrowRight,
  Music,
  QrCode,
  CreditCard,
  Smartphone,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign Up | TipJar.Live - Start Collecting Tips & Song Requests',
  description: 'Start your free account. No credit card required. Get instant access to tip collection and song request features for your events.',
};

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { error?: string; success?: string };
}) {
  const benefits = [
    {
      icon: Music,
      title: 'Instant Tip Collection',
      description: 'Start collecting tips immediately with credit card or Cash App Pay',
    },
    {
      icon: QrCode,
      title: 'QR Code Ready',
      description: 'Generate QR codes for easy access at any event, no app download needed',
    },
    {
      icon: Smartphone,
      title: 'Mobile-Friendly',
      description: 'Works on any phone browser - guests don\'t need to download anything',
    },
    {
      icon: CreditCard,
      title: 'No Credit Card Required',
      description: 'Start free, upgrade when you\'re making money',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <style dangerouslySetInnerHTML={{__html: `
        input#businessName,
        input#email,
        input#password {
          color: #111827 !important;
        }
        .dark input#businessName,
        .dark input#email,
        .dark input#password,
        html.dark input#businessName,
        html.dark input#email,
        html.dark input#password {
          color: #f3f4f6 !important;
        }
        input#businessName::placeholder,
        input#email::placeholder,
        input#password::placeholder {
          color: #9ca3af !important;
        }
        .dark input#businessName::placeholder,
        .dark input#email::placeholder,
        .dark input#password::placeholder,
        html.dark input#businessName::placeholder,
        html.dark input#email::placeholder,
        html.dark input#password::placeholder {
          color: #6b7280 !important;
        }
      `}} />
      <TipJarHeader />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Signup Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-gray-700">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Start Collecting Tips & Song Requests
              </h1>
              {!searchParams?.success && (
                <>
                  <p className="text-gray-600 dark:text-gray-300 mb-8">
                    No credit card required. Start free, upgrade when you&apos;re making money.
                  </p>
                  
                  {searchParams?.error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{searchParams.error}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {searchParams?.success ? (
                // Success State - Show helpful next steps
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Account Created Successfully! 🎉
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      We've sent a confirmation email to your inbox
                    </p>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                      Check Your Email
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-8">
                      Look for an email from <strong className="text-gray-900 dark:text-white">noreply@tipjar.live</strong> with the subject "Confirm your TipJar account"
                    </p>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                      Click the Confirmation Link
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 ml-8">
                      Click the "Confirm Email Address" button in the email to verify your account. This link expires in 24 hours.
                    </p>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                      Complete Your Setup
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-8">
                      After confirming, you'll be taken through a quick onboarding to set up your tip page
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Didn't receive the email?</strong> Check your spam folder or{' '}
                      <Link href="/tipjar/signin" className="underline font-semibold">
                        try signing in
                      </Link>
                      {' '}if you already confirmed your account.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link
                      href="/tipjar/signin"
                      className="block w-full text-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Go to Sign In
                    </Link>
                  </div>
                </div>
              ) : (
                // Signup Form
                <form action="/api/auth/signup" method="POST" className="space-y-6">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Name <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Your DJ or Performer Name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="your@email.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="At least 8 characters"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-semibold text-lg uppercase tracking-wider transition-colors"
                >
                  Get Started Free
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    By signing up, you agree to our{' '}
                    <Link href="/terms-of-service" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link href="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </button>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link href="/signin" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
              )}
            </div>
            
            {/* Benefits Sidebar */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">
                Start Collecting Tips in Minutes
              </h2>
              
              <div className="space-y-6 mb-8">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white/20 dark:bg-white/10 rounded-lg flex items-center justify-center">
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-gray-200">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/10 dark:bg-white/5 rounded-xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">
                  What You Get
                </h3>
                <ul className="space-y-3">
                  {[
                    'Free tier available',
                    'No credit card required',
                    'Instant tip collection',
                    'Song request management',
                    'QR code generation',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
                      <span className="text-gray-200">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Trusted by DJs and performers • Secure payments powered by Stripe
          </p>
          <div className="flex items-center justify-center space-x-8 opacity-60">
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Powered by Stripe</div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">Secure Payments</div>
            <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">No App Required</div>
          </div>
        </div>
      </section>
      
      <TipJarFooter />
    </div>
  );
}