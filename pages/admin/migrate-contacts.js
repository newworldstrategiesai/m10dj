import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MigrateContactsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push('/signin');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        router.push('/signin');
        return;
      }

      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      setError(null);
      const response = await fetch('/api/preview-submissions-migration');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setPreview(data);
    } catch (error) {
      console.error('Error loading preview:', error);
      setError(error.message);
    }
  };

  const runMigration = async () => {
    if (!confirm('Are you sure you want to migrate all form submissions to contacts? This action cannot be undone.')) {
      return;
    }

    setMigrationRunning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/migrate-submissions-to-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setMigrationResults(data);
      // Refresh preview after migration
      await loadPreview();
    } catch (error) {
      console.error('Migration error:', error);
      setError(error.message);
    } finally {
      setMigrationRunning(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPreview();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Migrate Form Submissions to Contacts
          </h1>
          <p className="text-gray-600">
            Convert existing contact form submissions into comprehensive contact records for better CRM management.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Migration Results */}
        {migrationResults && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-green-800 font-semibold mb-4">Migration Completed! 🎉</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {migrationResults.results.created}
                </div>
                <p className="text-sm text-green-700">Created</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {migrationResults.results.skipped}
                </div>
                <p className="text-sm text-yellow-700">Skipped</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {migrationResults.results.errors}
                </div>
                <p className="text-sm text-red-700">Errors</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {migrationResults.results.total}
                </div>
                <p className="text-sm text-blue-700">Total</p>
              </div>
            </div>
            <div className="flex gap-4">
              <a 
                href="/admin/contacts" 
                className="px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e6a800] transition-colors font-medium"
              >
                View Contacts
              </a>
              <a 
                href="/admin/dashboard" 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Migration Preview</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {preview.summary.total_submissions}
                </div>
                <p className="text-sm text-blue-700">Total Submissions</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {preview.summary.will_create}
                </div>
                <p className="text-sm text-green-700">Will Create</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {preview.summary.will_skip}
                </div>
                <p className="text-sm text-yellow-700">Will Skip (Duplicates)</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {preview.summary.existing_contacts}
                </div>
                <p className="text-sm text-gray-700">Existing Contacts</p>
              </div>
            </div>

            {/* Sample Data Preview */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Sample Transformations (First 5 records)</h3>
              <div className="space-y-3">
                {preview.preview.slice(0, 5).map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.original.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.migration_status === 'WILL_CREATE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.migration_status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Original:</strong>
                        <ul className="mt-1 text-gray-600">
                          <li>Name: {item.original.name}</li>
                          <li>Email: {item.original.email}</li>
                          <li>Event: {item.original.event_type}</li>
                          <li>Status: {item.original.status}</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Will become:</strong>
                        <ul className="mt-1 text-gray-600">
                          <li>Name: {item.parsed.first_name} {item.parsed.last_name}</li>
                          <li>Email: {item.parsed.email_address}</li>
                          <li>Event: {item.parsed.event_type}</li>
                          <li>Lead Status: {item.parsed.lead_status}</li>
                        </ul>
                      </div>
                    </div>
                    {item.skip_reason && (
                      <p className="text-yellow-600 text-sm mt-2">
                        Skip reason: {item.skip_reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Migration Button */}
            <div className="flex gap-4">
              <button
                onClick={runMigration}
                disabled={migrationRunning || preview.summary.will_create === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  migrationRunning || preview.summary.will_create === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#fcba00] text-black hover:bg-[#e6a800]'
                }`}
              >
                {migrationRunning ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Migrating...
                  </>
                ) : (
                  `Migrate ${preview.summary.will_create} Submissions`
                )}
              </button>
              
              <button
                onClick={loadPreview}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Refresh Preview
              </button>
            </div>

            {preview.summary.will_create === 0 && (
              <p className="text-gray-600 text-sm mt-3">
                No new contacts to create. All submissions already exist in the contacts table.
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-semibold mb-3">Migration Process</h3>
          <ul className="text-blue-700 space-y-2">
            <li>✅ Converts form submissions to comprehensive contact records</li>
            <li>✅ Parses names into first_name and last_name fields</li>
            <li>✅ Standardizes event types and lead statuses</li>
            <li>✅ Assigns all contacts to your admin account</li>
            <li>✅ Skips duplicates based on email/phone</li>
            <li>✅ Preserves original timestamps and data</li>
            <li>⚠️ This action cannot be undone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}