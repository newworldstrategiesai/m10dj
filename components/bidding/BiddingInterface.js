import { useState, useEffect, useRef, useMemo } from 'react';
import { Music, Clock, TrendingUp, Users, AlertCircle, Loader2, Trophy, Eye, Zap, Flame } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import confetti from 'canvas-confetti';
import { useSongExtraction } from '../../hooks/useSongExtraction';
import { CROWD_REQUEST_CONSTANTS } from '../../constants/crowd-request';

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
  const [bidAmountType, setBidAmountType] = useState('preset'); // 'preset' or 'custom'
  const [selectedPresetBid, setSelectedPresetBid] = useState(null);
  const [customBidAmount, setCustomBidAmount] = useState('');
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
  const [bidFeed, setBidFeed] = useState([]); // Live feed of bids
  const [allBidsList, setAllBidsList] = useState([]); // All bids (real + dummy) for live list
  const [retryCount, setRetryCount] = useState(0); // For auto-creating rounds
  const intervalRef = useRef(null);
  const prevRoundRef = useRef(null);
  const confettiTriggeredRef = useRef(false);
  const lastWinningBidRef = useRef(0);
  const bidFeedIntervalRef = useRef(null);
  
  // Song extraction state (reused from requests page)
  const [songUrl, setSongUrl] = useState('');
  const [extractedSongUrl, setExtractedSongUrl] = useState('');
  const [isExtractedFromLink, setIsExtractedFromLink] = useState(false);
  const [showLinkField, setShowLinkField] = useState(true);
  const [songFormData, setSongFormData] = useState({
    songTitle: '',
    songArtist: ''
  });
  const songTitleInputRef = useRef(null);
  
  // Use song extraction hook
  const { extractingSong, extractionError, extractSongInfo: extractSongInfoHook } = useSongExtraction();
  
  // Generate dummy bid data for urgency
  // Primarily round whole numbers ($10, $15, $20, etc.) with occasional $1 increments
  const generateDummyBids = (baseAmount = 0) => {
    const dummyNames = ['Sarah M.', 'Mike T.', 'Jessica L.', 'David K.', 'Emily R.', 'Chris B.', 'Amanda S.', 'Ryan P.'];
    const bids = [];
    const minBid = Math.max(baseAmount, 500); // $5 minimum
    
    // Generate 2-4 dummy bids
    const numBids = 2 + Math.floor(Math.random() * 3);
    let currentBid = minBid;
    
    for (let i = 0; i < numBids; i++) {
      // 80% chance of round number increment ($5, $10, $15, $20, $25, $30)
      // 20% chance of $1 increment for urgency
      const useRoundNumber = Math.random() > 0.2;
      
      let increment;
      if (useRoundNumber) {
        // Round number increments: $5, $10, $15, $20, $25
        const roundIncrements = [500, 1000, 1500, 2000, 2500];
        increment = roundIncrements[Math.floor(Math.random() * roundIncrements.length)];
      } else {
        // $1 increment for urgency
        increment = 100;
      }
      
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

  // Update allBidsList when requests change (for real-time updates)
  useEffect(() => {
    if (!biddingRound?.active || !requests || requests.length === 0) {
      setAllBidsList([]);
      return;
    }

    // Aggregate all bids from all requests for live list
    const allBids = [];
    requests.forEach(req => {
      if (req.recentBids && req.recentBids.length > 0) {
        req.recentBids.forEach(bid => {
          allBids.push({
            ...bid,
            song_title: req.song_title,
            song_artist: req.song_artist,
            request_id: req.id
          });
        });
      }
    });
    
    // Sort by bid amount ascending (lowest to highest) to show bidding progression
    // This makes sense for a bidding war - you see the progression from low to high
    allBids.sort((a, b) => {
      const amountA = a.bid_amount || 0;
      const amountB = b.bid_amount || 0;
      if (amountA !== amountB) {
        return amountA - amountB; // Lowest to highest
      }
      // If same amount, sort by time (earliest first)
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeA - timeB;
    });
    
    setAllBidsList(allBids);
  }, [requests, biddingRound?.active]);

  // Generate fake bid feed for urgency - only when there are no real bids
  useEffect(() => {
    if (!biddingRound?.active) {
      setBidFeed([]);
      if (bidFeedIntervalRef.current) {
        clearInterval(bidFeedIntervalRef.current);
      }
      return;
    }

    // Check if there are any real bids in the round
    const hasRealBids = requests.some(req => {
      const hasRealBidsOnRequest = req.recentBids && req.recentBids.some(bid => !bid.is_dummy && !bid.is_fake);
      return hasRealBidsOnRequest || (req.current_bid_amount && req.current_bid_amount > 0 && !req.is_fake);
    });

    // Only show fake feed if there are NO real bids
    if (hasRealBids) {
      setBidFeed([]);
      if (bidFeedIntervalRef.current) {
        clearInterval(bidFeedIntervalRef.current);
      }
      return;
    }

    const fakeNames = [
      'Sarah M.', 'Mike T.', 'Jessica L.', 'David K.', 'Emily R.', 
      'Chris B.', 'Amanda S.', 'Ryan P.', 'Nicole W.', 'James H.',
      'Lisa F.', 'Tom D.', 'Maria G.', 'Alex J.', 'Rachel N.'
    ];
    
    // Use requests from the round (includes fake ones)
    const songTitles = requests.map(r => 
      r.song_title ? `${r.song_title}${r.song_artist ? ` by ${r.song_artist}` : ''}` : 'A song'
    ).filter(Boolean);

    // If no songs yet, use popular songs as fallback
    const fallbackSongs = [
      'Uptown Funk by Bruno Mars',
      'Blinding Lights by The Weeknd',
      'Watermelon Sugar by Harry Styles',
      'Levitating by Dua Lipa',
      'Good 4 U by Olivia Rodrigo',
      'Stay by The Kid LAROI & Justin Bieber',
      'Heat Waves by Glass Animals',
      'As It Was by Harry Styles'
    ];
    
    const availableSongs = songTitles.length > 0 ? songTitles : fallbackSongs;

    // Generate initial feed items
    const generateFeedItem = () => {
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const songTitle = availableSongs[Math.floor(Math.random() * availableSongs.length)] || 'A song';
      
      // Primarily round numbers with occasional $1 increments
      const useRoundNumber = Math.random() > 0.2;
      let bidAmount;
      
      if (useRoundNumber) {
        // Round numbers: $5, $10, $15, $20, $25
        const roundAmounts = [500, 1000, 1500, 2000, 2500];
        bidAmount = roundAmounts[Math.floor(Math.random() * roundAmounts.length)];
      } else {
        // $1 increment: $6, $11, $16, $21, $26 (round + $1)
        const baseRoundAmounts = [500, 1000, 1500, 2000, 2500];
        const baseAmount = baseRoundAmounts[Math.floor(Math.random() * baseRoundAmounts.length)];
        bidAmount = baseAmount + 100; // Add $1
      }
      
      const timeAgo = Math.floor(Math.random() * 120); // 0-2 minutes ago
      
      return {
        id: Date.now() + Math.random(),
        name,
        songTitle,
        bidAmount,
        timeAgo,
        timestamp: new Date(Date.now() - timeAgo * 1000)
      };
    };

    // Start with 5-8 feed items for more urgency
    const initialFeed = Array.from({ length: 5 + Math.floor(Math.random() * 4) }, generateFeedItem);
    setBidFeed(initialFeed);

    // Add new feed items more frequently for urgency
    bidFeedIntervalRef.current = setInterval(() => {
      const newItem = generateFeedItem();
      setBidFeed(prev => {
        // Add new item at the top, keep last 10 items
        return [newItem, ...prev].slice(0, 10);
      });
    }, 3000 + Math.random() * 4000); // Every 3-7 seconds (more frequent)

    return () => {
      if (bidFeedIntervalRef.current) {
        clearInterval(bidFeedIntervalRef.current);
      }
    };
  }, [biddingRound?.active, requests]);

  // Update time ago for feed items
  useEffect(() => {
    if (bidFeed.length === 0) return;

    const updateInterval = setInterval(() => {
      setBidFeed(prev => prev.map(item => ({
        ...item,
        timeAgo: Math.floor((Date.now() - item.timestamp.getTime()) / 1000)
      })));
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [bidFeed.length]);

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

    // Also set up polling as a fallback (every 3 seconds)
    const pollInterval = setInterval(() => {
      loadCurrentRound();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
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

  // Generate fake song requests for urgency
  const generateFakeSongRequests = (count = 5) => {
    const popularSongs = [
      { title: 'Uptown Funk', artist: 'Bruno Mars' },
      { title: 'Blinding Lights', artist: 'The Weeknd' },
      { title: 'Watermelon Sugar', artist: 'Harry Styles' },
      { title: 'Levitating', artist: 'Dua Lipa' },
      { title: 'Good 4 U', artist: 'Olivia Rodrigo' },
      { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber' },
      { title: 'Heat Waves', artist: 'Glass Animals' },
      { title: 'As It Was', artist: 'Harry Styles' },
      { title: 'About Damn Time', artist: 'Lizzo' },
      { title: 'First Class', artist: 'Jack Harlow' },
      { title: 'Flowers', artist: 'Miley Cyrus' },
      { title: 'Anti-Hero', artist: 'Taylor Swift' },
      { title: 'Unholy', artist: 'Sam Smith & Kim Petras' },
      { title: 'Bad Habit', artist: 'Steve Lacy' },
      { title: 'I\'m Good (Blue)', artist: 'David Guetta & Bebe Rexha' },
      { title: 'Calm Down', artist: 'Rema & Selena Gomez' },
      { title: 'Creepin\'', artist: 'Metro Boomin, The Weeknd & 21 Savage' },
      { title: 'Kill Bill', artist: 'SZA' },
      { title: 'Shivers', artist: 'Ed Sheeran' },
      { title: 'Don\'t Start Now', artist: 'Dua Lipa' }
    ];

    const fakeNames = ['Sarah M.', 'Mike T.', 'Jessica L.', 'David K.', 'Emily R.', 'Chris B.', 'Amanda S.', 'Ryan P.', 'Nicole W.', 'James H.'];

    const fakeRequests = [];
    const usedSongs = new Set();
    
    for (let i = 0; i < count; i++) {
      let song;
      let attempts = 0;
      do {
        song = popularSongs[Math.floor(Math.random() * popularSongs.length)];
        attempts++;
      } while (usedSongs.has(`${song.title}-${song.artist}`) && attempts < 20);
      
      usedSongs.add(`${song.title}-${song.artist}`);
      
      // Generate fake bid amount - primarily round numbers ($10, $15, $20, etc.)
      // 80% chance of round number, 20% chance of $1 increment
      const useRoundNumber = Math.random() > 0.2;
      let bidAmount;
      
      if (useRoundNumber) {
        // Round numbers: $10, $15, $20, $25, $30, $35, $40, $45, $50
        const roundAmounts = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000];
        bidAmount = roundAmounts[Math.floor(Math.random() * roundAmounts.length)];
      } else {
        // $1 increment: $11, $16, $21, $26, $31, etc. (round number + $1)
        const baseRoundAmounts = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500];
        const baseAmount = baseRoundAmounts[Math.floor(Math.random() * baseRoundAmounts.length)];
        bidAmount = baseAmount + 100; // Add $1
      }
      
      const bidderName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const timeAgo = Math.floor(Math.random() * 600); // 0-10 minutes ago
      
      fakeRequests.push({
        id: `fake-request-${Date.now()}-${i}`,
        song_title: song.title,
        song_artist: song.artist,
        request_type: 'song_request',
        current_bid_amount: bidAmount,
        highest_bidder_name: bidderName,
        created_at: new Date(Date.now() - timeAgo * 1000).toISOString(),
        bidding_round_id: biddingRound?.round?.id || null,
        is_fake: true,
        recentBids: [{
          id: `fake-bid-${i}`,
          bid_amount: bidAmount,
          bidder_name: bidderName,
          created_at: new Date(Date.now() - timeAgo * 1000).toISOString(),
          is_dummy: true
        }]
      });
    }
    
    return fakeRequests.sort((a, b) => b.current_bid_amount - a.current_bid_amount);
  };

  const loadCurrentRound = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
      
      if (!response.ok) {
        console.error('Failed to fetch current round:', response.status, response.statusText);
        setError('Failed to load bidding round. Retrying...');
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error('API error:', data.error);
        setError(data.error);
        setLoading(false);
        return;
      }
      
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
        // Only enhance requests with dummy bids if they have NO real bids
        let enhancedRequests = (data.requests || []).map(req => {
          // Only add dummy bids if there are NO real bids at all
          const hasRealBids = req.recentBids && req.recentBids.length > 0 && req.recentBids.some(bid => !bid.is_dummy);
          if (!hasRealBids && (!req.recentBids || req.recentBids.length === 0)) {
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

        // Only add fake song requests if there are NO real requests
        const realRequestCount = enhancedRequests.filter(r => !r.is_fake).length;
        
        if (realRequestCount === 0) {
          // No real requests - add fake ones to create urgency
          const fakeRequests = generateFakeSongRequests(5 + Math.floor(Math.random() * 3)); // 5-7 fake requests
          enhancedRequests = fakeRequests.sort((a, b) => (b.current_bid_amount || 0) - (a.current_bid_amount || 0));
        }
        
        setBiddingRound(data);
        setRequests(enhancedRequests);
        setTimeRemaining(data.round.timeRemaining);
        prevRoundRef.current = data;
        setLoading(false); // Only set loading to false when we have an active round
      } else {
        // No active round - API should create one, but if it didn't, we'll keep polling
        setBiddingRound({ active: false });
        setRequests([]);
        prevRoundRef.current = data;
        // Keep loading state true so we continue showing "Starting bidding round..." and keep polling
      }
    } catch (err) {
      console.error('Error loading bidding round:', err);
      setError('Failed to load bidding round. Retrying...');
      // Keep loading state true so we continue polling
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

  // Continuous polling if no active round (API will create one)
  // This ensures we never get stuck in "Starting bidding round..." state
  useEffect(() => {
    if (!organizationId) return;
    
    // If we have an active round, stop polling and reset retry count
    if (biddingRound?.active) {
      setRetryCount(0);
      return;
    }
    
    // If no active round, poll continuously until one is found
    const pollInterval = setInterval(() => {
      loadCurrentRound();
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(pollInterval);
  }, [organizationId, biddingRound?.active]);

  // Sort requests by current bid amount (highest first) - memoized for reactivity
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      const bidA = a.current_bid_amount || 0;
      const bidB = b.current_bid_amount || 0;
      if (bidB !== bidA) return bidB - bidA; // Higher bid first
      return new Date(a.created_at) - new Date(b.created_at); // Earlier request first if tie
    });
  }, [requests]);

  // Calculate current winning bid - memoized and reactive
  const currentWinningBidAmount = useMemo(() => {
    if (requests.length === 0) return 0;
    const winningBid = Math.max(...requests.map(r => r.current_bid_amount || 0));
    // Debug log to verify updates
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[BiddingInterface] Current winning bid updated:', {
        winningBid: winningBid / 100,
        requestCount: requests.length,
        requestBids: requests.map(r => ({ id: r.id?.slice(0, 8), bid: (r.current_bid_amount || 0) / 100 }))
      });
    }
    return winningBid;
  }, [requests]);

  // Get winning request
  const winningRequest = sortedRequests.length > 0 && currentWinningBidAmount > 0 
    ? sortedRequests.find(r => (r.current_bid_amount || 0) === currentWinningBidAmount) || sortedRequests[0]
    : null;

  // Calculate minimum bid based on current winning bid - use memoized value
  const minBid = useMemo(() => {
    return currentRequest 
      ? (() => {
          const isBiddingOnWinningRequest = currentRequest.current_bid_amount === currentWinningBidAmount && currentWinningBidAmount > 0;
          return isBiddingOnWinningRequest
            ? currentWinningBidAmount + 100 // Must be at least $1 more than current bid on this request
            : Math.max(currentWinningBidAmount + 100, 500); // Must beat the winning bid, minimum $5
        })()
      : Math.max(currentWinningBidAmount + 100, 500);
  }, [currentRequest, currentWinningBidAmount]);

  // Pre-select minimum bid when minBid changes
  useEffect(() => {
    if (minBid > 0 && selectedPresetBid === null && bidAmountType === 'preset') {
      setSelectedPresetBid(minBid);
    }
  }, [minBid, selectedPresetBid, bidAmountType]);

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

    // Get bid amount from selector
    const bidAmountCents = getBidAmount();
    
    if (!bidAmountCents || bidAmountCents <= 0) {
      setError('Please select or enter a bid amount');
      return;
    }
    
    // Use memoized current winning bid amount
    const currentWinningBid = currentWinningBidAmount;
    
    // Minimum bid must be higher than the current winning bid
    // If bidding on the current winning request, must be at least $1 more
    // If bidding on a different request, must beat the winning bid
    const isBiddingOnWinningRequest = currentRequest.current_bid_amount === currentWinningBid && currentWinningBid > 0;
    const minBidForValidation = isBiddingOnWinningRequest
      ? currentWinningBid + 100 // Must be at least $1 more than current bid on this request
      : Math.max(currentWinningBid + 100, 500); // Must beat the winning bid, minimum $5

    if (bidAmountCents < minBidForValidation) {
      if (currentWinningBid > 0) {
        setError(`Your bid must be higher than the current winning bid of $${(currentWinningBid / 100).toFixed(2)}. Minimum bid: $${(minBidForValidation / 100).toFixed(2)}`);
      } else {
        setError(`Minimum bid is $${(minBidForValidation / 100).toFixed(2)}`);
      }
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
      // Reset bid form
      setSelectedPresetBid(null);
      setCustomBidAmount('');
      setBidAmountType('preset');
      
      // Reload round data immediately and again after short delay to ensure sync
      loadCurrentRound();
      setTimeout(() => {
        loadCurrentRound();
      }, 500);

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

  // If no active round, show loading state while we try to create one
  // The API will auto-create a round if none exists
  if (!biddingRound || !biddingRound.active) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Starting bidding round...
          </p>
        </div>
      </div>
    );
  }


  // Generate dynamic preset bid amounts based on current winning bid - memoized for reactivity
  const presetBids = useMemo(() => {
    const presets = [];
    const baseMin = minBid;
    
    // Always include minimum bid as first option
    presets.push({
      value: baseMin,
      label: `$${(baseMin / 100).toFixed(2)}`
    });
    
    // Add increments: +$5, +$10, +$20, +$50
    const increments = [500, 1000, 2000, 5000]; // $5, $10, $20, $50
    increments.forEach(increment => {
      const amount = baseMin + increment;
      presets.push({
        value: amount,
        label: `$${(amount / 100).toFixed(2)}`
      });
    });
    
    return presets;
  }, [minBid]);

  // Get the actual bid amount based on type
  const getBidAmount = () => {
    if (bidAmountType === 'preset' && selectedPresetBid !== null) {
      return selectedPresetBid;
    } else if (bidAmountType === 'custom' && customBidAmount) {
      return Math.round(parseFloat(customBidAmount) * 100);
    }
    return null;
  };

  // Check if current selected bid beats the winning bid
  const selectedBidAmount = getBidAmount();
  const beatsWinningBid = selectedBidAmount && currentWinningBidAmount > 0 && selectedBidAmount > currentWinningBidAmount;

  return (
    <div className={`space-y-4 ${winningRequest ? 'pb-20 sm:pb-24' : 'pb-4'}`}>
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      {/* Round Info */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-white">
        <div className="flex items-center justify-center mb-2">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            <h3 className="font-bold text-lg">Bidding Round #{biddingRound.round.roundNumber}</h3>
          </div>
        </div>
        <p className="text-sm opacity-90 text-center">
          Highest bidder wins every 30 minutes!
        </p>
      </div>

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

      {/* Bid Form - Only show if user has a request in the round */}
      {requestId && currentRequest ? (
        <form onSubmit={handlePlaceBid} data-bid-form className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4" />
            Song Request Details
          </h4>

          {/* Song Request Update Section - Reused from requests page */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-3 border border-gray-200 dark:border-gray-700">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Music className="w-4 h-4" />
              Update Song Request (Optional)
            </h5>
            
            {/* Music Link Input */}
            {showLinkField ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    <Music className="w-3 h-3 inline mr-1" />
                    Paste Music Link (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={songUrl}
                      onChange={handleSongUrlChange}
                      className={`w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        extractingSong ? 'pr-20' : 'pr-3'
                      }`}
                      placeholder="Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link"
                      autoComplete="off"
                    />
                    {extractingSong && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-xs text-purple-600 dark:text-purple-400 hidden sm:inline">Extracting...</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    We&apos;ll automatically fill in the song title and artist name
                  </p>
                </div>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-gray-50 dark:bg-gray-900/50 px-2 text-gray-500 dark:text-gray-400">
                      Or enter manually
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-2">
                <button
                  type="button"
                  onClick={handleShareAnotherSong}
                  className="inline-flex items-center gap-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                >
                  <Music className="w-3 h-3" />
                  Start over
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Song Title
              </label>
              <input
                ref={songTitleInputRef}
                type="text"
                value={songFormData.songTitle}
                onChange={(e) => setSongFormData(prev => ({ ...prev, songTitle: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Enter song title"
                autoComplete="off"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Artist Name
              </label>
              <input
                type="text"
                value={songFormData.songArtist}
                onChange={(e) => setSongFormData(prev => ({ ...prev, songArtist: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                placeholder="Enter artist name"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Bid Amount Selector - Right below artist name, above submit button */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bid Amount <span className="text-red-500">*</span>
            </label>
            
            {/* Preset vs Custom Toggle */}
            <div className="flex gap-2 mb-3 p-1 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg">
              <button
                type="button"
                onClick={() => setBidAmountType('preset')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  bidAmountType === 'preset'
                    ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="font-bold text-sm">Quick Amount</span>
              </button>
              
              <button
                type="button"
                onClick={() => setBidAmountType('custom')}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-all ${
                  bidAmountType === 'custom'
                    ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="font-bold text-sm">Custom Amount</span>
              </button>
            </div>

            {/* Preset Bid Buttons */}
            {bidAmountType === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {presetBids.map((preset) => {
                  const beatsCurrentBid = currentWinningBidAmount > 0 && preset.value > currentWinningBidAmount;
                  const isMinimum = preset.value === minBid;
                  
                  return (
                    <button
                      key={`preset-${preset.value}-${currentWinningBidAmount}`} // Include winning bid in key to force re-render
                      type="button"
                      onClick={() => setSelectedPresetBid(preset.value)}
                      className={`p-3 rounded-lg border-2 transition-all relative ${
                        selectedPresetBid === preset.value
                          ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40 scale-105'
                          : beatsCurrentBid
                          ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 hover:border-green-500 hover:scale-[1.02] hover:shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 hover:scale-[1.02] hover:shadow-lg'
                      }`}
                      title={beatsCurrentBid ? `This bid beats the current winning bid of $${(currentWinningBidAmount / 100).toFixed(2)}` : undefined}
                    >
                      {beatsCurrentBid && selectedPresetBid !== preset.value && (
                        <div className="absolute top-1 right-1">
                          <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-1 rounded">✓</span>
                        </div>
                      )}
                      {isMinimum && (
                        <div className="absolute -top-1 -left-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 rounded-full">
                          MIN
                        </div>
                      )}
                      <span className={`text-sm font-bold ${
                        selectedPresetBid === preset.value
                          ? 'text-white'
                          : beatsCurrentBid
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Bid Input */}
            {bidAmountType === 'custom' && (
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={minBid / 100}
                    value={customBidAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setCustomBidAmount('');
                        return;
                      }
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue) && numValue >= minBid / 100) {
                        setCustomBidAmount(value);
                      } else if (numValue >= 0) {
                        setCustomBidAmount(value);
                      }
                    }}
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      customBidAmount && parseFloat(customBidAmount) > 0 && parseFloat(customBidAmount) * 100 > currentWinningBidAmount && currentWinningBidAmount > 0
                        ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                        : customBidAmount && parseFloat(customBidAmount) > 0 && parseFloat(customBidAmount) < minBid / 100
                        ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={(minBid / 100).toFixed(2)}
                  />
                  {customBidAmount && parseFloat(customBidAmount) > 0 && parseFloat(customBidAmount) * 100 > currentWinningBidAmount && currentWinningBidAmount > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded">✓ Beats ${(currentWinningBidAmount / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                {customBidAmount && parseFloat(customBidAmount) > 0 && parseFloat(customBidAmount) < minBid / 100 ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Minimum bid is ${(minBid / 100).toFixed(2)}
                  </p>
                ) : customBidAmount && parseFloat(customBidAmount) > 0 && parseFloat(customBidAmount) * 100 > currentWinningBidAmount && currentWinningBidAmount > 0 ? (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                    ✓ This bid beats the current winning bid of ${(currentWinningBidAmount / 100).toFixed(2)}!
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum: ${(minBid / 100).toFixed(2)} {currentWinningBidAmount > 0 && `(current winning: $${(currentWinningBidAmount / 100).toFixed(2)})`}
                  </p>
                )}
              </div>
            )}

            {/* Current Winning Bid Info */}
            <div className={`rounded-lg p-2 border transition-all ${
              currentWinningBidAmount > 0
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <p className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
                {currentWinningBidAmount > 0 ? (
                  <>
                    <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>
                      Current winning bid: <span className="font-semibold text-purple-600 dark:text-purple-400">${(currentWinningBidAmount / 100).toFixed(2)}</span>
                      {' • '}
                      Your bid must be higher to win!
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>No bids yet - be the first to bid!</span>
                  </>
                )}
              </p>
            </div>
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

        {/* Contact Info Benefits */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Stay in the loop! 🎉
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Add your email or phone number to get <span className="font-semibold text-purple-600 dark:text-purple-400">instant notifications</span> when you win the bid. We&apos;ll let you know right away so you don&apos;t miss your moment!
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <div className="flex items-center gap-2">
              Email
              <span className="text-xs font-normal text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Get notified if you win!
              </span>
            </div>
          </label>
          <input
            type="email"
            value={bidderEmail}
            onChange={(e) => setBidderEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="your@email.com"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-500" />
            We&apos;ll email you immediately when you win the bid!
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <div className="flex items-center gap-2">
              Phone
              <span className="text-xs font-normal text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                Instant win notification!
              </span>
            </div>
          </label>
          <input
            type="tel"
            value={bidderPhone}
            onChange={(e) => setBidderPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-purple-500" />
            Get a text message the moment you win!
          </p>
        </div>

        <button
          type="submit"
          disabled={placingBid || timeRemaining === 0 || !selectedBidAmount}
          className={`w-full py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 ${
            beatsWinningBid
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 shadow-lg shadow-green-500/30'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
          }`}
        >
          {placingBid ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing Bid...
            </>
          ) : beatsWinningBid ? (
            <>
              <Trophy className="w-4 h-4" />
              Place Winning Bid! ${(selectedBidAmount / 100).toFixed(2)}
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              {selectedBidAmount ? `Place $${(selectedBidAmount / 100).toFixed(2)} Bid` : 'Place Bid'}
            </>
          )}
        </button>
        
        {beatsWinningBid && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-2 text-center animate-pulse">
            <p className="text-xs font-semibold text-green-800 dark:text-green-200 flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />
              This bid will beat the current winning bid of ${(currentWinningBidAmount / 100).toFixed(2)}!
            </p>
          </div>
        )}

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
      ) : null}

      {/* Live List - Shows all bids (real + dummy) as they come in */}
      <div className="bg-black/95 dark:bg-gray-900/95 rounded-lg border-2 border-purple-500/30 overflow-hidden">
        <div className="px-4 py-2 bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-b border-purple-500/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">Live Bid Activity</h4>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <div className="divide-y divide-gray-800/50">
            {allBidsList.length > 0 ? (
              // Display in order: lowest to highest (shows bidding progression)
              allBidsList.map((bid, idx) => {
                const bidTime = new Date(bid.created_at);
                const timeAgo = Math.floor((Date.now() - bidTime.getTime()) / 1000);
                const timeText = timeAgo < 60 
                  ? `${timeAgo}s ago` 
                  : timeAgo < 3600
                    ? `${Math.floor(timeAgo / 60)}m ago`
                    : `${Math.floor(timeAgo / 3600)}h ago`;
                
                const songName = bid.song_title 
                  ? `${bid.song_title}${bid.song_artist ? ` by ${bid.song_artist}` : ''}`
                  : 'A song';
                
                const isRecent = timeAgo < 60 && !bid.is_dummy;
                
                return (
                  <div
                    key={bid.id || `bid-${idx}`}
                    className={`px-4 py-3 transition-all ${
                      idx === 0 && isRecent ? 'bg-purple-600/10 animate-pulse' : 'hover:bg-gray-800/30'
                    }`}
                    style={{
                      animation: idx === 0 && isRecent ? 'slideIn 0.3s ease-out' : 'none'
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white">{bid.bidder_name || 'Anonymous'}</span>
                          {isRecent && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                              NEW
                            </span>
                          )}
                          {bid.is_dummy && (
                            <span className="px-1.5 py-0.5 bg-gray-600 text-white text-xs font-bold rounded">
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          bid <span className="text-purple-300 font-medium">${(bid.bid_amount / 100).toFixed(2)}</span> on <span className="text-purple-300 font-medium">{songName}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-sm font-bold text-purple-300">
                          ${(bid.bid_amount / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {timeText}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No bids yet - be the first to bid!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Quick Bid Increase Button - Show when user is outbid - Reactive to winning bid */}
      {currentRequest && requestId && (() => {
        const userBid = currentRequest.current_bid_amount || 0;
        const highestBid = currentWinningBidAmount; // Use memoized winning bid - updates automatically
        const isOutbid = highestBid > userBid && userBid > 0;
        
        if (!isOutbid) return null;
        
        const minBidToWin = highestBid + 100; // $1 increment
        
        // Debug log
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.log('[BiddingInterface] Floating button updated:', {
            userBid: userBid / 100,
            highestBid: highestBid / 100,
            minBidToWin: minBidToWin / 100
          });
        }
        
        return (
          <div key={`floating-bid-${highestBid}`} className="fixed bottom-20 sm:bottom-24 right-4 z-50">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-2xl border-2 border-white/20 p-4 animate-bounce">
              <div className="flex flex-col items-center gap-2">
                <div className="text-center">
                  <p className="text-xs font-semibold mb-1">You've been outbid!</p>
                  <p className="text-sm font-bold">Current Winning: ${(highestBid / 100).toFixed(2)}</p>
                  <p className="text-xs opacity-90 mt-1">Your bid: ${(userBid / 100).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => {
                    // Quick bid increase - set to minimum to win
                    setBidAmountType('custom');
                    setCustomBidAmount((minBidToWin / 100).toFixed(2));
                    setSelectedPresetBid(null);
                    // Scroll to bid form
                    setTimeout(() => {
                      const bidForm = document.querySelector('[data-bid-form]');
                      if (bidForm) {
                        bidForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }}
                  className="px-4 py-2 bg-white text-red-600 font-bold rounded-full hover:bg-gray-100 transition-all text-sm shadow-lg"
                >
                  Bid ${(minBidToWin / 100).toFixed(2)} to Win
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Current Request Info - Only show if user has a request in the round */}
      {currentRequest && requestId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {songFormData.songTitle || currentRequest.song_title
                  ? `${songFormData.songTitle || currentRequest.song_title}${(songFormData.songArtist || currentRequest.song_artist) ? ` by ${songFormData.songArtist || currentRequest.song_artist}` : ''}`
                  : `Request #${currentRequest.id?.slice(0, 8)}`
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
          
          {/* Quick Bid Increase Buttons - Reactive to winning bid changes */}
          {(() => {
            if (!currentRequest) return null;
            
            const userBid = currentRequest.current_bid_amount || 0;
            const highestBid = currentWinningBidAmount; // Use memoized winning bid - will update when requests change
            const isOutbid = highestBid > userBid && userBid > 0;
            
            if (!isOutbid) {
              return null;
            }
            
            const minBidToWin = highestBid + 100;
            const quickIncrements = [
              { amount: minBidToWin, label: `$${(minBidToWin / 100).toFixed(2)} (Win)` },
              { amount: highestBid + 500, label: `$${((highestBid + 500) / 100).toFixed(2)}` },
              { amount: highestBid + 1000, label: `$${((highestBid + 1000) / 100).toFixed(2)}` },
              { amount: highestBid + 2000, label: `$${((highestBid + 2000) / 100).toFixed(2)}` }
            ];
            
            // Debug log to verify button amounts are correct
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log('[BiddingInterface] Quick bid buttons updated:', {
                userBid: userBid / 100,
                highestBid: highestBid / 100,
                minBidToWin: minBidToWin / 100,
                increments: quickIncrements.map(inc => ({ amount: inc.amount / 100, label: inc.label }))
              });
            }
            
            return (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      You've been outbid! Increase your bid:
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current winning: <span className="font-bold text-red-600 dark:text-red-400">${(highestBid / 100).toFixed(2)}</span>
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {quickIncrements.map((inc, idx) => (
                      <button
                        key={`quick-bid-${highestBid}-${idx}`} // Include winning bid in key to force re-render
                        onClick={async () => {
                          setBidAmountType('custom');
                          setCustomBidAmount((inc.amount / 100).toFixed(2));
                          setSelectedPresetBid(null);
                          // Auto-submit if it's the minimum to win
                          if (idx === 0 && biddingRound?.round?.id) {
                            setPlacingBid(true);
                            try {
                              const bidAmountCents = inc.amount;
                              const response = await fetch('/api/bidding/place-bid', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  requestId: requestId,
                                  biddingRoundId: biddingRound.round.id,
                                  bidAmount: bidAmountCents,
                                  bidderName: bidderName.trim() || 'Anonymous',
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
                              setSelectedPresetBid(null);
                              setCustomBidAmount('');
                              setBidAmountType('preset');
                              // Refresh immediately to update buttons with new winning bid
                              loadCurrentRound();
                              // Also refresh after a short delay to ensure data is synced
                              setTimeout(() => {
                                loadCurrentRound();
                              }, 500);
                            } catch (err) {
                              setError(err.message || 'Failed to place bid');
                            } finally {
                              setPlacingBid(false);
                            }
                          }
                        }}
                        className={`py-2 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all relative ${
                          idx === 0
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 shadow-lg'
                            : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                        }`}
                        title={`Current winning bid: $${(highestBid / 100).toFixed(2)}. This bid: $${(inc.amount / 100).toFixed(2)}`}
                      >
                        {inc.label}
                        {idx === 0 && (
                          <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[8px] font-bold px-1 rounded-full animate-pulse">
                            WIN
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            );
          })()}

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

      {/* Winning Bid Ticker with Time - Sticky to bottom, always visible */}
      {sortedRequests.length > 0 && currentWinningBidAmount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 dark:bg-gray-900/95 backdrop-blur-sm border-t-2 border-purple-500/50 shadow-2xl">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg border-2 border-purple-500/50 overflow-hidden">
              <div className="px-2 sm:px-4 py-1.5 sm:py-2">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 sm:gap-2 mb-0.5 sm:mb-1 flex-wrap">
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-500 text-white text-[10px] sm:text-xs font-bold rounded uppercase whitespace-nowrap">
                          🏆 Winning
                        </span>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          <span className="font-mono text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                            {formatTime(timeRemaining)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        {winningRequest?.song_title 
                          ? `${winningRequest.song_title}${winningRequest.song_artist ? ` by ${winningRequest.song_artist}` : ''}`
                          : 'Current Leader'
                        }
                      </p>
                      {winningRequest?.highest_bidder_name && (
                        <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5 truncate">
                          by {winningRequest.highest_bidder_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-yellow-300">
                      ${(currentWinningBidAmount / 100).toFixed(2)}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5">Leader</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

