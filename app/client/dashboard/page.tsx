import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/auth-helpers/role-redirect';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Heart } from 'lucide-react';
import ClientDashboardContent from '@/components/client/ClientDashboardContent';

export default async function ClientDashboard() {
  // Check if user is authenticated
  const userRole = await getUserRole();
  
  if (!userRole) {
    redirect('/signin');
  }
  
  // Allow admins to access client dashboard for testing purposes
  // But regular clients should not be redirected away
  // Admin routes are still protected separately

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const handleSignOut = async () => {
    'use server';
    const supabase = createClient();
    await supabase.auth.signOut();
    redirect('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8 group">
                <div className="w-10 h-10 bg-brand-gold rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                  <span className="text-black font-bold text-lg">M10</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Client Portal
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    M10 DJ Company
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Client'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="btn-secondary !px-3 !py-2 !text-red-600 !border-red-200 hover:!bg-red-50"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-brand-gold to-yellow-400 rounded-lg shadow p-8 mb-8 text-black">
          <div className="flex items-center">
            <Heart className="w-8 h-8 mr-4" />
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome to Your M10 DJ Portal!
              </h1>
              <p className="text-lg opacity-90">
                Manage all aspects of your booking in one convenient place.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <ClientDashboardContent />
      </main>
    </div>
  );
}