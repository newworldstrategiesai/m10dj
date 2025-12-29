import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/company/Header';
import { CheckCircle, Music, Mic, Loader2, Zap, Mail, Check, Clock, Gift, Radio, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSuccessPageTracking } from '../../hooks/useSuccessPageTracking';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function CrowdRequestSuccessPage() {
  const router = useRouter();
  const { session_id, request_id } = router.query;
  const [request, setRequest] = useState(null);
  const [bundledSongs, setBundledSongs] = useState([]); // Array of bundled song requests
  const [loading, setLoading] = useState(true);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const [receiptError, setReceiptError] = useState(null);
  const [userRequestCount, setUserRequestCount] = useState(0);
  const [statusJustChanged, setStatusJustChanged] = useState(false);
  const confettiTriggered = useRef(false);
  const playingConfettiTriggered = useRef(false);
  const supabase = createClientComponentClient();

  // Track success page view
  useSuccessPageTracking(request_id);

  // Subscribe to real-time updates for this request
  useEffect(() => {
    if (!request_id) return;

    const channel = supabase
      .channel(`request-${request_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crowd_requests',
          filter: `id=eq.${request_id}`
        },
        (payload) => {
          console.log('Request updated:', payload);
          const updatedRequest = payload.new;
          
          // Check if status changed to playing or played
          if (updatedRequest.status === 'playing' || updatedRequest.status === 'played') {
            // Trigger celebration effect
            if (!playingConfettiTriggered.current) {
              playingConfettiTriggered.current = true;
              triggerPlayingConfetti();
            }
            setStatusJustChanged(true);
            setTimeout(() => setStatusJustChanged(false), 3000);
          }
          
          setRequest(prev => ({ ...prev, ...updatedRequest }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request_id, supabase]);

  // Subscribe to real-time updates for bundled songs
  useEffect(() => {
    if (bundledSongs.length === 0) return;

    const bundleIds = bundledSongs.map(s => s.id);
    
    const bundleChannel = supabase
      .channel(`bundle-songs-${request_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crowd_requests'
        },
        (payload) => {
          // Check if this update is for one of our bundled songs
          if (bundleIds.includes(payload.new.id)) {
            console.log('Bundled song updated:', payload);
            const updatedSong = payload.new;
            
            // Trigger celebration if bundled song is playing/played
            if (updatedSong.status === 'playing' || updatedSong.status === 'played') {
              if (!playingConfettiTriggered.current) {
                playingConfettiTriggered.current = true;
                triggerPlayingConfetti();
              }
            }
            
            // Update the bundled songs state
            setBundledSongs(prev => prev.map(song => 
              song.id === updatedSong.id 
                ? { ...song, ...updatedSong }
                : song
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bundleChannel);
    };
  }, [bundledSongs, request_id, supabase]);

  // Celebration confetti when song is played
  const triggerPlayingConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#10b981', '#22c55e', '#4ade80', '#86efac']
    });
  };

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
    // Use a high z-index to ensure confetti appears on top of all content
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

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
        
        // Fetch bundled songs if this is part of a bundle
        // Look for requests with "Bundle deal" message from the same requester created within 5 seconds
        try {
          await fetchBundledSongs(data);
        } catch (bundleErr) {
          console.error('Error fetching bundled songs (non-critical):', bundleErr);
          // Continue - bundled songs are optional, don't block the page
        }
      } else {
        console.error('Failed to fetch request details:', response.status);
      }
    } catch (err) {
      console.error('Error fetching request details:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBundledSongs = async (mainRequest) => {
    if (!mainRequest) return;
    
    try {
      // Query for bundled songs - look for requests with "Bundle deal" message
      // Primary method: Use payment_code (bundle songs share the same payment code)
      // Fallback: Find by requester email/phone created within 5 seconds
      
      let bundleData = [];
      
      // Method 1: Find by shared payment_code (most reliable for new bundles)
      if (mainRequest.payment_code) {
        const { data: paymentCodeMatches, error: pcError } = await supabase
          .from('crowd_requests')
          .select('id, song_title, song_artist, status, played_at, request_message, created_at, payment_code')
          .neq('id', mainRequest.id)
          .eq('payment_code', mainRequest.payment_code)
          .order('created_at', { ascending: true });
        
        if (!pcError && paymentCodeMatches?.length > 0) {
          // Filter to only include requests with "Bundle deal" in request_message
          bundleData = paymentCodeMatches.filter(r => 
            r.request_message && r.request_message.includes('Bundle deal')
          );
        }
      }
      
      // Method 2: Fallback to time-based matching if no payment_code matches found
      if (bundleData.length === 0) {
        const timeWindowStart = new Date(new Date(mainRequest.created_at).getTime() - 5000).toISOString();
        const timeWindowEnd = new Date(new Date(mainRequest.created_at).getTime() + 5000).toISOString();
        
        // Build filter for requester matching
        let requesterFilter = '';
        if (mainRequest.requester_email) {
          requesterFilter = `requester_email.eq.${mainRequest.requester_email}`;
        }
        if (mainRequest.requester_phone) {
          if (requesterFilter) {
            requesterFilter += `,requester_phone.eq.${mainRequest.requester_phone}`;
          } else {
            requesterFilter = `requester_phone.eq.${mainRequest.requester_phone}`;
          }
        }
        
        if (requesterFilter) {
          const { data: timeMatches, error: tmError } = await supabase
            .from('crowd_requests')
            .select('id, song_title, song_artist, status, played_at, request_message, created_at, payment_code')
            .neq('id', mainRequest.id)
            .eq('event_qr_code', mainRequest.event_qr_code)
            .or(requesterFilter)
            .gte('created_at', timeWindowStart)
            .lte('created_at', timeWindowEnd)
            .order('created_at', { ascending: true });
          
          if (!tmError && timeMatches?.length > 0) {
            // Filter to only include requests with "Bundle deal" in request_message
            bundleData = timeMatches.filter(r => 
              r.request_message && r.request_message.includes('Bundle deal')
            );
          }
        }
      }
      
      console.log('Bundled songs found:', bundleData.length, bundleData);
      setBundledSongs(bundleData);
    } catch (err) {
      console.error('Error fetching bundled songs:', err);
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
              
              <h1 className={`text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-all duration-500 ${statusJustChanged ? 'scale-110' : ''}`}>
                {request?.status === 'playing' 
                  ? '🎶 Playing Now!' 
                  : request?.status === 'played'
                    ? '🎵 Song Played!' 
                    : 'Thank You!'}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {request?.status === 'playing'
                  ? 'Amazing! Your song is playing right now! Enjoy the music!'
                  : request?.status === 'played'
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
                          
                          {/* Live Status Display */}
                          <div className={`mt-3 pt-3 border-t border-purple-200 dark:border-purple-700 transition-all duration-500 ${statusJustChanged ? 'animate-pulse' : ''}`}>
                            {request.status === 'playing' ? (
                              // PLAYING NOW - Song is currently playing (check this FIRST!)
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                  </span>
                                  <Radio className="w-5 h-5 animate-pulse" />
                                  <p className="text-sm font-bold">
                                    🎶 Playing Now!
                                  </p>
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1 ml-8">
                                  Your song is playing right now! Enjoy!
                                </p>
                                {request.played_at && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-8">
                                    Started at: {new Date(request.played_at).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : request.status === 'played' || request.played_at ? (
                              // PLAYED - Song has been played (only show after 'playing' ends)
                              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-5 h-5" />
                                  <p className="text-sm font-semibold">
                                    🎵 Your song was played!
                                  </p>
                                </div>
                                {request.played_at && (
                                  <p className="text-sm text-green-700 dark:text-green-300 mt-1 ml-7">
                                    Played at: {new Date(request.played_at).toLocaleString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : request.is_fast_track ? (
                              // FAST-TRACK - Priority queue
                              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                  <Zap className="w-5 h-5" />
                                  <p className="text-sm font-semibold">
                                    ⚡ Fast-Track Active
                                  </p>
                                </div>
                                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 ml-7">
                                  Your song has priority placement. Coming up soon!
                                </p>
                              </div>
                            ) : (
                              // IN QUEUE - Waiting to be played
                              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                  <Clock className="w-5 h-5" />
                                  <p className="text-sm font-semibold">
                                    🎵 In the Queue
                                  </p>
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 ml-7">
                                  Your song is queued and will be played when possible.
                                </p>
                              </div>
                            )}
                            
                            {/* Real-time update indicator */}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Live updates enabled • Status updates automatically
                            </p>
                          </div>
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
                      
                      {/* Bundled Songs Display */}
                      {bundledSongs.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                          <div className="flex items-center gap-2 mb-3">
                            <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              Bundle Songs ({bundledSongs.length + 1} total)
                            </h4>
                          </div>
                          <div className="space-y-2">
                            {bundledSongs.map((song, index) => (
                              <div 
                                key={song.id} 
                                className={`bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border ${
                                  song.status === 'playing' 
                                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' 
                                    : song.status === 'played'
                                      ? 'border-green-200 dark:border-green-800'
                                      : 'border-purple-100 dark:border-purple-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                      #{index + 2}
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {song.song_title || 'Song title pending'}
                                      </p>
                                      {song.song_artist && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          {song.song_artist}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {/* Status indicator for bundled song */}
                                  {song.status === 'playing' ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                      </span>
                                      🎶 Playing Now
                                    </span>
                                  ) : song.status === 'played' ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                      <CheckCircle className="w-3 h-3" />
                                      ✓ Played
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                                      <Clock className="w-3 h-3" />
                                      In Queue
                                    </span>
                                  )}
                                </div>
                                {/* Show play time if song was played */}
                                {song.played_at && (
                                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-6">
                                    Played at: {new Date(song.played_at).toLocaleString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status-based messaging */}
              {request?.status === 'playing' ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>🎶 On the decks!</strong> Your song is playing right now. Get on the dance floor and enjoy!
                  </p>
                </div>
              ) : request?.status === 'played' ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>✅ Request Complete!</strong> Your song has been played. Thanks for making the party great! Want to request another?
                  </p>
                </div>
              ) : request?.is_fast_track ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <strong>⚡ Fast-Track Confirmed!</strong> Your song request has priority placement in the queue. The DJ will receive your request and will play it as soon as possible.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>What's next?</strong> The DJ will receive your request and will do their best to fulfill it during the event. This page updates automatically when your song plays!
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
                    href={request.event_qr_code.startsWith('general') ? '/requests' : `/crowd-request/${request.event_qr_code}`}
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
                  href={request?.event_qr_code 
                    ? (request.event_qr_code.startsWith('general') ? '/requests' : `/crowd-request/${request.event_qr_code}`)
                    : "/"}
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

