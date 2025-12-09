/**
 * Individual Invoice Detail Page
 * View and manage a specific invoice
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft,
  Download,
  Mail,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getPackageLineItemsFromQuote, calculateQuoteTotals } from '@/utils/quote-calculations';

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title: string;
  invoice_date: string;
  due_date: string;
  issue_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  subtotal: number;
  tax_amount: number;
  contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  event_type: string;
  event_date: string;
  venue_name: string;
  project_id: string;
  project_name: string;
  payment_count: number;
  last_payment_date: string;
  days_overdue: number;
  notes: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  item_type: string;
  notes: string;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  notes: string;
}

interface QuoteData {
  id: string;
  package_id: string;
  package_name: string;
  package_price: number;
  total_price: number;
  addons: any[];
  custom_line_items: any[];
  custom_addons: any[];
  discount_type: string | null;
  discount_value: number | null;
  discount_note: string | null;
  show_line_item_prices: boolean;
  payment_terms_type: string | null;
  number_of_payments: number | null;
  payment_schedule: any[];
  due_date_type: string | null;
  deposit_due_date: string | null;
  remaining_balance_due_date: string | null;
  speaker_rental?: any;
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [paymentData, setPaymentData] = useState<{ totalPaid: number; payments: any[] } | null>(null);
  const [hasPayment, setHasPayment] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

      const fetchInvoiceDetails = useCallback(async () => {
        setLoading(true);
        try {
          console.log('🔍 Fetching invoice details for:', id);
          
          // Fetch invoice summary
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoice_summary')
            .select('*')
            .eq('id', id)
            .single();
          
          if (invoiceError) throw invoiceError;
          
          console.log('📄 Invoice data loaded:', {
            id: invoiceData.id,
            invoice_number: invoiceData.invoice_number,
            contact_id: invoiceData.contact_id,
            total_amount: invoiceData.total_amount,
            invoice_status: invoiceData.invoice_status
          });
          
          setInvoice(invoiceData);

          // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });
      
      if (lineItemsError) {
        console.warn('Error fetching invoice line items:', lineItemsError);
      }
      setLineItems(lineItemsData || []);
      console.log('📦 Invoice line items:', lineItemsData?.length || 0);

      // Fetch payments - use same API endpoint as quote page for consistency
      let paymentsData = [];
      let paymentData = null;
      let hasPayment = false;
      
      if (invoiceData && invoiceData.contact_id) {
        try {
          const timestamp = new Date().getTime();
          const paymentsResponse = await fetch(`/api/quote/${invoiceData.contact_id}/payments?_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (paymentsResponse.ok) {
            const paymentsResult = await paymentsResponse.json();
            if (paymentsResult.payments && paymentsResult.payments.length > 0) {
              // Filter for paid payments (same as quote page)
              const paidPayments = paymentsResult.payments.filter((p: any) => p.payment_status === 'Paid');
              if (paidPayments.length > 0) {
                hasPayment = true;
                const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.total_amount) || 0), 0);
                paymentData = { totalPaid, payments: paidPayments };
                paymentsData = paidPayments;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payments from API:', error);
          // Fallback to direct query
          const { data: fallbackPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', id)
            .order('payment_date', { ascending: false });
          
          if (paymentsError) {
            console.warn('Error fetching payments:', paymentsError);
          } else {
            paymentsData = fallbackPayments || [];
          }
        }
      }
      
      setPayments(paymentsData);
      setPaymentData(paymentData);
      setHasPayment(hasPayment);
      console.log('💳 Payments:', paymentsData?.length || 0, hasPayment ? '(has payment)' : '');

      // Fetch lead/contact data using the same API endpoint as the quote page
      // This ensures we get the accurate event date (same as quote page)
      if (invoiceData && invoiceData.contact_id) {
        try {
          const timestamp = new Date().getTime();
          const leadResponse = await fetch(`/api/leads/get-lead?id=${invoiceData.contact_id}&_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (leadResponse.ok) {
            const lead = await leadResponse.json();
            console.log('✅ Loaded lead data:', {
              id: lead.id,
              eventDate: lead.eventDate || lead.event_date,
              eventType: lead.eventType || lead.event_type
            });
            setLeadData(lead);
          }
        } catch (error) {
          console.warn('Error fetching lead data:', error);
        }
      }

      // Fetch quote_selections data using the same API endpoint as the quote page
      // This ensures consistency and handles all the same parsing logic
      let quoteData = null;
      
      if (invoiceData && invoiceData.contact_id) {
        console.log('🔍 Fetching quote data for contact_id:', invoiceData.contact_id);
        try {
          const timestamp = new Date().getTime();
          const quoteResponse = await fetch(`/api/quote/${invoiceData.contact_id}?_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (quoteResponse.ok) {
            const quote = await quoteResponse.json();
            console.log('✅ Loaded quote data from API:', {
              id: quote.id,
              package_id: quote.package_id,
              total_price: quote.total_price,
              discount_type: quote.discount_type,
              discount_value: quote.discount_value
            });
            
            // Parse speaker_rental if it's a JSON string (same as quote page)
            if (quote.speaker_rental && typeof quote.speaker_rental === 'string') {
              try {
                quote.speaker_rental = JSON.parse(quote.speaker_rental);
              } catch (e) {
                console.error('Error parsing speaker_rental:', e);
              }
            }
            
            quoteData = quote;
            
            // If quote doesn't have invoice_id set, update it
            if (!quote.invoice_id) {
              console.log('🔗 Linking quote to invoice...');
              await supabase
                .from('quote_selections')
                .update({ invoice_id: id })
                .eq('id', quote.id);
            }
          } else {
            const errorData = await quoteResponse.json().catch(() => ({}));
            console.warn('⚠️ Failed to fetch quote from API:', quoteResponse.status, errorData);
          }
        } catch (error) {
          console.error('Error fetching quote from API:', error);
        }
      } else {
        console.warn('⚠️ Cannot fetch quote: invoice data or contact_id missing');
      }
      
      if (quoteData) {
        // Parse JSON fields if they're strings (API might return them as strings)
        const parseJsonField = (field: any) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch (e) {
              // If parsing fails, return as-is (might already be an object)
              return field;
            }
          }
          return field;
        };
        
        const parsedQuoteData = {
          ...quoteData,
          custom_line_items: parseJsonField(quoteData.custom_line_items),
          custom_addons: parseJsonField(quoteData.custom_addons),
          addons: parseJsonField(quoteData.addons),
          payment_schedule: parseJsonField(quoteData.payment_schedule)
        };
        
        console.log('📋 Parsed quote data:', {
          package_id: parsedQuoteData.package_id,
          package_name: parsedQuoteData.package_name,
          total_price: parsedQuoteData.total_price,
          package_price: parsedQuoteData.package_price,
          custom_line_items_count: Array.isArray(parsedQuoteData.custom_line_items) ? parsedQuoteData.custom_line_items.length : 0,
          addons_count: Array.isArray(parsedQuoteData.addons) ? parsedQuoteData.addons.length : 0,
          custom_addons_count: Array.isArray(parsedQuoteData.custom_addons) ? parsedQuoteData.custom_addons.length : 0,
          discount_type: parsedQuoteData.discount_type,
          discount_value: parsedQuoteData.discount_value,
          speaker_rental: parsedQuoteData.speaker_rental ? 'present' : 'none'
        });
        
        setQuoteData(parsedQuoteData);
      } else {
        console.warn('⚠️ No quote data found for invoice:', id);
        setQuoteData(null);
      }

    } catch (error) {
      console.error('Error fetching invoice details:', error);
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id, fetchInvoiceDetails]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-5 w-5" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5" />;
      case 'partial':
      case 'sent':
      case 'viewed':
        return <Clock className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!invoice || !invoice.contact_id) {
      console.error('Invoice or contact_id is missing');
      return;
    }

    setDownloading(true);
    try {
      // Use the same API endpoint as quote page - it uses contact_id (lead_id)
      const response = await fetch(`/api/quote/${invoice.contact_id}/generate-invoice-pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType);
        throw new Error('Server returned invalid PDF format');
      }

      // Create blob and download
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create a more descriptive filename (same logic as quote page)
      const firstName = invoice.first_name?.trim() || '';
      const lastName = invoice.last_name?.trim() || '';
      const eventDate = invoice.event_date ? 
        new Date(invoice.event_date).toISOString().split('T')[0] : '';
      const eventType = invoice.event_type?.toLowerCase()?.replace(/_/g, '-') || '';
      const invoiceNumber = invoice.invoice_number;
      
      let filename = 'Invoice';
      
      // Build filename with available data
      if (firstName && lastName) {
        filename = `Invoice-${firstName}-${lastName}`;
      } else if (firstName) {
        filename = `Invoice-${firstName}`;
      } else if (lastName) {
        filename = `Invoice-${lastName}`;
      } else if (invoiceNumber) {
        filename = `Invoice-${invoiceNumber}`;
      } else if (invoice.id) {
        filename = `Invoice-${invoice.id.substring(0, 8).toUpperCase()}`;
      }
      
      // Add event type if available
      if (eventType) {
        filename += `-${eventType}`;
      }
      
      // Add event date if available
      if (eventDate) {
        filename += `-${eventDate}`;
      }
      
      a.download = `${filename}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="slim"
            onClick={() => router.push('/admin/invoices')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="slim" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="slim" 
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download className={`h-4 w-4 mr-2 ${downloading ? 'animate-spin' : ''}`} />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button variant="slim">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            {invoice.contact_id && (
              <Link href={`/quote/${invoice.contact_id}/invoice`}>
                <Button variant="slim">
                  <FileText className="h-4 w-4 mr-2" />
                  View Quote Page
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Invoice Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{invoice.invoice_number}</h1>
              <p className="text-lg text-gray-600">{invoice.invoice_title}</p>
            </div>
            <Badge className={`${getStatusColor(invoice.invoice_status)} border flex items-center gap-2 text-base px-4 py-2`}>
              {getStatusIcon(invoice.invoice_status)}
              {invoice.invoice_status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <Link 
                      href={`/admin/contacts/${invoice.contact_id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-block"
                    >
                      {invoice.first_name} {invoice.last_name}
                    </Link>
                    <p className="text-sm text-gray-600">{invoice.email_address}</p>
                    {invoice.phone && <p className="text-sm text-gray-600">{invoice.phone}</p>}
                  </div>
                </div>
                {invoice.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p>{invoice.address}</p>
                      {invoice.city && invoice.state && (
                        <p>{invoice.city}, {invoice.state}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
                {(leadData?.eventDate || leadData?.event_date || invoice.event_date) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(leadData?.eventDate || leadData?.event_date || invoice.event_date)}
                    </span>
                  </div>
                )}
                {invoice.venue_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium text-gray-900">{invoice.venue_name}</span>
                  </div>
                )}
                {invoice.project_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <Link 
                      href={`/admin/contacts/${invoice.contact_id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {invoice.project_name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {invoice.days_overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">This invoice is overdue</p>
                <p className="text-sm text-red-700">Payment was due {invoice.days_overdue} days ago on {formatDate(invoice.due_date)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Description</th>
                  <th className="text-center py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Qty</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Use quote data as source of truth (same as quote page)
                  const packageLineItems = quoteData ? getPackageLineItemsFromQuote(quoteData) : [];
                  const showPrices = quoteData?.show_line_item_prices !== false;
                  
                  // Parse speaker_rental if present
                  let speakerRental: any = null;
                  if (quoteData?.speaker_rental) {
                    speakerRental = typeof quoteData.speaker_rental === 'string' 
                      ? JSON.parse(quoteData.speaker_rental) 
                      : quoteData.speaker_rental;
                  }
                  
                  // Show speaker rental first if present
                  const hasItems = packageLineItems.length > 0 || speakerRental;
                  
                  if (!hasItems && lineItems.length > 0) {
                    // Fallback to invoice line items if no quote data
                    return lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                        </td>
                        <td className="py-4 px-6 text-center text-gray-700">{item.quantity || 1}</td>
                        <td className="py-4 px-6 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">{formatCurrency(item.total_amount)}</td>
                      </tr>
                    ));
                  }
                  
                  if (!hasItems) {
                    return (
                      <tr>
                        <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                          No line items found
                        </td>
                      </tr>
                    );
                  }
                  
                  return (
                    <>
                      {/* Speaker Rental (if present) */}
                      {speakerRental && speakerRental.price && (
                        <tr>
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">Speaker Rental</p>
                            {speakerRental.description && (
                              <p className="text-sm text-gray-600 mt-1">{speakerRental.description}</p>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-700">1</td>
                          <td className="py-4 px-6 text-right text-gray-700">
                            {showPrices ? formatCurrency(speakerRental.price) : '—'}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-gray-900">
                            {showPrices ? formatCurrency(speakerRental.price) : '—'}
                          </td>
                        </tr>
                      )}
                      
                      {/* Package Line Items */}
                      {packageLineItems.map((item, index) => (
                        <tr key={`quote-item-${index}`}>
                          <td className="py-4 px-6">
                            <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                            {item.description && item.description !== item.item && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center text-gray-700">1</td>
                          <td className="py-4 px-6 text-right text-gray-700">
                            {showPrices && item.price ? formatCurrency(item.price) : '—'}
                          </td>
                          <td className="py-4 px-6 text-right font-semibold text-gray-900">
                            {showPrices && item.price ? formatCurrency(item.price) : '—'}
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="max-w-sm ml-auto space-y-2">
              {(() => {
                // Calculate totals from quote data (same as quote page)
                // Always use quote totals if quoteData exists, as it's the source of truth
                const quoteTotals = calculateQuoteTotals(quoteData);
                const useQuoteTotals = !!quoteData; // Use quote totals if quote data exists
                
                // Use quote totals if available, otherwise use invoice totals
                // Match quote page calculation exactly: total = subtotal - discountAmount (no tax added)
                const subtotal = useQuoteTotals ? quoteTotals.subtotal : (invoice.subtotal || 0);
                const discountAmount = useQuoteTotals ? quoteTotals.discountAmount : 0;
                // For total, use calculated total from quoteTotals (subtotal - discount)
                // Quote page: total = subtotal - discountAmount (line 918)
                // Only use quoteData.total_price if it's explicitly set AND matches the calculated total
                // Otherwise always use calculated total to ensure discount is applied
                const calculatedTotal = useQuoteTotals 
                  ? quoteTotals.total  // Always use calculated total (subtotal - discount)
                  : (invoice.total_amount || 0);
                const taxAmount = invoice.tax_amount || 0;
                // Match quote page: total = subtotal - discountAmount (tax is shown separately if > 0)
                const total = calculatedTotal; // Don't add tax - match quote page exactly
                // Use paymentData.totalPaid if available (from quote API), otherwise use invoice.amount_paid
                const amountPaid = paymentData?.totalPaid || invoice.amount_paid || 0;
                const balanceDue = total - amountPaid;
                const isFullyPaid = amountPaid >= total;
                const isPartiallyPaid = amountPaid > 0 && amountPaid < total;
                
                console.log('💰 Totals calculation:', {
                  useQuoteTotals,
                  quoteSubtotal: quoteTotals.subtotal,
                  quoteDiscount: quoteTotals.discountAmount,
                  quoteTotal: quoteTotals.total,
                  quoteTotalPrice: quoteData?.total_price,
                  calculatedTotal,
                  taxAmount,
                  total,
                  amountPaid,
                  balanceDue
                });
                
                return (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Discount:</span>
                        <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Tax:</span>
                        <span className="font-medium">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {hasPayment && (
                      <>
                        <div className="flex justify-between text-green-600 font-semibold pt-2 border-t border-gray-300">
                          <span>Amount Paid:</span>
                          <span>{formatCurrency(amountPaid)}</span>
                        </div>
                        
                        {/* Payment History - Show individual payments (same as quote page) */}
                        {paymentData?.payments && paymentData.payments.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-sm text-blue-900 mb-2">
                              Payment History
                            </h4>
                            <div className="space-y-2">
                              {paymentData.payments.map((payment: any, idx: number) => {
                                const paymentDate = payment.transaction_date 
                                  ? new Date(payment.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                  : payment.created_at 
                                    ? new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                    : 'Date not available';
                                
                                // Determine if this is a retainer/deposit payment
                                const isRetainer = payment.payment_type === 'Deposit' || 
                                                  payment.payment_type === 'Retainer' ||
                                                  payment.description?.toLowerCase().includes('deposit') ||
                                                  payment.description?.toLowerCase().includes('retainer') ||
                                                  (idx === 0 && paymentData.payments.length > 1);
                                
                                return (
                                  <div key={payment.id || idx} className="flex items-center justify-between py-2 border-b border-blue-200 last:border-b-0">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-blue-900">
                                          {isRetainer ? '✓ Retainer Paid' : '✓ Payment Received'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-blue-700 mt-0.5">
                                        {paymentDate}
                                        {payment.description && ` • ${payment.description}`}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-900">
                                      {formatCurrency(parseFloat(payment.total_amount) || 0)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {isFullyPaid && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="font-semibold text-sm">Invoice Paid in Full</span>
                            </div>
                          </div>
                        )}
                        {isPartiallyPaid && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 mb-1">
                              <span className="font-semibold text-sm">Partially Paid</span>
                            </div>
                            <p className="text-xs text-yellow-700">
                              {formatCurrency(balanceDue)} remaining
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold text-orange-600 pt-2 border-t border-gray-300">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quote Details Section */}
        {quoteData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Package Information */}
              {quoteData.package_id && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Package</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{quoteData.package_name || quoteData.package_id}</p>
                    {quoteData.package_price && (
                      <p className="text-sm text-gray-600 mt-1">Package Price: {formatCurrency(quoteData.package_price)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Line Items from Quote */}
              {quoteData.custom_line_items && Array.isArray(quoteData.custom_line_items) && quoteData.custom_line_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Package Line Items</h3>
                  <div className="space-y-2">
                    {quoteData.custom_line_items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                            {item.description && item.description !== item.item && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          {quoteData.show_line_item_prices !== false && item.price && (
                            <span className="font-semibold text-gray-900 ml-4">{formatCurrency(item.price)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker Rental */}
              {quoteData.speaker_rental && (() => {
                const speakerRental = typeof quoteData.speaker_rental === 'string' 
                  ? JSON.parse(quoteData.speaker_rental) 
                  : quoteData.speaker_rental;
                if (speakerRental && speakerRental.price) {
                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Speaker Rental</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{speakerRental.name || 'Speaker Rental'}</p>
                            {speakerRental.description && (
                              <p className="text-sm text-gray-600 mt-1">{speakerRental.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 ml-4">{formatCurrency(speakerRental.price)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Add-ons */}
              {(quoteData.addons || quoteData.custom_addons) && 
               ((Array.isArray(quoteData.addons) && quoteData.addons.length > 0) || 
                (Array.isArray(quoteData.custom_addons) && quoteData.custom_addons.length > 0)) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Add-ons</h3>
                  <div className="space-y-2">
                    {(quoteData.custom_addons || quoteData.addons || []).map((addon: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{addon.name || addon.item || 'Add-on'}</p>
                            {addon.description && (
                              <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                            )}
                          </div>
                          {addon.price && (
                            <span className="font-semibold text-gray-900 ml-4">{formatCurrency(addon.price)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount */}
              {quoteData.discount_type && quoteData.discount_value && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Discount</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {quoteData.discount_type === 'percentage' 
                            ? `${quoteData.discount_value}% Discount`
                            : `${formatCurrency(quoteData.discount_value)} Discount`}
                        </p>
                        {quoteData.discount_note && (
                          <p className="text-sm text-gray-600 mt-1">{quoteData.discount_note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              {quoteData.payment_terms_type && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment Terms</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {quoteData.payment_terms_type === 'set_number' && quoteData.number_of_payments && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">
                          {quoteData.number_of_payments} Payment{quoteData.number_of_payments > 1 ? 's' : ''}
                        </p>
                        {quoteData.payment_schedule && Array.isArray(quoteData.payment_schedule) && quoteData.payment_schedule.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {quoteData.payment_schedule.map((payment: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Payment {index + 1} {payment.dueDate ? `(${formatDate(payment.dueDate)})` : ''}
                                </span>
                                <span className="font-medium text-gray-900">{formatCurrency(payment.amount || 0)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {quoteData.payment_terms_type === 'client_selects' && (
                      <p className="font-medium text-gray-900">Client selects payment schedule</p>
                    )}
                    {quoteData.deposit_due_date && (
                      <p className="text-sm text-gray-600 mt-2">Deposit Due: {formatDate(quoteData.deposit_due_date)}</p>
                    )}
                    {quoteData.remaining_balance_due_date && (
                      <p className="text-sm text-gray-600 mt-1">Balance Due: {formatDate(quoteData.remaining_balance_due_date)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Due Date Type */}
              {quoteData.due_date_type && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Due Date</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {quoteData.due_date_type === 'upon_receipt' && 'Due Upon Receipt'}
                      {quoteData.due_date_type === 'day_of_event' && 'Due on Event Date'}
                      {quoteData.due_date_type === '7_days_before' && 'Due 7 Days Before Event'}
                      {!['upon_receipt', 'day_of_event', '7_days_before'].includes(quoteData.due_date_type) && quoteData.due_date_type}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.payment_date)} • {payment.payment_method}
                        </p>
                        {payment.transaction_id && (
                          <p className="text-xs text-gray-500 mt-1">Transaction: {payment.transaction_id}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {payment.payment_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

