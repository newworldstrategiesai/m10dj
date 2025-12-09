'use client';

/**
 * Analytics Dashboard Component
 * 
 * Comprehensive analytics dashboard showing revenue, requests, and business metrics
 */

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';
import { 
  DollarSign, 
  TrendingUp, 
  Music, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';

interface RevenueStats {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth: number;
  averagePerEvent: number;
}

interface RequestStats {
  total: number;
  thisMonth: number;
  byType: {
    song_request: number;
    shoutout: number;
    tip: number;
  };
  paid: number;
  pending: number;
}

interface EventStats {
  total: number;
  thisMonth: number;
  upcoming: number;
  completed: number;
  byType: Record<string, number>;
}

export default function AnalyticsDashboard() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [requestStats, setRequestStats] = useState<RequestStats | null>(null);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const org = await getCurrentOrganization(supabase);
      
      if (!org) {
        setLoading(false);
        return;
      }

      setOrganization(org);
      
      // Load all analytics in parallel
      await Promise.all([
        loadRevenueStats(org.id),
        loadRequestStats(org.id),
        loadEventStats(org.id)
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRevenueStats = async (orgId: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get payments for this month
      const { data: thisMonthPayments } = await supabase
        .from('payments')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('payment_status', 'Paid')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);

      // Get payments for last month
      const { data: lastMonthPayments } = await supabase
        .from('payments')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('payment_status', 'Paid')
        .gte('transaction_date', startOfLastMonth.toISOString().split('T')[0])
        .lte('transaction_date', endOfLastMonth.toISOString().split('T')[0]);

      // Get all payments
      const { data: allPayments } = await supabase
        .from('payments')
        .select('total_amount')
        .eq('organization_id', orgId)
        .eq('payment_status', 'Paid');

      const thisMonth = (thisMonthPayments || []).reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const lastMonth = (lastMonthPayments || []).reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
      const total = (allPayments || []).reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);

      const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      // Get event count for average
      const { count: eventCount } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('request_type', 'event')
        .gte('created_at', startOfMonth.toISOString());

      const averagePerEvent = eventCount && eventCount > 0 ? thisMonth / eventCount : 0;

      setRevenueStats({
        thisMonth,
        lastMonth,
        total,
        growth,
        averagePerEvent
      });
    } catch (error) {
      console.error('Error loading revenue stats:', error);
    }
  };

  const loadRequestStats = async (orgId: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all requests
      const { data: allRequests } = await supabase
        .from('crowd_requests')
        .select('request_type, payment_status, created_at')
        .eq('organization_id', orgId)
        .neq('request_type', 'event'); // Exclude events

      // Get this month's requests
      const { data: thisMonthRequests } = await supabase
        .from('crowd_requests')
        .select('request_type, payment_status')
        .eq('organization_id', orgId)
        .neq('request_type', 'event')
        .gte('created_at', startOfMonth.toISOString());

      const byType = {
        song_request: 0,
        shoutout: 0,
        tip: 0
      };

      (allRequests || []).forEach(req => {
        if (req.request_type in byType) {
          byType[req.request_type as keyof typeof byType]++;
        }
      });

      const paid = (allRequests || []).filter(r => r.payment_status === 'paid').length;
      const pending = (allRequests || []).filter(r => r.payment_status === 'pending').length;

      setRequestStats({
        total: allRequests?.length || 0,
        thisMonth: thisMonthRequests?.length || 0,
        byType,
        paid,
        pending
      });
    } catch (error) {
      console.error('Error loading request stats:', error);
    }
  };

  const loadEventStats = async (orgId: string) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all events
      const { data: allEvents } = await supabase
        .from('crowd_requests')
        .select('event_name, event_date, status, created_at')
        .eq('organization_id', orgId)
        .eq('request_type', 'event');

      // Get this month's events
      const { count: thisMonthCount } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('request_type', 'event')
        .gte('created_at', startOfMonth.toISOString());

      // Get upcoming events
      const { count: upcomingCount } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('request_type', 'event')
        .gte('event_date', now.toISOString().split('T')[0]);

      // Get completed events
      const { count: completedCount } = await supabase
        .from('crowd_requests')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('request_type', 'event')
        .lt('event_date', now.toISOString().split('T')[0]);

      // Count by event type (using event_name patterns)
      const byType: Record<string, number> = {};
      (allEvents || []).forEach(event => {
        const type = event.event_name?.toLowerCase().includes('wedding') ? 'wedding' :
                     event.event_name?.toLowerCase().includes('corporate') ? 'corporate' :
                     event.event_name?.toLowerCase().includes('party') ? 'party' : 'other';
        byType[type] = (byType[type] || 0) + 1;
      });

      setEventStats({
        total: allEvents?.length || 0,
        thisMonth: thisMonthCount || 0,
        upcoming: upcomingCount || 0,
        completed: completedCount || 0,
        byType
      });
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Revenue, requests, and business insights</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={loadData}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Revenue Stats */}
      {revenueStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">This Month</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(revenueStats.thisMonth)}</p>
            <div className="flex items-center mt-2">
              {revenueStats.growth >= 0 ? (
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                revenueStats.growth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {Math.abs(revenueStats.growth).toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(revenueStats.total)}</p>
            <p className="text-sm text-gray-500 mt-2">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg per Event</span>
              <BarChart3 className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(revenueStats.averagePerEvent)}</p>
            <p className="text-sm text-gray-500 mt-2">This month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Last Month</span>
              <Calendar className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(revenueStats.lastMonth)}</p>
            <p className="text-sm text-gray-500 mt-2">For comparison</p>
          </div>
        </div>
      )}

      {/* Request Stats */}
      {requestStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Music className="w-6 h-6 text-brand-gold mr-2" />
            Request Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900">{requestStats.total}</p>
              <p className="text-sm text-gray-500 mt-1">{requestStats.thisMonth} this month</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Song Requests</p>
              <p className="text-3xl font-bold text-gray-900">{requestStats.byType.song_request}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Shoutouts</p>
              <p className="text-3xl font-bold text-gray-900">{requestStats.byType.shoutout}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Tips</p>
              <p className="text-3xl font-bold text-gray-900">{requestStats.byType.tip}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid Requests</p>
              <p className="text-2xl font-bold text-green-600">{requestStats.paid}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
              <p className="text-2xl font-bold text-yellow-600">{requestStats.pending}</p>
            </div>
          </div>
        </div>
      )}

      {/* Event Stats */}
      {eventStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-6 h-6 text-brand-gold mr-2" />
            Event Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{eventStats.total}</p>
              <p className="text-sm text-gray-500 mt-1">{eventStats.thisMonth} this month</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-blue-600">{eventStats.upcoming}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{eventStats.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {eventStats.total > 0 ? ((eventStats.completed / eventStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
          
          {/* Event Type Breakdown */}
          <div className="pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Events by Type</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(eventStats.byType).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1 capitalize">{type}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <PieChart className="w-6 h-6 text-brand-gold mr-2" />
          Revenue Trends
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

