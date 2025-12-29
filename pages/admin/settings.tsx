/**
 * Admin Settings Page
 * General settings and configuration hub
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Settings,
  User,
  Bell,
  Palette,
  DollarSign,
  Building,
  Mail,
  Phone,
  Globe,
  Shield,
  Key,
  Database,
  Zap,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<any>(null);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    dailyDigest: true,
    weeklyReport: false,
    autoResponder: false,
    timezone: 'America/Chicago',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    language: 'en',
    minimumTipAmount: '10.00' // Minimum tip/amount for song requests (default $10.00)
  });

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin?redirect=/admin/settings');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      // Fetch organization settings
      const { getCurrentOrganization } = await import('@/utils/organization-context');
      const org = await getCurrentOrganization(supabase);
      if (org) {
        setOrganization(org);
      }

      // Fetch user preferences (if stored)
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        setSettings(prev => ({
          ...prev,
          ...preferences
        }));
      }

      // Fetch admin settings (using admin_settings API)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/admin-settings?settingKey=minimum_tip_amount', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (response.ok) {
          const result = await response.json();
          if (result.settings?.minimum_tip_amount) {
            setSettings(prev => ({
              ...prev,
              minimumTipAmount: result.settings.minimum_tip_amount
            }));
          } else {
            // If no setting exists, default to $10.00
            setSettings(prev => ({
              ...prev,
              minimumTipAmount: '10.00'
            }));
          }
        } else {
          // If fetch fails, default to $10.00
          setSettings(prev => ({
            ...prev,
            minimumTipAmount: '10.00'
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Save user preferences (excluding admin settings)
      const { minimumTipAmount, ...preferences } = settings;
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Save admin settings (minimum tip amount)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const response = await fetch('/api/admin-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            settingKey: 'minimum_tip_amount',
            settingValue: minimumTipAmount
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save admin settings');
        }
      }

      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <PageLoadingWrapper isLoading={loading && !user} message="Loading settings...">
      <AdminLayout title="Settings" description="Admin Settings - M10 DJ Admin">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-[#fcba00]" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your account and system preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="mt-1" />
                </div>
                <div>
                  <Label>User ID</Label>
                  <Input value={user?.id || ''} disabled className="mt-1 font-mono text-xs" />
                </div>
                {organization && (
                  <div>
                    <Label>Organization</Label>
                    <Input value={organization.name || ''} disabled className="mt-1" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last changed: Never</p>
                  </div>
                  <Button variant="outline" size="sm">Change Password</Button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="minimumTipAmount">Minimum Tip Amount (Song Requests)</Label>
                  <div className="mt-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                    <Input
                      id="minimumTipAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={settings.minimumTipAmount}
                      onChange={(e) => setSettings(prev => ({ ...prev, minimumTipAmount: e.target.value }))}
                      className="pl-8"
                      placeholder="1.00"
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Minimum amount required for song request tips (in USD)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Database className="h-5 w-5" />
                Quick Links
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link href="/admin/branding">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Branding</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customize appearance</p>
                  </div>
                </Link>
                <Link href="/admin/pricing">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Pricing</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage packages</p>
                  </div>
                </Link>
                <Link href="/admin/organizations">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Organizations</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Multi-tenant settings</p>
                  </div>
                </Link>
                <Link href="/admin/notifications">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">System alerts</p>
                  </div>
                </Link>
                <Link href="/admin/automation">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Automation</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Workflows</p>
                  </div>
                </Link>
                <Link href="/admin/email">
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <Mail className="h-5 w-5 text-red-600 dark:text-red-400 mb-2" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Email Integration</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gmail setup</p>
                  </div>
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily summary emails</p>
                  </div>
                  <Switch
                    checked={settings.dailyDigest}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dailyDigest: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Report</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive weekly analytics report</p>
                  </div>
                  <Switch
                    checked={settings.weeklyReport}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReport: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Responder</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically respond to inquiries</p>
                  </div>
                  <Switch
                    checked={settings.autoResponder}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoResponder: checked }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Regional Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <Label>Timezone</Label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  </select>
                </div>
                <div>
                  <Label>Date Format</Label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <Label>Language</Label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                API & Integrations
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Stripe</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment processing</p>
                  </div>
                  <Link href="/onboarding/stripe-setup">
                    <Button variant="outline" size="sm">Configure</Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Gmail</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email integration</p>
                  </div>
                  <Link href="/admin/email">
                    <Button variant="outline" size="sm">Configure</Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Twilio</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">SMS messaging</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>Configure</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminLayout>
    </PageLoadingWrapper>
  );
}

