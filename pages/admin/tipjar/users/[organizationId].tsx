'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/router';
import Link from 'next/link';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  DollarSign,
  Receipt,
  Percent,
  Calendar,
  Activity,
  CreditCard,
  CheckCircle,
  XCircle,
  Music,
  MessageCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserDetailData {
  organization: {
    id: string;
    slug: string;
    name: string;
    profileUrl: string;
    created_at: string;
    is_claimed: boolean;
    claimed_at: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    trial_ends_at: string | null;
    stripe_connect_account_id: string | null;
    stripe_connect_charges_enabled: boolean | null;
    stripe_connect_payouts_enabled: boolean | null;
  };
  owner: { id: string; email: string; username: string };
  metrics: {
    total_requests: number;
    paid_requests: number;
    pending_requests: number;
    revenue_cents: number;
    revenue_dollars: string;
    platform_fees_cents: number;
    platform_fees_dollars: string;
    last_activity_at: string | null;
  };
  unclaimed_balance: {
    total_amount_cents: number;
    total_fees_cents: number;
    net_amount_cents: number;
    tip_count: number;
    first_tip_at: string | null;
    last_tip_at: string | null;
    is_transferred: boolean;
  } | null;
  recent_requests: Array<{
    id: string;
    request_type: string;
    payment_status: string;
    amount_paid_cents: number | null;
    requester_name: string;
    song_title: string | null;
    song_artist: string | null;
    status: string;
    created_at: string;
    paid_at: string | null;
  }>;
}

export default function TipJarUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const organizationId = params?.organizationId as string | undefined;
  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.push('/signin');
          return;
        }
        setIsSuperAdmin(isSuperAdminEmail(user.email));
        if (!isSuperAdminEmail(user.email)) {
          toast({ title: 'Access Denied', description: 'This page is only available to super admins', variant: 'destructive' });
          router.push('/admin/crowd-requests');
        }
      } catch (e) {
        console.error(e);
        router.push('/signin');
      } finally {
        setAuthLoading(false);
      }
    };
    check();
  }, [router, supabase.auth, toast]);

  useEffect(() => {
    if (!organizationId || !isSuperAdmin || authLoading) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/tipjar/users/${organizationId}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast({ title: 'Not found', description: 'User or organization not found', variant: 'destructive' });
            router.push('/admin/tipjar/users');
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load');
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Failed to load user', variant: 'destructive' });
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [organizationId, isSuperAdmin, authLoading, router, toast]);

  if (authLoading || !isSuperAdmin) {
    return (
      <AdminLayout title="User Detail" description="TipJar user details">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (loading && !data) {
    return (
      <AdminLayout title="User Detail" description="Loading...">
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="User Detail" description="Not found">
        <div className="space-y-4">
          <Link href="/admin/tipjar/users">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </Link>
          <p className="text-muted-foreground">User not found.</p>
        </div>
      </AdminLayout>
    );
  }

  const { organization, owner, metrics, unclaimed_balance, recent_requests } = data;

  return (
    <AdminLayout
      title={`${owner.username || organization.name} – TipJar User`}
      description={`Details for ${organization.name}`}
    >
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex flex-col gap-4">
          <Link href="/admin/tipjar/users">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{owner.username || organization.name}</h1>
              <p className="text-muted-foreground">{owner.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {organization.name}
                {organization.slug && (
                  <span className="ml-2 text-muted-foreground/80">/{organization.slug}</span>
                )}
              </p>
            </div>
            <a
              href={organization.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              View profile
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total requests</p>
                <p className="text-2xl font-bold text-foreground">{metrics.total_requests}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.paid_requests} paid · {metrics.pending_requests} pending
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-foreground">${metrics.revenue_dollars}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform fees collected</p>
                <p className="text-2xl font-bold text-foreground">${metrics.platform_fees_dollars}</p>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last activity</p>
                <p className="text-sm font-medium text-foreground">
                  {metrics.last_activity_at
                    ? new Date(metrics.last_activity_at).toLocaleDateString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Account & subscription */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Account & billing</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Member since</span>
              <span className="text-foreground">
                {organization.created_at
                  ? new Date(organization.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })
                  : '—'}
              </span>
            </div>
            {organization.claimed_at && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Claimed</span>
                <span className="text-foreground">
                  {new Date(organization.claimed_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
            )}
            {organization.subscription_tier && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Plan</span>
                <Badge variant="secondary">{organization.subscription_tier}</Badge>
                {organization.subscription_status && (
                  <span className="text-muted-foreground">({organization.subscription_status})</span>
                )}
              </div>
            )}
            {organization.stripe_connect_account_id ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-foreground">Stripe Connect</span>
                {organization.stripe_connect_charges_enabled && (
                  <Badge variant="outline" className="text-green-600 border-green-600">Charges</Badge>
                )}
                {organization.stripe_connect_payouts_enabled && (
                  <Badge variant="outline" className="text-green-600 border-green-600">Payouts</Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Stripe Connect not set up</span>
              </div>
            )}
          </div>
        </div>

        {/* Unclaimed balance (if any) */}
        {unclaimed_balance && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Unclaimed tip balance</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total tips</p>
                <p className="font-medium text-foreground">${(unclaimed_balance.total_amount_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platform fees</p>
                <p className="font-medium text-foreground">${(unclaimed_balance.total_fees_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net (claimable)</p>
                <p className="font-medium text-foreground">${(unclaimed_balance.net_amount_cents / 100).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tip count</p>
                <p className="font-medium text-foreground">{unclaimed_balance.tip_count}</p>
              </div>
            </div>
            {unclaimed_balance.is_transferred && (
              <p className="text-xs text-muted-foreground mt-2">Balance has been transferred to connected account.</p>
            )}
          </div>
        )}

        {/* Recent requests */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground p-4 pb-0">Recent requests</h2>
          {recent_requests.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium text-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Requester</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground hidden sm:table-cell">Song / Details</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Amount</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_requests.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 text-sm">
                        {r.request_type === 'song_request' ? (
                          <span className="inline-flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            Song
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Shoutout
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-foreground">{r.requester_name || '—'}</td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {r.song_title ? `${r.song_artist || ''} – ${r.song_title}`.trim() || '—' : '—'}
                      </td>
                      <td className="p-3 text-sm text-foreground">
                        {r.amount_paid_cents != null ? `$${(r.amount_paid_cents / 100).toFixed(2)}` : '—'}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={r.payment_status === 'paid' ? 'default' : 'secondary'}
                          className={r.payment_status === 'paid' ? 'bg-green-600' : ''}
                        >
                          {r.payment_status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: 'short' }) : '—'}
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
