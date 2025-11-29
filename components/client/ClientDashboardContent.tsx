'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Receipt, 
  CreditCard, 
  Calendar, 
  Download,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Loader2,
  ExternalLink,
  Mail,
  Phone,
  Music,
  MessageSquare,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface Contract {
  id: string;
  contact_id: string;
  contract_number: string;
  status: string;
  event_name: string;
  event_date: string;
  total_amount: number;
  signed_at: string | null;
  signed_by_vendor_at: string | null;
  created_at: string;
}

interface Invoice {
  id: string;
  contact_id: string;
  invoice_number: string;
  invoice_status: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  invoice_date: string;
  due_date: string;
  created_at: string;
}

interface Payment {
  id: string;
  payment_name: string;
  payment_status: string;
  total_amount: number;
  transaction_date: string;
  payment_method: string;
  created_at: string;
}

interface DashboardData {
  contacts: any[];
  contracts: Contract[];
  invoices: Invoice[];
  payments: Payment[];
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    signedContracts: number;
    pendingContracts: number;
    totalContracts: number;
    totalInvoices: number;
    totalPayments: number;
  };
}

export default function ClientDashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'invoices' | 'payments' | 'timeline'>('overview');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      // Fetch dashboard data (API uses session for authentication)
      const response = await fetch(`/api/client/data`);
      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      } else if (response.status === 401) {
        // User not authenticated, redirect to sign in
        window.location.href = '/signin';
        return;
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32 mt-2" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
          </div>
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-48 mb-4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Unable to load dashboard data.</p>
        <button
          onClick={fetchUserAndData}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Invoiced</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(data.summary.totalInvoiced)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {formatCurrency(data.summary.totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(data.summary.totalOutstanding)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Signed Contracts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.summary.signedContracts}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'timeline', label: 'Event Timeline', icon: Calendar },
              { id: 'contracts', label: 'Contracts', icon: FileText },
              { id: 'invoices', label: 'Invoices', icon: Receipt },
              { id: 'payments', label: 'Payments', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-brand text-brand-800 dark:text-brand'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Upcoming Events */}
              {data.contacts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Events</h3>
                  <div className="space-y-4">
                    {data.contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {contact.first_name} {contact.last_name}
                            </h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              {contact.event_type && (
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {contact.event_type} - {contact.event_date ? formatDate(contact.event_date) : 'TBD'}
                                </p>
                              )}
                              {contact.venue_name && (
                                <p>{contact.venue_name}</p>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            contact.lead_status === 'Booked' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {contact.lead_status || 'New'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {data.contracts.slice(0, 3).map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-brand-800 dark:text-brand" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{contract.contract_number}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {contract.event_name || 'Service Contract'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        contract.status === 'signed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : contract.status === 'sent'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                  ))}
                  {data.contracts.length === 0 && (
                    <EmptyState
                      icon={FileText}
                      title="No contracts yet"
                      description="Contracts will appear here once they're created for your events."
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {data.contacts.length > 0 ? (
                data.contacts.map((contact) => {
                  const quoteUrl = `/quote/${contact.id}`;
                  const contractUrl = `/quote/${contact.id}/contract`;
                  const paymentUrl = `/quote/${contact.id}/payment`;
                  const musicUrl = `/quote/${contact.id}/music-questionnaire`;
                  
                  // Determine timeline status
                  const hasQuote = contact.quoted_price || contact.lead_status === 'Proposal Sent';
                  const hasPayment = contact.payment_status === 'paid' || contact.deposit_paid;
                  const hasContract = data.contracts.some(c => c.contact_id === contact.id && c.status === 'signed');
                  const hasMusicQuestionnaire = false; // TODO: Check if music questionnaire is completed
                  
                  const timelineSteps = [
                    {
                      id: 'quote',
                      label: 'Quote Generated',
                      description: 'Your personalized quote is ready',
                      status: hasQuote ? 'completed' : 'pending',
                      action: hasQuote ? 'View Quote' : null,
                      url: quoteUrl,
                      icon: FileText
                    },
                    {
                      id: 'package',
                      label: 'Package Selected',
                      description: 'Choose your perfect package',
                      status: hasQuote ? 'completed' : 'pending',
                      action: hasQuote ? 'View Quote' : 'Select Package',
                      url: quoteUrl,
                      icon: CheckCircle
                    },
                    {
                      id: 'payment',
                      label: 'Payment Made',
                      description: hasPayment ? 'Deposit or full payment received' : 'Secure your date with a deposit',
                      status: hasPayment ? 'completed' : 'pending',
                      action: hasPayment ? 'View Payment' : 'Make Payment',
                      url: paymentUrl,
                      icon: CreditCard
                    },
                    {
                      id: 'contract',
                      label: 'Contract Signed',
                      description: 'Review and sign your service agreement',
                      status: hasContract ? 'completed' : 'pending',
                      action: hasContract ? 'View Contract' : 'Sign Contract',
                      url: contractUrl,
                      icon: FileText
                    },
                    {
                      id: 'music',
                      label: 'Music Questionnaire',
                      description: 'Share your music preferences and special requests',
                      status: hasMusicQuestionnaire ? 'completed' : 'pending',
                      action: hasMusicQuestionnaire ? 'View Responses' : 'Complete Questionnaire',
                      url: musicUrl,
                      icon: Music
                    },
                    {
                      id: 'confirmed',
                      label: 'Event Confirmed',
                      description: 'All set! We\'ll see you on your special day',
                      status: hasPayment && hasContract ? 'completed' : 'pending',
                      action: null,
                      url: null,
                      icon: CheckCircle2
                    }
                  ];

                  return (
                    <div key={contact.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {contact.event_type || 'Event'} Timeline
                        </h3>
                        {contact.event_date && (
                          <p className="text-gray-600 dark:text-gray-400">
                            Event Date: <strong>{formatDate(contact.event_date)}</strong>
                            {contact.venue_name && ` • ${contact.venue_name}`}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

                        {/* Timeline steps */}
                        <div className="space-y-6">
                          {timelineSteps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = step.status === 'completed';
                            
                            return (
                              <div key={step.id} className="relative flex items-start gap-4">
                                {/* Icon */}
                                <div className={`
                                  relative z-10 flex items-center justify-center w-12 h-12 rounded-full
                                  ${isCompleted 
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                  }
                                `}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                  ) : (
                                    <Circle className="w-6 h-6" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pt-1">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className={`
                                        font-semibold mb-1
                                        ${isCompleted 
                                          ? 'text-gray-900 dark:text-white' 
                                          : 'text-gray-600 dark:text-gray-400'
                                        }
                                      `}>
                                        {step.label}
                                      </h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                        {step.description}
                                      </p>
                                      {step.action && step.url && (
                                        <Link
                                          href={step.url}
                                          className={`
                                            inline-flex items-center gap-2 text-sm font-medium
                                            ${isCompleted
                                              ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700'
                                              : 'text-brand-800 dark:text-brand hover:text-brand-700 dark:hover:text-brand-600'
                                            }
                                          `}
                                        >
                                          {step.action}
                                          <ExternalLink className="w-3 h-3" />
                                        </Link>
                                      )}
                                    </div>
                                    {isCompleted && (
                                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded text-xs font-medium">
                                        Complete
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {!hasPayment && (
                            <Link
                              href={paymentUrl}
                              className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <CreditCard className="w-5 h-5 text-brand-800 dark:text-brand" />
                              <span className="text-sm font-medium">Make Payment</span>
                            </Link>
                          )}
                          {!hasContract && (
                            <Link
                              href={contractUrl}
                              className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FileText className="w-5 h-5 text-brand-800 dark:text-brand" />
                              <span className="text-sm font-medium">Sign Contract</span>
                            </Link>
                          )}
                          {!hasMusicQuestionnaire && (
                            <Link
                              href={musicUrl}
                              className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Music className="w-5 h-5 text-brand-800 dark:text-brand" />
                              <span className="text-sm font-medium">Complete Music Questionnaire</span>
                            </Link>
                          )}
                          <Link
                            href={quoteUrl}
                            className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FileText className="w-5 h-5 text-brand-800 dark:text-brand" />
                            <span className="text-sm font-medium">View Quote</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No events found"
                  description="Your upcoming events will appear here once they're created."
                />
              )}
            </div>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              {data.contracts.length > 0 ? (
                data.contracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {contract.contract_number}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {contract.event_name || 'Service Contract'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contract.status === 'signed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : contract.status === 'sent' || contract.status === 'viewed'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {contract.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Event Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contract.event_date ? formatDate(contract.event_date) : 'TBD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(contract.total_amount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Client Signed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contract.signed_at ? formatDate(contract.signed_at) : 'Not signed'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Vendor Signed</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {contract.signed_by_vendor_at ? formatDate(contract.signed_by_vendor_at) : (
                            <span className="text-yellow-600 dark:text-yellow-400">Pending</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/quote/${contract.contact_id}/contract`}
                        className="btn-outline text-sm"
                      >
                        View Contract
                      </Link>
                      {contract.status === 'signed' && (
                        <button
                          onClick={() => window.print()}
                          className="btn-outline text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No contracts found"
                  description="Contracts will appear here once they're created and sent to you."
                />
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {data.invoices.length > 0 ? (
                data.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Due: {formatDate(invoice.due_date)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.invoice_status === 'Paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : invoice.invoice_status === 'Partial'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : invoice.invoice_status === 'Overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {invoice.invoice_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.total_amount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Amount Paid</p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(invoice.amount_paid || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Balance Due</p>
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          {formatCurrency(invoice.balance_due || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Invoice Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatDate(invoice.invoice_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/quote/${invoice.contact_id}/invoice`}
                        className="btn-outline text-sm"
                      >
                        View Invoice
                      </Link>
                      <button
                        onClick={() => window.print()}
                        className="btn-outline text-sm"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download PDF
                      </button>
                      {invoice.balance_due > 0 && (
                        <Link
                          href={`/quote/${invoice.contact_id}/payment`}
                          className="btn-primary text-sm"
                        >
                          Make Payment
                        </Link>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Receipt}
                  title="No invoices found"
                  description="Invoices will appear here once they're generated for your events."
                />
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {data.payments.length > 0 ? (
                data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {payment.payment_name || 'Payment'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {payment.transaction_date ? formatDate(payment.transaction_date) : 'Pending'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.payment_status === 'Paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : payment.payment_status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {payment.payment_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Amount</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(payment.total_amount || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Payment Method</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.payment_method || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Transaction Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.transaction_date ? formatDate(payment.transaction_date) : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No payment history found"
                  description="Your payment history will appear here once payments are processed."
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Need Help?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Have questions or need to make changes? We&apos;re here to help!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="tel:+19014102020"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-brand-gold rounded-lg mr-3">
              <Phone className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">(901) 410-2020</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Call Ben directly</p>
            </div>
          </a>

          <a
            href="mailto:info@m10djcompany.com"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="p-2 bg-brand-gold rounded-lg mr-3">
              <Mail className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">info@m10djcompany.com</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Send an email</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

