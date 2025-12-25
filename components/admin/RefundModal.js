import { useState } from 'react';
import { XCircle, AlertCircle, DollarSign, Loader2 } from 'lucide-react';

export default function RefundModal({ ticket, onClose, onSuccess }) {
  const [refundType, setRefundType] = useState('full');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      const refundAmount = refundType === 'partial' ? parseFloat(amount) : null;
      
      if (refundType === 'partial' && (!refundAmount || refundAmount <= 0 || refundAmount > ticket.total_amount)) {
        setError('Invalid refund amount');
        setProcessing(false);
        return;
      }

      const response = await fetch(`/api/events/tickets/refund/${ticket.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || null,
          amount: refundAmount,
          partial: refundType === 'partial'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      if (onSuccess) {
        onSuccess(data);
      }

      onClose();
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Refund Ticket</h2>
            <button
              onClick={onClose}
              disabled={processing}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Ticket Total:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${ticket.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Purchaser: {ticket.purchaser_name}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Refund Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      value="full"
                      checked={refundType === 'full'}
                      onChange={(e) => setRefundType(e.target.value)}
                      className="mr-3"
                      disabled={processing}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Full Refund</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ${ticket.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      value="partial"
                      checked={refundType === 'partial'}
                      onChange={(e) => setRefundType(e.target.value)}
                      className="mr-3"
                      disabled={processing}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Partial Refund</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Enter amount to refund
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {refundType === 'partial' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Refund Amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={ticket.total_amount}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Max: $${ticket.total_amount.toFixed(2)}`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required={refundType === 'partial'}
                      disabled={processing}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Reason (Optional)
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={processing}
                >
                  <option value="">Select reason...</option>
                  <option value="requested_by_customer">Requested by Customer</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="event_cancelled">Event Cancelled</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1 btn-outline disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Refund'
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Refunds for Stripe payments will be processed immediately. Cash and card-at-door refunds will be marked in the system only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

