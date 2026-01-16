import ReceiptRequestButton from './ReceiptRequestButton';
import { CheckCircle } from 'lucide-react';

export default function VenmoPaymentScreen({ qrCode, username, venmoRecipients, amount, requestId, paymentCode, paymentNote, onBack }) {
  return (
    <div className="text-center space-y-2">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Pay with Venmo
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Scan the QR code or click the button below to open Venmo
        </p>
      </div>

      {paymentCode && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-lg p-2">
          <p className="text-xs text-purple-700 dark:text-purple-300 mb-1 font-semibold">
            🔑 IMPORTANT: Include this code in your payment note:
          </p>
          <p className="text-xl font-bold text-purple-900 dark:text-purple-100 text-center font-mono">
            {paymentCode}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 text-center">
            This helps us verify your payment quickly!
          </p>
        </div>
      )}

      <div className="flex justify-center">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <img src={qrCode} alt="Venmo QR Code" className="w-40 h-40" />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 space-y-1.5">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-2">
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-0.5">
            ⚠️ IMPORTANT
          </p>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 leading-tight">
            You must use the QR code or "Open Venmo to Pay" button below. Do not manually type the username in Venmo.
          </p>
        </div>
        <p className="text-xs text-gray-700 dark:text-gray-300">
          <strong>Amount:</strong> ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {paymentNote && (
          <div className="pt-1.5 border-t border-blue-200 dark:border-blue-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
              <strong>Payment Note (will be included):</strong>
            </p>
            <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold leading-tight break-words">
              {paymentNote}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 font-medium">
              💡 Tip: You can add your name to the payment note in Venmo to help us identify your payment faster!
            </p>
          </div>
        )}
      </div>

      {/* Open Venmo Link Button - Uses redirect page to open Venmo app */}
      <button
        onClick={() => {
          const amountStr = Number(amount).toFixed(2);
          const encodedNote = encodeURIComponent(paymentNote || '');
          
          // Use redirect page to open Venmo app (prevents manual entry)
          // venmoRecipients is either phone number (if configured) or username
          const recipients = venmoRecipients || username.replace(/^@/, '');
          const redirectUrl = `${window.location.origin}/venmo-redirect?recipients=${encodeURIComponent(recipients)}&amount=${encodeURIComponent(amountStr)}&note=${encodeURIComponent(encodedNote)}${requestId ? `&request_id=${requestId}` : ''}`;
          window.location.href = redirectUrl;
        }}
        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 text-sm"
      >
        <svg viewBox="0 0 48 48" className="w-4 h-4" fill="currentColor">
          <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z"/>
        </svg>
        Open Venmo to Pay
      </button>
      
      {/* Return to Thank You Page Button - Always show if requestId is available */}
      {requestId && (
        <a
          href={`/crowd-request/success?request_id=${requestId}`}
          className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          I&apos;ve Completed Payment - View Confirmation
        </a>
      )}
      
      {/* Fallback: Use sessionStorage URL if available and no requestId */}
      {!requestId && typeof window !== 'undefined' && sessionStorage.getItem('venmo_thank_you_url') && (
        <a
          href={sessionStorage.getItem('venmo_thank_you_url')}
          className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          I&apos;ve Completed Payment - View Confirmation
        </a>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
        <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
          After sending payment, your request will be processed. You&apos;ll receive a confirmation once payment is verified.
        </p>
      </div>

      <ReceiptRequestButton requestId={requestId} amount={amount} />

      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
      >
        ← Choose Different Payment Method
      </button>
    </div>
  );
}

