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
  const [downloading, setDownloading] = useState(false);

  const fetchInvoiceDetails = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch invoice summary
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('id', id)
        .single();
      
      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });
      
      if (lineItemsError) throw lineItemsError;
      setLineItems(lineItemsData || []);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('invoice_id', id)
        .order('payment_date', { ascending: false });
      
      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch quote_selections data linked to this invoice
      const { data: quoteData, error: quoteError } = await supabase
        .from('quote_selections')
        .select('*')
        .eq('invoice_id', id)
        .maybeSingle();
      
      if (quoteError && quoteError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error fetching quote data:', quoteError);
      } else if (quoteData) {
        setQuoteData(quoteData);
        console.log('✅ Loaded quote data:', quoteData);
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

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    setDownloading(true);
    try {
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
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
                    <p className="font-semibold text-gray-900">
                      {invoice.first_name} {invoice.last_name}
                    </p>
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
                {invoice.event_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Date:</span>
                    <span className="font-medium text-gray-900">{formatDate(invoice.event_date)}</span>
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
                {/* Show invoice line items if available, otherwise show quote line items */}
                {lineItems.length > 0 ? (
                  lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{item.description}</p>
                        {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">{item.quantity || 1}</td>
                      <td className="py-4 px-6 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">{formatCurrency(item.total_amount)}</td>
                    </tr>
                  ))
                ) : quoteData?.custom_line_items && Array.isArray(quoteData.custom_line_items) && quoteData.custom_line_items.length > 0 ? (
                  quoteData.custom_line_items.map((item: any, index: number) => (
                    <tr key={`quote-item-${index}`}>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                        {item.description && item.description !== item.item && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">1</td>
                      <td className="py-4 px-6 text-right text-gray-700">
                        {quoteData.show_line_item_prices !== false && item.price ? formatCurrency(item.price) : '—'}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">
                        {quoteData.show_line_item_prices !== false && item.price ? formatCurrency(item.price) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                      No line items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-green-600 font-semibold">
                <span>Paid:</span>
                <span>{formatCurrency(invoice.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-orange-600 pt-2 border-t border-gray-300">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.balance_due)}</span>
              </div>
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

