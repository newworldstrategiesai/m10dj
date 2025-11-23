import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../../components/company/Header';
import SignatureCapture from '../../../components/SignatureCapture';
import { FileText, Download, ArrowLeft, Loader2, CheckCircle, Calendar, MapPin, PenTool, X, Edit, Clock } from 'lucide-react';

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    eventDate: '',
    venueAddress: '',
    eventTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}`),
        fetch(`/api/quote/${id}`)
      ]);

      if (leadResponse.ok) {
        const lead = await leadResponse.json();
        setLeadData(lead);
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
  };

  const handleOpenSignatureModal = () => {
    setShowSignatureModal(true);
  };

  const handleSignatureChange = (data, method) => {
    setSignatureData(data);
    setSignatureMethod(method);
  };

  // Validate required fields before signing
  const validateContractFields = () => {
    const errors = [];
    
    if (!quoteData?.total_price || quoteData.total_price <= 0) {
      errors.push('Total amount must be calculated and greater than zero');
    }
    
    const deposit = (quoteData?.total_price || 0) * 0.5;
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
    
    if (!quoteData?.package_name) {
      errors.push('Service package must be selected');
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
  };

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
        const totalAmount = quoteData?.total_price || 0;
        const depositAmount = totalAmount * 0.5;
        
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
            if (totalPaid < depositAmount && totalPaid < totalAmount) {
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
        
        // Update local state with new data from API response
        if (result.data) {
          setLeadData(prev => ({
            ...prev,
            name: result.data.name || prev?.name,
            email: result.data.email || prev?.email,
            eventDate: result.data.eventDate || prev?.eventDate || prev?.event_date,
            event_date: result.data.eventDate || prev?.event_date || prev?.eventDate,
            eventTime: result.data.eventTime || prev?.eventTime,
            event_time: result.data.eventTime || prev?.event_time || prev?.eventTime,
            venueAddress: result.data.venueAddress || prev?.venueAddress,
            venue_address: result.data.venueAddress || prev?.venue_address || prev?.venueAddress,
            location: result.data.venueAddress || prev?.location
          }));
        } else {
          // Fallback: use formData if API doesn't return formatted data
          setLeadData(prev => ({
            ...prev,
            ...updateData,
            event_date: updateData.eventDate || prev?.event_date,
            event_time: updateData.eventTime || prev?.event_time,
            venue_address: updateData.venueAddress || prev?.venue_address,
            location: updateData.venueAddress || prev?.location
          }));
        }
        
        // Close the modal
        setShowFieldsModal(false);
        
        // Reset form data
        setFormData({
          name: '',
          email: '',
          eventDate: '',
          venueAddress: '',
          eventTime: '',
          endTime: ''
        });

        // Show success message
        alert('Information updated successfully! You can now sign the contract.');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update information');
      }
    } catch (error) {
      console.error('Error updating fields:', error);
      alert(error.message || 'Failed to update information. Please try again.');
    } finally {
      setUpdatingFields(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Contract | M10 DJ Company</title>
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

  const totalAmount = quoteData?.total_price || 0;
  const depositAmount = totalAmount * 0.5;
  const remainingBalance = totalAmount - depositAmount;
  const contractNumber = contractData?.contract_number || `CONT-${id.substring(0, 8).toUpperCase()}`;
  const isSigned = contractData?.status === 'signed' || contractData?.signed_at;

  const validationErrors = validateContractFields();
  const canSign = validationErrors.length === 0 && !isSigned;

  return (
    <>
      <Head>
        <title>Service Contract {contractNumber} | M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
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
                This Contract for Services (the &quot;Contract&quot;) is made effective as of <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> (the &quot;Effective Date&quot;), by and between <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong> (&quot;Client&quot;) and M10 DJ Company, (&quot;M10&quot;) of 65 Stewart Rd, Eads, Tennessee 38028 (collectively the &quot;Parties&quot;).
              </p>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                NOW, THEREFORE, FOR AND IN CONSIDERATION of the mutual promises and agreements contained herein, Client hires M10, and M10 agrees to provide Disc Jockey services (&quot;DJ&quot; services) to Client under the terms and conditions hereby agreed upon by the parties:
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. DESCRIPTION OF SERVICES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client hereby agrees to engage M10 to provide Client with DJ services (collectively, the &quot;Services&quot;) to be performed at the following event(s):
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Event Details:</p>
                {(leadData?.eventDate || leadData?.event_date) && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span><strong>Date:</strong> {new Date(leadData.eventDate || leadData.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                )}
                {(leadData?.eventTime || leadData?.event_time || leadData?.start_time) && (
                  <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span><strong>Start Time:</strong> {new Date(`2000-01-01T${leadData.eventTime || leadData.event_time || leadData.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    {(leadData?.endTime || leadData?.end_time) && (
                      <span> - <strong>End Time:</strong> {new Date(`2000-01-01T${leadData.endTime || leadData.end_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    )}
                  </p>
                )}
                {(leadData?.venue_address || leadData?.venueAddress || leadData?.location) && (
                  <>
                    {leadData?.venue_name && (
                      <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span><strong>Venue:</strong> {leadData.venue_name}</span>
                      </p>
                    )}
                    <p className="text-gray-700 dark:text-gray-300 flex items-start gap-2 mt-2">
                      <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span><strong>Venue Address:</strong> {leadData.venue_address || leadData.venueAddress || leadData.location}</span>
                    </p>
                  </>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Services shall consist primarily of providing musical entertainment by means of a recorded music format.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. PERFORMANCE OF SERVICES</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>a.</strong> M10 shall arrive at the event location one hour before the starting time to set-up and conduct sound check. M10&apos;s playlist shall have an unlimited playlist of songs from both latest and old classics. M10 shall incorporate guest&apos;s requests into the playlist unless otherwise directed by Client. Music shall be played without any breaks unless requested by Client. Time is of the essence. Requests for extended playing time beyond the agreed-upon hours of service shall be accommodated if feasible.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>b.</strong> M10 shall be familiar with indoor and outdoor set-up and sound mixing. M10 shall provide multi-color lighting for a ball room effect. M10 shall have high quality microphone and sound system.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. TERM</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Client and M10 agree that this Contract between the Parties is for Services that shall commence on the above date and complete on <strong>{(leadData?.eventDate || leadData?.event_date) ? new Date(leadData.eventDate || leadData.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the event date'}</strong>. The Contract may be extended and/or renewed by agreement of all Parties in writing thereafter.
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
                  <li>Deposit: ${depositAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due upon signing)</li>
                  <li>Remaining Balance: ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due 7 days before event)</li>
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
                This Agreement shall be signed on behalf of Client by <strong>{leadData?.name || (leadData?.first_name && leadData?.last_name ? `${leadData.first_name} ${leadData.last_name}`.trim() : leadData?.first_name || leadData?.last_name || 'Client')}</strong> and on behalf of M10 by Ben Murray, Manager and effective as of the date first above written.
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
                      By clicking &quot;Sign Contract&quot; below, you agree to the terms and conditions outlined in this contract.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    if (validationErrors.length > 0) {
                      setShowFieldsModal(true);
                    } else {
                      handleOpenSignatureModal();
                    }
                  }}
                  disabled={signing || updatingFields}
                  className={`w-full inline-flex items-center justify-center gap-2 ${
                    canSign
                      ? 'btn-primary'
                      : validationErrors.length > 0
                      ? 'btn-primary'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                      {validationErrors.length > 0 ? (
                        <>
                          <Edit className="w-5 h-5" />
                          Fill In Missing Information
                        </>
                      ) : (
                        <>
                          <PenTool className="w-5 h-5" />
                          Sign Contract
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Complete Required Information
                </h3>
                <button
                  onClick={() => setShowFieldsModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Please fill in the following required fields to proceed with signing the contract:
              </p>

              <div className="space-y-4">
                {!leadData?.name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                {!leadData?.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                )}

                {!leadData?.eventDate && !leadData?.event_date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                )}

                {(() => {
                  // Check if we need to show venue address field
                  const venueAddress = leadData?.venue_address || leadData?.venueAddress;
                  const location = leadData?.location;
                  const venueName = leadData?.venue_name;
                  
                  let needsVenueAddress = false;
                  if (!venueAddress) {
                    // No venue_address/venueAddress field exists
                    if (!location || location === venueName) {
                      // No location or location is same as venue name
                      needsVenueAddress = true;
                    } else {
                      // Check if location is actually an address or just a name
                      const locationTrimmed = location.trim();
                      const venueNameTrimmed = venueName?.trim() || '';
                      const hasAddressIndicators = /\d/.test(locationTrimmed) || 
                                                     /(street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|boulevard|blvd|circle|cir|court|ct)/i.test(locationTrimmed);
                      
                      // If location is same as venue name or doesn't look like an address, require venue address
                      if (locationTrimmed === venueNameTrimmed || (!hasAddressIndicators && locationTrimmed.length <= 30)) {
                        needsVenueAddress = true;
                      }
                    }
                  } else if (venueAddress === venueName) {
                    // Venue address exists but is same as venue name (not a real address)
                    needsVenueAddress = true;
                  }
                  
                  return needsVenueAddress ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Venue Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.venueAddress}
                        onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                        placeholder="Enter full venue address (street, city, state, zip)"
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Please provide the complete street address where the event will take place.
                        {leadData?.venue_name && (
                          <> Venue name: {leadData.venue_name}</>
                        )}
                      </p>
                    </div>
                  ) : null;
                })()}

                {!leadData?.event_time && !leadData?.eventTime && !leadData?.start_time && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.eventTime}
                      onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please enter the time your event starts
                    </p>
                  </div>
                )}

                {!leadData?.end_time && !leadData?.endTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand focus:border-transparent"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Please enter the time your event ends
                    </p>
                  </div>
                )}

                {(() => {
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
                  
                  if (hasName && hasEmail && hasDate && hasValidVenueAddress && hasStartTime && hasEndTime) {
                    return (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          All required fields are filled. You can now sign the contract.
                        </p>
                      </div>
                    );
                  }
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
                  disabled={updatingFields || (() => {
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
                  })()}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {updatingFields ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Save & Continue'
                  )}
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
                          ${(quoteData.total_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Required Deposit (50%):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${((quoteData.total_price || 0) * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          .no-print * {
            display: none !important;
          }
          
          /* Reset page styling */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Contract container styling */
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Contract document styling */
          .max-w-4xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0.75in !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Ensure text is black for printing */
          body, p, span, div, h1, h2, h3, h4, h5, h6, td, th, label {
            color: #000 !important;
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
