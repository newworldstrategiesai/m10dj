'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import {
  Home,
  Briefcase,
  Users,
  Calendar,
  FileText,
  DollarSign,
  BarChart3,
  Mail,
  MessageSquare,
  Settings,
  Instagram,
  Music,
  LogOut,
  ChevronRight,
  ClipboardList,
  QrCode,
  Ticket,
  Moon,
  Sun,
  CreditCard
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminSidebarProps {
  onSignOut?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: (open: boolean) => void;
}

export default function AdminSidebar({ onSignOut, isMobileOpen: externalIsMobileOpen, onMobileToggle }: AdminSidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [internalIsMobileOpen, setInternalIsMobileOpen] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const isMobileOpen = externalIsMobileOpen !== undefined ? externalIsMobileOpen : internalIsMobileOpen;
  const setIsMobileOpen = (open: boolean) => {
    if (onMobileToggle) {
      onMobileToggle(open);
    } else {
      setInternalIsMobileOpen(open);
    }
  };

  // Check subscription tier on mount
  useEffect(() => {
    checkSubscriptionTier();
  }, []);

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme between light and dark (skip system for simplicity)
  const toggleTheme = () => {
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Get the actual theme to display (resolve system theme)
  const displayTheme = mounted && theme !== 'system' ? theme : (mounted && systemTheme || 'dark');

  // Determine logo based on theme
  const logoSrc = displayTheme === 'dark'
    ? '/assets/m10 dj company logo white.gif'
    : '/assets/m10 dj company logo black.gif';

  const [productContext, setProductContext] = useState<string | null>(null);

  const checkSubscriptionTier = async () => {
    try {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Check product context
      const userProductContext = user.user_metadata?.product_context;
      setProductContext(userProductContext || null);

      // Check if platform admin
      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];
      
      if (adminEmails.includes(user.email || '')) {
        setIsPlatformAdmin(true);
        setSubscriptionTier('enterprise'); // Platform admins see everything
        return;
      }

      // Get user's organization
      const { getCurrentOrganization } = await import('@/utils/organization-context');
      const org = await getCurrentOrganization(supabase);
      
      if (org) {
        setSubscriptionTier(org.subscription_tier);
      }
    } catch (error) {
      console.error('Error checking subscription tier:', error);
    }
  };

  // Base navigation items
  const allNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Projects', href: '/admin/projects', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Contacts', href: '/admin/contacts', icon: <Users className="w-5 h-5" /> },
    { label: 'Form Submissions', href: '/admin/form-submissions', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Calendar', href: '/admin/calendar', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Events', href: '/admin/events', icon: <Ticket className="w-5 h-5" /> },
    { label: 'Contracts', href: '/admin/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: 'Invoices', href: '/admin/invoices', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Financial', href: '/admin/financial', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Email', href: '/admin/email', icon: <Mail className="w-5 h-5" /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Crowd Requests', href: '/admin/crowd-requests', icon: <QrCode className="w-5 h-5" /> },
    { label: 'Request Page', href: '/admin/requests-page', icon: <Music className="w-5 h-5" /> },
    { label: 'Social Media', href: '/admin/instagram', icon: <Instagram className="w-5 h-5" /> },
  ];

  // Filter navigation based on subscription tier and product context
  const getNavItems = (): NavItem[] => {
    // TipJar users only see crowd requests and related features
    if (productContext === 'tipjar') {
      return [
        { label: 'Crowd Requests', href: '/admin/crowd-requests', icon: <QrCode className="w-5 h-5" /> },
        { label: 'Request Page', href: '/admin/requests-page', icon: <Music className="w-5 h-5" /> },
        { label: 'Payouts', href: '/admin/payouts', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'Billing', href: '/admin/billing', icon: <CreditCard className="w-5 h-5" /> },
      ];
    }

    // Platform admins and paid tiers see everything
    if (isPlatformAdmin || subscriptionTier === 'professional' || subscriptionTier === 'enterprise' || subscriptionTier === 'white_label') {
      return allNavItems;
    }

    // Starter tier only sees request-related features
    if (subscriptionTier === 'starter') {
      return [
        { label: 'Dashboard', href: '/admin/dashboard-starter', icon: <Home className="w-5 h-5" /> },
        { label: 'Crowd Requests', href: '/admin/crowd-requests', icon: <QrCode className="w-5 h-5" /> },
        { label: 'Request Page', href: '/admin/requests-page', icon: <Music className="w-5 h-5" /> },
        { label: 'Payouts', href: '/admin/payouts', icon: <DollarSign className="w-5 h-5" /> },
        { label: 'Billing', href: '/admin/billing', icon: <CreditCard className="w-5 h-5" /> },
      ];
    }

    // Default: show all (for loading state or unknown tier)
    return allNavItems;
  };

  const navItems = getNavItems();

  const bottomNavItems: NavItem[] = [
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      router.push('/signin');
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    if (onMobileToggle) {
      onMobileToggle(false);
    } else {
      setInternalIsMobileOpen(false);
    }
  }, [router.pathname, onMobileToggle]);

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-[60]
    transition-all duration-300 ease-in-out
    flex flex-col
    ${displayTheme === 'dark'
      ? 'bg-black text-white border-r border-gray-800'
      : 'bg-gray-100 text-gray-900 border-r border-gray-200'
    }
    ${isExpanded ? 'w-64' : 'w-20'}
    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={sidebarClasses}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Logo/Brand */}
        <div className={`h-16 flex items-center justify-center border-b ${
          displayTheme === 'dark' ? 'border-gray-700' : 'border-gray-300'
        }`}>
          <Link href={productContext === 'tipjar' ? '/admin/crowd-requests' : '/admin/dashboard'} className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {productContext === 'tipjar' ? (
                <span className="text-2xl font-bold text-[#fcba00]">💸</span>
              ) : (
                <img
                  src={logoSrc}
                  alt="M10 DJ Company Logo"
                  className="w-8 h-8 object-contain"
                />
              )}
            </div>
            <span
              className={`
                font-bold text-lg whitespace-nowrap overflow-hidden
                transition-all duration-300
                ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
              `}
            >
              {productContext === 'tipjar' ? 'TipJar' : 'M10 DJ'}
            </span>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-[#fcba00] text-black font-semibold'
                        : displayTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }
                      ${!isExpanded && 'justify-center'}
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span
                      className={`
                        whitespace-nowrap overflow-hidden
                        transition-all duration-300
                        ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                      `}
                    >
                      {item.label}
                    </span>
                    {item.badge && isExpanded && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <div className={`border-t py-4 px-2 ${displayTheme === 'dark' ? 'border-gray-800' : 'border-gray-300'}`}>
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-[#fcba00] text-black font-semibold'
                        : displayTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                      }
                      ${!isExpanded && 'justify-center'}
                    `}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span
                      className={`
                        whitespace-nowrap overflow-hidden
                        transition-all duration-300
                        ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                      `}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
            
            {/* Theme Toggle */}
            {mounted && (
              <li>
                <button
                  onClick={toggleTheme}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    displayTheme === 'dark' ? 'text-gray-300 hover:bg-gray-800 hover:text-white' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    transition-all duration-200
                    ${!isExpanded && 'justify-center'}
                  `}
                  title={displayTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {displayTheme === 'dark' ? (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span
                    className={`
                      whitespace-nowrap overflow-hidden
                      transition-all duration-300
                      ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                    `}
                  >
                    {displayTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>
              </li>
            )}
            
            {/* Sign Out */}
            <li>
              <button
                onClick={handleSignOut}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  text-gray-300 hover:bg-red-600/20 hover:text-red-400
                  transition-all duration-200
                  ${!isExpanded && 'justify-center'}
                `}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span
                  className={`
                    whitespace-nowrap overflow-hidden
                    transition-all duration-300
                    ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                  `}
                >
                  Sign Out
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Expand Indicator (Desktop Only) */}
        <div
          className={`
            hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-12 bg-gray-900 border border-gray-700 rounded-r-lg
            items-center justify-center cursor-pointer
            transition-opacity duration-300
            ${isExpanded ? 'opacity-0' : 'opacity-100'}
          `}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </aside>

      {/* Spacer for main content */}
      <div className="hidden lg:block w-20" />
    </>
  );
}

