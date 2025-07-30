import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '../../utils/company_lib/supabase';
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
  Plus
} from 'lucide-react';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [submissionsData, analyticsData] = await Promise.all([
        db.getContactSubmissions(),
        db.getSubmissionAnalytics()
      ]);

      setSubmissions(submissionsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id, newStatus) => {
    try {
      await db.updateSubmissionStatus(id, newStatus);
      
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
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      quoted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      booked: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    return colors[status] || colors.new;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="btn-primary"
          >
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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center mr-6">
                  <div className="relative w-10 h-10 mr-3">
                    <Image
                      src="/logo.gif"
                      alt="M10 DJ Company Logo"
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized // This allows GIF animation to work
                      onError={(e) => {
                        // Fallback to static logo if GIF fails to load
                        e.target.src = '/logo-static.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      M10 DJ Company
                    </p>
                  </div>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/blog"
                  className="text-gray-600 dark:text-gray-400 hover:text-brand-gold transition-colors"
                >
                  View Blog
                </Link>
                <button
                  onClick={loadData}
                  className="bg-brand-gold hover:bg-brand-gold-dark text-black px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Refresh
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
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-all group"
            >
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-brand-gold group-hover:scale-110 transition-transform" />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Blog Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create and manage blog posts
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/blog/new"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-all group"
            >
              <div className="flex items-center">
                <Plus className="w-8 h-8 text-green-500 group-hover:scale-110 transition-transform" />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    New Blog Post
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new article
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/vendors"
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-all group"
            >
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform" />
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Vendor Network
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View preferred vendors
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-brand-gold" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Submissions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.totalSubmissions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {analytics.thisMonthSubmissions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      New Inquiries
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {submissions.filter(s => s.status === 'new').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Booked Events
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {submissions.filter(s => s.status === 'booked').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event Type Breakdown */}
          {analytics && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Event Types
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(analytics.eventTypeCounts).map(([eventType, count]) => (
                  <div key={eventType} className="text-center">
                    <p className="text-2xl font-bold text-brand-gold">{count}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{eventType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submissions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
                  Contact Submissions
                </h2>
                
                <div className="flex space-x-2">
                  {['all', 'new', 'contacted', 'quoted', 'booked', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                        statusFilter === status
                          ? 'bg-brand-gold text-black'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {submission.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {submission.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {submission.event_type}
                          </div>
                          {submission.event_date && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(submission.event_date).toLocaleDateString()}
                            </div>
                          )}
                          {submission.location && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {submission.location}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4 mr-2" />
                            <a href={`mailto:${submission.email}`} className="hover:text-brand-gold">
                              {submission.email}
                            </a>
                          </div>
                          {submission.phone && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Phone className="w-4 h-4 mr-2" />
                              <a href={`tel:${submission.phone}`} className="hover:text-brand-gold">
                                {submission.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={submission.status}
                          onChange={(e) => updateSubmissionStatus(submission.id, e.target.value)}
                          className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm"
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
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
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