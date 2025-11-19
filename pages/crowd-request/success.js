import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/company/Header';
import { CheckCircle, Music, Mic, Loader2, Zap } from 'lucide-react';

export default function CrowdRequestSuccessPage() {
  const router = useRouter();
  const { session_id, request_id } = router.query;
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session_id && request_id) {
      fetchRequestDetails(request_id);
    } else {
      setLoading(false);
    }
  }, [session_id, request_id]);

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
                Request Confirmed!
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Your payment was successful and your request has been submitted.
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
                          {request.is_fast_track && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-2">
                              ⚡ Your song will be played next!
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
                    <strong>⚡ Fast-Track Confirmed!</strong> Your song request has priority placement and will be played next! The DJ will receive your request immediately.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>What's next?</strong> The DJ will receive your request and will do their best to fulfill it during the event. Keep an eye out!
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="btn-outline inline-flex items-center justify-center gap-2"
                >
                  Return to Home
                </Link>
                {request?.event_qr_code && (
                  <Link
                    href={`/crowd-request/${request.event_qr_code}`}
                    className="btn-primary inline-flex items-center justify-center gap-2"
                  >
                    Make Another Request
                  </Link>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

