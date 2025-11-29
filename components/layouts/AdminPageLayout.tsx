'use client';

import React from 'react';
import Head from 'next/head';
import AdminNavbar from '@/components/admin/AdminNavbar';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Simple admin page layout with top navigation bar
 * Use this for admin pages that need consistent navigation
 */
export default function AdminPageLayout({ children, title, description }: AdminPageLayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? `${title} - M10 DJ Admin` : 'M10 DJ Admin'}</title>
        {description && <meta name="description" content={description} />}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminNavbar />
        <main className="w-full">
          {children}
        </main>
      </div>
    </>
  );
}

