/**
 * Custom hook for crowd request form validation
 * Extracts validation logic from requests.js and [code].js
 */
export function useCrowdRequestValidation({
  requestType,
  formData,
  getPaymentAmount,
  presetAmounts,
  minimumAmount
}) {
  const isSongSelectionComplete = () => {
    try {
      if (requestType === 'song_request') {
        return formData?.songTitle?.trim()?.length > 0 && formData?.songArtist?.trim()?.length > 0;
      } else if (requestType === 'shoutout') {
        return formData?.recipientName?.trim()?.length > 0 && formData?.recipientMessage?.trim()?.length > 0;
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

