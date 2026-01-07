import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, Plus, X } from 'lucide-react';
import CashAppPaymentScreen from './CashAppPaymentScreen';
import VenmoPaymentScreen from './VenmoPaymentScreen';

// Client-side function to normalize casing (matches server-side logic)
const toTitleCase = (str) => {
  if (!str) return '';
  const lowercaseWords = ['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from'];
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      if (lowercaseWords.includes(word) && word.length > 1) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

function PaymentMethodSelection({ 
  requestId, 
  amount, 
  selectedPaymentMethod, 
  submitting, 
  onPaymentMethodSelected, 
  onBack, 
  paymentSettings, 
  paymentCode, 
  requestType, 
  songTitle, 
  songArtist, 
  recipientName,
  requesterName, // New prop: requester name to include in payment note
  additionalSongs = [],
  setAdditionalSongs,
  bundleSongs = [], // New: Bundle songs array
  bundleSize = 1, // New: Bundle size (1, 2, or 3)
  bundleDiscount = 0,
  bundleDiscountEnabled = false,
  getBaseAmount,
  getPaymentAmount,
  onError 
}) {
  const [cashAppQr, setCashAppQr] = useState(null);
  const [venmoQr, setVenmoQr] = useState(null);
  const [venmoRecipientsParam, setVenmoRecipientsParam] = useState(null);
  const [localSelectedMethod, setLocalSelectedMethod] = useState(null);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [additionalSongCount, setAdditionalSongCount] = useState(additionalSongs?.length || 0);
  
  // Sync local count with prop when it changes externally
  useEffect(() => {
    if (additionalSongs?.length !== undefined) {
      setAdditionalSongCount(additionalSongs.length);
    }
  }, [additionalSongs?.length]);

  const generateQRCode = (text) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
  };

  // Helper function to abbreviate song/artist names if needed
  const abbreviateSong = (title, artist, maxLength) => {
    if (!title) return '';
    
    const artistPart = artist ? ` by ${artist}` : '';
    const fullSong = `${title}${artistPart}`;
    
    if (fullSong.length <= maxLength) {
      return fullSong;
    }
    
    // Need to abbreviate - prioritize keeping title over artist
    if (artist) {
      // Try abbreviating artist first
      const artistAbbrev = artist.length > 8 ? artist.substring(0, 6) + '..' : artist;
      const withAbbrevArtist = `${title} by ${artistAbbrev}`;
      
      if (withAbbrevArtist.length <= maxLength) {
        return withAbbrevArtist;
      }
      
      // Need to abbreviate title too
      const titleMax = maxLength - artistAbbrev.length - 6; // " by " + artist
      const titleAbbrev = title.length > titleMax ? title.substring(0, titleMax - 2) + '..' : title;
      return `${titleAbbrev} by ${artistAbbrev}`;
    } else {
      // No artist, just abbreviate title
      return title.length > maxLength ? title.substring(0, maxLength - 2) + '..' : title;
    }
  };

  // Build payment note with song/shoutout details
  // Uses normalized casing for song titles and artist names
  // Includes requester name to help with payment verification
  // Includes all bundle songs if applicable
  // Abbreviates song/artist names if needed to fit Venmo's 280 character limit
  const buildPaymentNote = () => {
    let note = '';
    
    // Start with requester name if available (helps with payment verification)
    const namePrefix = requesterName && requesterName.trim() && requesterName.trim() !== 'Guest' 
      ? `${requesterName.trim()} - ` 
      : '';
    
    if (requestType === 'song_request') {
      // Build list of all songs (main + bundle songs)
      const allSongs = [];
      
      // Add main song
      if (songTitle) {
        const normalizedTitle = toTitleCase(songTitle);
        const normalizedArtist = songArtist ? toTitleCase(songArtist) : null;
        const songStr = normalizedArtist 
          ? `${normalizedTitle} by ${normalizedArtist}`
          : normalizedTitle;
        allSongs.push({ title: normalizedTitle, artist: normalizedArtist, full: songStr });
      }
      
      // Add bundle songs
      if (bundleSize > 1 && bundleSongs && bundleSongs.length > 0) {
        bundleSongs.forEach(song => {
          if (song.songTitle?.trim()) {
            const normalizedTitle = toTitleCase(song.songTitle);
            const normalizedArtist = song.songArtist ? toTitleCase(song.songArtist) : null;
            const songStr = normalizedArtist 
              ? `${normalizedTitle} by ${normalizedArtist}`
              : normalizedTitle;
            allSongs.push({ title: normalizedTitle, artist: normalizedArtist, full: songStr });
          }
        });
      }
      
      // Build note with all songs
      if (allSongs.length > 0) {
        // Calculate available space for songs
        const codePart = paymentCode ? ` - ${paymentCode}` : '';
        const reservedLength = namePrefix.length + codePart.length;
        const maxLength = 280; // Venmo limit
        const availableForSongs = maxLength - reservedLength - 2; // -2 for safety margin
        
        // First, try with full song names
        let songList = allSongs.map(s => s.full).join(', ');
        let fullNote = namePrefix + songList + codePart;
        
        // If too long, abbreviate songs
        if (fullNote.length > maxLength) {
          // Calculate per-song length (distribute available space)
          const numSongs = allSongs.length;
          const perSongLength = Math.floor(availableForSongs / numSongs) - 2; // -2 for comma and space
          
          // Abbreviate each song to fit
          const abbreviatedSongs = allSongs.map(song => {
            return abbreviateSong(song.title, song.artist, perSongLength);
          });
          
          songList = abbreviatedSongs.join(', ');
          fullNote = namePrefix + songList + codePart;
          
          // If still too long, truncate from the end (but keep payment code)
          if (fullNote.length > maxLength) {
            const mainPart = namePrefix + songList;
            const availableForMain = maxLength - codePart.length - 3; // -3 for "..."
            
            if (mainPart.length > availableForMain) {
              // Truncate but try to end at a song boundary (comma)
              let truncated = mainPart.substring(0, availableForMain);
              const lastComma = truncated.lastIndexOf(',');
              
              // Only truncate at comma if we keep at least 60% of content
              if (lastComma > availableForMain * 0.6) {
                truncated = truncated.substring(0, lastComma);
              }
              
              note = truncated + '...' + codePart;
            } else {
              note = mainPart + codePart;
            }
          } else {
            note = fullNote;
          }
        } else {
          note = fullNote;
        }
      } else {
        // Fallback if no songs
        note = namePrefix + (paymentCode ? `Song Request - ${paymentCode}` : 'Song Request');
      }
    } else if (requestType === 'shoutout') {
      if (recipientName) {
        note = namePrefix + `Shoutout for ${recipientName}`;
        if (paymentCode) {
          note += ` - ${paymentCode}`;
        }
      } else {
        note = namePrefix + (paymentCode ? `Shoutout - ${paymentCode}` : 'Shoutout');
      }
    } else if (requestType === 'tip') {
      note = namePrefix + (paymentCode ? `Tip - ${paymentCode}` : 'Tip');
    } else {
      note = namePrefix + (paymentCode ? `Crowd Request - ${paymentCode}` : 'Crowd Request');
    }
    
    // Final safety check - ensure we're under Venmo's 280 character limit
    const maxLength = 280;
    if (note.length > maxLength) {
      // Last resort: truncate but preserve payment code
      if (paymentCode && note.includes(paymentCode)) {
        const codePart = ` - ${paymentCode}`;
        const availableLength = maxLength - codePart.length - 3; // -3 for "..."
        const mainPart = note.substring(0, note.indexOf(codePart));
        note = mainPart.substring(0, availableLength) + '...' + codePart;
      } else {
        note = note.substring(0, maxLength - 3) + '...';
      }
    }
    
    return note;
  };

  const handleCashAppClick = async () => {
    try {
      if (!requestId) {
        throw new Error('Request not created yet. Please fill out the form first.');
      }
      
      // Use updated amount if additional songs were added
      const finalAmount = updatedAmount || amount;
      
      if (!finalAmount || finalAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // Update additional songs before payment
      handleProceedWithPayment('cashapp');
      
      // Use Stripe Checkout with Cash App Pay pre-selected
      setLocalSubmitting(true);
      if (onError) onError('');
      
      console.log('Creating Cash App Pay checkout with:', { requestId, amount: finalAmount });
      const response = await fetch('/api/crowd-request/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          amount: finalAmount,
          preferredPaymentMethod: 'cashapp'
        })
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse checkout response:', parseError);
        throw new Error('Invalid response from server. Please try again.');
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Failed to create checkout session`;
        console.error('Checkout API error:', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          message: data?.message,
          fullData: data
        });
        throw new Error(errorMsg);
      }

      if (data.checkoutUrl) {
        // Update payment method to cashapp before redirecting
        await fetch('/api/crowd-request/update-payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            paymentMethod: 'cashapp'
          })
        });
        
        // Redirect to Stripe Checkout with Cash App Pay
        window.location.href = data.checkoutUrl;
      } else {
        console.error('No checkoutUrl in response:', data);
        throw new Error('No checkout URL received from server');
      }
    } catch (err) {
      console.error('CashApp payment error:', err);
      if (onError) onError(err.message || 'Failed to create checkout session. Please try again.');
      setLocalSubmitting(false);
    }
  };

  const handleVenmoClick = () => {
    try {
      if (!paymentSettings?.venmoUsername) {
        throw new Error('Venmo username is not configured. Please contact support.');
      }
      
      // Use getPaymentAmount() to ensure we include all fees (fast-track, next, bundle, etc.)
      // This is the source of truth for the total payment amount
      // Only fall back to updatedAmount or amount if getPaymentAmount is not available
      let finalAmount;
      if (getPaymentAmount) {
        finalAmount = getPaymentAmount();
      } else {
        // Fallback: Use updated amount if additional songs were added, otherwise use base amount
        finalAmount = updatedAmount || amount;
      }
      
      if (!finalAmount || finalAmount <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      // Update additional songs before payment
      handleProceedWithPayment('venmo');
      
      // Set thank you URL in sessionStorage for consistent flow (same as Stripe)
      // This allows users to easily return to the success page after completing Venmo payment
      if (requestId) {
        const thankYouUrl = `${window.location.origin}/crowd-request/success?request_id=${requestId}`;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('venmo_thank_you_url', thankYouUrl);
          console.log('✅ Set Venmo thank you URL:', thankYouUrl);
        }
      }
      
      // Strip @ from username if present
      const cleanUsername = paymentSettings.venmoUsername.replace(/^@/, '');
      const amountStr = (finalAmount / 100).toFixed(2);
      
      // Build payment note with song/shoutout details
      const paymentNote = buildPaymentNote();
      const encodedNote = encodeURIComponent(paymentNote);
      
      // Get Venmo phone number if available (for fallback in deep link)
      // Venmo deep links can accept phone numbers (digits only) as recipients
      // This prevents phone verification when username lookup fails
      const venmoPhone = paymentSettings?.venmoPhoneNumber || null;
      let recipientsParam = cleanUsername;
      
      // If we have a phone number, use it as primary recipient (more reliable)
      // Venmo will find the user by phone without requiring verification
      // Format: digits only (no dashes, spaces, or +1 prefix)
      if (venmoPhone) {
        const phoneDigits = venmoPhone.replace(/\D/g, ''); // Remove all non-digits
        // Remove leading 1 if present (US country code)
        const cleanPhone = phoneDigits.startsWith('1') && phoneDigits.length === 11 
          ? phoneDigits.substring(1) 
          : phoneDigits;
        
        if (cleanPhone.length === 10) {
          recipientsParam = cleanPhone; // Use phone number - more reliable, no verification needed
          console.log('✅ Using Venmo phone number for deep link (prevents phone verification)');
        } else {
          console.warn('⚠️ Venmo phone number invalid, using username:', cleanPhone);
        }
      } else {
        console.warn('⚠️ No Venmo phone number configured - users may need to verify if they type username manually');
      }
      
      // Generate QR code that points to our redirect page (which opens Venmo app)
      // This prevents users from seeing the username and typing it manually
      // Include request_id so redirect page can send user to success page
      const redirectUrl = `${window.location.origin}/venmo-redirect?recipients=${encodeURIComponent(recipientsParam)}&amount=${encodeURIComponent(amountStr)}&note=${encodeURIComponent(encodedNote)}${requestId ? `&request_id=${requestId}` : ''}`;
      const qr = generateQRCode(redirectUrl);
      setVenmoQr(qr);
      setLocalSelectedMethod('venmo');
      onPaymentMethodSelected('venmo');
      
      // Deep link to Venmo app - use phone number if available (prevents verification)
      const venmoUrl = `venmo://paycharge?txn=pay&recipients=${recipientsParam}&amount=${amountStr}&note=${encodedNote}`;
      
      // Immediately try to open Venmo app (no fallback to web)
      // This ensures users always go through the app, never manually type username
      setTimeout(() => {
        window.location.href = venmoUrl;
      }, 100);
    } catch (err) {
      console.error('Venmo payment error:', err);
      if (onError) onError(err.message || 'Failed to process Venmo payment. Please try again.');
    }
  };

  // Use local state if available, otherwise fall back to prop
  const currentMethod = localSelectedMethod || selectedPaymentMethod;
  const isSubmitting = localSubmitting || submitting;

  // Calculate updated amount when additional songs are added
  // Use manual calculation when we have local additionalSongCount to ensure real-time updates
  const calculateUpdatedAmount = () => {
    if (!getBaseAmount || !bundleDiscount || additionalSongCount === 0) {
      return amount;
    }
    // Calculate manually based on local additionalSongCount for real-time updates
    const baseAmount = getBaseAmount();
    const discountedAmountPerSong = Math.round(baseAmount * (1 - bundleDiscount));
    const additionalSongsTotal = additionalSongCount * discountedAmountPerSong;
    return amount + additionalSongsTotal;
  };

  const updatedAmount = calculateUpdatedAmount();

  // Handle adding/removing additional songs
  const handleAddSongsClick = () => {
    setShowAddSongs(true);
  };

  const handleSongCountChange = (newCount) => {
    const count = Math.max(0, Math.min(newCount, 10)); // Limit to 10 additional songs
    setAdditionalSongCount(count);
    
    // Update additionalSongs array to match count
    if (setAdditionalSongs) {
      const newSongs = [];
      for (let i = 0; i < count; i++) {
        newSongs.push(additionalSongs[i] || { songTitle: '', songArtist: '' });
      }
      setAdditionalSongs(newSongs);
    }
  };

  // Update amount when proceeding with payment
  const handleProceedWithPayment = (paymentMethod) => {
    // Update the amount in parent component if needed
    if (setAdditionalSongs && additionalSongCount > 0) {
      const newSongs = [];
      for (let i = 0; i < additionalSongCount; i++) {
        newSongs.push(additionalSongs[i] || { songTitle: '', songArtist: '' });
      }
      setAdditionalSongs(newSongs);
    }
    onPaymentMethodSelected(paymentMethod);
  };

  return (
    <div className="bg-gray-50 dark:bg-black rounded-2xl shadow-xl p-6 sm:p-8" data-payment-methods>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Payment Method
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Total: <span className="font-bold text-purple-600 dark:text-purple-400">${(updatedAmount / 100).toFixed(2)}</span>
          {additionalSongCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              ({additionalSongCount} additional song{additionalSongCount !== 1 ? 's' : ''} at {Math.round(bundleDiscount * 100)}% off)
            </span>
          )}
        </p>
      </div>

      {currentMethod === 'cashapp' && cashAppQr ? (
        <CashAppPaymentScreen
          qrCode={cashAppQr}
          cashtag={paymentSettings.cashAppTag}
          amount={updatedAmount || amount}
          requestId={requestId}
          paymentCode={paymentCode}
          paymentNote={buildPaymentNote()}
          onBack={() => {
            setLocalSelectedMethod(null);
            setCashAppQr(null);
            onPaymentMethodSelected(null);
          }}
        />
      ) : currentMethod === 'venmo' && venmoQr ? (
        <VenmoPaymentScreen
          qrCode={venmoQr}
          username={paymentSettings.venmoUsername}
          venmoRecipients={venmoRecipientsParam || paymentSettings.venmoUsername.replace(/^@/, '')}
          amount={updatedAmount || amount}
          requestId={requestId}
          paymentCode={paymentCode}
          paymentNote={buildPaymentNote()}
          onBack={() => {
            setLocalSelectedMethod(null);
            setVenmoQr(null);
            onPaymentMethodSelected(null);
          }}
        />
      ) : currentMethod === 'card' ? (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Redirecting to secure payment...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* CashApp Button - Only show if enabled */}
          {paymentSettings?.paymentMethodCashappEnabled !== false && (
          <button
            type="button"
            onClick={handleCashAppClick}
            disabled={isSubmitting}
            className="group relative w-full p-5 rounded-2xl border-2 border-green-500/80 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 dark:from-green-950/40 dark:via-emerald-950/30 dark:to-green-950/40 hover:from-green-100 hover:via-emerald-100 hover:to-green-100 dark:hover:from-green-900/50 dark:hover:via-emerald-900/40 dark:hover:to-green-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-green-500/10 hover:shadow-xl hover:shadow-green-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-green-400/5 to-green-400/10 group-hover:from-green-400/5 group-hover:via-green-400/10 group-hover:to-green-400/15 transition-all duration-300"></div>
            <div className="relative flex items-center justify-start gap-4 pl-2">
              <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M31.453 4.625c-0.688-1.891-2.177-3.375-4.068-4.063-1.745-0.563-3.333-0.563-6.557-0.563h-9.682c-3.198 0-4.813 0-6.531 0.531-1.896 0.693-3.385 2.188-4.068 4.083-0.547 1.734-0.547 3.333-0.547 6.531v9.693c0 3.214 0 4.802 0.531 6.536 0.688 1.891 2.177 3.375 4.068 4.063 1.734 0.547 3.333 0.547 6.536 0.547h9.703c3.214 0 4.813 0 6.536-0.531 1.896-0.688 3.391-2.182 4.078-4.078 0.547-1.734 0.547-3.333 0.547-6.536v-9.667c0-3.214 0-4.813-0.547-6.547zM23.229 10.802l-1.245 1.24c-0.25 0.229-0.635 0.234-0.891 0.010-1.203-1.010-2.724-1.568-4.292-1.573-1.297 0-2.589 0.427-2.589 1.615 0 1.198 1.385 1.599 2.984 2.198 2.802 0.938 5.12 2.109 5.12 4.854 0 2.99-2.318 5.042-6.104 5.266l-0.349 1.604c-0.063 0.302-0.328 0.516-0.635 0.516h-2.391l-0.12-0.010c-0.354-0.078-0.578-0.432-0.505-0.786l0.375-1.693c-1.438-0.359-2.76-1.083-3.844-2.094v-0.016c-0.25-0.25-0.25-0.656 0-0.906l1.333-1.292c0.255-0.234 0.646-0.234 0.896 0 1.214 1.146 2.839 1.786 4.521 1.76 1.734 0 2.891-0.734 2.891-1.896s-1.172-1.464-3.385-2.292c-2.349-0.839-4.573-2.026-4.573-4.802 0-3.224 2.677-4.797 5.854-4.943l0.333-1.641c0.063-0.302 0.333-0.516 0.641-0.51h2.37l0.135 0.016c0.344 0.078 0.573 0.411 0.495 0.76l-0.359 1.828c1.198 0.396 2.333 1.026 3.302 1.849l0.031 0.031c0.25 0.266 0.25 0.667 0 0.906z" className="text-green-600 dark:text-green-400"/>
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Pay with CashApp
              </span>
            </div>
          </button>
          )}

          {/* Venmo Button - Only show if enabled AND username is configured */}
          {paymentSettings?.paymentMethodVenmoEnabled !== false && paymentSettings?.venmoUsername && (
          <button
            type="button"
            onClick={handleVenmoClick}
            className="group relative w-full p-5 rounded-2xl border-2 border-blue-500/80 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 hover:from-blue-100 hover:via-cyan-100 hover:to-blue-100 dark:hover:from-gray-800 dark:hover:via-gray-800 dark:hover:to-gray-800 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-blue-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/0 via-blue-400/5 to-blue-400/10 group-hover:from-blue-400/5 group-hover:via-blue-400/10 group-hover:to-blue-400/15 transition-all duration-300"></div>
            <div className="relative flex items-center justify-start gap-4 pl-2">
              <div className="w-14 h-14 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow p-2.5 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40.25,4.45a14.26,14.26,0,0,1,2.06,7.8c0,9.72-8.3,22.34-15,31.2H11.91L5.74,6.58,19.21,5.3l3.27,26.24c3.05-5,6.81-12.76,6.81-18.08A14.51,14.51,0,0,0,28,6.94Z" className="text-blue-600 dark:text-blue-400"/>
                </svg>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Pay with Venmo
              </span>
            </div>
          </button>
          )}

          {/* Card/Stripe Button - Only show if enabled */}
          {paymentSettings?.paymentMethodCardEnabled !== false && (
          <button
            type="button"
            onClick={() => onPaymentMethodSelected('card')}
            disabled={isSubmitting}
            className="group relative w-full p-5 rounded-2xl border-2 border-purple-500/80 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 dark:from-purple-950/40 dark:via-pink-950/30 dark:to-purple-950/40 hover:from-purple-100 hover:via-pink-100 hover:to-purple-100 dark:hover:from-purple-900/50 dark:hover:via-pink-900/40 dark:hover:to-purple-900/50 transition-all duration-300 touch-manipulation overflow-hidden shadow-md shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/25 hover:scale-[1.01] active:scale-[0.99] hover:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/0 via-purple-400/5 to-purple-400/10 group-hover:from-purple-400/5 group-hover:via-purple-400/10 group-hover:to-purple-400/15 transition-all duration-300"></div>
            <div className="relative flex items-center justify-start gap-4 pl-2">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Pay with Card
              </span>
            </div>
          </button>
          )}

          {/* Apple Pay Button - Only show if card is enabled */}
          {paymentSettings?.paymentMethodCardEnabled !== false && (
          <button
            type="button"
            onClick={() => handleProceedWithPayment('card')}
            disabled={isSubmitting}
            className="group relative w-full p-4 rounded-lg bg-black hover:bg-gray-900 active:bg-gray-800 transition-all duration-200 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              <span className="text-white font-semibold text-base font-sans tracking-tight">
                Pay
              </span>
            </div>
          </button>
          )}

          {/* Add More Songs Link - Only show for song requests */}
          {requestType === 'song_request' && bundleDiscountEnabled && bundleDiscount > 0 && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleAddSongsClick}
                className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 underline transition-colors"
              >
                Add more songs last minute for a {Math.round(bundleDiscount * 100)}% discount
              </button>
            </div>
          )}

          {/* Add Songs UI */}
          {showAddSongs && requestType === 'song_request' && bundleDiscountEnabled && bundleDiscount > 0 && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-black rounded-xl border border-purple-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Add More Songs ({Math.round(bundleDiscount * 100)}% discount)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSongs(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  How many additional songs?
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSongCountChange(additionalSongCount - 1)}
                    disabled={additionalSongCount === 0}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[2rem] text-center">
                    {additionalSongCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSongCountChange(additionalSongCount + 1)}
                    disabled={additionalSongCount >= 10}
                    className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {additionalSongCount > 0 && getBaseAmount && (
                <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-purple-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Original amount:</span>
                      <span>${(amount / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{additionalSongCount} additional song{additionalSongCount !== 1 ? 's' : ''} ({Math.round(bundleDiscount * 100)}% off):</span>
                      <span className="text-green-600 dark:text-green-400">
                        +${((updatedAmount - amount) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                      <span>New Total:</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        ${(updatedAmount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                You can enter song names and artist names after payment.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onBack}
            className="w-full mt-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            ← Back to form
          </button>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default React.memo(PaymentMethodSelection);

