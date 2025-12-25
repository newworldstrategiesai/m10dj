import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Ticket, 
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { getTicket } from '../../../utils/event-tickets';
import { getEventDetails, getFullAddress } from '../../../utils/event-details';

export default function TicketView() {
  const router = useRouter();
  const { ticketId } = router.query;
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const response = await fetch(`/api/events/tickets/${ticketId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load ticket');
      }

      setTicket(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !ticket) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'Unable to load ticket.'}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const qrCodeUrl = `/api/events/tickets/qr/${ticket.qr_code_short || ticket.qr_code}`;
  const eventDetails = getEventDetails(ticket.event_id);
  const fullAddress = getFullAddress(eventDetails);

  return (
    <>
      <Head>
        <title>Your Ticket | {eventDetails.name}</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 sm:py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* QR Code */}
              <div className="modern-card text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Entry QR Code
                </h2>
                <div className="bg-white p-6 rounded-lg inline-block border-2 border-brand-gold mb-4">
                  <Image
                    src={qrCodeUrl}
                    alt="Ticket QR Code"
                    width={300}
                    height={300}
                    className="mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg ${
                    ticket.checked_in 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {ticket.checked_in ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>Checked In</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        <span>Not Checked In</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Code: {ticket.qr_code_short || ticket.qr_code}
                  </p>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="modern-card">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Ticket Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Event</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{eventDetails.name}</div>
                  </div>
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-brand-gold mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date & Time</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{eventDetails.date} at {eventDetails.time}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-brand-gold mr-3 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Venue</div>
                      <div className="font-semibold text-gray-900 dark:text-white">{eventDetails.venue}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{fullAddress}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Purchaser</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{ticket.purchaser_name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{ticket.purchaser_email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tickets</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{ticket.quantity} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">${ticket.total_amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Status</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold ${
                      ['paid', 'cash', 'card_at_door'].includes(ticket.payment_status)
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {ticket.payment_status.charAt(0).toUpperCase() + ticket.payment_status.slice(1)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Save to Home Screen Hint */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>💡 Tip:</strong> Save this page to your home screen for easy access at the event! 
                {' '}
                <span className="hidden sm:inline">
                  On iPhone: Tap Share → Add to Home Screen. On Android: Tap Menu → Add to Home Screen.
                </span>
                <span className="sm:hidden">
                  Tap the Share button and select "Add to Home Screen"
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}


