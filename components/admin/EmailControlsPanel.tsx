/**
 * Email Controls Panel Component
 * Reusable component for both platform and organization email controls
 */

'use client';

import { useState, useEffect } from 'react';
import { Mail, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type EmailControlMode = 'all' | 'admin_dev_only' | 'critical_only' | 'disabled';

interface EmailControlsPanelProps {
  organizationId?: string | null;
  isPlatform?: boolean;
  onUpdate?: () => void;
}

export default function EmailControlsPanel({
  organizationId = null,
  isPlatform = false,
  onUpdate,
}: EmailControlsPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [controlMode, setControlMode] = useState<EmailControlMode>('all');
  const [notes, setNotes] = useState('');
  const [platformControl, setPlatformControl] = useState<any>(null);
  const [orgControl, setOrgControl] = useState<any>(null);
  const [effectiveControl, setEffectiveControl] = useState<any>(null);

  useEffect(() => {
    fetchControls();
  }, [organizationId]);

  const fetchControls = async () => {
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
        ? `/api/admin/email-controls?organizationId=${organizationId}`
        : '/api/admin/email-controls';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email controls');
      }

      const data = await response.json();
      setPlatformControl(data.platform);
      setOrgControl(data.organization);
      setEffectiveControl(data.effective);

      // Set current control mode
      if (data.effective) {
        setControlMode(data.effective.control_mode);
        setNotes(data.effective.notes || '');
      } else if (data.platform) {
        setControlMode(data.platform.control_mode);
        setNotes(data.platform.notes || '');
      }
    } catch (error: any) {
      console.error('Error fetching email controls:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch email controls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

      const url = '/api/admin/email-controls';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: organizationId || null,
          control_mode: controlMode,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update email controls');
      }

      toast({
        title: 'Success',
        description: isPlatform
          ? 'Platform email controls updated successfully'
          : 'Organization email controls updated successfully',
      });

      await fetchControls();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error saving email controls:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save email controls',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getModeDescription = (mode: EmailControlMode) => {
    switch (mode) {
      case 'all':
        return 'All emails are allowed (normal production mode)';
      case 'admin_dev_only':
        return 'Only admin/development emails are allowed. Customer emails are blocked.';
      case 'critical_only':
        return 'Only critical system emails (auth, security) are allowed. All other emails are blocked.';
      case 'disabled':
        return 'All emails are disabled except critical system emails.';
      default:
        return '';
    }
  };

  const getModeIcon = (mode: EmailControlMode) => {
    switch (mode) {
      case 'all':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'admin_dev_only':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical_only':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'disabled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
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
          <Mail className="h-5 w-5" />
          {isPlatform ? 'Platform Email Controls' : 'Organization Email Controls'}
        </CardTitle>
        <CardDescription>
          {isPlatform
            ? 'Control email communications for the entire platform. These settings apply to all organizations unless they have custom settings.'
            : 'Control email communications for this organization. These settings override platform defaults.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        {effectiveControl && (
          <div className="flex items-start gap-3 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Info className="h-5 w-5 text-zinc-600 dark:text-zinc-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Current Status: {effectiveControl.control_mode === 'all' ? 'All Emails Enabled' : 
                                 effectiveControl.control_mode === 'admin_dev_only' ? 'Admin/Dev Only' :
                                 effectiveControl.control_mode === 'critical_only' ? 'Critical Only' :
                                 'Disabled'}
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {orgControl
                  ? 'Using organization-specific setting (overrides platform default)'
                  : 'Using platform default setting'}
              </p>
              {effectiveControl.updated_at && (
                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                  Last updated: {new Date(effectiveControl.updated_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Control Mode Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">Email Control Mode</Label>
          
          <div className="space-y-3">
            {(['all', 'admin_dev_only', 'critical_only', 'disabled'] as EmailControlMode[]).map((mode) => (
              <label
                key={mode}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  controlMode === mode
                    ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="controlMode"
                  value={mode}
                  checked={controlMode === mode}
                  onChange={(e) => setControlMode(e.target.value as EmailControlMode)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getModeIcon(mode)}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50 capitalize">
                      {mode.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {getModeDescription(mode)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about why this setting was changed..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Warning for restrictive modes */}
        {(controlMode === 'admin_dev_only' || controlMode === 'critical_only' || controlMode === 'disabled') && (
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-50">
                Warning: Restrictive Mode Active
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                {controlMode === 'admin_dev_only' && 'Customer emails will be blocked. Only admin/development emails will be sent.'}
                {controlMode === 'critical_only' && 'Only critical system emails (authentication, security) will be sent. All other emails will be blocked.'}
                {controlMode === 'disabled' && 'All emails except critical system emails will be blocked. This may affect user experience.'}
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
