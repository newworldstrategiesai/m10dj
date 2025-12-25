'use client';

import { useState } from 'react';
import { Loader2, Ticket, AlertCircle } from 'lucide-react';

export default function TicketPurchaseForm({ eventId, onSuccess }) {
  const [formData, setFormData] = useState({
    ticketType: 'general_admission',
    quantity: 1,
    purchaserName: '',
    purchaserEmail: '',
    purchaserPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ticket configuration
  const ticketTypes = {
    general_admission: {
      name: 'General Admission',
      price: 12.00,
      description: 'Entry to DJ Ben Murray Live at Silky O\'Sullivan\'s'
    },
    early_bird: {
      name: 'Early Bird',
      price: 10.00,
      description: 'Limited early bird pricing (first 50 tickets)'
    }
  };

  const selectedTicket = ticketTypes[formData.ticketType];
  const totalPrice = selectedTicket ? selectedTicket.price * formData.quantity : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/events/tickets/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          ...formData
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, it's likely a server error
        throw new Error('Server error. Please try again or contact support.');
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else if (onSuccess) {
        onSuccess(data);
      } else {
        throw new Error('No checkout URL received. Please try again.');
      }
    } catch (err) {
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-600 rounded-lg p-4 flex items-start shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-800 dark:text-red-100 font-semibold mb-1 text-base">Purchase Error</h3>
            <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
            <p className="text-red-600 dark:text-red-300 text-xs mt-2">Please check your information and try again, or contact support if the problem persists.</p>
          </div>
        </div>
      )}

      {/* Ticket Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Ticket Type
        </label>
        <select
          value={formData.ticketType}
          onChange={(e) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, ticketType: value }));
          }}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
          required
        >
          {Object.entries(ticketTypes).map(([key, type]) => (
            <option key={key} value={key}>
              {type.name} - ${type.price.toFixed(2)}
            </option>
          ))}
        </select>
        {selectedTicket && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {selectedTicket.description}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Quantity
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }));
            }}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-black transition-colors text-gray-900 dark:text-white"
            disabled={formData.quantity <= 1}
          >
            −
          </button>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              setFormData(prev => ({ ...prev, quantity: value }));
            }}
            className="w-20 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            required
          />
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({ ...prev, quantity: Math.min(10, prev.quantity + 1) }));
            }}
            className="w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-black transition-colors text-gray-900 dark:text-white"
            disabled={formData.quantity >= 10}
          >
            +
          </button>
        </div>
      </div>

      {/* Total Price */}
      <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Purchaser Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Your Name *
          </label>
          <input
            type="text"
            value={formData.purchaserName}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, purchaserName: value }));
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.purchaserEmail}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, purchaserEmail: value }));
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={formData.purchaserPhone}
            onChange={(e) => {
              const value = e.target.value;
              setFormData(prev => ({ ...prev, purchaserPhone: value }));
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-black text-gray-900 dark:text-white"
            placeholder="(901) 555-1234"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary text-lg py-4 flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Ticket className="w-5 h-5 mr-2" />
            Buy Tickets - ${totalPrice.toFixed(2)}
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        You'll be redirected to Stripe Checkout to complete your payment securely.
      </p>
    </form>
  );
}

