import { useState, useEffect, useRef } from 'react';
import { Music, Clock, TrendingUp, Users, AlertCircle, Loader2, Trophy, Eye, Zap, Flame } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import confetti from 'canvas-confetti';

export default function BiddingInterface({ 
  organizationId, 
  requestId, 
  requestType,
  songTitle,
  songArtist,
  recipientName,
  recipientMessage
}) {
  const supabase = createClientComponentClient();
  const [biddingRound, setBiddingRound] = useState(null);
  const [requests, setRequests] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [bidderEmail, setBidderEmail] = useState('');
  const [bidderPhone, setBidderPhone] = useState('');
  const [placingBid, setPlacingBid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentElement, setPaymentElement] = useState(null);
  const [stripe, setStripe] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [viewersCount, setViewersCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const intervalRef = useRef(null);
  const prevRoundRef = useRef(null);
  const confettiTriggeredRef = useRef(false);
  const lastWinningBidRef = useRef(0);
  
  // Generate dummy bid data for urgency
  const generateDummyBids = (baseAmount = 0) => {
    const dummyNames = ['Sarah M.', 'Mike T.', 'Jessica L.', 'David K.', 'Emily R.', 'Chris B.', 'Amanda S.', 'Ryan P.'];
    const bids = [];
    const minBid = Math.max(baseAmount, 500); // $5 minimum
    
    // Generate 2-4 dummy bids
    const numBids = 2 + Math.floor(Math.random() * 3);
    let currentBid = minBid;
    
    for (let i = 0; i < numBids; i++) {
      const increment = 100 + Math.floor(Math.random() * 400); // $1-$5 increments
      currentBid += increment;
      const timeAgo = Math.floor(Math.random() * 180); // 0-3 minutes ago
      
      bids.push({
        id: `dummy-${i}`,
        bid_amount: currentBid,
        bidder_name: dummyNames[Math.floor(Math.random() * dummyNames.length)],
        created_at: new Date(Date.now() - timeAgo * 1000).toISOString(),
        is_dummy: true
      });
    }
    
    return bids.sort((a, b) => b.bid_amount - a.bid_amount);
  };
  
  // Generate fake viewer count
  useEffect(() => {
    if (!biddingRound?.active) return;
    
    // Start with a random number between 8-25
    const baseCount = 8 + Math.floor(Math.random() * 18);
    setViewersCount(baseCount);
    
    // Simulate viewers joining/leaving
    const viewerInterval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(5, Math.min(35, prev + change));
      });
    }, 3000 + Math.random() * 2000); // Every 3-5 seconds
    
    return () => clearInterval(viewerInterval);
  }, [biddingRound?.active]);
  
  // Generate fake recent activity
  useEffect(() => {
    if (!biddingRound?.active) return;
    
    const activities = [
      'Someone just placed a bid!',
      'New bidder joined the round',
      'Bid increased by $2.00',
      'Active bidding happening now',
      'Multiple bidders competing'
    ];
    
    const activityInterval = setInterval(() => {
      const activity = activities[Math.floor(Math.random() * activities.length)];
      const timestamp = new Date();
      
      setRecentActivity(prev => {
        const newActivity = { id: Date.now(), text: activity, time: timestamp };
        return [newActivity, ...prev].slice(0, 3); // Keep last 3
      });
    }, 8000 + Math.random() * 7000); // Every 8-15 seconds
    
    return () => clearInterval(activityInterval);
  }, [biddingRound?.active]);

  // Load current bidding round
  useEffect(() => {
    if (!organizationId) return;
    loadCurrentRound();
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`bidding-round-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bidding_rounds',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          loadCurrentRound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bid_history'
        },
        () => {
          loadCurrentRound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crowd_requests',
          filter: `bidding_round_id=eq.${biddingRound?.id || ''}`
        },
        () => {
          loadCurrentRound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [organizationId, biddingRound?.id]);

  // Update countdown timer
  useEffect(() => {
    if (!biddingRound || !biddingRound.active) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const endsAt = new Date(biddingRound.round.endsAt);
      const remaining = Math.max(0, Math.floor((endsAt - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        // Round ended, reload
        setTimeout(() => loadCurrentRound(), 2000);
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [biddingRound]);

  // Find current request in the round
  useEffect(() => {
    if (requestId && requests.length > 0) {
      const req = requests.find(r => r.id === requestId);
      setCurrentRequest(req);
      
      // Set minimum bid amount
      if (req) {
        const minBid = Math.max(
          (req.current_bid_amount || 0) + 100, // $1 increment
          500 // $5 minimum
        );
        setBidAmount((minBid / 100).toFixed(2));
      }
    }
  }, [requestId, requests]);

  const triggerConfetti = (options = {}) => {
    const { small = false } = options;
    
    if (small) {
      // Small burst for becoming winning bidder
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#ec4899', '#fbbf24']
      });
    } else {
      // Big celebration for winning the round
      const duration = 3000;
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
        
        // Launch from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        
        // Launch from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Final big burst
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#ec4899', '#fbbf24', '#10b981', '#3b82f6']
        });
      }, 500);
    }
  };

  const loadCurrentRound = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
      const data = await response.json();
      
      // Check if round just ended and this request won
      if (prevRoundRef.current?.active && !data.active && requestId) {
        // Round ended - check if this request was the winner
        const previousRequests = prevRoundRef.current.requests || [];
        if (previousRequests.length > 0) {
          const maxBid = Math.max(...previousRequests.map(r => r.current_bid_amount || 0));
          const wasWinner = previousRequests.some(
            req => req.id === requestId && req.current_bid_amount === maxBid && maxBid > 0
          );
          
          if (wasWinner && !confettiTriggeredRef.current) {
            triggerConfetti(); // Big celebration!
            confettiTriggeredRef.current = true;
          }
        }
      }
      
      if (data.active && data.round) {
        // Enhance requests with dummy bids if needed
        const enhancedRequests = (data.requests || []).map(req => {
          // If no bids or very low bid, add dummy bids
          if (!req.recentBids || req.recentBids.length === 0 || (req.current_bid_amount || 0) < 1000) {
            const dummyBids = generateDummyBids(req.current_bid_amount || 0);
            // Merge dummy bids with real ones, but mark them
            return {
              ...req,
              recentBids: [...(req.recentBids || []), ...dummyBids].sort((a, b) => {
                const timeA = new Date(a.created_at || 0).getTime();
                const timeB = new Date(b.created_at || 0).getTime();
                return timeB - timeA;
              }).slice(0, 5),
              current_bid_amount: Math.max(
                req.current_bid_amount || 0,
                dummyBids[0]?.bid_amount || req.current_bid_amount || 0
              ),
              highest_bidder_name: req.highest_bidder_name || dummyBids[0]?.bidder_name || null
            };
          }
          return req;
        });
        
        setBiddingRound(data);
        setRequests(enhancedRequests);
        setTimeRemaining(data.round.timeRemaining);
        prevRoundRef.current = data;
      } else {
        setBiddingRound({ active: false });
        setRequests([]);
        prevRoundRef.current = data;
      }
    } catch (err) {
      console.error('Error loading bidding round:', err);
      setError('Failed to load bidding round');
    } finally {
      setLoading(false);
    }
  };

  // Check if current request becomes the winning bid (small confetti)
  useEffect(() => {
    if (biddingRound?.active && currentRequest && requests.length > 0) {
      const maxBid = Math.max(...requests.map(r => r.current_bid_amount || 0));
      const isWinning = currentRequest.current_bid_amount === maxBid && maxBid > 0;
      
      // Check if this is a new win (bid amount increased and is now highest)
      if (isWinning && currentRequest.current_bid_amount > lastWinningBidRef.current) {
        // New winning bid - small confetti burst
        triggerConfetti({ small: true });
        lastWinningBidRef.current = currentRequest.current_bid_amount;
      }
    }
  }, [currentRequest?.current_bid_amount, requests, biddingRound?.active]);

  // Check if this request won a completed round
  useEffect(() => {
    if (!requestId || !organizationId) return;

    const checkWinner = async () => {
      try {
        const { data: completedRound } = await supabase
          .from('bidding_rounds')
          .select('*, winning_request:crowd_requests!bidding_rounds_winning_request_id_fkey(id, song_title, song_artist, current_bid_amount)')
          .eq('organization_id', organizationId)
          .eq('status', 'completed')
          .eq('winning_request_id', requestId)
          .order('processed_at', { ascending: false })
          .limit(1)
          .single();

        if (completedRound && !confettiTriggeredRef.current) {
          setWinnerInfo(completedRound);
          setShowWinner(true);
          triggerConfetti(); // Big celebration for winning!
          confettiTriggeredRef.current = true;
        }
      } catch (err) {
        // Not a winner or error checking - ignore
      }
    };
    
    // Only check if there's no active round
    if (!biddingRound?.active) {
      checkWinner();
    }
  }, [requestId, organizationId, biddingRound?.active, supabase]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!biddingRound?.active || !biddingRound?.round) {
      setError('No active bidding round');
      return;
    }

    if (!currentRequest) {
      setError('Request not found in bidding round');
      return;
    }

    const bidAmountCents = Math.round(parseFloat(bidAmount) * 100);
    const minBid = Math.max(
      (currentRequest.current_bid_amount || 0) + 100,
      500
    );

    if (bidAmountCents < minBid) {
      setError(`Minimum bid is $${(minBid / 100).toFixed(2)}`);
      return;
    }

    if (!bidderName.trim()) {
      setError('Please enter your name');
      return;
    }

    setPlacingBid(true);

    try {
      const response = await fetch('/api/bidding/place-bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: requestId,
          biddingRoundId: biddingRound.round.id,
          bidAmount: bidAmountCents,
          bidderName: bidderName.trim(),
          bidderEmail: bidderEmail.trim() || null,
          bidderPhone: bidderPhone.trim() || null,
          organizationId: organizationId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      setSuccess(`Bid placed! You're now the highest bidder at $${(bidAmountCents / 100).toFixed(2)}`);
      setBidAmount('');
      
      // Reload round data
      setTimeout(() => {
        loadCurrentRound();
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  // Show winner celebration if this request won
  if (showWinner && winnerInfo) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 rounded-lg p-6 text-white text-center relative overflow-hidden">
          {/* Confetti overlay effect */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="relative z-10">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-300" />
            <h2 className="text-3xl font-bold mb-2">🎉 YOU WON! 🎉</h2>
            <p className="text-xl mb-4">Your request won the bidding round!</p>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 inline-block">
              <p className="text-2xl font-bold">
                ${((winnerInfo.winning_bid_amount || 0) / 100).toFixed(2)}
              </p>
              <p className="text-sm opacity-90">Winning Bid</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your request will be played soon! Thank you for participating.
          </p>
        </div>
      </div>
    );
  }

  if (!biddingRound || !biddingRound.active) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertCircle className="w-5 h-5" />
          <p className="font-semibold">No active bidding round</p>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
          Check back soon for the next bidding round!
        </p>
      </div>
    );
  }

  const minBid = currentRequest 
    ? Math.max((currentRequest.current_bid_amount || 0) + 100, 500)
    : 500;

  // Sort requests by current bid amount (highest first)
  const sortedRequests = [...requests].sort((a, b) => {
    const bidA = a.current_bid_amount || 0;
    const bidB = b.current_bid_amount || 0;
    if (bidB !== bidA) return bidB - bidA; // Higher bid first
    return new Date(a.created_at) - new Date(b.created_at); // Earlier request first if tie
  });

  return (
    <div className="space-y-4">
      {/* Round Info */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            <h3 className="font-bold text-lg">Bidding Round #{biddingRound.round.roundNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg font-bold">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        <p className="text-sm opacity-90">
          Highest bidder wins every 30 minutes!
        </p>
      </div>

      {/* Live Ticker - Shows all requests with current bids */}
      {sortedRequests.length > 0 && (
        <div className="bg-black/90 dark:bg-gray-900 rounded-lg border-2 border-purple-500/50 overflow-hidden">
          <div className="px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Live Bidding Ticker</h4>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <div className="divide-y divide-gray-800">
              {sortedRequests.map((req, idx) => {
                const isWinning = idx === 0 && (req.current_bid_amount || 0) > 0;
                const songName = req.song_title 
                  ? `${req.song_title}${req.song_artist ? ` by ${req.song_artist}` : ''}`
                  : req.recipient_name 
                    ? `Shoutout for ${req.recipient_name}`
                    : 'Request';
                
                return (
                  <div
                    key={req.id}
                    className={`px-4 py-3 transition-colors ${
                      isWinning
                        ? 'bg-purple-600/20 border-l-4 border-purple-400'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isWinning && (
                            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded">
                              🏆 WINNING
                            </span>
                          )}
                          <span className="text-sm font-semibold text-white truncate">
                            {songName}
                          </span>
                        </div>
                        {req.highest_bidder_name && (
                          <p className="text-xs text-gray-400">
                            Bid by: {req.highest_bidder_name}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-lg font-bold ${
                          isWinning ? 'text-purple-300' : 'text-white'
                        }`}>
                          ${((req.current_bid_amount || 0) / 100).toFixed(2)}
                        </div>
                        {req.current_bid_amount === 0 && (
                          <div className="text-xs text-gray-500">No bids yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {sortedRequests.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No requests in this round yet
            </div>
          )}
        </div>
      )}

      {/* Current Request Info */}
      {currentRequest && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {requestType === 'song_request' 
                  ? `${songTitle}${songArtist ? ` by ${songArtist}` : ''}`
                  : `Shoutout for ${recipientName}`
                }
              </h4>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${((currentRequest.current_bid_amount || 0) / 100).toFixed(2)}
              </div>
              {currentRequest.highest_bidder_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  by {currentRequest.highest_bidder_name}
                </div>
              )}
            </div>
          </div>

          {/* Recent Bids */}
          {currentRequest.recentBids && currentRequest.recentBids.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recent Bids</p>
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                  {currentRequest.recentBids.length} {currentRequest.recentBids.length === 1 ? 'bid' : 'bids'}
                </span>
              </div>
              <div className="space-y-1">
                {currentRequest.recentBids.slice(0, 5).map((bid, idx) => {
                  const isRecent = !bid.is_dummy && new Date(bid.created_at) > new Date(Date.now() - 60000);
                  return (
                    <div 
                      key={bid.id || idx} 
                      className={`flex items-center justify-between text-sm ${
                        isRecent ? 'bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-300">{bid.bidder_name}</span>
                        {isRecent && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-semibold animate-pulse">
                            Just now
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${(bid.bid_amount / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Bid Form */}
      <form onSubmit={handlePlaceBid} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Place Your Bid
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bid Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min={minBid / 100}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder={(minBid / 100).toFixed(2)}
              required
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Minimum bid: ${(minBid / 100).toFixed(2)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={bidderName}
            onChange={(e) => setBidderName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            value={bidderEmail}
            onChange={(e) => setBidderEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone (optional)
          </label>
          <input
            type="tel"
            value={bidderPhone}
            onChange={(e) => setBidderPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <button
          type="submit"
          disabled={placingBid || timeRemaining === 0}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {placingBid ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing Bid...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Place Bid
            </>
          )}
        </button>

        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your payment will be authorized but only charged if you win. If you&apos;re outbid, the authorization will be released.
          </p>
          {timeRemaining < 600 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-center">
              <p className="text-xs font-semibold text-red-800 dark:text-red-200 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Less than {Math.floor(timeRemaining / 60)} minutes left! Bid now!
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

