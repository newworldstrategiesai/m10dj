/**
 * DJ Signup Page
 * 
 * Public signup page for new DJs to join the platform.
 * Separate from M10 DJ Company pages.
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Music, CheckCircle, ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const businessName = formData.get('businessName') as string;

      // Sign up with Supabase
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003'}/auth/callback`;
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            organization_name: businessName || undefined,
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        if (data.session) {
          // User is signed in immediately - redirect to onboarding
          setSuccess(true);
          setTimeout(() => {
            router.push('/onboarding/wizard');
          }, 1500);
        } else {
          // Email confirmation required
          setEmailSent(true);
          setSuccess(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    '14-day free trial - no credit card required',
    'Replace 5-7 tools with one platform',
    'Save 10-20 hours per month',
    'Professional appearance increases bookings',
    'Mobile-friendly, work from anywhere'
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {emailSent ? 'Check Your Email!' : 'Account Created!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {emailSent 
              ? 'We\'ve sent a confirmation email. Please check your inbox and click the link to verify your account.'
              : 'Your account has been created successfully! Redirecting to onboarding...'}
          </p>
          {!emailSent && (
            <Link
              href="/onboarding/wizard"
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Continue to Onboarding
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
          {emailSent && (
            <Link
              href="/signin"
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Sign In
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up - DJ Business Management Platform</title>
        <meta 
          name="description" 
          content="Start your free 14-day trial. No credit card required. Manage your DJ business in one place." 
        />
        <link rel="canonical" href="/signup" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/platform" className="flex items-center">
                <Music className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                  DJ Platform
                </span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/platform"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Features
                </Link>
                <Link 
                  href="/dj-pricing"
                  className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="flex min-h-[calc(100vh-4rem)]">
          {/* Left Side - Benefits */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-purple-700 p-12 flex-col justify-center text-white">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-6">
                Start Managing Your DJ Business Today
              </h2>
              <p className="text-xl text-purple-100 mb-8">
                Join professional DJs who are streamlining their business operations.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Signup Form */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Create Your Account
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Start your free 14-day trial. No credit card required.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div>
                    <label 
                      htmlFor="businessName" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      DJ Business Name <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="e.g., DJ John's Events"
                      autoComplete="organization"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      We'll use your email if you don't provide a name
                    </p>
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Create a secure password"
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Start Free Trial
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link 
                      href="/signin" 
                      className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Secure
                    </div>
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Fast Setup
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      No Credit Card
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-purple-600 dark:text-purple-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

