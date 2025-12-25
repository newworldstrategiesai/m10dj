/**
 * "Add to Wallet" Button Component
 * 
 * Since Apple Wallet requires paid developer credentials ($99/year),
 * this creates a mobile-optimized ticket page that:
 * - Works on ALL devices (iPhone, Android, desktop)
 * - Can be saved to home screen (works like a wallet card)
 * - Displays beautifully on mobile devices
 * - No APIs or developer accounts needed!
 * 
 * The ticket page itself is already mobile-optimized and can be
 * bookmarked/saved to home screen for easy access.
 */

import { Smartphone, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function AddToWalletButton({ ticketId, className = '' }) {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleShare = () => {
    if (typeof window === 'undefined') return;

    const ticketUrl = `${window.location.origin}/events/tickets/${ticketId}`;

    // Use Web Share API if available (mobile devices)
    if (navigator.share) {
      navigator.share({
        title: 'My Event Ticket',
        text: 'Save this ticket to your device',
        url: ticketUrl,
      }).catch((error) => {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(ticketUrl).then(() => {
        alert('Ticket link copied! Open it on your mobile device and save to home screen.');
      });
    }
  };

  return (
    <div className={className}>
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      >
        <Smartphone className="w-5 h-5 mr-2" />
        Save Ticket
      </button>
      
      {showInstructions && (
        <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How to Save Your Ticket:</h4>
          <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li className="flex items-start">
              <span className="mr-2">📱</span>
              <span><strong>iPhone:</strong> Tap Share button → Add to Home Screen</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🤖</span>
              <span><strong>Android:</strong> Tap Menu (⋮) → Add to Home Screen</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">💻</span>
              <span><strong>Desktop:</strong> Bookmark this page or use Share button</span>
            </li>
          </ul>
          <button
            onClick={handleShare}
            className="mt-3 inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Share Ticket Link
          </button>
        </div>
      )}
    </div>
  );
}
