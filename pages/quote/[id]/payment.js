import { useRouter } from 'next/router';
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import QuoteBottomNav from '../../../components/quote/QuoteBottomNav';
import { CreditCard, ArrowLeft, Loader2, CheckCircle, Lock, AlertCircle, FileText, X, Clock, Calendar } from 'lucide-react';
import EventPaymentMethodSelection from '../../../components/quote/EventPaymentMethodSelection';

export default function PaymentPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState('deposit'); // 'deposit' or 'full'
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [payments, setPayments] = useState([]);
  const [hasPayments, setHasPayments] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedSavedPaymentMethod, setSelectedSavedPaymentMethod] = useState(null);
  const [showSavedPaymentMethods, setShowSavedPaymentMethods] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  // Refetch data when the page becomes visible (e.g., navigating from other quote pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const fetchData = async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/quote/${id}?_t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
        
        // Check if event date has passed (expiration check)
        if (lead.eventDate || lead.event_date) {
          const eventDate = new Date(lead.eventDate || lead.event_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
          eventDate.setHours(0, 0, 0, 0);
          
          if (eventDate < today) {
            setIsExpired(true);
          }
        }
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        
        // Parse speaker_rental if it's a JSON string
        if (quote.speaker_rental && typeof quote.speaker_rental === 'string') {
          try {
            quote.speaker_rental = JSON.parse(quote.speaker_rental);
          } catch (e) {
            console.error('Error parsing speaker_rental:', e);
          }
        }
        
        console.log('Payment page - Quote data:', {
          is_custom_price: quote.is_custom_price,
          total_price: quote.total_price,
          package_price: quote.package_price,
          package_name: quote.package_name,
          speaker_rental: quote.speaker_rental ? 'present' : 'null',
          discount_type: quote.discount_type,
          discount_value: quote.discount_value,
          custom_addons: quote.custom_addons,
          addons: quote.addons,
          raw_total_price: quote.total_price,
          typeof_total_price: typeof quote.total_price
        });
        setQuoteData(quote);
        
        // Fetch payment history
        try {
          const paymentsResponse = await fetch(`/api/quote/${id}/payments?_t=${timestamp}`, { cache: 'no-store' });
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            if (paymentsData.payments && paymentsData.payments.length > 0) {
              // Store all payments
              setPayments(paymentsData.payments);
              
              // Filter for paid payments only (like invoice page does)
              const paidPayments = paymentsData.payments.filter(p => p.payment_status === 'Paid');
              if (paidPayments.length > 0) {
                setHasPayments(true);
                
                // Calculate if deposit was paid to set initial payment type
                const totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
                
                // Only set default if we have quote data to calculate total
                if (quote && totalPaid > 0) {
                  const quoteTotal = Number(quote.total_price) || 0;
                  if (totalPaid < quoteTotal) {
                    // Deposit paid but not full - default to 'remaining' but allow user to change
                    setPaymentType('remaining');
                  }
                }
              } else {
                setHasPayments(false);
              }
            } else {
              setPayments([]);
              setHasPayments(false);
            }
          } else {
            // If API call fails, still set empty arrays
            setPayments([]);
            setHasPayments(false);
          }
        } catch (error) {
          console.error('Error fetching payments:', error);
          setPayments([]);
          setHasPayments(false);
        }

        // Fetch saved payment methods
        try {
          const savedMethodsResponse = await fetch(`/api/stripe/get-saved-payment-methods?leadId=${id}`, { cache: 'no-store' });
          if (savedMethodsResponse.ok) {
            const savedMethodsData = await savedMethodsResponse.json();
            if (savedMethodsData.paymentMethods && savedMethodsData.paymentMethods.length > 0) {
              setSavedPaymentMethods(savedMethodsData.paymentMethods);
              setShowSavedPaymentMethods(true);
            } else {
              setSavedPaymentMethods([]);
              setShowSavedPaymentMethods(false);
            }
          }
        } catch (error) {
          console.error('Error fetching saved payment methods:', error);
          setSavedPaymentMethods([]);
          setShowSavedPaymentMethods(false);
        }
      } else {
        // Quote not found - this is okay, we can still show payment page
        // but user should select services first
        console.log('Quote not found - user may need to select services first');
        setError('Quote not found. Please select services first.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAddon = async (addonIndex) => {
    if (!quoteData || !quoteData.addons || addonIndex < 0 || addonIndex >= quoteData.addons.length) {
      return;
    }

    // Save original state for potential rollback
    const originalQuoteData = { ...quoteData };

    // Create updated addons array without the removed addon
    const updatedAddons = quoteData.addons.filter((_, idx) => idx !== addonIndex);
    
    // Recalculate total price
    const packagePrice = quoteData.package_price || 0;
    const addonsTotal = updatedAddons.reduce((sum, addon) => sum + (addon.price || 0), 0);
    const newTotalPrice = packagePrice + addonsTotal;

    // Update local state immediately for better UX
    const updatedQuoteData = {
      ...quoteData,
      addons: updatedAddons,
      total_price: newTotalPrice
    };
    setQuoteData(updatedQuoteData);

    // Save updated quote to database
    try {
      const response = await fetch('/api/quote/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          packageId: quoteData.package_id,
          packageName: quoteData.package_name,
          packagePrice: packagePrice,
          addons: updatedAddons,
          totalPrice: newTotalPrice
        })
      });

      if (!response.ok) {
        console.error('Failed to update quote after removing addon');
        // Revert local state if save failed
        setQuoteData(originalQuoteData);
        setError('Failed to remove addon. Please try again.');
      } else {
        // Clear any previous errors on success
        setError(null);
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      // Revert local state if save failed
      setQuoteData(originalQuoteData);
      setError('Failed to remove addon. Please try again.');
    }
  };

  // Calculate totals using useMemo to prevent unnecessary recalculations
  const {
    totalAmount,
    packagePrice,
    addons,
    subtotal,
    discountAmount,
    isCustomPrice
  } = useMemo(() => {
    // Initialize default values
    let total = 0;
    let pkgPrice = 0;
    let addonsList = [];
    let sub = 0;
    let discount = 0;
    let isCustom = false;
    
    // Return defaults if no quoteData
    if (!quoteData) {
      return {
        totalAmount: 0,
        packagePrice: 0,
        addons: [],
        subtotal: 0,
        discountAmount: 0,
        isCustomPrice: false
      };
    }
    
    // Determine if this is a custom invoice (admin-edited)
    isCustom = quoteData.is_custom_price || false;
    
    if (isCustom) {
      // Use custom invoice data - match invoice page calculation logic
      pkgPrice = Number(quoteData?.package_price) || 0;
      addonsList = quoteData?.custom_addons || quoteData?.addons || [];
      
      // Calculate subtotal: package price + addons (same as invoice page)
      const addonsTotal = addonsList.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
      sub = pkgPrice + addonsTotal;
      
      // Calculate discount if present (same logic as invoice page)
      if (quoteData?.discount_type && quoteData?.discount_value > 0) {
        if (quoteData.discount_type === 'percentage') {
          discount = sub * (Number(quoteData.discount_value) / 100);
        } else {
          discount = Number(quoteData.discount_value);
        }
      }
      
      // Calculate the final total by applying the discount to the subtotal
      // This matches the invoice page calculation logic
      // Always calculate: subtotal - discount (this ensures discount is always applied correctly)
      // Don't use database total_price when discount exists, as it may not reflect the current discount
      total = Math.max(0, sub - discount);
      
      console.log('Payment page - Custom invoice calculation:', {
        packagePrice: pkgPrice,
        addonsTotal: addonsList.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0),
        subtotal: sub,
        discountAmount: discount,
        total_price_from_db: quoteData?.total_price,
        calculated_total: total
      });
    } else {
      // Use standard service selection data
      pkgPrice = Number(quoteData.package_price) || 0;
      
      // Check for speaker rental if no package
      if (!pkgPrice && quoteData.speaker_rental) {
        try {
          const speakerRental = typeof quoteData.speaker_rental === 'string' 
            ? JSON.parse(quoteData.speaker_rental) 
            : quoteData.speaker_rental;
          if (speakerRental?.price) {
            pkgPrice = Number(speakerRental.price) || 0;
          }
        } catch (e) {
          console.error('Error parsing speaker rental:', e);
        }
      }
      
      addonsList = quoteData.addons || [];
      const addonsTotal = addonsList.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
      sub = pkgPrice + addonsTotal;
      
      // For non-custom invoices, use total_price if available, otherwise calculate
      const dbTotalPrice = quoteData.total_price;
      if (dbTotalPrice !== undefined && dbTotalPrice !== null && dbTotalPrice !== '') {
        const parsedTotal = Number(dbTotalPrice);
        total = !isNaN(parsedTotal) && parsedTotal >= 0 ? parsedTotal : sub;
      } else {
        total = sub;
      }
    }
    
    return {
      totalAmount: total,
      packagePrice: pkgPrice,
      addons: addonsList,
      subtotal: sub,
      discountAmount: discount,
      isCustomPrice: isCustom
    };
  }, [quoteData]);

  const handlePayment = async () => {
    if (!quoteData) {
      setError('Quote data is missing. Please select services first.');
      return;
    }
    
    if (totalAmount <= 0) {
      setError('Invalid payment amount. Please contact support.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Calculate payment amount based on payment type and status
      const isSmallAmount = totalAmount < 10;
      let amount;
      let description;
      
      if (hasDepositPaid) {
        // If deposit was paid, charge remaining balance (both 'remaining' and 'full' options pay the remaining)
        amount = Math.round(remainingBalanceAmount * 100);
        description = paymentType === 'full' 
          ? `Full payment (remaining balance) for ${quoteData.package_name}`
          : `Remaining balance for ${quoteData.package_name}`;
      } else if (isSmallAmount) {
        // For small amounts, charge full amount
        amount = Math.round(totalAmount * 100);
        description = `Full payment for ${quoteData.package_name}`;
      } else if (paymentType === 'deposit') {
        // 50% deposit
        amount = Math.round(totalAmount * 0.5 * 100);
        description = `Deposit for ${quoteData.package_name}`;
      } else {
        // Full payment
        amount = Math.round(totalAmount * 100);
        description = `Full payment for ${quoteData.package_name}`;
      }

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          amount: amount,
          description: description,
          paymentType: hasDepositPaid ? 'remaining' : (paymentType === 'deposit' ? 'deposit' : 'full'),
          successUrl: `${window.location.origin}/quote/${id}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/quote/${id}/payment`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment session');
      }

      const { sessionId, url, isFreeOrder } = await response.json();

      // Handle free orders ($0 payments) - redirect directly to thank you page
      if (isFreeOrder && url) {
        window.location.href = url;
        return;
      }

      // Redirect to Stripe Checkout for non-zero payments
      if (url) {
        window.location.href = url;
      } else if (sessionId) {
        // Fallback: Redirect to Stripe checkout using the session ID
        // We'll construct the checkout URL or use the API to get it
        throw new Error('Payment session created but redirect URL not available. Please contact support.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Payment | M10 DJ Company</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:title" content="Make Payment - M10 DJ Company" />
          <meta property="og:description" content="Secure payment for your event" />
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Make Payment - M10 DJ Company" />
          <meta name="twitter:description" content="Secure payment for your event" />
          <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading payment information...</p>
          </div>
        </div>
      </>
    );
  }

  // Calculate payment status
  const totalPaid = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
  const isFullyPaid = totalPaid >= totalAmount;
  const hasDepositPaid = totalPaid > 0 && totalPaid < totalAmount;
  const remainingBalanceAmount = Math.max(0, totalAmount - totalPaid);
  
  // For very small amounts (like $1), don't split into deposit - just charge full amount
  // totalAmount, packagePrice, addons, subtotal, and discountAmount are already calculated above
  const depositAmount = totalAmount < 10 ? totalAmount : totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  
  // Determine payment amount based on payment status
  let paymentAmount;
  if (hasDepositPaid) {
    // If deposit was paid, show options based on payment type
    // 'remaining' means pay remaining balance, 'full' means pay in full (remaining balance)
    if (paymentType === 'remaining' || paymentType === 'deposit') {
      paymentAmount = remainingBalanceAmount;
    } else {
      // Pay in full (remaining balance)
      paymentAmount = remainingBalanceAmount;
    }
    // Don't auto-set payment type - let user choose
  } else if (totalAmount < 10) {
    // For small amounts, always use full payment
    paymentAmount = totalAmount;
  } else {
    // For new payments, use selected payment type
    paymentAmount = paymentType === 'deposit' ? depositAmount : totalAmount;
  }

  // Check if quote has expired (event date has passed)
  if (isExpired && leadData) {
    return (
      <>
        <Head>
          <title>Payment Expired | M10 DJ Company</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <div className="text-6xl mb-4">⏰</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Payment Page Expired</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This payment page has expired because the event date has passed.
            </p>
            {leadData.eventDate && (
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                Event Date: {new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Link href="/#contact" className="btn-primary inline-flex items-center gap-2">
                Get a New Quote
              </Link>
              <Link href="/" className="btn-secondary">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If no quote data, show message
  if (!quoteData && !loading) {
    return (
      <>
        <Head>
          <title>Payment | M10 DJ Company</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <main className="section-container py-12 md:py-20 pb-32 md:pb-32">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Select Services First
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Please select your services before making a payment.
              </p>
              <Link
                href={`/quote/${id}`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Service Selection
              </Link>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Make Payment | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />

          <main className="section-container py-12 md:py-20 pb-32 md:pb-32">
          {/* Header */}
          <div className="max-w-2xl mx-auto mb-8">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Secure Payment
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Complete your booking with a secure payment
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-200">Payment Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-8">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Summary</h2>
              
              {quoteData && (
                <div className="space-y-4 mb-6">
                  {/* Package */}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{quoteData.package_name || 'Package'}</p>
                    <p className="text-gray-600 dark:text-gray-400">${packagePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  
                  {/* Add-ons */}
                  {addons && addons.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="font-semibold text-gray-900 dark:text-white mb-2">Add-ons:</p>
                      <ul className="space-y-2">
                        {addons.map((addon, idx) => (
                          <li key={idx} className="group flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex-1">{addon.name}</span>
                            <div className="flex items-center gap-2">
                              <span>${addon.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              {!isCustomPrice && (
                                <button
                                  onClick={() => handleRemoveAddon(idx)}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all"
                                  title="Remove addon"
                                  aria-label={`Remove ${addon.name}`}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      Discount {quoteData.discount_type === 'percentage' ? `(${quoteData.discount_value}%)` : `($${quoteData.discount_value.toLocaleString()})`}:
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      -${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>Total:</span>
                    <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Payment Type Selection - Show for all cases when amount >= 10 */}
              {totalAmount >= 10 && (
                <div className="mt-6 space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Payment Type
                  </label>
                  
                  {/* Show deposit status if already paid */}
                  {hasDepositPaid && (
                    <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                            Deposit Paid: ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Remaining balance: ${remainingBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {/* Pay Remaining Balance / Next Installment */}
                    <label className={`flex items-center p-4 border-2 rounded-lg transition-colors ${
                      hasDepositPaid 
                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' 
                        : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                      style={{ 
                        borderColor: (hasDepositPaid ? (paymentType === 'remaining' || paymentType === 'deposit') : paymentType === 'deposit') ? '#8B5CF6' : 'transparent',
                        opacity: hasDepositPaid ? 1 : 1
                      }}>
                      <input
                        type="radio"
                        name="paymentType"
                        value={hasDepositPaid ? 'remaining' : 'deposit'}
                        checked={hasDepositPaid ? (paymentType === 'remaining' || paymentType === 'deposit') : paymentType === 'deposit'}
                        onChange={(e) => setPaymentType(hasDepositPaid ? 'remaining' : 'deposit')}
                        className="mr-3 text-brand focus:ring-brand"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {hasDepositPaid ? 'Pay Remaining Balance' : 'Pay Deposit (50%)'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${hasDepositPaid ? remainingBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now
                        </p>
                        {!hasDepositPaid && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Remaining ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due 7 days before event
                          </p>
                        )}
                      </div>
                    </label>
                    
                    {/* Pay in Full */}
                    <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                      style={{ borderColor: paymentType === 'full' ? '#8B5CF6' : 'transparent' }}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={paymentType === 'full'}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mr-3 text-brand focus:ring-brand"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">Pay in Full</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${hasDepositPaid ? remainingBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} now
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {hasDepositPaid ? 'Complete your payment' : 'Save time and pay everything upfront'}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Show remaining balance info for small amounts when deposit is paid */}
              {hasDepositPaid && totalAmount < 10 && (
                <div className="mt-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 dark:text-white">Remaining Balance</span>
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        ${remainingBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your deposit of ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} has been received. Complete your payment below.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment Details</h2>
              
              <div className="space-y-6">
                {/* Amount Display */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount to Pay</p>
                  <p className="text-3xl font-bold text-brand">${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                {/* Saved Payment Methods */}
                {showSavedPaymentMethods && savedPaymentMethods.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Use Saved Payment Method</p>
                    <div className="space-y-2">
                      {savedPaymentMethods.map((pm) => (
                        <button
                          key={pm.id}
                          onClick={async () => {
                            setProcessing(true);
                            setError(null);
                            try {
                              const response = await fetch('/api/stripe/charge-saved-payment-method', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  leadId: id,
                                  paymentMethodId: pm.id,
                                  amount: paymentAmount,
                                  description: hasDepositPaid 
                                    ? (paymentType === 'full' 
                                        ? `Full payment (remaining balance) for ${quoteData?.package_name || 'event'}`
                                        : `Remaining balance for ${quoteData?.package_name || 'event'}`)
                                    : (paymentType === 'deposit' 
                                        ? `Deposit for ${quoteData?.package_name || 'event'}`
                                        : `Full payment for ${quoteData?.package_name || 'event'}`),
                                  paymentType: hasDepositPaid ? (paymentType === 'full' ? 'full' : 'remaining') : paymentType
                                })
                              });

                              const data = await response.json();
                              if (response.ok && data.success) {
                                // Redirect to thank you page
                                window.location.href = `/quote/${id}/thank-you?payment_intent=${data.paymentIntentId}`;
                              } else {
                                throw new Error(data.error || 'Payment failed');
                              }
                            } catch (err) {
                              console.error('Error charging saved payment method:', err);
                              setError(err.message || 'Failed to charge saved payment method');
                              setProcessing(false);
                            }
                          }}
                          disabled={processing}
                          className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-brand dark:hover:border-brand transition-colors text-left bg-white dark:bg-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  •••• •••• •••• {pm.card.last4}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {pm.card.brand.toUpperCase()} • Expires {pm.card.expMonth}/{pm.card.expYear}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm text-brand font-medium">Use This Card</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Or use a different payment method below
                      </p>
                    </div>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-800 dark:text-blue-200 text-sm">Secure Payment</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Your payment is processed securely through Stripe. {savedPaymentMethods.length > 0 
                          ? 'You can save your card for faster future payments.'
                          : 'We can save your card securely for faster future payments.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={() => setShowPaymentMethodModal(true)}
                  disabled={processing || !quoteData || isFullyPaid}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 py-4 text-lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : isFullyPaid ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Payment Complete
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {paymentType === 'full' 
                        ? `Pay in Full ($${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) Securely`
                        : hasDepositPaid
                          ? `Pay Remaining Balance ($${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) Securely`
                          : `Pay ${paymentType === 'deposit' ? 'Deposit' : 'in Full'} ($${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) Securely`
                      }
                    </>
                  )}
                </button>


                {/* Alternative Payment */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                    Prefer to pay another way?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                    Contact us at <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a> or{' '}
                    <a href="mailto:info@m10djcompany.com" className="text-brand hover:underline">info@m10djcompany.com</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Section - Always show if there are paid payments */}
          {(() => {
            const paidPayments = payments.filter(p => p.payment_status === 'Paid');
            if (paidPayments.length === 0) return null;
            
            return (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment History</h2>
                
                {/* Previous Payments */}
                {paidPayments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Previous Payments
                    </h3>
                    <div className="space-y-3">
                      {paidPayments.map((payment, idx) => {
                          const paymentDate = payment.transaction_date 
                            ? new Date(payment.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                            : payment.created_at 
                              ? new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Date not available';
                          
                          const isRetainer = payment.payment_type === 'Deposit' || 
                                            payment.payment_type === 'Retainer' ||
                                            payment.description?.toLowerCase().includes('deposit') ||
                                            payment.description?.toLowerCase().includes('retainer') ||
                                            (idx === 0 && paidPayments.length > 1);
                          
                          return (
                            <div key={payment.id || idx} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {isRetainer ? 'Retainer Paid' : 'Payment Received'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {paymentDate}
                                  </span>
                                  {payment.description && (
                                    <span className="text-xs">• {payment.description}</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${(parseFloat(payment.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
                
                {/* Upcoming Payments */}
                {!isFullyPaid && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      Upcoming Payments
                    </h3>
                    <div className="space-y-3">
                      {(() => {
                        const stillOwed = totalAmount - totalPaid;
                        
                        // If deposit was paid but balance remains
                        if (totalPaid > 0 && totalPaid < totalAmount) {
                          return (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900 dark:text-white">Remaining Balance</span>
                                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                  ${stillOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due 7 days before event
                              </p>
                            </div>
                          );
                        }
                        
                        // If no payments made yet, show both deposit and remaining balance
                        if (totalPaid === 0 && totalAmount >= 10) {
                          return (
                            <>
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">Deposit (50%)</span>
                                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Due upon signing contract
                                </p>
                              </div>
                              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-gray-900 dark:text-white">Remaining Balance</span>
                                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                    ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Due 7 days before event
                                </p>
                              </div>
                            </>
                          );
                        }
                        
                        return null;
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* Additional Links */}
          <div className="max-w-2xl mx-auto mt-8 mb-6 sm:mb-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/quote/${id}/invoice`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Invoice
            </Link>
            <Link
              href={`/quote/${id}/contract`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Contract
            </Link>
          </div>
        </main>
      </div>

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && (
        <EventPaymentMethodSelection
          isOpen={showPaymentMethodModal}
          onClose={() => setShowPaymentMethodModal(false)}
          amount={paymentAmount}
          quoteId={id}
          paymentType={hasDepositPaid ? 'remaining' : paymentType}
          onPaymentMethodSelected={(method) => {
            console.log('Payment method selected:', method);
            if (method === 'card') {
              // For card payments, use the existing handlePayment function
              handlePayment();
            }
            // Cash App and Venmo are handled within the modal
          }}
          onError={(error) => {
            setError(error);
            setShowPaymentMethodModal(false);
          }}
        />
      )}
      <QuoteBottomNav quoteId={id} />
    </>
  );
}
