import { useState } from 'react';
import { Gift, Loader2, Check } from 'lucide-react';

export default function ReceiptRequestButton({ requestId, amount }) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [receiptName, setReceiptName] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const handleRequestReceipt = async (e) => {
    e.preventDefault();
    if (!receiptEmail.trim()) {
      setReceiptError('Please enter your email address');
      return;
    }

    setSendingReceipt(true);
    setReceiptError('');

    try {
      const response = await fetch('/api/crowd-request/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          email: receiptEmail.trim(),
          name: receiptName.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send receipt');
      }

      setReceiptSent(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setReceiptEmail('');
        setReceiptName('');
        setReceiptSent(false);
      }, 2000);
    } catch (err) {
      console.error('Error sending receipt:', err);
      setReceiptError(err.message || 'Failed to send receipt. Please try again.');
    } finally {
      setSendingReceipt(false);
    }
  };

  if (receiptSent) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
        <p className="text-sm text-green-700 dark:text-green-300 font-semibold text-center">
          ✅ Receipt sent! Check your email.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowEmailModal(true)}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Gift className="w-5 h-5" />
          Get My Receipt (for tax write-offs)
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Optional: Get a receipt for your records
        </p>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Get Your Receipt
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Enter your information to receive a receipt for tax purposes. This receipt can be used for expense write-offs.
            </p>

            <form onSubmit={handleRequestReceipt}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Your Name <span className="text-gray-500 dark:text-gray-400 text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={receiptName}
                  onChange={(e) => setReceiptName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your name (optional)"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
                {receiptError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{receiptError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setReceiptEmail('');
                    setReceiptName('');
                    setReceiptError('');
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={sendingReceipt}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReceipt ? 'Sending...' : 'Send Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

