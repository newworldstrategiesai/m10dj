import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query;
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (q && typeof q === 'string') {
      setSearchQuery(q);
    }
  }, [q]);

  return (
    <AdminLayout title="Search" description="Search across contacts, projects, and invoices">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Results</h1>
          {searchQuery ? (
            <p className="text-gray-600">
              Searching for: <span className="font-semibold text-gray-900">"{searchQuery}"</span>
            </p>
          ) : (
            <p className="text-gray-600">Enter a search query in the header to get started</p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Search functionality coming soon...
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}

