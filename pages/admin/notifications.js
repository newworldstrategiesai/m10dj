import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { 
  ArrowLeft,
  Bell,
  MessageSquare,
  Mail,
  Phone,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Calendar
} from 'lucide-react';

// Dynamic imports to prevent hot reload issues
const NotificationMonitor = dynamic(() => import('../../components/admin/NotificationMonitor'), {
  loading: () => <div className="flex items-center justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-brand" /></div>,
  ssr: false
});

const SMSForwardingManager = dynamic(() => import('../../components/admin/SMSForwardingManager'), {
  loading: () => <div className="flex items-center justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-brand" /></div>,
  ssr: false
});

const DailyDigestManager = dynamic(() => import('../../components/admin/DailyDigestManager'), {
  loading: () => <div className="flex items-center justify-center p-8"><RefreshCw className="w-6 h-6 animate-spin text-brand" /></div>,
  ssr: false
});

export default function AdminNotifications() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monitor');

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      const supabase = createClient();
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error || !user) {
          window.location.href = '/signin?redirect=/admin/notifications';
          return;
        }

        // Check admin status using centralized admin roles system
        const { isAdminEmail } = await import('@/utils/auth-helpers/admin-roles');
        const isUserAdmin = await isAdminEmail(user.email);
        
        if (!mounted) return;
        
        setUser(user);
        setIsAdmin(isUserAdmin);
        
        if (!isUserAdmin) {
          window.location.href = '/';
          return;
        }
        
      } catch (err) {
        const { logger } = await import('@/utils/logger');
        logger.error('Auth error in notifications page', err);
        if (mounted) {
          window.location.href = '/signin?redirect=/admin/notifications';
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-inter">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/" className="btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'monitor',
      name: 'System Monitor',
      icon: Activity,
      description: 'Real-time notification status and logs'
    },
    {
      id: 'sms',
      name: 'SMS Forwarding',
      icon: MessageSquare,
      description: 'Configure SMS forwarding and auto-replies'
    },
    {
      id: 'digest',
      name: 'Daily Digest',
      icon: Calendar,
      description: 'Manage daily summary notifications'
    }
  ];

  return (
    <>
      <Head>
        <title>Notification Management - M10 DJ Company Admin</title>
        <meta name="description" content="Manage notification systems and monitoring for M10 DJ Company" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-surface">
        {/* Header */}
        <div className="bg-white border-b border-border-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href="/admin/dashboard"
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
                <div className="flex items-center">
                  <Bell className="w-8 h-8 text-brand mr-3" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-inter">
                      Notification Management
                    </h1>
                    <p className="text-sm text-gray-600 font-inter">
                      Monitor and configure notification systems
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-inter">
                  Welcome, {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border-light">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-brand text-brand'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="w-5 h-5 mr-2" />
                        <div className="text-left">
                          <div>{tab.name}</div>
                          <div className="text-xs text-gray-400 font-normal">
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'monitor' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 font-inter mb-2">
                    System Monitor
                  </h2>
                  <p className="text-gray-600 font-inter">
                    Real-time monitoring of notification delivery, success rates, and system health.
                  </p>
                </div>
                <NotificationMonitor />
              </div>
            )}

            {activeTab === 'sms' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 font-inter mb-2">
                    SMS Forwarding Management
                  </h2>
                  <p className="text-gray-600 font-inter">
                    Configure SMS forwarding settings, test the system, and manage auto-reply messages.
                  </p>
                </div>
                <SMSForwardingManager />
              </div>
            )}

            {activeTab === 'digest' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 font-inter mb-2">
                    Daily Digest Management
                  </h2>
                  <p className="text-gray-600 font-inter">
                    Configure daily summary notifications and test the digest system.
                  </p>
                </div>
                <DailyDigestManager />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
