import React from 'react';
import { Gift, DollarSign, Zap } from 'lucide-react';
import BundleSelector from './BundleSelector';

function PaymentAmountSelector({
  amountType,
  setAmountType,
  presetAmount,
  setPresetAmount,
  customAmount,
  setCustomAmount,
  presetAmounts,
  minimumAmount,
  requestType,
  isFastTrack,
  setIsFastTrack,
  isNext,
  setIsNext,
  fastTrackFee,
  nextFee,
  getBaseAmount,
  getPaymentAmount,
  hidePriorityOptions = false, // Hide fast track and next options (for bidding mode)
  isBiddingMode = false, // Indicates if this is in bidding mode
  currentWinningBid = 0, // Current winning bid amount in cents (for bidding mode)
  bundleSize = 1, // Bundle size: 1, 2, or 3
  setBundleSize = () => {} // Function to set bundle size
}) {
  return (
    <div className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards] bg-white/80 dark:bg-black/80 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 md:p-5 flex-shrink-0">
      <h2 className="text-base sm:text-lg md:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500" />
        {isBiddingMode ? 'Your Bid Amount' : 'Payment Amount'}
      </h2>
      
      {isBiddingMode && (
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
          💡 This is your starting bid. You can increase it later if someone outbids you.
        </p>
      )}
      
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4 p-1 bg-gray-100/50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl">
          <button
            type="button"
            onClick={() => setAmountType('preset')}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg border-2 transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] ${
              amountType === 'preset'
                ? 'border-brand-500 bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="font-bold text-xs sm:text-sm">Quick Amount</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAmountType('custom')}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg border-2 transition-all duration-300 touch-manipulation min-h-[40px] sm:min-h-[44px] ${
              amountType === 'custom'
                ? 'border-brand-500 bg-gradient-to-r from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30 scale-105'
                : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="font-bold text-xs sm:text-sm">Custom Amount</span>
          </button>
        </div>

        {amountType === 'preset' && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {presetAmounts
              .filter(preset => {
                // CRITICAL: In bidding mode, hide buttons that are <= winning bid
                if (isBiddingMode && currentWinningBid > 0 && preset.value <= currentWinningBid) {
                  return false; // Don't show this button
                }
                return true; // Show this button
              })
              .slice()
              .reverse() // Reverse order: max first, min last
              .map((preset, idx) => {
              const beatsCurrentBid = isBiddingMode && currentWinningBid > 0 && preset.value > currentWinningBid;
              const isBelowMinimum = isBiddingMode && preset.value < minimumAmount;
              
              return (
              <button
                  key={`preset-${preset.value}-${currentWinningBid}-${idx}-${presetAmounts.length}`} // Include winning bid, index, and array length in key to force re-render
                type="button"
                  onClick={() => !isBelowMinimum && setPresetAmount(preset.value)}
                  disabled={isBelowMinimum}
                className={`group relative p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-[52px] overflow-hidden ${
                    isBelowMinimum
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900/50 opacity-50 cursor-not-allowed'
                      : presetAmount === preset.value
                    ? 'border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-500/40 scale-105'
                      : beatsCurrentBid
                      ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 hover:border-green-500 hover:scale-[1.02] hover:shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-black/50 hover:border-brand-300 hover:scale-[1.02] hover:shadow-lg'
                }`}
              >
                {presetAmount === preset.value && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                )}
                  {beatsCurrentBid && !isBelowMinimum && (
                    <div className="absolute top-1 right-1">
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-1 rounded">✓</span>
                    </div>
                  )}
                <span className={`relative text-sm sm:text-base font-bold transition-colors ${
                  presetAmount === preset.value
                    ? 'text-white'
                      : isBelowMinimum
                      ? 'text-gray-400 dark:text-gray-600'
                      : beatsCurrentBid
                      ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400'
                }`}>
                  {preset.label}
                </span>
              </button>
              );
            })}
          </div>
        )}

        {amountType === 'custom' && (
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Enter Amount (USD)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for clearing
                  if (value === '') {
                    setCustomAmount('');
                    return;
                  }
                  // Get minimum amount - use minimumAmount prop if provided, otherwise use first preset
                  // This ensures bidding mode uses the winning bid + $5 minimum
                  const minAmount = minimumAmount > 0 ? minimumAmount / 100 : (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : 0);
                  const numValue = parseFloat(value);
                  // Only update if value is valid and >= minimum
                  if (!isNaN(numValue) && numValue >= minAmount) {
                    setCustomAmount(value);
                  } else if (numValue < minAmount && numValue >= 0) {
                    // Show the value but it will be invalid
                    setCustomAmount(value);
                  }
                }}
                min={minimumAmount > 0 ? (minimumAmount / 100).toFixed(2) : (presetAmounts.length > 0 ? (presetAmounts[0].value / 100).toFixed(2) : '0.01')}
                step="0.01"
                inputMode="decimal"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                  (() => {
                    const minAmount = minimumAmount > 0 ? minimumAmount / 100 : (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : 0);
                    return customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < minAmount;
                  })()
                    ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent touch-manipulation`}
                placeholder={(() => {
                  const minAmount = minimumAmount > 0 ? minimumAmount / 100 : (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : 0);
                  return minAmount.toFixed(2);
                })()}
              />
            </div>
            {(() => {
              const minAmount = minimumAmount > 0 ? minimumAmount / 100 : (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : 0);
              const beatsCurrentBid = isBiddingMode && currentWinningBid > 0 && customAmount && parseFloat(customAmount) * 100 > currentWinningBid;
              
              return customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < minAmount ? (
                <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                  Minimum amount is ${minAmount.toFixed(2)}
                </p>
              ) : beatsCurrentBid ? (
                <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                  ✓ This bid beats the current winning bid of ${(currentWinningBid / 100).toFixed(2)}
                </p>
              ) : (
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isBiddingMode && currentWinningBid > 0 
                    ? `Minimum to win: $${minAmount.toFixed(2)} (current winning: $${(currentWinningBid / 100).toFixed(2)})`
                    : `Minimum: $${minAmount.toFixed(2)}`
                  }
                </p>
              );
            })()}
          </div>
        )}

        {/* Bundle Selector (only for song requests, not bidding mode) */}
        {requestType === 'song_request' && !isBiddingMode && (
          <BundleSelector
            baseAmount={getBaseAmount()}
            minimumAmount={minimumAmount}
            bundleSize={bundleSize}
            setBundleSize={setBundleSize}
            requestType={requestType}
            disabled={!getBaseAmount() || getBaseAmount() < minimumAmount}
          />
        )}

        {/* Fast-Track and Next Options (only for song requests) - Compact Radio Style */}
        {requestType === 'song_request' && !hidePriorityOptions && (
          <div className="border-t-2 border-gray-200/50 dark:border-gray-700/50 pt-3 sm:pt-4 mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {/* Fast-Track Option - More Compact */}
            <label 
              className={`group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                isFastTrack
                  ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 shadow-lg shadow-orange-500/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-orange-300'
              }`}
              onClick={(e) => {
                e.preventDefault();
                // Allow deselection: if already checked, uncheck it
                if (isFastTrack) {
                  setIsFastTrack(false);
                } else {
                  setIsFastTrack(true);
                  setIsNext(false);
                }
              }}
            >
              <input
                type="radio"
                name="priorityOption"
                checked={isFastTrack}
                onChange={() => {}} // Handled by label onClick
                className="sr-only"
                aria-label="Fast-Track Priority Placement"
              />
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                isFastTrack
                  ? 'border-orange-500 bg-orange-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {isFastTrack && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFastTrack ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
                      Fast-Track
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                    +${((fastTrackFee * bundleSize) / 100).toFixed(2)}
                    {bundleSize > 1 && (
                      <span className="text-[10px] text-orange-500 dark:text-orange-400 ml-1">
                        ({bundleSize}x)
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5">
                  ⚡ Your song will be played next!
                </p>
              </div>
            </label>
            
            {/* Next Option - More Compact */}
            <label 
              className={`group relative flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 cursor-pointer touch-manipulation ${
                isNext
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20 shadow-lg shadow-blue-500/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-blue-300'
              }`}
              onClick={(e) => {
                e.preventDefault();
                // Allow deselection: if already checked, uncheck it
                if (isNext) {
                  setIsNext(false);
                } else {
                  setIsNext(true);
                  setIsFastTrack(false);
                }
              }}
            >
              <input
                type="radio"
                name="priorityOption"
                checked={isNext}
                onChange={() => {}} // Handled by label onClick
                className="sr-only"
                aria-label="Next - Bump to Next"
              />
              <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                isNext
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {isNext && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Gift className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isNext ? 'text-blue-500' : 'text-gray-400'}`} />
                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white">
                      Next
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    +${(nextFee / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Play next - jump to front
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="bg-gradient-to-br from-brand-50 via-brand-100/50 to-brand-200/30 dark:from-brand-900/20 dark:via-brand-800/20 dark:to-brand-700/20 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-brand-200/50 dark:border-brand-700/30">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Base Amount:</span>
              <span className="text-gray-900 dark:text-white font-bold text-sm sm:text-base">
                ${(getBaseAmount() / 100).toFixed(2)}
              </span>
            </div>
            {isFastTrack && requestType === 'song_request' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Fast-Track Fee:
                </span>
                <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                  +${((fastTrackFee * bundleSize) / 100).toFixed(2)}
                  {bundleSize > 1 && (
                    <span className="text-xs text-orange-500 dark:text-orange-400 ml-1">
                      ({bundleSize}x)
                    </span>
                  )}
                </span>
              </div>
            )}
            {isNext && requestType === 'song_request' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-blue-500" />
                  Next Fee:
                </span>
                <span className="font-bold text-sm sm:text-base bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  +${(nextFee / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t-2 border-brand-300/50 dark:border-brand-700/50 pt-2 flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                Total Amount:
              </span>
              <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 dark:from-brand-400 dark:via-brand-300 dark:to-brand-500 bg-clip-text text-transparent">
                ${(getPaymentAmount() / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(PaymentAmountSelector);

