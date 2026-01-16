/**
 * Organization Request Tab Controls Page
 * Organization admins and TipJar users can control tab visibility for their organization
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Music, Building, AlertTriangle } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import RequestTabControlsPanel from '@/components/admin/RequestTabControlsPanel';
import { getUserRole } from '@/utils/permissions';
import { getCurrentOrganization } from '@/utils/organization-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrganizationRequestTabsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin?redirect=/admin/organization/request-tabs');
        return;
      }

      setUser(user);

      // Get current organization
      const org = await getCurrentOrganization(supabase);
      if (!org) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setOrganization(org);

      // Check if user is org admin/owner OR organization is TipJar
      const userRole = await getUserRole(supabase, org.id, user.id);
      const isOrgAdmin = userRole === 'owner' || userRole === 'admin';
      const isTipJar = org.product_context === 'tipjar';

      if (!isOrgAdmin && !isTipJar) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/organization/request-tabs');
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

  if (!isAuthorized || !organization) {
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
                Only organization owners/admins or TipJar users can access organization request tab controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Organization request tab controls allow you to override platform defaults for your organization.
                You must be an owner or admin of an organization, or your organization must be a TipJar organization.
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
            <Music className="h-6 w-6 text-zinc-900 dark:text-zinc-50" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Organization Request Tab Controls
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Control which tabs are visible on the requests page for {organization.name || 'your organization'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-50">
              Organization-Specific Settings
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              These settings override platform defaults for this organization only. Other organizations are not affected.
            </p>
          </div>
        </div>

        <RequestTabControlsPanel organizationId={organization.id} isPlatform={false} />
      </div>
    </AdminLayout>
  );
}
