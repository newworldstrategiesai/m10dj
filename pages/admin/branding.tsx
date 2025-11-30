/**
 * White-Label Branding Management Page
 * 
 * Admin page for managing organization branding
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Settings, ArrowLeft, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import WhiteLabelBranding from '@/components/admin/WhiteLabelBranding';
import ThemeSelector from '@/components/admin/ThemeSelector';

export default function BrandingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setAuthenticated(true);
        } else {
          router.push('/signin');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                White-Label Branding
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Customize your branding for public request pages
              </p>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <ThemeSelector />
          </div>
        </div>

        {/* Branding Component */}
        <WhiteLabelBranding />
      </div>
    </AdminLayout>
  );
}

