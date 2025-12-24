/**
 * Analytics Page
 * 
 * Dedicated analytics page with comprehensive revenue and request analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { isPlatformAdmin } from '@/utils/auth-helpers/platform-admin';
import { canAccessAdminPage } from '@/utils/subscription-access';

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin');
        return;
      }

      // Check subscription access for analytics feature
      const isAdmin = isPlatformAdmin(user.email);
      
      if (!isAdmin) {
        const access = await canAccessAdminPage(supabase, user.email, 'analytics');
        
        if (!access.canAccess) {
          // Redirect to starter dashboard with upgrade prompt
          router.push('/admin/dashboard-starter');
          return;
        }
      }

      setUser(user);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </AdminLayout>
  );
}

