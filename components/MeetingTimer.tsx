'use client';

/**
 * Master meeting timer - visible to all participants.
 * Uses startedAt (from meet_rooms) so everyone sees total stream time, including
 * after re-join. Falls back to room metadata or local join time if not provided.
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

export interface MeetingTimerProps {
  /** Master stream start time (ms). All participants see elapsed from this. */
  startedAt?: number;
}

export function MeetingTimer({ startedAt: startedAtProp }: MeetingTimerProps) {
  const { metadata } = useRoomInfo();
  const [elapsed, setElapsed] = React.useState(0);
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let startedAt: number | null = startedAtProp ?? null;
    if (startedAt == null && metadata) {
      try {
        const parsed = JSON.parse(metadata) as { startedAt?: number };
        if (typeof parsed.startedAt === 'number') {
          startedAt = parsed.startedAt;
        }
      } catch {
        // ignore
      }
    }
    if (startedAt == null) {
      startedAt = startTimeRef.current ?? Date.now();
      startTimeRef.current = startedAt;
    }

    const tick = () => {
      setElapsed(Date.now() - startedAt!);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAtProp, metadata]);

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
