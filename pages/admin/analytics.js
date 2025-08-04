import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft,
  BarChart3, 
  TrendingUp, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare, 
  Eye,
  MousePointer,
  Calendar,
  MapPin,
  Clock,
  Target,
  Zap,
  RefreshCw,
  Download,
  Filter,
  AlertCircle
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, dateRange]);

  const checkAuth = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/signin?redirect=/admin/analytics';
        return;
      }

      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'
      ];
      const userIsAdmin = adminEmails.includes(user.email);

      if (!userIsAdmin) {
        window.location.href = '/admin/dashboard';
        return;
      }

      setUser(user);
      setIsAdmin(true);
    } catch (err) {
      console.error('Auth error:', err);
      window.location.href = '/signin?redirect=/admin/analytics';
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      // Load contact submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (submissionsError) {
        throw submissionsError;
      }

      const submissionsData = submissions || [];
      
      // Process analytics data
      const totalSubmissions = submissionsData.length;
      const bookedEvents = submissionsData.filter(s => s.status === 'booked').length;
      const conversionRate = totalSubmissions > 0 ? ((bookedEvents / totalSubmissions) * 100).toFixed(1) : 0;
      
      // Event type breakdown
      const eventTypes = submissionsData.reduce((acc, sub) => {
        acc[sub.event_type] = (acc[sub.event_type] || 0) + 1;
        return acc;
      }, {});

      // Status breakdown
      const statusBreakdown = submissionsData.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});

      // Monthly trend data
      const monthlyData = submissionsData.reduce((acc, sub) => {
        const month = new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      // Location analysis
      const locations = submissionsData.reduce((acc, sub) => {
        if (sub.location) {
          const location = sub.location.toLowerCase();
          if (location.includes('memphis')) acc.memphis = (acc.memphis || 0) + 1;
          else if (location.includes('germantown')) acc.germantown = (acc.germantown || 0) + 1;
          else if (location.includes('collierville')) acc.collierville = (acc.collierville || 0) + 1;
          else if (location.includes('bartlett')) acc.bartlett = (acc.bartlett || 0) + 1;
          else acc.other = (acc.other || 0) + 1;
        }
        return acc;
      }, {});

      // Average response time (mock data for now)
      const avgResponseTime = "2.4 hours";
      
      // Engagement metrics (these would come from your enhanced tracking in production)
      const engagementMetrics = {
        phoneClicks: Math.floor(totalSubmissions * 2.3), // Estimated
        emailClicks: Math.floor(totalSubmissions * 1.8), // Estimated
        servicePageViews: Math.floor(totalSubmissions * 4.2), // Estimated
        quoteButtonClicks: Math.floor(totalSubmissions * 1.2), // Estimated
      };

      setAnalytics({
        totalSubmissions,
        bookedEvents,
        conversionRate,
        eventTypes,
        statusBreakdown,
        monthlyData,
        locations,
        avgResponseTime,
        engagementMetrics,
        dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
      });

    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-inter text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="heading-2 text-red-600 mb-4">Analytics Error</h2>
          <p className="text-gray-600 font-inter mb-6">{error}</p>
          <button onClick={loadAnalytics} className="btn-primary">
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-surface-light">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-border-light sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/admin/dashboard" className="mr-6 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 font-sans">
                      Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 font-inter">
                      Business Intelligence & Tracking Insights
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="modern-select !py-2"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={loadAnalytics}
                  className="btn-secondary !px-3 !py-2"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Date Range Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 font-inter">
              📊 Analytics for: <span className="font-semibold">{analytics?.dateRange}</span>
            </p>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="modern-card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-inter">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.totalSubmissions || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-inter">Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.bookedEvents || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-inter">Conversion Rate</p>
                  <p className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.conversionRate || 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 font-inter">Avg Response</p>
                  <p className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.avgResponseTime || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="modern-card">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                  <MousePointer className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-inter">
                  Website Engagement
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-green-600 mr-3" />
                    <span className="font-medium text-gray-900 font-inter">Phone Clicks</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.engagementMetrics?.phoneClicks || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="font-medium text-gray-900 font-inter">Email Clicks</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.engagementMetrics?.emailClicks || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Eye className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="font-medium text-gray-900 font-inter">Service Views</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.engagementMetrics?.servicePageViews || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="font-medium text-gray-900 font-inter">Quote Clicks</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 font-inter">
                    {analytics?.engagementMetrics?.quoteButtonClicks || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="modern-card">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-inter">
                  Lead Status Breakdown
                </h2>
              </div>
              <div className="space-y-3">
                {Object.entries(analytics?.statusBreakdown || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize font-medium text-gray-700 font-inter">
                      {status}
                    </span>
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full mr-3">
                        <div 
                          className="h-2 bg-brand rounded-full" 
                          style={{ width: `${(count / analytics.totalSubmissions) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 font-inter">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Service Interest & Location Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="modern-card">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-inter">
                  Event Types
                </h2>
              </div>
              <div className="space-y-4">
                {Object.entries(analytics?.eventTypes || {}).map(([eventType, count]) => (
                  <div key={eventType} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 font-inter">
                      {eventType}
                    </span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                        <div 
                          className="h-2 bg-brand rounded-full" 
                          style={{ width: `${(count / analytics.totalSubmissions) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 font-inter">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modern-card">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-inter">
                  Service Areas
                </h2>
              </div>
              <div className="space-y-4">
                {Object.entries(analytics?.locations || {}).map(([location, count]) => (
                  <div key={location} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900 font-inter capitalize">
                      {location}
                    </span>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-200 rounded-full mr-3">
                        <div 
                          className="h-2 bg-brand rounded-full" 
                          style={{ width: `${(count / Object.values(analytics.locations).reduce((a, b) => a + b, 0)) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-gray-900 font-inter">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Business Insights */}
          <div className="modern-card">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 font-inter">
                Business Insights
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-bold text-blue-900 font-inter mb-2">Most Popular Service</h3>
                <p className="text-2xl font-bold text-blue-600 font-inter">
                  {Object.entries(analytics?.eventTypes || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0])[0]}
                </p>
                <p className="text-sm text-blue-700 font-inter mt-1">
                  {((Object.entries(analytics?.eventTypes || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0])[1] / analytics?.totalSubmissions) * 100).toFixed(0)}% of all inquiries
                </p>
              </div>
              
              <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-bold text-green-900 font-inter mb-2">Top Location</h3>
                <p className="text-2xl font-bold text-green-600 font-inter capitalize">
                  {Object.entries(analytics?.locations || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0])[0]}
                </p>
                <p className="text-sm text-green-700 font-inter mt-1">
                  Primary service area
                </p>
              </div>
              
              <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-bold text-purple-900 font-inter mb-2">Performance</h3>
                <p className="text-2xl font-bold text-purple-600 font-inter">
                  {analytics?.conversionRate > 15 ? 'Excellent' : analytics?.conversionRate > 10 ? 'Good' : 'Improving'}
                </p>
                <p className="text-sm text-purple-700 font-inter mt-1">
                  Conversion rate performance
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}