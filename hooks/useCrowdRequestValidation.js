/**
 * Custom hook for crowd request form validation
 * Extracts validation logic from requests.js and [code].js
 */
export function useCrowdRequestValidation({
  requestType,
  formData,
  getPaymentAmount,
  presetAmounts,
  minimumAmount,
  isExtractedFromLink = false // If true, artist is optional (extracted from link)
}) {
  const isSongSelectionComplete = () => {
    try {
      if (requestType === 'song_request') {
        const hasTitle = formData?.songTitle?.trim()?.length > 0;
        // If extracted from link, only title is required; otherwise both are required
        if (isExtractedFromLink) {
          return hasTitle;
        }
        return hasTitle && formData?.songArtist?.trim()?.length > 0;
      } else if (requestType === 'shoutout') {
        return formData?.recipientName?.trim()?.length > 0 && formData?.recipientMessage?.trim()?.length > 0;
      } else if (requestType === 'tip') {
        // For tips, we only need an amount selected (no form fields required)
        const amount = getPaymentAmount();
        const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
        return amount && amount >= minPresetAmount;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const validateForm = (setError) => {
    try {
      if (requestType === 'song_request') {
        if (!formData?.songTitle?.trim()) {
          setError('Please enter a song title');
          return false;
        }
        // Artist is only required if NOT extracted from link
        if (!isExtractedFromLink && !formData?.songArtist?.trim()) {
          setError('Please enter an artist name');
          return false;
        }
      } else if (requestType === 'shoutout') {
        if (!formData?.recipientName?.trim()) {
          setError('Please enter the recipient name');
          return false;
        }
        if (!formData?.recipientMessage?.trim()) {
          setError('Please enter a message for the shoutout');
          return false;
        }
      } else if (requestType === 'tip') {
        // For tips, we only validate the amount (no form fields required)
      }

      const amount = getPaymentAmount();
      const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
      if (!amount || amount < minPresetAmount) {
        setError(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
        return false;
      }

      return true;
    } catch (err) {
      setError('Validation error. Please check your inputs and try again.');
      return false;
    }
  };

  return {
    isSongSelectionComplete,
    validateForm
  };
}

