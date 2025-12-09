/**
 * Admin Invoices Dashboard
 * Comprehensive view of all invoices with filtering, stats, and management
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  FileText,
  DollarSign,
  Filter,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  User,
  Download,
  Mail,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { calculateQuoteTotals } from '@/utils/quote-calculations';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  subtotal?: number;
  amount_paid: number;
  balance_due: number;
  contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone: string;
  event_type: string;
  event_date: string;
  project_id: string;
  project_name: string;
  payment_count: number;
  last_payment_date: string;
  days_overdue: number;
}

interface DashboardStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  paidCount: number;
  overdueCount: number;
  pendingCount: number;
}

export default function InvoicesDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    paidCount: 0,
    overdueCount: 0,
    pendingCount: 0
  });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchQuery, statusFilter, dateFilter]);

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/signin');
      return;
    }
    setUser(user);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      // Get user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      console.log('👤 User ID:', user.id);

      // Get user's organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();
      
      console.log('🏢 Organization:', org);

      // Check if invoices exist at all (bypass RLS check)
      try {
        const checkResponse = await fetch('/api/admin/check-invoices');
        const checkData = await checkResponse.json();
        console.log('📊 Invoice check:', checkData);
      } catch (checkError) {
        console.warn('Could not check invoices:', checkError);
      }

      if (!org) {
        console.warn('No organization found for user');
        setInvoices([]);
        calculateStats([]);
        setLoading(false);
        return;
      }

      console.log(`🔍 Fetching invoices for organization: ${org.id}`);
      
      // First, try to fetch invoices filtered by organization
      let { data, error } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('organization_id', org.id)
        .order('invoice_date', { ascending: false });
      
      console.log(`📊 Query result:`, { dataCount: data?.length || 0, error: error?.message });
      
      if (error) {
        console.error('Error fetching invoices:', error);
        // If the view doesn't have organization_id yet, try without filter
        if (error.message?.includes('organization_id')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('invoice_summary')
            .select('*')
            .order('invoice_date', { ascending: false });
          
          if (fallbackError) throw fallbackError;
          
          console.log(`📊 Fallback query found ${fallbackData?.length || 0} invoices`);
          // Filter client-side by organization_id if available
          const filtered = (fallbackData || []).filter(inv => 
            !inv.organization_id || inv.organization_id === org.id
          );
          console.log(`✅ Filtered to ${filtered.length} invoices`);
          await enrichInvoicesWithQuoteData(filtered, supabase);
        } else {
          throw error;
        }
      } else {
        // If no invoices found, also check for invoices without organization_id
        // (they may need backfilling, but we'll show them temporarily)
        if (!data || data.length === 0) {
          console.log('⚠️ No invoices found with organization_id filter, checking for all invoices...');
          
          // Fetch ALL invoices to see what exists
          const { data: allInvoices, error: allError } = await supabase
            .from('invoice_summary')
            .select('*')
            .order('invoice_date', { ascending: false });
          
          console.log(`📊 All invoices query:`, { 
            count: allInvoices?.length || 0, 
            error: allError?.message,
            sample: allInvoices?.slice(0, 2).map(inv => ({ 
              id: inv.id, 
              invoice_number: inv.invoice_number,
              organization_id: inv.organization_id,
              contact_id: inv.contact_id
            }))
          });
          
          if (allInvoices && allInvoices.length > 0) {
            console.log(`Found ${allInvoices.length} total invoices`);
            // Show invoices that either match organization_id OR don't have one yet (need backfilling)
            const filtered = allInvoices.filter(inv => 
              !inv.organization_id || inv.organization_id === org.id
            );
            console.log(`✅ Showing ${filtered.length} invoices (${filtered.filter(inv => !inv.organization_id).length} need organization_id backfill)`);
            console.log(`📋 Invoice details:`, filtered.map(inv => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              organization_id: inv.organization_id,
              contact_id: inv.contact_id
            })));
            await enrichInvoicesWithQuoteData(filtered, supabase);
          } else {
            console.log('❌ No invoices found in invoice_summary view, checking invoices table directly...');
            
            // Try querying invoices table directly (bypassing view)
            const { data: directInvoices, error: directError } = await supabase
              .from('invoices')
              .select('*, contacts:contact_id(id, organization_id, first_name, last_name, email_address, phone, event_type, event_date)')
              .order('invoice_date', { ascending: false });
            
            console.log(`📊 Direct invoices query:`, { 
              count: directInvoices?.length || 0, 
              error: directError?.message 
            });
            
            if (directInvoices && directInvoices.length > 0) {
              // Filter by organization_id from invoice or contact
              const filtered = directInvoices.filter(inv => {
                const invOrgId = inv.organization_id || inv.contacts?.organization_id;
                return !invOrgId || invOrgId === org.id;
              });
              
              // Transform to match invoice_summary format
              const transformed = filtered.map(inv => ({
                ...inv,
                first_name: inv.contacts?.first_name,
                last_name: inv.contacts?.last_name,
                email_address: inv.contacts?.email_address,
                phone: inv.contacts?.phone,
                event_type: inv.contacts?.event_type,
                event_date: inv.contacts?.event_date,
                payment_count: 0,
                last_payment_date: null,
                days_overdue: inv.due_date && new Date(inv.due_date) < new Date() && inv.invoice_status !== 'Paid' && inv.invoice_status !== 'Cancelled'
                  ? Math.floor((new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
                  : 0
              }));
              
              console.log(`✅ Found ${transformed.length} invoices in invoices table`);
              await enrichInvoicesWithQuoteData(transformed, supabase);
            } else {
              console.log('❌ No invoices found in database at all');
              setInvoices([]);
              calculateStats([]);
              return;
            }
          }
        } else {
          console.log(`✅ Loaded ${data.length} invoices for organization ${org.id}`);
          console.log(`📋 Invoice details:`, data.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            organization_id: inv.organization_id
          })));
          
          // Fetch quote data for all invoices to get accurate totals
          await enrichInvoicesWithQuoteData(data, supabase);
        }
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const enrichInvoicesWithQuoteData = async (invoices: Invoice[], supabase: any) => {
    try {
      // Get all contact_ids and invoice_ids from invoices
      const contactIds = invoices.map(inv => inv.contact_id).filter(Boolean);
      const invoiceIds = invoices.map(inv => inv.id).filter(Boolean);
      
      if (contactIds.length === 0) {
        setInvoices(invoices);
        calculateStats(invoices);
        return;
      }
      
      console.log(`🔍 Fetching quote data for ${contactIds.length} invoices...`);
      
      // Fetch all quote_selections for these contacts in one query
      const { data: quotes, error: quotesError } = await supabase
        .from('quote_selections')
        .select('lead_id, total_price, package_price, discount_type, discount_value, addons, custom_addons, speaker_rental')
        .in('lead_id', contactIds);
      
      if (quotesError) {
        console.warn('Error fetching quotes:', quotesError);
      }
      
      // Fetch all payments for these invoices to get accurate amount_paid
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('invoice_id, total_amount, payment_status')
        .in('invoice_id', invoiceIds)
        .eq('payment_status', 'Paid');
      
      if (paymentsError) {
        console.warn('Error fetching payments:', paymentsError);
      }
      
      // Create a map of contact_id -> quote data
      const quoteMap = new Map();
      quotes?.forEach((quote: any) => {
        // Parse JSON fields
        const parseJsonField = (field: any) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch (e) {
              return field;
            }
          }
          return field;
        };
        
        quoteMap.set(quote.lead_id, {
          ...quote,
          addons: parseJsonField(quote.addons),
          custom_addons: parseJsonField(quote.custom_addons),
          speaker_rental: parseJsonField(quote.speaker_rental)
        });
      });
      
      // Create a map of invoice_id -> total amount paid
      const paymentMap = new Map<string, number>();
      payments?.forEach((payment: any) => {
        const currentTotal = paymentMap.get(payment.invoice_id) || 0;
        paymentMap.set(payment.invoice_id, currentTotal + (parseFloat(payment.total_amount) || 0));
      });
      
      // Enrich invoices with accurate totals from quote data and payments
      const enrichedInvoices = invoices.map(invoice => {
        const quote = quoteMap.get(invoice.contact_id);
        const accurateAmountPaid = paymentMap.get(invoice.id) || invoice.amount_paid || 0;
        
        if (quote) {
          // Calculate accurate totals from quote data (includes discount)
          const quoteTotals = calculateQuoteTotals(quote);
          
          // Always use calculated total (subtotal - discount) to ensure discount is applied
          // This matches the detail page logic exactly
          const accurateTotal = quoteTotals.total; // This is subtotal - discountAmount
          const accurateBalanceDue = accurateTotal - accurateAmountPaid;
          
          console.log(`💰 Invoice ${invoice.invoice_number}:`, {
            subtotal: quoteTotals.subtotal,
            discount: quoteTotals.discountAmount,
            total: accurateTotal,
            amount_paid: accurateAmountPaid,
            balance_due: accurateBalanceDue,
            original_total: invoice.total_amount,
            original_amount_paid: invoice.amount_paid
          });
          
          // Update invoice with accurate totals and payments
          return {
            ...invoice,
            total_amount: accurateTotal,
            subtotal: quoteTotals.subtotal,
            amount_paid: accurateAmountPaid,
            balance_due: accurateBalanceDue
          };
        }
        
        // If no quote found, still update amount_paid from payments if available
        if (accurateAmountPaid !== (invoice.amount_paid || 0)) {
          return {
            ...invoice,
            amount_paid: accurateAmountPaid,
            balance_due: (invoice.total_amount || 0) - accurateAmountPaid
          };
        }
        
        // If no quote found and no payment updates, use invoice data as-is
        return invoice;
      });
      
      console.log(`✅ Enriched ${enrichedInvoices.length} invoices with quote data and payments`);
      setInvoices(enrichedInvoices);
      calculateStats(enrichedInvoices);
    } catch (error) {
      console.error('Error enriching invoices with quote data:', error);
      // Fallback to original invoices if enrichment fails
      setInvoices(invoices);
      calculateStats(invoices);
    }
  };

  const calculateStats = (invoicesData: Invoice[]) => {
    const totalInvoiced = invoicesData.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalPaid = invoicesData.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
    const totalOutstanding = invoicesData.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
    const paidCount = invoicesData.filter(inv => inv.invoice_status === 'Paid').length;
    const overdueCount = invoicesData.filter(inv => inv.invoice_status === 'Overdue').length;
    const pendingCount = invoicesData.filter(inv => 
      inv.invoice_status === 'Sent' || inv.invoice_status === 'Viewed' || inv.invoice_status === 'Partial'
    ).length;
    
    setStats({
      totalInvoices: invoicesData.length,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      paidCount,
      overdueCount,
      pendingCount
    });
  };

  const applyFilters = () => {
    let filtered = [...invoices];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.invoice_title?.toLowerCase().includes(query) ||
        inv.first_name?.toLowerCase().includes(query) ||
        inv.last_name?.toLowerCase().includes(query) ||
        inv.email_address?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'outstanding') {
        filtered = filtered.filter(inv => inv.balance_due > 0);
      } else {
        filtered = filtered.filter(inv => inv.invoice_status === statusFilter);
      }
    }
    
    // Date filter
    const now = new Date();
    if (dateFilter === 'overdue') {
      filtered = filtered.filter(inv => inv.days_overdue > 0);
    } else if (dateFilter === 'due-soon') {
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(inv => {
        const dueDate = new Date(inv.due_date);
        return dueDate >= now && dueDate <= nextWeek && inv.balance_due > 0;
      });
    } else if (dateFilter === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter(inv => {
        const invoiceDate = new Date(inv.invoice_date);
        return invoiceDate >= startOfMonth && invoiceDate <= endOfMonth;
      });
    }
    
    setFilteredInvoices(filtered);
  };

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
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'partial':
      case 'sent':
      case 'viewed':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoices Dashboard</h1>
            <p className="text-gray-600">Manage all your invoices and billing</p>
          </div>
          <Button
            onClick={() => router.push('/admin/invoices/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8" />
              <TrendingUp className="h-5 w-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Invoiced</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.totalInvoiced)}</p>
            <p className="text-sm opacity-75">{stats.totalInvoices} invoices</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8" />
              <CheckCircle className="h-5 w-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Collected</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-sm opacity-75">{stats.paidCount} paid invoices</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Outstanding</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(stats.totalOutstanding)}</p>
            <p className="text-sm opacity-75">{stats.overdueCount} overdue</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Pending Payment</h3>
            <p className="text-3xl font-bold mb-1">{stats.pendingCount}</p>
            <p className="text-sm opacity-75">Awaiting payment</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="outstanding">Outstanding Balance</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Partial">Partial Payment</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due-soon">Due This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredInvoices.length}</span> of{' '}
              <span className="font-semibold">{invoices.length}</span> invoices
            </p>
            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }}
                variant="slim"
                className="text-sm"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
          </div>
          
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first invoice'}
              </p>
              <Button onClick={() => router.push('/admin/invoices/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Invoice</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Client</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Amount</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Paid</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Balance</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Due Date</th>
                    <th className="text-center py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">{invoice.invoice_title}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.first_name} {invoice.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{invoice.email_address}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge className={`${getStatusColor(invoice.invoice_status)} border flex items-center gap-1 w-fit`}>
                          {getStatusIcon(invoice.invoice_status)}
                          {invoice.invoice_status}
                        </Badge>
                        {invoice.days_overdue > 0 && (
                          <p className="text-xs text-red-600 mt-1">{invoice.days_overdue} days overdue</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="py-4 px-6 text-right text-green-600 font-medium">
                        {formatCurrency(invoice.amount_paid)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className={`font-semibold ${invoice.balance_due > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {formatCurrency(invoice.balance_due)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(invoice.due_date)}
                        </div>
                        {invoice.invoice_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Issued: {formatDate(invoice.invoice_date)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="slim"
                            
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/invoices/${invoice.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

