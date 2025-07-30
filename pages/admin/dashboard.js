import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Plus,
  LogOut,
  RefreshCw,
  BarChart3
} from 'lucide-react';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const checkAuth = async () => {
    const supabase = createClient();
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        window.location.href = '/signin?redirect=/admin/dashboard';
        return;
      }

      // Simple admin check - you can update this list with your admin emails
      const adminEmails = [
        'admin@m10djcompany.com', 
        'manager@m10djcompany.com',
        'djbenmurray@gmail.com'  // Ben Murray - Owner
      ];
      const userIsAdmin = adminEmails.includes(user.email);

      if (!userIsAdmin) {
        window.location.href = '/';
        return;
      }

      setUser(user);
      setIsAdmin(true);
    } catch (err) {
      console.error('Auth error:', err);
      window.location.href = '/signin?redirect=/admin/dashboard';
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Load contact submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (submissionsError) {
        throw submissionsError;
      }

      setSubmissions(submissionsData || []);

      // Generate analytics from submissions data
      const eventTypeCounts = (submissionsData || []).reduce((acc, submission) => {
        acc[submission.event_type] = (acc[submission.event_type] || 0) + 1;
        return acc;
      }, {});

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const thisMonthSubmissions = (submissionsData || []).filter(
        submission => new Date(submission.created_at) >= thisMonth
      ).length;

      setAnalytics({
        totalSubmissions: (submissionsData || []).length,
        thisMonthSubmissions,
        eventTypeCounts,
        recentSubmissions: (submissionsData || []).slice(0, 5)
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id, newStatus) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === id 
            ? { ...submission, status: newStatus, updated_at: new Date().toISOString() }
            : submission
        )
      );
    } catch (err) {
      console.error('Error updating submission status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const filteredSubmissions = statusFilter === 'all' 
    ? submissions 
    : submissions.filter(s => s.status === statusFilter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      quoted: 'bg-purple-50 text-purple-700 border-purple-200',
      booked: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-gray-50 text-gray-700 border-gray-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || colors.new;
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
          <p className="text-gray-600 font-inter text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="heading-2 text-red-600 mb-4">Dashboard Error</h2>
          <p className="text-gray-600 font-inter mb-6">{error}</p>
          <button
            onClick={loadData}
            className="btn-primary"
          >
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
        <title>Admin Dashboard - M10 DJ Company</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-surface-light">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-border-light sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center mr-8 group">
                  <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center mr-3 group-hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-lg">M10</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 font-playfair">
                      Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 font-inter">
                      M10 DJ Company
                    </p>
                  </div>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 font-inter">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 font-inter">{user?.email}</p>
                </div>
                <button
                  onClick={loadData}
                  className="btn-secondary !px-3 !py-2"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="btn-secondary !px-3 !py-2 !text-red-600 !border-red-200 hover:!bg-red-50"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/admin/blog"
              className="modern-card hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 font-inter mb-1">
                    Blog Management
                  </h3>
                  <p className="text-sm text-gray-600 font-inter">
                    Create and manage blog posts
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/blog/new"
              className="modern-card hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 font-inter mb-1">
                    New Blog Post
                  </h3>
                  <p className="text-sm text-gray-600 font-inter">
                    Create a new article
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/vendors"
              className="modern-card hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 font-inter mb-1">
                    Vendor Network
                  </h3>
                  <p className="text-sm text-gray-600 font-inter">
                    View preferred vendors
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="modern-card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 font-inter">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 font-inter">
                      {analytics.totalSubmissions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modern-card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 font-inter">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 font-inter">
                      {analytics.thisMonthSubmissions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modern-card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 font-inter">
                      New Inquiries
                    </p>
                    <p className="text-2xl font-bold text-gray-900 font-inter">
                      {submissions.filter(s => s.status === 'new').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="modern-card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 font-inter">
                      Booked Events
                    </p>
                    <p className="text-2xl font-bold text-gray-900 font-inter">
                      {submissions.filter(s => s.status === 'booked').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Type Breakdown */}
          {analytics && Object.keys(analytics.eventTypeCounts).length > 0 && (
            <div className="modern-card mb-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-inter">
                  Event Types
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Object.entries(analytics.eventTypeCounts).map(([eventType, count]) => (
                  <div key={eventType} className="text-center">
                    <p className="text-3xl font-bold text-brand font-inter">{count}</p>
                    <p className="text-sm text-gray-600 font-inter mt-1">{eventType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div className="modern-card">
            <div className="p-6 border-b border-border-light">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                  <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 font-inter">
                    Contact Submissions
                  </h2>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {['all', 'new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors font-inter ${
                        statusFilter === status
                          ? 'bg-brand text-black'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Client
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider font-inter">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {filteredSubmissions.map((submission) => (
                    <tr 
                      key={submission.id} 
                      className="hover:bg-surface-light transition-colors cursor-pointer"
                      onClick={() => window.location.href = `/admin/contacts/${submission.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-semibold text-gray-900 font-inter">
                            {submission.name}
                          </div>
                          <div className="text-sm text-gray-500 font-inter">
                            {submission.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900 font-inter">
                            {submission.event_type}
                          </div>
                          {submission.event_date && (
                            <div className="text-sm text-gray-500 flex items-center font-inter">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(submission.event_date).toLocaleDateString()}
                            </div>
                          )}
                          {submission.location && (
                            <div className="text-sm text-gray-500 flex items-center font-inter">
                              <MapPin className="w-4 h-4 mr-1" />
                              {submission.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600 font-inter">
                            <Mail className="w-4 h-4 mr-2" />
                            <a href={`mailto:${submission.email}`} className="hover:text-brand transition-colors">
                              {submission.email}
                            </a>
                          </div>
                          {submission.phone && (
                            <div className="flex items-center text-sm text-gray-600 font-inter">
                              <Phone className="w-4 h-4 mr-2" />
                              <a href={`tel:${submission.phone}`} className="hover:text-brand transition-colors">
                                {submission.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border font-inter ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-inter">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={submission.status}
                          onChange={(e) => {
                            e.stopPropagation(); // Prevent row click when selecting
                            updateSubmissionStatus(submission.id, e.target.value);
                          }}
                          className="modern-select !py-1 !px-2 text-sm"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="quoted">Quoted</option>
                          <option value="booked">Booked</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredSubmissions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-inter text-lg">
                  {statusFilter === 'all' 
                    ? 'No submissions found.'
                    : `No ${statusFilter} submissions found.`
                  }
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
} 