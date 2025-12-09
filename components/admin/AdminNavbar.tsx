'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  FileText,
  DollarSign,
  MessageSquare,
  Mail,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  Bell,
  ClipboardList,
  QrCode,
  Instagram,
  Music,
  Zap,
  CreditCard,
  Building,
  Palette,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
}

export default function AdminNavbar() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  };

  // Organized menu groups for DJ business admin
  const navGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/admin/dashboard', icon: <Home className="w-4 h-4" />, description: 'Main hub' },
      ]
    },
    {
      label: 'CRM',
      items: [
        { label: 'Contacts', href: '/admin/contacts', icon: <Users className="w-4 h-4" />, description: 'Client database' },
        { label: 'Projects', href: '/admin/projects', icon: <Briefcase className="w-4 h-4" />, description: 'Events & gigs' },
        { label: 'Form Submissions', href: '/admin/form-submissions', icon: <ClipboardList className="w-4 h-4" />, description: 'New leads' },
      ]
    },
    {
      label: 'Financial',
      items: [
        { label: 'Contracts', href: '/admin/contracts', icon: <FileText className="w-4 h-4" />, description: 'Agreements' },
        { label: 'Invoices', href: '/admin/invoices', icon: <CreditCard className="w-4 h-4" />, description: 'Billing' },
        { label: 'Financial', href: '/admin/financial', icon: <BarChart3 className="w-4 h-4" />, description: 'Analytics' },
      ]
    },
    {
      label: 'Communication',
      items: [
        { label: 'Chat', href: '/admin/chat', icon: <MessageSquare className="w-4 h-4" />, description: 'SMS messages' },
        { label: 'Email Client', href: '/admin/email-client', icon: <Mail className="w-4 h-4" />, description: 'Email inbox' },
        { label: 'Crowd Requests', href: '/admin/crowd-requests', icon: <QrCode className="w-4 h-4" />, description: 'Song requests' },
      ]
    },
    {
      label: 'Operations',
      items: [
        { label: 'Automation', href: '/admin/automation', icon: <Zap className="w-4 h-4" />, description: 'Workflows' },
        { label: 'Service Selection', href: '/admin/service-selection', icon: <Sparkles className="w-4 h-4" />, description: 'Packages' },
      ]
    },
    {
      label: 'Content',
      items: [
        { label: 'Requests Page', href: '/admin/requests-page', icon: <Music className="w-4 h-4" />, description: 'Customize requests page' },
        { label: 'Blog', href: '/admin/blog', icon: <BookOpen className="w-4 h-4" />, description: 'Articles' },
        { label: 'Social Media', href: '/admin/instagram', icon: <Instagram className="w-4 h-4" />, description: 'Instagram' },
      ]
    },
    {
      label: 'Settings',
      items: [
        { label: 'Pricing', href: '/admin/pricing', icon: <DollarSign className="w-4 h-4" />, description: 'Packages' },
        { label: 'Branding', href: '/admin/branding', icon: <Palette className="w-4 h-4" />, description: 'Customization' },
        { label: 'Organizations', href: '/admin/organizations', icon: <Building className="w-4 h-4" />, description: 'Multi-tenant' },
        { label: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-4 h-4" />, description: 'Alerts' },
      ]
    }
  ];

  // Flattened items for mobile/quick access
  const allNavItems = navGroups.flatMap(group => group.items);

  return (
    <nav
      className={`
        hidden lg:block
        sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-900
        transition-shadow duration-200
        ${isScrolled ? 'shadow-md' : 'shadow-sm'}
        lg:ml-20
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative" style={{ overflow: 'visible' }}>
        <div className="flex items-center justify-between h-12 gap-3" style={{ overflow: 'visible' }}>
          {/* Left: Logo & Main Nav */}
          <div className="flex items-center flex-1 min-w-0 gap-4 relative" style={{ overflow: 'visible' }}>
            {/* Logo */}
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 mr-6 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#fcba00] to-[#d97706] rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-black" />
              </div>
              <span className="hidden sm:block font-bold text-lg text-gray-900 dark:text-white">
                M10 DJ Admin
              </span>
            </Link>

            {/* Desktop Navigation - Main Items */}
            <div className="hidden lg:flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ overflowY: 'visible' }}>
                {/* Core quick links */}
                <Link
                  href="/admin/dashboard"
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                    ${isActive('/admin/dashboard')
                      ? 'bg-[#fcba00] text-black'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/contacts"
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                    ${isActive('/admin/contacts')
                      ? 'bg-[#fcba00] text-black'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  Contacts
                </Link>
                <Link
                  href="/admin/projects"
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0
                    ${isActive('/admin/projects')
                      ? 'bg-[#fcba00] text-black'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  Projects
                </Link>

                {/* Dropdown Menus */}
                {navGroups.slice(1).map((group) => (
                  <div
                    key={group.label}
                    className="relative flex-shrink-0"
                    onMouseEnter={() => setOpenDropdown(group.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === group.label ? null : group.label);
                      }}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        flex items-center gap-1 whitespace-nowrap
                        ${openDropdown === group.label
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                        ${group.items.some(item => isActive(item.href)) ? 'text-[#fcba00]' : ''}
                      `}
                    >
                      {group.label}
                      <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${openDropdown === group.label ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {openDropdown === group.label && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-[9999]"
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(group.label);
                        }}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`
                              block flex items-center gap-3 px-4 py-2 text-sm transition-colors cursor-pointer
                              ${isActive(item.href)
                                ? 'bg-[#fcba00]/10 text-[#fcba00] font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(null);
                            }}
                          >
                            <span className="flex-shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Search, Actions, User */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0 min-w-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:block flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="
                    w-40 lg:w-48 pl-10 pr-4 py-2
                    bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                    text-sm text-gray-900 dark:text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent
                    transition-all
                  "
                />
              </div>
            </form>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            {/* Notifications (Desktop) */}
            <button
              onClick={() => router.push('/admin/notifications')}
              className="hidden lg:flex relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <div className="text-right min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email?.split('@')[0] || 'Admin'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {/* Mobile Search */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="
                    w-full pl-10 pr-4 py-2
                    bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                    text-sm text-gray-900 dark:text-white placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent
                  "
                />
              </div>
            </form>
          </div>

          {/* Mobile Navigation */}
          <div className="p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                        ${isActive(item.href)
                          ? 'bg-[#fcba00] text-black font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div>{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile User Actions */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email || 'Admin'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin User</div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

