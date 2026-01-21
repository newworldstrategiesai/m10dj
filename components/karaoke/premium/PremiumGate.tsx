'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Crown,
  Lock,
  Star,
  Zap,
  Music,
  Gamepad2,
  Heart,
  Play
} from 'lucide-react';

interface PremiumGateProps {
  isPremium: boolean;
  children: ReactNode;
  feature?: 'song' | 'playlist' | 'quiz' | 'feature';
  showUpgrade?: boolean;
  compact?: boolean;
  fallback?: ReactNode;
}

export default function PremiumGate({
  isPremium,
  children,
  feature = 'feature',
  showUpgrade = true,
  compact = false,
  fallback
}: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getFeatureIcon = () => {
    switch (feature) {
      case 'song':
        return <Music className="w-5 h-5" />;
      case 'playlist':
        return <Play className="w-5 h-5" />;
      case 'quiz':
        return <Gamepad2 className="w-5 h-5" />;
      default:
        return <Crown className="w-5 h-5" />;
    }
  };

  const getFeatureText = () => {
    switch (feature) {
      case 'song':
        return 'Premium Song';
      case 'playlist':
        return 'Premium Playlist';
      case 'quiz':
        return 'Premium Quiz';
      default:
        return 'Premium Feature';
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2 text-yellow-400">
            <Lock className="w-4 h-4" />
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Premium</span>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return (
    <Card className="karaoke-card border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          {/* Premium Icon */}
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <Lock className="w-3 h-3 text-gray-900" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white flex items-center justify-center gap-2">
              {getFeatureIcon()}
              {getFeatureText()}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Unlock full access to premium {feature === 'song' ? 'songs' : feature === 'playlist' ? 'playlists' : feature === 'quiz' ? 'quizzes' : 'features'} with K Premium
            </p>
          </div>

          {/* Benefits */}
          <div className="flex justify-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Full Song Versions</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Premium Playlists</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-yellow-400" />
              <span>Ad-Free Experience</span>
            </div>
          </div>

          {/* Upgrade Button */}
          {showUpgrade && (
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold px-8 py-3 shadow-lg">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
            </Button>
          )}

          {/* Subtle hint */}
          <p className="text-xs text-gray-500">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </CardContent>
    </Card>
  );
}