'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Star,
  Zap,
  Music,
  Gamepad2,
  Heart,
  X
} from 'lucide-react';

interface UpgradePromptProps {
  variant?: 'banner' | 'card' | 'inline';
  feature?: string;
  onClose?: () => void;
  compact?: boolean;
}

export default function UpgradePrompt({
  variant = 'card',
  feature,
  onClose,
  compact = false
}: UpgradePromptProps) {
  const benefits = [
    { icon: Music, text: 'Full song versions' },
    { icon: Gamepad2, text: 'Premium quizzes' },
    { icon: Star, text: 'Exclusive playlists' },
    { icon: Heart, text: 'Ad-free experience' },
    { icon: Zap, text: 'Advanced features' }
  ];

  if (variant === 'banner') {
    return (
      <div className="relative karaoke-gradient-primary rounded-2xl p-6 text-white shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-yellow-300" />
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                K Premium
              </Badge>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              Unlock Premium Features
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-md">
              {feature
                ? `Get access to premium ${feature} and much more`
                : 'Sing without limits with full versions of songs and premium features'
              }
            </p>
            <Button className="bg-white text-pink-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg shadow-xl">
              <Crown className="w-5 h-5 mr-2" />
              Upgrade Now
            </Button>
          </div>

          {/* K Logo */}
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ml-8">
            <span className="text-white font-bold text-3xl">K</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-gray-300">
            {feature ? `Premium ${feature}` : 'Premium feature'}
          </span>
          <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
      <div className="text-center space-y-4">
        {/* Header */}
        <div className="flex items-center justify-center gap-2">
          <Crown className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-white">K Premium</h3>
          <Badge className="bg-yellow-500/20 text-yellow-300">Upgrade</Badge>
        </div>

        {/* Description */}
        <p className="text-gray-300 max-w-sm mx-auto">
          {feature
            ? `Unlock premium ${feature} and get unlimited access to all features`
            : 'Get unlimited access to full song versions, premium playlists, and exclusive features'
          }
        </p>

        {/* Benefits */}
        {!compact && (
          <div className="grid grid-cols-1 gap-2 text-sm">
            {benefits.slice(0, 3).map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-300">
                <benefit.icon className="w-4 h-4 text-yellow-400" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
      </div>
    </div>
  );
}