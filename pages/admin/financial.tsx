/**
 * Financial Dashboard
 * Comprehensive view of business finances, revenue, and payment analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Calendar,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthlyRevenue {
  month: string;
  transaction_count: number;
  gross_revenue: number;
  sales_tax_collected: number;
  tips_collected: number;
  total_fees: number;
  net_revenue: number;
  effective_fee_rate: number;
}

interface OutstandingBalance {
  contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  project_value: number;
  total_paid: number;
  balance_due: number;
  last_payment_date: string;
}

interface PaymentMethodStat {
  payment_method: string;
  transaction_count: number;
  total_volume: number;
  avg_transaction_size: number;
  avg_fee_per_transaction: number;
  total_fees_paid: number;
  effective_fee_rate: number;
  total_net_received: number;
}

interface ClientPaymentSummary {
  contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  total_payments: number;
  total_paid: number;
  total_net_received: number;
}

export default function FinancialDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{success: boolean, message: string} | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Financial data
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([]);
  const [paymentMethodStats, setPaymentMethodStats] = useState<PaymentMethodStat[]>([]);
  const [topClients, setTopClients] = useState<ClientPaymentSummary[]>([]);
  
  // Summary stats
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalNetRevenue, setTotalNetRevenue] = useState(0);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      router.push('/signin');
      return;
    }
    setUser(user);
  };

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMonthlyRevenue(),
        fetchOutstandingBalances(),
        fetchPaymentMethodStats(),
        fetchTopClients(),
        fetchSummaryStats()
      ]);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyRevenue = async () => {
    const { data, error } = await supabase
      .from('monthly_revenue')
      .select('*')
      .order('month', { ascending: false })
      .limit(12);
    
    if (!error && data) {
      setMonthlyRevenue(data);
    }
  };

  const fetchOutstandingBalances = async () => {
    const { data, error } = await supabase
      .from('outstanding_balances')
      .select('*')
      .gt('balance_due', 0)
      .order('balance_due', { ascending: false });
    
    if (!error && data) {
      setOutstandingBalances(data);
    }
  };

  const fetchPaymentMethodStats = async () => {
    const { data, error } = await supabase
      .from('payment_method_stats')
      .select('*')
      .order('total_amount', { ascending: false });
    
    if (!error && data) {
      setPaymentMethodStats(data);
    }
  };

  const fetchTopClients = async () => {
    const { data, error } = await supabase
      .from('client_payment_summary')
      .select('*')
      .order('total_paid', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setTopClients(data);
    }
  };

  const fetchSummaryStats = async () => {
    // Total revenue
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('total_amount, net_amount, payment_status')
      .eq('payment_status', 'Paid');
    
    if (!paymentsError && payments) {
      const gross = payments.reduce((sum, p) => sum + (p.total_amount || 0), 0);
      const net = payments.reduce((sum, p) => sum + (p.net_amount || 0), 0);
      setTotalRevenue(gross);
      setTotalNetRevenue(net);
      setTotalPayments(payments.length);
    }

    // Total outstanding
    const { data: outstanding, error: outstandingError } = await supabase
      .from('outstanding_balances')
      .select('balance_due');
    
    if (!outstandingError && outstanding) {
      const total = outstanding.reduce((sum, o) => sum + (o.balance_due || 0), 0);
      setTotalOutstanding(total);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialData();
    setRefreshing(false);
  };

  const handleSyncPayments = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const response = await fetch('/api/admin/sync-stripe-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days_back: 30, // Sync last 30 days
          limit: 100
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setSyncResult({
          success: true,
          message: data.message || `Synced ${data.summary?.created || 0} new payment(s)`
        });
        // Refresh data after sync
        await fetchFinancialData();
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Failed to sync payments'
        });
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        message: error.message || 'Error syncing payments'
      });
    } finally {
      setSyncing(false);
      // Clear sync result after 5 seconds
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatMonth = (monthDate: string) => {
    if (!monthDate) return 'Unknown';
    try {
      // monthDate comes as a full date from the database (e.g., "2024-01-01")
      const date = new Date(monthDate);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const calculateGrowth = () => {
    if (monthlyRevenue.length < 2) return 0;
    const current = monthlyRevenue[0]?.gross_revenue || 0;
    const previous = monthlyRevenue[1]?.gross_revenue || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const growth = calculateGrowth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading financial data...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Dashboard</h1>
            <p className="text-gray-600">Complete overview of your business finances and revenue</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSyncPayments}
              disabled={syncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className={`h-4 w-4 ${syncing ? 'animate-pulse' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Stripe Payments'}
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Sync Result Message */}
        {syncResult && (
          <div className={`mb-6 p-4 rounded-lg border-2 flex items-center gap-3 ${
            syncResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {syncResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            )}
            <p className="font-medium">{syncResult.message}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8" />
              <div className={`flex items-center gap-1 text-sm ${growth >= 0 ? 'bg-white/20' : 'bg-red-500/20'} px-2 py-1 rounded`}>
                {growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(growth).toFixed(1)}%
              </div>
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm opacity-75">{totalPayments} payments received</p>
          </div>

          {/* Net Revenue */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Net Revenue</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalNetRevenue)}</p>
            <p className="text-sm opacity-75">
              -{formatCurrency(totalRevenue - totalNetRevenue)} in fees (
              {totalRevenue > 0 ? ((totalRevenue - totalNetRevenue) / totalRevenue * 100).toFixed(1) : '0'}%)
            </p>
          </div>

          {/* Outstanding */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Outstanding</h3>
            <p className="text-3xl font-bold mb-1">{formatCurrency(totalOutstanding)}</p>
            <p className="text-sm opacity-75">{outstandingBalances.length} clients with balances</p>
          </div>

          {/* Average Payment */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Average Payment</h3>
            <p className="text-3xl font-bold mb-1">
              {formatCurrency(totalPayments > 0 ? totalRevenue / totalPayments : 0)}
            </p>
            <p className="text-sm opacity-75">Per transaction</p>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Monthly Revenue Trend
          </h2>
          <div className="space-y-3">
            {monthlyRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No revenue data available yet</p>
                <p className="text-sm mt-2">Revenue will appear here once payments are processed</p>
              </div>
            ) : (
              monthlyRevenue.map((month, index) => {
                const maxRevenue = Math.max(...monthlyRevenue.map(m => m.gross_revenue));
                const widthPercentage = maxRevenue > 0 ? (month.gross_revenue / maxRevenue) * 100 : 0;
                const avgPayment = month.transaction_count > 0 ? month.gross_revenue / month.transaction_count : 0;
                
                return (
                  <div key={month.month} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{formatMonth(month.month)}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(month.gross_revenue)}</span>
                        <span className="text-xs text-gray-500 ml-2">({month.transaction_count} payments)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                      <span>Net: {formatCurrency(month.net_revenue)}</span>
                      <span>Avg: {formatCurrency(avgPayment)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Payment Methods
            </h2>
            <div className="space-y-4">
              {paymentMethodStats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No payment data available yet</p>
                </div>
              ) : (
                paymentMethodStats.map((method) => {
                  const maxAmount = Math.max(...paymentMethodStats.map(m => m.total_volume));
                  const widthPercentage = maxAmount > 0 ? (method.total_volume / maxAmount) * 100 : 0;
                  
                  return (
                    <div key={method.payment_method}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{method.payment_method}</span>
                        <span className="text-sm text-gray-500">{method.transaction_count} payments</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-end px-3 text-white text-sm font-semibold transition-all duration-500"
                          style={{ width: `${widthPercentage}%` }}
                        >
                          {formatCurrency(method.total_volume)}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Average: {formatCurrency(method.avg_transaction_size)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Top Clients by Revenue
            </h2>
            <div className="space-y-3">
              {topClients.map((client, index) => (
                <div 
                  key={client.contact_id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/contacts/${client.contact_id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-blue-400 to-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{client.total_payments} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(client.total_paid)}</p>
                    <p className="text-xs text-gray-500">
                      Net: {formatCurrency(client.total_net_received)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Outstanding Balances */}
        {outstandingBalances.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Outstanding Balances
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Project Value</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Paid</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Balance Due</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Last Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingBalances.map((balance) => (
                    <tr 
                      key={balance.contact_id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/contacts/${balance.contact_id}`)}
                    >
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">
                          {balance.first_name} {balance.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{balance.email_address}</p>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700">
                        {formatCurrency(balance.project_value)}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        {formatCurrency(balance.total_paid)}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
                          {formatCurrency(balance.balance_due)}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-gray-500">
                        {formatDate(balance.last_payment_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-3 px-4 text-gray-900">Total Outstanding</td>
                    <td></td>
                    <td></td>
                    <td className="text-right py-3 px-4 text-orange-600 text-lg">
                      {formatCurrency(outstandingBalances.reduce((sum, b) => sum + b.balance_due, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

