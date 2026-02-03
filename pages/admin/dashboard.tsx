/**
 * Enhanced Admin Dashboard
 * Comprehensive overview with real-time data, upcoming events, financial stats, and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { isRateLimited, setRateLimited } from '@/utils/supabase/rate-limiter';
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
  Video,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/layouts/AdminLayout';
import UsageDashboard from '@/components/subscription/UsageDashboard';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import StripeConnectRequirementBanner from '@/components/subscription/StripeConnectRequirementBanner';
import { getCurrentOrganization, Organization } from '@/utils/organization-context';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';

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
  custom_fields?: any;
  // Source tracking
  submission_id?: string | null;
  request_id?: string | null;
  request_type?: 'song_request' | 'shoutout' | 'tip' | null;
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
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked]);

  const checkAuth = async () => {
    if (authChecked) return; // Prevent multiple auth checks

    // Check global rate limiter
    if (isRateLimited()) {
      console.log('⏳ Skipping dashboard auth check - rate limited');
      setAuthChecked(true);
      return;
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error?.message?.includes('rate limit') || error?.status === 429) {
        setRateLimited();
        setAuthChecked(true);
        return;
      }

      if (error || !user) {
        router.push('/signin?redirect=/admin/dashboard');
        return;
      }

      // CRITICAL: Check product context FIRST - TipJar users should NEVER see M10 admin dashboard
      const productContext = user.user_metadata?.product_context;
      if (productContext === 'tipjar') {
        // TipJar users go directly to crowd requests (their main admin interface)
        // Redirect immediately - do NOT fetch any data
        setAuthChecked(true);
        router.push('/admin/crowd-requests');
        return;
      }

      // Check if user is platform admin
      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];

      const isPlatformAdmin = adminEmails.includes(user.email || '');

      // Get organization for data filtering
      const org = await getCurrentOrganization(supabase);
      
      if (!org && !isPlatformAdmin) {
        // No organization and not admin - show error instead of redirecting to non-existent page
        console.error('User has no organization and is not an admin');
        setAuthChecked(true);
        return;
      }

      if (org) {
        setOrganization(org);
        
        // Check if this is a TipJar organization (double-check)
        if (org.product_context === 'tipjar') {
          setAuthChecked(true);
          router.push('/admin/crowd-requests');
          return;
        }

        if (!isPlatformAdmin && org.subscription_tier === 'starter') {
          // Redirect starter tier users to simplified dashboard
          setAuthChecked(true);
          router.push('/admin/dashboard-starter');
          return;
        }
      }

      // Platform admins and paid tier users see full dashboard
      setUser(user);
      setAuthChecked(true);

      // Now fetch dashboard data since auth is complete
      fetchDashboardData();
    } catch (err) {
      console.error('Auth error:', err);
      setAuthChecked(true);
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
      // Check rate limiter before auth call
      if (isRateLimited()) {
        console.log('⏳ Skipping stats auth check - rate limited');
        return;
      }

      // CRITICAL: Get organization_id first to filter all queries
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error?.message?.includes('rate limit') || error?.status === 429) {
        setRateLimited();
        return;
      }
      if (!user) return;

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];
      const isPlatformAdmin = adminEmails.includes(user.email || '');

      // Get organization for filtering (platform admins see all, others see only their org)
      const org = await getCurrentOrganization(supabase);
      const orgId = org?.id;

      // Build base queries
      let contactsQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      let eventsQuery = supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      // CRITICAL: Filter by organization_id for non-admin users
      if (!isPlatformAdmin && orgId) {
        contactsQuery = contactsQuery.eq('organization_id', orgId);
        eventsQuery = eventsQuery.eq('organization_id', orgId);
      } else if (!isPlatformAdmin && !orgId) {
        // No organization - return zeros
        setStats({
          totalContacts: 0,
          totalProjects: 0,
          upcomingEvents: 0,
          thisMonthRevenue: 0,
          totalRevenue: 0,
          outstandingBalance: 0,
          newLeads: 0,
          bookedEvents: 0
        });
        return;
      }

      // Total contacts
      const { count: totalContacts } = await contactsQuery;

      // Total projects
      const { count: totalProjects } = await eventsQuery;

      // Upcoming events (all future events - exclude today and past dates)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let upcomingEventsQuery = supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', tomorrow.toISOString().split('T')[0])
        .in('status', ['confirmed', 'in_progress']);

      if (!isPlatformAdmin && orgId) {
        upcomingEventsQuery = upcomingEventsQuery.eq('organization_id', orgId);
      }

      const { count: upcomingEvents } = await upcomingEventsQuery;

      // Revenue stats - temporarily disabled (payments table not migrated)
      const thisMonthRevenue = 0;
      const totalRevenue = 0;
      const outstandingBalance = 0;

      // New leads - filtered by organization
      let newLeadsQuery = supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('lead_status', 'New')
        .is('deleted_at', null);

      if (!isPlatformAdmin && orgId) {
        newLeadsQuery = newLeadsQuery.eq('organization_id', orgId);
      }

      const { count: newLeads } = await newLeadsQuery;

      // Booked events - filtered by organization
      let bookedEventsQuery = supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .in('status', ['confirmed', 'in_progress']);

      if (!isPlatformAdmin && orgId) {
        bookedEventsQuery = bookedEventsQuery.eq('organization_id', orgId);
      }

      const { count: bookedEvents } = await bookedEventsQuery;

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
      // Check rate limiter before auth call
      if (isRateLimited()) {
        console.log('⏳ Skipping events auth check - rate limited');
        return;
      }

      // CRITICAL: Get organization_id to filter events
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError?.message?.includes('rate limit') || userError?.status === 429) {
        setRateLimited();
        return;
      }
      if (!user) return;

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];
      const isPlatformAdmin = adminEmails.includes(user.email || '');
      const org = await getCurrentOrganization(supabase);
      const orgId = org?.id;

      // Only show events that are tomorrow or later (exclude today and past)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let eventsQuery = supabase
        .from('events')
        .select('*')
        .gte('event_date', tomorrow.toISOString().split('T')[0])
        .in('status', ['confirmed', 'in_progress'])
        .order('event_date', { ascending: true })
        .limit(10);

      // CRITICAL: Filter by organization_id for non-admin users
      if (!isPlatformAdmin && orgId) {
        eventsQuery = eventsQuery.eq('organization_id', orgId);
      } else if (!isPlatformAdmin && !orgId) {
        setUpcomingEvents([]);
        return;
      }

      const { data, error: queryError } = await eventsQuery;

      if (!queryError && data) {
        setUpcomingEvents(data);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const fetchRecentContacts = async () => {
    try {
      // Check rate limiter before auth call
      if (isRateLimited()) {
        console.log('⏳ Skipping contacts auth check - rate limited');
        return;
      }

      // CRITICAL: Get organization_id to filter contacts
      const { data: { user }, error: contactUserError } = await supabase.auth.getUser();
      if (contactUserError?.message?.includes('rate limit') || contactUserError?.status === 429) {
        setRateLimited();
        return;
      }
      if (!user) return;

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];
      const isPlatformAdmin = adminEmails.includes(user.email || '');
      const org = await getCurrentOrganization(supabase);
      const orgId = org?.id;

      let contactsQuery = supabase
        .from('contacts')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(5);

      // CRITICAL: Filter by organization_id for non-admin users
      if (!isPlatformAdmin && orgId) {
        contactsQuery = contactsQuery.eq('organization_id', orgId);
      } else if (!isPlatformAdmin && !orgId) {
        setRecentContacts([]);
        return;
      }

      const { data, error: contactsError } = await contactsQuery;

      if (!contactsError && data) {
        // For each contact, try to find the source (form submission or crowd request)
        const contactsWithSource = await Promise.all(
          data.map(async (contact: any) => {
            const contactWithSource: RecentContact = { ...contact };

            // Check for form submission match (by email/phone and similar creation time)
            if (contact.email_address || contact.phone) {
              try {
                // Look for contact_submissions with matching email/phone created within 1 hour
                const submissionQuery = supabase
                  .from('contact_submissions')
                  .select('id')
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (contact.email_address) {
                  submissionQuery.eq('email', contact.email_address);
                } else if (contact.phone) {
                  submissionQuery.eq('phone', contact.phone);
                }

                // Check submissions created within 1 hour of contact creation
                const contactCreatedAt = new Date(contact.created_at);
                const oneHourBefore = new Date(contactCreatedAt.getTime() - 60 * 60 * 1000);
                const oneHourAfter = new Date(contactCreatedAt.getTime() + 60 * 60 * 1000);

                submissionQuery.gte('created_at', oneHourBefore.toISOString());
                submissionQuery.lte('created_at', oneHourAfter.toISOString());

                const { data: submission, error: submissionError } = await submissionQuery.single();

                // Handle 406 errors gracefully (RLS policy or format issues)
                if (submissionError) {
                  // Log but don't break - 406 errors are often RLS-related and non-critical
                  // Check error message for 406 status (PostgrestError doesn't have status property)
                  const is406Error = submissionError.message?.includes('406') || 
                                    submissionError.code === 'PGRST301' ||
                                    submissionError.message?.includes('Not Acceptable');
                  if (!is406Error) {
                    console.warn('Error checking contact submission:', submissionError);
                  }
                } else if (submission) {
                  contactWithSource.submission_id = (submission as any).id;
                  return contactWithSource;
                }
              } catch (err) {
                // Silently handle errors - don't break the contact list
                console.warn('Error checking contact submission match:', err);
              }
            }

            // Check for crowd request match (by requester_email/requester_phone)
            if (contact.email_address || contact.phone) {
              try {
                const requestQuery = supabase
                  .from('crowd_requests')
                  .select('id, request_type')
                  .order('created_at', { ascending: false })
                  .limit(1);

                if (contact.email_address) {
                  requestQuery.eq('requester_email', contact.email_address);
                } else if (contact.phone) {
                  requestQuery.eq('requester_phone', contact.phone);
                }

                // Check requests created within 1 hour of contact creation
                const contactCreatedAt = new Date(contact.created_at);
                const oneHourBefore = new Date(contactCreatedAt.getTime() - 60 * 60 * 1000);
                const oneHourAfter = new Date(contactCreatedAt.getTime() + 60 * 60 * 1000);

                requestQuery.gte('created_at', oneHourBefore.toISOString());
                requestQuery.lte('created_at', oneHourAfter.toISOString());

                const { data: request, error: requestError } = await requestQuery.single();

                // Handle 406 errors gracefully (RLS policy or format issues)
                if (requestError) {
                  // Log but don't break - 406 errors are often RLS-related and non-critical
                  // Check error message for 406 status (PostgrestError doesn't have status property)
                  const is406Error = requestError.message?.includes('406') || 
                                    requestError.code === 'PGRST301' ||
                                    requestError.message?.includes('Not Acceptable');
                  if (!is406Error) {
                    console.warn('Error checking crowd request:', requestError);
                  }
                } else if (request) {
                  contactWithSource.request_id = (request as any).id;
                  contactWithSource.request_type = (request as any).request_type;
                  return contactWithSource;
                }
              } catch (err) {
                // Silently handle errors - don't break the contact list
                console.warn('Error checking crowd request match:', err);
              }
            }

            // Check custom_fields for source information
            if (contact.custom_fields) {
              if (contact.custom_fields.submission_id) {
                contactWithSource.submission_id = contact.custom_fields.submission_id;
              }
              if (contact.custom_fields.request_id) {
                contactWithSource.request_id = contact.custom_fields.request_id;
                contactWithSource.request_type = contact.custom_fields.request_type;
              }
            }

            return contactWithSource;
          })
        );

        setRecentContacts(contactsWithSource);
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

  return (
    <PageLoadingWrapper isLoading={loading} message="Loading your dashboard...">
      <AdminLayout title="Dashboard" description="M10 DJ Company Admin Dashboard">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-2 sm:pb-4 lg:pb-8">
        {/* Stripe Connect Requirement Banner - Compact */}
        <StripeConnectRequirementBanner organization={organization} className="mb-2 sm:mb-4" />
        
        {/* Epic Hero Section - More Compact on Mobile */}
        <div className="relative mb-4 sm:mb-6 lg:mb-8 overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl">
          {/* Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#fcba00] via-[#ffd700] to-[#fcba00] opacity-90 dark:opacity-80"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          {/* Content - Reduced padding on mobile */}
          <div className="relative px-3 sm:px-6 lg:px-12 py-4 sm:py-6 lg:py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <Music className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-black dark:text-white opacity-90 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-black dark:text-white opacity-90 uppercase tracking-wider truncate">
                    M10 DJ Company
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-black dark:text-white mb-1.5 sm:mb-2 leading-tight">
                  {getGreeting()},<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-black via-gray-900 to-black dark:from-white dark:via-gray-100 dark:to-white">
                    {user?.email?.split('@')[0] || 'DJ'}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-black dark:text-white opacity-80 max-w-2xl line-clamp-2 sm:line-clamp-none">
                  Your command center for managing events, clients, and growing your DJ business.
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200 p-2 sm:p-3 lg:p-4 rounded-lg"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Cards - More Compact */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Link href="/admin/contacts" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500"></div>
              
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-500 rounded-full blur-3xl"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 lg:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 dark:text-blue-500 opacity-60 hidden sm:block" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                  Total Contacts
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                  {stats?.totalContacts || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="hidden sm:inline">{stats?.newLeads || 0} new leads</span>
                  <span className="sm:hidden">{stats?.newLeads || 0} new</span>
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/projects" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 lg:p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg sm:rounded-xl">
                    <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400 dark:text-purple-500 opacity-60 hidden sm:block" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                  Projects
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">
                  {stats?.totalProjects || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">{stats?.upcomingEvents || 0} upcoming</span>
                  <span className="sm:hidden">{stats?.upcomingEvents || 0}</span>
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/financial" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-emerald-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 lg:p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg sm:rounded-xl">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400 dark:text-emerald-500 opacity-60 hidden sm:block" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                  This Month
                </h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                  {formatCurrency(stats?.thisMonthRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {formatCurrency(stats?.totalRevenue || 0)} total
                </p>
              </div>
            </div>
          </Link>

          <Link href="/admin/invoices" className="group">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500"></div>
              <div className="absolute inset-0 opacity-5 dark:opacity-10">
                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-amber-500 rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="p-1.5 sm:p-2 lg:p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg sm:rounded-xl">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 uppercase tracking-wide">
                  Outstanding
                </h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 truncate">
                  {formatCurrency(stats?.outstandingBalance || 0)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pending payment
                </p>
              </div>
            </div>
          </Link>
        </div>

          {/* Quick Actions - More Compact */}
          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Jump to your most-used features</p>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2 sm:gap-3">
              <Link href="/admin/contacts" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Contacts</span>
              </Link>
              <Link href="/admin/projects" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Projects</span>
              </Link>
              <Link href="/admin/events" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Events</span>
              </Link>
              <Link href="/admin/tickets" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Tickets</span>
              </Link>
              <Link href="/admin/invoices" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Invoices</span>
              </Link>
              <Link href="/admin/financial" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Financial</span>
              </Link>
              <Link href="#analytics" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Analytics</span>
              </Link>
              <Link href="/admin/instagram" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-pink-100 dark:bg-pink-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Music className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Social</span>
              </Link>
              <Link href="/tipjar/dashboard/go-live" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20 hover:border-red-600 dark:hover:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:shadow-sm relative min-h-[70px] sm:min-h-[90px]">
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full animate-pulse"></div>
                <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Video className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Go Live</span>
              </Link>
              <Link href="/tipjar/dashboard/meet" className="group flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:border-emerald-600 dark:hover:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all duration-200 hover:shadow-sm min-h-[70px] sm:min-h-[90px]">
                <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:scale-110 transition-transform">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-gray-900 dark:text-white text-center">Meet</span>
              </Link>
            </div>
          </div>

          {/* Subscription Usage Dashboard */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <UsageDashboard />
          </div>

          {/* Analytics Dashboard */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <AnalyticsDashboard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Upcoming Events</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Your next gigs</p>
                    </div>
                  </div>
                  <Link href="/admin/projects" className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1 transition-colors flex-shrink-0">
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {upcomingEvents.length === 0 ? (
                  <div className="p-6 sm:p-8 lg:p-12 text-center">
                    <div className="inline-flex p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 sm:mb-4">
                      <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">No upcoming events scheduled</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">New bookings will appear here</p>
                  </div>
                ) : (
                  upcomingEvents.map((event, index) => (
                    <Link
                      key={event.id}
                      href={`/admin/projects/${event.id}`}
                      className="block p-3 sm:p-4 lg:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <p className="font-semibold sm:font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                              {event.client_name}
                            </p>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 line-clamp-1">{event.event_name}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span className="font-medium">{formatDate(event.event_date)}</span>
                            </div>
                            {event.venue_name && (
                              <div className="flex items-center gap-1 min-w-0">
                                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                <span className="truncate max-w-[120px] sm:max-w-[150px]">{event.venue_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(event.status)} flex-shrink-0 text-xs`}>
                          {event.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Recent Contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Recent Contacts</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">Latest inquiries</p>
                    </div>
                  </div>
                  <Link href="/admin/contacts" className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition-colors flex-shrink-0">
                    <span className="hidden sm:inline">View All</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentContacts.length === 0 ? (
                  <div className="p-6 sm:p-8 lg:p-12 text-center">
                    <div className="inline-flex p-3 sm:p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3 sm:mb-4">
                      <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">No contacts yet</p>
                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">New leads will appear here</p>
                  </div>
                ) : (
                  recentContacts.map(contact => {
                    // Determine the click destination based on source
                    const getContactHref = () => {
                      // If contact was created from a form submission, go to submission page
                      if (contact.submission_id) {
                        return `/admin/leads/${contact.submission_id}`;
                      }
                      // If contact was created from a song request or bid, go to crowd requests page
                      if (contact.request_id) {
                        return `/admin/crowd-requests`;
                      }
                      // Default: go to contact page
                      return `/admin/contacts/${contact.id}`;
                    };

                    return (
                      <Link
                        key={contact.id}
                        href={getContactHref()}
                        className="block p-3 sm:p-4 lg:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <p className="font-semibold sm:font-bold text-sm sm:text-base text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {contact.first_name} {contact.last_name}
                              </p>
                              {/* Source indicator */}
                              {contact.submission_id && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0">
                                  Form
                                </span>
                              )}
                              {contact.request_id && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 flex-shrink-0">
                                  {contact.request_type === 'song_request' ? 'Song' : contact.request_type === 'shoutout' ? 'Shoutout' : 'Tip'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 truncate">{contact.email_address}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <span className="capitalize font-medium px-2 py-0.5 sm:py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                                {contact.event_type}
                              </span>
                              {contact.event_date && (
                                <span className="font-medium">{formatDate(contact.event_date)}</span>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(contact.lead_status)} flex-shrink-0 text-xs`}>
                            {contact.lead_status}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
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
    </PageLoadingWrapper>
  );
}

