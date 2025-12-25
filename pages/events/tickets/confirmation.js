import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  Ticket, 
  Download, 
  Mail, 
  Calendar,
  MapPin,
  Clock,
  Share2,
  ChevronRight,
  ExternalLink,
  Phone,
  Info,
  Car,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Header from '../../../components/company/Header';
import Footer from '../../../components/company/Footer';
import { createClient } from '@supabase/supabase-js';
import { getEventDetails, getFullAddress } from '../../../utils/event-details';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function TicketConfirmation() {
  const router = useRouter();
  const { session_id } = router.query;
  const [ticket, setTicket] = useState(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session_id) {
      loadTicketFromSession(session_id);
    }
  }, [session_id]);

  const loadTicketFromSession = async (sessionId) => {
    try {
      setLoading(true);
      
      // Step 1: Verify payment with Stripe
      try {
        const verifyResponse = await fetch(`/api/events/tickets/verify-session?session_id=${sessionId}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
          throw new Error(verifyData.error || 'Payment verification failed');
        }

        if (!verifyData.is_paid) {
          // Payment not yet processed, but we'll still show the ticket
          // The webhook will update it soon
          console.warn('Payment not yet confirmed, showing ticket anyway');
        }
        
        setPaymentVerified(verifyData.is_paid);
      } catch (verifyError) {
        console.error('Payment verification error:', verifyError);
        // Continue even if verification fails - ticket might still be valid
      } finally {
        setVerifyingPayment(false);
      }

      // Step 2: Load ticket from database
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (error) {
        throw new Error('Ticket not found. Please check your confirmation email or contact support.');
      }

      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || verifyingPayment) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-brand-gold" />
            <p className="text-gray-600 dark:text-gray-400">Loading your tickets...</p>
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
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md mx-auto px-4">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ticket Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Unable to load ticket information.'}</p>
            <div className="space-y-3">
              <Link href="/events/live/dj-ben-murray-silky-osullivans-2026-12-27" className="btn-primary inline-block">
                Back to Event Page
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Need help? Contact us:</p>
                <a href="tel:9014102020" className="text-brand-gold hover:underline">(901) 410-2020</a>
                {' • '}
                <a href="mailto:info@m10djcompany.com" className="text-brand-gold hover:underline">info@m10djcompany.com</a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const qrCodeUrl = `/api/events/tickets/qr/${ticket.qr_code_short || ticket.qr_code}`;
  const eventDetails = getEventDetails(ticket.event_id);
  const fullAddress = getFullAddress(eventDetails);
  const ticketUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.m10djcompany.com'}/events/tickets/${ticket.id}`;

  return (
    <>
      <Head>
        <title>Ticket Confirmation | {eventDetails.name}</title>
        <meta name="description" content={`Your tickets for ${eventDetails.name} are confirmed! ${eventDetails.date} at ${eventDetails.venue}`} />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Success Header */}
        <section className="bg-gradient-to-br from-green-500 to-green-600 text-white py-12">
          <div className="section-container">
            <div className="max-w-2xl mx-auto text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Tickets Confirmed! 🎉</h1>
              <p className="text-xl text-green-100">
                Your tickets for {eventDetails.name} are ready
              </p>
              {!paymentVerified && ticket.payment_status !== 'paid' && (
                <div className="mt-4 bg-yellow-500/20 border border-yellow-300/50 rounded-lg p-3 text-sm">
                  <p className="text-yellow-100">
                    Payment processing... Your tickets will be fully confirmed once payment is complete.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ticket Details */}
        <section className="py-16">
          <div className="section-container">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* QR Code - Prominent */}
                <div className="modern-card text-center order-1 lg:order-2">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Entry QR Code
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
                    Present this QR code at the door for entry
                  </p>
                  <div className="bg-white p-6 rounded-lg inline-block border-2 border-brand-gold shadow-lg">
                    <Image
                      src={qrCodeUrl}
                      alt="Ticket QR Code"
                      width={300}
                      height={300}
                      className="mx-auto"
                      priority
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Code: <strong className="font-mono">{ticket.qr_code_short || ticket.qr_code}</strong>
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={ticketUrl}
                      className="inline-flex items-center text-sm text-brand-gold hover:text-brand-gold/80 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Permanent Ticket Link
                    </Link>
                  </div>
                </div>

                {/* Event Info */}
                <div className="modern-card order-2 lg:order-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Event Details
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{eventDetails.date}</div>
                        <div className="text-gray-600 dark:text-gray-300">{eventDetails.time}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{eventDetails.venue}</div>
                        <div className="text-gray-600 dark:text-gray-300">{fullAddress}</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Ticket className="w-5 h-5 text-brand-gold mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {ticket.quantity} {ticket.quantity === 1 ? 'Ticket' : 'Tickets'}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">${ticket.total_amount.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Payment Status: <span className={`font-semibold ${
                            ['paid', 'cash', 'card_at_door'].includes(ticket.payment_status)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {ticket.payment_status.charAt(0).toUpperCase() + ticket.payment_status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {eventDetails.description && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {eventDetails.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Instructions Section */}
              <div className="modern-card mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Info className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                  Important Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What's Next */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      What's Next?
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Save this page or take a screenshot of your QR code</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Arrive at the venue on <strong>{eventDetails.date}</strong> at <strong>{eventDetails.time}</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Present your QR code at the door for entry</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Each ticket holder needs to show the QR code</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span>Keep your confirmation email for your records</span>
                      </li>
                    </ul>
                  </div>

                  {/* Parking Info */}
                  {eventDetails.parking && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                        <Car className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                        Parking Information
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {eventDetails.parking.info}
                      </p>
                      {eventDetails.parking.cost && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>Cost:</strong> {eventDetails.parking.cost}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Venue Policies */}
                {eventDetails.policies && eventDetails.policies.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Venue Policies
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                      {eventDetails.policies.map((policy, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                          <span>{policy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contact Information */}
                {eventDetails.contact && (
                  <div className="mt-6 pt-6 border-t border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Need Help?
                    </h4>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {eventDetails.contact.phone && (
                        <a 
                          href={`tel:${eventDetails.contact.phone.replace(/\D/g, '')}`}
                          className="flex items-center text-brand-gold hover:text-brand-gold/80 font-medium"
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          {eventDetails.contact.phone}
                        </a>
                      )}
                      {eventDetails.contact.email && (
                        <a 
                          href={`mailto:${eventDetails.contact.email}`}
                          className="flex items-center text-brand-gold hover:text-brand-gold/80 font-medium"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {eventDetails.contact.email}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Event Info */}
              {eventDetails.additionalInfo && (
                <div className="modern-card mt-6 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {eventDetails.additionalInfo}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center justify-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Print Tickets
                </button>
                <a
                  href={`mailto:?subject=Tickets for ${eventDetails.name}&body=Check out my tickets: ${ticketUrl}`}
                  className="btn-secondary flex items-center justify-center"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email Tickets
                </a>
                <Link
                  href={ticketUrl}
                  className="btn-outline flex items-center justify-center"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View Ticket Page
                </Link>
                <Link
                  href={`/events/live/${ticket.event_id}`}
                  className="btn-outline flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 mr-2" />
                  Back to Event
                </Link>
              </div>
              
              {/* Save to Home Screen Hint */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
        </section>
      </main>

      <Footer />
    </>
  );
}
