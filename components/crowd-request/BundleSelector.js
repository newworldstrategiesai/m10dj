import React from 'react';
import { Package, Sparkles, TrendingDown } from 'lucide-react';

/**
 * BundleSelector - Smart bundle pricing component
 * 
 * Strategy:
 * - Minimum tier: "2 for $20" (value proposition, same price per song)
 * - Higher tiers: "2 for $40" (20% off), "3 for $55" (27% off)
 * - Dynamic pricing based on selected amount
 */
function BundleSelector({
  baseAmount, // Selected base amount in cents
  minimumAmount, // Minimum amount in cents
  bundleSize, // Selected bundle size: 1, 2, or 3
  setBundleSize,
  requestType,
  disabled = false
}) {
  // Only show for song requests
  if (requestType !== 'song_request') {
    return null;
  }

  const isMinimumTier = baseAmount <= minimumAmount;
  
  // Calculate bundle prices
  const calculateBundlePrice = (size) => {
    if (isMinimumTier) {
      // Minimum tier: 2 for $20 (same price per song)
      if (size === 2) {
        return minimumAmount * 2; // 2 for $20
      }
      // For 3 songs at minimum tier, use a small discount
      if (size === 3) {
        return Math.round(minimumAmount * 2.8); // $28 (slight discount)
      }
      return baseAmount * size;
    } else {
      // Higher tier: Apply discounts
      if (size === 2) {
        // 20% discount for 2 songs
        return Math.round(baseAmount * 1.6); // 2 songs at 80% each = 160%
      }
      if (size === 3) {
        // 27% discount for 3 songs (approximately $18.33 each from $25 base)
        // This gives us $55 for 3 songs when base is $25
        return Math.round(baseAmount * 2.2); // 3 songs at ~73% each = 220%
      }
      return baseAmount * size;
    }
  };

  const getBundleSavings = (size) => {
    if (size === 1) return 0;
    const bundlePrice = calculateBundlePrice(size);
    const regularPrice = baseAmount * size;
    return regularPrice - bundlePrice;
  };

  const getPricePerSong = (size) => {
    return calculateBundlePrice(size) / size;
  };

  const bundles = [
    { size: 1, label: '1 Song', price: calculateBundlePrice(1), savings: 0 },
    { size: 2, label: '2 Songs', price: calculateBundlePrice(2), savings: getBundleSavings(2) },
    { size: 3, label: '3 Songs', price: calculateBundlePrice(3), savings: getBundleSavings(3) }
  ];

  // Only show bundles if base amount is set
  if (!baseAmount || baseAmount < minimumAmount) {
    return null;
  }

  return (
    <div className="mt-4 sm:mt-6 border-t-2 border-gray-200/50 dark:border-gray-700/50 pt-4 sm:pt-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
        <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
          Song Bundle Deals
        </h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {bundles.map((bundle) => {
          const isSelected = bundleSize === bundle.size;
          const pricePerSong = getPricePerSong(bundle.size);
          const hasDiscount = bundle.savings > 0;
          
          return (
            <button
              key={bundle.size}
              type="button"
              onClick={() => !disabled && setBundleSize(bundle.size)}
              disabled={disabled}
              className={`relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-300 touch-manipulation ${
                isSelected
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 shadow-lg shadow-purple-500/20 scale-105'
                  : 'border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:border-purple-300 hover:scale-[1.02] hover:shadow-md'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full p-1">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}
              
              <div className="text-center">
                <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {bundle.label}
                </div>
                <div className="text-base sm:text-lg md:text-xl font-extrabold text-purple-600 dark:text-purple-400 mb-1">
                  ${(bundle.price / 100).toFixed(2)}
                </div>
                {bundle.size > 1 && (
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                    ${(pricePerSong / 100).toFixed(2)} each
                  </div>
                )}
                {hasDiscount && (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <TrendingDown className="w-3 h-3 text-green-500" />
                    <span className="text-[10px] sm:text-xs font-semibold text-green-600 dark:text-green-400">
                      Save ${(bundle.savings / 100).toFixed(2)}
                    </span>
                  </div>
                )}
                {isMinimumTier && bundle.size === 2 && (
                  <div className="mt-1 text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Same price, 2 songs!
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {isMinimumTier && bundleSize === 2 && (
        <div className="mt-3 sm:mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200 text-center">
            💡 Great value! Get 2 songs for the same price per song.
          </p>
        </div>
      )}
      
      {!isMinimumTier && bundleSize > 1 && (
        <div className="mt-3 sm:mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-green-800 dark:text-green-200 text-center">
            🎉 You're saving ${(getBundleSavings(bundleSize) / 100).toFixed(2)} with this bundle!
          </p>
        </div>
      )}
    </div>
  );
}

export default React.memo(BundleSelector);

