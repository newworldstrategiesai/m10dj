import { Metadata } from 'next';
import Link from 'next/link';
import DJDashHeader from '@/components/djdash/Header';
import DJDashFooter from '@/components/djdash/Footer';
import { CheckCircle, Mail, Phone, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Thank You | DJ Dash - We\'ll Connect You Soon',
  description: 'Thank you for your interest! We\'ll connect you with professional DJs in your area within 24 hours.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <DJDashHeader />
      
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Thank You!
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              We've received your request and will connect you with professional DJs in your area within 24 hours.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-8 border border-blue-100 dark:border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What Happens Next?
            </h2>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    We Review Your Request
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our team reviews your event details and matches you with the best DJs in your area.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    DJs Contact You
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Verified DJs will reach out via email or phone within 24 hours with quotes and availability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    Compare & Choose
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review quotes, portfolios, and reviews to choose the perfect DJ for your event.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/djdash"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all inline-flex items-center justify-center"
            >
              Back to Home
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/djdash/signup"
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold hover:border-blue-500 dark:hover:border-blue-500 transition-all"
            >
              Are You a DJ? Sign Up
            </Link>
          </div>
        </div>
      </section>
      
      <DJDashFooter />
    </div>
  );
}

