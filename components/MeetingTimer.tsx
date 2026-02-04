'use client';

/**
 * Master meeting timer - visible to all participants.
 * Uses room metadata (startedAt) set by webhook when room starts.
 * Small, non-intrusive, readable.
 */
import * as React from 'react';
import { useRoomInfo } from '@livekit/components-react';

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function MeetingTimer() {
  const { metadata } = useRoomInfo();
  const [elapsed, setElapsed] = React.useState(0);
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let startedAt: number | null = null;
    if (metadata) {
      try {
        const parsed = JSON.parse(metadata) as { startedAt?: number };
        if (typeof parsed.startedAt === 'number') {
          startedAt = parsed.startedAt;
        }
      } catch {
        // ignore
      }
    }
    if (!startedAt) {
      startedAt = startTimeRef.current ?? Date.now();
      startTimeRef.current = startedAt;
    }

    const tick = () => {
      setElapsed(Date.now() - startedAt!);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [metadata]);

  return (
    <div
      className="absolute top-2 left-2 z-20 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm font-mono text-sm font-medium text-white tabular-nums select-none"
      aria-live="polite"
      aria-label={`Meeting duration: ${formatElapsed(elapsed)}`}
    >
      {formatElapsed(elapsed)}
    </div>
  );
}
