/**
 * Service Selection Admin Page
 * Test and manage service selection links
 */

import React from 'react';
import ServiceSelectionTester from '@/components/admin/ServiceSelectionTester';

export default function ServiceSelectionAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Selection Links</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test the service selection form and generate links for leads
          </p>
        </div>

        <ServiceSelectionTester />
      </div>
    </div>
  );
}

