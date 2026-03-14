'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClient } from '@/utils/supabase/client';
import { getCurrentOrganization } from '@/utils/organization-helpers';
import { Save, Loader2, CheckCircle, ExternalLink, DollarSign, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface DoorSettings {
  enabled?: boolean;
  price_cents?: number;
  venue_display?: string;
  max_quantity_per_transaction?: number;
}

export default function AdminDoorSettingsPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [settings, setSettings] = useState<DoorSettings>({
    enabled: false,
    price_cents: 1500,
    venue_display: '',
    max_quantity_per_transaction: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace(`/signin?redirect=${encodeURIComponent('/admin/door-settings')}`);
          return;
        }

        const org = await getCurrentOrganization(supabase);
        if (cancelled || !org) return;

        setOrganization(org);
        const ds = (org as any).door_settings as DoorSettings | null;
        if (ds) {
          setSettings({
            enabled: ds.enabled ?? false,
            price_cents: ds.price_cents ?? 1500,
            venue_display: ds.venue_display ?? '',
            max_quantity_per_transaction: ds.max_quantity_per_transaction ?? 10,
          });
        }
      } catch (err) {
        console.error('[door-settings] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [router]);

  const handleSave = async () => {
    if (!organization) return;
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({
          door_settings: {
            enabled: settings.enabled,
            price_cents: settings.price_cents,
            venue_display: settings.venue_display?.trim() || null,
            max_quantity_per_transaction: settings.max_quantity_per_transaction,
          },
        })
        .eq('id', organization.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error('[door-settings] save error:', err);
      alert(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://tipjar.live');
  const doorUrl = organization?.slug ? `${baseUrl}/${organization.slug}/door` : '';

  if (loading || !organization) {
    return (
      <AdminLayout title="Door Settings" description="Configure walk-up ticket sales">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Door Tickets"
      description="Sell walk-up tickets at the door"
      showPageTitle
      pageTitle="Door Settings"
      pageDescription="Configure your door ticket sales page. Customers pay by card at the door."
    >
      <div className="max-w-2xl space-y-8">
        <div className="rounded-xl border bg-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Enable door sales</h2>
              <p className="text-sm text-muted-foreground">Allow walk-up customers to buy tickets at the door</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, enabled: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Door price (USD)
            </Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={(settings.price_cents ?? 1500) / 100}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSettings((s) => ({ ...s, price_cents: isNaN(v) ? 1500 : Math.round(v * 100) }));
              }}
              className="max-w-[140px]"
            />
            <p className="text-xs text-muted-foreground">Price per ticket in dollars</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Venue name or location
            </Label>
            <Input
              id="venue"
              placeholder="e.g. Silky O'Sullivans, 123 Main St"
              value={settings.venue_display ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, venue_display: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Shown in the door page header</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxqty">Max tickets per transaction</Label>
            <Input
              id="maxqty"
              type="number"
              min="1"
              max="50"
              value={settings.max_quantity_per_transaction ?? 10}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setSettings((s) => ({ ...s, max_quantity_per_transaction: isNaN(v) ? 10 : Math.max(1, Math.min(50, v)) }));
              }}
              className="max-w-[100px]"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
            {saved && <CheckCircle className="w-4 h-4 text-green-500" />}
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Door page URL</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share this link so customers can pay at the door. Works on mobile for card payments.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <code className="px-3 py-2 rounded-lg bg-muted text-foreground text-sm font-mono break-all">
              {doorUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={doorUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
