import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Ticket, 
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Search,
  Plus
} from 'lucide-react';
import Header from '../../../components/company/Header';
import { createClient } from '@supabase/supabase-js';
import { getEventTicketStats } from '../../../utils/event-tickets';
import { getEventInfo, getEventDate } from '../../../utils/event-info';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function TicketsOverview() {
  const router = useRouter();
  const [eventsWithTickets, setEventsWithTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEventsWithTickets();
  }, []);

  const loadEventsWithTickets = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Get all unique event IDs that have tickets
      const { data: tickets, error } = await supabase
        .from('event_tickets')
        .select('event_id')
        .in('payment_status', ['paid', 'cash', 'card_at_door']);

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      // Get unique event IDs
      const uniqueEventIds = [...new Set(tickets?.map(t => t.event_id) || [])];

      // Load stats for each event
      const eventsData = await Promise.all(
        uniqueEventIds.map(async (eventId) => {
          const stats = await getEventTicketStats(eventId);
          return {
            eventId,
            ...stats
          };
        })
      );

      setEventsWithTickets(eventsData);
    } catch (error) {
      console.error('Error loading events with tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = eventsWithTickets.filter(event => {
    if (searchTerm) {
      return event.eventId.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  // Sort events by date (most recent first) or by tickets sold
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    // Sort by total sold (descending)
    return b.totalSold - a.totalSold;
  });

  return (
    <>
      <Head>
        <title>Ticket Management | M10 DJ Company Admin</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        <div className="section-container">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Ticket Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage ticket sales and check-ins for all events
                </p>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0">
                <Link
                  href="/admin/events"
                  className="btn-secondary"
                >
                  Manage Events
                </Link>
              </div>
            </div>

            {/* Search */}
            <div className="modern-card mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Events List */}
            {loading ? (
              <div className="modern-card text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="modern-card text-center py-12">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Events with Tickets
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'No events match your search'
                    : 'Create an event page and enable ticket sales to get started'}
                </p>
                <Link
                  href="/admin/events/new"
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event) => {
                  const eventInfo = getEventInfo(event.eventId);
                  const eventDate = getEventDate(event.eventId) || eventInfo.date;
                  
                  return (
                    <Link
                      key={event.eventId}
                      href={`/admin/events/${event.eventId}/tickets`}
                      className="modern-card hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-gold transition-colors">
                            {eventInfo.name}
                          </h3>
                          {eventDate && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center mb-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              {eventDate}
                            </p>
                          )}
                          {eventInfo.venue && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {eventInfo.venue}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-1">
                            {event.eventId}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-gold transition-colors" />
                      </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tickets Sold</div>
                        <div className="text-2xl font-bold text-brand-gold">{event.totalSold}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Revenue</div>
                        <div className="text-2xl font-bold text-green-500">${event.totalRevenue.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Checked In</div>
                        <div className="text-xl font-semibold text-blue-500">{event.checkedIn}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Check-In Rate</div>
                        <div className="text-xl font-semibold text-purple-500">
                          {event.totalSold > 0 ? Math.round((event.checkedIn / event.totalSold) * 100) : 0}%
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={`/admin/events/${event.eventId}/tickets`}
                        className="flex-1 btn-outline text-sm py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href={`/admin/events/${event.eventId}/door`}
                        className="flex-1 btn-primary text-sm py-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Door
                      </Link>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

