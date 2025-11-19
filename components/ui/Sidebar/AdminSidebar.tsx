'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  Menu,
  X,
  ClipboardList,
  QrCode
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface AdminSidebarProps {
  onSignOut?: () => void;
}

export default function AdminSidebar({ onSignOut }: AdminSidebarProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Projects', href: '/admin/projects', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Contacts', href: '/admin/contacts', icon: <Users className="w-5 h-5" /> },
    { label: 'Form Submissions', href: '/admin/form-submissions', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Calendar', href: '/admin/calendar', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Contracts', href: '/admin/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: 'Invoices', href: '/admin/invoices', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Financial', href: '/admin/financial', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Email', href: '/admin/email', icon: <Mail className="w-5 h-5" /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Crowd Requests', href: '/admin/crowd-requests', icon: <QrCode className="w-5 h-5" /> },
    { label: 'Social Media', href: '/admin/instagram', icon: <Instagram className="w-5 h-5" /> },
  ];

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
    setIsMobileOpen(false);
  }, [router.pathname]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

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
        className={`
          fixed left-0 top-0 h-screen bg-gray-900 text-white z-40
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isExpanded ? 'w-64' : 'w-20'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Brand */}
        <div className="h-16 flex items-center justify-center border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#fcba00] to-[#d97706] rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-black" />
            </div>
            <span
              className={`
                font-bold text-lg whitespace-nowrap overflow-hidden
                transition-all duration-300
                ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
              `}
            >
              M10 DJ
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
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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
        <div className="border-t border-gray-800 py-4 px-2">
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
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
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

