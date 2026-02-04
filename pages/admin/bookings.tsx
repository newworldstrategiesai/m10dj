'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Download,
  Video,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Booking {
  id: string;
  meeting_type_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  meeting_date: string;
  meeting_time: string;
  duration_minutes: number;
  event_type: string | null;
  event_date: string | null;
  notes: string | null;
  status: string;
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  video_call_link: string | null;
  meeting_types?: {
    name: string;
    description: string | null;
  };
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchQuery, statusFilter, dateFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meeting_bookings')
        .select(`
          *,
          meeting_types (
            name,
            description
          )
        `)
        .order('meeting_date', { ascending: true })
        .order('meeting_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.client_name.toLowerCase().includes(query) ||
        booking.client_email.toLowerCase().includes(query) ||
        (booking.client_phone && booking.client_phone.includes(query)) ||
        (booking.event_type && booking.event_type.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(booking => booking.meeting_date === today);
    } else if (dateFilter === 'upcoming') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(booking => booking.meeting_date >= today);
    } else if (dateFilter === 'past') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(booking => booking.meeting_date < today);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('meeting_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      const { error } = await supabase
        .from('meeting_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      await fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(null);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Show', color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <AdminLayout title="Bookings" description="Manage meeting bookings">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#fcba00] mx-auto mb-4" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Bookings" description="Manage meeting bookings">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meeting Bookings</h1>
            <p className="text-gray-600 mt-1">Manage and track all scheduled consultations</p>
          </div>
          <Button
            onClick={fetchBookings}
            className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </Card>

        {/* Bookings List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4">
                Bookings ({filteredBookings.length})
              </h2>
              <div className="space-y-3">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No bookings found</p>
                  </div>
                ) : (
                  filteredBookings.map((booking) => {
                    const isSelected = selectedBooking?.id === booking.id;
                    const meetingDate = new Date(`${booking.meeting_date}T${booking.meeting_time}`);
                    const isPast = meetingDate < new Date();
                    const isToday = booking.meeting_date === new Date().toISOString().split('T')[0];

                    return (
                      <div
                        key={booking.id}
                        onClick={() => setSelectedBooking(booking)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#fcba00] bg-[#fcba00]/5'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                        } ${isPast ? 'opacity-75' : ''} ${isToday ? 'ring-2 ring-blue-200' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                            <p className="text-sm text-gray-600">{booking.client_email}</p>
                          </div>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.meeting_date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(booking.meeting_time)}
                          </div>
                        </div>
                        {booking.meeting_types && (
                          <p className="text-sm text-gray-500 mt-2">{booking.meeting_types.name}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Booking Details Sidebar */}
          <div className="lg:col-span-1">
            {selectedBooking ? (
              <Card className="p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Booking Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBooking(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Client Name</label>
                    <p className="text-gray-900 font-semibold">{selectedBooking.client_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <a
                      href={`mailto:${selectedBooking.client_email}`}
                      className="text-[#fcba00] hover:underline block"
                    >
                      {selectedBooking.client_email}
                    </a>
                  </div>

                  {selectedBooking.client_phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <a
                        href={`tel:${selectedBooking.client_phone}`}
                        className="text-gray-900 hover:text-[#fcba00] block"
                      >
                        {selectedBooking.client_phone}
                      </a>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Meeting Type</label>
                    <p className="text-gray-900">{selectedBooking.meeting_types?.name || 'Consultation'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Date & Time</label>
                    <p className="text-gray-900">
                      {formatDate(selectedBooking.meeting_date)} at {formatTime(selectedBooking.meeting_time)}
                    </p>
                    <p className="text-sm text-gray-500">Duration: {selectedBooking.duration_minutes} minutes</p>
                  </div>

                  {selectedBooking.event_type && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Event Type</label>
                      <p className="text-gray-900">{selectedBooking.event_type}</p>
                      {selectedBooking.event_date && (
                        <p className="text-sm text-gray-500">
                          Event Date: {formatDate(selectedBooking.event_date)}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedBooking.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedBooking.notes}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <label className="text-sm font-medium text-gray-500 block">Change Status</label>
                    <select
                      value={selectedBooking.status}
                      onChange={(e) => updateBookingStatus(selectedBooking.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no_show">No Show</option>
                    </select>
                  </div>

                  {selectedBooking.video_call_link && (
                    <div className="pt-4 border-t space-y-2">
                      <label className="text-sm font-medium text-gray-500 block">Video Meeting</label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(selectedBooking.video_call_link!, '_blank')}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Join Meeting
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedBooking.video_call_link!);
                            alert('Link copied to clipboard');
                          }}
                          className="flex-shrink-0"
                          title="Copy meeting link"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">Client can use this link to join the video call at the scheduled time.</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      onClick={() => window.open(`/schedule/confirm/${selectedBooking.id}`, '_blank')}
                      className="w-full bg-[#fcba00] hover:bg-[#d99f00] text-black"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Confirmation Page
                    </Button>
                    <Button
                      onClick={() => deleteBooking(selectedBooking.id)}
                      variant="destructive"
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Booking
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Select a booking to view details</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

