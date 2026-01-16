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
  isExtractedFromLink = false, // If true, artist is optional (extracted from link)
  skipPaymentValidation = false // If true, skip payment amount validation (for bidding mode)
}) {
  const isSongSelectionComplete = () => {
    try {
      if (requestType === 'song_request') {
        const hasTitle = formData?.songTitle?.trim()?.length > 0;
        // Artist name is always required, whether extracted from link or entered manually
        return hasTitle && formData?.songArtist?.trim()?.length > 0;
      } else if (requestType === 'shoutout') {
        return formData?.recipientName?.trim()?.length > 0 && formData?.recipientMessage?.trim()?.length > 0;
      } else if (requestType === 'tip') {
        // For tips, we only need an amount selected (no form fields required)
        // Tips have no minimum - allow any amount > 0
        const amount = getPaymentAmount();
        return amount && amount > 0;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const validateForm = (setError) => {
    try {
      // Requester name validation is now handled at payment step
      // No need to validate it here - it will be collected during checkout

      if (requestType === 'song_request') {
        if (!formData?.songTitle?.trim()) {
          setError('Please enter a song title');
          return false;
        }
        // Artist name is always required, whether extracted from link or entered manually
        if (!formData?.songArtist?.trim()) {
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
        // For tips, we only validate the amount (no form fields required except name)
        // Tips have no minimum - just ensure amount > 0
        const amount = getPaymentAmount();
        if (!amount || amount <= 0) {
          setError('Please enter a tip amount');
          return false;
        }
        // Skip minimum validation for tips - allow any amount > 0
        return true;
      }

      // In bidding mode, we still need to validate that a bid amount is selected
      // The amount will be used as the initial bid when submitting the request
      if (skipPaymentValidation) {
        // In bidding mode, validate that a bid amount is selected
        const amount = getPaymentAmount();
        const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
        if (!amount || amount < minPresetAmount) {
          setError(`Please select a bid amount. Minimum bid is $${(minPresetAmount / 100).toFixed(2)}`);
          return false;
        }
      } else {
        // Regular mode - validate payment amount (only for non-tip requests)
        // Tips are already validated above with no minimum
        if (requestType !== 'tip') {
          const amount = getPaymentAmount();
          const minPresetAmount = presetAmounts.length > 0 ? presetAmounts[0].value : minimumAmount;
          if (!amount || amount < minPresetAmount) {
            setError(`Minimum payment is $${(minPresetAmount / 100).toFixed(2)}`);
            return false;
          }
        }
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

