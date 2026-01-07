/**
 * Confetti Utility
 * 
 * Reusable confetti animation function used throughout the app
 */

import confetti from 'canvas-confetti';

export function triggerConfetti(options?: {
  duration?: number;
  colors?: string[];
  particleCount?: number;
  origin?: { x?: number; y?: number };
}) {
  const duration = options?.duration || 3000; // 3 seconds
  const animationEnd = Date.now() + duration;
  const colors = options?.colors || ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  
  // Use a high z-index to ensure confetti appears on top of all content
  const defaults = { 
    startVelocity: 30, 
    spread: 360, 
    ticks: 60, 
    zIndex: 9999,
    colors 
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = (options?.particleCount || 50) * (timeLeft / duration);
    
    // Launch confetti from both sides
    confetti({
      ...defaults,
      particleCount,
      origin: { 
        x: options?.origin?.x ?? randomInRange(0.1, 0.3), 
        y: options?.origin?.y ?? Math.random() - 0.2 
      }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { 
        x: options?.origin?.x ?? randomInRange(0.7, 0.9), 
        y: options?.origin?.y ?? Math.random() - 0.2 
      }
    });
  }, 250);

  // Also do a big burst from the center
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: options?.particleCount || 100,
      origin: { x: 0.5, y: 0.5 }
    });
  }, 100);
}

/**
 * Quick confetti burst - shorter duration, fewer particles
 */
export function triggerQuickConfetti(options?: {
  colors?: string[];
  origin?: { x?: number; y?: number };
}) {
  const colors = options?.colors || ['#9333ea', '#ec4899', '#3b82f6', '#10b981'];
  
  confetti({
    particleCount: 50,
    spread: 70,
    origin: options?.origin || { y: 0.6 },
    colors,
    zIndex: 9999
  });
}

