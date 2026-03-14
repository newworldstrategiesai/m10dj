'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-helpers';
import { Loader2, ExternalLink } from 'lucide-react';

interface DoorSale {
  id: string;
  purchaser_name: string;
  purchaser_email: string | null;
  quantity: number;
  total_amount: number;
  qr_code: string;
  payment_status: string;
  created_at: string;
}

export default function AdminDoorSalesPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<{ id: string; slug: string } | null>(null);
  const [sales, setSales] = useState<DoorSale[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/signin?redirect=${encodeURIComponent('/admin/door-sales')}`);
          return;
        }

        const org = await getCurrentOrganization(supabase);
        if (cancelled || !org) return;

        setOrganization(org as { id: string; slug: string });

        const res = await fetch('/api/door/sales?limit=100');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        if (!cancelled) {
          setSales(data.sales || []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        console.error('[door-sales] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_amount), 0);

  if (loading || !organization) {
    return (
      <AdminLayout title="Door Sales" description="View door ticket sales">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const doorUrl = `${baseUrl}/${organization.slug}/door`;

  return (
    <AdminLayout
      title="Door Sales"
      description="Recent walk-up ticket sales"
      showPageTitle
      pageTitle="Door Sales"
      pageDescription="Recent door ticket purchases. Use the door page URL for walk-up sales."
    >
      <div className="max-w-4xl space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Summary</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Total sales</span>
              <p className="text-xl font-semibold text-foreground">{sales.length}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Revenue (shown)</span>
              <p className="text-xl font-semibold text-foreground">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
          <a
            href={doorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Open door page
          </a>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <h2 className="text-lg font-semibold text-foreground p-4 border-b">Recent sales</h2>
          {sales.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No door sales yet. Share your door page to start selling.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Quantity</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                    <th className="text-left p-3 font-medium">Code</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground">{formatDate(s.created_at)}</td>
                      <td className="p-3">
                        <span className="font-medium">{s.purchaser_name || 'Walk-up'}</span>
                        {s.purchaser_email && (
                          <span className="block text-xs text-muted-foreground">{s.purchaser_email}</span>
                        )}
                      </td>
                      <td className="p-3">{s.quantity}</td>
                      <td className="p-3 text-right font-medium">${Number(s.total_amount).toFixed(2)}</td>
                      <td className="p-3 font-mono text-xs">{s.qr_code}</td>
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
