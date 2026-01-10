'use client';

import { useState } from 'react';
import { 
  Music, 
  Search,
  Zap,
  QrCode,
  Settings,
  RefreshCw,
  Eye,
  Play
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Dummy data that mimics real requests
const dummyRequests = [
  {
    id: '1',
    song_title: 'Blinding Lights',
    song_artist: 'The Weeknd',
    requester_name: 'Sarah M.',
    amount_paid: 1500, // $15.00 in cents
    payment_status: 'paid',
    status: 'queued',
    request_type: 'song_request',
    is_fast_track: true,
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    payment_method: 'card'
  },
  {
    id: '2',
    song_title: 'Watermelon Sugar',
    song_artist: 'Harry Styles',
    requester_name: 'Mike T.',
    amount_paid: 1000, // $10.00
    payment_status: 'paid',
    status: 'playing',
    request_type: 'song_request',
    is_fast_track: false,
    created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    payment_method: 'card'
  },
  {
    id: '3',
    recipient_name: 'Jessica & Ryan',
    requester_name: 'Alex K.',
    amount_paid: 2000, // $20.00
    payment_status: 'paid',
    status: 'completed',
    request_type: 'shoutout',
    is_fast_track: false,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    payment_method: 'cashapp'
  },
  {
    id: '4',
    song_title: 'Levitating',
    song_artist: 'Dua Lipa',
    requester_name: 'Emma L.',
    amount_paid: 0,
    payment_status: 'pending',
    status: 'pending',
    request_type: 'song_request',
    is_fast_track: false,
    created_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
    payment_method: null
  },
  {
    id: '5',
    song_title: 'Good 4 U',
    song_artist: 'Olivia Rodrigo',
    requester_name: 'Chris D.',
    amount_paid: 1200, // $12.00
    payment_status: 'paid',
    status: 'queued',
    request_type: 'song_request',
    is_fast_track: true,
    created_at: new Date(Date.now() - 8 * 60000).toISOString(), // 8 minutes ago
    payment_method: 'card'
  }
];

const formatCurrency = (cents: number) => {
  return `$${(cents / 100).toFixed(2)}`;
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

const getStatusBadge = (status: string, paymentStatus: string) => {
  if (paymentStatus === 'paid') {
    if (status === 'playing') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Playing</Badge>;
    }
    if (status === 'completed') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>;
    }
    if (status === 'queued') {
      return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Queued</Badge>;
    }
  }
  if (paymentStatus === 'pending') {
    return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{status}</Badge>;
};

export function AdminDashboardDemo() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calculate stats from dummy data
  const totalRequests = dummyRequests.length;
  const paidCount = dummyRequests.filter(r => r.payment_status === 'paid').length;
  const totalRevenue = dummyRequests
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const pendingCount = dummyRequests.filter(r => r.payment_status === 'pending').length;

  // Filter requests
  const filteredRequests = dummyRequests.filter(request => {
    const matchesSearch = !searchTerm || 
      (request.song_title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.song_artist?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (request.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'paid' && request.payment_status === 'paid') ||
      (statusFilter === 'pending' && request.payment_status === 'pending');
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full min-h-[812px] bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Crowd Requests
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage song requests and tips in real-time
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </Button>
          <Button size="sm" variant="outline" className="border-gray-300 dark:border-gray-600">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" variant="outline" className="border-gray-300 dark:border-gray-600">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {totalRequests}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Paid</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {paidCount}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'paid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('paid')}
              className={statusFilter === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Paid
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              className={statusFilter === 'pending' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              Pending
            </Button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {request.request_type === 'song_request' ? (
                        <Music className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {request.request_type === 'song_request' ? (
                          <>
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {request.song_title || 'Song Request'}
                            </p>
                            {request.song_artist && (
                              <>
                                <span className="text-gray-400">•</span>
                                <p className="text-gray-600 dark:text-gray-400 truncate">
                                  {request.song_artist}
                                </p>
                              </>
                            )}
                          </>
                        ) : (
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Shoutout for {request.recipient_name || 'Someone'}
                          </p>
                        )}
                        {request.is_fast_track && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Fast Track
                          </Badge>
                        )}
                        {getStatusBadge(request.status, request.payment_status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <span>From: {request.requester_name}</span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span>{formatTimeAgo(request.created_at)}</span>
                        {request.payment_method && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            <span className="capitalize">{request.payment_method}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-shrink-0">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {request.amount_paid > 0 ? formatCurrency(request.amount_paid) : '$0.00'}
                    </p>
                    {request.amount_paid === 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pending payment</p>
                    )}
                  </div>
                  {request.payment_status === 'paid' && request.status !== 'completed' && (
                    <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="border-gray-300 dark:border-gray-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredRequests.length === 0 && (
          <div className="p-12 text-center">
            <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No requests found</p>
          </div>
        )}
      </div>
    </div>
  );
}
