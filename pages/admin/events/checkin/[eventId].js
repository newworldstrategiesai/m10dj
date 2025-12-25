import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Ticket,
  Search,
  Loader2
} from 'lucide-react';
import Header from '../../../../components/company/Header';
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import QRCodeScanner from '../../../../components/admin/QRCodeScanner';
import { isAdminEmail } from '../../../../utils/auth-helpers/admin-roles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function EventCheckIn() {
  const router = useRouter();
  const { eventId } = router.query;
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (eventId && isAdmin) {
      loadStats();
    }
  }, [eventId, isAdmin]);

  const checkAdminAuth = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        router.push(`/signin?redirect=/admin/events/checkin/${eventId}`);
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
      router.push(`/signin?redirect=/admin/events/checkin/${eventId}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('event_tickets')
        .select('quantity, checked_in')
        .eq('event_id', eventId)
        .in('payment_status', ['paid', 'cash', 'card_at_door']);

      if (!error && data) {
        const total = data.reduce((sum, t) => sum + t.quantity, 0);
        const checkedIn = data.filter(t => t.checked_in).reduce((sum, t) => sum + t.quantity, 0);
        setStats({ total, checkedIn });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const validateTicket = async (qrCode) => {
    try {
      const response = await fetch(`/api/events/tickets/validate/${qrCode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrCode,
          checkedInBy: user?.email || 'Staff'
        }),
      });

      const data = await response.json();
      setLastResult(data);
      
      if (data.success && data.checkedIn) {
        // Reload stats
        loadStats();
        // Stop scanner if active
        setScanning(false);
        // Clear manual code after successful check-in
        setTimeout(() => {
          setManualCode('');
          setLastResult(null);
        }, 3000);
      }
    } catch (error) {
      setLastResult({
        success: false,
        error: 'Failed to validate ticket'
      });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateTicket(manualCode.trim());
    }
  };

  const handleScan = (scannedCode) => {
    if (scannedCode) {
      validateTicket(scannedCode);
    }
  };

  const handleCloseScanner = () => {
    setScanning(false);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto mb-4" />
            <p className="text-gray-400">Checking permissions...</p>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (!eventId) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <p className="text-gray-400">Loading event...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Event Check-In | {eventId}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-brand-gold">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Tickets</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.checkedIn}</div>
              <div className="text-sm text-gray-400">Checked In</div>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Search className="w-5 h-5 mr-2 text-brand-gold" />
              Manual Entry
            </h2>
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter QR code or ticket ID"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-gold focus:border-transparent text-lg"
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-brand-gold text-black font-bold py-3 rounded-lg hover:bg-amber-400 transition-colors"
              >
                Validate Ticket
              </button>
            </form>
          </div>

          {/* QR Scanner Button */}
          <button
            onClick={() => setScanning(true)}
            disabled={scanning}
            className="w-full bg-brand-gold hover:bg-amber-400 text-black font-bold py-4 rounded-lg mb-6 flex items-center justify-center disabled:opacity-50 transition-colors"
          >
            <Camera className="w-5 h-5 mr-2" />
            {scanning ? 'Scanner Active' : 'Scan QR Code with Camera'}
          </button>

          {/* QR Scanner Component */}
          <QRCodeScanner
            scanning={scanning}
            onScan={handleScan}
            onClose={handleCloseScanner}
          />

          {/* Result Display */}
          {lastResult && (
            <div className={`rounded-lg p-6 mb-6 ${
              lastResult.success && lastResult.checkedIn
                ? 'bg-green-900/30 border-2 border-green-500'
                : lastResult.success
                ? 'bg-yellow-900/30 border-2 border-yellow-500'
                : 'bg-red-900/30 border-2 border-red-500'
            }`}>
              <div className="flex items-start">
                {lastResult.success && lastResult.checkedIn ? (
                  <CheckCircle className="w-8 h-8 text-green-400 mr-4 flex-shrink-0" />
                ) : lastResult.success ? (
                  <AlertCircle className="w-8 h-8 text-yellow-400 mr-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-400 mr-4 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {lastResult.success && lastResult.checkedIn
                      ? 'Ticket Checked In! ✅'
                      : lastResult.success
                      ? 'Ticket Valid'
                      : 'Error'}
                  </h3>
                  {lastResult.ticket && (
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {lastResult.ticket.purchaser_name}</div>
                      <div><strong>Quantity:</strong> {lastResult.ticket.quantity}</div>
                      <div><strong>Status:</strong> {lastResult.ticket.checked_in ? 'Checked In' : 'Not Checked In'}</div>
                    </div>
                  )}
                  {lastResult.error && (
                    <p className="text-red-300">{lastResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="font-bold mb-3">Check-In Instructions</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Enter the QR code from the attendee's ticket</li>
              <li>Click "Validate Ticket" or press Enter</li>
              <li>Confirm the ticket is valid and not already checked in</li>
              <li>Ticket will be automatically marked as checked in</li>
            </ol>
          </div>
        </div>
      </main>
    </>
  );
}

