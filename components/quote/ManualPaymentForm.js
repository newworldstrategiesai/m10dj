import React, { useState } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

function ManualPaymentForm({ leadId, amount, paymentType, onPaymentRecorded }) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'Venmo',
    transactionId: '',
    paymentNotes: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/payments/record-manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          amount: Number(amount),
          paymentMethod: formData.paymentMethod,
          transactionId: formData.transactionId.trim(),
          paymentNotes: formData.paymentNotes.trim(),
          paymentType,
          transactionDate: formData.transactionDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      setSuccess(true);
      setFormData({
        paymentMethod: 'Venmo',
        transactionId: '',
        paymentNotes: '',
        transactionDate: new Date().toISOString().split('T')[0]
      });

      // Callback to refresh payment data
      if (onPaymentRecorded) {
        setTimeout(() => {
          onPaymentRecorded();
        }, 1000);
      }

      // Hide form after 3 seconds
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <CheckCircle className="w-5 h-5" />
          <p className="font-semibold">Payment recorded successfully!</p>
        </div>
        <p className="text-sm text-green-700 dark:text-green-300 mt-2">
          We&apos;ll verify your payment and update your account shortly.
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
      >
        I Already Paid via Venmo/Cash App
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Payment Method
        </label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
          required
        >
          <option value="Venmo">Venmo</option>
          <option value="Cash App">Cash App</option>
          <option value="Check">Check</option>
          <option value="Cash">Cash</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Transaction ID or Receipt Number <span className="text-gray-500">(optional)</span>
        </label>
        <input
          type="text"
          value={formData.transactionId}
          onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
          placeholder="e.g., Venmo transaction ID or receipt number"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Payment Date
        </label>
        <input
          type="date"
          value={formData.transactionDate}
          onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Additional Notes <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          value={formData.paymentNotes}
          onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
          placeholder="Any additional information about this payment..."
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 px-4 bg-brand hover:bg-brand-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recording...
            </>
          ) : (
            'Record Payment'
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setError(null);
            setFormData({
              paymentMethod: 'Venmo',
              transactionId: '',
              paymentNotes: '',
              transactionDate: new Date().toISOString().split('T')[0]
            });
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ManualPaymentForm;

