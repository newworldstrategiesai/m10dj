import ReceiptRequestButton from './ReceiptRequestButton';
import { CheckCircle } from 'lucide-react';

export default function VenmoPaymentScreen({ qrCode, username, amount, requestId, paymentCode, paymentNote, onBack }) {
  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pay with Venmo
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Scan the QR code or send ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to {username}
        </p>
      </div>

      {paymentCode && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-4">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-2 font-semibold">
            🔑 IMPORTANT: Include this code in your payment note:
          </p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 text-center font-mono">
            {paymentCode}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
            This helps us verify your payment quickly!
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <img src={qrCode} alt="Venmo QR Code" className="w-64 h-64" />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Venmo Username:</strong> {username}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Amount:</strong> ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {paymentNote && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              <strong>Payment Note (will be included):</strong>
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
              {paymentNote}
            </p>
          </div>
        )}
      </div>

      {/* Open Venmo Link Button */}
      <a
        href={`https://venmo.com/${username.replace(/^@/, '')}?txn=pay&amount=${Number(amount).toFixed(2)}&note=${encodeURIComponent(paymentNote || '')}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          // Get thank you URL from sessionStorage if available
          const thankYouUrl = sessionStorage.getItem('venmo_thank_you_url');
          if (thankYouUrl) {
            // After opening Venmo, redirect to thank you page after a delay
            setTimeout(() => {
              window.location.href = thankYouUrl;
            }, 3000); // Give them 3 seconds to complete payment
          }
        }}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 48 48" className="w-5 h-5" fill="currentColor">
          <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
        </svg>
        Open Venmo to Pay
      </a>
      
      {/* Return to Thank You Page Button */}
      {typeof window !== 'undefined' && sessionStorage.getItem('venmo_thank_you_url') && (
        <a
          href={sessionStorage.getItem('venmo_thank_you_url')}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 mt-3"
        >
          <CheckCircle className="w-5 h-5" />
          I&apos;ve Completed Payment - Continue
        </a>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
        </p>
      </div>

      <ReceiptRequestButton requestId={requestId} amount={amount} />

      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ← Choose Different Payment Method
      </button>
    </div>
  );
}

