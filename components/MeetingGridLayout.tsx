'use client';

/**
 * MeetingGridLayout - Responsive grid for video meeting participants.
 * Dynamic layout based on participant count and screen size:
 * - 2 users: 2 cols, fills screen (50% each)
 * - 3-4: 2 cols, 5-6: 3 cols
 * - 7+: more cols, scrollable
 * - Fewer participants = larger tiles, better space use
 */
import {
  useTracks,
  TrackLoop,
  ParticipantTile,
  ControlBar,
  RoomAudioRenderer,
  ConnectionStateToast,
  LayoutContextProvider,
  useCreateLayoutContext,
  usePinnedTracks,
  useMaybeLayoutContext,
  FocusLayoutContainer,
  FocusLayout,
  CarouselLayout,
  Chat,
} from '@livekit/components-react';
import { isEqualTrackRef, isTrackReference } from '@livekit/components-core';
import type { WidgetState } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';

function useOptimalGrid(trackCount: number) {
  const [cols, setCols] = React.useState(2);
  const [rows, setRows] = React.useState(1);

  const update = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const n = Math.max(1, trackCount);
    const w = window.innerWidth;

    const colsForCount = n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
    const maxCols = w < 640 ? 2 : w < 1024 ? 3 : w < 1536 ? 5 : 6;
    const c = Math.min(colsForCount, maxCols);
    const r = Math.ceil(n / c);
    setCols(c);
    setRows(r);
  }, [trackCount]);

  React.useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  return { cols, rows, fillMode: trackCount <= 6 };
}

function MeetingGridInner() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const { cols, rows, fillMode } = useOptimalGrid(tracks.length);
  const layoutContext = useMaybeLayoutContext();
  const focusTrack = usePinnedTracks()?.[0];
  const carouselTracks = tracks.filter((t) => !focusTrack || !isEqualTrackRef(t, focusTrack));

  const screenShareTracks = tracks.filter(
    (t) => isTrackReference(t) && t.publication?.source === Track.Source.ScreenShare
  );
  const lastScreenShareRef = React.useRef<typeof tracks[0] | null>(null);
  React.useEffect(() => {
    if (!layoutContext?.pin?.dispatch) return;
    const activeScreenShare = screenShareTracks.find((t) => isTrackReference(t) && t.publication?.isSubscribed);
    if (activeScreenShare && lastScreenShareRef.current !== activeScreenShare) {
      lastScreenShareRef.current = activeScreenShare;
      layoutContext.pin.dispatch({ msg: 'set_pin', trackReference: activeScreenShare });
    } else if (!activeScreenShare && lastScreenShareRef.current) {
      lastScreenShareRef.current = null;
      layoutContext.pin.dispatch({ msg: 'clear_pin' });
    }
  }, [screenShareTracks, layoutContext?.pin]);

  const gridStyle: React.CSSProperties = fillMode
    ? {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }
    : {
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: 'minmax(140px, 1fr)',
      };

  return (
    <div className="lk-video-conference h-full w-full">
      <div className="lk-video-conference-inner flex-1 min-w-0 flex flex-col min-h-0">
        <div className={`lk-grid-layout flex-1 min-h-0 p-1 ${!focusTrack && fillMode ? 'overflow-hidden' : 'overflow-auto'}`}>
          {focusTrack ? (
            <div className="lk-focus-layout-wrapper flex-1 min-h-0 w-full">
              <FocusLayoutContainer className="h-full w-full">
                <CarouselLayout tracks={carouselTracks}>
                  <ParticipantTile />
                </CarouselLayout>
                {focusTrack && isTrackReference(focusTrack) && (
                  <FocusLayout trackRef={focusTrack} />
                )}
              </FocusLayoutContainer>
            </div>
          ) : (
            <div className="grid gap-1 w-full h-full min-h-0" style={gridStyle}>
              <TrackLoop tracks={tracks}>
                <div className="min-w-0 min-h-0 w-full h-full overflow-hidden [&>div]:!h-full [&>div]:!min-h-0">
                  <ParticipantTile className="!h-full !w-full !min-h-0" />
                </div>
              </TrackLoop>
            </div>
          )}
        </div>
        <ControlBar controls={{ chat: true, settings: false, camera: true, microphone: true, screenShare: true }} saveUserChoices={false} />
      </div>
    </div>
  );
}

export function MeetingGridLayout() {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });
  const layoutContext = useCreateLayoutContext();

  return (
    <LayoutContextProvider value={layoutContext} onWidgetChange={setWidgetState}>
      <MeetingGridInner />
      <Chat style={{ display: widgetState.showChat ? 'grid' : 'none' }} />
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LayoutContextProvider>
  );
}
