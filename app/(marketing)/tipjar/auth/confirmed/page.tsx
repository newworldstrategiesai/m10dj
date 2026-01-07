import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function EmailConfirmedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 text-center border border-gray-200 dark:border-gray-700">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Email Confirmed! 🎉
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your email address has been successfully verified. You're all set to get started with TipJar!
          </p>

          {/* CTA Button - Highly Visible */}
          <Link href="/tipjar/signin/password_signin" className="block">
            <Button 
              size="lg" 
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-lg font-semibold py-6 px-8 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Go to Sign In
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          {/* Additional Info */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Already signed in?{' '}
            <Link 
              href="/tipjar/onboarding" 
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Go to Onboarding
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

