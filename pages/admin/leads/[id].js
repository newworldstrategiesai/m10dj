import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LeadDetailsPage() {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchSubmission();
    }
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setSubmission(data);
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
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

      setSubmission(prev => ({ 
        ...prev, 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Lead not found'}
          </h2>
          <Link href="/admin/dashboard">
            <button className="px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e6a800] transition-colors">
              ← Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(submission.status)}`}>
                {submission.status}
              </span>
              
              {/* Link to Contact Management */}
              <Link href={`/admin/contacts/${submission.id}?from=lead`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e6a800] transition-colors text-sm font-medium">
                  <ExternalLink className="h-4 w-4" />
                  Manage Contact
                </button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#fcba00] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {submission.name}
              </h1>
              <p className="text-gray-600">
                {submission.event_type} • Submitted {formatDateTime(submission.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Status Update */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Update Status</h2>
          <select
            value={submission.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="quoted">Quoted</option>
            <option value="booked">Booked</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{submission.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a href={`mailto:${submission.email}`} className="text-[#fcba00] hover:underline">
                    {submission.email}
                  </a>
                </div>
              </div>
              {submission.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${submission.phone}`} className="text-[#fcba00] hover:underline">
                      {submission.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                <p className="text-gray-900 capitalize">{submission.event_type}</p>
              </div>
              {submission.event_date && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(submission.event_date)}</p>
                </div>
              )}
              {submission.location && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{submission.location}</p>
                  </div>
                </div>
              )}
              {submission.guest_count && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
                  <p className="text-gray-900">{submission.guest_count}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {submission.message && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 whitespace-pre-wrap">{submission.message}</p>
            </div>
          </div>
        )}

        {/* Raw Data (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Raw Data (Dev Only)</h2>
            <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-xs">
              {JSON.stringify(submission, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}