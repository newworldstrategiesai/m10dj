import React, { useState } from 'react';
import { CreditCard, Loader2, X } from 'lucide-react';
import CashAppPaymentScreen from '../crowd-request/CashAppPaymentScreen';
import VenmoPaymentScreen from '../crowd-request/VenmoPaymentScreen';

function EventPaymentMethodSelection({ 
  isOpen,
  onClose,
  amount, 
  quoteId,
  paymentType, // 'deposit' or 'full'
  onPaymentMethodSelected,
  onError 
}) {
  const [cashAppQr, setCashAppQr] = useState(null);
  const [venmoQr, setVenmoQr] = useState(null);
  const [localSelectedMethod, setLocalSelectedMethod] = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);

  // Fetch payment settings (Cash App tag, Venmo username)
  React.useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/admin/payment-settings');
        if (response.ok) {
          const data = await response.json();
          setPaymentSettings({
            cashAppTag: data.cashAppTag || '$M10DJ',
            venmoUsername: data.venmoUsername || '@djbenmurray'
          });
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
        // Use defaults
        setPaymentSettings({
          cashAppTag: '$M10DJ',
          venmoUsername: '@djbenmurray'
        });
      }
    };
    
    if (isOpen) {
      fetchPaymentSettings();
    }
  }, [isOpen]);

  const generateQRCode = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  // Build payment note for event payments
  const buildPaymentNote = () => {
    let paymentTypeText;
    if (paymentType === 'deposit') {
      paymentTypeText = 'Deposit';
    } else if (paymentType === 'remaining') {
      paymentTypeText = 'Remaining Balance';
    } else {
      paymentTypeText = 'Full Payment';
    }
    const note = `Event ${paymentTypeText} - Quote ${quoteId?.substring(0, 8).toUpperCase() || 'N/A'}`;
    return note;
  };

  const handleCashAppClick = async () => {
    try {
      if (!quoteId) {
        throw new Error('Quote ID is missing. Please try again.');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      setLocalSubmitting(true);
      if (onError) onError('');
      
      console.log('Creating Cash App Pay checkout for event payment:', { quoteId, amount, paymentType });
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quoteId, // quoteId is actually the lead_id
          amount: Math.round(amount * 100), // Convert to cents
          description: `Event ${paymentType === 'remaining' ? 'Remaining Balance' : paymentType === 'deposit' ? 'Deposit' : 'Full Payment'}`,
          paymentType: paymentType,
          preferredPaymentMethod: 'cashapp',
          successUrl: `${window.location.origin}/quote/${quoteId}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quote/${quoteId}/payment`
        })
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse checkout response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Failed to create checkout session`;
        console.error('Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          message: data?.message,
          fullData: data
        });
        throw new Error(errorMsg);
      }

      if (data.url || data.checkoutUrl) {
        // Redirect to Stripe Checkout with Cash App Pay
        window.location.href = data.url || data.checkoutUrl;
      } else {
        console.error('No checkout URL in response:', data);
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('CashApp payment error:', err);
      if (onError) onError(err.message || 'Failed to create checkout session. Please try again.');
      setLocalSubmitting(false);
    }
  };

  const handleVenmoClick = () => {
    try {
      if (!paymentSettings?.venmoUsername) {
        throw new Error('Venmo username is not configured. Please contact support.');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // Strip @ from username if present
      const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '');
      // Amount is already in dollars, format it for Venmo
      const amountStr = Number(amount).toFixed(2);
      
      // Build payment note
      const paymentNote = buildPaymentNote();
      const encodedNote = encodeURIComponent(paymentNote);
      
      // Detect if user is on mobile device (more comprehensive check)
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent ? userAgent.toLowerCase() : '');
      const isMobileViewport = window.innerWidth < 768;
      const isMobile = isMobileDevice || isMobileViewport;
      
      // Store payment info in sessionStorage for thank you page
      const thankYouUrl = `${window.location.origin}/quote/${quoteId}/thank-you?payment_method=venmo&amount=${amountStr}`;
      sessionStorage.setItem('venmo_payment_pending', JSON.stringify({
        amount: amountStr,
        paymentMethod: 'Venmo',
        paymentType: paymentType,
        quoteId: quoteId,
        timestamp: Date.now()
      }));

      // Deep link to Venmo app
      const venmoUrl = `venmo://paycharge?txn=pay&recipients=${cleanUsername}&amount=${amountStr}&note=${encodedNote}`;
      const webUrl = `https://venmo.com/${cleanUsername}?txn=pay&amount=${amountStr}&note=${encodedNote}`;
      
      if (isMobile) {
        // On mobile: immediately redirect to Venmo app, skip QR code screen
        onPaymentMethodSelected('venmo');
        
        // Try to open Venmo app
        const link = document.createElement('a');
        link.href = venmoUrl;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // After a short delay, redirect to thank you page
        // This gives them time to complete payment in Venmo app
        setTimeout(() => {
          window.location.href = thankYouUrl;
        }, 2000);
      } else {
        // On desktop: show QR code screen with return link
        const qr = generateQRCode(webUrl);
        setVenmoQr(qr);
        setLocalSelectedMethod('venmo');
        onPaymentMethodSelected('venmo');
        
        // Store thank you URL for the VenmoPaymentScreen component
        sessionStorage.setItem('venmo_thank_you_url', thankYouUrl);
      }
    } catch (err) {
      console.error('Venmo payment error:', err);
      if (onError) onError(err.message || 'Failed to process Venmo payment. Please try again.');
    }
  };

  const handleCardClick = async () => {
    try {
      if (!quoteId) {
        throw new Error('Quote ID is missing. Please try again.');
      }
      
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      setLocalSubmitting(true);
      if (onError) onError('');
      
      console.log('Creating card checkout for event payment:', { quoteId, amount, paymentType });
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: quoteId, // quoteId is actually the lead_id
          amount: Math.round(amount * 100), // Convert dollars to cents
          description: `Event ${paymentType === 'remaining' ? 'Remaining Balance' : paymentType === 'deposit' ? 'Deposit' : 'Full Payment'}`,
          paymentType: paymentType,
          successUrl: `${window.location.origin}/quote/${quoteId}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quote/${quoteId}/payment`
        })
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse checkout response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Failed to create checkout session`;
        throw new Error(errorMsg);
      }

      if (data.url || data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.url || data.checkoutUrl;
      } else {
        console.error('No checkout URL in response:', data);
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('Card payment error:', err);
      if (onError) onError(err.message || 'Failed to create checkout session. Please try again.');
      setLocalSubmitting(false);
    }
  };

  const handleApplePayClick = async () => {
    // Apple Pay is handled through Stripe Checkout
    // Stripe will automatically show Apple Pay if available
    await handleCardClick();
  };

  const isSubmitting = localSubmitting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Choose Payment Method
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Total: <span className="font-bold text-brand">${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
            {paymentType === 'deposit' && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Deposit payment (50% of total)
              </p>
            )}
            {paymentType === 'remaining' && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Remaining balance payment
              </p>
            )}
          </div>

          {localSelectedMethod === 'cashapp' && cashAppQr ? (
            <CashAppPaymentScreen
              qrCode={cashAppQr}
              cashtag={paymentSettings?.cashAppTag || '$M10DJ'}
              amount={amount}
              requestId={quoteId}
              paymentCode={quoteId?.substring(0, 8).toUpperCase()}
              paymentNote={buildPaymentNote()}
              onBack={() => {
                setLocalSelectedMethod(null);
                setCashAppQr(null);
                onPaymentMethodSelected(null);
              }}
            />
          ) : localSelectedMethod === 'venmo' && venmoQr ? (
            <VenmoPaymentScreen
              qrCode={venmoQr}
              username={paymentSettings?.venmoUsername || '@m10dj'}
              amount={amount}
              requestId={quoteId}
              paymentCode={quoteId?.substring(0, 8).toUpperCase()}
              paymentNote={buildPaymentNote()}
              onBack={() => {
                setLocalSelectedMethod(null);
                setVenmoQr(null);
                onPaymentMethodSelected(null);
              }}
            />
          ) : localSelectedMethod === 'card' ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Redirecting to secure payment...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Cash App */}
              <button
                type="button"
                onClick={handleCashAppClick}
                disabled={isSubmitting || !paymentSettings}
                className="group relative w-full p-5 rounded-2xl border-2 border-green-500/80 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/40 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 dark:hover:from-green-900/50 dark:hover:via-emerald-900/40 dark:hover:to-green-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-green-400/5 to-green-400/10 group-hover:from-green-400/5 group-hover:via-green-400/10 group-hover:to-green-400/15 transition-all duration-300"></div>
                <div className="relative flex items-center justify-start gap-4 pl-2">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                    <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M31.453 4.625c-0.688-1.891-2.177-3.375-4.068-4.063-1.745-0.563-3.333-0.563-6.557-0.563h-9.682c-3.198 0-4.813 0-6.531 0.531-1.896 0.693-3.385 2.188-4.068 4.083-0.547 1.734-0.547 3.333-0.547 6.531v9.693c0 3.214 0 4.802 0.531 6.536 0.688 1.891 2.177 3.375 4.068 4.063 1.734 0.547 3.333 0.547 6.536 0.547h9.703c3.214 0 4.813 0 6.536-0.531 1.896-0.688 3.391-2.182 4.078-4.078 0.547-1.734 0.547-3.333 0.547-6.536v-9.667c0-3.214 0-4.813-0.547-6.547zM23.229 10.802l-1.245 1.24c-0.25 0.229-0.635 0.234-0.891 0.010-1.203-1.010-2.724-1.568-4.292-1.573-1.297 0-2.589 0.427-2.589 1.615 0 1.198 1.385 1.599 2.984 2.198 2.802 0.938 5.12 2.109 5.12 4.854 0 2.99-2.318 5.042-6.104 5.266l-0.349 1.604c-0.063 0.302-0.328 0.516-0.635 0.516h-2.391l-0.12-0.010c-0.354-0.078-0.578-0.432-0.505-0.786l0.375-1.693c-1.438-0.359-2.76-1.083-3.844-2.094v-0.016c-0.25-0.25-0.25-0.656 0-0.906l1.333-1.292c0.255-0.234 0.646-0.234 0.896 0 1.214 1.146 2.839 1.786 4.521 1.76 1.734 0 2.891-0.734 2.891-1.896s-1.172-1.464-3.385-2.292c-2.349-0.839-4.573-2.026-4.573-4.802 0-3.224 2.677-4.797 5.854-4.943l0.333-1.641c0.063-0.302 0.333-0.516 0.641-0.51h2.37l0.135 0.016c0.344 0.078 0.573 0.411 0.495 0.76l-0.359 1.828c1.198 0.396 2.333 1.026 3.302 1.849l0.031 0.031c0.25 0.266 0.25 0.667 0 0.906z" className="text-green-600 dark:text-green-400"/>
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pay with Cash App
                  </span>
                </div>
              </button>

              {/* Venmo */}
              <button
                type="button"
                onClick={handleVenmoClick}
                disabled={isSubmitting || !paymentSettings}
                className="group relative w-full p-5 rounded-2xl border-2 border-blue-500/80 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-blue-950/40 hover:from-blue-100 hover:via-cyan-100 hover:to-blue-100 dark:hover:from-blue-900/50 dark:hover:via-cyan-900/40 dark:hover:to-blue-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/5 to-blue-400/10 group-hover:from-blue-400/5 group-hover:via-blue-400/10 group-hover:to-blue-400/15 transition-all duration-300"></div>
                <div className="relative flex items-center justify-start gap-4 pl-2">
                  <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z" className="text-blue-600 dark:text-blue-400"/>
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pay with Venmo
                  </span>
                </div>
              </button>

              {/* Credit/Debit Card */}
              <button
                type="button"
                onClick={handleCardClick}
                disabled={isSubmitting}
                className="group relative w-full p-5 rounded-2xl border-2 border-purple-500/80 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-purple-950/40 hover:from-purple-100 hover:via-pink-100 hover:to-purple-100 dark:hover:from-purple-900/50 dark:hover:via-pink-900/40 dark:hover:to-purple-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/5 to-purple-400/10 group-hover:from-purple-400/5 group-hover:via-purple-400/10 group-hover:to-purple-400/15 transition-all duration-300"></div>
                <div className="relative flex items-center justify-start gap-4 pl-2">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pay with Card
                  </span>
                </div>
              </button>

              {/* Apple Pay */}
              <button
                type="button"
                onClick={handleApplePayClick}
                disabled={isSubmitting}
                className="group relative w-full p-4 rounded-lg bg-black hover:bg-gray-900 active:bg-gray-800 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span className="text-white font-semibold text-base font-sans tracking-tight">
                    Pay with Apple Pay
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(EventPaymentMethodSelection);

