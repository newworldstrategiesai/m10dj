import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/auth-helpers/role-redirect';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Music,
  Settings,
  LogOut,
  Bell,
  Heart
} from 'lucide-react';

export default async function ClientDashboard() {
  // Check if user is authenticated and is a client
  const userRole = await getUserRole();
  
  if (!userRole) {
    redirect('/signin');
  }
  
  if (userRole.isAdmin) {
    redirect('/admin/dashboard');
  }

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
                We're excited to work with you on your special event. This is your dedicated space to manage all aspects of your booking.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Client Portal Coming Soon!
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                We're building an amazing client experience for you. Soon you'll be able to:
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Calendar className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Event Planning
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              View your event timeline, important dates, and schedule planning calls with Ben.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Music className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Music Planning
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Create your must-play and do-not-play lists, and collaborate on the perfect playlist.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Direct Communication
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Message Ben directly, get quick responses, and stay updated on all event details.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contracts & Documents
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Access your contract, invoices, and all important event documentation in one place.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Event Details
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Update guest counts, special requests, and other important event information.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="w-8 h-8 text-brand-gold mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Preferences
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Set your communication preferences and notification settings.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Need Help Right Now?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            While we're building your client portal, feel free to reach out directly:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="tel:(901)497-7001"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-brand-gold rounded-lg mr-3">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">(901) 497-7001</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Call Ben directly</p>
              </div>
            </a>

            <a
              href="mailto:djbenmurray@gmail.com"
              className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="p-2 bg-brand-gold rounded-lg mr-3">
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">djbenmurray@gmail.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send an email</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}