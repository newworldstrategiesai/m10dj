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
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Input from '@/components/ui/Input';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
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
      const { data, error } = await supabase
        .from('invoice_summary')
        .select('*')
        .order('invoice_date', { ascending: false });
      
      if (error) throw error;
      
      setInvoices(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
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

