/**
 * Automation Admin Page
 * View and manage automated email campaigns
 */

import React from 'react';
import AutomationDashboard from '@/components/admin/AutomationDashboard';

export default function AutomationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Automation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Automated review requests, lead follow-ups, and customer communications
          </p>
        </div>

        <AutomationDashboard />
      </div>
    </div>
  );
}

