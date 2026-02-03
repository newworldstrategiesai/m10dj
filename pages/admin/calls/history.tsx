/**
 * Call history – list of voice_calls (inbound/outbound) with duration and recordings.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import { ArrowLeft, Phone, PhoneIncoming, PhoneOutgoing, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
}

export default function CallHistoryPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        .select('id, room_name, contact_id, client_phone, direction, status, call_type, duration_seconds, started_at, ended_at, created_at, transcript, recording_url')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error) setCalls((data as VoiceCall[]) ?? []);
    };
    fetchCalls();
  }, [user, supabase]);

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (sec: number | null) => {
    if (sec == null) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusVariant = (status: string) => {
    if (status === 'completed') return 'default';
    if (status === 'ringing' || status === 'connected') return 'secondary';
    if (status === 'failed' || status === 'missed') return 'destructive';
    return 'outline';
  };

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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/calls">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Calls
            </Link>
          </Button>
        </div>

        {calls.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-muted-foreground dark:border-border dark:bg-muted/20">
            <Phone className="mx-auto mb-2 h-10 w-10 opacity-50" />
            <p>No calls yet.</p>
            <p className="mt-1 text-sm">Use the Dialer to make outbound calls, or answer incoming calls from the overlay.</p>
            <Button asChild className="mt-4">
              <Link href="/dialer">Open Dialer</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card dark:border-border dark:bg-card overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 dark:bg-muted/20">
                  <th className="w-[140px] text-left px-4 py-3 text-sm font-medium text-muted-foreground">Date & time</th>
                  <th className="w-[100px] text-left px-4 py-3 text-sm font-medium text-muted-foreground">Direction</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Phone / contact</th>
                  <th className="w-[100px] text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="w-[80px] text-right px-4 py-3 text-sm font-medium text-muted-foreground">Duration</th>
                  <th className="w-[80px] px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <React.Fragment key={call.id}>
                    <tr
                      className={cn(
                        'border-b border-border',
                        (call.transcript || call.recording_url) && 'cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/20'
                      )}
                      onClick={() =>
                        (call.transcript || call.recording_url) &&
                        setExpandedId(expandedId === call.id ? null : call.id)
                      }
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(call.started_at ?? call.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {call.direction === 'inbound' ? (
                          <PhoneIncoming className="h-4 w-4 inline text-blue-500 dark:text-blue-400" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 inline text-green-600 dark:text-green-500" />
                        )}
                        <span className="sr-only">{call.direction}</span>
                        <span className="ml-1 text-sm capitalize align-middle">{call.direction}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{call.client_phone ?? '—'}</span>
                        {call.contact_id && (
                          <Link
                            href={`/admin/contacts/${call.contact_id}`}
                            className="ml-2 text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View contact
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(call.status)}>{call.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sm">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        {(call.transcript || call.recording_url) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(expandedId === call.id ? null : call.id);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expandedId === call.id && (
                      <tr className="bg-muted/30 dark:bg-muted/10 border-b border-border">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="space-y-2 pl-4 border-l-2 border-border">
                            {call.recording_url && (
                              <p className="flex items-center gap-2 text-sm">
                                <ExternalLink className="h-4 w-4 shrink-0" />
                                <a
                                  href={call.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Listen to recording
                                </a>
                              </p>
                            )}
                            {call.transcript && (
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Transcript:</span>
                                <p className="mt-1 whitespace-pre-wrap">{call.transcript}</p>
                              </div>
                            )}
                            {!call.transcript && !call.recording_url && (
                              <p className="text-sm text-muted-foreground">No transcript or recording.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
