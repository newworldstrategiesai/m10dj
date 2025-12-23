import React from 'react';
import { CheckCircle, Clock, TrendingUp, Share2, QrCode, Bell, X, Trophy, Users, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function BidSuccessModal({
  isOpen,
  onClose,
  bidAmount,
  songTitle,
  songArtist,
  isWinning,
  currentWinningBid,
  timeRemaining,
  roundNumber,
  onIncreaseBid,
  onViewAllBids,
  onShare,
  onGetNotifications,
  organizationId
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-green-600 dark:text-green-400';
    if (timeRemaining > 300) return 'text-yellow-600 dark:text-yellow-400';
    if (timeRemaining > 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400 animate-pulse';
  };

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/bid?round=${roundNumber || 'current'}`
    : '';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I just bid $${(bidAmount / 100).toFixed(2)} on ${songTitle}!`,
          text: `Beat my bid and get your song played first!`,
          url: shareUrl
        });
      } catch (err) {
        // User cancelled or error
        if (onShare) onShare();
      }
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      }
      if (onShare) onShare();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-white dark:bg-gray-900 border-2 border-purple-500/20 rounded-xl sm:rounded-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center mb-2">
              Bid Placed Successfully! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-white/90 text-base sm:text-lg">
              Your bid of <span className="font-bold text-xl">${(bidAmount / 100).toFixed(2)}</span> has been entered into Round #{roundNumber || 'Current'}
            </DialogDescription>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Song Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-semibold text-gray-900 dark:text-white">Song Request</span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{songTitle}</p>
            {songArtist && (
              <p className="text-sm text-gray-600 dark:text-gray-400">by {songArtist}</p>
            )}
          </div>

          {/* Status */}
          {isWinning ? (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                <span className="font-bold text-green-900 dark:text-green-100 text-lg">
                  🏆 You're Currently in the Lead!
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your bid is the highest. Keep an eye out - others might try to outbid you!
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                <span className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">
                  Current Winning Bid: ${(currentWinningBid / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                Someone has a higher bid. Increase yours to take the lead!
              </p>
              <button
                onClick={onIncreaseBid}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Increase Your Bid
              </button>
            </div>
          )}

          {/* Round Timer */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${getTimeColor()}`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Round Ends In</span>
              </div>
              <span className={`text-2xl font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            {timeRemaining < 300 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                ⚠️ Round ending soon! Last chance to increase your bid!
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onIncreaseBid}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-400 hover:to-pink-400 transition-all"
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-semibold">Increase Bid</span>
            </button>
            
            <button
              onClick={onViewAllBids}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-semibold">View All Bids</span>
            </button>
          </div>

          {/* Notification Opt-in */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Get Notified When Outbid
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  We'll send you an instant notification if someone outbids you, so you can increase your bid right away!
                </p>
                <button
                  onClick={onGetNotifications}
                  className="w-full py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 transition-all flex items-center justify-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </button>
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center">
              Share this round and get your friends to bid!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Share</span>
              </button>
              <button
                onClick={() => {
                  // Generate QR code (would need QR library)
                  alert('QR code feature coming soon!');
                }}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                title="Get QR Code"
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
          >
            Continue to Bidding Round
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

