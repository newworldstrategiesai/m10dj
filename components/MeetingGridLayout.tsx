'use client';

/**
 * MeetingGridLayout - Responsive grid for video meeting participants.
 * - Mobile: 2 cols (8+ tiles with scroll)
 * - Tablet (sm): 3 cols
 * - md: 4 cols, lg: 5 cols, xl: 6 cols, 2xl: 8 cols, 1800px+: 10 cols
 * - Laptop/tablet/desktop show more than 8 tiles
 * - Grid scrolls when participants exceed visible area
 * - Includes chat UI (same as LiveKit VideoConference prebuild)
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
  Chat,
} from '@livekit/components-react';
import type { WidgetState } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';

export function MeetingGridLayout() {
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: false,
    unreadMessages: 0,
    showSettings: false,
  });

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false },
  );

  const layoutContext = useCreateLayoutContext();

  return (
    <LayoutContextProvider value={layoutContext} onWidgetChange={setWidgetState}>
      <div className="lk-video-conference h-full w-full">
        <div className="lk-video-conference-inner flex-1 min-w-0 flex flex-col min-h-0">
          <div className="lk-grid-layout flex-1 min-h-0 overflow-auto p-1">
            <div className="grid gap-1 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 min-[1800px]:grid-cols-10">
              <TrackLoop tracks={tracks}>
                <div className="aspect-square min-w-0 min-h-0 overflow-hidden [&>div]:!h-full [&>div]:!min-h-0">
                  <ParticipantTile className="!h-full !w-full !min-h-0" />
                </div>
              </TrackLoop>
            </div>
          </div>
          <ControlBar controls={{ chat: true, settings: false }} />
        </div>
        <Chat style={{ display: widgetState.showChat ? 'grid' : 'none' }} />
      </div>
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LayoutContextProvider>
  );
}
