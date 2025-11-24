import { useCallback } from 'react';

/**
 * Custom hook for crowd request payment calculations
 * Extracts duplicate logic from requests.js and [code].js
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
  bundleDiscount = 0
}) {
  const getBaseAmount = useCallback(() => {
    if (amountType === 'preset') {
      return presetAmount;
    } else {
      const custom = parseFloat(customAmount) || 0;
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      const validatedCustom = Math.max(custom * 100, minPresetAmount);
      return Math.round(validatedCustom);
    }
  }, [amountType, presetAmount, customAmount, presetAmounts, minimumAmount]);

  const getPaymentAmount = useCallback(() => {
    const baseAmount = getBaseAmount();
    const fastTrack = (requestType === 'song_request' && isFastTrack) ? fastTrackFee : 0;
    const next = (requestType === 'song_request' && isNext) ? nextFee : 0;
    
    let total = baseAmount + fastTrack + next;
    
    if (requestType === 'song_request' && additionalSongs.length > 0) {
      const validAdditionalSongs = additionalSongs.filter(song => song.songTitle?.trim());
      const discountedAmountPerSong = Math.round(baseAmount * (1 - bundleDiscount));
      total += discountedAmountPerSong * validAdditionalSongs.length;
    }
    
    return total;
  }, [getBaseAmount, requestType, isFastTrack, isNext, fastTrackFee, nextFee, additionalSongs, bundleDiscount]);

  return {
    getBaseAmount,
    getPaymentAmount
  };
}

