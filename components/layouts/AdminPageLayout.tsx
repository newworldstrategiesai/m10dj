'use client';

import React from 'react';
import Head from 'next/head';
import AdminNavbar from '@/components/admin/AdminNavbar';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

// Domain-aware brand label for page titles
function getAdminBrandLabel() {
  if (typeof window === 'undefined') return 'Admin';
  const h = window.location.hostname.toLowerCase();
  if (h.includes('tipjar.live') || h.includes('tipjar.com')) return 'TipJar Live';
  if (h.includes('djdash.net') || h.includes('djdash.com')) return 'DJ Dash';
  return 'M10 DJ Admin';
}

/**
 * Simple admin page layout with top navigation bar
 * Use this for admin pages that need consistent navigation
 */
export default function AdminPageLayout({ children, title, description }: AdminPageLayoutProps) {
  const brandLabel = getAdminBrandLabel();
  return (
    <>
      <Head>
        <title>{title ? `${title} - ${brandLabel}` : `${brandLabel} Admin`}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* AdminNavbar is rendered in _app.js for admin routes, don't duplicate it here */}
        <main className="w-full pt-16">
          {children}
        </main>
      </div>
    </>
  );
}

