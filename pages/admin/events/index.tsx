'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Plus,
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
  ArrowLeft
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import AdminLayout from '@/components/layouts/AdminLayout';

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  event_date?: string;
  event_type?: string;
  venue_name?: string;
  venue_address?: string;
  number_of_guests?: number;
  featured_image_url?: string;
  gallery_images?: string[];
  highlights?: string[];
  testimonial?: any;
  is_published: boolean;
  is_featured: boolean;
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
  const [events, setEvents] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEventType, setFilterEventType] = useState('all');

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
        .from('case_studies')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error loading event pages:', err);
      setError('Failed to load event pages. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const togglePublishStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('case_studies')
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
        .from('case_studies')
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
    if (!confirm('Are you sure you want to delete this event page? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/event/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete event page');
      }
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(`Failed to delete event page: ${err.message}`);
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
                         event.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && event.is_published) ||
                         (filterStatus === 'draft' && !event.is_published);
    
    const matchesEventType = filterEventType === 'all' || event.event_type === filterEventType;
    
    return matchesSearch && matchesStatus && matchesEventType;
  });

  const eventTypes = Array.from(new Set(events.map(event => event.event_type).filter((type): type is string => Boolean(type))));

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
    <AdminLayout title="Event Pages" description="Manage event case study pages">
      <Head>
        <title>Event Pages - M10 DJ Company Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href="/admin/dashboard"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-[#fcba00] mr-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
                
                <div className="w-8 h-8 bg-[#fcba00] rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Event Pages
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create and manage event case study pages
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <Link
                  href="/admin/events/new"
                  className="bg-[#fcba00] hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Event Page
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Success Messages */}
        {router.query.created === 'true' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200">
                ✅ Event page created successfully! 
                {router.query.slug && (
                  <Link 
                    href={`/events/${router.query.slug}`} 
                    className="underline ml-2"
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200">
                ✅ Event page updated successfully! 
                {router.query.slug && (
                  <Link 
                    href={`/events/${router.query.slug}`} 
                    className="underline ml-2"
                    target="_blank"
                  >
                    View page →
                  </Link>
                )}
              </p>
            </div>
          </div>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>

              {/* Event Type Filter */}
              <select
                value={filterEventType}
                onChange={(e) => setFilterEventType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Event Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Events List */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No event pages found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' || filterEventType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first event page'}
              </p>
              {!searchTerm && filterStatus === 'all' && filterEventType === 'all' && (
                <Link
                  href="/admin/events/new"
                  className="inline-flex items-center bg-[#fcba00] hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event Page
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
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
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
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
                                  href={`/events/${event.slug}`}
                                  target="_blank"
                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-[#fcba00]"
                                >
                                  {event.title}
                                </Link>
                                {event.is_featured && (
                                  <Star className="w-4 h-4 text-[#fcba00] ml-2 fill-current" />
                                )}
                              </div>
                              {event.excerpt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {event.excerpt}
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
                            {event.event_type && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Music className="w-3 h-3 mr-1" />
                                {event.event_type}
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
                              href={`/events/${event.slug}`}
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
          )}

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {events.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Total Event Pages
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {events.filter(e => e.is_published).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Published
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-[#fcba00]">
                {events.filter(e => e.is_featured).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Featured
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
}

