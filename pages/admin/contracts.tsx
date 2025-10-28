import { useState } from 'react';
import ContractTemplateEditor from '@/components/admin/ContractTemplateEditor';
import ContractManager from '@/components/admin/ContractManager';
import { FileText, Settings } from 'lucide-react';

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'contracts'>('templates');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create templates and manage client contracts
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('templates')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'templates'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Settings className="w-4 h-4" />
                Templates
              </button>
              <button
                onClick={() => setActiveTab('contracts')}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === 'contracts'
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <FileText className="w-4 h-4" />
                Contracts
              </button>
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'templates' ? (
            <ContractTemplateEditor />
          ) : (
            <ContractManager />
          )}
        </div>
      </div>
    </div>
  );
}

