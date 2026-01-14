'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ContractTemplateEditor from '@/components/admin/ContractTemplateEditor';
import ContractManager from '@/components/admin/ContractManager';
import CreateStandaloneContract from '@/components/admin/CreateStandaloneContract';
import { FileText, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ContractsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [activeTab, setActiveTab] = useState<'templates' | 'contracts'>('contracts');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin');
        return;
      }

      // Check subscription access for contracts feature
      const { isPlatformAdmin } = await import('@/utils/auth-helpers/platform-admin');
      const { canAccessAdminPage } = await import('@/utils/subscription-access');
      
      const isAdmin = isPlatformAdmin(user.email);
      
      if (!isAdmin) {
        const access = await canAccessAdminPage(supabase, user.email, 'contracts');
        
        if (!access.canAccess) {
          // Redirect to starter dashboard with upgrade prompt
          router.push('/admin/dashboard-starter');
          return;
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Contract Management</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                Create templates and manage client contracts
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 flex items-center gap-2 w-full sm:w-auto"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Send NDA / Agreement</span>
              <span className="sm:hidden">New Agreement</span>
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'templates' | 'contracts')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger 
                value="templates" 
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xs:inline">Templates</span>
                <span className="xs:hidden">Templates</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contracts"
                className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden xs:inline">Contracts</span>
                <span className="xs:hidden">Contracts</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="mt-4 sm:mt-6">
              <ContractTemplateEditor />
            </TabsContent>

            <TabsContent value="contracts" className="mt-4 sm:mt-6">
              <ContractManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Standalone Contract Modal */}
      <CreateStandaloneContract
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          // Optionally refresh the contracts list
          setActiveTab('contracts');
        }}
      />
    </div>
  );
}

