'use client';

/**
 * Analytics Dashboard Component
 * 
 * Comprehensive analytics dashboard showing revenue, requests, and business metrics
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  Clock,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface RevenueStats {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth: number;
  averagePerEvent: number;
}

interface RecentRequest {
  id: string;
  request_type: 'song_request' | 'shoutout' | 'tip';
  requester_name: string;
  song_title: string | null;
  song_artist: string | null;
  recipient_name: string | null;
  amount_paid: number;
  payment_status: string;
  created_at: string;
  event_name: string | null;
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
  recentRequests: RecentRequest[];
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

      // Get recent requests (last 5)
      const { data: recentRequestsData } = await supabase
        .from('crowd_requests')
        .select('id, request_type, requester_name, song_title, song_artist, recipient_name, amount_paid, payment_status, created_at, event_name')
        .eq('organization_id', orgId)
        .neq('request_type', 'event')
        .order('created_at', { ascending: false })
        .limit(5);

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
        pending,
        recentRequests: (recentRequestsData || []) as RecentRequest[]
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
        <div className="animate-pulse">
          <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3 sm:mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded hidden lg:block"></div>
            <div className="h-24 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded hidden lg:block"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header - Compact on Mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 hidden sm:block">Revenue, requests, and business insights</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="flex-1 sm:flex-none px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button
            onClick={loadData}
            className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Revenue Stats - Compact Grid */}
      {revenueStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">This Month</span>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{formatCurrency(revenueStats.thisMonth)}</p>
            <div className="flex items-center mt-1.5 sm:mt-2">
              {revenueStats.growth >= 0 ? (
                <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-0.5 sm:mr-1 flex-shrink-0" />
              ) : (
                <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-0.5 sm:mr-1 flex-shrink-0" />
              )}
              <span className={`text-xs sm:text-sm font-medium ${
                revenueStats.growth >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                <span className="hidden sm:inline">{Math.abs(revenueStats.growth).toFixed(1)}% vs last month</span>
                <span className="sm:hidden">{Math.abs(revenueStats.growth).toFixed(0)}%</span>
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{formatCurrency(revenueStats.total)}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">All time</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Avg per Event</span>
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{formatCurrency(revenueStats.averagePerEvent)}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">This month</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 border-l-2 sm:border-l-4 border-yellow-500">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Last Month</span>
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
            </div>
            <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">{formatCurrency(revenueStats.lastMonth)}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">For comparison</p>
          </div>
        </div>
      )}

      {/* Request Stats - Compact */}
      {requestStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#fcba00] mr-2 flex-shrink-0" />
              <span className="truncate">Request Analytics</span>
            </h3>
            <Link 
              href="/admin/crowd-requests"
              className="text-xs sm:text-sm text-[#fcba00] hover:text-[#e6a800] dark:text-[#fcba00] dark:hover:text-[#ffd633] font-medium flex items-center gap-1 flex-shrink-0"
            >
              View All
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{requestStats.total}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{requestStats.thisMonth} this month</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Song Requests</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{requestStats.byType.song_request}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Shoutouts</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{requestStats.byType.shoutout}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Tips</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{requestStats.byType.tip}</p>
            </div>
          </div>
          <div className="mb-4 sm:mb-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Paid Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{requestStats.paid}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Requests</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{requestStats.pending}</p>
            </div>
          </div>

          {/* Recent Requests List */}
          {requestStats.recentRequests && requestStats.recentRequests.length > 0 && (
            <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 mr-2 flex-shrink-0" />
                Recent Requests
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {requestStats.recentRequests.map((request) => {
                  const getRequestTypeLabel = (type: string) => {
                    switch (type) {
                      case 'song_request': return 'Song Request';
                      case 'shoutout': return 'Shoutout';
                      case 'tip': return 'Tip';
                      default: return type;
                    }
                  };

                  const getRequestTypeColor = (type: string) => {
                    switch (type) {
                      case 'song_request': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                      case 'shoutout': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
                      case 'tip': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
                    }
                  };

                  const formatTimeAgo = (dateString: string) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
                    
                    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
                    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                    return `${Math.floor(diffInSeconds / 86400)}d ago`;
                  };

                  return (
                    <Link
                      key={request.id}
                      href="/admin/crowd-requests"
                      className="block p-2 sm:p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#fcba00] dark:hover:border-[#fcba00] hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 sm:mb-1.5 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getRequestTypeColor(request.request_type)}`}>
                              {getRequestTypeLabel(request.request_type)}
                            </span>
                            {request.payment_status === 'paid' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
                                Paid
                              </span>
                            )}
                            {request.payment_status === 'pending' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0">
                                Pending
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-0.5 sm:space-y-1">
                            {request.request_type === 'song_request' && (
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {request.song_title && request.song_artist 
                                  ? `${request.song_title} - ${request.song_artist}`
                                  : request.song_title || request.song_artist || 'Song Request'}
                              </p>
                            )}
                            {request.request_type === 'shoutout' && (
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                {request.recipient_name ? `Shoutout for ${request.recipient_name}` : 'Shoutout Request'}
                              </p>
                            )}
                            {request.request_type === 'tip' && (
                              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                Tip from {request.requester_name}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                              <span className="truncate">By {request.requester_name}</span>
                              {request.amount_paid > 0 && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="font-medium text-green-600 dark:text-green-400 flex-shrink-0">
                                    {formatCurrency(request.amount_paid / 100)}
                                  </span>
                                </>
                              )}
                              {request.event_name && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="truncate">{request.event_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(request.created_at)}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#fcba00] dark:group-hover:text-[#fcba00] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Event Stats - Compact */}
      {eventStats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-6 flex items-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#fcba00] mr-2 flex-shrink-0" />
            <span className="truncate">Event Analytics</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{eventStats.total}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{eventStats.thisMonth} this month</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">{eventStats.upcoming}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">{eventStats.completed}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">
                {eventStats.total > 0 ? ((eventStats.completed / eventStats.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
          
          {/* Event Type Breakdown - Compact */}
          <div className="pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Events by Type</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              {Object.entries(eventStats.byType).map(([type, count]) => (
                <div key={type} className="text-center p-2 sm:p-3 lg:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize truncate">{type}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Placeholder - Compact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 lg:mb-6 flex items-center">
          <PieChart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#fcba00] mr-2 flex-shrink-0" />
          <span className="truncate">Revenue Trends</span>
        </h3>
        <div className="h-32 sm:h-48 lg:h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
}

