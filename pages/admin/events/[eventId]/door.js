import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Ticket, 
  CheckCircle, 
  XCircle,
  Camera,
  Search,
  DollarSign,
  Users,
  AlertCircle,
  UserPlus,
  Loader2
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isAdminEmail } from '../../../../utils/auth-helpers/admin-roles';
import { getEventInfo } from '../../../../utils/event-info';
import { getEventTicketConfig } from '../../../../utils/event-tickets';
import { generateShortQRCode } from '../../../../utils/event-tickets';
import QRCodeScanner from '../../../../components/admin/QRCodeScanner';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default check-in methods (can be configured per event in the future)
const DEFAULT_CHECK_IN_METHODS = {
  qrCode: true,
  nameSearch: true
};

export default function DoorInterface() {
  const router = useRouter();
  const { eventId } = router.query;
  const [mode, setMode] = useState('checkin'); // 'checkin' or 'sell'
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  
  // Check-in state
  const [scanning, setScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [lastCheckInResult, setLastCheckInResult] = useState(null);
  const [checkInMethods] = useState(DEFAULT_CHECK_IN_METHODS);
  
  // Sales state
  const [formData, setFormData] = useState({
    purchaserName: '',
    purchaserEmail: '',
    purchaserPhone: '',
    quantity: 1,
    ticketType: 'general_admission',
    paymentMethod: 'cash',
    price: 12.00
  });
  const [selling, setSelling] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(null);
  const [saleError, setSaleError] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, revenue: 0 });
  const [ticketConfig, setTicketConfig] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (eventId && isAdmin) {
      loadEventData();
      loadStats();
      // Auto-refresh stats every 30 seconds
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [eventId, isAdmin]);

  const checkAuth = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push(`/signin?redirect=/admin/events/${eventId}/door`);
        return;
      }

      const userIsAdmin = await isAdminEmail(user.email);
      if (!userIsAdmin) {
        router.push('/');
        return;
      }

      setUser(user);
      setIsAdmin(true);
    } catch (error) {
      console.error('Auth error:', error);
      router.push(`/signin?redirect=/admin/events/${eventId}/door`);
    } finally {
      setLoading(false);
    }
  };

  const loadEventData = () => {
    const info = getEventInfo(eventId);
    setEventInfo(info);
    
    const config = getEventTicketConfig(eventId);
    setTicketConfig(config);
    
    if (config.ticketTypes && Object.keys(config.ticketTypes).length > 0) {
      const firstType = Object.keys(config.ticketTypes)[0];
      setFormData(prev => ({
        ...prev,
        ticketType: firstType,
        price: config.ticketTypes[firstType].price
      }));
    }
  };

  const loadStats = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('event_tickets')
        .select('quantity, checked_in, total_amount, payment_status')
        .eq('event_id', eventId)
        .in('payment_status', ['paid', 'cash', 'card_at_door']);

      if (!error && data) {
        const total = data.reduce((sum, t) => sum + t.quantity, 0);
        const checkedIn = data.filter(t => t.checked_in).reduce((sum, t) => sum + t.quantity, 0);
        const revenue = data.reduce((sum, t) => sum + (t.total_amount || 0), 0);
        setStats({ total, checkedIn, revenue });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleNameSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setSearching(true);
    try {
      const response = await fetch('/api/events/tickets/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, searchTerm: searchTerm.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.tickets || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async (ticketId) => {
    try {
      const response = await fetch(`/api/events/tickets/validate/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkedInBy: user?.email || 'Door Staff'
        })
      });

      const data = await response.json();
      setLastCheckInResult(data);
      
      if (data.success && data.checkedIn) {
        loadStats();
        setSearchTerm('');
        setSearchResults([]);
        setTimeout(() => setLastCheckInResult(null), 3000);
      }
    } catch (error) {
      setLastCheckInResult({
        success: false,
        error: 'Failed to check in ticket'
      });
    }
  };

  const handleQRScan = async (scannedCode) => {
    if (scannedCode) {
      try {
        // Use a placeholder ID in URL, pass QR code in body
        const response = await fetch(`/api/events/tickets/validate/qr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrCode: scannedCode,
            checkedInBy: user?.email || 'Door Staff'
          })
        });

        const data = await response.json();
        setLastCheckInResult(data);
        setScanning(false);
        
        if (data.success && data.checkedIn) {
          loadStats();
          setTimeout(() => setLastCheckInResult(null), 3000);
        }
      } catch (error) {
        setLastCheckInResult({
          success: false,
          error: 'Failed to check in ticket'
        });
        setScanning(false);
      }
    }
  };

  const handleSale = async (e) => {
    e.preventDefault();
    setSelling(true);
    setSaleError(null);
    setSaleSuccess(null);

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const qrCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const qrCodeShort = generateShortQRCode();
      const totalAmount = formData.price * formData.quantity;

      const { data, error: insertError } = await supabase
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ticket_type: formData.ticketType,
          purchaser_name: formData.purchaserName,
          purchaser_email: formData.purchaserEmail || 'door-sale@m10djcompany.com',
          purchaser_phone: formData.purchaserPhone,
          quantity: formData.quantity,
          price_per_ticket: formData.price,
          total_amount: totalAmount,
          payment_status: formData.paymentMethod === 'cash' ? 'cash' : 'card_at_door',
          payment_method: formData.paymentMethod,
          qr_code: qrCode,
          qr_code_short: qrCodeShort
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSaleSuccess({
        ticket: data,
        message: `Ticket created! QR: ${data.qr_code_short || data.qr_code.substring(0, 12)}`
      });

      // Reset form
      setFormData({
        purchaserName: '',
        purchaserEmail: '',
        purchaserPhone: '',
        quantity: 1,
        ticketType: Object.keys(ticketConfig?.ticketTypes || {})[0] || 'general_admission',
        paymentMethod: 'cash',
        price: ticketConfig?.ticketTypes?.[Object.keys(ticketConfig?.ticketTypes || {})[0]]?.price || 12.00
      });

      loadStats();

      setTimeout(() => setSaleSuccess(null), 5000);
    } catch (err) {
      setSaleError(err.message);
    } finally {
      setSelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Door Interface | Loading...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        <main className="min-h-screen flex items-center justify-center bg-gray-900">
          <Loader2 className="w-12 h-12 animate-spin text-brand-gold" />
        </main>
      </>
    );
  }

  if (!isAdmin || !eventId || !ticketConfig) {
    return null; // Will redirect
  }

  const ticketTypes = ticketConfig.ticketTypes || {};

  return (
    <>
      <Head>
        <title>Door | {eventInfo?.name || eventId}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <main className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-4 pb-20">
          {/* Event Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-brand-gold mb-1">
              {eventInfo?.name || eventId}
            </h1>
            <p className="text-sm text-gray-400">{eventInfo?.date || eventId}</p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-brand-gold">{stats.total}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-400">{stats.checkedIn}</div>
              <div className="text-xs text-gray-400">Checked In</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-400">${stats.revenue.toFixed(0)}</div>
              <div className="text-xs text-gray-400">Revenue</div>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('checkin')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                mode === 'checkin'
                  ? 'bg-brand-gold text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CheckCircle className="w-5 h-5 mx-auto mb-1" />
              Check-In
            </button>
            <button
              onClick={() => setMode('sell')}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                mode === 'sell'
                  ? 'bg-brand-gold text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Ticket className="w-5 h-5 mx-auto mb-1" />
              Sell Ticket
            </button>
          </div>

          {/* Check-In Mode */}
          {mode === 'checkin' && (
            <div className="space-y-4">
              {/* Success/Error Message */}
              {lastCheckInResult && (
                <div className={`rounded-lg p-4 ${
                  lastCheckInResult.success && lastCheckInResult.checkedIn
                    ? 'bg-green-900/30 border-2 border-green-500'
                    : lastCheckInResult.success
                    ? 'bg-yellow-900/30 border-2 border-yellow-500'
                    : 'bg-red-900/30 border-2 border-red-500'
                }`}>
                  <div className="flex items-center">
                    {lastCheckInResult.success && lastCheckInResult.checkedIn ? (
                      <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400 mr-3" />
                    )}
                    <div>
                      <div className="font-bold">
                        {lastCheckInResult.success && lastCheckInResult.checkedIn
                          ? 'Checked In! ✅'
                          : lastCheckInResult.error || 'Error'}
                      </div>
                      {lastCheckInResult.ticket && (
                        <div className="text-sm text-gray-300 mt-1">
                          {lastCheckInResult.ticket.purchaser_name} ({lastCheckInResult.ticket.quantity} ticket{lastCheckInResult.ticket.quantity > 1 ? 's' : ''})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Scanner */}
              {checkInMethods.qrCode && (
                <button
                  onClick={() => setScanning(true)}
                  className="w-full bg-brand-gold hover:bg-amber-400 text-black font-bold py-4 rounded-lg flex items-center justify-center"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Scan QR Code
                </button>
              )}

              {/* Name Search */}
              {checkInMethods.nameSearch && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <form onSubmit={handleNameSearch} className="space-y-3">
                    <label className="block text-sm font-semibold">Search by Name</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setSearchResults([]);
                        }}
                        placeholder="Enter customer name..."
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-gold focus:border-transparent text-lg"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={searching || !searchTerm.trim()}
                        className="bg-brand-gold hover:bg-amber-400 text-black font-bold px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      </button>
                    </div>
                  </form>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-xs text-gray-400">Found {searchResults.length} ticket(s)</div>
                      {searchResults.map((ticket) => (
                        <div
                          key={ticket.id}
                          className={`bg-gray-700 rounded-lg p-3 flex items-center justify-between ${
                            ticket.checked_in ? 'opacity-60' : ''
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{ticket.purchaser_name}</div>
                            <div className="text-xs text-gray-400">
                              {ticket.quantity} ticket{ticket.quantity > 1 ? 's' : ''} • ${ticket.total_amount.toFixed(2)}
                              {ticket.checked_in && ' • Already checked in'}
                            </div>
                          </div>
                          {!ticket.checked_in && (
                            <button
                              onClick={() => handleCheckIn(ticket.id)}
                              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                              Check In
                            </button>
                          )}
                          {ticket.checked_in && (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {searchTerm && searchResults.length === 0 && !searching && (
                    <div className="mt-4 text-center text-gray-400 text-sm">
                      No tickets found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sell Ticket Mode */}
          {mode === 'sell' && (
            <div className="space-y-4">
              {/* Success Message */}
              {saleSuccess && (
                <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold text-green-400 mb-1">Ticket Sold!</div>
                      <div className="text-sm text-gray-300">
                        {saleSuccess.message}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Total: ${saleSuccess.ticket.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {saleError && (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" />
                    <div className="text-red-300">{saleError}</div>
                  </div>
                </div>
              )}

              {/* Sale Form */}
              <form onSubmit={handleSale} className="bg-gray-800 rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Customer Name *</label>
                  <input
                    type="text"
                    value={formData.purchaserName}
                    onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-gold focus:border-transparent text-lg"
                    placeholder="John Doe"
                    required
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Ticket Type</label>
                    <select
                      value={formData.ticketType}
                      onChange={(e) => {
                        const type = ticketTypes[e.target.value];
                        setFormData({
                          ...formData,
                          ticketType: e.target.value,
                          price: type?.price || 12.00
                        });
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent"
                    >
                      {Object.entries(ticketTypes).map(([key, type]) => (
                        <option key={key} value={key}>
                          {type.name} - ${type.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent text-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        formData.paymentMethod === 'cash'
                          ? 'bg-brand-gold text-black'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, paymentMethod: 'card_at_door' })}
                      className={`py-3 rounded-lg font-semibold transition-all ${
                        formData.paymentMethod === 'card_at_door'
                          ? 'bg-brand-gold text-black'
                          : 'bg-gray-700 text-white'
                      }`}
                    >
                      Card
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-brand-gold">
                      ${(formData.price * formData.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={selling}
                  className="w-full bg-brand-gold hover:bg-amber-400 text-black font-bold py-4 rounded-lg flex items-center justify-center disabled:opacity-50 text-lg"
                >
                  {selling ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Creating Ticket...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-6 h-6 mr-2" />
                      Create Ticket
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* QR Scanner Modal */}
          <QRCodeScanner
            scanning={scanning}
            onScan={handleQRScan}
            onClose={() => setScanning(false)}
          />
        </div>
      </main>
    </>
  );
}

