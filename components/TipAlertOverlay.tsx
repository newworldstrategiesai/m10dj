'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import confetti from 'canvas-confetti';
import { playSound } from '@/components/tipjar/stream-alerts/soundEffects';
import { AlertDisplay } from '@/components/tipjar/stream-alerts/AlertDisplay';

interface TipAlert {
  id: string;
  amount: number;
  name: string;
  message?: string;
  timestamp: string;
}

interface TipAlertOverlayProps {
  roomName: string;
  theme?: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
}

export function TipAlertOverlay({ roomName, theme = 'dark' }: TipAlertOverlayProps) {
  const [currentAlert, setCurrentAlert] = useState<TipAlert | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to tip alerts from live stream
    const channel = supabase
      .channel(`live_events:${roomName}`)
      .on(
        'broadcast',
        { event: 'new_tip' },
        (payload) => {
          const tipData = payload.payload as TipAlert;
          
          // Show alert
          setCurrentAlert(tipData);

          // Play sound
          playSound('celebration', 0.8);

          // Confetti for tips >= $10
          if (tipData.amount >= 10) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3'],
            });
          }

          // Auto-hide after 5 seconds
          setTimeout(() => {
            setCurrentAlert(null);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomName, supabase]);

  if (!currentAlert) return null;

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-black/90 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border-2 border-purple-500 animate-fade-in-up">
        <div className="text-center">
          <div className="text-6xl mb-2">💰</div>
          <div className="text-4xl font-bold text-white mb-2">
            ${currentAlert.amount.toFixed(2)}
          </div>
          <div className="text-2xl font-semibold text-purple-300 mb-1">
            {currentAlert.name}
          </div>
          {currentAlert.message && (
            <div className="text-xl text-gray-300">
              "{currentAlert.message}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

