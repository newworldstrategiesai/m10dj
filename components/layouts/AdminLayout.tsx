'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminSidebar from '@/components/ui/Sidebar/AdminSidebar';
import Head from 'next/head';
import Link from 'next/link';
import { Plus, ArrowLeft, Menu, X } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [productContext, setProductContext] = useState<string | null>(null);

  // Get the actual theme to display (resolve system theme)
  const displayTheme = mounted && theme !== 'system' ? theme : (mounted && systemTheme || 'dark');

  // Check product context on mount
  useEffect(() => {
    const checkProductContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.product_context) {
          setProductContext(user.user_metadata.product_context);
        }
      } catch (error) {
        console.error('Error checking product context:', error);
      }
    };
    checkProductContext();
  }, [supabase]);

  // Determine logo based on theme and product context
  // TipJar users should not see M10 DJ Company logos
  const logoSrc = displayTheme === 'dark'
    ? '/assets/m10 dj company logo white.gif'
    : '/assets/m10 dj company logo black.gif';

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

  return (
    <>
      <Head>
        <title>{title ? `${title} - ${productContext === 'tipjar' ? 'TipJar' : 'M10 DJ Admin'}` : (productContext === 'tipjar' ? 'TipJar Admin' : 'M10 DJ Admin')}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-black m-0 p-0">
        {/* Sidebar */}
        <AdminSidebar onSignOut={handleSignOut} isMobileOpen={isMobileMenuOpen} onMobileToggle={setIsMobileMenuOpen} />

        {/* Mobile Menu Button - Floating */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        {/* Main Content Area */}
        <div className="lg:ml-20 pt-16 lg:pt-0">

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
                          {productContext === 'tipjar' ? (
                            <span className="text-2xl font-bold text-[#fcba00]">💸</span>
                          ) : (
                            <img
                              src={mounted ? logoSrc : '/assets/m10 dj company logo black.gif'}
                              alt="M10 DJ Company Logo"
                              className="w-10 h-10 object-contain"
                            />
                          )}
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

    </>
  );
}

