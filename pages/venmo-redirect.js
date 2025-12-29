// Intermediate redirect page for Venmo payments
// This page automatically opens the Venmo app via deep link
// Prevents users from manually typing the username

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';

export default function VenmoRedirect() {
  const router = useRouter();
  const [attempted, setAttempted] = useState(false);
  const { recipients, amount, note, request_id } = router.query;

  useEffect(() => {
    if (!recipients || !amount) {
      // Missing required parameters
      return;
    }

    if (attempted) {
      // Already attempted, don't try again
      return;
    }

    setAttempted(true);

    // Build the Venmo deep link
    // recipients can be either phone number (10 digits) or username
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(recipients)}&amount=${encodeURIComponent(amount)}${note ? `&note=${encodeURIComponent(note)}` : ''}`;
    
    // Try to open Venmo app immediately
    // This prevents users from seeing the username and typing it manually
    window.location.href = venmoUrl;

    // After opening Venmo, redirect to success page (same as Stripe flow)
    // Check sessionStorage first, then use request_id from query params
    const thankYouUrl = typeof window !== 'undefined' 
      ? sessionStorage.getItem('venmo_thank_you_url') 
      : null;
    
    const successUrl = thankYouUrl || (request_id 
      ? `${window.location.origin}/crowd-request/success?request_id=${request_id}`
      : null);

    if (successUrl) {
      // Redirect to success page after a delay to allow Venmo app to open
      const timeout = setTimeout(() => {
        window.location.href = successUrl;
      }, 2000);
      
      return () => clearTimeout(timeout);
    }

    // Note: We don't set a timeout fallback because we want users to ALWAYS use the app
    // If the app doesn't open, they need to install it - we don't want them typing the username manually
  }, [recipients, amount, note, request_id, attempted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Opening Venmo...
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please wait while we open the Venmo app for you.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          If Venmo doesn't open automatically, make sure you have the Venmo app installed.
        </p>
      </div>
    </div>
  );
}

