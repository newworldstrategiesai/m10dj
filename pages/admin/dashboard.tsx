/**
 * Enhanced Admin Dashboard
 * Comprehensive overview with real-time data, upcoming events, financial stats, and quick actions
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
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
  LogOut,
  RefreshCw,
  BarChart3,
  FileText,
  CreditCard,
  Briefcase,
  ArrowRight,
  MapPin,
  Music,
  Star
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';

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

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];

      if (!adminEmails.includes(user.email || '')) {
        router.push('/');
        return;
      }

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

      // Revenue stats
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: payments } = await supabase
        .from('payments')
        .select('total_amount, payment_date, payment_status')
        .eq('payment_status', 'Paid');

      const thisMonthRevenue = (payments || [])
        .filter(p => new Date(p.payment_date) >= startOfMonth)
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      const totalRevenue = (payments || [])
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);

      // Outstanding balance
      const { data: outstanding } = await supabase
        .from('outstanding_balances')
        .select('balance_due');

      const outstandingBalance = (outstanding || [])
        .reduce((sum, o) => sum + (o.balance_due || 0), 0);

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
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          total_amount,
          payment_date,
          payment_method,
          contact_id,
          contacts (first_name, last_name)
        `)
        .eq('payment_status', 'Paid')
        .order('payment_date', { ascending: false })
        .limit(5);

      if (!error && data) {
        const formattedPayments = data.map(p => ({
          id: p.id,
          contact_name: p.contacts ? `${p.contacts.first_name} ${p.contacts.last_name}` : 'Unknown',
          amount: p.total_amount,
          payment_date: p.payment_date,
          payment_method: p.payment_method
        }));
        setRecentPayments(formattedPayments);
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">M10 DJ Company</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/admin/contacts" className="block group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8" />
                  <TrendingUp className="h-5 w-5 opacity-75" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Total Contacts</h3>
                <p className="text-3xl font-bold mb-1">{stats?.totalContacts || 0}</p>
                <p className="text-sm opacity-75">{stats?.newLeads || 0} new leads</p>
              </div>
            </Link>

            <Link href="/admin/projects" className="block group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Briefcase className="h-8 w-8" />
                  <Clock className="h-5 w-5 opacity-75" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Active Projects</h3>
                <p className="text-3xl font-bold mb-1">{stats?.totalProjects || 0}</p>
                <p className="text-sm opacity-75">{stats?.upcomingEvents || 0} upcoming</p>
              </div>
            </Link>

            <Link href="/admin/financial" className="block group">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8" />
                  <CheckCircle className="h-5 w-5 opacity-75" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">This Month Revenue</h3>
                <p className="text-3xl font-bold mb-1">{formatCurrency(stats?.thisMonthRevenue || 0)}</p>
                <p className="text-sm opacity-75">{formatCurrency(stats?.totalRevenue || 0)} total</p>
              </div>
            </Link>

            <Link href="/admin/invoices" className="block group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Outstanding</h3>
                <p className="text-3xl font-bold mb-1">{formatCurrency(stats?.outstandingBalance || 0)}</p>
                <p className="text-sm opacity-75">Pending payment</p>
              </div>
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Link href="/admin/contacts" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">View Contacts</span>
              </Link>
              <Link href="/admin/projects" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                <Briefcase className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">View Projects</span>
              </Link>
              <Link href="/admin/invoices" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">View Invoices</span>
              </Link>
              <Link href="/admin/financial" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors">
                <BarChart3 className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-gray-900">Financial Reports</span>
              </Link>
              <Link href="/admin/instagram" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-pink-500 hover:bg-pink-50 transition-colors">
                <Music className="h-5 w-5 text-pink-600" />
                <span className="text-sm font-medium text-gray-900">Social Media</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                </div>
                <Link href="/admin/projects" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No upcoming events scheduled</p>
                  </div>
                ) : (
                  upcomingEvents.map(event => (
                    <Link
                      key={event.id}
                      href={`/admin/projects/${event.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{event.client_name}</p>
                          <p className="text-sm text-gray-600 mt-1">{event.event_name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(event.event_date)}
                            </div>
                            {event.venue_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.venue_name}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Recent Contacts</h2>
                </div>
                <Link href="/admin/contacts" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentContacts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No contacts yet</p>
                  </div>
                ) : (
                  recentContacts.map(contact => (
                    <Link
                      key={contact.id}
                      href={`/admin/contacts/${contact.id}`}
                      className="block p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{contact.email_address}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="capitalize">{contact.event_type}</span>
                            {contact.event_date && (
                              <span>{formatDate(contact.event_date)}</span>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(contact.lead_status)}>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
                </div>
                <Link href="/admin/financial" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Client</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentPayments.map(payment => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.contact_name}</td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{payment.payment_method}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

