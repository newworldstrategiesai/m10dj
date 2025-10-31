/**
 * Payment Cancelled Page
 * Shown when user cancels payment at Stripe checkout
 */

import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  XCircle,
  ArrowLeft,
  Home,
  CreditCard,
  HelpCircle
} from 'lucide-react';

export default function PaymentCancelled() {
  const router = useRouter();
  const { token } = router.query;

  return (
    <>
      <Head>
        <title>Payment Cancelled - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Cancelled</h1>
              <p className="text-orange-100 text-lg">No charges were made</p>
            </div>

            {/* Content */}
            <div className="px-8 py-8">
              <div className="text-center mb-8">
                <p className="text-gray-700 text-lg mb-4">
                  You've cancelled the payment process. No charges were made to your card.
                </p>
                <p className="text-gray-600">
                  If you experienced any issues or have questions, please don't hesitate to contact us.
                </p>
              </div>

              {/* Why Pay Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Why Pay Now?
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Secure your event date immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Simple, secure payment via Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Instant confirmation and receipt</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>Peace of mind with payment protection</span>
                  </li>
                </ul>
              </div>

              {/* Contact Section */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  We're here to help! If you have questions about payment or encountered an issue:
                </p>
                <div className="space-y-2">
                  <a
                    href="tel:9014102020"
                    className="flex items-center gap-2 text-[#fcba00] hover:text-[#e5a800] font-medium"
                  >
                    📞 (901) 410-2020
                  </a>
                  <a
                    href="mailto:djbenmurray@gmail.com"
                    className="flex items-center gap-2 text-[#fcba00] hover:text-[#e5a800] font-medium"
                  >
                    ✉️ djbenmurray@gmail.com
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {token && (
                  <Link
                    href={`/pay/${token}`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#fcba00] hover:bg-[#e5a800] text-black font-semibold rounded-lg transition-colors"
                  >
                    <CreditCard className="w-5 h-5" />
                    Try Payment Again
                  </Link>
                )}
                
                <a
                  href="https://m10djcompany.com"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Back to Website
                </a>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              Your invoice will remain active until the due date.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              You can complete payment anytime before then.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

