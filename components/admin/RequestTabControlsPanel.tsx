/**
 * Request Tab Controls Panel Component
 * Reusable component for both platform and organization request tab visibility controls
 */

'use client';

import { useState, useEffect } from 'react';
import { Music, Mic, Gift, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RequestTabControlsPanelProps {
  organizationId?: string | null;
  isPlatform?: boolean;
  onUpdate?: () => void;
}

export default function RequestTabControlsPanel({
  organizationId = null,
  isPlatform = false,
  onUpdate,
}: RequestTabControlsPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [songRequestEnabled, setSongRequestEnabled] = useState(true);
  const [shoutoutEnabled, setShoutoutEnabled] = useState(true);
  const [tipEnabled, setTipEnabled] = useState(true);
  const [notes, setNotes] = useState('');
  const [platformDefaults, setPlatformDefaults] = useState<any>(null);
  const [orgDefaults, setOrgDefaults] = useState<any>(null);
  const [effectiveDefaults, setEffectiveDefaults] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, [organizationId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await (await import('@supabase/auth-helpers-nextjs')).createClientComponentClient().auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'Not authenticated',
          variant: 'destructive',
        });
        return;
      }

      const url = organizationId
        ? `/api/admin/request-tabs?organizationId=${organizationId}`
        : '/api/admin/request-tabs';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch request tab settings');
      }

      const data = await response.json();
      setPlatformDefaults(data.platform);
      setOrgDefaults(data.organization);
      setEffectiveDefaults(data.effective);

      // Set current settings
      if (data.effective) {
        setSongRequestEnabled(data.effective.song_request_enabled ?? true);
        setShoutoutEnabled(data.effective.shoutout_enabled ?? true);
        setTipEnabled(data.effective.tip_enabled ?? true);
        setNotes(data.effective.notes || '');
      } else {
        // Defaults
        setSongRequestEnabled(true);
        setShoutoutEnabled(true);
        setTipEnabled(true);
      }
    } catch (error: any) {
      console.error('Error fetching request tab settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch request tab settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Ensure at least one tab is enabled
    if (!songRequestEnabled && !shoutoutEnabled && !tipEnabled) {
      toast({
        title: 'Error',
        description: 'At least one tab must be enabled',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await (await import('@supabase/auth-helpers-nextjs')).createClientComponentClient().auth.getSession();
      
      if (!session?.access_token) {
        toast({
          title: 'Error',
          description: 'Not authenticated',
          variant: 'destructive',
        });
        return;
      }

      const url = '/api/admin/request-tabs';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organizationId || null,
          song_request_enabled: songRequestEnabled,
          shoutout_enabled: shoutoutEnabled,
          tip_enabled: tipEnabled,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request tab settings');
      }

      toast({
        title: 'Success',
        description: isPlatform
          ? 'Platform request tab settings updated successfully'
          : 'Organization request tab settings updated successfully',
      });

      await fetchSettings();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error saving request tab settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save request tab settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          {isPlatform ? 'Platform Request Tab Controls' : 'Organization Request Tab Controls'}
        </CardTitle>
        <CardDescription>
          {isPlatform
            ? 'Control which tabs (Song Request, Shoutout, Tip) are visible on the requests page for all organizations.'
            : 'Control which tabs (Song Request, Shoutout, Tip) are visible on your requests page. These settings override platform defaults.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {effectiveDefaults && (
          <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Current Active Tabs: {
                  [
                    effectiveDefaults.song_request_enabled && 'Song Request',
                    effectiveDefaults.shoutout_enabled && 'Shoutout',
                    effectiveDefaults.tip_enabled && 'Tip',
                  ].filter(Boolean).join(', ') || 'None (at least one will be enabled)'
                }
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {orgDefaults
                  ? 'Using organization-specific settings (overrides platform default)'
                  : 'Using platform default settings'}
              </p>
              {effectiveDefaults.updated_at && (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  Last updated: {new Date(effectiveDefaults.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab Toggles */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Request Tab Visibility</Label>
          
          <div className="space-y-4">
            {/* Song Request Tab */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <Music className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
                </div>
                <div>
                  <Label htmlFor="song-request-toggle" className="text-sm font-medium">
                    Song Request Tab
                  </Label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Allow users to request songs
                  </p>
                </div>
              </div>
              <Switch
                id="song-request-toggle"
                checked={songRequestEnabled}
                onCheckedChange={setSongRequestEnabled}
              />
            </div>

            {/* Shoutout Tab */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <Mic className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
                </div>
                <div>
                  <Label htmlFor="shoutout-toggle" className="text-sm font-medium">
                    Shoutout Tab
                  </Label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Allow users to send shoutouts
                  </p>
                </div>
              </div>
              <Switch
                id="shoutout-toggle"
                checked={shoutoutEnabled}
                onCheckedChange={setShoutoutEnabled}
              />
            </div>

            {/* Tip Tab */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <Gift className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
                </div>
                <div>
                  <Label htmlFor="tip-toggle" className="text-sm font-medium">
                    Tip Tab
                  </Label>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Allow users to send tips
                  </p>
                </div>
              </div>
              <Switch
                id="tip-toggle"
                checked={tipEnabled}
                onCheckedChange={setTipEnabled}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about why these settings were changed..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Warning if all disabled */}
        {!songRequestEnabled && !shoutoutEnabled && !tipEnabled && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-50">
                Warning: All Tabs Disabled
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                At least one tab must be enabled. The Song Request tab will be enabled automatically if you try to save with all tabs disabled.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
