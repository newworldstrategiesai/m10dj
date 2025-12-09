'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { getThemeStyles } from './themes';
import { playSound } from './soundEffects';
import { speakText } from './textToSpeech';

interface AlertEvent {
  id: string;
  event_type: 'tip' | 'song_request' | 'merch_purchase' | 'follower' | 'subscriber';
  event_data: any;
  created_at: string;
}

interface StreamAlertConfig {
  theme: 'dark' | 'neon' | 'retro' | 'minimal' | 'pride';
  font_color: string;
  alert_duration_ms: number;
  sound_enabled: boolean;
  sound_volume: number;
  sound_file_url: string | null;
  built_in_sound: 'default' | 'cash' | 'coin' | 'success' | 'celebration';
  tts_enabled: boolean;
}

interface AlertDisplayProps {
  event: AlertEvent;
  config: StreamAlertConfig;
  onComplete: () => void;
}

export function AlertDisplay({ event, config, onComplete }: AlertDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const themeStyles = getThemeStyles(config.theme);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Play sound
    if (config.sound_enabled) {
      if (config.sound_file_url) {
        playSound(config.sound_file_url, config.sound_volume);
      } else {
        playSound(config.built_in_sound, config.sound_volume);
      }
    }

    // Trigger confetti for tips >= $10
    if (event.event_type === 'tip' && event.event_data?.amount >= 10) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: themeStyles.confettiColors,
      });
    }

    // Text-to-speech
    if (config.tts_enabled) {
      const ttsText = getTTSText(event);
      if (ttsText) {
        speakText(ttsText);
      }
    }

    // Auto-hide after duration
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onComplete();
      }, 500); // Exit animation duration
    }, config.alert_duration_ms);

    return () => clearTimeout(timer);
  }, [event, config, onComplete, themeStyles.confettiColors]);

  const renderContent = () => {
    switch (event.event_type) {
      case 'tip':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">💰</div>
            <div className="text-4xl font-bold mb-2" style={{ color: config.font_color }}>
              ${parseFloat(event.event_data.amount || 0).toFixed(2)}
            </div>
            <div className="text-2xl font-semibold mb-1" style={{ color: config.font_color }}>
              {event.event_data.name || 'Anonymous'}
            </div>
            {event.event_data.message && (
              <div className="text-xl opacity-90" style={{ color: config.font_color }}>
                "{event.event_data.message}"
              </div>
            )}
          </div>
        );

      case 'song_request':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">🎵</div>
            <div className="text-2xl font-semibold mb-1" style={{ color: config.font_color }}>
              {event.event_data.name || 'Anonymous'}
            </div>
            <div className="text-xl font-bold mb-1" style={{ color: config.font_color }}>
              {event.event_data.song_title}
            </div>
            <div className="text-lg opacity-80" style={{ color: config.font_color }}>
              by {event.event_data.artist}
            </div>
          </div>
        );

      case 'merch_purchase':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">🛍️</div>
            <div className="text-2xl font-semibold mb-1" style={{ color: config.font_color }}>
              {event.event_data.name || 'Anonymous'}
            </div>
            <div className="text-xl font-bold" style={{ color: config.font_color }}>
              Purchased: {event.event_data.item_name}
            </div>
          </div>
        );

      case 'follower':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">👋</div>
            <div className="text-2xl font-semibold" style={{ color: config.font_color }}>
              {event.event_data.name || 'Someone'} just followed!
            </div>
          </div>
        );

      case 'subscriber':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">⭐</div>
            <div className="text-2xl font-semibold mb-1" style={{ color: config.font_color }}>
              {event.event_data.name || 'Someone'}
            </div>
            <div className="text-xl font-bold" style={{ color: config.font_color }}>
              Subscribed! {event.event_data.tier ? `(${event.event_data.tier})` : ''}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTTSText = (event: AlertEvent): string | null => {
    switch (event.event_type) {
      case 'tip':
        return `${event.event_data.name || 'Someone'} tipped $${parseFloat(event.event_data.amount || 0).toFixed(2)}${event.event_data.message ? `. ${event.event_data.message}` : ''}`;
      case 'song_request':
        return `${event.event_data.name || 'Someone'} requested ${event.event_data.song_title} by ${event.event_data.artist}`;
      case 'merch_purchase':
        return `${event.event_data.name || 'Someone'} purchased ${event.event_data.item_name}`;
      case 'follower':
        return `${event.event_data.name || 'Someone'} just followed!`;
      case 'subscriber':
        return `${event.event_data.name || 'Someone'} just subscribed!`;
      default:
        return null;
    }
  };

  return (
    <div
      className={`transition-all duration-500 ${
        isVisible && !isExiting
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-4'
      }`}
      style={{
        ...themeStyles.alertContainer,
        color: config.font_color,
      }}
    >
      <div
        className="px-8 py-6 rounded-2xl shadow-2xl backdrop-blur-sm"
        style={themeStyles.alertBox}
      >
        {renderContent()}
      </div>
    </div>
  );
}

