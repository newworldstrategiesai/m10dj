import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Ticket, 
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  MoreVertical,
  Settings
} from 'lucide-react';
import Header from '../../../../components/company/Header';
import { createClient } from '@supabase/supabase-js';
import { getEventTicketStats } from '../../../../utils/event-tickets';
import { getEventInfo } from '../../../../utils/event-info';
import TicketDetailModal from '../../../../components/admin/TicketDetailModal';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function EventTicketsDashboard() {
  const router = useRouter();
  const { eventId } = router.query;
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTicketType, setFilterTicketType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedTickets, setSelectedTickets] = useState(new Set());
  const [showTicketDetail, setShowTicketDetail] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  const ticketsPerPage = 50;
  const autoRefreshInterval = useRef(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  useEffect(() => {
    if (eventId && typeof eventId === 'string') {
      loadData();
    }
  }, [eventId, filterStatus, filterTicketType, filterDateFrom, filterDateTo]);

  useEffect(() => {
    // Auto-refresh if enabled
    if (autoRefreshEnabled && eventId) {
      autoRefreshInterval.current = setInterval(() => {
        loadData(true); // Silent refresh
      }, 10000); // Every 10 seconds

      return () => {
        if (autoRefreshInterval.current) {
          clearInterval(autoRefreshInterval.current);
        }
      };
    } else {
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current);
      }
    }
  }, [autoRefreshEnabled, eventId]);

  const loadData = async (silent = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Load stats
      const statsData = await getEventTicketStats(eventId);
      setStats(statsData);

      // Load tickets
      let query = supabase
        .from('event_tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        if (filterStatus === 'checked_in') {
          query = query.eq('checked_in', true);
        } else if (filterStatus === 'not_checked_in') {
          query = query.eq('checked_in', false);
        } else {
          query = query.eq('payment_status', filterStatus);
        }
      }

      if (filterTicketType !== 'all') {
        query = query.eq('ticket_type', filterTicketType);
      }

      // Date range filtering
      if (filterDateFrom) {
        query = query.gte('created_at', `${filterDateFrom}T00:00:00.000Z`);
      }
      if (filterDateTo) {
        query = query.lte('created_at', `${filterDateTo}T23:59:59.999Z`);
      }

      const { data, error } = await query;

      if (!error && data) {
        setTickets(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const toggleTicketSelection = (ticketId) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set());
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t.id)));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedTickets.size === 0) {
      alert('Please select tickets first');
      return;
    }

    if (action === 'checkin') {
      // Bulk check-in
      const confirmed = confirm(`Check in ${selectedTickets.size} ticket(s)?`);
      if (!confirmed) return;

      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase
          .from('event_tickets')
          .update({
            checked_in: true,
            checked_in_at: new Date().toISOString(),
            checked_in_by: 'Admin'
          })
          .in('id', Array.from(selectedTickets));

        if (error) throw error;

        setSelectedTickets(new Set());
        loadData();
        alert(`Successfully checked in ${selectedTickets.size} ticket(s)`);
      } catch (error) {
        console.error('Error bulk checking in:', error);
        alert('Failed to check in tickets');
      }
    } else if (action === 'export') {
      // Export selected tickets
      const selectedTicketsData = tickets.filter(t => selectedTickets.has(t.id));
      exportToCSV(selectedTicketsData);
    }
  };

  const exportToCSV = (ticketsToExport = tickets) => {
    const headers = ['Name', 'Email', 'Phone', 'Quantity', 'Type', 'Total', 'Payment Status', 'Payment Method', 'Checked In', 'QR Code', 'Created'];
    const rows = ticketsToExport.map(t => [
      t.purchaser_name,
      t.purchaser_email,
      t.purchaser_phone || '',
      t.quantity,
      t.ticket_type,
      `$${t.total_amount.toFixed(2)}`,
      t.payment_status,
      t.payment_method || '',
      t.checked_in ? 'Yes' : 'No',
      t.qr_code_short || t.qr_code,
      new Date(t.created_at).toLocaleString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredTickets = tickets.filter(ticket => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        ticket.purchaser_name.toLowerCase().includes(search) ||
        ticket.purchaser_email.toLowerCase().includes(search) ||
        (ticket.purchaser_phone && ticket.purchaser_phone.includes(search)) ||
        (ticket.qr_code_short && ticket.qr_code_short.toLowerCase().includes(search)) ||
        ticket.qr_code.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const endIndex = startIndex + ticketsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Get unique ticket types for filter
  const ticketTypes = [...new Set(tickets.map(t => t.ticket_type))];

  const eventInfo = eventId ? getEventInfo(eventId) : { id: '', name: 'Loading...' };

  if (!eventId) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Ticket Dashboard | {eventId}</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        <div className="section-container">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Link href="/admin/dashboard" className="hover:text-brand-gold">Dashboard</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/admin/tickets" className="hover:text-brand-gold">Tickets</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 dark:text-white">{eventInfo.name}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {eventInfo.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-mono">{eventId}</span>
                  {eventInfo.date && (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {eventInfo.date}
                    </span>
                  )}
                  {lastUpdated && (
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Updated {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4 sm:mt-0 flex-wrap">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="btn-outline flex items-center"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`btn-outline flex items-center ${autoRefreshEnabled ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}`}
                  title="Auto-refresh every 10 seconds"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {autoRefreshEnabled ? 'Auto: ON' : 'Auto: OFF'}
                </button>
                <Link
                  href={`/admin/events/${eventId}/door`}
                  className="btn-primary"
                >
                  Door Interface
                </Link>
                <button
                  onClick={() => exportToCSV()}
                  className="btn-outline flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="modern-card text-center">
                  <div className="text-3xl font-bold text-brand-gold mb-2">{stats.totalSold}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tickets Sold</div>
                </div>
                <div className="modern-card text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">{stats.checkedIn}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Checked In</div>
                </div>
                <div className="modern-card text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">${stats.totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
                </div>
                <div className="modern-card text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {stats.totalSold > 0 ? Math.round((stats.checkedIn / stats.totalSold) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Check-In Rate</div>
                </div>
              </div>
            )}

            {/* Bulk Actions Bar */}
            {selectedTickets.size > 0 && (
              <div className="modern-card mb-6 bg-brand-gold/10 border-brand-gold">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedTickets.size} ticket(s) selected
                    </span>
                    <button
                      onClick={() => setSelectedTickets(new Set())}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBulkAction('checkin')}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      Bulk Check-In
                    </button>
                    <button
                      onClick={() => handleBulkAction('export')}
                      className="btn-outline text-sm py-2 px-4"
                    >
                      Export Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="modern-card mb-6">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or QR code..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="cash">Cash</option>
                    <option value="card_at_door">Card at Door</option>
                    <option value="checked_in">Checked In</option>
                    <option value="not_checked_in">Not Checked In</option>
                  </select>

                  <select
                    value={filterTicketType}
                    onChange={(e) => {
                      setFilterTicketType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Ticket Types</option>
                    {ticketTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="From Date"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="To Date"
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />

                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => {
                        setFilterDateFrom('');
                        setFilterDateTo('');
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="modern-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white w-12">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Select all"
                      >
                        {selectedTickets.size === filteredTickets.length && filteredTickets.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-brand-gold" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Payment</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">QR Code</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        Loading tickets...
                      </td>
                    </tr>
                  ) : paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-gray-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map((ticket) => (
                      <tr 
                        key={ticket.id} 
                        className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedTickets.has(ticket.id) ? 'bg-brand-gold/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <button
                            onClick={() => toggleTicketSelection(ticket.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            {selectedTickets.has(ticket.id) ? (
                              <CheckSquare className="w-5 h-5 text-brand-gold" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{ticket.purchaser_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{ticket.purchaser_email}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{ticket.quantity}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">${ticket.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                            ticket.payment_status === 'paid' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                              : ticket.payment_status === 'cash' || ticket.payment_status === 'card_at_door'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {ticket.payment_method || ticket.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {ticket.checked_in ? (
                            <span className="inline-flex items-center text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-gray-400">
                              <XCircle className="w-4 h-4 mr-1" />
                              Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                          {ticket.qr_code_short || ticket.qr_code.substring(0, 12)}...
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowTicketDetail(ticket)}
                              className="text-brand-gold hover:underline flex items-center"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/events/tickets/${ticket.id}`}
                              target="_blank"
                              className="text-brand-gold hover:underline"
                              title="Open in new tab"
                            >
                              Open
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTickets.length)} of {filteredTickets.length} tickets
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn-outline text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-outline text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Ticket Detail Modal */}
            {showTicketDetail && (
              <TicketDetailModal
                ticket={showTicketDetail}
                onClose={() => setShowTicketDetail(null)}
                onRefund={(data) => {
                  // Reload data after refund
                  loadData();
                  alert(`Ticket refunded successfully. Refund ID: ${data.refund?.id || 'N/A'}`);
                }}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

