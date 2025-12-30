import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../../components/company/Header';
import { CheckCircle, Music, Mic, Loader2, Zap, Mail, Check, Clock, Gift, Radio, Play, Disc3 } from 'lucide-react';
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
  const [albumArt, setAlbumArt] = useState(null); // Main song album art
  const [bundleAlbumArts, setBundleAlbumArts] = useState({}); // Album art for bundled songs { songId: artUrl }
  const confettiTriggered = useRef(false);
  const playingConfettiTriggered = useRef(false);
  const supabase = createClientComponentClient();

  // Track success page view
  useSuccessPageTracking(request_id);

  // Force dark mode on the success page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    
    // Cleanup on unmount - restore to previous state
    return () => {
      // Let the ThemeProvider handle the restoration
    };
  }, []);

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

  // Fetch album art from iTunes API (free, no auth required)
  const fetchAlbumArt = async (songTitle, artist, songId = null) => {
    if (!songTitle) return null;
    
    try {
      const searchTerm = artist 
        ? `${songTitle} ${artist}` 
        : songTitle;
      
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=1`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Get high-resolution artwork (600x600 instead of default 100x100)
        const artworkUrl = data.results[0].artworkUrl100?.replace('100x100', '600x600');
        
        if (songId) {
          // For bundled songs, store in the bundleAlbumArts object
          setBundleAlbumArts(prev => ({ ...prev, [songId]: artworkUrl }));
        }
        
        return artworkUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching album art:', error);
      return null;
    }
  };

  // Fetch album art when request is loaded
  useEffect(() => {
    if (request && request.request_type === 'song_request' && request.song_title) {
      fetchAlbumArt(request.song_title, request.song_artist).then(art => {
        if (art) setAlbumArt(art);
      });
    }
  }, [request?.id, request?.song_title, request?.song_artist]);

  // Fetch album art for bundled songs
  useEffect(() => {
    if (bundledSongs.length > 0) {
      bundledSongs.forEach(song => {
        if (song.song_title && !bundleAlbumArts[song.id]) {
          fetchAlbumArt(song.song_title, song.song_artist, song.id);
        }
      });
    }
  }, [bundledSongs]);

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

      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50 dark:from-black dark:via-neutral-950 dark:to-black pb-24 md:pb-8">
        <Header />
        
        <main className="section-container py-4 md:py-20">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-950 rounded-xl md:rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-purple-500/5 p-4 md:p-12 text-center dark:border dark:border-neutral-800">
              
              {/* Compact Header: Icon + Title + Status in one row on mobile */}
              <div className="flex items-center justify-center gap-3 md:flex-col md:gap-0 mb-3 md:mb-6">
                {/* Success Icon - smaller on mobile */}
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-20 md:h-20 rounded-full bg-green-100 dark:bg-emerald-500/10 md:mb-6 dark:ring-1 dark:ring-emerald-500/30 dark:shadow-lg dark:shadow-emerald-500/20 flex-shrink-0">
                  <CheckCircle className="w-7 h-7 md:w-12 md:h-12 text-green-600 dark:text-emerald-400" />
                </div>
                
                <h1 className={`text-xl md:text-4xl font-bold text-gray-900 dark:text-white transition-all duration-500 ${statusJustChanged ? 'scale-110' : ''}`}>
                  {request?.status === 'playing' 
                    ? '🎶 Playing Now!' 
                    : request?.status === 'played'
                      ? '🎵 Song Played!' 
                      : 'Thank You!'}
                </h1>
              </div>
              
              <p className="text-sm md:text-lg text-gray-600 dark:text-neutral-400 mb-4 md:mb-8">
                {request?.status === 'playing'
                  ? 'Your song is playing right now! Enjoy!'
                  : request?.status === 'played'
                    ? 'Your song has been played. Thanks for making the party great!'
                    : 'Payment successful! Your request has been submitted.'
                }
              </p>

              {request && (
                <div className="bg-purple-50 dark:bg-neutral-900/80 dark:border dark:border-neutral-800 rounded-xl p-3 md:p-6 mb-4 md:mb-8 text-left dark:backdrop-blur-sm">
                  <div className="flex items-center gap-3 md:gap-5">
                    {/* Album Art or Icon */}
                    {request.request_type === 'song_request' && albumArt ? (
                      <div className={`relative flex-shrink-0 ${request.status === 'playing' ? 'animate-pulse' : ''}`}>
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-lg md:rounded-xl overflow-hidden shadow-lg ring-2 ring-purple-300 dark:ring-purple-500/50 dark:shadow-xl dark:shadow-purple-500/20">
                          <img 
                            src={albumArt} 
                            alt={`${request.song_title} album art`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {request.status === 'playing' && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 md:p-1.5 shadow-lg shadow-emerald-500/50">
                            <Radio className="w-3 h-3 md:w-4 md:h-4 text-white animate-pulse" />
                          </div>
                        )}
                        {request.status === 'played' && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 md:p-1.5 shadow-lg shadow-emerald-500/50">
                            <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ) : request.request_type === 'song_request' ? (
                      <div className="w-16 h-16 md:w-28 md:h-28 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-500 dark:to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-lg dark:shadow-xl dark:shadow-purple-500/30">
                        <Disc3 className="w-8 h-8 md:w-14 md:h-14 text-white/90" />
                      </div>
                    ) : (
                      <Mic className="w-8 h-8 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {request.is_fast_track && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-amber-500/20 text-orange-700 dark:text-amber-400 text-[10px] md:text-xs font-semibold dark:ring-1 dark:ring-amber-500/30">
                            <Zap className="w-2.5 h-2.5 md:w-3 md:h-3" />
                            Fast
                          </span>
                        )}
                      </div>
                      
                      {request.request_type === 'song_request' ? (
                        <div>
                          <p className="text-base md:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                            {request.song_title}
                          </p>
                          {request.song_artist && (
                            <p className="text-sm md:text-base text-gray-600 dark:text-neutral-400 truncate">
                              {request.song_artist}
                            </p>
                          )}
                          
                          {/* Live Status Display - Compact on mobile */}
                          <div className={`mt-2 md:mt-4 pt-2 md:pt-4 border-t border-purple-200 dark:border-neutral-700/50 transition-all duration-500 ${statusJustChanged ? 'animate-pulse' : ''}`}>
                            {request.status === 'playing' ? (
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs md:text-sm font-bold">Playing Now!</span>
                                {request.played_at && (
                                  <span className="text-[10px] md:text-xs text-emerald-500 dark:text-emerald-400/70">
                                    • Started {new Date(request.played_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                )}
                              </div>
                            ) : request.status === 'played' || request.played_at ? (
                              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs md:text-sm font-semibold">Played</span>
                                {request.played_at && (
                                  <span className="text-[10px] md:text-xs text-emerald-500">
                                    • {new Date(request.played_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                )}
                              </div>
                            ) : request.is_fast_track ? (
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <Zap className="w-4 h-4" />
                                <span className="text-xs md:text-sm font-semibold">Fast-Track • Coming up soon!</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs md:text-sm">In Queue</span>
                                <span className="relative flex h-2 w-2 ml-1">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] md:text-xs text-neutral-500">Live</span>
                              </div>
                            )}
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
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 md:mt-4 text-[11px] md:text-sm text-gray-500 dark:text-gray-500">
                        <span>{request.requester_name}</span>
                        <span>•</span>
                        <span>${((request.amount_paid || request.amount_requested) / 100).toFixed(2)}</span>
                        {request.is_fast_track && request.fast_track_fee > 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
                            (+${(request.fast_track_fee / 100).toFixed(2)} fast-track)
                          </span>
                        )}
                      </div>
                      
                      {/* Bundled Songs Display - Compact on mobile */}
                      {bundledSongs.length > 0 && (
                        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-purple-200 dark:border-neutral-700/50">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Gift className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                              +{bundledSongs.length} more in bundle
                            </h4>
                          </div>
                          <div className="space-y-1.5 md:space-y-2.5">
                            {bundledSongs.map((song, index) => (
                              <div 
                                key={song.id} 
                                className={`rounded-lg px-2 py-2 md:px-3 md:py-3 border transition-all ${
                                  song.status === 'playing' 
                                    ? 'border-emerald-500/40 bg-emerald-500/10' 
                                    : song.status === 'played'
                                      ? 'border-emerald-500/30 bg-emerald-500/5'
                                      : 'border-neutral-700/50 bg-neutral-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-2 md:gap-3">
                                  {/* Album Art for bundled song - smaller on mobile */}
                                  {bundleAlbumArts[song.id] ? (
                                    <div className={`relative flex-shrink-0 ${song.status === 'playing' ? 'animate-pulse' : ''}`}>
                                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg overflow-hidden ring-1 ring-purple-500/30">
                                        <img 
                                          src={bundleAlbumArts[song.id]} 
                                          alt={`${song.song_title} album art`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                      {song.status === 'playing' && (
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-0.5">
                                          <Radio className="w-2 h-2 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-md md:rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                                      <Disc3 className="w-5 h-5 md:w-7 md:h-7 text-white/90" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-semibold text-white truncate">
                                      {song.song_title || 'Song title pending'}
                                    </p>
                                    {song.song_artist && (
                                      <p className="text-[10px] md:text-xs text-neutral-400 truncate">
                                        {song.song_artist}
                                      </p>
                                    )}
                                  </div>
                                  {/* Status indicator with played time */}
                                  <div className="flex-shrink-0 flex items-center gap-1.5">
                                    {song.status === 'playing' ? (
                                      <>
                                        <span className="relative flex h-2 w-2">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] text-emerald-400 font-medium">Playing</span>
                                      </>
                                    ) : song.status === 'played' ? (
                                      <>
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                        {song.played_at && (
                                          <span className="text-[10px] text-emerald-400/80">
                                            {new Date(song.played_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-neutral-500" />
                                        <span className="text-[10px] text-neutral-500">Queued</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status-based messaging - Hidden on mobile, shown on desktop */}
              <div className="hidden md:block">
                {request?.status === 'playing' ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <strong>🎶 On the decks!</strong> Your song is playing right now. Get on the dance floor and enjoy!
                    </p>
                  </div>
                ) : request?.status === 'played' ? (
                  <div className="bg-green-50 dark:bg-emerald-500/10 border border-green-200 dark:border-emerald-500/30 rounded-lg p-4 mb-8">
                    <p className="text-sm text-green-800 dark:text-emerald-200">
                      <strong className="dark:text-emerald-300">✅ Request Complete!</strong> Your song has been played. Thanks for making the party great! Want to request another?
                    </p>
                  </div>
                ) : request?.is_fast_track ? (
                  <div className="bg-orange-50 dark:bg-amber-500/10 border border-orange-200 dark:border-amber-500/30 rounded-lg p-4 mb-8">
                    <p className="text-sm text-orange-800 dark:text-amber-200">
                      <strong className="dark:text-amber-300">⚡ Fast-Track Confirmed!</strong> Your song request has priority placement in the queue. The DJ will receive your request and will play it as soon as possible.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700/50 rounded-lg p-4 mb-8">
                    <p className="text-sm text-gray-700 dark:text-neutral-300">
                      <strong className="text-gray-900 dark:text-white">What&apos;s next?</strong> The DJ will receive your request and will do their best to fulfill it during the event. This page updates automatically when your song plays!
                    </p>
                  </div>
                )}
              </div>

              {/* Bundle Messaging - Desktop only */}
              {userRequestCount > 1 && request?.request_type === 'song_request' && (
                <div className="hidden md:block bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
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

              {/* Time-Sensitive Messaging - Desktop only */}
              <div className="hidden md:block">
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
              </div>

              {/* Receipt Section - Desktop only */}
              {request?.requester_email && (
                <div className="hidden md:block bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
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

              {/* Desktop CTA Button */}
              {request?.event_qr_code && (
                <div className="hidden md:block">
                  <Link
                    href={request.event_qr_code.startsWith('general') ? '/requests' : `/crowd-request/${request.event_qr_code}`}
                    className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-300 text-black font-bold text-lg rounded-xl shadow-lg hover:shadow-xl shadow-amber-500/30 hover:shadow-amber-400/50 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <Music className="w-6 h-6" />
                    Request Another Song
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
        
        {/* Sticky Mobile CTA */}
        {request?.event_qr_code && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur-lg border-t border-neutral-800 safe-area-pb">
            <Link
              href={request.event_qr_code.startsWith('general') ? '/requests' : `/crowd-request/${request.event_qr_code}`}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-bold text-base rounded-xl shadow-lg shadow-amber-500/30"
            >
              <Music className="w-5 h-5" />
              Request Another Song
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

