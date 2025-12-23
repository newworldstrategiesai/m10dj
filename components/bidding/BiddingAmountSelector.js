import React, { useState, useEffect, useMemo } from 'react';
import { Gift, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

/**
 * Dedicated amount selector for bidding mode
 * Fetches and updates winning bid in real-time
 * Only shows amounts that beat the current winning bid
 */
function BiddingAmountSelector({
  organizationId,
  selectedAmount,
  onAmountChange,
  amountType,
  setAmountType,
  currentWinningBid: parentCurrentWinningBid, // From parent to ensure sync
  minimumBid: parentMinimumBid // From parent to ensure sync
}) {
  const [currentWinningBid, setCurrentWinningBid] = useState(parentCurrentWinningBid || 0);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Sync with parent's winning bid when it changes
  useEffect(() => {
    if (parentCurrentWinningBid !== undefined && parentCurrentWinningBid !== currentWinningBid) {
      console.log('[BiddingAmountSelector] Syncing with parent winning bid:', {
        previous: currentWinningBid / 100,
        new: parentCurrentWinningBid / 100
      });
      setCurrentWinningBid(parentCurrentWinningBid);
    }
  }, [parentCurrentWinningBid, currentWinningBid]);

  // Set amountType to 'custom' when component mounts (for parent compatibility)
  useEffect(() => {
    if (setAmountType) {
      setAmountType('custom');
    }
  }, [setAmountType]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isMobileDevice || isTouchDevice);
    };
    
    checkMobile();
    // Re-check on resize in case of device orientation change
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clear selected amount if it becomes invalid when winning bid changes
  useEffect(() => {
    if (!loading && currentWinningBid > 0 && selectedAmount !== null) {
      // Use parent's minimumBid if provided, otherwise calculate
      const minBid = parentMinimumBid || (currentWinningBid + 500);
      if (selectedAmount < minBid) {
        console.log('[BiddingAmountSelector] Selected amount is now below minimum, clearing:', {
          selectedAmount: selectedAmount / 100,
          minBid: minBid / 100,
          currentWinningBid: currentWinningBid / 100,
          usingParentMin: !!parentMinimumBid
        });
        setCustomAmount('');
        onAmountChange(null);
      }
    }
  }, [currentWinningBid, loading, selectedAmount, onAmountChange, parentMinimumBid]);

  // Fetch winning bid directly in this component
  useEffect(() => {
    if (!organizationId) {
      console.warn('[BiddingAmountSelector] No organizationId provided');
      setLoading(false);
      return;
    }

    console.log('[BiddingAmountSelector] Starting to fetch winning bid for org:', organizationId);
    setLoading(true); // Set loading to true when starting a new fetch

    const fetchWinningBid = async () => {
      try {
        const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('[BiddingAmountSelector] Round data received:', {
            active: data.active,
            requestCount: data.requests?.length || 0,
            requests: data.requests?.map(r => ({
              id: r.id,
              title: r.song_title,
              bid: r.current_bid_amount / 100
            })) || []
          });
          
          if (data.active && data.requests && data.requests.length > 0) {
            const bidAmounts = data.requests.map(r => r.current_bid_amount || 0).filter(b => b > 0);
            const highestBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0;
            console.log('[BiddingAmountSelector] Highest bid found:', highestBid / 100, {
              allBids: data.requests.map(r => ({ id: r.id, bid: (r.current_bid_amount || 0) / 100 }))
            });
            
            setCurrentWinningBid(prev => {
              if (prev !== highestBid) {
                console.log('[BiddingAmountSelector] Winning bid updated:', {
                  previous: prev / 100,
                  new: highestBid / 100,
                  changed: true
                });
                return highestBid;
              }
              console.log('[BiddingAmountSelector] Winning bid unchanged:', highestBid / 100);
              return prev;
            });
          } else {
            console.log('[BiddingAmountSelector] No active round or requests, setting to 0');
            setCurrentWinningBid(prev => {
              if (prev !== 0) {
                console.log('[BiddingAmountSelector] Resetting winning bid to 0');
                return 0;
              }
              return prev;
            });
          }
        } else {
          const errorText = await response.text();
          console.error('[BiddingAmountSelector] API response not OK:', response.status, errorText);
        }
      } catch (error) {
        console.error('[BiddingAmountSelector] Error fetching winning bid:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchWinningBid();
    // Poll every 2 seconds for real-time updates
    const interval = setInterval(fetchWinningBid, 2000);

    return () => clearInterval(interval);
  }, [organizationId]);

  // Calculate minimum bid - use parent's value if provided, otherwise calculate
  const minimumBid = useMemo(() => {
    if (parentMinimumBid !== undefined) {
      return parentMinimumBid; // Use parent's value to ensure sync
    }
    return currentWinningBid > 0 ? currentWinningBid + 500 : 500; // $5 minimum if no bids
  }, [currentWinningBid, parentMinimumBid]);


  // Handle custom amount input - allow free typing, validate on blur or when complete
  const handleCustomAmountChange = (e) => {
    const rawValue = e.target.value;
    
    // For number inputs, the value is already sanitized
    let sanitizedValue;
    if (isMobile && e.target.type === 'number') {
      // Number input already provides clean numeric value
      sanitizedValue = rawValue;
    } else {
      // Text input - need to sanitize
      // Remove any non-numeric characters except decimal point
      const cleanedValue = rawValue.replace(/[^0-9.]/g, '');
      
      // Prevent multiple decimal points
      const parts = cleanedValue.split('.');
      sanitizedValue = parts.length > 2 
        ? parts[0] + '.' + parts.slice(1).join('')
        : cleanedValue;
    }
    
    // Always update the input value to allow typing
    setCustomAmount(sanitizedValue);
    if (setAmountType) {
      setAmountType('custom');
    }
    
    // Parse and validate the number
    if (sanitizedValue === '' || sanitizedValue === '.') {
      // Empty or just a decimal point - clear the amount
      onAmountChange(null);
      return;
    }
    
    const numValue = parseFloat(sanitizedValue);
    const minDollars = minimumBid / 100;
    const winningBidDollars = currentWinningBid / 100;
    const amountInCents = Math.round(numValue * 100);
    
    // Only call onAmountChange if the value is a valid number and meets minimum
    if (!isNaN(numValue) && numValue > 0) {
      // Must be at least the minimum bid AND greater than the current winning bid
      if (numValue >= minDollars && amountInCents > currentWinningBid) {
        console.log('[BiddingAmountSelector] Custom amount valid:', {
          raw: rawValue,
          sanitized: sanitizedValue,
          dollars: numValue,
          cents: amountInCents,
          minimumBid: minimumBid / 100,
          winningBid: winningBidDollars,
          usingParentMin: parentMinimumBid !== undefined,
          parentMin: parentMinimumBid ? parentMinimumBid / 100 : null,
          isMobile,
          beatsWinning: amountInCents > currentWinningBid
        });
        onAmountChange(amountInCents);
      } else {
        // Value is a number but below minimum or not greater than winning bid
        // Don't call onAmountChange yet - allow user to continue typing
        console.log('[BiddingAmountSelector] Custom amount invalid (allowing typing):', {
          dollars: numValue,
          cents: amountInCents,
          minimumBid: minDollars,
          winningBid: winningBidDollars,
          meetsMinimum: numValue >= minDollars,
          beatsWinning: amountInCents > currentWinningBid
        });
        onAmountChange(null);
      }
    } else {
      // Not a valid number yet - might be in the middle of typing (e.g., "1.")
      // Don't call onAmountChange, but allow the user to continue typing
      onAmountChange(null);
    }
  };

  // Validate custom amount - must be greater than current winning bid
  const customAmountValid = useMemo(() => {
    if (!customAmount) return true; // Empty is valid (no selection)
    const numValue = parseFloat(customAmount);
    if (isNaN(numValue) || numValue <= 0) return false;
    
    // Convert to cents for comparison
    const amountInCents = Math.round(numValue * 100);
    const minBidInCents = minimumBid;
    const winningBidInCents = currentWinningBid;
    
    // Must be at least the minimum bid AND greater than the current winning bid
    const isValid = amountInCents >= minBidInCents && amountInCents > winningBidInCents;
    
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[BiddingAmountSelector] Validation check:', {
        customAmount,
        numValue,
        amountInCents,
        minBidInCents,
        winningBidInCents,
        minBidDollars: minBidInCents / 100,
        winningBidDollars: winningBidInCents / 100,
        isValid,
        meetsMinimum: amountInCents >= minBidInCents,
        beatsWinning: amountInCents > winningBidInCents
      });
    }
    
    return isValid;
  }, [customAmount, minimumBid, currentWinningBid]);

  // Show winning bid info
  const showWinningBidInfo = currentWinningBid > 0;

  // Log when component renders
  useEffect(() => {
    console.log('[BiddingAmountSelector] Component rendered with:', {
      organizationId,
      currentWinningBid: currentWinningBid / 100,
      parentCurrentWinningBid: parentCurrentWinningBid ? parentCurrentWinningBid / 100 : null,
      minimumBid: minimumBid / 100,
      parentMinimumBid: parentMinimumBid ? parentMinimumBid / 100 : null,
      usingParentValues: parentMinimumBid !== undefined,
      loading,
      customAmount
    });
  }, [organizationId, currentWinningBid, parentCurrentWinningBid, minimumBid, parentMinimumBid, loading, customAmount]);

  return (
    <div 
      className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 md:p-5 flex-shrink-0"
      key={`bidding-selector-${organizationId}-${currentWinningBid}-${loading}`}
    >
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        Your Bid Amount
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs text-gray-500 ml-2">
            (Winning: ${(currentWinningBid / 100).toFixed(2)}, Loading: {loading ? 'Yes' : 'No'})
          </span>
        )}
      </h2>
      
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
        💡 This is your starting bid. You can increase it later if someone outbids you.
      </p>

      {/* Current Winning Bid Display */}
      {showWinningBidInfo && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-yellow-800 dark:text-yellow-200 font-semibold">
              Current Winning Bid: <span className="text-yellow-900 dark:text-yellow-100">${(currentWinningBid / 100).toFixed(2)}</span>
            </span>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
            Your bid must be at least ${(minimumBid / 100).toFixed(2)} to win
          </p>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading bid options...
          </div>
        ) : (
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Enter Bid Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" />
              {isMobile ? (
                <input
                  type="number"
                  inputMode="decimal"
                  min={minimumBid / 100}
                  step="0.01"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  onBlur={(e) => {
                    // On blur, if the value is empty or invalid, clear it
                    const numValue = parseFloat(e.target.value);
                    if (!e.target.value || isNaN(numValue) || numValue < (minimumBid / 100)) {
                      setCustomAmount('');
                      onAmountChange(null);
                    }
                  }}
                  placeholder={`Min: $${(minimumBid / 100).toFixed(2)}`}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 transition-colors text-base sm:text-lg font-semibold appearance-none ${
                    customAmount && !customAmountValid
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500'
                      : customAmount && customAmountValid
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  onBlur={(e) => {
                    // On blur, if the value is empty or invalid, clear it
                    const numValue = parseFloat(e.target.value);
                    if (!e.target.value || isNaN(numValue) || numValue < (minimumBid / 100)) {
                      setCustomAmount('');
                      onAmountChange(null);
                    }
                  }}
                  placeholder={`Min: $${(minimumBid / 100).toFixed(2)}`}
                  className={`w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-lg sm:rounded-xl border-2 transition-colors text-base sm:text-lg font-semibold ${
                    customAmount && !customAmountValid
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-red-500'
                      : customAmount && customAmountValid
                      ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 focus:border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:ring-purple-500'
                  }`}
                />
              )}
            </div>
            {customAmount && !customAmountValid && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {currentWinningBid > 0 ? (
                  <>Your bid must be greater than ${(currentWinningBid / 100).toFixed(2)} (minimum: ${(minimumBid / 100).toFixed(2)})</>
                ) : (
                  <>Minimum bid is ${(minimumBid / 100).toFixed(2)}</>
                )}
              </p>
            )}
            {customAmount && customAmountValid && (
              <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                ✓ This bid (${parseFloat(customAmount || 0).toFixed(2)}) will beat the current winning bid (${(currentWinningBid / 100).toFixed(2)})
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BiddingAmountSelector;

