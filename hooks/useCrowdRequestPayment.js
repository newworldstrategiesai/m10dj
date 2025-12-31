import { useCallback } from 'react';

/**
 * Custom hook for crowd request payment calculations
 * Extracts duplicate logic from requests.js and [code].js
 * 
 * Now supports bundle pricing:
 * - Minimum tier: 2 for $20 (same price per song)
 * - Higher tiers: 2 for $40 (20% off), 3 for $55 (27% off)
 */
export function useCrowdRequestPayment({
  amountType,
  presetAmount,
  customAmount,
  presetAmounts,
  minimumAmount,
  requestType,
  isFastTrack,
  isNext,
  fastTrackFee,
  nextFee,
  additionalSongs = [],
  bundleDiscount = 0,
  bundleSize = 1, // New: bundle size (1, 2, or 3)
  audioFileUrl = null,
  audioUploadFee = 10000 // $100.00 in cents
}) {
  const getBaseAmount = useCallback(() => {
    if (amountType === 'preset') {
      return presetAmount;
    } else {
      // For custom amount, only return a value if user has actually entered something
      if (!customAmount || customAmount.trim() === '') {
        return 0; // Return 0 when custom amount is empty to prevent bundle selector from showing
      }
      const custom = parseFloat(customAmount) || 0;
      if (custom <= 0) {
        return 0; // Return 0 if invalid amount
      }
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      const validatedCustom = Math.max(custom * 100, minPresetAmount);
      return Math.round(validatedCustom);
    }
  }, [amountType, presetAmount, customAmount, presetAmounts, minimumAmount]);

  /**
   * Calculate bundle price based on base amount and bundle size
   */
  const calculateBundlePrice = useCallback((baseAmount, bundleSize, minimumAmount) => {
    if (bundleSize === 1) {
      return baseAmount;
    }

    const isMinimumTier = baseAmount <= minimumAmount;

    if (isMinimumTier) {
      // Minimum tier: 2 for $20 (same price per song)
      if (bundleSize === 2) {
        return minimumAmount * 2;
      }
      // For 3 songs at minimum tier, use a small discount
      if (bundleSize === 3) {
        return Math.round(minimumAmount * 2.8); // $28 (slight discount)
      }
      return baseAmount * bundleSize;
    } else {
      // Higher tier: Apply discounts
      if (bundleSize === 2) {
        // 20% discount for 2 songs
        return Math.round(baseAmount * 1.6); // 2 songs at 80% each = 160%
      }
      if (bundleSize === 3) {
        // 27% discount for 3 songs (approximately $18.33 each from $25 base)
        return Math.round(baseAmount * 2.2); // 3 songs at ~73% each = 220%
      }
      return baseAmount * bundleSize;
    }
  }, []);

  const getPaymentAmount = useCallback(() => {
    const baseAmount = getBaseAmount();
    // Fast track fee should be multiplied by bundle size (each song in bundle gets fast track)
    const fastTrack = (requestType === 'song_request' && isFastTrack) ? fastTrackFee * bundleSize : 0;
    const next = (requestType === 'song_request' && isNext) ? nextFee : 0;
    const audioFee = (requestType === 'song_request' && audioFileUrl) ? audioUploadFee : 0;
    
    // Calculate bundle price if bundle size > 1
    let bundleBaseAmount = baseAmount;
    if (requestType === 'song_request' && bundleSize > 1) {
      bundleBaseAmount = calculateBundlePrice(baseAmount, bundleSize, minimumAmount);
    }
    
    let total = bundleBaseAmount + fastTrack + next + audioFee;
    
    // Legacy support: additional songs with percentage discount
    // This is kept for backward compatibility but bundle pricing takes precedence
    if (requestType === 'song_request' && additionalSongs.length > 0 && bundleSize === 1) {
      const validAdditionalSongs = additionalSongs.filter(song => song.songTitle?.trim());
      const discountedAmountPerSong = Math.round(baseAmount * (1 - bundleDiscount));
      total += discountedAmountPerSong * validAdditionalSongs.length;
    }
    
    return total;
  }, [getBaseAmount, requestType, isFastTrack, isNext, fastTrackFee, nextFee, additionalSongs, bundleDiscount, bundleSize, calculateBundlePrice, minimumAmount, audioFileUrl, audioUploadFee]);

  return {
    getBaseAmount,
    getPaymentAmount,
    calculateBundlePrice
  };
}

