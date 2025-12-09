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
  ArrowLeft
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
  const [filterEventCode, setFilterEventCode] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Stats
  const [totalScans, setTotalScans] = useState(0);
  const [convertedScans, setConvertedScans] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);

  useEffect(() => {
    fetchScans();
  }, [filterConverted, filterEventCode, dateRangeStart, dateRangeEnd]);

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

      setTotalScans(total);
      setConvertedScans(converted);
      setConversionRate(rate);

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
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/crowd-requests')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Requests
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-8 h-8" />
                QR Code Scans & Conversions
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track QR code scans and see which ones converted into requests
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalScans.toLocaleString()}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Converted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{convertedScans.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{conversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Conversion Status
              </label>
              <select
                value={filterConverted}
                onChange={(e) => setFilterConverted(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="converted">Converted</option>
                <option value="not_converted">Not Converted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Code
              </label>
              <Input
                placeholder="Filter by event code..."
                value={filterEventCode}
                onChange={(e) => setFilterEventCode(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Scans Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading scans...</p>
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center">
              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No scans found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(scan.scanned_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono">
                          {scan.event_qr_code}
                        </Badge>
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
                            <p className="font-medium">{scan.request.requester_name}</p>
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
                          </div>
                        ) : (
                          <span className="text-gray-400">No request</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {scan.request?.amount_requested ? formatCurrency(scan.request.amount_requested) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

