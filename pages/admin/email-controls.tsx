/**
 * Platform Email Controls Page
 * Super admin only - controls platform-wide email settings
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Mail, Shield, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import EmailControlsPanel from '@/components/admin/EmailControlsPanel';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformEmailControlsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin?redirect=/admin/email-controls');
        return;
      }

      setUser(user);

      // Check if user is super admin
      if (!isSuperAdminEmail(user.email)) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/email-controls');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-50"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                Only super admins can access platform email controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Platform email controls affect all organizations across the entire platform.
                This page is restricted to super administrators only.
              </p>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <Mail className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Platform Email Controls
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Master controls for email communications across all organizations
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-50">
              Platform-Wide Settings
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              These settings apply to all organizations by default. Individual organizations can override these settings with their own controls.
            </p>
          </div>
        </div>

        <EmailControlsPanel isPlatform={true} />
      </div>
    </AdminLayout>
  );
}
