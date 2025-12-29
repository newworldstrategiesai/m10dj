import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/company/Header';
import { CheckCircle, Music, Mic, Loader2, Zap, Mail, Check, Clock, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSuccessPageTracking } from '../../hooks/useSuccessPageTracking';

export default function CrowdRequestSuccessPage() {
  const router = useRouter();
  const { session_id, request_id } = router.query;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [receiptError, setReceiptError] = useState(null);
  const [userRequestCount, setUserRequestCount] = useState(0);
  const confettiTriggered = useRef(false);

  // Track success page view
  useSuccessPageTracking(request_id);

  useEffect(() => {
    if (request_id && session_id) {
      // Process payment success first to update payment_intent_id
      processPaymentSuccess();
    } else if (request_id) {
      fetchRequestDetails(request_id);
    } else {
      setLoading(false);
    }
  }, [request_id, session_id]);

  useEffect(() => {
    if (request && !loading) {
      fetchUserStats();
      
      // Trigger confetti animation when request is successfully loaded and page is ready
      // Only trigger once per page load
      if (!confettiTriggered.current) {
        confettiTriggered.current = true;
        // Small delay to ensure page is fully rendered
        setTimeout(() => {
          triggerConfetti();
        }, 300);
      }
    }
  }, [request, loading]);

  const triggerConfetti = () => {
    // Create a confetti cannon effect
    const duration = 3000; // 3 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Launch confetti from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Also do a big burst from the center
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });
    }, 100);
  };

  const fetchUserStats = async () => {
    try {
      const params = new URLSearchParams();
      if (request?.event_qr_code) params.append('event_qr_code', request.event_qr_code);
      if (request?.requester_email) params.append('requester_email', request.requester_email);
      if (request?.requester_phone) params.append('requester_phone', request.requester_phone);

      const response = await fetch(`/api/crowd-request/user-stats?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUserRequestCount(data.userRequestCount || 0);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const processPaymentSuccess = async () => {
    try {
      const response = await fetch('/api/crowd-request/process-payment-success', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session_id,
          requestId: request_id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Fetch updated request details
        await fetchRequestDetails(request_id);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error processing payment success:', errorData.error || 'Unknown error');
        
        // Retry once after a short delay
        setTimeout(async () => {
          try {
            const retryResponse = await fetch('/api/crowd-request/process-payment-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: session_id,
                requestId: request_id,
              }),
            });
            
            if (retryResponse.ok) {
              console.log('✅ Payment processing succeeded on retry');
              await fetchRequestDetails(request_id);
            } else {
              console.error('❌ Payment processing failed on retry - webhook will handle it');
            }
          } catch (retryErr) {
            console.error('Error on retry:', retryErr);
          }
        }, 2000);
        
        // Still fetch request details even if payment processing fails
        await fetchRequestDetails(request_id);
      }
    } catch (err) {
      console.error('Error processing payment success:', err);
      // Still fetch request details even if payment processing fails
      await fetchRequestDetails(request_id);
    }
  };

  const fetchRequestDetails = async (requestId) => {
    try {
      const response = await fetch(`/api/crowd-request/details?id=${requestId}`);
      if (response.ok) {
        const data = await response.json();
        setRequest(data);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!request || !request.requester_email) return;

    setSendingReceipt(true);
    setReceiptError(null);

    try {
      const response = await fetch('/api/crowd-request/send-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          email: request.requester_email,
          name: request.requester_name || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReceiptSent(true);
      } else {
        setReceiptError(data.error || 'Failed to send receipt. Please try again.');
      }
    } catch (err) {
      console.error('Error sending receipt:', err);
      setReceiptError('Failed to send receipt. Please try again.');
    } finally {
      setSendingReceipt(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Processing Payment | M10 DJ Company</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Header />
          <main className="section-container py-12 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Processing your payment...
              </p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Request Confirmed! | M10 DJ Company</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
        
        <main className="section-container py-12 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {request?.played_at ? 'Song Played!' : 'Thank You!'}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {request?.played_at 
                  ? 'Great news! Your song request has been played. We hope you enjoyed it!'
                  : 'Your payment was successful and your request has been submitted. We appreciate your support!'
                }
              </p>

              {request && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 mb-8 text-left">
                  <div className="flex items-start gap-4">
                    {request.request_type === 'song_request' ? (
                      <Music className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    ) : (
                      <Mic className="w-8 h-8 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {request.request_type === 'song_request' ? 'Song Request' : 'Shoutout'}
                        </h3>
                        {request.is_fast_track && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">
                            <Zap className="w-3 h-3" />
                            Fast-Track
                          </span>
                        )}
                      </div>
                      
                      {request.request_type === 'song_request' ? (
                        <div>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Song:</span> {request.song_title}
                          </p>
                          {request.song_artist && (
                            <p className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Artist:</span> {request.song_artist}
                            </p>
                          )}
                          {request.played_at ? (
                            <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle className="w-5 h-5" />
                                <p className="text-sm font-semibold">
                                  🎵 Your song was played!
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Played at: {new Date(request.played_at).toLocaleString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          ) : request.is_fast_track ? (
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-2">
                              ⚡ Fast-Track: Your song has priority placement in the queue.
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              Your song is in the queue and will be played when possible.
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-medium">For:</span> {request.recipient_name}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 mt-2">
                            <span className="font-medium">Message:</span> {request.recipient_message}
                          </p>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                        Requested by: {request.requester_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Amount paid: ${((request.amount_paid || request.amount_requested) / 100).toFixed(2)}
                        {request.is_fast_track && request.fast_track_fee > 0 && (
                          <span className="text-orange-600 dark:text-orange-400">
                            {' '}(includes ${(request.fast_track_fee / 100).toFixed(2)} fast-track fee)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {request?.is_fast_track ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚡ Fast-Track Confirmed!</strong> Your song request has priority placement in the queue. The DJ will receive your request and will play it as soon as possible.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>What's next?</strong> The DJ will receive your request and will do their best to fulfill it during the event. Keep an eye out!
                  </p>
                </div>
              )}

              {/* Bundle Messaging */}
              {userRequestCount > 1 && request?.request_type === 'song_request' && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        You've requested {userRequestCount} songs!
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Keep the requests coming! The more songs you request, the better the party gets.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Time-Sensitive Messaging */}
              {request?.event_date && (
                (() => {
                  const eventDate = new Date(request.event_date);
                  const now = new Date();
                  const hoursUntilEvent = (eventDate - now) / (1000 * 60 * 60);
                  
                  if (hoursUntilEvent > 0 && hoursUntilEvent < 24) {
                    return (
                      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                          <Clock className="w-4 h-4" />
                          <p className="text-sm font-medium">
                            {hoursUntilEvent < 1 
                              ? `Less than an hour until the event! Request your favorites now.`
                              : `Only ${Math.floor(hoursUntilEvent)} ${Math.floor(hoursUntilEvent) === 1 ? 'hour' : 'hours'} left to request songs!`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              {/* Receipt Section */}
              {request?.requester_email && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Mail className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Need a receipt for your records?
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        We can send a payment receipt to <strong>{request.requester_email}</strong> for tax purposes or your records.
                      </p>
                      
                      {receiptSent ? (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Receipt sent successfully! Check your email.</span>
                        </div>
                      ) : receiptError ? (
                        <div className="text-red-600 dark:text-red-400 text-sm mb-3">
                          {receiptError}
                        </div>
                      ) : null}
                      
                      {!receiptSent && (
                        <button
                          onClick={handleSendReceipt}
                          disabled={sendingReceipt}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sendingReceipt ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4" />
                              Send Receipt
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Action: Request Another */}
              {request?.event_qr_code && (
                <div className="mb-6">
                  <Link
                    href={`/crowd-request/${request.event_qr_code}`}
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 dark:from-purple-500 dark:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Music className="w-6 h-6" />
                    Request Another Song
                  </Link>
                </div>
              )}

              {/* Secondary Action: Return Home */}
              <div className="flex justify-center">
                <Link
                  href={request?.event_qr_code ? `/crowd-request/${request.event_qr_code}` : "/"}
                  className="btn-outline inline-flex items-center justify-center gap-2"
                >
                  {request?.event_qr_code ? 'Back to Requests' : 'Return to Home'}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

