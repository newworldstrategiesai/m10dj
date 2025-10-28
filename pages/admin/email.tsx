/**
 * Email Integration Admin Page
 * Main page for managing email integration
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import EmailIntegration from '@/components/admin/EmailIntegration';
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function EmailIntegrationPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for OAuth callback status
    if (router.query.success === 'connected') {
      toast({
        title: "Connected!",
        description: "Gmail account connected successfully. You can now sync emails.",
      });
      
      // Clean up URL
      router.replace('/admin/email', undefined, { shallow: true });
    }

    if (router.query.error) {
      let errorMessage = 'Failed to connect Gmail account';
      
      switch (router.query.error) {
        case 'auth_failed':
          errorMessage = 'Authentication failed. Please try again.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received.';
          break;
        case 'storage_failed':
          errorMessage = 'Failed to store authentication tokens.';
          break;
        case 'callback_failed':
          errorMessage = 'OAuth callback failed. Please try again.';
          break;
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Clean up URL
      router.replace('/admin/email', undefined, { shallow: true });
    }
  }, [router.query]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Email Integration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Connect your Gmail account to automatically scan for leads and manage email communications.
          </p>
        </div>

        <EmailIntegration />
      </div>
    </div>
  );
}

