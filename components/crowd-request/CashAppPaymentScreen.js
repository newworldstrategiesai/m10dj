import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ReceiptRequestButton from './ReceiptRequestButton';

export default function CashAppPaymentScreen({ qrCode, cashtag, amount, requestId, paymentCode, paymentNote, onBack }) {
  const [noteCopied, setNoteCopied] = useState(false);
  
  const handleCopyNote = async () => {
    try {
      await navigator.clipboard.writeText(paymentNote);
      setNoteCopied(true);
      setTimeout(() => setNoteCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy note:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = paymentNote;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setNoteCopied(true);
        setTimeout(() => setNoteCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };
  
  return (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Pay with CashApp
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Scan the QR code or send ${(amount / 100).toFixed(2)} to {cashtag}
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
          <img src={qrCode} alt="CashApp QR Code" className="w-64 h-64" />
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>CashApp Tag:</strong> {cashtag}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
        </p>
        {paymentNote && (
          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
              <strong>⚠️ IMPORTANT: Copy this note and paste it in CashApp:</strong>
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border-2 border-green-300 dark:border-green-600 relative">
              <p className="text-sm text-gray-900 dark:text-white font-mono break-words select-all pr-12">
                {paymentNote}
              </p>
              <button
                type="button"
                onClick={handleCopyNote}
                className="absolute top-2 right-2 px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                title="Copy to clipboard"
              >
                {noteCopied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              CashApp doesn&apos;t support notes in URLs. Click &quot;Copy&quot; above, then paste it in the CashApp payment note field when you send the payment.
            </p>
          </div>
        )}
      </div>

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

