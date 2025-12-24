/**
 * Admin Calendar Page
 * Calendar view for events/projects with month, week, and day views
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Music,
  Plus,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';

interface Event {
  id: string;
  event_name: string;
  client_name: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue_name: string | null;
  status: string;
  event_type: string;
}

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, currentDate, statusFilter]);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        router.push('/signin?redirect=/admin/calendar');
        return;
      }
      setUser(user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/calendar');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let query = supabase
        .from('events')
        .select('id, event_name, client_name, event_date, start_time, end_time, venue_name, status, event_type')
        .gte('event_date', startOfMonth.toISOString().split('T')[0])
        .lte('event_date', endOfMonth.toISOString().split('T')[0])
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.event_date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  if (loading && !user) {
    return (
      <AdminLayout title="Calendar" description="Event Calendar">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 mx-auto mb-6"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-[#fcba00] absolute top-0 left-1/2 -translate-x-1/2"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium mt-4">Loading calendar...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AdminLayout title="Calendar" description="Event Calendar - M10 DJ Admin">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-[#fcba00]" />
              Calendar
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View and manage your events</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/admin/projects">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                {monthName}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={viewMode} onValueChange={(value: 'month' | 'week' | 'day') => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Calendar Grid - Month View */}
        {viewMode === 'month' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {dayNames.map(day => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {days.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date && 
                  date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date && 
                  date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] sm:min-h-[120px] border-r border-b border-gray-200 dark:border-gray-700 p-2
                      ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''}
                      ${isToday ? 'bg-[#fcba00]/10' : ''}
                    `}
                  >
                    {date && (
                      <>
                        <div className={`
                          text-sm font-medium mb-1
                          ${isToday ? 'text-[#fcba00] font-bold' : 'text-gray-700 dark:text-gray-300'}
                          ${!isCurrentMonth ? 'text-gray-400' : ''}
                        `}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <Link
                              key={event.id}
                              href={`/admin/projects/${event.id}`}
                              className="block"
                            >
                              <div className={`
                                text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity
                                ${getStatusColor(event.status)}
                              `}>
                                <div className="flex items-center gap-1">
                                  {event.start_time && (
                                    <Clock className="h-3 w-3" />
                                  )}
                                  <span className="truncate">{event.event_name || event.client_name}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Events List */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Events</h3>
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No events scheduled for this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <Link
                  key={event.id}
                  href={`/admin/projects/${event.id}`}
                  className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {event.event_name || 'Untitled Event'}
                        </h4>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {new Date(event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        {event.start_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(event.start_time)}
                          </div>
                        )}
                        {event.venue_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.venue_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.client_name}
                        </div>
                      </div>
                    </div>
                    <Music className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

