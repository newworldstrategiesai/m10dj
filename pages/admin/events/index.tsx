'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Users,
  Music,
  Search,
  Filter,
  Star,
  FileText,
  Ticket,
  Plus,
  DoorOpen
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';

interface LiveEvent {
  id: string;
  event_id: string;
  slug: string;
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  end_time?: string;
  venue_name: string;
  venue_address: string;
  venue_url?: string;
  featured_image_url?: string;
  cover_photo_url?: string;
  is_published: boolean;
  is_featured: boolean;
  ticketing_enabled: boolean;
  ticket_price?: number;
  capacity?: number;
  display_order: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  created_at: string;
  updated_at: string;
  published_at?: string | null;
}

export default function EventsManagement() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadEvents();
    
    // Check for success messages
    if (router.query.created === 'true' || router.query.updated === 'true') {
      setTimeout(() => {
        router.replace('/admin/events', undefined, { shallow: true });
      }, 5000);
    }
  }, [router.query]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('live_events')
        .select('*')
        .order('event_date', { ascending: false });

      if (fetchError) throw fetchError;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading live events:', err);
      setError('Failed to load live events. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('live_events')
        .update({ 
          is_published: !currentStatus,
          published_at: !currentStatus ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                is_published: !currentStatus,
                published_at: !currentStatus ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
              }
            : event
        )
      );
    } catch (err) {
      console.error('Error updating event status:', err);
      alert('Failed to update event status. Please try again.');
    }
  };

  const toggleFeaturedStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('live_events')
        .update({ 
          is_featured: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, is_featured: !currentStatus, updated_at: new Date().toISOString() }
            : event
        )
      );
    } catch (err) {
      console.error('Error updating featured status:', err);
      alert('Failed to update featured status. Please try again.');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this live event? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('live_events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(`Failed to delete live event: ${err.message}`);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && event.is_published) ||
                         (filterStatus === 'draft' && !event.is_published);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout title="Event Pages" description="Manage event case study pages">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fcba00] mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading event pages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Event Pages" description="Manage event case study pages">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Event Management Error</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="bg-[#fcba00] hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Live Events"
      description="Manage public live events with ticketing"
      showPageTitle={true}
      pageTitle="Live Events"
      pageDescription="Create and manage public live events with ticketing"
      newButton={{
        href: "/admin/events/new",
        label: "New Live Event"
      }}
    >
      <Head>
        <title>Live Events - M10 DJ Company Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>


      {/* Success Messages - Mobile responsive */}
        {router.query.created === 'true' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 sm:pt-6">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
                ✅ Live event created successfully! 
                {router.query.slug && (
                  <Link 
                    href={`/events/live/${router.query.slug}`} 
                    className="underline ml-1 sm:ml-2 inline-block mt-1 sm:mt-0 sm:inline"
                    target="_blank"
                  >
                    View page →
                  </Link>
                )}
              </p>
            </div>
          </div>
        )}
        {router.query.updated === 'true' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 sm:pt-6">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
              <p className="text-sm sm:text-base text-green-800 dark:text-green-200">
                ✅ Live event updated successfully! 
                {router.query.slug && (
                  <Link 
                    href={`/events/live/${router.query.slug}`} 
                    className="underline ml-1 sm:ml-2 inline-block mt-1 sm:mt-0 sm:inline"
                    target="_blank"
                  >
                    View page →
                  </Link>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Filters - Mobile-first */}
          <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Events List - Mobile-first: Cards on mobile, Table on desktop */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-black rounded-lg shadow p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No live events found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first live event'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center bg-[#fcba00] hover:bg-yellow-500 text-black px-4 py-2.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base touch-manipulation"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Live Event
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="block lg:hidden space-y-3 sm:space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-5 border border-gray-200 dark:border-gray-700">
                    {/* Event Header */}
                    <div className="flex items-start gap-3 mb-3">
                      {event.featured_image_url && (
                        <img
                          src={event.featured_image_url}
                          alt={event.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/events/live/${event.slug}`}
                            target="_blank"
                            className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-[#fcba00] truncate"
                          >
                            {event.title}
                          </Link>
                          {event.is_featured && (
                            <Star className="w-4 h-4 text-[#fcba00] flex-shrink-0 fill-current" />
                          )}
                        </div>
                        {event.description && (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      {event.venue_name && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{event.venue_name}</span>
                        </div>
                      )}
                      {event.event_date && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          {formatDate(event.event_date)}
                        </div>
                      )}
                      {event.ticketing_enabled && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Ticket className="w-4 h-4 mr-2 flex-shrink-0" />
                          Tickets: ${event.ticket_price?.toFixed(2) || 'N/A'}
                        </div>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.is_published)}`}>
                        {event.is_published ? 'Published' : 'Draft'}
                      </span>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/edit/${event.id}`}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#fcba00] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => togglePublishStatus(event.id, event.is_published)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#fcba00] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                          title={event.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {event.is_published ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFeaturedStatus(event.id, event.is_featured)}
                          className={`p-2 ${event.is_featured ? 'text-[#fcba00]' : 'text-gray-600 dark:text-gray-400'} hover:text-[#fcba00] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation`}
                          title={event.is_featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          <Star className={`w-5 h-5 ${event.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        <Link
                          href={`/admin/events/${event.id}/door`}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg touch-manipulation"
                          title="Walk-up App"
                        >
                          <DoorOpen className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/events/live/${event.slug}`}
                          target="_blank"
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-[#fcba00] hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
                          title="View page"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden lg:block bg-white dark:bg-black rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-black">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {event.featured_image_url && (
                                <img
                                  src={event.featured_image_url}
                                  alt={event.title}
                                  className="w-12 h-12 rounded-lg object-cover mr-3"
                                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <div className="flex items-center">
                                  <Link
                                    href={`/events/live/${event.slug}`}
                                    target="_blank"
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#fcba00]"
                                  >
                                    {event.title}
                                  </Link>
                                  {event.is_featured && (
                                    <Star className="w-4 h-4 text-[#fcba00] ml-2 fill-current" />
                                  )}
                                </div>
                                {event.description && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white space-y-1">
                              {event.venue_name && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {event.venue_name}
                                </div>
                              )}
                              {event.ticketing_enabled && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Ticket className="w-3 h-3 mr-1" />
                                  Tickets: ${event.ticket_price?.toFixed(2) || 'N/A'}
                                </div>
                              )}
                              {event.event_date && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(event.event_date)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.is_published)}`}>
                              {event.is_published ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(event.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                href={`/admin/events/edit/${event.id}`}
                                className="text-gray-600 dark:text-gray-400 hover:text-[#fcba00]"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => togglePublishStatus(event.id, event.is_published)}
                                className="text-gray-600 dark:text-gray-400 hover:text-[#fcba00]"
                                title={event.is_published ? 'Unpublish' : 'Publish'}
                              >
                                {event.is_published ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleFeaturedStatus(event.id, event.is_featured)}
                                className={`${event.is_featured ? 'text-[#fcba00]' : 'text-gray-600 dark:text-gray-400'} hover:text-[#fcba00]`}
                                title={event.is_featured ? 'Remove from featured' : 'Mark as featured'}
                              >
                                <Star className={`w-4 h-4 ${event.is_featured ? 'fill-current' : ''}`} />
                              </button>
                              <Link
                                href={`/events/live/${event.slug}`}
                                target="_blank"
                                className="text-gray-600 dark:text-gray-400 hover:text-[#fcba00]"
                                title="View page"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => deleteEvent(event.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Stats - Mobile responsive */}
          <div className="mt-4 sm:mt-6 lg:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {events.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Live Events
              </div>
            </div>
            <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {events.filter(e => e.is_published).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Published
              </div>
            </div>
            <div className="bg-white dark:bg-black rounded-lg shadow p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="text-xl sm:text-2xl font-bold text-[#fcba00]">
                {events.filter(e => e.is_featured).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Featured
              </div>
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}

