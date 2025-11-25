import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import SignatureCapture from '../../../components/SignatureCapture';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, PenTool, X, Edit, Clock, Save } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import VenueAutocomplete from '@/components/VenueAutocomplete';

export default function ContractPage() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [quoteData, setQuoteData] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [signatureMethod, setSignatureMethod] = useState('draw');
  const [showFieldsModal, setShowFieldsModal] = useState(false);
  const [updatingFields, setUpdatingFields] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [hasPayment, setHasPayment] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isExpired, setIsExpired] = useState(false); // Track if event date has passed
  const [reviewFormData, setReviewFormData] = useState({
    name: '',
    email: '',
    eventDate: '',
    venueName: '',
    venueAddress: '',
    eventTime: '',
    endTime: ''
  });
  const [editingReviewField, setEditingReviewField] = useState(null);
  const [savingReviewField, setSavingReviewField] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    eventDate: '',
    venueName: '',
    venueAddress: '',
    eventTime: '',
    endTime: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingEventDate, setIsEditingEventDate] = useState(false);
  const [editingEventDate, setEditingEventDate] = useState('');
  const [savingEventDate, setSavingEventDate] = useState(false);
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [editingVenueName, setEditingVenueName] = useState('');
  const [editingVenueAddress, setEditingVenueAddress] = useState('');
  const [savingVenue, setSavingVenue] = useState(false);
  const [isEditingClientName, setIsEditingClientName] = useState(false);
  const [editingClientName, setEditingClientName] = useState('');
  const [savingClientName, setSavingClientName] = useState(false);
  const [isEditingClientEmail, setIsEditingClientEmail] = useState(false);
  const [editingClientEmail, setEditingClientEmail] = useState('');
  const [savingClientEmail, setSavingClientEmail] = useState(false);
  const [isEditingEventTime, setIsEditingEventTime] = useState(false);
  const [editingEventTime, setEditingEventTime] = useState('');
  const [editingEndTime, setEditingEndTime] = useState('');
  const [savingEventTime, setSavingEventTime] = useState(false);
  const { toast } = useToast();

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
        
        // Ensure venue_name is set from venueName if present
        setLeadData({
          ...lead,
          venue_name: lead.venue_name || lead.venueName || '',
          venueName: lead.venueName || lead.venue_name || ''
        });
      }

      if (quoteResponse.ok) {
        const quote = await quoteResponse.json();
        setQuoteData(quote);
        
        // If quote has contract_id, fetch contract details
        if (quote.contract_id) {
          try {
            const contractResponse = await fetch(`/api/contracts/${quote.contract_id}`);
            if (contractResponse.ok) {
              const contract = await contractResponse.json();
              setContractData(contract);
            }
          } catch (e) {
            console.log('Could not fetch contract details:', e);
          }
        }
        
        // If quote has invoice_id, fetch invoice details to check payment status
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

        // Check payment status
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
                setPaymentData({ totalPaid: 0, payments: [] });
              }
            } else {
              setHasPayment(false);
              setPaymentData({ totalPaid: 0, payments: [] });
            }
          }
        } catch (error) {
          console.log('Could not fetch payment details:', error);
          setHasPayment(false);
          setPaymentData({ totalPaid: 0, payments: [] });
        }
      } else {
        // Quote not found, but we can still show contract based on lead data
        console.log('Quote not found, will display contract from lead data');
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

  // Refetch data when the page becomes visible (e.g., navigating from invoice page)
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

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClientComponentClient();
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
  }, []);

  const handleOpenSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureChange = (data, method) => {
    setSignatureData(data);
    setSignatureMethod(method);
  };

  // Validate required fields before signing
  const validateContractFields = useCallback(() => {
    const errors = [];
    
    // Calculate total amount - use same logic as contract display
    // Get package price
    const packagePrice = Number(quoteData?.package_price) || 0;
    
    // Get addons
    const addons = quoteData?.addons || [];
    const addonsTotal = addons.reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const subtotal = packagePrice + addonsTotal;
    
    // Apply discount if present
    let discountAmount = 0;
    if (quoteData?.discount_type && quoteData?.discount_value && quoteData.discount_value > 0) {
      if (quoteData.discount_type === 'percentage') {
        discountAmount = subtotal * (Number(quoteData.discount_value) / 100);
      } else {
        discountAmount = Number(quoteData.discount_value);
      }
    }
    
    const calculatedTotal = Math.max(0, subtotal - discountAmount);
    
    // If calculatedTotal is 0 or invalid, fall back to stored total_price
    const totalAmount = calculatedTotal > 0 ? calculatedTotal : (quoteData?.total_price || 0);
    
    if (!totalAmount || totalAmount <= 0) {
      errors.push('Total amount must be calculated and greater than zero');
    }
    
    const deposit = totalAmount * 0.5;
    if (!deposit || deposit <= 0) {
      errors.push('Deposit amount must be calculated');
    }
    
    // Check eventDate - allow both eventDate and event_date formats
    const eventDate = leadData?.eventDate || leadData?.event_date;
    if (!eventDate || (typeof eventDate === 'string' && eventDate.trim() === '')) {
      errors.push('Event date is required');
    }
    
    // Check name - allow both name format and constructed from first_name/last_name
    const clientName = leadData?.name || (leadData?.first_name && leadData?.last_name 
      ? `${leadData.first_name} ${leadData.last_name}`.trim() 
      : leadData?.first_name || leadData?.last_name);
    if (!clientName || (typeof clientName === 'string' && clientName.trim() === '')) {
      errors.push('Client name is required');
    }
    
    // Check email - allow both email and email_address formats
    const clientEmail = leadData?.email || leadData?.email_address;
    if (!clientEmail || (typeof clientEmail === 'string' && clientEmail.trim() === '')) {
      errors.push('Client email is required');
    }
    
    // Check for either package or speaker rental
    const hasPackage = quoteData?.package_name;
    const hasSpeakerRental = quoteData?.speaker_rental;
    if (!hasPackage && !hasSpeakerRental) {
      errors.push('Service package or speaker rental must be selected');
    }
    
    // Check venue address - require actual address, not just venue name
    // Prefer venue_address or venueAddress (these are actual addresses)
    // location might be just a name, so we need to be careful
    const venueAddress = leadData?.venue_address || leadData?.venueAddress;
    const location = leadData?.location;
    const venueName = leadData?.venue_name;
    
    // Require venue_address or venueAddress (actual address fields)
    // If location exists but is different from venue name and looks like an address, accept it
    // But prioritize venue_address/venueAddress fields
    let validVenueAddress = venueAddress;
    
    // If no venue_address/venueAddress, check if location is valid (different from venue name and contains address-like content)
    if (!validVenueAddress && location) {
      const locationTrimmed = location.trim();
      const venueNameTrimmed = venueName?.trim() || '';
      
      // Check if location is different from venue name and contains address indicators (numbers, street, st, rd, ave, etc.)
      const hasAddressIndicators = /\d/.test(locationTrimmed) || 
                                   /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir|court|ct)/i.test(locationTrimmed);
      
      if (locationTrimmed !== venueNameTrimmed && (hasAddressIndicators || locationTrimmed.length > 30)) {
        validVenueAddress = locationTrimmed;
      }
    }
    
    if (!validVenueAddress || (typeof validVenueAddress === 'string' && validVenueAddress.trim() === '')) {
      errors.push('Venue address (full street address) is required');
    } else if (venueName && validVenueAddress === venueName) {
      // If address is same as venue name, require actual address
      errors.push('Venue address must include the full street address, not just the venue name');
    }
    
    // Check event time/start time - allow both eventTime and event_time formats
    const eventTime = leadData?.eventTime || leadData?.event_time || leadData?.start_time;
    if (!eventTime || (typeof eventTime === 'string' && eventTime.trim() === '')) {
      errors.push('Event start time is required');
    }
    
    // Check event end time - allow both endTime and end_time formats
    const endTime = leadData?.endTime || leadData?.end_time;
    if (!endTime || (typeof endTime === 'string' && endTime.trim() === '')) {
      errors.push('Event end time is required');
    }
    
    return errors;
  }, [leadData, quoteData]);

  const handleSign = async () => {
    if (!leadData || !quoteData) return;
    
    // Validate required fields before signing
    const errors = validateContractFields();
    if (errors.length > 0) {
      alert(`Cannot sign contract. Missing required information:\n\n${errors.join('\n')}\n\nPlease contact us to complete this information.`);
      return;
    }
    
    if (!signatureData) {
      alert('Please provide your signature before signing the contract.');
      return;
    }
    
    // Get client name and email using flexible format checking
    const clientName = leadData?.name || (leadData?.first_name && leadData?.last_name 
      ? `${leadData.first_name} ${leadData.last_name}`.trim() 
      : leadData?.first_name || leadData?.last_name || 'Client');
    const clientEmail = leadData?.email || leadData?.email_address || '';
    
    setSigning(true);
    try {
      const response = await fetch(`/api/quote/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: id,
          clientName: clientName,
          clientEmail: clientEmail,
          signatureData: signatureData,
          signatureMethod: signatureMethod
        })
      });

      if (response.ok) {
        const result = await response.json();
        setContractData(result.contract);
        setShowSignatureModal(false);
        setSignatureData('');
        
        // Check payment status after signing
        // Use custom invoice total if available
        const calculatedTotal = quoteData?.is_custom_price && quoteData?.total_price 
          ? quoteData.total_price 
          : quoteData?.total_price || 0;
        const depositAmount = calculatedTotal * 0.5;
        
        try {
          const paymentsResponse = await fetch(`/api/payments?contact_id=${id}`);
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            let totalPaid = 0;
            
            if (paymentsData.payments && paymentsData.payments.length > 0) {
              const paidPayments = paymentsData.payments.filter(p => p.payment_status === 'Paid');
              totalPaid = paidPayments.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
              setHasPayment(totalPaid > 0);
              setPaymentData({ totalPaid, payments: paidPayments });
            }
            
            // Check if deposit or full payment has been made
            if (totalPaid < depositAmount && totalPaid < calculatedTotal) {
              // No deposit or full payment made - show payment modal
              setShowPaymentModal(true);
            } else {
              // Payment has been made
              alert('Contract signed successfully!');
            }
          } else {
            // If payment check fails, still show payment modal to be safe
            setShowPaymentModal(true);
          }
        } catch (paymentError) {
          console.error('Error checking payments:', paymentError);
          // If payment check fails, show payment modal to be safe
          setShowPaymentModal(true);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sign contract');
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      alert(error.message || 'Failed to sign contract. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleUpdateFields = async () => {
    setUpdatingFields(true);
    try {
      // Prepare the data to update - use formData values if provided, otherwise use existing leadData
      const updateData = {
        name: formData.name || leadData?.name,
        email: formData.email || leadData?.email,
        eventDate: formData.eventDate || leadData?.eventDate || leadData?.event_date,
        venueName: formData.venueName || leadData?.venue_name,
        venueAddress: formData.venueAddress || leadData?.venue_address || leadData?.venueAddress || leadData?.location,
        eventTime: formData.eventTime || leadData?.event_time || leadData?.eventTime || leadData?.start_time,
        endTime: formData.endTime || leadData?.end_time || leadData?.endTime
      };

      // Update the lead data via API
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state immediately with new data from API response
        if (result.data) {
          setLeadData(prev => ({
            ...prev,
            name: result.data.name || prev?.name,
            email: result.data.email || prev?.email,
            email_address: result.data.email || prev?.email_address,
            eventDate: result.data.eventDate || prev?.eventDate || prev?.event_date,
            event_date: result.data.eventDate || prev?.event_date || prev?.eventDate,
            eventTime: result.data.eventTime || prev?.eventTime,
            event_time: result.data.eventTime || prev?.event_time || prev?.eventTime,
            start_time: result.data.eventTime || prev?.start_time,
            venueName: result.data.venue_name || updateData.venueName || prev?.venue_name || prev?.venueName || '',
            venue_name: result.data.venue_name || updateData.venueName || prev?.venue_name || prev?.venueName || '',
            venueAddress: result.data.venueAddress || updateData.venueAddress || prev?.venueAddress,
            venue_address: result.data.venueAddress || updateData.venueAddress || prev?.venue_address || prev?.venueAddress,
            location: result.data.venueAddress || updateData.venueAddress || prev?.location,
            endTime: result.data.endTime || updateData.endTime || prev?.endTime,
            end_time: result.data.endTime || updateData.endTime || prev?.end_time
          }));
        } else {
          // Fallback: use formData/updateData if API doesn't return formatted data
          setLeadData(prev => ({
            ...prev,
            name: updateData.name || prev?.name,
            email: updateData.email || prev?.email,
            email_address: updateData.email || prev?.email_address,
            eventDate: updateData.eventDate || prev?.eventDate || prev?.event_date,
            event_date: updateData.eventDate || prev?.event_date || prev?.eventDate,
            eventTime: updateData.eventTime || prev?.eventTime || prev?.event_time,
            event_time: updateData.eventTime || prev?.event_time || prev?.eventTime,
            start_time: updateData.eventTime || prev?.start_time,
            venueName: updateData.venueName || prev?.venue_name || prev?.venueName || '',
            venue_name: updateData.venueName || prev?.venue_name || prev?.venueName || '',
            venueAddress: updateData.venueAddress || prev?.venue_address || prev?.venueAddress,
            venue_address: updateData.venueAddress || prev?.venue_address || prev?.venueAddress,
            location: updateData.venueAddress || prev?.location,
            endTime: updateData.endTime || prev?.endTime || prev?.end_time,
            end_time: updateData.endTime || prev?.end_time || prev?.endTime
          }));
        }
        
        // Close the modal
        setShowFieldsModal(false);
        
        // Reset form data
        setFormData({
          name: '',
          email: '',
          eventDate: '',
          venueName: '',
          venueAddress: '',
          eventTime: '',
          endTime: ''
        });

        // Show success message
        toast({
          title: 'Information updated',
          description: 'Contract information has been updated successfully.',
        });
        
        // Small delay to ensure database commit completes before refetching
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refresh data with cache-busting to ensure we have the latest from database
        await fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update information');
      }
    } catch (error) {
      console.error('Error updating fields:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingFields(false);
    }
  };

  // Handler to save field from review modal
  const handleSaveReviewField = async (fieldName, fieldValue) => {
    if (!fieldValue || fieldValue.trim() === '') return;
    
    setSavingReviewField(true);
    try {
      const updateData = {};
      
      // Map field names to API field names
      switch (fieldName) {
        case 'name':
          updateData.name = fieldValue;
          break;
        case 'email':
          updateData.email = fieldValue;
          break;
        case 'eventDate':
          updateData.eventDate = fieldValue;
          break;
        case 'venueName':
          updateData.venueName = fieldValue;
          break;
        case 'venueAddress':
          updateData.venueAddress = fieldValue;
          break;
        case 'eventTime':
          updateData.eventTime = fieldValue;
          break;
        case 'endTime':
          updateData.endTime = fieldValue;
          break;
        default:
          return;
      }
      
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update leadData with the new value
        setLeadData(prev => {
          if (!prev) return null;
          const updated = { ...prev };
          
          if (fieldName === 'name') {
            updated.name = result.data?.name || fieldValue;
            if (result.data?.name) {
              const nameParts = result.data.name.split(' ');
              updated.first_name = nameParts[0] || '';
              updated.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            }
          } else if (fieldName === 'email') {
            updated.email = result.data?.email || fieldValue;
            updated.email_address = result.data?.email || fieldValue;
          } else if (fieldName === 'eventDate') {
            updated.eventDate = result.data?.eventDate || fieldValue;
            updated.event_date = result.data?.eventDate || fieldValue;
          } else if (fieldName === 'venueName') {
            updated.venue_name = result.data?.venue_name || fieldValue;
            updated.venueName = result.data?.venue_name || fieldValue;
          } else if (fieldName === 'venueAddress') {
            updated.venue_address = result.data?.venueAddress || result.data?.venue_address || fieldValue;
            updated.venueAddress = result.data?.venueAddress || result.data?.venue_address || fieldValue;
            updated.location = result.data?.venueAddress || result.data?.venue_address || fieldValue;
          } else if (fieldName === 'eventTime') {
            updated.eventTime = result.data?.eventTime || fieldValue;
            updated.event_time = result.data?.eventTime || fieldValue;
            updated.start_time = result.data?.eventTime || fieldValue;
          } else if (fieldName === 'endTime') {
            updated.endTime = result.data?.endTime || fieldValue;
            updated.end_time = result.data?.endTime || fieldValue;
          }
          
          return updated;
        });
        
        // Update reviewFormData to reflect the saved value
        setReviewFormData(prev => ({
          ...prev,
          [fieldName]: fieldValue
        }));
        
        setEditingReviewField(null);
        
        toast({
          title: 'Field updated',
          description: 'The information has been updated successfully.',
        });
        
        // Small delay before refetching to ensure DB commit
        setTimeout(async () => {
          await fetchData();
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update field');
      }
    } catch (error) {
      console.error('Error updating field:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingReviewField(false);
    }
  };

  // Admin inline editing handlers
  const handleSaveEventDate = async () => {
    if (!editingEventDate) return;
    setSavingEventDate(true);
    try {
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventDate: editingEventDate })
      });

      if (response.ok) {
        const result = await response.json();
        setLeadData(prev => ({
          ...prev,
          eventDate: result.data?.eventDate || editingEventDate,
          event_date: result.data?.eventDate || editingEventDate
        }));
        setIsEditingEventDate(false);
        setEditingEventDate('');
        toast({
          title: 'Event date updated',
          description: 'The event date has been updated successfully.',
        });
        await fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event date');
      }
    } catch (error) {
      console.error('Error updating event date:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event date. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingEventDate(false);
    }
  };

  const handleSaveClientName = async () => {
    if (!editingClientName) return;
    setSavingClientName(true);
    try {
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingClientName })
      });

      if (response.ok) {
        const result = await response.json();
        setLeadData(prev => ({
          ...prev,
          name: result.data?.name || editingClientName
        }));
        setIsEditingClientName(false);
        setEditingClientName('');
        toast({
          title: 'Client name updated',
          description: 'The client name has been updated successfully.',
        });
        await fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client name');
      }
    } catch (error) {
      console.error('Error updating client name:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update client name. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingClientName(false);
    }
  };

  const handleSaveVenue = async () => {
    if (!editingVenueName && !editingVenueAddress) return;
    setSavingVenue(true);
    try {
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: editingVenueName || leadData?.venue_name,
          venueAddress: editingVenueAddress || leadData?.venue_address || leadData?.venueAddress || leadData?.location
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLeadData(prev => ({
          ...prev,
          venue_name: result.data?.venue_name || editingVenueName || prev?.venue_name,
          venue_address: result.data?.venueAddress || editingVenueAddress || prev?.venue_address || prev?.venueAddress,
          venueAddress: result.data?.venueAddress || editingVenueAddress || prev?.venueAddress,
          location: result.data?.venueAddress || editingVenueAddress || prev?.location
        }));
        setIsEditingVenue(false);
        setEditingVenueName('');
        setEditingVenueAddress('');
        toast({
          title: 'Venue updated',
          description: 'The venue information has been updated successfully.',
        });
        await fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update venue');
      }
    } catch (error) {
      console.error('Error updating venue:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update venue. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingVenue(false);
    }
  };

  const handleSaveEventTime = async () => {
    if (!editingEventTime && !editingEndTime) return;
    setSavingEventTime(true);
    try {
      const response = await fetch(`/api/leads/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventTime: editingEventTime || leadData?.eventTime || leadData?.event_time || leadData?.start_time,
          endTime: editingEndTime || leadData?.endTime || leadData?.end_time
        })
      });

      if (response.ok) {
        const result = await response.json();
        setLeadData(prev => ({
          ...prev,
          eventTime: result.data?.eventTime || editingEventTime || prev?.eventTime || prev?.event_time,
          event_time: result.data?.eventTime || editingEventTime || prev?.event_time || prev?.eventTime,
          start_time: result.data?.eventTime || editingEventTime || prev?.start_time,
          endTime: result.data?.endTime || editingEndTime || prev?.endTime,
          end_time: result.data?.endTime || editingEndTime || prev?.end_time
        }));
        setIsEditingEventTime(false);
        setEditingEventTime('');
        setEditingEndTime('');
        toast({
          title: 'Event time updated',
          description: 'The event time has been updated successfully.',
        });
        await fetchData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event time');
      }
    } catch (error) {
      console.error('Error updating event time:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event time. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingEventTime(false);
    }
  };

  // Check if this is an equipment rental contract (speaker rental only, no DJ package)
  const isEquipmentRental = useMemo(() => {
    if (!quoteData) return false;
    
    // Check if speaker rental exists in quoteData
    if (quoteData.speaker_rental) {
      return true;
    }
    
    // Check if speaker rental is in addons array
    const addons = quoteData.addons || [];
    const hasSpeakerRental = addons.some(addon => 
      addon.id === 'speaker_rental' || 
      addon.id === 'holiday_speaker_rental' ||
      (addon.name && addon.name.toLowerCase().includes('speaker rental'))
    );
    
    // If speaker rental exists but no package, it's equipment rental
    const hasPackage = quoteData.package_name && 
                       quoteData.package_name.toLowerCase().includes('speaker') === false;
    
    return hasSpeakerRental && !hasPackage;
  }, [quoteData]);

  // Calculate total amount - match invoice calculation logic exactly
  // This includes applying discounts if present
  const calculateContractTotals = () => {
    // Get package price
    const packagePrice = Number(quoteData?.package_price) || 0;
    
    // Include speaker rental if present
    let speakerRentalPrice = 0;
    if (quoteData?.speaker_rental) {
      try {
        const speakerRental = typeof quoteData.speaker_rental === 'string' 
          ? JSON.parse(quoteData.speaker_rental) 
          : quoteData.speaker_rental;
        speakerRentalPrice = Number(speakerRental?.price) || 0;
      } catch (e) {
        console.error('Error parsing speaker rental:', e);
      }
    } else {
      // Check addons for speaker rental
      const addons = quoteData?.addons || [];
      const speakerRentalAddon = addons.find(addon => 
        addon.id === 'speaker_rental' || 
        addon.id === 'holiday_speaker_rental' ||
        (addon.name && addon.name.toLowerCase().includes('speaker rental'))
      );
      if (speakerRentalAddon) {
        speakerRentalPrice = Number(speakerRentalAddon.price) || 0;
      }
    }
    
    // Get addons - match invoice logic: use addons field (which contains current addons)
    // EXCLUDE speaker rental from addons total to avoid double-counting
    const addons = quoteData?.addons || [];
    const addonsTotal = addons
      .filter(addon => {
        // Exclude speaker rental from addons total since it's counted separately
        return addon.id !== 'speaker_rental' && 
               addon.id !== 'holiday_speaker_rental' &&
               !(addon.name && addon.name.toLowerCase().includes('speaker rental'));
      })
      .reduce((sum, addon) => sum + (Number(addon.price) || 0), 0);
    const subtotal = packagePrice + speakerRentalPrice + addonsTotal;
    
    // Apply discount if present (same logic as invoice)
    let discountAmount = 0;
    if (quoteData?.discount_type && quoteData?.discount_value && quoteData.discount_value > 0) {
      if (quoteData.discount_type === 'percentage') {
        discountAmount = subtotal * (Number(quoteData.discount_value) / 100);
      } else {
        discountAmount = Number(quoteData.discount_value);
      }
    }
    
    const total = Math.max(0, subtotal - discountAmount);
    return { packagePrice, addonsTotal, subtotal, discountAmount, total };
  };

  const { total: calculatedTotal } = calculateContractTotals();
  
  // Use calculated total (with discount) - this matches the invoice calculation
  // The invoice uses calculatedTotal when not editing, which includes discount
  // If calculatedTotal is 0 or invalid, fall back to stored total_price
  const totalAmount = calculatedTotal > 0 ? calculatedTotal : (quoteData?.total_price || 0);
  
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  const contractNumber = contractData?.contract_number || (id && typeof id === 'string' ? `CONT-${id.substring(0, 8).toUpperCase()}` : 'CONT-UNKNOWN');
  const isSigned = contractData?.status === 'signed' || contractData?.signed_at;

  // Helper function to parse a date string as a local date (not UTC)
  // This prevents timezone offset issues when displaying dates
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    // If it's already a Date object, return it
    if (dateString instanceof Date) return dateString;
    // If it's a date string in YYYY-MM-DD format, parse it as local date
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Otherwise, try to parse it normally
    return new Date(dateString);
  };

  // Helper function to format a date as YYYY-MM-DD for date inputs
  // This prevents timezone issues by using local date components
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
    if (!date || isNaN(date.getTime())) return '';
    // Format as YYYY-MM-DD using local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to format payment due dates
  const formatPaymentDueDate = (dueDate, eventDate, fallbackText) => {
    if (dueDate) {
      try {
        const date = parseLocalDate(dueDate);
        if (date && !isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      } catch (e) {
        console.error('Error formatting due date:', e);
      }
    }
    // Fallback to default text if no date is set
    return fallbackText || 'as specified in invoice';
  };

  // Get payment due dates from quote data
  const depositDueDate = quoteData?.deposit_due_date || null;
  const remainingBalanceDueDate = quoteData?.remaining_balance_due_date || null;
  
  // Format the due dates for display
  const depositDueDateText = formatPaymentDueDate(
    depositDueDate, 
    leadData?.eventDate || leadData?.event_date,
    'upon signing'
  );
  const remainingBalanceDueDateText = formatPaymentDueDate(
    remainingBalanceDueDate,
    leadData?.eventDate || leadData?.event_date,
    '7 days before event'
  );

  // Recalculate validation errors whenever leadData or quoteData changes
  // IMPORTANT: All hooks must be before any early returns
  const validationErrors = useMemo(() => {
    if (!leadData || !quoteData) {
      return ['Loading contract data...'];
    }
    const errors = validateContractFields();
    // Debug: log validation errors for troubleshooting
    if (errors.length > 0) {
      console.log('Contract validation errors:', errors);
      console.log('leadData:', {
        name: leadData?.name || `${leadData?.first_name || ''} ${leadData?.last_name || ''}`.trim(),
        email: leadData?.email || leadData?.email_address,
        eventDate: leadData?.eventDate || leadData?.event_date,
        venueAddress: leadData?.venue_address || leadData?.venueAddress || leadData?.location,
        venueName: leadData?.venue_name,
        eventTime: leadData?.eventTime || leadData?.event_time || leadData?.start_time,
        endTime: leadData?.endTime || leadData?.end_time
      });
      console.log('quoteData:', {
        package_name: quoteData?.package_name,
        total_price: quoteData?.total_price,
        is_custom_price: quoteData?.is_custom_price
      });
    }
    return errors;
  }, [validateContractFields, leadData, quoteData]);
  
  const canSign = validationErrors.length === 0 && !isSigned;

  // Early return for loading - must be AFTER all hooks
  if (loading) {
    return (
      <>
        <Head>
          <title>Contract | M10 DJ Company</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta property="og:title" content="Service Contract - M10 DJ Company" />
          <meta property="og:description" content="View your service contract" />
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Service Contract - M10 DJ Company" />
          <meta name="twitter:description" content="View your service contract" />
          <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-20">
            <Loader2 className="w-12 h-12 text-brand animate-spin mb-4" />
            <p className="text-xl text-gray-600 dark:text-gray-300">Loading contract...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Service Contract {contractNumber} | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}/contract`} />
        <meta property="og:title" content={`Service Contract ${contractNumber} - ${leadData?.name || 'Your Contract'}`} />
        <meta property="og:description" content={`Service contract for ${leadData?.eventType || 'your event'}${leadData?.eventDate ? ` on ${new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}` : ''}`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="M10 DJ Company" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}/contract`} />
        <meta name="twitter:title" content={`Service Contract ${contractNumber} - ${leadData?.name || 'Your Contract'}`} />
        <meta name="twitter:description" content={`Service contract for ${leadData?.eventType || 'your event'}`} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/logo-static.jpg`} />
        
        <link
          href="https://fonts.googleapis.com/css2?family=Allura&family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Sacramento&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header className="no-print" />

        <main className="section-container py-12 md:py-20">
          {/* Header Actions */}
          <div className="no-print max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href={`/quote/${id}/confirmation`}
              className="inline-flex items-center gap-2 text-brand hover:text-brand-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Confirmation
            </Link>
            <button
              onClick={handleDownload}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>

          {/* Contract Document */}
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 print:shadow-none print:rounded-none">
            {/* Contract Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8">
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Contract for Services</h1>
                <p className="text-gray-600 dark:text-gray-400">Contract Number: {contractNumber}</p>
              </div>
              {isSigned && (
                <div className="no-print bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-semibold">Contract Signed</p>
                  {contractData?.signed_at && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Signed on {new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Contract Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                This Contract for Services (the &quot;Contract&quot;) is made effective as of <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> (the &quot;Effective Date&quot;), by and between{' '}
                {isAdmin && !isEditingClientName ? (
                  <span className="inline-flex items-center gap-2">
                    <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong>
                    <button
                      onClick={() => {
                        setEditingClientName(leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || ''));
                        setIsEditingClientName(true);
                      }}
                      className="no-print text-brand hover:text-brand-dark"
                      title="Edit client name"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </span>
                ) : isAdmin && isEditingClientName ? (
                  <span className="inline-flex items-center gap-2">
                    <Input
                      value={editingClientName}
                      onChange={(e) => setEditingClientName(e.target.value)}
                      className="w-auto min-w-[200px]"
                    />
                    <button
                      onClick={handleSaveClientName}
                      disabled={savingClientName}
                      className="no-print text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingClientName(false);
                        setEditingClientName('');
                      }}
                      className="no-print text-gray-500 hover:text-gray-700"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ) : (
                  <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong>
                )}
                {' '}(&quot;Client&quot;) and M10 DJ Company, (&quot;M10&quot;) of 65 Stewart Rd, Eads, Tennessee 38028 (collectively the &quot;Parties&quot;).
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                NOW, THEREFORE, FOR AND IN CONSIDERATION of the mutual promises and agreements contained herein, Client hires M10, and M10 agrees to provide {isEquipmentRental ? 'audio equipment rental services' : 'Disc Jockey services (&quot;DJ&quot; services)'} to Client under the terms and conditions hereby agreed upon by the parties:
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. DESCRIPTION OF SERVICES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client hereby agrees to engage M10 to provide Client with {isEquipmentRental ? 'audio equipment rental services' : 'DJ services'} (collectively, the &quot;Services&quot;) to be performed at the following event(s):
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Event Details:</p>
                {(leadData?.eventDate || leadData?.event_date || isAdmin) && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="flex items-center gap-2">
                      <strong>Date:</strong>{' '}
                      {/* Always show the date text for printing */}
                      <span>
                        {leadData?.eventDate || leadData?.event_date
                          ? parseLocalDate(leadData.eventDate || leadData.event_date)?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'Event date not set'
                          : 'Event date not set'}
                      </span>
                      {/* Admin editing controls - hidden when printing */}
                      {isAdmin && !isEditingEventDate && (
                        <span
                          onClick={() => {
                            const date = leadData?.eventDate || leadData?.event_date;
                            setEditingEventDate(date ? formatDateForInput(date) : '');
                            setIsEditingEventDate(true);
                          }}
                          className="no-print cursor-pointer hover:text-brand transition-colors underline ml-2"
                          title="Click to edit event date"
                        >
                          (Edit)
                        </span>
                      )}
                      {isAdmin && isEditingEventDate && (
                        <span className="no-print flex items-center gap-2 ml-2">
                          <Input
                            type="date"
                            value={editingEventDate}
                            onChange={(e) => setEditingEventDate(e.target.value)}
                            className="w-auto"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEventDate}
                            disabled={savingEventDate}
                            className="text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingEventDate(false);
                              setEditingEventDate('');
                            }}
                            className="text-gray-500 hover:text-gray-700"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      )}
                    </span>
                  </p>
                )}
                {(leadData?.eventTime || leadData?.event_time || leadData?.start_time || leadData?.endTime || leadData?.end_time || isAdmin) && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="flex items-center gap-2 flex-wrap">
                      <strong>Start Time:</strong>{' '}
                      {isAdmin && !isEditingEventTime ? (
                        <>
                          <span>
                            {leadData?.eventTime || leadData?.event_time || leadData?.start_time 
                              ? new Date(`2000-01-01T${leadData.eventTime || leadData.event_time || leadData.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              : 'Not set'}
                          </span>
                          <span> - <strong>End Time:</strong> </span>
                          <span>
                            {leadData?.endTime || leadData?.end_time
                              ? new Date(`2000-01-01T${leadData.endTime || leadData.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              : 'Not set'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingEventTime(leadData?.eventTime || leadData?.event_time || leadData?.start_time || '');
                              setEditingEndTime(leadData?.endTime || leadData?.end_time || '');
                              setIsEditingEventTime(true);
                            }}
                            className="no-print text-brand hover:text-brand-dark"
                            title="Edit event time"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </>
                      ) : isAdmin && isEditingEventTime ? (
                        <>
                          <Input
                            type="time"
                            value={editingEventTime}
                            onChange={(e) => setEditingEventTime(e.target.value)}
                            className="w-auto"
                          />
                          <span> - <strong>End Time:</strong></span>
                          <Input
                            type="time"
                            value={editingEndTime}
                            onChange={(e) => setEditingEndTime(e.target.value)}
                            className="w-auto"
                          />
                          <button
                            onClick={handleSaveEventTime}
                            disabled={savingEventTime}
                            className="no-print text-green-600 hover:text-green-700"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingEventTime(false);
                              setEditingEventTime('');
                              setEditingEndTime('');
                            }}
                            className="no-print text-gray-500 hover:text-gray-700"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span>
                            {leadData?.eventTime || leadData?.event_time || leadData?.start_time
                              ? new Date(`2000-01-01T${leadData.eventTime || leadData.event_time || leadData.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              : 'Not set'}
                          </span>
                          <span> - <strong>End Time:</strong> </span>
                          <span>
                            {leadData?.endTime || leadData?.end_time
                              ? new Date(`2000-01-01T${leadData.endTime || leadData.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                              : 'Not set'}
                          </span>
                        </>
                      )}
                    </span>
                  </p>
                )}
                {(leadData?.venue_address || leadData?.venueAddress || leadData?.location || leadData?.venue_name || isAdmin) && (
                      <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span className="flex items-center gap-2 flex-wrap">
                      <strong>Venue:</strong>{' '}
                      {isAdmin && !isEditingVenue ? (
                        <>
                          {leadData?.venue_name && (leadData?.venue_address || leadData?.venueAddress || (leadData?.location && leadData.location !== leadData.venue_name))
                            ? `${leadData.venue_name}, ${leadData.venue_address || leadData.venueAddress || leadData.location}`
                            : leadData?.venue_name || leadData?.venue_address || leadData?.venueAddress || leadData?.location || 'Not set'}
                          <button
                            onClick={() => {
                              const venueName = leadData?.venue_name || '';
                              const location = leadData?.venue_address || leadData?.venueAddress || leadData?.location || '';
                              const venueAddress = location && location !== venueName ? location : '';
                              setEditingVenueName(venueName);
                              setEditingVenueAddress(venueAddress);
                              setIsEditingVenue(true);
                            }}
                            className="no-print text-brand hover:text-brand-dark"
                            title="Edit venue"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </>
                      ) : isAdmin && isEditingVenue ? (
                        <div className="no-print flex flex-col gap-2">
                          <VenueAutocomplete
                            venueName={editingVenueName}
                            venueAddress={editingVenueAddress}
                            onVenueNameChange={setEditingVenueName}
                            onVenueAddressChange={setEditingVenueAddress}
                            placeholder="Venue name"
                            addressPlaceholder="Venue address"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleSaveVenue}
                              disabled={savingVenue}
                              className="text-green-600 hover:text-green-700"
                              title="Save"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingVenue(false);
                                setEditingVenueName('');
                                setEditingVenueAddress('');
                              }}
                              className="text-gray-500 hover:text-gray-700"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        leadData?.venue_name && (leadData?.venue_address || leadData?.venueAddress || (leadData?.location && leadData.location !== leadData.venue_name))
                          ? `${leadData.venue_name}, ${leadData.venue_address || leadData.venueAddress || leadData.location}`
                          : leadData?.venue_name || leadData?.venue_address || leadData?.venueAddress || leadData?.location
                      )}
                    </span>
                  </p>
                )}
              </div>
              {isEquipmentRental ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Services shall consist of the rental and delivery of professional audio equipment, including but not limited to speakers, microphones, mixing equipment, and all necessary cables and accessories. Equipment will be set up at the event location and removed after the event concludes.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Equipment Included:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {(() => {
                        const addons = quoteData?.addons || [];
                        const speakerRental = quoteData?.speaker_rental 
                          ? (typeof quoteData.speaker_rental === 'string' ? JSON.parse(quoteData.speaker_rental) : quoteData.speaker_rental)
                          : addons.find(a => a.id === 'speaker_rental' || a.id === 'holiday_speaker_rental');
                        const hours = speakerRental?.totalHours || speakerRental?.description?.match(/(\d+\.?\d*)\s*hours?/i)?.[1] || '4';
                        return (
                          <>
                            <li>Professional speaker system with built-in mixer</li>
                            <li>Microphone input capability</li>
                            <li>All necessary cables and connectors</li>
                            <li>Equipment setup and breakdown</li>
                            <li>Rental period: Up to {hours} hours (additional hours available at $100/hour)</li>
                          </>
                        );
                      })()}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Services shall consist primarily of providing musical entertainment by means of a recorded music format.
                </p>
              )}

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. {isEquipmentRental ? 'EQUIPMENT DELIVERY AND SETUP' : 'PERFORMANCE OF SERVICES'}</h2>
              {isEquipmentRental ? (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>a.</strong> M10 shall deliver the equipment to the event location at a time agreed upon by both parties, typically one hour before the event start time. M10 will set up all equipment, conduct a sound check, and ensure all systems are functioning properly before the event begins.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>b.</strong> Client is responsible for providing a suitable location for equipment setup with access to electrical power. Client agrees to use the equipment in a safe and responsible manner and to notify M10 immediately of any equipment malfunctions or issues.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>c.</strong> M10 will return to the event location after the event concludes to remove all equipment. Equipment must be returned in the same condition as delivered, normal wear and tear excepted. Client is responsible for any damage, loss, or theft of equipment during the rental period.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>a.</strong> M10 shall arrive at the event location one hour before the starting time to set-up and conduct sound check. M10&apos;s playlist shall have an unlimited playlist of songs from both latest and old classics. M10 shall incorporate guest&apos;s requests into the playlist unless otherwise directed by Client. Music shall be played without any breaks unless requested by Client. Time is of the essence. Requests for extended playing time beyond the agreed-upon hours of service shall be accommodated if feasible.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    <strong>b.</strong> M10 shall be familiar with indoor and outdoor set-up and sound mixing. M10 shall provide multi-color lighting for a ball room effect. M10 shall have high quality microphone and sound system.
                  </p>
                </>
              )}

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. TERM</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client and M10 agree that this Contract between the Parties is for Services that shall commence on the above date and complete on <strong>{(leadData?.eventDate || leadData?.event_date) ? parseLocalDate(leadData.eventDate || leadData.event_date)?.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) || 'the event date' : 'the event date'}</strong>. The Contract may be extended and/or renewed by agreement of all Parties in writing thereafter.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. PAYMENT</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For your convenience, payments can be made online using a valid credit card. Otherwise, payment is to be made by cash or check.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                An initial retainer of <strong>${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> of total cost <strong>${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> and a signed contract must be secured prior to any services being performed by Consultant. Remaining balance is due as indicated in the schedule below:
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Payment Schedule:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Deposit: ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due {depositDueDateText})</li>
                  <li>Remaining Balance: ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due {remainingBalanceDueDateText})</li>
                </ul>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">5. CANCELLATION POLICY</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                All retainer fees are non-refundable. Cancellation of this Contract by Client which is received in writing more than 30 days prior to the event will result in a refund of any monies paid, less the retainer fee. Cancellation of Services received less than 30 days prior to the event obligate Client to make full remaining payment of the total fees agreed upon. If cancellation is initiated by M10 all monies paid to M10 from Client shall be fully refunded INCLUDING retainer fee. Any refund shall be paid out at month&apos;s end.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">6. WARRANTY</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                M10 shall provide its services and meet its obligations under this Contract in a timely and workmanlike manner, using knowledge and recommendations for performing the services which meet generally acceptable standards in M10&apos;s industry and region, and will provide a standard of care equal to, or superior to, care used by service providers similar to M10 on similar projects.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">7. SIGNATORIES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                This Agreement shall be signed on behalf of Client by{' '}
                {isAdmin && !isEditingClientName ? (
                  <span className="inline-flex items-center gap-2">
                    <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong>
                    <button
                      onClick={() => {
                        setEditingClientName(leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || ''));
                        setIsEditingClientName(true);
                      }}
                      className="no-print text-brand hover:text-brand-dark"
                      title="Edit client name"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                  </span>
                ) : isAdmin && isEditingClientName ? (
                  <span className="inline-flex items-center gap-2">
                    <Input
                      value={editingClientName}
                      onChange={(e) => setEditingClientName(e.target.value)}
                      className="w-auto min-w-[200px]"
                    />
                    <button
                      onClick={handleSaveClientName}
                      disabled={savingClientName}
                      className="no-print text-green-600 hover:text-green-700"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingClientName(false);
                        setEditingClientName('');
                      }}
                      className="no-print text-gray-500 hover:text-gray-700"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ) : (
                  <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong>
                )}
                {' '}and on behalf of M10 by Ben Murray, Manager and effective as of the date first above written.
              </p>
            </div>

            {/* Signature Section */}
            {!isSigned && (
              <div className="no-print border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                {validationErrors.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                    <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">⚠️ Missing Required Information</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      The following required fields must be completed before signing:
                    </p>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-3">
                      Please contact us to complete this information before signing the contract.
                    </p>
                  </div>
                )}
                {validationErrors.length === 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                    <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Ready to Sign?</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      By clicking &quot;Review & Sign&quot; below, you can review and edit your information one final time before signing the contract.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (validationErrors.length > 0) {
                      // Missing fields - show edit modal
                      setFormData({
                        name: leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || ''),
                        email: leadData?.email || leadData?.email_address || '',
                        eventDate: formatDateForInput(leadData?.eventDate || leadData?.event_date || ''),
                        venueName: leadData?.venue_name || '',
                        venueAddress: leadData?.venue_address || leadData?.venueAddress || (leadData?.location && leadData.location !== leadData?.venue_name ? leadData.location : '') || '',
                        eventTime: leadData?.eventTime || leadData?.event_time || leadData?.start_time || '',
                        endTime: leadData?.endTime || leadData?.end_time || ''
                      });
                      setShowFieldsModal(true);
                    } else if (isAdmin) {
                      // Admin - show edit modal with pre-populated data
                      setFormData({
                        name: leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || ''),
                        email: leadData?.email || leadData?.email_address || '',
                        eventDate: formatDateForInput(leadData?.eventDate || leadData?.event_date || ''),
                        venueName: leadData?.venue_name || '',
                        venueAddress: leadData?.venue_address || leadData?.venueAddress || (leadData?.location && leadData.location !== leadData?.venue_name ? leadData.location : '') || '',
                        eventTime: leadData?.eventTime || leadData?.event_time || leadData?.start_time || '',
                        endTime: leadData?.endTime || leadData?.end_time || ''
                      });
                      setShowFieldsModal(true);
                    } else {
                      // All fields complete - show review modal first (skip the "Fill in Missing Information" modal)
                      // Pre-populate review form data
                      setReviewFormData({
                        name: leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || ''),
                        email: leadData?.email || leadData?.email_address || '',
                        eventDate: formatDateForInput(leadData?.eventDate || leadData?.event_date || ''),
                        venueName: leadData?.venue_name || '',
                        venueAddress: leadData?.venue_address || leadData?.venueAddress || leadData?.location || '',
                        eventTime: leadData?.eventTime || leadData?.event_time || leadData?.start_time || '',
                        endTime: leadData?.endTime || leadData?.end_time || ''
                      });
                      setShowReviewModal(true);
                    }
                  }}
                  disabled={signing || updatingFields}
                  className={`w-full inline-flex items-center justify-center gap-2 ${
                    canSign || validationErrors.length > 0
                      ? 'btn-primary'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                      {validationErrors.length > 0 ? (
                        <>
                          <Edit className="w-5 h-5" />
                          Fill In Missing Information
                        </>
                      ) : isAdmin ? (
                        <>
                          <Edit className="w-5 h-5" />
                          Edit Contract Information
                        </>
                      ) : (
                        <>
                          <PenTool className="w-5 h-5" />
                          Review & Sign
                        </>
                      )}
                </button>
              </div>
            )}

            {isSigned && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-4">Client Signature</p>
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded p-4 h-24 flex items-center justify-center">
                      {contractData?.client_signature_data ? (
                        <img src={contractData.client_signature_data} alt="Client Signature" className="max-h-full" />
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">{contractData?.signed_by_client || leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</p>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{contractData?.signed_by_client || leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</p>
                    {contractData?.signed_at && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(contractData.signed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="font-semibold text-gray-900 dark:text-white">M10 DJ Company Signature</p>
                      {!contractData?.signed_by_vendor_at && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded border border-yellow-300 dark:border-yellow-700">
                          PENDING
                        </span>
                      )}
                    </div>
                    <div className={`border-2 rounded p-4 h-24 flex flex-col items-center justify-center ${
                      contractData?.signed_by_vendor_at 
                        ? 'border-gray-300 dark:border-gray-600' 
                        : 'border-dashed border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/10'
                    }`}>
                      {contractData?.vendor_signature_data ? (
                        <img src={contractData.vendor_signature_data} alt="M10 DJ Company Signature" className="max-h-full" />
                      ) : contractData?.signed_by_vendor_at ? (
                      <p className="text-gray-500 dark:text-gray-400">Ben Murray, Manager</p>
                      ) : (
                        <div className="text-center">
                          <p className="text-yellow-700 dark:text-yellow-400 font-medium text-sm">Not Signed</p>
                          <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">Awaiting Manager Signature</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Ben Murray</p>
                    {contractData?.signed_by_vendor_at ? (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {new Date(contractData.signed_by_vendor_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    ) : (
                      <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1 font-medium">
                        Signature Pending
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="no-print max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/quote/${id}/invoice`}
              className="btn-outline inline-flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              View Invoice
            </Link>
            <Link
              href={`/quote/${id}/payment`}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Make Payment
            </Link>
          </div>
        </main>

        {/* Signature Modal */}
        {showSignatureModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign Contract</h2>
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Please review the contract terms above.</strong> By signing below, you agree to all terms and conditions outlined in this contract.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || '')}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <SignatureCapture
                  onSignatureChange={handleSignatureChange}
                  label="Your Signature"
                  defaultMethod="type"
                />

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agree-terms"
                    className="mt-1"
                    required
                  />
                  <label htmlFor="agree-terms" className="text-sm text-gray-700 dark:text-gray-300">
                    I understand that this electronic signature is legally binding and has the same effect as a handwritten signature.
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowSignatureModal(false);
                    setSignatureData('');
                  }}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={signing || !signatureData}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    <>
                      <PenTool className="w-5 h-5" />
                      Sign Contract
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fields Update Modal */}
        {showFieldsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isAdmin ? 'Edit Contract Information' : 'Complete Required Information'}
                </h3>
                <button
                  onClick={() => {
                    setShowFieldsModal(false);
                    // Reset form data when closing
                    setFormData({
                      name: '',
                      email: '',
                      eventDate: '',
                      venueName: '',
                      venueAddress: '',
                      eventTime: '',
                      endTime: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {isAdmin 
                  ? 'Edit any contract information below. All fields are editable for quick updates.'
                  : 'Please fill in the following required fields to proceed with signing the contract:'}
              </p>

              <div className="space-y-4">
                {/* Client Name - Always show for admin, or if missing */}
                {(isAdmin || !leadData?.name) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Client Name {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name || leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || '')}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter client full name"
                      required={!isAdmin}
                    />
                  </div>
                )}

                {/* Client Email - Always show for admin, or if missing */}
                {(isAdmin || !leadData?.email) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      value={formData.email || leadData?.email || leadData?.email_address || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter email address"
                      required={!isAdmin}
                    />
                  </div>
                )}

                {/* Event Date - Always show for admin, or if missing */}
                {(isAdmin || (!leadData?.eventDate && !leadData?.event_date)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate || formatDateForInput(leadData?.eventDate || leadData?.event_date || '')}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={!isAdmin}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                {/* Venue Name - Always show for admin, or if missing */}
                {(isAdmin || !leadData?.venue_name) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Venue Name {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.venueName || leadData?.venue_name || ''}
                      onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter venue name"
                      required={!isAdmin}
                    />
                  </div>
                )}

                {/* Venue Address - Always show for admin, or if missing/invalid */}
                {(() => {
                  const venueAddress = leadData?.venue_address || leadData?.venueAddress;
                  const location = leadData?.location;
                  const venueName = leadData?.venue_name;
                  
                  let needsVenueAddress = false;
                  if (!venueAddress) {
                    if (!location || location === venueName) {
                      needsVenueAddress = true;
                    } else {
                      const locationTrimmed = location.trim();
                      const venueNameTrimmed = venueName?.trim() || '';
                      const hasAddressIndicators = /\d/.test(locationTrimmed) || 
                                                     /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir|court|ct)/i.test(locationTrimmed);
                      
                      if (locationTrimmed === venueNameTrimmed || (!hasAddressIndicators && locationTrimmed.length <= 30)) {
                        needsVenueAddress = true;
                      }
                    }
                  } else if (venueAddress === venueName) {
                    needsVenueAddress = true;
                  }
                  
                  return (isAdmin || needsVenueAddress) ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Address {!isAdmin && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.venueAddress || venueAddress || location || ''}
                        onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        placeholder="Enter full venue address (street, city, state, zip)"
                        required={!isAdmin}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Please provide the complete street address where the event will take place.
                      </p>
                    </div>
                  ) : null;
                })()}

                {/* Event Start Time - Always show for admin, or if missing */}
                {(isAdmin || (!leadData?.event_time && !leadData?.eventTime && !leadData?.start_time)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Start Time {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="time"
                      value={formData.eventTime || leadData?.eventTime || leadData?.event_time || leadData?.start_time || ''}
                      onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={!isAdmin}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please enter the time your event starts
                    </p>
                  </div>
                )}

                {/* Event End Time - Always show for admin, or if missing */}
                {(isAdmin || (!leadData?.end_time && !leadData?.endTime)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event End Time {!isAdmin && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="time"
                      value={formData.endTime || leadData?.endTime || leadData?.end_time || ''}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required={!isAdmin}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please enter the time your event ends
                    </p>
                  </div>
                )}

                {!isAdmin && (() => {
                  const hasName = leadData?.name || leadData?.first_name || leadData?.last_name;
                  const hasEmail = leadData?.email || leadData?.email_address;
                  const hasDate = leadData?.eventDate || leadData?.event_date;
                  
                  // Check for actual venue address (venue_address or venueAddress preferred)
                  // location is acceptable only if it's different from venue name and looks like an address
                  const venueAddress = leadData?.venue_address || leadData?.venueAddress;
                  const location = leadData?.location;
                  const venueName = leadData?.venue_name;
                  
                  let hasValidVenueAddress = false;
                  if (venueAddress) {
                    hasValidVenueAddress = true;
                  } else if (location) {
                    const locationTrimmed = location.trim();
                    const venueNameTrimmed = venueName?.trim() || '';
                    const hasAddressIndicators = /\d/.test(locationTrimmed) || 
                                                 /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir|court|ct)/i.test(locationTrimmed);
                    
                    if (locationTrimmed !== venueNameTrimmed && (hasAddressIndicators || locationTrimmed.length > 30)) {
                      hasValidVenueAddress = true;
                    }
                  }
                  
                  const hasStartTime = leadData?.event_time || leadData?.eventTime || leadData?.start_time;
                  const hasEndTime = leadData?.end_time || leadData?.endTime;
                  
                  // If all fields are filled, don't show this message - the modal shouldn't be open in the first place
                  // Instead, just show the form fields for editing
                  return null;
                })()}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFieldsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={updatingFields}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateFields}
                  disabled={updatingFields || (!isAdmin && (() => {
                    const hasName = formData.name || leadData?.name || leadData?.first_name || leadData?.last_name;
                    const hasEmail = formData.email || leadData?.email || leadData?.email_address;
                    const hasDate = formData.eventDate || leadData?.eventDate || leadData?.event_date;
                    
                    // Check for valid venue address
                    const venueAddress = formData.venueAddress || leadData?.venue_address || leadData?.venueAddress;
                    const location = formData.venueAddress || leadData?.venue_address || leadData?.venueAddress || leadData?.location;
                    const venueName = leadData?.venue_name;
                    
                    let hasValidVenueAddress = false;
                    if (venueAddress && venueAddress.trim() !== '') {
                      hasValidVenueAddress = venueAddress.trim() !== venueName;
                    } else if (location) {
                      const locationTrimmed = location.trim();
                      const venueNameTrimmed = venueName?.trim() || '';
                      const hasAddressIndicators = /\d/.test(locationTrimmed) || 
                                                   /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir|court|ct)/i.test(locationTrimmed);
                      
                      if (locationTrimmed !== venueNameTrimmed && locationTrimmed !== '' && (hasAddressIndicators || locationTrimmed.length > 30)) {
                        hasValidVenueAddress = true;
                      }
                    }
                    
                    const hasStartTime = formData.eventTime || leadData?.event_time || leadData?.eventTime || leadData?.start_time;
                    const hasEndTime = formData.endTime || leadData?.end_time || leadData?.endTime;
                    
                    return !hasName || !hasEmail || !hasDate || !hasValidVenueAddress || !hasStartTime || !hasEndTime;
                  })())}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {updatingFields ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isAdmin ? 'Saving...' : 'Updating...'}
                    </>
                  ) : (
                    isAdmin ? 'Save Changes' : 'Save & Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Before Signing Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Review Contract Information
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please review the following information before signing. You can edit any field by clicking on it.
              </p>

              <div className="space-y-4 mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Client Name
                  </label>
                  {editingReviewField === 'name' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={reviewFormData.name}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, name: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveReviewField('name', reviewFormData.name)}
                        disabled={savingReviewField || !reviewFormData.name}
                        className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewField(null);
                          setReviewFormData({ ...reviewFormData, name: leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || '') });
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('name')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>{reviewFormData.name || leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Not set')}</span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  {editingReviewField === 'email' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={reviewFormData.email}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, email: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveReviewField('email', reviewFormData.email)}
                        disabled={savingReviewField || !reviewFormData.email}
                        className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewField(null);
                          setReviewFormData({ ...reviewFormData, email: leadData?.email || leadData?.email_address || '' });
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('email')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>{reviewFormData.email || leadData?.email || leadData?.email_address || 'Not set'}</span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Date
                  </label>
                  {editingReviewField === 'eventDate' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={reviewFormData.eventDate}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, eventDate: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveReviewField('eventDate', reviewFormData.eventDate)}
                        disabled={savingReviewField || !reviewFormData.eventDate}
                        className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewField(null);
                          setReviewFormData({ ...reviewFormData, eventDate: formatDateForInput(leadData?.eventDate || leadData?.event_date || '') });
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('eventDate')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>
                        {reviewFormData.eventDate || (leadData?.eventDate || leadData?.event_date
                          ? parseLocalDate(leadData.eventDate || leadData.event_date)?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || 'Not set'
                          : 'Not set')}
                      </span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Time
                  </label>
                  {editingReviewField === 'eventTime' || editingReviewField === 'endTime' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400 w-16">Start:</label>
                        <input
                          type="time"
                          value={reviewFormData.eventTime}
                          onChange={(e) => setReviewFormData({ ...reviewFormData, eventTime: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400 w-16">End:</label>
                        <input
                          type="time"
                          value={reviewFormData.endTime}
                          onChange={(e) => setReviewFormData({ ...reviewFormData, endTime: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleSaveReviewField('eventTime', reviewFormData.eventTime).then(() => {
                            if (reviewFormData.endTime) {
                              handleSaveReviewField('endTime', reviewFormData.endTime);
                            }
                          })}
                          disabled={savingReviewField || (!reviewFormData.eventTime && !reviewFormData.endTime)}
                          className="flex-1 px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                        >
                          {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingReviewField(null);
                            setReviewFormData({ 
                              ...reviewFormData, 
                              eventTime: leadData?.eventTime || leadData?.event_time || leadData?.start_time || '',
                              endTime: leadData?.endTime || leadData?.end_time || ''
                            });
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('eventTime')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>
                        <strong>Start:</strong> {reviewFormData.eventTime || leadData?.eventTime || leadData?.event_time || leadData?.start_time
                          ? new Date(`2000-01-01T${reviewFormData.eventTime || leadData.eventTime || leadData.event_time || leadData.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          : 'Not set'}
                        {' - '}
                        <strong>End:</strong> {reviewFormData.endTime || leadData?.endTime || leadData?.end_time
                          ? new Date(`2000-01-01T${reviewFormData.endTime || leadData.endTime || leadData.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                          : 'Not set'}
                      </span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Name
                  </label>
                  {editingReviewField === 'venueName' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={reviewFormData.venueName}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, venueName: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveReviewField('venueName', reviewFormData.venueName)}
                        disabled={savingReviewField}
                        className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewField(null);
                          setReviewFormData({ ...reviewFormData, venueName: leadData?.venue_name || '' });
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('venueName')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>{reviewFormData.venueName || leadData?.venue_name || 'Not set'}</span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Venue Address
                  </label>
                  {editingReviewField === 'venueAddress' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={reviewFormData.venueAddress}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, venueAddress: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveReviewField('venueAddress', reviewFormData.venueAddress)}
                        disabled={savingReviewField}
                        className="px-3 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingReviewField ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewField(null);
                          setReviewFormData({ ...reviewFormData, venueAddress: leadData?.venue_address || leadData?.venueAddress || leadData?.location || '' });
                        }}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingReviewField('venueAddress')}
                      className="text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 py-1 -mx-2 transition-colors flex items-center justify-between group"
                    >
                      <span>{reviewFormData.venueAddress || leadData?.venue_address || leadData?.venueAddress || leadData?.location || 'Not set'}</span>
                      <Edit className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Package Selected
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {quoteData?.package_name || 'Not set'}
                  </p>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deposit Required (50%)
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Remaining Balance
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    handleOpenSignatureModal();
                  }}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors inline-flex items-center justify-center gap-2"
                >
                  <PenTool className="w-4 h-4" />
                  Continue to Sign
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Required Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Contract Signed Successfully
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    ⚠️ Payment Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Your contract has been signed, but a deposit or full payment is required before we can countersign your contract and secure your booking.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  {quoteData && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Required Deposit (50%):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {paymentData && paymentData.totalPaid > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t border-gray-300 dark:border-gray-600">
                          <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            ${paymentData.totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Important:</strong> Your contract will not be countersigned by M10 DJ Company until payment is received. Please make a deposit or full payment to secure your event date.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Remind Me Later
                </button>
                <Link
                  href={`/quote/${id}/payment`}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Make Payment Now
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>

      <style jsx global>{`
        @media print {
          /* Hide all non-contract elements */
          .no-print,
          header,
          nav,
          footer,
          .no-print *,
          /* Hide chat widgets and floating elements */
          [class*="chat"],
          [class*="widget"],
          [class*="Chat"],
          [class*="Widget"],
          [id*="chat"],
          [id*="widget"],
          /* Hide fixed/floating positioned elements */
          [class*="fixed"],
          [style*="position: fixed"],
          [style*="position:fixed"],
          /* Hide elements with high z-index (typically overlays/widgets) */
          [style*="z-index: 50"],
          [style*="z-index:50"],
          [style*="z-index: 40"],
          [style*="z-index:40"],
          [style*="z-index: 999"],
          [style*="z-index:999"],
          /* Hide any floating action buttons */
          [class*="floating"],
          [class*="Floating"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          
          /* Legal document page setup */
          @page {
            margin: 1in;
            size: letter;
          }
          
          /* Reset page styling - Legal document format */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
            font-family: 'Times New Roman', Times, serif !important;
            color: #000000 !important;
          }
          
          /* Contract container styling */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Contract document styling - Legal document format */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: 11pt !important;
            line-height: 1.5 !important;
            font-family: 'Times New Roman', Times, serif !important;
            color: #000000 !important;
          }
          
          /* Typography adjustments for legal document */
          h1, h2, h3, h4, h5, h6 {
            font-family: 'Times New Roman', Times, serif !important;
            font-weight: bold !important;
            color: #000000 !important;
            page-break-after: avoid !important;
          }
          
          h2 {
            font-size: 14pt !important;
            margin-top: 12pt !important;
            margin-bottom: 6pt !important;
          }
          
          p {
            font-size: 11pt !important;
            line-height: 1.5 !important;
            margin-bottom: 6pt !important;
            color: #000000 !important;
          }
          
          strong {
            font-weight: bold !important;
            color: #000000 !important;
          }
          
          /* Ensure text is black for printing */
          body, p, span, div, h1, h2, h3, h4, h5, h6, td, th, label, li {
            color: #000 !important;
            font-size: 11pt !important;
          }
          
          /* Remove dark mode colors for print */
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .dark\\:text-gray-700 {
            color: #000000 !important;
          }
          
          /* Background colors should be white */
          .bg-gray-50,
          .bg-gray-900,
          .bg-white,
          .bg-gray-800 {
            background: white !important;
          }
          
          /* Remove rounded corners and shadows for print */
          .rounded-lg,
          .rounded-xl,
          .rounded-2xl {
            border-radius: 0 !important;
          }
          
          .shadow-xl,
          .shadow-2xl {
            box-shadow: none !important;
          }
          
          /* Padding adjustments for legal format */
          .p-4,
          .p-6 {
            padding: 6pt !important;
          }
          
          .mb-4,
          .mb-6 {
            margin-bottom: 6pt !important;
          }
          
          .mt-8 {
            margin-top: 12pt !important;
          }
          
          /* List styling */
          ul, ol {
            margin-left: 24pt !important;
            margin-bottom: 6pt !important;
          }
          
          li {
            font-size: 11pt !important;
            line-height: 1.5 !important;
            margin-bottom: 3pt !important;
          }
          
          /* Keep white backgrounds */
          .bg-white,
          .bg-gray-50,
          .bg-green-50 {
            background: white !important;
          }
          
          /* Yellow warning backgrounds for pending signatures */
          .bg-yellow-50,
          .bg-yellow-100 {
            background: #fef3c7 !important;
          }
          
          /* Dashed border for pending signatures */
          .border-yellow-400,
          .border-yellow-600 {
            border-color: #f59e0b !important;
            border-style: dashed !important;
          }
          
          /* Dark mode text should be black in print */
          .dark\\:text-white,
          .dark\\:text-gray-300,
          .dark\\:text-gray-400 {
            color: #000 !important;
          }
          
          /* Yellow warning text should be dark brown for print visibility */
          .text-yellow-600,
          .text-yellow-700,
          .text-yellow-800,
          .text-yellow-400,
          .text-yellow-500 {
            color: #92400e !important;
          }
          
          /* Pending badge styling for print */
          .bg-yellow-100 {
            background: #fef3c7 !important;
            border: 1px solid #f59e0b !important;
            color: #92400e !important;
          }
          
          /* Signature section */
          .signature-section {
            page-break-inside: avoid;
          }
          
          /* Page breaks */
          .page-break {
            page-break-before: always;
          }
          
          /* No page breaks inside important sections */
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          /* Additional legal document formatting */
          .section-container {
            padding: 0 !important;
          }
          
          /* Remove extra spacing */
          .py-12,
          .py-20 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          /* Hide fixed positioned elements (chat widgets, floating buttons, etc.) */
          [class*="fixed"],
          [style*="position: fixed"],
          [style*="position:fixed"],
          [class*="z-["],
          [class*="z-[999"],
          [class*="z-[99"],
          [style*="z-index"] {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Hide any remaining UI elements that might appear */
          button:not(.no-print),
          a:not(.no-print),
          [role="button"]:not(.no-print),
          [class*="btn"]:not(.no-print),
          [class*="button"]:not(.no-print) {
            display: none !important;
          }
          
          /* Hide fixed/floating positioned elements (but preserve contract layout) */
          [class*="fixed"]:not(.max-w-4xl):not(.max-w-4xl *),
          [style*="position: fixed"]:not(.max-w-4xl):not(.max-w-4xl *),
          [style*="position:fixed"]:not(.max-w-4xl):not(.max-w-4xl *) {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Hide any overlay or modal backgrounds */
          [class*="overlay"],
          [class*="modal"],
          [class*="backdrop"],
          [class*="dialog"],
          [class*="portal"] {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
