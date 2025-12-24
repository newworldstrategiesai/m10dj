/**
 * Form Submissions Page
 * View and manage contact form submissions from the website
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  ClipboardList,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MessageSquare,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  Trash2,
  ExternalLink,
  Filter,
  Search,
  RefreshCw,
  Link as LinkIcon,
  Loader,
  X,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPhoneLocation } from '@/utils/area-code-lookup';

interface FormSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  event_type: string;
  event_date: string | null;
  location: string | null;
  message: string | null;
  status: 'new' | 'contacted' | 'quoted' | 'booked' | 'completed' | 'cancelled' | 'spam';
  venue_image_url: string | null;
  venue_image_fetched_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CommunicationLog {
  id: string;
  communication_type: 'email' | 'sms' | 'call' | 'note' | 'meeting';
  direction: 'inbound' | 'outbound';
  subject: string | null;
  content: string;
  status: string;
  created_at: string;
}

export default function FormSubmissionsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [communicationHistory, setCommunicationHistory] = useState<CommunicationLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lookingUpContact, setLookingUpContact] = useState<string | null>(null);
  const [fetchingVenueImage, setFetchingVenueImage] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedSubmission) {
      fetchCommunicationHistory(selectedSubmission.id);
    }
  }, [selectedSubmission]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubmissions();
    setRefreshing(false);
  };

  const fetchCommunicationHistory = async (submissionId: string) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('communication_log')
        .select('*')
        .eq('contact_submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunicationHistory(data || []);
    } catch (error) {
      console.error('Error fetching communication history:', error);
      setCommunicationHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        s.event_type.toLowerCase().includes(query) ||
        (s.phone && s.phone.includes(query)) ||
        (s.location && s.location.toLowerCase().includes(query))
      );
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (id: string, newStatus: FormSubmission['status']) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error updating status:', error);
        // Check if it's a constraint error
        if (error.message?.includes('check constraint') || error.message?.includes('violates check constraint')) {
          alert(`Failed to update status: The database doesn't support the 'spam' status yet. Please run the migration: supabase/migrations/add_spam_status_to_submissions.sql`);
        } else {
          alert(`Failed to update status: ${error.message}`);
        }
        throw error;
      }

      // Update local state
      setSubmissions(prev =>
        prev.map(s => s.id === id ? { ...s, status: newStatus } : s)
      );

      if (selectedSubmission?.id === id) {
        setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(null);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      new: { label: 'New', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      contacted: { label: 'Contacted', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      quoted: { label: 'Quoted', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      booked: { label: 'Booked', className: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: 'Completed', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
      spam: { label: 'Spam', className: 'bg-orange-100 text-orange-800 border-orange-200' },
    };

    const badge = badges[status] || badges.new;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
        {badge.label}
      </span>
    );
  };

  const findContactByEmail = async (email: string) => {
    try {
      setLookingUpContact(email);
      const { data, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('email_address', email)
        .is('deleted_at', null)
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error finding contact:', error);
      return null;
    } finally {
      setLookingUpContact(null);
    }
  };

  const handleNameClick = async (e: React.MouseEvent, submission: FormSubmission) => {
    e.stopPropagation();
    const contactId = await findContactByEmail(submission.email);
    if (contactId) {
      router.push(`/admin/contacts/${contactId}`);
    } else {
      alert(`No contact found with email: ${submission.email}\n\nYou can create a contact from this submission.`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSubmissionStats = () => {
    return {
      total: submissions.length,
      new: submissions.filter(s => s.status === 'new').length,
      contacted: submissions.filter(s => s.status === 'contacted').length,
      booked: submissions.filter(s => s.status === 'booked').length,
    };
  };

  const stats = getSubmissionStats();

  if (loading) {
    return (
      <AdminLayout title="Form Submissions" description="Manage website contact form submissions">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Form Submissions" description="Manage website contact form submissions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 mb-1">
              <ClipboardList className="w-8 h-8 text-[#fcba00] flex-shrink-0" />
              <span>Form Submissions</span>
            </h1>
            <p className="text-sm text-gray-600 whitespace-normal overflow-visible">
              Contact form submissions from your website
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="slim"
            disabled={refreshing}
            className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">New</p>
                <p className="text-2xl font-bold text-blue-900">{stats.new}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Contacted</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.contacted}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Booked</p>
                <p className="text-2xl font-bold text-green-900">{stats.booked}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, phone, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="quoted">Quoted</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="spam">Spam</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Contact form submissions will appear here'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedSubmission(submission)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{submission.name}</div>
                            <div className="text-sm text-gray-500">{submission.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{submission.event_type}</div>
                        <div className="text-sm text-gray-500">{formatEventDate(submission.event_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubmission(submission);
                          }}
                          className="text-[#fcba00] hover:text-[#d99f00] mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubmission(submission.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#fcba00] to-[#d99f00] px-6 py-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-800 hover:text-black transition-colors p-1 hover:bg-black/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Status Update */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Update Status
                </label>
                <select
                  value={selectedSubmission.status}
                  onChange={(e) => updateSubmissionStatus(selectedSubmission.id, e.target.value as FormSubmission['status'])}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent bg-white font-medium"
                >
                  <option value="new">🆕 New</option>
                  <option value="contacted">📞 Contacted</option>
                  <option value="quoted">💰 Quoted</option>
                  <option value="booked">✅ Booked</option>
                  <option value="completed">🎉 Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                  <option value="spam">🚫 Spam</option>
                </select>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#fcba00] transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                      <button
                        onClick={(e) => handleNameClick(e, selectedSubmission)}
                        disabled={lookingUpContact === selectedSubmission.email}
                        className="text-sm font-semibold text-gray-900 hover:text-[#fcba00] hover:underline transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedSubmission.name}
                        {lookingUpContact === selectedSubmission.email ? (
                          <Loader className="w-3 h-3 animate-spin" />
                        ) : (
                          <ExternalLink className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#fcba00] transition-colors">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {selectedSubmission.email}
                      </a>
                    </div>
                  </div>

                  {selectedSubmission.phone && (
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#fcba00] transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={`tel:${selectedSubmission.phone}`}
                            className="text-sm font-semibold text-green-600 hover:text-green-700 hover:underline"
                          >
                            {selectedSubmission.phone}
                          </a>
                          {(() => {
                            const phoneLocation = getPhoneLocation(selectedSubmission.phone);
                            return phoneLocation ? (
                              <span className="text-xs text-gray-500 italic">
                                ({phoneLocation})
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Event Details */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Event Type</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSubmission.event_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase">Event Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formatEventDate(selectedSubmission.event_date)}</p>
                    </div>
                  </div>

                  {selectedSubmission.location && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedSubmission.location}</p>
                        </div>
                      </div>
                      
                      {/* Venue Image */}
                      {selectedSubmission.venue_image_url ? (
                        <div className="relative group">
                          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            <img
                              src={selectedSubmission.venue_image_url}
                              alt={`${selectedSubmission.location} venue`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image on error
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Venue image from Google Places</span>
                            {selectedSubmission.venue_image_fetched_at && (
                              <span>Fetched {new Date(selectedSubmission.venue_image_fetched_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Venue Image</p>
                            <p className="text-sm text-gray-600 mb-2">No venue image available</p>
                            <button
                              onClick={async () => {
                                if (!selectedSubmission.location) return;
                                
                                setFetchingVenueImage(selectedSubmission.id);
                                try {
                                  const response = await fetch('/api/admin/fetch-venue-image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      location: selectedSubmission.location,
                                      submissionId: selectedSubmission.id
                                    })
                                  });

                                  const data = await response.json();

                                  if (!response.ok) {
                                    throw new Error(data.message || data.error || 'Failed to fetch venue image');
                                  }

                                  // Refresh submissions to get updated image
                                  await fetchSubmissions();
                                  
                                  // Update selected submission
                                  setSelectedSubmission(prev => prev ? {
                                    ...prev,
                                    venue_image_url: data.imageUrl,
                                    venue_image_fetched_at: new Date().toISOString()
                                  } : null);

                                  alert('✅ Venue image fetched successfully!');
                                } catch (error) {
                                  console.error('Error fetching venue image:', error);
                                  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                                  alert(`Failed to fetch venue image: ${errorMessage}\n\nNote: This requires a Google Places API key to be configured.`);
                                } finally {
                                  setFetchingVenueImage(null);
                                }
                              }}
                              disabled={fetchingVenueImage === selectedSubmission.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {fetchingVenueImage === selectedSubmission.id ? (
                                <>
                                  <Loader className="w-3 h-3 animate-spin" />
                                  <span>Fetching...</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-3 h-3" />
                                  <span>Fetch Venue Image</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedSubmission.message && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Message</h3>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <MessageSquare className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="pl-11 pr-4 py-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedSubmission.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Communication History */}
              {communicationHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Communication History ({communicationHistory.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {communicationHistory.map((comm) => (
                      <div
                        key={comm.id}
                        className={`
                          p-3 rounded-lg border-l-4
                          ${comm.direction === 'outbound'
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-green-50 border-green-500'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {comm.communication_type === 'email' && <Mail className="w-4 h-4 text-gray-600" />}
                            {comm.communication_type === 'sms' && <MessageSquare className="w-4 h-4 text-gray-600" />}
                            {comm.communication_type === 'call' && <Phone className="w-4 h-4 text-gray-600" />}
                            <span className="text-xs font-semibold text-gray-900 uppercase">
                              {comm.communication_type}
                            </span>
                            <span className={`
                              text-xs px-2 py-0.5 rounded-full
                              ${comm.direction === 'outbound'
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-green-200 text-green-800'
                              }
                            `}>
                              {comm.direction === 'outbound' ? '→ Sent' : '← Received'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(comm.created_at)}
                          </span>
                        </div>
                        {comm.subject && (
                          <div className="text-sm font-semibold text-gray-900 mb-1">
                            {comm.subject}
                          </div>
                        )}
                        <div className="text-sm text-gray-700 line-clamp-3">
                          {comm.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loadingHistory && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00]"></div>
                </div>
              )}

              {!loadingHistory && communicationHistory.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No communication history yet</p>
                  <p className="text-xs text-gray-500 mt-1">Messages will appear here once you interact with this contact</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Submitted: {formatDate(selectedSubmission.created_at)}</span>
                  </div>
                  <span>Updated: {formatDate(selectedSubmission.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-w-[140px]"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </button>
              {selectedSubmission.phone && (
                <a
                  href={`tel:${selectedSubmission.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium min-w-[140px]"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </a>
              )}
              <button
                onClick={() => {
                  if (confirm('Mark this submission as spam? This will help filter out unwanted submissions.')) {
                    updateSubmissionStatus(selectedSubmission.id, 'spam');
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium border border-orange-200"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Mark as Spam</span>
                <span className="sm:hidden">Spam</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('Delete this submission?')) {
                    deleteSubmission(selectedSubmission.id);
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden">Del</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Compose Modal */}
      {showEmailModal && selectedSubmission && (
        <EmailComposeModal
          submission={selectedSubmission}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            setShowEmailModal(false);
            fetchCommunicationHistory(selectedSubmission.id);
          }}
        />
      )}
    </AdminLayout>
  );
}

// Email Compose Modal Component
function EmailComposeModal({ 
  submission, 
  onClose, 
  onSuccess 
}: { 
  submission: FormSubmission; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const supabase = createClientComponentClient();
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [includeServiceLink, setIncludeServiceLink] = useState(submission.event_type === 'Wedding' || submission.event_type === 'wedding');
  const [formData, setFormData] = useState({
    subject: `Re: ${submission.event_type} Inquiry - ${submission.name}`,
    body: ''
  });

  const emailTemplates = {
    custom: {
      name: 'Custom Email',
      subject: `Re: ${submission.event_type} Inquiry - ${submission.name}`,
      body: ''
    },
    initial_response: {
      name: 'Initial Response',
      subject: `Thank you for contacting M10 DJ - ${submission.event_type}`,
      body: `Hi ${submission.name.split(' ')[0]},

Thank you for reaching out to M10 DJ Company! I'm excited to learn more about your ${submission.event_type.toLowerCase()}${submission.event_date ? ` on ${new Date(submission.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

I'd love to discuss how we can make your event unforgettable with professional DJ services, lighting, and entertainment.

Are you available for a quick call this week to discuss your vision and answer any questions you might have?

Looking forward to connecting!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    quote_ready: {
      name: 'Quote Ready',
      subject: `Your Custom Quote - M10 DJ Services`,
      body: `Hi ${submission.name.split(' ')[0]},

Great news! I've prepared a custom quote for your ${submission.event_type.toLowerCase()}${submission.event_date ? ` on ${new Date(submission.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}.

I've tailored our services to match your specific needs and budget. The quote includes:

• Professional DJ Services
• Premium Sound System
• Uplighting & Ambiance
• Wireless Microphone
• Music Consultation

Please review the attached quote and let me know if you have any questions. I'm happy to adjust the package to better fit your vision!

Ready to move forward? Let's get you booked!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    follow_up: {
      name: 'Follow Up',
      subject: `Following up - ${submission.event_type} on ${submission.event_date ? new Date(submission.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'your event date'}`,
      body: `Hi ${submission.name.split(' ')[0]},

I wanted to follow up on our previous conversation about your ${submission.event_type.toLowerCase()}.

I know planning an event can be overwhelming with so many vendors to coordinate, so I wanted to make sure I answered all your questions about our DJ services.

Do you have any additional questions? I'm here to help make this process as smooth as possible!

Looking forward to hearing from you!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    booking_confirmation: {
      name: 'Booking Confirmation',
      subject: `You're Booked! - ${submission.event_type} Details`,
      body: `Hi ${submission.name.split(' ')[0]},

Congratulations! 🎉 Your ${submission.event_type.toLowerCase()} is officially on my calendar${submission.event_date ? ` for ${new Date(submission.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}!

I'm thrilled to be part of your special day and can't wait to help create an amazing experience for you and your guests.

Next Steps:
1. Contract signing (attached or link below)
2. Deposit payment to secure your date
3. Schedule a planning meeting closer to the date

Please review and sign the contract at your earliest convenience. Once I receive the signed contract and deposit, your date will be 100% secured.

Thank you for choosing M10 DJ Company!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    },
    schedule_consultation: {
      name: 'Schedule Consultation',
      subject: `Let's Schedule a Consultation - ${submission.event_type}`,
      body: `Hi ${submission.name.split(' ')[0]},

Thank you for your interest in M10 DJ Company for your ${submission.event_type.toLowerCase()}${submission.event_date ? ` on ${new Date(submission.event_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}!

I'd love to schedule a free consultation to discuss your event in detail. During our call, we can:
• Review your vision and preferences
• Discuss package options that fit your needs
• Answer any questions you have
• Check availability for your date
• Plan the perfect entertainment experience

The easiest way to book a time that works for you is through my online scheduling system. Just click the link below to see available times:

📅 Schedule Your Free Consultation:
{{SCHEDULE_LINK}}

You can also call me directly at (901) 410-2020 if you prefer to schedule over the phone.

I look forward to speaking with you soon!

Best regards,
Ben Murray
M10 DJ Company
(901) 410-2020
djbenmurray@gmail.com`
    }
  };

  useEffect(() => {
    if (selectedTemplate !== 'custom') {
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates];
      let body = template.body;
      
      // Replace schedule link placeholder if this is the consultation template
      if (selectedTemplate === 'schedule_consultation') {
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : (process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com');
        const scheduleLink = `${baseUrl}/schedule`;
        body = body.replace('{{SCHEDULE_LINK}}', scheduleLink);
      }
      
      setFormData({
        subject: template.subject,
        body: body
      });
    }
  }, [selectedTemplate]);

  const handleSendEmail = async () => {
    console.log('🔵 Send Email button clicked');
    console.log('   Subject:', formData.subject);
    console.log('   Body length:', formData.body.length);
    console.log('   Include service link:', includeServiceLink);
    
    if (!formData.body.trim()) {
      console.error('❌ No email body');
      alert('Please enter a message');
      return;
    }

    if (!formData.subject.trim()) {
      console.error('❌ No subject');
      alert('Please enter a subject');
      return;
    }

    console.log('✅ Validation passed, starting send...');
    setSending(true);
    
    try {
      let emailBody = formData.body;

      // Add service selection link if included
      if (includeServiceLink) {
        console.log('🔗 Generating service selection link...');
        try {
          const linkResponse = await fetch('/api/service-selection/generate-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: submission.email,
              name: submission.name,
              eventType: submission.event_type,
              eventDate: submission.event_date
            })
          });

          console.log('   Link API response status:', linkResponse.status);
          
          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            console.log('   ✅ Link generated:', linkData.link);
            emailBody += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 SELECT YOUR SERVICES\n\nI've created a personalized service selection page for you. Please review and select the services that best fit your needs:\n\n👉 ${linkData.link}\n\nThis will help me provide you with an accurate quote tailored to your event!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
          } else {
            const errorData = await linkResponse.json();
            console.error('   ❌ Link generation failed:', errorData);
            alert('Warning: Could not generate service selection link. Sending email without it.');
          }
        } catch (linkError) {
          console.error('   ❌ Link generation error:', linkError);
          alert('Warning: Could not generate service selection link. Sending email without it.');
        }
      }

      // Send email via API
      console.log('📧 Sending email via API...');
      console.log('   To:', submission.email);
      console.log('   Subject:', formData.subject);
      
      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: submission.email,
          subject: formData.subject,
          body: emailBody,
          submissionId: submission.id
        })
      });

      console.log('   Email API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('   ❌ Email API error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to send email');
      }

      const responseData = await response.json();
      console.log('   ✅ Email API success:', responseData);

      // Log communication
      console.log('📝 Logging communication to database...');
      const { error: logError } = await supabase.from('communication_log').insert({
        contact_submission_id: submission.id,
        communication_type: 'email',
        direction: 'outbound',
        subject: formData.subject,
        content: emailBody,
        status: 'sent',
        sent_to: submission.email,
        created_at: new Date().toISOString()
      });

      if (logError) {
        console.error('   ⚠️ Failed to log communication:', logError);
      } else {
        console.log('   ✅ Communication logged');
      }

      // Update submission status if it was "new"
      if (submission.status === 'new') {
        console.log('📊 Updating submission status to "contacted"...');
        const { error: updateError } = await supabase
          .from('contact_submissions')
          .update({ status: 'contacted', updated_at: new Date().toISOString() })
          .eq('id', submission.id);
          
        if (updateError) {
          console.error('   ⚠️ Failed to update status:', updateError);
        } else {
          console.log('   ✅ Status updated');
        }
      }

      console.log('🎉 Email sent successfully!');
      alert('✅ Email sent successfully! Check your email logs.');
      onSuccess();
    } catch (error) {
      console.error('❌ Error sending email:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorName = error instanceof Error ? error.name : 'Error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error('   Error name:', errorName);
      console.error('   Error message:', errorMessage);
      console.error('   Error stack:', errorStack);
      alert(`Failed to send email: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setSending(false);
      console.log('🔵 Send email process complete');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Send Email</h2>
              <p className="text-blue-100 text-sm">To: {submission.name} ({submission.email})</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Template Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="custom">Custom Email</option>
              <option value="initial_response">Initial Response</option>
              <option value="schedule_consultation">Schedule Consultation</option>
              <option value="quote_ready">Quote Ready</option>
              <option value="follow_up">Follow Up</option>
              <option value="booking_confirmation">Booking Confirmation</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Email subject..."
            />
          </div>

          {/* Include Service Selection Link */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeServiceLink}
                onChange={(e) => setIncludeServiceLink(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-purple-600" />
                  Include Service Selection Link
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Add a personalized link where the client can select their preferred services and packages. 
                  This helps provide accurate quotes and streamlines the booking process.
                </p>
              </div>
            </label>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Message
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Type your message here..."
            />
          </div>

          {/* Preview */}
          {includeServiceLink && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Service Selection Link Preview
              </p>
              <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-300">
                <p className="mb-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                <p className="font-semibold">📋 SELECT YOUR SERVICES</p>
                <p className="mt-2 text-xs">A personalized service selection page will be automatically generated and included at the end of your email.</p>
                <p className="mt-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending || !formData.body.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


