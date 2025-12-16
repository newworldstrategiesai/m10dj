'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminSidebar from '@/components/ui/Sidebar/AdminSidebar';
import GlobalNewButton from '@/components/ui/GlobalNewButton';
import Head from 'next/head';
import { Search, Bell, User, LogOut, ChevronDown } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

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
              <div className="flex items-center gap-2 lg:gap-3 ml-2 lg:ml-4 flex-shrink-0">
                {/* Notifications - Single, Clear Button */}
                <button
                  onClick={() => router.push('/admin/notifications')}
                  className="
                    relative p-2 rounded-lg
                    hover:bg-gray-100 active:bg-gray-200
                    dark:hover:bg-gray-800 dark:active:bg-gray-700
                    transition-colors duration-150
                    flex-shrink-0
                    group
                  "
                  aria-label="Notifications"
                  title="View notifications"
                >
                  <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                  {/* Notification Badge - Only show if there are notifications */}
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </button>

                {/* NEW Button */}
                <div className="flex-shrink-0">
                  <GlobalNewButton />
                </div>

                {/* User Menu */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="
                      flex items-center gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg
                      hover:bg-gray-100 active:bg-gray-200
                      dark:hover:bg-gray-800 dark:active:bg-gray-700
                      transition-colors duration-150
                      min-w-0
                    "
                    aria-label="User menu"
                  >
                    <div className="hidden sm:flex flex-col items-end min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                        {user?.email?.split('@')[0] || 'Admin'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Admin</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#fcba00] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-black" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 hidden lg:block" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.email || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin User</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
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

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
}

