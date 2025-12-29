'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  QrCode, 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  ArrowLeft,
  Scan,
  Clock,
  ExternalLink,
  DollarSign,
  BarChart3,
  MapPin,
  Activity,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/Toasts/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';

interface QRScan {
  id: string;
  event_qr_code: string;
  organization_id: string | null;
  user_agent: string | null;
  ip_address: string | null;
  referrer: string | null;
  scanned_at: string;
  converted: boolean;
  converted_at: string | null;
  request_id: string | null;
  session_id: string | null;
  is_qr_scan: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  request?: {
    id: string;
    requester_name: string;
    requester_email: string | null;
    requester_phone: string | null;
    song_title: string | null;
    song_artist: string | null;
    amount_requested: number;
    payment_status: string;
    status: string;
  } | null;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export default function QRScansPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [scans, setScans] = useState<QRScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterConverted, setFilterConverted] = useState<string>('all'); // 'all', 'converted', 'not_converted'
  const [filterQrScan, setFilterQrScan] = useState<string>('all'); // 'all', 'qr_scan', 'not_qr_scan'
  const [filterEventCode, setFilterEventCode] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Stats
  const [totalScans, setTotalScans] = useState(0);
  const [convertedScans, setConvertedScans] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgTimeToConversion, setAvgTimeToConversion] = useState<number | null>(null);
  const [qrScanConversionRate, setQrScanConversionRate] = useState(0);
  const [directVisitConversionRate, setDirectVisitConversionRate] = useState(0);
  
  // Funnel metrics
  const [funnelData, setFunnelData] = useState({
    scanned: 0,
    viewedPage: 0,
    submittedRequest: 0,
    paid: 0
  });
  
  // Time-based analytics
  const [hourlyData, setHourlyData] = useState<{ [key: number]: number }>({});
  const [dayOfWeekData, setDayOfWeekData] = useState<{ [key: string]: number }>({});
  
  // Event performance
  const [eventPerformance, setEventPerformance] = useState<Array<{
    eventCode: string;
    scans: number;
    converted: number;
    revenue: number;
    conversionRate: number;
  }>>([]);
  
  // Session grouping
  const [sessionGroups, setSessionGroups] = useState<{ [key: string]: QRScan[] }>({});
  
  // Active tab for analytics
  const [activeTab, setActiveTab] = useState<'table' | 'funnel' | 'analytics' | 'events'>('table');
  
  // Mobile filters visibility
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetchScans();
  }, [filterConverted, filterQrScan, filterEventCode, dateRangeStart, dateRangeEnd]);

  const fetchScans = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('qr_scans')
        .select(`
          *,
          request:request_id (
            id,
            requester_name,
            requester_email,
            requester_phone,
            song_title,
            song_artist,
            amount_requested,
            payment_status,
            status
          ),
          organization:organization_id (
            id,
            name
          )
        `)
        .order('scanned_at', { ascending: false })
        .limit(1000);

      // Apply filters
      if (filterConverted === 'converted') {
        query = query.eq('converted', true);
      } else if (filterConverted === 'not_converted') {
        query = query.eq('converted', false);
      }

      if (filterQrScan === 'qr_scan') {
        query = query.eq('is_qr_scan', true);
      } else if (filterQrScan === 'not_qr_scan') {
        query = query.eq('is_qr_scan', false);
      }

      if (filterEventCode) {
        query = query.ilike('event_qr_code', `%${filterEventCode}%`);
      }

      if (dateRangeStart) {
        query = query.gte('scanned_at', dateRangeStart);
      }

      if (dateRangeEnd) {
        query = query.lte('scanned_at', dateRangeEnd + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate stats
      const total = data?.length || 0;
      const converted = data?.filter(s => s.converted).length || 0;
      const rate = total > 0 ? (converted / total) * 100 : 0;
      
      // Calculate revenue from converted scans
      const revenue = data
        ?.filter(s => s.converted && s.request?.amount_requested)
        .reduce((sum, s) => sum + (s.request?.amount_requested || 0), 0) || 0;
      
      // Calculate average time to conversion (in minutes)
      const conversionTimes = data
        ?.filter(s => s.converted && s.converted_at && s.scanned_at)
        .map(s => {
          const scanTime = new Date(s.scanned_at).getTime();
          const convertTime = new Date(s.converted_at).getTime();
          return (convertTime - scanTime) / (1000 * 60); // Convert to minutes
        })
        .filter(t => t > 0 && t < 1440) || []; // Filter out negative times and times > 24 hours
      
      const avgConversionTime = conversionTimes.length > 0
        ? conversionTimes.reduce((sum, t) => sum + t, 0) / conversionTimes.length
        : null;
      
      // Calculate QR scan vs direct visit conversion rates
      const qrScans = data?.filter(s => s.is_qr_scan) || [];
      const directVisits = data?.filter(s => !s.is_qr_scan) || [];
      const qrConverted = qrScans.filter(s => s.converted).length;
      const directConverted = directVisits.filter(s => s.converted).length;
      const qrRate = qrScans.length > 0 ? (qrConverted / qrScans.length) * 100 : 0;
      const directRate = directVisits.length > 0 ? (directConverted / directVisits.length) * 100 : 0;

      setTotalScans(total);
      setConvertedScans(converted);
      setConversionRate(rate);
      setTotalRevenue(revenue);
      setAvgTimeToConversion(avgConversionTime);
      setQrScanConversionRate(qrRate);
      setDirectVisitConversionRate(directRate);

      // Fetch success page views for converted requests
      const convertedRequestIds = data
        ?.filter(s => s.converted && s.request_id)
        .map(s => s.request_id)
        .filter((id, index, self) => self.indexOf(id) === index) || []; // Unique IDs
      
      let successViewsByRequest: { [key: string]: any[] } = {};
      if (convertedRequestIds.length > 0) {
        try {
          const viewsResponse = await fetch('/api/crowd-request/bulk-success-views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_ids: convertedRequestIds })
          });
          if (viewsResponse.ok) {
            const viewsData = await viewsResponse.json();
            successViewsByRequest = viewsData.viewsByRequest || {};
          }
        } catch (err) {
          console.error('Error fetching success page views:', err);
        }
      }

      // Calculate funnel metrics
      const scanned = total;
      const viewedPage = Object.keys(successViewsByRequest).length; // Requests with at least one success page view
      const submittedRequest = converted;
      const paid = data?.filter(s => s.converted && s.request?.payment_status === 'paid').length || 0;
      
      setFunnelData({
        scanned,
        viewedPage,
        submittedRequest,
        paid
      });

      // Calculate time-based analytics
      const hourly: { [key: number]: number } = {};
      const dayOfWeek: { [key: string]: number } = {};
      
      data?.forEach(scan => {
        const date = new Date(scan.scanned_at);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });
        
        hourly[hour] = (hourly[hour] || 0) + 1;
        dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
      });
      
      setHourlyData(hourly);
      setDayOfWeekData(dayOfWeek);

      // Calculate event performance
      const eventMap: { [key: string]: { scans: number; converted: number; revenue: number } } = {};
      
      data?.forEach(scan => {
        const eventCode = scan.event_qr_code;
        if (!eventMap[eventCode]) {
          eventMap[eventCode] = { scans: 0, converted: 0, revenue: 0 };
        }
        eventMap[eventCode].scans++;
        if (scan.converted) {
          eventMap[eventCode].converted++;
          if (scan.request?.amount_requested) {
            eventMap[eventCode].revenue += scan.request.amount_requested;
          }
        }
      });
      
      const eventPerf = Object.entries(eventMap)
        .map(([eventCode, stats]) => ({
          eventCode,
          scans: stats.scans,
          converted: stats.converted,
          revenue: stats.revenue,
          conversionRate: stats.scans > 0 ? (stats.converted / stats.scans) * 100 : 0
        }))
        .sort((a, b) => b.scans - a.scans); // Sort by scan count
      
      setEventPerformance(eventPerf);

      // Group scans by session
      const sessions: { [key: string]: QRScan[] } = {};
      data?.forEach(scan => {
        if (scan.session_id) {
          if (!sessions[scan.session_id]) {
            sessions[scan.session_id] = [];
          }
          sessions[scan.session_id].push(scan);
        }
      });
      setSessionGroups(sessions);

      // Apply search filter
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(scan => 
          scan.event_qr_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scan.request?.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scan.request?.requester_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scan.request?.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          scan.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setScans(filteredData);
    } catch (error) {
      console.error('Error fetching scans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load QR scans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const exportToCSV = () => {
    const headers = [
      'Scan ID',
      'Event QR Code',
      'Organization',
      'Scanned At',
      'Is QR Scan',
      'Converted',
      'Converted At',
      'Request ID',
      'Requester Name',
      'Requester Email',
      'Requester Phone',
      'Song Title',
      'Song Artist',
      'Amount',
      'Payment Status',
      'Status',
      'User Agent',
      'IP Address',
      'Referrer'
    ];

    const rows = scans.map(scan => [
      scan.id,
      scan.event_qr_code,
      scan.organization?.name || 'N/A',
      scan.scanned_at,
      scan.is_qr_scan ? 'Yes' : 'No',
      scan.converted ? 'Yes' : 'No',
      scan.converted_at || '',
      scan.request_id || '',
      scan.request?.requester_name || '',
      scan.request?.requester_email || '',
      scan.request?.requester_phone || '',
      scan.request?.song_title || '',
      scan.request?.song_artist || '',
      scan.request?.amount_requested ? formatCurrency(scan.request.amount_requested) : '',
      scan.request?.payment_status || '',
      scan.request?.status || '',
      scan.user_agent || '',
      scan.ip_address || '',
      scan.referrer || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `qr-scans-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Exported',
      description: 'QR scans exported to CSV',
    });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/crowd-requests')}
              className="self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Requests</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-xl sm:text-3xl">QR Scans</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                Track QR code scans and see which ones converted into requests
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="inline-flex items-center gap-2 self-start sm:self-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Total Scans</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{totalScans.toLocaleString()}</p>
                {qrScanConversionRate > 0 && directVisitConversionRate > 0 && (
                  <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 truncate">
                    QR: {qrScanConversionRate.toFixed(1)}% | Direct: {directVisitConversionRate.toFixed(1)}%
                  </p>
                )}
              </div>
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Converted</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">{convertedScans.toLocaleString()}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
                  {conversionRate.toFixed(1)}% rate
                </p>
              </div>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Total Revenue</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  ${(totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {convertedScans > 0 && (
                  <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 truncate">
                    Avg: ${((totalRevenue / convertedScans) / 100).toFixed(2)}
                  </p>
                )}
              </div>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Avg Time</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {avgTimeToConversion !== null 
                    ? avgTimeToConversion < 60 
                      ? `${Math.round(avgTimeToConversion)}m`
                      : `${Math.round(avgTimeToConversion / 60)}h ${Math.round(avgTimeToConversion % 60)}m`
                    : 'N/A'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
                  To convert
                </p>
              </div>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0 mt-0.5" />
            </div>
          </div>
        </div>

        {/* Analytics Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 sm:mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-1 p-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('table')}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'table'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-2" />
                <span className="hidden sm:inline">Table View</span>
                <span className="sm:hidden">Table</span>
              </button>
              <button
                onClick={() => setActiveTab('funnel')}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'funnel'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Target className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-2" />
                <span className="hidden sm:inline">Conversion Funnel</span>
                <span className="sm:hidden">Funnel</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-2" />
                <span className="hidden sm:inline">Time Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'events'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 inline sm:mr-2" />
                <span className="hidden sm:inline">Event Performance</span>
                <span className="sm:hidden">Events</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="w-full px-3 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {(searchTerm || filterConverted !== 'all' || filterQrScan !== 'all' || filterEventCode || dateRangeStart || dateRangeEnd) && (
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <span className={`transform transition-transform ${filtersOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>
          
          {/* Filter Content */}
          <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block p-3 sm:p-4`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Search
                </label>
                <Input
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Conversion Status
                </label>
                <select
                  value={filterConverted}
                  onChange={(e) => setFilterConverted(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="converted">Converted</option>
                  <option value="not_converted">Not Converted</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Source
                </label>
                <select
                  value={filterQrScan}
                  onChange={(e) => setFilterQrScan(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Sources</option>
                  <option value="qr_scan">QR Code Scan</option>
                  <option value="not_qr_scan">Other Visit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Event Code
                </label>
                <Input
                  placeholder="Event code..."
                  value={filterEventCode}
                  onChange={(e) => setFilterEventCode(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'table' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center">
                  <img
                    src="/M10-Rotating-Logo.gif"
                    alt="M10 DJ Company Loading"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading scans...</p>
              </div>
            ) : scans.length === 0 ? (
              <div className="p-8 text-center">
                <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No scans found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {scans.map((scan) => (
                    <div 
                      key={scan.id} 
                      className={`p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${scan.request ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (scan.request?.id) {
                          router.push(`/admin/crowd-requests?openRequest=${scan.request.id}`);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {formatDate(scan.scanned_at)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {scan.event_qr_code}
                            </Badge>
                            {scan.is_qr_scan ? (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                                <Scan className="w-3 h-3 mr-1 inline" />
                                QR Scan
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 dark:text-gray-400 text-xs">
                                Direct Visit
                              </Badge>
                            )}
                            {scan.converted ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Converted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 dark:text-gray-400 text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Converted
                              </Badge>
                            )}
                          </div>
                        </div>
                        {scan.request?.amount_requested && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(scan.request.amount_requested)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {scan.organization?.name && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Organization</p>
                          <p className="text-sm text-gray-900 dark:text-white">{scan.organization.name}</p>
                        </div>
                      )}

                      {scan.request ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Request</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (scan.request?.id) {
                                  router.push(`/admin/crowd-requests?openRequest=${scan.request.id}`);
                                }
                              }}
                              title="View request details"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">{scan.request.requester_name}</p>
                          {scan.request.song_title && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {scan.request.song_title}
                              {scan.request.song_artist && ` by ${scan.request.song_artist}`}
                            </p>
                          )}
                          {scan.request.requester_email && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">{scan.request.requester_email}</p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {scan.request.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {scan.request.payment_status}
                            </Badge>
                          </div>
                          {scan.converted_at && scan.scanned_at && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Converted in {Math.round((new Date(scan.converted_at).getTime() - new Date(scan.scanned_at).getTime()) / (1000 * 60))}m
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No request</p>
                      )}

                      {scan.user_agent && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Device</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {(() => {
                              const ua = scan.user_agent.toLowerCase();
                              const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
                              const isTablet = ua.includes('tablet') || ua.includes('ipad');
                              const browser = ua.includes('chrome') ? 'Chrome' :
                                            ua.includes('firefox') ? 'Firefox' :
                                            ua.includes('safari') && !ua.includes('chrome') ? 'Safari' :
                                            ua.includes('edge') ? 'Edge' : 'Other';
                              const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
                              return `${device} • ${browser}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Scan Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Event Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Source
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Request Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Device
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {scans.map((scan) => (
                        <tr 
                          key={scan.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${scan.request ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (scan.request?.id) {
                              router.push(`/admin/crowd-requests?openRequest=${scan.request.id}`);
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(scan.scanned_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="font-mono">
                              {scan.event_qr_code}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.is_qr_scan ? (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Scan className="w-3 h-3 mr-1 inline" />
                                QR Scan
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                Direct Visit
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {scan.organization?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {scan.converted ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Converted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Converted
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {scan.request ? (
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{scan.request.requester_name}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (scan.request?.id) {
                                        router.push(`/admin/crowd-requests?openRequest=${scan.request.id}`);
                                      }
                                    }}
                                    title="View request details"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                                {scan.request.song_title && (
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {scan.request.song_title}
                                    {scan.request.song_artist && ` by ${scan.request.song_artist}`}
                                  </p>
                                )}
                                {scan.request.requester_email && (
                                  <p className="text-gray-500 dark:text-gray-500 text-xs">{scan.request.requester_email}</p>
                                )}
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {scan.request.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {scan.request.payment_status}
                                  </Badge>
                                </div>
                                {scan.converted_at && scan.scanned_at && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Converted in {Math.round((new Date(scan.converted_at).getTime() - new Date(scan.scanned_at).getTime()) / (1000 * 60))}m
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No request</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {scan.request?.amount_requested ? formatCurrency(scan.request.amount_requested) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {scan.user_agent ? (
                              <div className="text-xs">
                                {(() => {
                                  const ua = scan.user_agent.toLowerCase();
                                  const isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
                                  const isTablet = ua.includes('tablet') || ua.includes('ipad');
                                  const browser = ua.includes('chrome') ? 'Chrome' :
                                                ua.includes('firefox') ? 'Firefox' :
                                                ua.includes('safari') && !ua.includes('chrome') ? 'Safari' :
                                                ua.includes('edge') ? 'Edge' : 'Other';
                                  const device = isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop';
                                  return `${device} • ${browser}`;
                                })()}
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Conversion Funnel View */}
        {activeTab === 'funnel' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
              Conversion Funnel
            </h2>
            
            <div className="space-y-4 sm:space-y-6">
              {[
                { label: 'Scanned QR Code', value: funnelData.scanned, color: 'blue', icon: Scan },
                { label: 'Viewed Success Page', value: funnelData.viewedPage, color: 'purple', icon: Eye },
                { label: 'Submitted Request', value: funnelData.submittedRequest, color: 'green', icon: CheckCircle },
                { label: 'Completed Payment', value: funnelData.paid, color: 'orange', icon: DollarSign }
              ].map((step, index) => {
                const prevValue = index === 0 ? funnelData.scanned : [
                  funnelData.scanned,
                  funnelData.viewedPage,
                  funnelData.submittedRequest
                ][index - 1];
                const dropoffRate = prevValue > 0 ? ((prevValue - step.value) / prevValue) * 100 : 0;
                const conversionRate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;
                const Icon = step.icon;
                
                return (
                  <div key={step.label} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-${step.color}-100 dark:bg-${step.color}-900/30 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${step.color}-600 dark:text-${step.color}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{step.label}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {index > 0 && `${conversionRate.toFixed(1)}% conversion from previous step`}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{step.value.toLocaleString()}</p>
                        {index > 0 && dropoffRate > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {dropoffRate.toFixed(1)}% dropoff
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                      <div
                        className={`bg-${step.color}-500 h-2 sm:h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${prevValue > 0 ? (step.value / prevValue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Analytics View */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                Peak Scanning Hours
              </h2>
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <div className="flex gap-1 sm:gap-2" style={{ minWidth: 'max-content' }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = hourlyData[hour] || 0;
                    const maxCount = Math.max(...Object.values(hourlyData), 1);
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={hour} className="flex flex-col items-center flex-shrink-0" style={{ width: '28px' }}>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t relative" style={{ height: '80px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-purple-500 rounded-t transition-all duration-300"
                            style={{ height: `${height}%` }}
                            title={`${hour}:00 - ${count} scans`}
                          />
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-1">{hour}</p>
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white">{count}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Scans by Day of Week
              </h2>
              <div className="space-y-2 sm:space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const count = dayOfWeekData[day] || 0;
                  const maxCount = Math.max(...Object.values(dayOfWeekData), 1);
                  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{day}</span>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{count} scans</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3">
                        <div
                          className="bg-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Event Performance View */}
        {activeTab === 'events' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                Event Performance Comparison
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Compare conversion rates and revenue across different events
              </p>
            </div>
            
            {eventPerformance.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No event data available</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                  {eventPerformance.map((event) => (
                    <div key={event.eventCode} className="p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-sm">
                          {event.eventCode}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(event.revenue)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Scans</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{event.scans.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Converted</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{event.converted.toLocaleString()}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Conversion Rate</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {event.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${Math.min(event.conversionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Event Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Scans
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Converted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Conversion Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {eventPerformance.map((event) => (
                        <tr key={event.eventCode} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="font-mono">
                              {event.eventCode}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {event.scans.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {event.converted.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(event.conversionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {event.conversionRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(event.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

