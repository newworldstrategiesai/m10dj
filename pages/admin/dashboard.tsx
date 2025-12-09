/**
 * Enhanced Admin Dashboard
 * Comprehensive overview with real-time data, upcoming events, financial stats, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  BarChart3,
  FileText,
  CreditCard,
  Briefcase,
  ArrowRight,
  MapPin,
  Music,
  Star,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/layouts/AdminLayout';
import UsageDashboard from '@/components/subscription/UsageDashboard';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import StripeConnectRequirementBanner from '@/components/subscription/StripeConnectRequirementBanner';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';

interface DashboardStats {
  totalContacts: number;
  totalProjects: number;
  upcomingEvents: number;
  thisMonthRevenue: number;
  totalRevenue: number;
  outstandingBalance: number;
  newLeads: number;
  bookedEvents: number;
}

interface UpcomingEvent {
  id: string;
  event_name: string;
  client_name: string;
  event_date: string;
  start_time: string;
  venue_name: string;
  status: string;
  total_amount: number;
}

interface RecentContact {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone: string;
  event_type: string;
  event_date: string;
  lead_status: string;
  created_at: string;
}

interface RecentPayment {
  id: string;
  contact_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin?redirect=/admin/dashboard');
        return;
      }

      // Check if user is platform admin
      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];

      const isPlatformAdmin = adminEmails.includes(user.email || '');

      // If not platform admin, check their organization subscription tier
      if (!isPlatformAdmin) {
        const org = await getCurrentOrganization(supabase);
        
        if (org) {
          setOrganization(org);
          
          if (org.subscription_tier === 'starter') {
            // Redirect starter tier users to simplified dashboard
            router.push('/admin/dashboard-starter');
            return;
          }
        }
      }

      // Platform admins and paid tier users see full dashboard
      setUser(user);
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/signin?redirect=/admin/dashboard');
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchUpcomingEvents(),
        fetchRecentContacts(),
        fetchRecentPayments()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Total projects
      const { count: totalProjects } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // Upcoming events (all future events)
      const { count: upcomingEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString().split('T')[0])
        .in('status', ['confirmed', 'in_progress']);

      // Revenue stats - temporarily disabled (payments table not migrated)
      const thisMonthRevenue = 0;
      const totalRevenue = 0;
      const outstandingBalance = 0;
      
      // TODO: Re-enable after running payments migration
      // const startOfMonth = new Date();
      // startOfMonth.setDate(1);
      // const { data: payments } = await supabase
      //   .from('payments')
      //   .select('total_amount, payment_date, payment_status')
      //   .eq('payment_status', 'Paid');

      // const thisMonthRevenue = (payments || [])
      //   .filter(p => new Date(p.payment_date) >= startOfMonth)
      //   .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      // const totalRevenue = (payments || [])
      //   .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      // const { data: outstanding } = await supabase
      //   .from('outstanding_balances')
      //   .select('balance_due');

      // const outstandingBalance = (outstanding || [])
      //   .reduce((sum, o) => sum + (o.balance_due || 0), 0);

      // New leads
      const { count: newLeads } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('lead_status', 'New')
        .is('deleted_at', null);

      // Booked events
      const { count: bookedEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'in_progress']);

      setStats({
        totalContacts: totalContacts || 0,
        totalProjects: totalProjects || 0,
        upcomingEvents: upcomingEvents || 0,
        thisMonthRevenue,
        totalRevenue,
        outstandingBalance,
        newLeads: newLeads || 0,
        bookedEvents: bookedEvents || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .in('status', ['confirmed', 'in_progress'])
        .order('event_date', { ascending: true })
        .limit(10);

      if (!error && data) {
        setUpcomingEvents(data);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setRecentContacts(data);
      }
    } catch (error) {
      console.error('Error fetching recent contacts:', error);
    }
  };

  const fetchRecentPayments = async () => {
    // Temporarily disabled - payments table not yet migrated
    try {
      // const { data, error } = await supabase
      //   .from('payments')
      //   .select(`
      //     id,
      //     total_amount,
      //     payment_date,
      //     payment_method,
      //     contact_id,
      //     contacts (first_name, last_name)
      //   `)
      //   .eq('payment_status', 'Paid')
      //   .order('payment_date', { ascending: false })
      //   .limit(5);

      // if (!error && data) {
      //   const formattedPayments = data.map(p => ({
      //     id: p.id,
      //     contact_name: p.contacts && Array.isArray(p.contacts) && p.contacts[0] 
      //       ? `${p.contacts[0].first_name} ${p.contacts[0].last_name}` 
      //       : 'Unknown',
      //     amount: p.total_amount,
      //     payment_date: p.payment_date,
      //     payment_method: p.payment_method
      //   }));
      //   setRecentPayments(formattedPayments);
      // }
      setRecentPayments([]); // Empty array for now
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'booked':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'new':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard" description="M10 DJ Company Admin Dashboard">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto mb-6"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#fcba00] absolute top-0 left-1/2 -translate-x-1/2"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" description="M10 DJ Company Admin Dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Stripe Connect Requirement Banner */}
        <StripeConnectRequirementBanner organization={organization} className="mb-6" />
        
        {/* Epic Hero Section */}
        <div className="relative mb-8 lg:mb-12 overflow-hidden rounded-2xl lg:rounded-3xl">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fcba00] via-[#ffd700] to-[#fcba00] opacity-90 dark:opacity-80"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          {/* Content */}
          <div className="relative px-6 lg:px-12 py-8 lg:py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Music className="h-6 w-6 lg:h-8 lg:w-8 text-black dark:text-white opacity-90" />
                  <span className="text-sm lg:text-base font-semibold text-black dark:text-white opacity-90 uppercase tracking-wider">
                    M10 DJ Company
                  </span>
                </div>
                <h1 className="text-3xl lg:text-5xl xl:text-6xl font-bold text-black dark:text-white mb-3 leading-tight">
                  {getGreeting()},<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-gray-900 to-black dark:from-white dark:via-gray-100 dark:to-white">
                    {user?.email?.split('@')[0] || 'DJ'}
                  </span>
                </h1>
                <p className="text-base lg:text-lg text-black dark:text-white opacity-80 max-w-2xl">
                  Your command center for managing events, clients, and growing your DJ business.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 rounded-xl"
                >
                  <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <Link href="/admin/contacts" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Users className="h-6 w-6 lg:h-7 lg:w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-blue-400 dark:text-blue-500 opacity-60" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Total Contacts
                </h3>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats?.totalContacts || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  {stats?.newLeads || 0} new leads
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/projects" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <Briefcase className="h-6 w-6 lg:h-7 lg:w-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Clock className="h-5 w-5 text-purple-400 dark:text-purple-500 opacity-60" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Projects
                </h3>
                <p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-1">
                  {stats?.totalProjects || 0}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {stats?.upcomingEvents || 0} upcoming
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/financial" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <DollarSign className="h-6 w-6 lg:h-7 lg:w-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CheckCircle className="h-5 w-5 text-emerald-400 dark:text-emerald-500 opacity-60" />
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  This Month
                </h3>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {formatCurrency(stats?.thisMonthRevenue || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {formatCurrency(stats?.totalRevenue || 0)} total
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/invoices" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                    <AlertCircle className="h-6 w-6 lg:h-7 lg:w-7 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  Outstanding
                </h3>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                  {formatCurrency(stats?.outstandingBalance || 0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Pending payment
                </p>
              </div>
            </div>
          </Link>
        </div>

          {/* Quick Actions - Premium Design */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8 mb-8 lg:mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">Quick Actions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Jump to your most-used features</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <Link href="/admin/contacts" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Contacts</span>
              </Link>
              <Link href="/admin/projects" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Briefcase className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Projects</span>
              </Link>
              <Link href="/admin/invoices" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Invoices</span>
              </Link>
              <Link href="/admin/financial" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Financial</span>
              </Link>
              <Link href="#analytics" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Analytics</span>
              </Link>
              <Link href="/admin/instagram" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 hover:shadow-md">
                <div className="p-3 bg-pink-100 dark:bg-pink-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Music className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Social</span>
              </Link>
              <Link href="/tipjar/dashboard/go-live" className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20 hover:border-red-600 dark:hover:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:shadow-md relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl group-hover:scale-110 transition-transform">
                  <Video className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white text-center">Go Live</span>
              </Link>
            </div>
          </div>

          {/* Subscription Usage Dashboard */}
          <div className="mb-8">
            <UsageDashboard />
          </div>

          {/* Analytics Dashboard */}
          <div className="mb-8">
            <AnalyticsDashboard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:mb-12">
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Upcoming Events</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your next gigs</p>
                    </div>
                  </div>
                  <Link href="/admin/projects" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingEvents.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming events scheduled</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">New bookings will appear here</p>
                  </div>
                ) : (
                  upcomingEvents.map((event, index) => (
                    <Link
                      key={event.id}
                      href={`/admin/projects/${event.id}`}
                      className="block p-5 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {event.client_name}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-1">{event.event_name}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="font-medium">{formatDate(event.event_date)}</span>
                            </div>
                            {event.venue_name && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[150px]">{event.venue_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(event.status)} flex-shrink-0`}>
                          {event.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Recent Contacts</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest inquiries</p>
                    </div>
                  </div>
                  <Link href="/admin/contacts" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentContacts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                      <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No contacts yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">New leads will appear here</p>
                  </div>
                ) : (
                  recentContacts.map(contact => (
                    <Link
                      key={contact.id}
                      href={`/admin/contacts/${contact.id}`}
                      className="block p-5 lg:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {contact.first_name} {contact.last_name}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 truncate">{contact.email_address}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="capitalize font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                              {contact.event_type}
                            </span>
                            {contact.event_date && (
                              <span className="font-medium">{formatDate(contact.event_date)}</span>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(contact.lead_status)} flex-shrink-0`}>
                          {contact.lead_status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Payments */}
          {recentPayments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-900/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Recent Payments</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Latest transactions</p>
                    </div>
                  </div>
                  <Link href="/admin/financial" className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">{payment.contact_name}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{payment.payment_method}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(payment.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </AdminLayout>
  );
}

