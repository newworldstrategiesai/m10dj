'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminSidebar from '@/components/ui/Sidebar/AdminSidebar';
import GlobalNewButton from '@/components/ui/GlobalNewButton';
import Head from 'next/head';
import Link from 'next/link';
import { Search, Bell, User, LogOut, ChevronDown, Menu, X, Plus, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showPageTitle?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  newButton?: {
    href: string;
    label: string;
    icon?: React.ReactNode;
  };
}

export default function AdminLayout({ children, title, description, showPageTitle, pageTitle, pageDescription, newButton }: AdminLayoutProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { theme, systemTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Get the actual theme to display (resolve system theme)
  const displayTheme = mounted && theme !== 'system' ? theme : (mounted && systemTheme || 'dark');

  // Determine logo based on theme
  const logoSrc = displayTheme === 'dark'
    ? '/assets/m10 dj company logo white.gif'
    : '/assets/m10 dj company logo black.gif';

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Remove body/html padding/margin for admin pages
  useEffect(() => {
    const originalBodyPaddingTop = document.body.style.paddingTop;
    const originalBodyMargin = document.body.style.margin;
    const originalHtmlMargin = document.documentElement.style.margin;
    const originalHtmlPadding = document.documentElement.style.padding;
    
    document.body.style.paddingTop = '0';
    document.body.style.margin = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    
    return () => {
      document.body.style.paddingTop = originalBodyPaddingTop;
      document.body.style.margin = originalBodyMargin;
      document.documentElement.style.margin = originalHtmlMargin;
      document.documentElement.style.padding = originalHtmlPadding;
    };
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

      <div className="min-h-screen bg-gray-50 dark:bg-black m-0 p-0">
        {/* Sidebar */}
        <AdminSidebar onSignOut={handleSignOut} isMobileOpen={isMobileMenuOpen} onMobileToggle={setIsMobileMenuOpen} />

        {/* Main Content Area */}
        <div className="lg:ml-20">
          {/* Top Navigation Bar - Sticky at top */}
          <header className="sticky top-0 z-30 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2 gap-2 sm:gap-3 min-w-0">
              {/* Mobile Menu Button - Inline with other elements */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-150 flex-shrink-0"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Left: Search - Shortened for better inline fit */}
              <div className="flex-1 max-w-xs sm:max-w-sm lg:max-w-md min-w-0">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="
                        w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2
                        bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-600 rounded-lg
                        text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                        focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent
                        transition-all duration-200
                      "
                    />
                  </div>
                </form>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 ml-1 sm:ml-2 flex-shrink-0">
                {/* Notifications - Single, Clear Button */}
                <button
                  onClick={() => router.push('/admin/notifications')}
                  className="
                    relative p-1.5 sm:p-2 rounded-lg
                    hover:bg-gray-100 active:bg-gray-200
                    dark:hover:bg-gray-700 dark:active:bg-gray-600
                    transition-colors duration-150
                    flex-shrink-0
                    group
                  "
                  aria-label="Notifications"
                  title="View notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                  {/* Notification Badge - Only show if there are notifications */}
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
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
                      dark:hover:bg-gray-700 dark:active:bg-gray-600
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
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-50">
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

          {/* Page Title Section - Only show if showPageTitle is true */}
          {showPageTitle && (
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-3 sm:gap-0">
                  <div className="flex items-center flex-wrap gap-3">
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#fcba00] text-sm sm:text-base"
                    >
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Back to Dashboard</span>
                      <span className="sm:hidden">Back</span>
                    </Link>

                    {pageTitle && (
                      <>
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <img
                            src={mounted ? logoSrc : '/assets/m10 dj company logo black.gif'}
                            alt="M10 DJ Company Logo"
                            className="w-10 h-10 object-contain"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                            {pageTitle}
                          </h1>
                          {pageDescription && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {pageDescription}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  {newButton && (
                    <div className="flex items-center">
                      <Link
                        href={newButton.href}
                        className="bg-[#fcba00] hover:bg-yellow-500 text-black px-4 sm:px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base w-full sm:w-auto touch-manipulation shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="hidden sm:inline">{newButton.label}</span>
                        <span className="sm:hidden">{newButton.label.split(' ')[0]}</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Page Content */}
          <main className="w-full m-0 p-0">
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

