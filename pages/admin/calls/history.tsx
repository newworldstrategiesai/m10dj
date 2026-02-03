/**
 * Call history – emulates clicksetgo call-logs UI.
 * Lists voice_calls with search, filter tabs, sortable table, mobile cards,
 * and call detail dialog (Overview, Recording, Transcript, History).
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import {
  ArrowLeft,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneForwarded,
  ArrowDownLeft,
  ArrowUpRight,
  PlayCircle,
  Calendar,
  Clock,
  User,
  Info,
  MessageSquare,
  DownloadCloud,
  RotateCcw,
  Disc,
  X,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface ContactRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface VoiceCall {
  id: string;
  room_name: string;
  contact_id: string | null;
  client_phone: string | null;
  direction: 'inbound' | 'outbound';
  status: string;
  call_type: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  transcript: string | null;
  recording_url: string | null;
  contacts?: ContactRow | null;
}

type FilterTab = 'all' | 'transferred' | 'successful' | 'failed';

function CallTypeBadge({ direction }: { direction: 'inbound' | 'outbound' }) {
  if (direction === 'inbound') {
    return (
      <Badge
        variant="outline"
        className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
      >
        <ArrowDownLeft className="h-3 w-3 mr-1" />
        Inbound
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
    >
      <ArrowUpRight className="h-3 w-3 mr-1" />
      Outbound
    </Badge>
  );
}

export default function CallHistoryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [selectedCall, setSelectedCall] = useState<VoiceCall | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<FilterTab>('all');
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) return;
        if (error || !user) {
          router.push('/signin');
          return;
        }
        const { isPlatformAdmin } = await import('@/utils/auth-helpers/platform-admin');
        const { canAccessAdminPage } = await import('@/utils/subscription-access');
        const isAdmin = isPlatformAdmin(user.email);
        if (!isAdmin) {
          const access = await canAccessAdminPage(supabase as any, user.email, 'contacts');
          if (!access.canAccess) {
            router.push('/admin/dashboard-starter');
            return;
          }
        }
        if (isMounted) setUser(user);
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return;
        console.error(e);
        router.push('/signin');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [router, supabase]);

  useEffect(() => {
    if (!user) return;
    const fetchCalls = async () => {
      const { data, error } = await supabase
        .from('voice_calls')
        .select(
          `
          id, room_name, contact_id, client_phone, direction, status, call_type,
          duration_seconds, started_at, ended_at, created_at, transcript, recording_url,
          contacts ( id, first_name, last_name )
        `
        )
        .order('created_at', { ascending: false })
        .limit(500);
      if (!error) setCalls((data as VoiceCall[]) ?? []);
    };
    fetchCalls();
  }, [user, supabase]);

  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return '—';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const getContactName = (call: VoiceCall) => {
    const c = call.contacts;
    if (!c) return null;
    const parts = [c.first_name, c.last_name].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  };

  const formatDuration = (sec: number | null) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const getFilterTabCounts = useCallback(() => {
    if (!calls.length) return { all: 0, transferred: 0, successful: 0, failed: 0 };
    const successful = calls.filter((c) => c.status === 'completed').length;
    const failed = calls.filter((c) => c.status === 'failed' || c.status === 'missed').length;
    return {
      all: calls.length,
      transferred: 0,
      successful,
      failed,
    };
  }, [calls]);

  const getFilteredCalls = useCallback(() => {
    let list = [...calls];
    if (activeFilterTab === 'successful') {
      list = list.filter((c) => c.status === 'completed');
    } else if (activeFilterTab === 'failed') {
      list = list.filter((c) => c.status === 'failed' || c.status === 'missed');
    } else if (activeFilterTab === 'transferred') {
      list = [];
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const name = getContactName(c) ?? '';
        const phone = c.client_phone ?? '';
        const transcript = c.transcript ?? '';
        return (
          name.toLowerCase().includes(q) ||
          phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
          transcript.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [calls, activeFilterTab, searchQuery]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredCalls = useMemo(() => {
    const list = getFilteredCalls();
    if (!sortColumn) return list;
    return [...list].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortColumn) {
        case 'type':
          va = a.direction;
          vb = b.direction;
          break;
        case 'number':
          va = a.client_phone ?? '';
          vb = b.client_phone ?? '';
          break;
        case 'name':
          va = getContactName(a) ?? '';
          vb = getContactName(b) ?? '';
          break;
        case 'date':
          va = new Date(a.started_at ?? a.created_at).getTime();
          vb = new Date(b.started_at ?? b.created_at).getTime();
          break;
        case 'status':
          va = a.status;
          vb = b.status;
          break;
        case 'duration':
          va = a.duration_seconds ?? 0;
          vb = b.duration_seconds ?? 0;
          break;
        default:
          return 0;
      }
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [getFilteredCalls, sortColumn, sortDirection]);

  const getRelatedCalls = (current: VoiceCall) => {
    const phone = current.client_phone;
    if (!phone) return [];
    return calls
      .filter((c) => c.id !== current.id && c.client_phone === phone)
      .sort((a, b) => {
        const ta = new Date(a.started_at ?? a.created_at).getTime();
        const tb = new Date(b.started_at ?? b.created_at).getTime();
        return tb - ta;
      });
  };

  const exportToCSV = useCallback(() => {
    const list = sortedAndFilteredCalls;
    if (!list.length) return;
    const headers = ['Call ID', 'Type', 'Customer Phone', 'Contact Name', 'Start Time', 'Duration', 'Status'];
    const rows = list.map((c) => [
      c.id,
      c.direction,
      c.client_phone ?? '',
      getContactName(c) ?? '',
      c.started_at ? new Date(c.started_at).toLocaleString() : '',
      formatDuration(c.duration_seconds),
      c.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `call-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [sortedAndFilteredCalls]);

  const handleCloseCallDetails = useCallback(() => {
    setSelectedCall(null);
  }, []);

  const counts = getFilterTabCounts();

  if (loading || !user) {
    return (
      <AdminLayout title="Call history" description="Past voice calls">
        <PageLoadingWrapper isLoading={true} message="Loading call history...">
          <div className="min-h-[40vh]" />
        </PageLoadingWrapper>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Call history"
      description="Past inbound and outbound calls"
      showPageTitle
      pageTitle="Call history"
      pageDescription="View past calls, duration, transcripts, and recordings."
    >
      <div className="container mx-auto p-3 md:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/calls">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Calls
            </Link>
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            Call History
          </h1>
          <p className="text-muted-foreground mt-2">View and manage your conversation history</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-0 border-b border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold">Call Logs</CardTitle>
                  <CardDescription className="mt-1">View and manage call logs for your account.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
                    <DownloadCloud className="h-4 w-4" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Search */}
            <div className="px-3 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name, number, or transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
              <div className="flex items-center px-3 sm:px-6 min-w-max">
                {(
                  [
                    { key: 'all' as const, label: 'All Calls', icon: Phone, shortLabel: 'All' },
                    { key: 'transferred' as const, label: 'Transferred', icon: PhoneForwarded, shortLabel: 'Transfer' },
                    { key: 'successful' as const, label: 'Successful', icon: TrendingUp, shortLabel: 'Success' },
                    { key: 'failed' as const, label: 'Failed', icon: X, shortLabel: 'Failed' },
                  ] as const
                ).map(({ key, label, icon: Icon, shortLabel }) => {
                  const count = counts[key];
                  const isActive = activeFilterTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveFilterTab(key)}
                      className={cn(
                        'flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 border-b-2 transition-all whitespace-nowrap',
                        isActive
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base hidden sm:inline">{label}</span>
                      <span className="font-medium text-sm sm:hidden">{shortLabel}</span>
                      <span
                        className={cn(
                          'text-xs px-1.5 sm:px-2 py-0.5 rounded-full',
                          isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <CardContent className="pt-4 md:pt-6 px-3 md:px-6 pb-6">
              {/* Mobile cards */}
              <div className="block md:hidden">
                {sortedAndFilteredCalls.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <Phone className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No call logs found</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {sortedAndFilteredCalls.map((call) => (
                      <Card
                        key={call.id}
                        className={cn(
                          'overflow-hidden cursor-pointer border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all',
                          selectedCall?.id === call.id && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        )}
                        onClick={() => setSelectedCall(call)}
                      >
                        <div className="px-4 pt-3 pb-2 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-gray-100 dark:border-gray-800">
                          <div className="flex justify-between items-center">
                            <CallTypeBadge direction={call.direction} />
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {getRelativeTime(call.started_at ?? call.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                              {getContactName(call)?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              {getContactName(call) && (
                                <div className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                  {getContactName(call)}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                {formatPhoneNumber(call.client_phone)}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                              <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                  {formatDuration(call.duration_seconds)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                              <Info className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                  {call.status}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {call.recording_url && (
                          <div className="px-4 pb-3">
                            <Button
                              variant="outline"
                              className="w-full h-11 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(call.recording_url!, '_blank');
                              }}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Play Recording
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center gap-1">
                          Type
                          {sortColumn === 'type' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort('number')}
                      >
                        <div className="flex items-center gap-1">
                          Customer Phone Number
                          {sortColumn === 'number' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          Start Time
                          {sortColumn === 'date' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center gap-1">
                          Duration
                          {sortColumn === 'duration' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                      <th
                        className="text-left px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortColumn === 'status' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAndFilteredCalls.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                          No call logs found
                        </td>
                      </tr>
                    ) : (
                      sortedAndFilteredCalls.map((call) => (
                        <tr
                          key={call.id}
                          data-call-id={call.id}
                          className={cn(
                            'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer',
                            selectedCall?.id === call.id && 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500'
                          )}
                          onClick={() => setSelectedCall(call)}
                        >
                          <td className="px-4 py-3">
                            <CallTypeBadge direction={call.direction} />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {formatPhoneNumber(call.client_phone)}
                            {getContactName(call) && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{getContactName(call)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {call.started_at
                              ? new Date(call.started_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                            {formatDuration(call.duration_seconds)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={cn(
                                call.status === 'completed' && 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
                                (call.status === 'failed' || call.status === 'missed') && 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
                                (call.status === 'ringing' || call.status === 'connected') && 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              )}
                            >
                              {call.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call Details Dialog */}
        <Dialog open={!!selectedCall} onOpenChange={(open) => !open && handleCloseCallDetails()}>
          <DialogContent
            className={cn(
              'sm:max-w-md md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col',
              'bg-white dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800'
            )}
          >
            <DialogTitle className="sr-only">
              {selectedCall ? `${selectedCall.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call Details` : 'Call Details'}
            </DialogTitle>
            {selectedCall && (
              <div className="flex flex-col overflow-hidden -m-6">
                {/* Header with gradient */}
                <div
                  className={cn(
                    'p-4 sm:p-6 text-white',
                    selectedCall.direction === 'inbound'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800'
                      : 'bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 rounded-full p-2">
                        {selectedCall.direction === 'inbound' ? (
                          <ArrowDownLeft className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold">
                          {selectedCall.direction === 'inbound' ? 'Inbound' : 'Outbound'} Call
                        </h3>
                        <DialogDescription className="text-white/80 mt-1 text-sm">
                          {getRelativeTime(selectedCall.started_at ?? selectedCall.created_at)}
                        </DialogDescription>
                      </div>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/10 backdrop-blur-md">{selectedCall.status}</Badge>
                  </div>
                </div>

                {/* Customer & Duration */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-gray-100 dark:bg-gray-800">
                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          {getContactName(selectedCall)?.charAt(0).toUpperCase() ?? <User className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                        {selectedCall.contact_id && (
                          <Link
                            href={`/admin/contacts/${selectedCall.contact_id}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                              {getContactName(selectedCall) || 'Contact'}
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                        )}
                        <p className={cn('text-sm', getContactName(selectedCall) && 'text-gray-500 dark:text-gray-400')}>
                          {formatPhoneNumber(selectedCall.client_phone)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                        <p className="font-medium">{formatDuration(selectedCall.duration_seconds)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                  <div className="border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6">
                    <TabsList className="p-0 h-12 bg-transparent w-full justify-start rounded-none border-0">
                      <TabsTrigger
                        value="overview"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 rounded-none h-12"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Overview
                      </TabsTrigger>
                      {selectedCall.recording_url && (
                        <TabsTrigger
                          value="recording"
                          className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 rounded-none h-12"
                        >
                          <Disc className="h-4 w-4 mr-2" />
                          Recording
                        </TabsTrigger>
                      )}
                      {(selectedCall.transcript || selectedCall.recording_url) && (
                        <TabsTrigger
                          value="transcript"
                          className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 rounded-none h-12"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Transcript
                        </TabsTrigger>
                      )}
                      {selectedCall.client_phone && (
                        <TabsTrigger
                          value="history"
                          className="data-[state=active]:border-b-2 data-[state=active]:border-gray-900 dark:data-[state=active]:border-gray-100 rounded-none h-12"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          History
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1">
                    <TabsContent value="overview" className="p-4 sm:p-6 mt-0">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Technical Details
                          </h3>
                          <div className="p-4 space-y-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Call ID</span>
                              <span className="font-mono text-xs">{selectedCall.id.slice(0, 8)}...</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Room</span>
                              <span className="font-mono text-xs">{selectedCall.room_name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-700 dark:text-gray-300">Status</span>
                              <span className="font-medium capitalize">{selectedCall.status}</span>
                            </div>
                            {selectedCall.started_at && (
                              <div className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300">Started</span>
                                <span className="font-medium">{new Date(selectedCall.started_at).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    {selectedCall.recording_url && (
                      <TabsContent value="recording" className="p-4 sm:p-6 mt-0">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Disc className="h-4 w-4" />
                            Call Recording
                          </h3>
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <audio controls className="w-full" src={selectedCall.recording_url}>
                              Your browser does not support the audio element.
                            </audio>
                            <div className="mt-4 flex justify-center">
                              <Button
                                variant="outline"
                                onClick={() => window.open(selectedCall.recording_url!, '_blank')}
                                className="gap-2"
                              >
                                <DownloadCloud className="h-4 w-4" />
                                Download Recording
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    )}
                    <TabsContent value="transcript" className="p-4 sm:p-6 mt-0">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Transcript
                        </h3>
                        {selectedCall.transcript ? (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                            <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                              {selectedCall.transcript}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No transcript available.</p>
                        )}
                      </div>
                    </TabsContent>
                    {selectedCall.client_phone && (
                      <TabsContent value="history" className="p-4 sm:p-6 mt-0">
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Call History for {formatPhoneNumber(selectedCall.client_phone)}
                          </h3>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-800">
                            {getRelatedCalls(selectedCall).length > 0 ? (
                              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {getRelatedCalls(selectedCall).map((call) => (
                                  <div
                                    key={call.id}
                                    className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-2"
                                  >
                                    <div className="flex items-center gap-3">
                                      <CallTypeBadge direction={call.direction} />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {getRelativeTime(call.started_at ?? call.created_at)}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedCall(call)}
                                      className="text-xs"
                                    >
                                      View Call
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                <RotateCcw className="h-5 w-5 mx-auto mb-2 opacity-50" />
                                <p>No previous call history with this customer</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </ScrollArea>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
