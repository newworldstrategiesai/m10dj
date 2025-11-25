import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, Users, Edit, Save, X, Settings, Percent, DollarSign } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';
import VenueAutocomplete from '@/components/VenueAutocomplete';

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [hasPayment, setHasPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [showLineItemPrices, setShowLineItemPrices] = useState(true); // Default to showing prices
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState(null); // 'percentage' | 'flat' | null
  const [discountValue, setDiscountValue] = useState(0);
  const [discountNote, setDiscountNote] = useState('');
  const [isEditingEventDate, setIsEditingEventDate] = useState(false);
  const [editingEventDate, setEditingEventDate] = useState('');
  const [savingEventDate, setSavingEventDate] = useState(false);
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [editingVenueName, setEditingVenueName] = useState('');
  const [editingVenueAddress, setEditingVenueAddress] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);
  const [lookingUpVenue, setLookingUpVenue] = useState(false);
  const venueLookupTimeoutRef = useRef(null);
  const [dueDateType, setDueDateType] = useState('7_days_before'); // 'upon_receipt' | 'day_of_event' | '7_days_before'
  const [depositDueDate, setDepositDueDate] = useState('');
  const [remainingBalanceDueDate, setRemainingBalanceDueDate] = useState('');
  const [depositDueDateType, setDepositDueDateType] = useState('upon_receipt'); // 'upon_receipt' | 'day_of_event' | '7_days_before' | 'custom'
  const [remainingBalanceDueDateType, setRemainingBalanceDueDateType] = useState('7_days_before'); // 'upon_receipt' | 'day_of_event' | '7_days_before' | 'custom'
  const [customDepositDueDate, setCustomDepositDueDate] = useState('');
  const [customRemainingBalanceDueDate, setCustomRemainingBalanceDueDate] = useState('');
  const [isEditingDepositDueDate, setIsEditingDepositDueDate] = useState(false);
  const [isEditingRemainingDueDate, setIsEditingRemainingDueDate] = useState(false);
  const [paymentTermsType, setPaymentTermsType] = useState(null); // 'set_number' | 'client_selects' | null
  const [numberOfPayments, setNumberOfPayments] = useState(2); // Default to 2 (deposit + final)
  const [paymentSchedule, setPaymentSchedule] = useState([]); // Array of { amount, dueDate }
  const [isEditingPaymentTerms, setIsEditingPaymentTerms] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const adminEmails = [
            'admin@m10djcompany.com',
            'manager@m10djcompany.com',
            'djbenmurray@gmail.com'
          ];
          setIsAdmin(adminEmails.includes(user.email));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    checkAdmin();
  }, [supabase]);

  const fetchData = useCallback(async () => {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/quote/${id}?_t=${timestamp}`, { cache: 'no-store' })
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        console.log('Fetched lead data:', lead);
        console.log('Lead eventDate:', lead.eventDate, 'Type:', typeof lead.eventDate);
        setLeadData(lead);
        
        // Initialize event date editing state
        if (lead.eventDate) {
          // Handle both date string formats (YYYY-MM-DD or ISO string)
          const dateStr = typeof lead.eventDate === 'string' 
            ? lead.eventDate.split('T')[0]  // Extract YYYY-MM-DD from ISO string if needed
            : new Date(lead.eventDate).toISOString().split('T')[0];
          console.log('Setting editingEventDate to:', dateStr);
          setEditingEventDate(dateStr);
        }
        
        // Initialize venue editing state
        // Only set venue address if it's different from venue name (to avoid duplicates)
        const venueName = lead.venueName || '';
        const venueAddress = lead.location && lead.location !== venueName ? lead.location : '';
        setEditingVenueName(venueName);
        setEditingVenueAddress(venueAddress);
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        
        // Initialize discount from quote data BEFORE setting quoteData
        // This ensures discount state is available when calculateTotals() runs
        if (quote.discount_type) {
          setDiscountType(quote.discount_type);
          setDiscountValue(quote.discount_value || 0);
          setDiscountNote(quote.discount_note || '');
        } else {
          // Reset discount if not present
          setDiscountType(null);
          setDiscountValue(0);
          setDiscountNote('');
        }
        
        // Initialize show line item prices setting (default to true if not set)
        setShowLineItemPrices(quote.show_line_item_prices !== undefined ? quote.show_line_item_prices : true);
        
        // Initialize due date type (default to '7_days_before' if not set)
        if (quote.due_date_type) {
          setDueDateType(quote.due_date_type);
        }
        
        // Initialize deposit and remaining balance due dates
        if (quote.deposit_due_date) {
          setDepositDueDate(quote.deposit_due_date);
          // Determine if it's a preset or custom date
          const depositDate = new Date(quote.deposit_due_date);
          const invoiceDateObj = new Date(invoiceDate);
          const eventDateObj = leadData?.eventDate ? new Date(leadData.eventDate) : null;
          
          if (eventDateObj) {
            const sevenDaysBefore = new Date(eventDateObj);
            sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
            
            if (depositDate.toDateString() === invoiceDateObj.toDateString()) {
              setDepositDueDateType('upon_receipt');
            } else if (depositDate.toDateString() === eventDateObj.toDateString()) {
              setDepositDueDateType('day_of_event');
            } else if (depositDate.toDateString() === sevenDaysBefore.toDateString()) {
              setDepositDueDateType('7_days_before');
            } else {
              setDepositDueDateType('custom');
              setCustomDepositDueDate(quote.deposit_due_date);
            }
          } else {
            setDepositDueDateType('custom');
            setCustomDepositDueDate(quote.deposit_due_date);
          }
        }
        
        if (quote.remaining_balance_due_date) {
          setRemainingBalanceDueDate(quote.remaining_balance_due_date);
          // Determine if it's a preset or custom date
          const remainingDate = new Date(quote.remaining_balance_due_date);
          const invoiceDateObj = new Date(invoiceDate);
          const eventDateObj = leadData?.eventDate ? new Date(leadData.eventDate) : null;
          
          if (eventDateObj) {
            const sevenDaysBefore = new Date(eventDateObj);
            sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
            
            if (remainingDate.toDateString() === invoiceDateObj.toDateString()) {
              setRemainingBalanceDueDateType('upon_receipt');
            } else if (remainingDate.toDateString() === eventDateObj.toDateString()) {
              setRemainingBalanceDueDateType('day_of_event');
            } else if (remainingDate.toDateString() === sevenDaysBefore.toDateString()) {
              setRemainingBalanceDueDateType('7_days_before');
            } else {
              setRemainingBalanceDueDateType('custom');
              setCustomRemainingBalanceDueDate(quote.remaining_balance_due_date);
            }
          } else {
            setRemainingBalanceDueDateType('custom');
            setCustomRemainingBalanceDueDate(quote.remaining_balance_due_date);
          }
        }
        
        // Initialize payment terms type
        if (quote.payment_terms_type) {
          setPaymentTermsType(quote.payment_terms_type);
        }
        if (quote.number_of_payments) {
          setNumberOfPayments(quote.number_of_payments);
        }
        if (quote.payment_schedule && Array.isArray(quote.payment_schedule)) {
          setPaymentSchedule(quote.payment_schedule);
        }
        
        // Set quote data after discount is initialized
        setQuoteData(quote);
        
        // If quote has invoice_id, fetch invoice details
        if (quote.invoice_id) {
          try {
            const invoiceResponse = await fetch(`/api/invoices/${quote.invoice_id}`);
            if (invoiceResponse.ok) {
              const invoice = await invoiceResponse.json();
              setInvoiceData(invoice);
            }
          } catch (e) {
            console.log('Could not fetch invoice details:', e);
          }
        }

        // Fetch payment data to show payment status
        try {
          const paymentsResponse = await fetch(`/api/payments?contact_id=${id}`);
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            if (paymentsData.payments && paymentsData.payments.length > 0) {
              // Filter for paid payments
              const paidPayments = paymentsData.payments.filter(p => p.payment_status === 'Paid');
              if (paidPayments.length > 0) {
                setHasPayment(true);
                const totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
                setPaymentData({ totalPaid, payments: paidPayments });
              } else {
                setHasPayment(false);
              }
            } else {
              setHasPayment(false);
            }
          }
        } catch (error) {
          console.error('Error checking payments:', error);
          setHasPayment(false);
        }
      } else {
        // Quote not found, but we can still show invoice based on lead data
        console.log('Quote not found, will display invoice from lead data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id, fetchData]);

  // Refetch data when the page becomes visible (e.g., navigating from contract page)
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
  }, [id, fetchData]);

  const handleDownload = () => {
    // Generate PDF or print
    window.print();
  };

  const handleSaveInvoice = async () => {
    if (!router.isReady || !id) {
      console.error('Cannot save: router not ready or id missing', { isReady: router.isReady, id });
      toast({
        title: 'Error',
        description: 'Please wait for the page to finish loading',
        variant: 'destructive',
      });
      return;
    }
    
    if (!editingQuote) {
      console.error('Cannot save: missing editingQuote');
      toast({
        title: 'Error',
        description: 'Cannot save invoice: no changes to save',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      // Calculate due date based on selected type
      const calculatedDueDate = calculateDueDate(dueDateType, leadData?.eventDate, invoiceDate);
      
      const payload = {
        total_price: totalAmount,
        package_price: packagePrice,
        custom_line_items: packageLineItems,
        custom_addons: addons,
        is_custom_price: true,
        discount_type: discountType,
        discount_value: discountValue > 0 ? discountValue : null,
        discount_note: discountNote || null,
        show_line_item_prices: showLineItemPrices,
        due_date_type: dueDateType,
        due_date: calculatedDueDate,
        deposit_due_date: depositDueDate || null,
        remaining_balance_due_date: remainingBalanceDueDate || null
      };
      
      console.log('Saving invoice with payload:', payload);
      
      const response = await fetch(`/api/quote/${id}/update-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();
      
      if (response.ok) {
        const updated = responseData;
        
        console.log('Invoice saved successfully:', updated);
        
        // Exit edit mode immediately
        setIsEditing(false);
        setEditingQuote(null);
        
        // Update discount state from response
        if (updated.discount_type) {
          setDiscountType(updated.discount_type);
          setDiscountValue(updated.discount_value || 0);
          setDiscountNote(updated.discount_note || '');
        } else {
          setDiscountType(null);
          setDiscountValue(0);
          setDiscountNote('');
        }
        
        // Update show line item prices from response immediately
        const newShowPrices = updated.show_line_item_prices !== undefined ? updated.show_line_item_prices : true;
        setShowLineItemPrices(newShowPrices);
        
        // Update quote data with the latest from server
        setQuoteData(updated);
        
        toast({
          title: 'Invoice Updated',
          description: 'The invoice has been successfully updated.',
        });
        
        // Refresh data to ensure everything is in sync with the database
        await fetchData();
      } else {
        console.error('Error response from API:', responseData);
        console.error('Error code:', responseData.code);
        console.error('Error hint:', responseData.hint);
        toast({
          title: 'Error',
          description: responseData.details || responseData.error || 'Failed to update invoice',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save invoice changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original quote data
    if (quoteData) {
      const lineItems = getPackageLineItemsFromQuote(quoteData);
      setEditingQuote({
        ...quoteData,
        editedLineItems: lineItems,
        editedAddons: quoteData.addons || [],
        editedPackagePrice: quoteData.package_price,
        editedTotalPrice: quoteData.total_price
      });
    }
  };

  const handleLineItemPriceChange = (index, newPrice) => {
    if (!editingQuote) return;
    const updated = [...editingQuote.editedLineItems];
    updated[index] = { ...updated[index], price: Number(newPrice) || 0 };
    setEditingQuote({ ...editingQuote, editedLineItems: updated });
  };

  const handleAddonPriceChange = (index, newPrice) => {
    if (!editingQuote) return;
    const updated = [...editingQuote.editedAddons];
    updated[index] = { ...updated[index], price: Number(newPrice) || 0 };
    setEditingQuote({ ...editingQuote, editedAddons: updated });
  };

  const handleTotalPriceChange = (newPrice) => {
    if (!editingQuote) return;
    setEditingQuote({ ...editingQuote, editedTotalPrice: Number(newPrice) || 0 });
  };

  // Get package breakdown for line items (define early so it can be used by other functions)
  const getPackageBreakdown = (packageId) => {
    const breakdowns = {
      // Wedding Package Breakdowns
      'package1': [
        { item: 'Up to 4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
      ],
      'package2': [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 }
      ],
      'package3': [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
        { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
      ],
      // Corporate Package Breakdowns
      'corporate-basics': [
        { item: 'Up to 3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 850 }
      ],
      'corporate-package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
      ],
      'corporate-package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
      ],
      // School Package Breakdowns
      'school-basics': [
        { item: '3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and age-appropriate music library.', price: 850 }
      ],
      'school-package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
      ],
      'school-package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
      ]
    };
    return breakdowns[packageId] || [];
  };

  // Helper to get line items from quote data
  const getPackageLineItemsFromQuote = (quote) => {
    if (!quote?.package_id) return [];
    
    // If custom_line_items exist (from admin editing or saved breakdown), use those
    if (quote.custom_line_items && Array.isArray(quote.custom_line_items) && quote.custom_line_items.length > 0) {
      return quote.custom_line_items;
    }
    
    const breakdown = getPackageBreakdown(quote.package_id);
    if (!breakdown || breakdown.length === 0) return [];
    
    // If package was customized, filter out removed features
    if (quote.customized && quote.removed_features && Array.isArray(quote.removed_features)) {
      const removedItemNames = quote.removed_features.map(f => f.item?.toLowerCase() || '');
      return breakdown.filter(item => {
        const itemName = item.item?.toLowerCase() || '';
        return !removedItemNames.some(removed => itemName.includes(removed) || removed.includes(itemName));
      });
    }
    
    return breakdown;
  };

  // Initialize editing state when quoteData is loaded
  useEffect(() => {
    if (quoteData && !editingQuote) {
      const lineItems = getPackageLineItemsFromQuote(quoteData);
      setEditingQuote({
        ...quoteData,
        editedLineItems: lineItems,
        editedAddons: quoteData.addons || [],
        editedPackagePrice: quoteData.package_price,
        editedTotalPrice: quoteData.total_price
      });
      
      // Initialize discount from quoteData
      if (quoteData.discount_type) {
        setDiscountType(quoteData.discount_type);
        setDiscountValue(quoteData.discount_value || 0);
        setDiscountNote(quoteData.discount_note || '');
      } else {
        setDiscountType(null);
        setDiscountValue(0);
        setDiscountNote('');
      }
      
      // Initialize show line item prices setting
      setShowLineItemPrices(quoteData.show_line_item_prices !== undefined ? quoteData.show_line_item_prices : true);
      
      // Initialize due date type
      if (quoteData.due_date_type) {
        setDueDateType(quoteData.due_date_type);
      }
      
      // Initialize deposit and remaining balance due dates
      if (quoteData.deposit_due_date) {
        setDepositDueDate(quoteData.deposit_due_date);
      }
      if (quoteData.remaining_balance_due_date) {
        setRemainingBalanceDueDate(quoteData.remaining_balance_due_date);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteData, editingQuote]);
  
  // Update showLineItemPrices when quoteData changes (separate effect to ensure it updates)
  useEffect(() => {
    if (quoteData) {
      // Handle both undefined (default to true) and explicit false/true values
      const shouldShow = quoteData.show_line_item_prices !== undefined ? quoteData.show_line_item_prices : true;
      setShowLineItemPrices(shouldShow);
    }
  }, [quoteData]);


  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Invoice | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading invoice...</p>
          </div>
        </div>
      </>
    );
  }

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Invoice | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading invoice...</p>
          </div>
        </div>
      </>
    );
  }

  // Early return if no quote data after loading is complete
  if (!quoteData) {
    return (
      <>
        <Head>
          <title>Invoice Not Found | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <p className="text-xl text-gray-600 dark:text-gray-300">Invoice not found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Please make sure you have selected services first.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Calculate bundled prices for line items (proportional allocation based on a la carte prices)
  const calculateBundledPrices = (lineItems, packagePrice) => {
    if (!lineItems || lineItems.length === 0 || !packagePrice) return lineItems;
    
    // Calculate total a la carte price
    const totalALaCarte = lineItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    
    // If a la carte total equals package price, no adjustment needed
    if (totalALaCarte === packagePrice) return lineItems;
    
    // If no a la carte total, can't calculate proportions
    if (totalALaCarte === 0) return lineItems;
    
    // Calculate scaling factor
    const scaleFactor = packagePrice / totalALaCarte;
    
    // Return line items with bundled prices (proportional to a la carte prices)
    return lineItems.map(item => ({
      ...item,
      bundledPrice: Math.round((Number(item.price) || 0) * scaleFactor * 100) / 100, // Round to 2 decimals
      aLaCartePrice: Number(item.price) || 0 // Keep original for reference if needed
    }));
  };

  // Get line items for the package (from editing state or quote data)
  const getPackageLineItems = () => {
    if (isEditing && editingQuote?.editedLineItems) {
      return editingQuote.editedLineItems;
    }
    const items = getPackageLineItemsFromQuote(quoteData);
    // Calculate bundled prices based on package price
    const packagePrice = quoteData?.package_price || 0;
    return calculateBundledPrices(items, packagePrice);
  };

  const packageLineItems = getPackageLineItems();
  
  // Get addons (from editing state or quote data)
  const getAddons = () => {
    if (isEditing && editingQuote?.editedAddons) {
      return editingQuote.editedAddons;
    }
    return quoteData?.addons || [];
  };

  const addons = getAddons();
  
  // Calculate totals from edited data
  const calculateTotals = () => {
    // Use bundled prices for line items (they should sum to package price)
    const lineItemsTotal = packageLineItems.reduce((sum, item) => {
      // Use bundledPrice if available (from calculateBundledPrices), otherwise use price
      const itemPrice = item.bundledPrice !== undefined ? item.bundledPrice : (Number(item.price) || 0);
      return sum + itemPrice;
    }, 0);
    const addonsTotal = addons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    // Package price is the bundled price from the database
    const packagePrice = isEditing && editingQuote?.editedPackagePrice 
      ? Number(editingQuote.editedPackagePrice) 
      : (quoteData?.package_price || 0);
    // Use package price for subtotal (bundled prices should already sum to this)
    const subtotal = packagePrice + addonsTotal;
    
    // Calculate discount
    let discountAmount = 0;
    if (discountType && discountValue > 0) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    return { lineItemsTotal, addonsTotal, packagePrice, subtotal, discountAmount, total };
  };

  const { packagePrice, subtotal, discountAmount, total: calculatedTotal } = calculateTotals();

  // When editing, use editedTotalPrice if set, otherwise use calculated total
  // When not editing, always use calculated total (which includes discount if present)
  // This ensures the discount is always applied correctly
  const totalAmount = isEditing && editingQuote?.editedTotalPrice 
    ? Number(editingQuote.editedTotalPrice) 
    : calculatedTotal || quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const actualPaid = paymentData?.totalPaid || 0;
  // Remaining balance: if no payment made, show balance after deposit. Otherwise show actual remaining.
  const remainingBalance = actualPaid === 0 ? totalAmount - depositAmount : totalAmount - actualPaid;
  const isFullyPaid = actualPaid >= totalAmount;
  const isPartiallyPaid = actualPaid > 0 && actualPaid < totalAmount;
  const invoiceNumber = invoiceData?.invoice_number || `INV-${id.substring(0, 8).toUpperCase()}`;
  const invoiceDate = invoiceData?.invoice_date || new Date().toISOString().split('T')[0];
  
  // Calculate due date based on type
  const calculateDueDate = (type, eventDate, invoiceDateValue) => {
    if (!eventDate) {
      // Fallback to 7 days from invoice date if no event date
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    const eventDateObj = new Date(eventDate);
    
    switch (type) {
      case 'upon_receipt':
        return invoiceDateValue || new Date().toISOString().split('T')[0];
      case 'day_of_event':
        return eventDateObj.toISOString().split('T')[0];
      case '7_days_before':
        const sevenDaysBefore = new Date(eventDateObj);
        sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
        return sevenDaysBefore.toISOString().split('T')[0];
      default:
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
  };
  
  // Calculate payment due date (for deposit or remaining balance)
  const calculatePaymentDueDate = (type, eventDate, invoiceDateValue, customDate) => {
    if (type === 'custom' && customDate) {
      return customDate;
    }
    return calculateDueDate(type, eventDate, invoiceDateValue);
  };
  
  // Get display text for payment due date
  const getPaymentDueDateDisplay = (type, eventDate, invoiceDateValue, customDate) => {
    if (type === 'custom' && customDate) {
      return new Date(customDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    const date = calculateDueDate(type, eventDate, invoiceDateValue);
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Venue lookup function
  const lookupVenueAddress = async (venueName) => {
    if (!venueName || venueName.trim().length < 2) return;
    
    setLookingUpVenue(true);
    try {
      // First, try to find in our database
      const venueSearchTerm = venueName
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical content like "(formerly Pin Oak)"
        .trim();
      
      const { data: venueMatches, error: venueError } = await supabase
        .from('preferred_venues')
        .select('venue_name, address, city, state, zip_code')
        .ilike('venue_name', `%${venueSearchTerm}%`)
        .eq('is_active', true)
        .limit(1);

      if (!venueError && venueMatches && venueMatches.length > 0) {
        const matchedVenue = venueMatches[0];
        if (matchedVenue.address) {
          // Format address: "123 Main St, Memphis, TN 38103" or just "123 Main St" if city/state not available
          const formattedAddress = matchedVenue.address.includes(',')
            ? matchedVenue.address
            : `${matchedVenue.address}${matchedVenue.city ? `, ${matchedVenue.city}` : ''}${matchedVenue.state ? `, ${matchedVenue.state}` : ''}${matchedVenue.zip_code ? ` ${matchedVenue.zip_code}` : ''}`.trim();
          
          // Only update if address is currently empty
          if (!editingVenueAddress || editingVenueAddress.trim() === '') {
            setEditingVenueAddress(formattedAddress);
            toast({
              title: "Venue Address Found",
              description: `Auto-filled address for ${venueName} from database`,
            });
            setLookingUpVenue(false);
            return;
          }
        }
      }

      // If not found in database, try Google Places API
      if (!editingVenueAddress || editingVenueAddress.trim() === '') {
        try {
          const response = await fetch(`/api/google/venue-lookup?query=${encodeURIComponent(venueName)}`);
          const data = await response.json();

          if (data.success && data.results && data.results.length > 0) {
            // Use the first result (most relevant)
            const googleVenue = data.results[0];
            if (googleVenue.address) {
              setEditingVenueAddress(googleVenue.address);
              toast({
                title: "Venue Address Found",
                description: `Auto-filled address for ${venueName} from Google`,
              });
            }
          }
        } catch (googleError) {
          console.error('Error looking up venue in Google:', googleError);
          // Silently fail - user can enter address manually
        }
      }
    } catch (lookupError) {
      console.error('Error looking up venue address:', lookupError);
      // Don't show error toast - just silently fail
    } finally {
      setLookingUpVenue(false);
    }
  };

  // Handle venue name change with debounced lookup
  const handleVenueNameChange = (value) => {
    setEditingVenueName(value);
    
    // Auto-lookup venue address when venue name changes and address is empty
    if (value && (!editingVenueAddress || editingVenueAddress.trim() === '')) {
      // Clear any existing timeout
      if (venueLookupTimeoutRef.current) {
        clearTimeout(venueLookupTimeoutRef.current);
      }
      
      // Debounce the lookup - wait 500ms after user stops typing
      venueLookupTimeoutRef.current = setTimeout(() => {
        lookupVenueAddress(value);
      }, 500);
    }
  };

  // Get due date type from quote data or default
  const currentDueDateType = quoteData?.due_date_type || dueDateType;
  const calculatedDueDate = invoiceData?.due_date || calculateDueDate(
    currentDueDateType,
    leadData?.eventDate,
    invoiceDate
  );
  const dueDate = isEditing ? calculateDueDate(dueDateType, leadData?.eventDate, invoiceDate) : calculatedDueDate;

  return (
    <>
      <Head>
        <title>Invoice {invoiceNumber} | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header className="no-print" />

        <main className="section-container py-4 md:py-12 lg:py-20 px-4 sm:px-6">
          {/* Header Actions */}
          <div className="no-print max-w-4xl mx-auto mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Confirmation</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <div className="flex gap-3 items-center w-full sm:w-auto justify-end">
              {isAdmin && (
                <>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="no-print btn-outline inline-flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Invoice
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSaveInvoice}
                        disabled={saving}
                        className="no-print btn-primary inline-flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="no-print btn-outline inline-flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={handleDownload}
                className="btn-outline inline-flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Invoice Document */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12 print:shadow-none print:rounded-none">
            {/* Company Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6 md:pb-8 mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6">
                <div className="w-full md:w-auto md:flex-1">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3">INVOICE</h2>
                  <div className="space-y-1 text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
                    <p>
                      Invoice #: <span className="font-semibold text-gray-900 dark:text-white break-all">{invoiceNumber}</span>
                    </p>
                    <p>
                      Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                    <p>
                      Due Date: <span className="font-semibold text-gray-900 dark:text-white">{new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-auto text-left md:text-right mt-4 md:mt-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand mb-2">M10 DJ Company</h1>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                    65 Stewart Rd<br />
                    Eads, Tennessee 38028<br />
                    Phone: (901) 410-2020<br />
                    Email: info@m10djcompany.com
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            {leadData && (
              <div className="mb-4 sm:mb-6 md:mb-8">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 sm:mb-3">Bill To:</h3>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">{leadData.name}</p>
                {leadData.email && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words mt-1">{leadData.email}</p>
                )}
                {leadData.phone && (
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{leadData.phone}</p>
                )}
                {(leadData.location || leadData.venueName || isAdmin) && (
                  <div className="mt-2 flex items-start gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {isAdmin && isEditingVenue ? (
                      <div className="no-print flex-1 space-y-3">
                        <VenueAutocomplete
                          venueName={editingVenueName}
                          venueAddress={editingVenueAddress}
                          onVenueNameChange={(name) => {
                            setEditingVenueName(name);
                            // Clear address if venue name is cleared
                            if (!name) {
                              setEditingVenueAddress('');
                            }
                          }}
                          onVenueAddressChange={setEditingVenueAddress}
                          className="text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (!leadData?.id) return;
                              setSavingVenue(true);
                              try {
                                const response = await fetch(`/api/leads/${leadData.id}/update`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    venueName: editingVenueName || null,
                                    venueAddress: editingVenueAddress || null
                                  })
                                });
                                
                                const responseData = await response.json();
                                
                                if (response.ok && responseData.success) {
                                  const updated = responseData.data;
                                  // Update local state immediately with the saved values
                                  setLeadData(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      venueName: updated.venue_name || editingVenueName || prev.venueName,
                                      location: updated.venue_address || updated.venueAddress || editingVenueAddress || prev.location
                                    };
                                  });
                                  // Also update editing state to reflect saved values
                                  setEditingVenueName(updated.venue_name || editingVenueName);
                                  setEditingVenueAddress(updated.venue_address || updated.venueAddress || editingVenueAddress);
                                  setIsEditingVenue(false);
                                  toast({
                                    title: 'Venue Updated',
                                    description: 'The venue information has been successfully updated.',
                                  });
                                  // Refresh data to ensure consistency across the app
                                  setTimeout(async () => {
                                    await fetchData();
                                  }, 100);
                                } else {
                                  toast({
                                    title: 'Error',
                                    description: responseData.error || responseData.details || 'Failed to update venue',
                                    variant: 'destructive',
                                  });
                                }
                              } catch (error) {
                                console.error('Error updating venue:', error);
                                toast({
                                  title: 'Error',
                                  description: error.message || 'Failed to update venue',
                                  variant: 'destructive',
                                });
                              } finally {
                                setSavingVenue(false);
                              }
                            }}
                            disabled={savingVenue}
                            className="btn-primary text-xs px-2 py-1"
                          >
                            {savingVenue ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingVenue(false);
                              const venueName = leadData.venueName || '';
                              const venueAddress = leadData.location && leadData.location !== venueName ? leadData.location : '';
                              setEditingVenueName(venueName);
                              setEditingVenueAddress(venueAddress);
                            }}
                            className="btn-outline text-xs px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="break-words">
                          {leadData.venueName && (
                            <span className="font-semibold">{leadData.venueName}</span>
                          )}
                          {/* Only show address if it's different from venue name (avoid duplicates) */}
                          {leadData.venueName && leadData.location && leadData.location !== leadData.venueName && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{leadData.location}</span>
                            </>
                          )}
                          {!leadData.venueName && !leadData.location && 'No venue information'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIsEditingVenue(true);
                              // If location is the same as venueName, treat it as no address (duplicate data cleanup)
                              const venueName = leadData.venueName || '';
                              const location = leadData.location || '';
                              const venueAddress = location && location !== venueName ? location : '';
                              setEditingVenueName(venueName);
                              setEditingVenueAddress(venueAddress);
                            }}
                            className="no-print text-xs text-brand hover:text-brand-dark ml-2"
                            title="Edit venue"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {leadData.eventDate && (
                  <div className="mt-2 flex items-start gap-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {isAdmin && isEditingEventDate ? (
                      <div className="no-print flex items-center gap-2 flex-1">
                        <Input
                          type="date"
                          value={editingEventDate}
                          onChange={(e) => setEditingEventDate(e.target.value)}
                          className="text-sm"
                        />
                        <button
                          onClick={async () => {
                            if (!editingEventDate || !leadData?.id) return;
                            setSavingEventDate(true);
                            try {
                              console.log('Updating event date:', editingEventDate, 'for lead:', leadData.id);
                              
                              const response = await fetch(`/api/leads/${leadData.id}/update`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  eventDate: editingEventDate
                                })
                              });
                              
                              const responseData = await response.json();
                              console.log('Update response:', responseData);
                              
                              if (response.ok && responseData.success) {
                                const updated = responseData.data;
                                console.log('Event date updated successfully:', updated);
                                
                                // Update local state with the date from the response immediately
                                const updatedEventDate = updated.eventDate || editingEventDate;
                                setLeadData(prev => {
                                  if (!prev) return null;
                                  const newData = { ...prev, eventDate: updatedEventDate };
                                  console.log('Updated leadData state:', newData);
                                  return newData;
                                });
                                
                                // Also update editingEventDate to match
                                setEditingEventDate(updatedEventDate);
                                setIsEditingEventDate(false);
                                
                                toast({
                                  title: 'Event Date Updated',
                                  description: 'The event date has been successfully updated.',
                                });
                                
                                // Small delay before refreshing to ensure database commit
                                setTimeout(async () => {
                                  await fetchData();
                                }, 100);
                              } else {
                                console.error('Error response:', responseData);
                                toast({
                                  title: 'Error',
                                  description: responseData.error || responseData.details || 'Failed to update event date',
                                  variant: 'destructive',
                                });
                              }
                            } catch (error) {
                              console.error('Error updating event date:', error);
                              toast({
                                title: 'Error',
                                description: error.message || 'Failed to update event date',
                                variant: 'destructive',
                              });
                            } finally {
                              setSavingEventDate(false);
                            }
                          }}
                          disabled={savingEventDate}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          {savingEventDate ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingEventDate(false);
                            setEditingEventDate(leadData.eventDate ? new Date(leadData.eventDate).toISOString().split('T')[0] : '');
                          }}
                          className="btn-outline text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>
                          {leadData.eventDate 
                            ? new Date(leadData.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Not set'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIsEditingEventDate(true);
                              setEditingEventDate(leadData.eventDate ? new Date(leadData.eventDate).toISOString().split('T')[0] : '');
                            }}
                            className="no-print text-xs text-brand hover:text-brand-dark ml-2"
                            title="Edit event date"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Line Items */}
            <div className="mb-4 sm:mb-6 md:mb-8 overflow-x-auto -mx-4 sm:mx-0">
              {/* Desktop Table View */}
              <table className="w-full border-collapse hidden sm:table">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Description</th>
                    <th className="text-right py-3 sm:py-4 px-3 sm:px-4 font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteData && (
                    <>
                      {/* Package Header Row */}
                      <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                        <td colSpan="2" className="py-3 sm:py-4 px-3 sm:px-4">
                          <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">{quoteData.package_name}</p>
                          {quoteData.customized && quoteData.customization_note && (
                            <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mt-1 italic">{quoteData.customization_note}</p>
                          )}
                        </td>
                      </tr>
                      {/* Package Line Items */}
                      {packageLineItems.length > 0 ? (
                        packageLineItems.map((lineItem, idx) => (
                          <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                            <td className="py-2 sm:py-3 px-3 sm:px-4">
                              <div className="pl-2 sm:pl-4">
                                <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{lineItem.item}</p>
                                {lineItem.description && (
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{lineItem.description}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-sm sm:text-base">
                              {isEditing && isAdmin ? (
                                <Input
                                  type="number"
                                  value={lineItem.bundledPrice !== undefined ? lineItem.bundledPrice : (lineItem.price || 0)}
                                  onChange={(e) => handleLineItemPriceChange(idx, e.target.value)}
                                  className="no-print w-24 text-right"
                                  min="0"
                                  step="0.01"
                                />
                              ) : showLineItemPrices ? (
                                <div className="flex flex-col items-end">
                                  {lineItem.aLaCartePrice && lineItem.aLaCartePrice !== (lineItem.bundledPrice !== undefined ? lineItem.bundledPrice : lineItem.price) && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                      ${lineItem.aLaCartePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                                    ${(lineItem.bundledPrice !== undefined ? lineItem.bundledPrice : (lineItem.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-xs italic">Included</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-gray-100 dark:border-gray-700">
                          <td className="py-3 sm:py-4 px-3 sm:px-4">
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Package includes all listed services</p>
                          </td>
                          <td className="py-3 sm:py-4 px-3 sm:px-4 text-right font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                            ${packagePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      {/* Package Total Row */}
                      <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
                        <td className="py-2 sm:py-3 px-3 sm:px-4">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white pl-2 sm:pl-4">Package Total</p>
                        </td>
                        <td className="py-2 sm:py-3 px-3 sm:px-4 text-right">
                          {isEditing && isAdmin ? (
                            <Input
                              type="number"
                              value={packagePrice || 0}
                              onChange={(e) => setEditingQuote({ ...editingQuote, editedPackagePrice: Number(e.target.value) || 0 })}
                              className="no-print w-24 text-right"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <div className="flex flex-col items-end">
                              {(() => {
                                const totalALaCarte = packageLineItems.reduce((sum, item) => sum + (item.aLaCartePrice || item.price || 0), 0);
                                if (totalALaCarte > packagePrice) {
                                  return (
                                    <>
                                      <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                        ${totalALaCarte.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                                        Save ${(totalALaCarte - packagePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                              <span className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                ${packagePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Add-ons */}
                      {addons && addons.length > 0 && (
                        <>
                          <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                            <td colSpan="2" className="py-3 sm:py-4 px-3 sm:px-4">
                              <p className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Additional Services</p>
                            </td>
                          </tr>
                          {addons.map((addon, idx) => (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-2 sm:py-3 px-3 sm:px-4">
                                <div className="pl-2 sm:pl-4">
                                  <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{addon.name}</p>
                                  {addon.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">{addon.description}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 sm:py-3 px-3 sm:px-4 text-right font-semibold text-sm sm:text-base text-gray-900 dark:text-white">
                                {isEditing && isAdmin ? (
                                  <Input
                                    type="number"
                                    value={addon.price || 0}
                                    onChange={(e) => handleAddonPriceChange(idx, e.target.value)}
                                    className="no-print w-24 text-right"
                                    min="0"
                                    step="0.01"
                                  />
                                ) : (
                                  `$${addon.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                )}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 px-4">
                {quoteData && (
                  <>
                    {/* Package Header */}
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                      <p className="font-bold text-gray-900 dark:text-white text-base">{quoteData.package_name}</p>
                      {quoteData.customized && quoteData.customization_note && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 italic">{quoteData.customization_note}</p>
                      )}
                    </div>
                    {/* Package Line Items */}
                    {packageLineItems.length > 0 ? (
                      <>
                        {packageLineItems.map((lineItem, idx) => (
                          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 pl-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-2">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{lineItem.item}</p>
                                {lineItem.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{lineItem.description}</p>
                                )}
                              </div>
                              {showLineItemPrices ? (
                                <div className="flex flex-col items-end whitespace-nowrap">
                                  {lineItem.aLaCartePrice && lineItem.aLaCartePrice !== (lineItem.bundledPrice !== undefined ? lineItem.bundledPrice : lineItem.price) && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                      ${lineItem.aLaCartePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                  <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                                    ${(lineItem.bundledPrice !== undefined ? lineItem.bundledPrice : (lineItem.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-gray-400 dark:text-gray-500 text-xs italic whitespace-nowrap">Included</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {/* Package Total */}
                        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Package Total</p>
                            <div className="flex flex-col items-end">
                              {(() => {
                                const totalALaCarte = packageLineItems.reduce((sum, item) => sum + (item.aLaCartePrice || item.price || 0), 0);
                                if (totalALaCarte > packagePrice) {
                                  return (
                                    <>
                                      <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                        ${totalALaCarte.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                                        Save ${(totalALaCarte - packagePrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </>
                                  );
                                }
                                return null;
                              })()}
                              <p className="font-bold text-gray-900 dark:text-white text-sm">
                                ${packagePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Package includes all listed services</p>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                            ${packagePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Add-ons Header */}
                    {quoteData.addons && quoteData.addons.length > 0 && (
                      <>
                        <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                          <p className="font-bold text-gray-900 dark:text-white text-base">Additional Services</p>
                        </div>
                        {quoteData.addons.map((addon, idx) => (
                          <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 pl-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 pr-2">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{addon.name}</p>
                                {addon.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{addon.description}</p>
                                )}
                              </div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
                                ${addon.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-4 sm:mb-6 md:mb-8">
              <div className="w-full sm:w-auto sm:min-w-[280px] md:w-1/2">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-medium">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  
                  {/* Invoice Display Options - Admin Only */}
                  {isAdmin && isEditing && (
                    <div className="no-print border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2 mb-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Display Options</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="show-line-item-prices"
                          checked={showLineItemPrices}
                          onChange={(e) => setShowLineItemPrices(e.target.checked)}
                          className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
                        />
                        <label htmlFor="show-line-item-prices" className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                          Show line item prices
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {showLineItemPrices ? 'Line items will show individual prices' : 'Line items will show "Included" without prices'}
                      </p>
                      
                      {/* Due Date Options */}
                      <div className="mt-3">
                        <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Due Date</label>
                        <select
                          value={dueDateType}
                          onChange={(e) => setDueDateType(e.target.value)}
                          className="text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-full"
                        >
                          <option value="upon_receipt">Upon Receipt</option>
                          <option value="day_of_event">Day of the Event</option>
                          <option value="7_days_before">7 Days Before the Event</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Due: {new Date(calculateDueDate(dueDateType, leadData?.eventDate, invoiceDate)).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Discount Section - Admin Only */}
                  {isAdmin && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
                      {isEditing ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Discount:</span>
                            <div className="flex items-center gap-2">
                              <select
                                value={discountType || ''}
                                onChange={(e) => {
                                  const type = e.target.value;
                                  setDiscountType(type || null);
                                  if (!type) setDiscountValue(0);
                                }}
                                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand"
                              >
                                <option value="">None</option>
                                <option value="percentage">Percentage (%)</option>
                                <option value="flat">Flat Rate ($)</option>
                              </select>
                              {discountType && (
                                <Input
                                  type="number"
                                  value={discountValue > 0 ? discountValue : ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || val === null || val === undefined) {
                                      setDiscountValue(0);
                                    } else {
                                      const num = parseFloat(val);
                                      setDiscountValue(isNaN(num) ? 0 : num);
                                    }
                                  }}
                                  className="w-28 text-right"
                                  min="0"
                                  step={discountType === 'percentage' ? '0.1' : '0.01'}
                                  placeholder={discountType === 'percentage' ? '10' : '100'}
                                />
                              )}
                            </div>
                          </div>
                          {discountType && discountValue > 0 && (
                            <>
                              <div className="flex justify-between text-sm text-red-600 dark:text-red-400 font-medium">
                                <span>Discount Amount:</span>
                                <span>-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </div>
                              <Input
                                type="text"
                                value={discountNote}
                                onChange={(e) => setDiscountNote(e.target.value)}
                                placeholder="Discount reason/note (optional)"
                                className="text-sm"
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {discountType && discountValue > 0 ? (
                            <div className="flex justify-between items-center text-sm text-red-600 dark:text-red-400">
                              <span>
                                Discount {discountType === 'percentage' ? `(${discountValue}%)` : `($${discountValue.toLocaleString()})`}:
                                {discountNote && <span className="text-xs text-gray-500 ml-1">({discountNote})</span>}
                              </span>
                              <span className="font-medium">-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <span>No discount applied</span>
                              <span className="text-xs italic">Click &quot;Edit Invoice&quot; to add discount</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Show discount to clients ONLY if admin has added one */}
                  {!isAdmin && discountType && discountValue > 0 && discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>
                        Discount {discountType === 'percentage' ? `(${discountValue}%)` : `($${discountValue.toLocaleString()})`}:
                        {discountNote && <span className="text-xs text-gray-500 ml-1">({discountNote})</span>}
                      </span>
                      <span className="font-medium">-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    <span>Tax:</span>
                    <span className="font-medium">$0.00</span>
                  </div>
                  <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
                    <div className="flex justify-between text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                      <span>Total:</span>
                      {isEditing && isAdmin ? (
                        <Input
                          type="number"
                          value={totalAmount || 0}
                          onChange={(e) => handleTotalPriceChange(e.target.value)}
                          className="no-print w-32 text-right"
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <span>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  {hasPayment && (
                    <>
                      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
                        <div className="flex justify-between text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          <span>Amount Paid:</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            ${actualPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {!isFullyPaid && (
                          <div className="flex justify-between text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                            <span>Remaining Balance:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      {isFullyPaid && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="font-semibold text-sm sm:text-base">Invoice Paid in Full</span>
                          </div>
                        </div>
                      )}
                      {isPartiallyPaid && (
                        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-1">
                            <span className="font-semibold text-sm sm:text-base">Partially Paid</span>
                          </div>
                          <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                            ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-3">Payment Terms</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2 flex-wrap">
                  <p><strong>Deposit Required:</strong> ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (50% of total)</p>
                  {isAdmin && (
                    <>
                      {isEditingDepositDueDate ? (
                        <div className="no-print flex items-center gap-2 flex-wrap">
                          <span>due</span>
                          <select
                            value={depositDueDateType}
                            onChange={(e) => {
                              setDepositDueDateType(e.target.value);
                              if (e.target.value !== 'custom') {
                                const calculated = calculateDueDate(e.target.value, leadData?.eventDate, invoiceDate);
                                setDepositDueDate(calculated);
                              }
                            }}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="upon_receipt">Upon Receipt</option>
                            <option value="day_of_event">Day of Event</option>
                            <option value="7_days_before">7 Days Before Event</option>
                            <option value="custom">Custom Date</option>
                          </select>
                          {depositDueDateType === 'custom' && (
                            <input
                              type="date"
                              value={customDepositDueDate || ''}
                              onChange={(e) => {
                                setCustomDepositDueDate(e.target.value);
                                setDepositDueDate(e.target.value);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                          <button
                            onClick={async () => {
                              setSaving(true);
                              try {
                                const calculatedDueDate = calculateDueDate(dueDateType, leadData?.eventDate, invoiceDate);
                                const finalDepositDueDate = calculatePaymentDueDate(depositDueDateType, leadData?.eventDate, invoiceDate, customDepositDueDate);
                                
                                console.log('Saving deposit due date:', {
                                  depositDueDateType,
                                  finalDepositDueDate,
                                  customDepositDueDate
                                });
                                
                                const response = await fetch(`/api/quote/${id}/update-invoice`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    ...(quoteData ? {
                                      total_price: quoteData.total_price,
                                      package_price: quoteData.package_price,
                                      custom_line_items: quoteData.custom_line_items,
                                      custom_addons: quoteData.addons,
                                      is_custom_price: quoteData.is_custom_price,
                                      discount_type: discountType,
                                      discount_value: discountValue > 0 ? discountValue : null,
                                      discount_note: discountNote || null,
                                      show_line_item_prices: showLineItemPrices,
                                      due_date_type: dueDateType,
                                      due_date: calculatedDueDate,
                                    } : {}),
                                    deposit_due_date: finalDepositDueDate || null,
                                    remaining_balance_due_date: remainingBalanceDueDate || null
                                  })
                                });
                                
                                const responseData = await response.json();
                                
                                if (response.ok) {
                                  console.log('Deposit due date saved successfully:', responseData);
                                  // Update local state
                                  setDepositDueDate(finalDepositDueDate);
                                  setIsEditingDepositDueDate(false);
                                  // Refresh data
                                  await fetchData();
                                  toast({ 
                                    title: 'Due date updated', 
                                    description: 'Deposit due date has been updated.' 
                                  });
                                } else {
                                  console.error('Error saving deposit due date:', responseData);
                                  toast({ 
                                    title: 'Error', 
                                    description: responseData.error || responseData.details || 'Failed to update due date', 
                                    variant: 'destructive' 
                                  });
                                }
                              } catch (error) {
                                console.error('Exception saving deposit due date:', error);
                                toast({ 
                                  title: 'Error', 
                                  description: error.message || 'Failed to update due date', 
                                  variant: 'destructive' 
                                });
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className="text-xs px-2 py-1 bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingDepositDueDate(false);
                              // Reset to original values
                              if (quoteData?.deposit_due_date) {
                                setDepositDueDate(quoteData.deposit_due_date);
                                // Re-determine type
                                const depositDate = new Date(quoteData.deposit_due_date);
                                const invoiceDateObj = new Date(invoiceDate);
                                const eventDateObj = leadData?.eventDate ? new Date(leadData.eventDate) : null;
                                
                                if (eventDateObj) {
                                  const sevenDaysBefore = new Date(eventDateObj);
                                  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
                                  
                                  if (depositDate.toDateString() === invoiceDateObj.toDateString()) {
                                    setDepositDueDateType('upon_receipt');
                                  } else if (depositDate.toDateString() === eventDateObj.toDateString()) {
                                    setDepositDueDateType('day_of_event');
                                  } else if (depositDate.toDateString() === sevenDaysBefore.toDateString()) {
                                    setDepositDueDateType('7_days_before');
                                  } else {
                                    setDepositDueDateType('custom');
                                    setCustomDepositDueDate(quoteData.deposit_due_date);
                                  }
                                }
                              }
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>due {getPaymentDueDateDisplay(depositDueDateType, leadData?.eventDate, invoiceDate, customDepositDueDate)}</span>
                          <button
                            onClick={() => setIsEditingDepositDueDate(true)}
                            className="no-print ml-2 text-brand hover:text-brand-dark"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {!isAdmin && (
                    <span>due {depositDueDate ? new Date(depositDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : getPaymentDueDateDisplay('upon_receipt', leadData?.eventDate, invoiceDate, '')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p><strong>Remaining Balance:</strong> ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  {isAdmin && (
                    <>
                      {isEditingRemainingDueDate ? (
                        <div className="no-print flex items-center gap-2 flex-wrap">
                          <span>due</span>
                          <select
                            value={remainingBalanceDueDateType}
                            onChange={(e) => {
                              setRemainingBalanceDueDateType(e.target.value);
                              if (e.target.value !== 'custom') {
                                const calculated = calculateDueDate(e.target.value, leadData?.eventDate, invoiceDate);
                                setRemainingBalanceDueDate(calculated);
                              }
                            }}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            <option value="upon_receipt">Upon Receipt</option>
                            <option value="day_of_event">Day of Event</option>
                            <option value="7_days_before">7 Days Before Event</option>
                            <option value="custom">Custom Date</option>
                          </select>
                          {remainingBalanceDueDateType === 'custom' && (
                            <input
                              type="date"
                              value={customRemainingBalanceDueDate || ''}
                              onChange={(e) => {
                                setCustomRemainingBalanceDueDate(e.target.value);
                                setRemainingBalanceDueDate(e.target.value);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                          <button
                            onClick={async () => {
                              setSaving(true);
                              try {
                                const calculatedDueDate = calculateDueDate(dueDateType, leadData?.eventDate, invoiceDate);
                                const finalRemainingDueDate = calculatePaymentDueDate(remainingBalanceDueDateType, leadData?.eventDate, invoiceDate, customRemainingBalanceDueDate);
                                
                                console.log('Saving remaining balance due date:', {
                                  remainingBalanceDueDateType,
                                  finalRemainingDueDate,
                                  customRemainingBalanceDueDate
                                });
                                
                                const response = await fetch(`/api/quote/${id}/update-invoice`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    ...(quoteData ? {
                                      total_price: quoteData.total_price,
                                      package_price: quoteData.package_price,
                                      custom_line_items: quoteData.custom_line_items,
                                      custom_addons: quoteData.addons,
                                      is_custom_price: quoteData.is_custom_price,
                                      discount_type: discountType,
                                      discount_value: discountValue > 0 ? discountValue : null,
                                      discount_note: discountNote || null,
                                      show_line_item_prices: showLineItemPrices,
                                      due_date_type: dueDateType,
                                      due_date: calculatedDueDate,
                                    } : {}),
                                    deposit_due_date: depositDueDate || null,
                                    remaining_balance_due_date: finalRemainingDueDate || null
                                  })
                                });
                                
                                const responseData = await response.json();
                                
                                if (response.ok) {
                                  console.log('Remaining balance due date saved successfully:', responseData);
                                  // Update local state
                                  setRemainingBalanceDueDate(finalRemainingDueDate);
                                  setIsEditingRemainingDueDate(false);
                                  // Refresh data
                                  await fetchData();
                                  toast({ 
                                    title: 'Due date updated', 
                                    description: 'Remaining balance due date has been updated.' 
                                  });
                                } else {
                                  console.error('Error saving remaining balance due date:', responseData);
                                  toast({ 
                                    title: 'Error', 
                                    description: responseData.error || responseData.details || 'Failed to update due date', 
                                    variant: 'destructive' 
                                  });
                                }
                              } catch (error) {
                                console.error('Exception saving remaining balance due date:', error);
                                toast({ 
                                  title: 'Error', 
                                  description: error.message || 'Failed to update due date', 
                                  variant: 'destructive' 
                                });
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                            className="text-xs px-2 py-1 bg-brand text-white rounded hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingRemainingDueDate(false);
                              // Reset to original values
                              if (quoteData?.remaining_balance_due_date) {
                                setRemainingBalanceDueDate(quoteData.remaining_balance_due_date);
                                // Re-determine type
                                const remainingDate = new Date(quoteData.remaining_balance_due_date);
                                const invoiceDateObj = new Date(invoiceDate);
                                const eventDateObj = leadData?.eventDate ? new Date(leadData.eventDate) : null;
                                
                                if (eventDateObj) {
                                  const sevenDaysBefore = new Date(eventDateObj);
                                  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
                                  
                                  if (remainingDate.toDateString() === invoiceDateObj.toDateString()) {
                                    setRemainingBalanceDueDateType('upon_receipt');
                                  } else if (remainingDate.toDateString() === eventDateObj.toDateString()) {
                                    setRemainingBalanceDueDateType('day_of_event');
                                  } else if (remainingDate.toDateString() === sevenDaysBefore.toDateString()) {
                                    setRemainingBalanceDueDateType('7_days_before');
                                  } else {
                                    setRemainingBalanceDueDateType('custom');
                                    setCustomRemainingBalanceDueDate(quoteData.remaining_balance_due_date);
                                  }
                                }
                              }
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>due {getPaymentDueDateDisplay(remainingBalanceDueDateType, leadData?.eventDate, invoiceDate, customRemainingBalanceDueDate)}</span>
                          <button
                            onClick={() => setIsEditingRemainingDueDate(true)}
                            className="no-print ml-2 text-brand hover:text-brand-dark"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {!isAdmin && (
                    <span>due {remainingBalanceDueDate ? new Date(remainingBalanceDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : getPaymentDueDateDisplay('7_days_before', leadData?.eventDate, invoiceDate, '')}</span>
                  )}
                </div>
                <p>Payments can be made online via credit card, or by cash or check.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6 md:pt-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <p>Thank you for choosing M10 DJ Company!</p>
              <p className="mt-1 sm:mt-2 break-words">Questions? Contact us at (901) 410-2020 or info@m10djcompany.com</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print max-w-4xl mx-auto mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link
              href={`/quote/${id}/payment`}
              className="btn-primary inline-flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              Make Payment
            </Link>
            <Link
              href={`/quote/${id}/contract`}
              className="btn-outline inline-flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              View Contract
            </Link>
          </div>
        </main>

      </div>

      <style jsx global>{`
        @media print {
          /* Hide all non-invoice elements */
          .no-print,
          header,
          nav,
          footer,
          .no-print * {
            display: none !important;
          }
          
          /* Reset page styling */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Invoice container styling */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Invoice document styling */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.75in !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure text is black for printing */
          * {
            color: #000 !important;
          }
          
          /* Keep white backgrounds */
          .bg-white,
          .bg-gray-50 {
            background: white !important;
          }
          
          /* Dark mode text should be black in print */
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .dark\\:text-gray-400 {
            color: #000 !important;
          }
          
          /* Brand color should be dark for print */
          .text-brand {
            color: #000 !important;
          }
          
          /* Page breaks */
          .page-break {
            page-break-before: always;
          }
          
          /* No page breaks inside important sections */
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          /* Print-friendly spacing */
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
      `}</style>
    </>
  );
}

