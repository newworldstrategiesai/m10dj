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
          <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4">
              {/* Left: Search */}
              <div className="flex-1 max-w-xl">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search contacts, projects, invoices..."
                      className="
                        w-full pl-10 pr-4 py-2 lg:py-2.5
                        bg-gray-50 border border-gray-200 rounded-lg
                        text-sm text-gray-900 placeholder-gray-500
                        focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent
                        transition-all duration-200
                      "
                    />
                  </div>
                </form>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 lg:gap-4 ml-4">
                {/* Notifications */}
                <button
                  className="
                    relative p-2 rounded-lg
                    hover:bg-gray-100 active:bg-gray-200
                    transition-colors duration-150
                  "
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {/* Notification Badge */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* NEW Button */}
                <GlobalNewButton />
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

