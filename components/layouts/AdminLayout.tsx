'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminSidebar from '@/components/ui/Sidebar/AdminSidebar';
import GlobalNewButton from '@/components/ui/GlobalNewButton';
import Head from 'next/head';
import { Search, Bell } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <Head>
        <title>{title ? `${title} - M10 DJ Admin` : 'M10 DJ Admin'}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <AdminSidebar onSignOut={handleSignOut} />

        {/* Main Content Area */}
        <div className="lg:ml-20 min-h-screen">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between px-4 lg:px-6 py-1.5 lg:py-2 gap-3 lg:gap-3 min-w-0">
              {/* Left: Search */}
              <div className="flex-1 max-w-xl min-w-0">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-2.5 lg:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts, projects, invoices..."
                      className="
                        w-full pl-9 pr-3 lg:pl-10 lg:pr-4 py-1.5 lg:py-2.5
                        bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                        text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent
                        transition-all duration-200
                      "
                    />
                  </div>
                </form>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 lg:gap-3 ml-2 lg:ml-4 flex-shrink-0">
                {/* Notifications */}
                <button
                  onClick={() => router.push('/admin/notifications')}
                  className="
                    relative p-1.5 lg:p-2 rounded-lg
                    hover:bg-gray-100 active:bg-gray-200
                    dark:hover:bg-gray-800 dark:active:bg-gray-700
                    transition-colors duration-150
                    flex-shrink-0
                  "
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400" />
                  {/* Notification Badge */}
                  <span className="absolute top-0.5 right-0.5 lg:top-1 lg:right-1 w-1.5 h-1.5 lg:w-2 lg:h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* NEW Button */}
                <div className="flex-shrink-0">
                  <GlobalNewButton />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="w-full">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

