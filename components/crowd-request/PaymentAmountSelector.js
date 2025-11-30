import React from 'react';
import { Gift, DollarSign, Zap } from 'lucide-react';

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
  getPaymentAmount
}) {
  return (
    <div className="opacity-0 animate-[fadeIn_0.3s_ease-in-out_forwards] bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 md:p-5 flex-shrink-0">
      <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
        <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        Payment Amount
      </h2>
      
      <div className="space-y-2 sm:space-y-3 md:space-y-4">
        <div className="flex gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6 p-1 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl sm:rounded-2xl">
          <button
            type="button"
            onClick={() => setAmountType('preset')}
            className={`flex-1 py-2.5 sm:py-3 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-[48px] ${
              amountType === 'preset'
                ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="font-bold text-xs sm:text-sm md:text-base">Quick Amount</span>
          </button>
          
          <button
            type="button"
            onClick={() => setAmountType('custom')}
            className={`flex-1 py-2.5 sm:py-3 md:py-3.5 px-2 sm:px-3 md:px-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation min-h-[44px] sm:min-h-[48px] ${
              amountType === 'custom'
                ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'border-transparent bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="font-bold text-xs sm:text-sm md:text-base">Custom Amount</span>
          </button>
        </div>

        {amountType === 'preset' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {presetAmounts.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setPresetAmount(preset.value)}
                className={`group relative p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl border-2 transition-all duration-300 touch-manipulation min-h-[56px] sm:min-h-[64px] md:min-h-[72px] overflow-hidden ${
                  presetAmount === preset.value
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40 scale-105'
                    : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 hover:scale-[1.02] hover:shadow-lg'
                }`}
              >
                {presetAmount === preset.value && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                )}
                <span className={`relative text-sm sm:text-base md:text-lg lg:text-xl font-bold transition-colors ${
                  presetAmount === preset.value
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
                }`}>
                  {preset.label}
                </span>
              </button>
            ))}
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
                  // Get minimum preset amount (first option)
                  const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100;
                  const numValue = parseFloat(value);
                  // Only update if value is valid and >= minimum preset
                  if (!isNaN(numValue) && numValue >= minPresetAmount) {
                    setCustomAmount(value);
                  } else if (numValue < minPresetAmount && numValue >= 0) {
                    // Show the value but it will be invalid
                    setCustomAmount(value);
                  }
                }}
                min={presetAmounts.length > 0 ? (presetAmounts[0].value / 100).toFixed(2) : (minimumAmount / 100).toFixed(2)}
                step="0.01"
                inputMode="decimal"
                className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg border ${
                  customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100)
                    ? 'border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent touch-manipulation`}
                placeholder={(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
              />
            </div>
            {customAmount && parseFloat(customAmount) > 0 && parseFloat(customAmount) < (presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100) ? (
              <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                Minimum amount is ${(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
              </p>
            ) : (
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum: ${(presetAmounts.length > 0 ? presetAmounts[0].value / 100 : minimumAmount / 100).toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Fast-Track and Next Options (only for song requests) - Compact Radio Style */}
        {requestType === 'song_request' && (
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
                    +${(fastTrackFee / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Priority placement in queue
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

        <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 border-purple-200/50 dark:border-purple-700/30">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Base Amount:</span>
              <span className="text-gray-900 dark:text-white font-bold text-base sm:text-lg">
                ${(getBaseAmount() / 100).toFixed(2)}
              </span>
            </div>
            {isFastTrack && requestType === 'song_request' && (
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5 sm:gap-2">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  Fast-Track Fee:
                </span>
                <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                  +${(fastTrackFee / 100).toFixed(2)}
                </span>
              </div>
            )}
            {isNext && requestType === 'song_request' && (
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-1.5 sm:gap-2">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  Next Fee:
                </span>
                <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  +${(nextFee / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-t-2 border-purple-300/50 dark:border-purple-700/50 pt-2 sm:pt-3 md:pt-4 flex items-center justify-between">
              <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                Total Amount:
              </span>
              <span className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 dark:from-purple-400 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
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

