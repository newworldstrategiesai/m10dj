/**
 * Social Media Integration Admin Page
 * Manage Instagram and Messenger lead capture and monitoring
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SocialMediaIntegration from '@/components/admin/SocialMediaIntegration';
import Link from 'next/link';

export default function InstagramPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin?redirect=/admin/instagram');
        return;
      }

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];

      if (!adminEmails.includes(user.email || '')) {
        router.push('/');
        return;
      }

      setUser(user);
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/signin?redirect=/admin/instagram');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="slim" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Social Media Integration</h1>
          <p className="text-gray-600">Monitor Instagram and Messenger for potential leads</p>
        </div>

        {/* Social Media Integration Component */}
        <SocialMediaIntegration />
      </div>
    </div>
  );
}

