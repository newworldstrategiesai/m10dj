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
  DisconnectButton,
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
  TrackRefContext,
  useTranscriptions,
} from '@livekit/components-react';
import { MeetControlBar } from '@/components/MeetControlBar';
import { ChevronLeft, ChevronRight, MessageSquare, Circle, Power, FileText, Music, User } from 'lucide-react';
import { MeetParticipantControls } from '@/components/MeetParticipantControls';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { MeetingTimer } from '@/components/MeetingTimer';
import { isEqualTrackRef, isTrackReference } from '@livekit/components-core';
import type { WidgetState } from '@livekit/components-core';
import { RoomEvent, Track } from 'livekit-client';
import * as React from 'react';
import dynamic from 'next/dynamic';

const GeneralRequestsPage = dynamic(
  () => import('@/pages/requests').then((mod) => mod.GeneralRequestsPage),
  { ssr: false }
);

function MeetRequestSongPanel({
  organizationId,
  organizationData,
}: {
  organizationId: string;
  organizationData?: Record<string, unknown>;
}) {
  const organizationName = typeof organizationData?.name === 'string' ? organizationData.name : undefined;
  const RequestsPanel = GeneralRequestsPage as React.ComponentType<{
    organizationId?: string | null;
    organizationName?: string | null;
    organizationData?: Record<string, unknown> | null;
    embedMode?: boolean;
    minimalHeader?: boolean;
    meetPanel?: boolean;
  }>;
  return (
    <RequestsPanel
      organizationId={organizationId}
      organizationName={organizationName ?? null}
      organizationData={organizationData ?? null}
      embedMode={true}
      minimalHeader={true}
      meetPanel={true}
    />
  );
}

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

function MeetTranscriptStrip() {
  const transcriptions = useTranscriptions();
  const [expanded, setExpanded] = React.useState(false);
  if (transcriptions.length === 0) return null;
  return (
    <div className="flex flex-col flex-shrink-0 w-full border-t border-gray-800 bg-gray-900/80 dark:bg-gray-950/80">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
      >
        <FileText className="h-4 w-4 text-gray-400" />
        <span>Live transcript</span>
        <span className="text-xs text-gray-500">({transcriptions.length})</span>
      </button>
      {expanded && (
        <div className="max-h-32 overflow-y-auto px-3 pb-2 space-y-1 text-xs text-gray-400">
          {transcriptions.map((t, i) => (
            <div key={i} className="flex gap-2">
              <span className="flex-shrink-0 font-medium text-gray-500">
                {(t as { participantInfo?: { name?: string; identity?: string } }).participantInfo?.name ??
                  (t as { participantInfo?: { identity?: string } }).participantInfo?.identity ??
                  'Speaker'}:
              </span>
              <span className="text-gray-300">{(t as { text?: string }).text ?? ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeetParticipantDetailContent({
  roomName,
  participantIdentity,
  onClose,
}: {
  roomName: string;
  participantIdentity: string | null;
  onClose: () => void;
}) {
  const [data, setData] = React.useState<{
    email?: string;
    displayName?: string;
    joinedAt?: string;
    updatedAt?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!participantIdentity || !roomName) {
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ roomName, participantIdentity });
    fetch(`/api/meet/participant-data?${params}`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(new Error(b.error || 'Failed')));
        return res.json();
      })
      .then((body) => {
        setData(body);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
        setData(null);
        setLoading(false);
      });
  }, [roomName, participantIdentity]);

  if (!participantIdentity) return null;

  const joinedAtFormatted = data?.joinedAt
    ? new Date(data.joinedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-white flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Participant details
        </SheetTitle>
        <SheetDescription className="text-gray-400">
          Data associated with this participant (email from pre-join)
        </SheetDescription>
      </SheetHeader>
      <div className="mt-6 space-y-4">
        {loading && (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {data && !loading && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Email</dt>
              <dd className="mt-0.5 text-white break-all">{data.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Display name</dt>
              <dd className="mt-0.5 text-white">{data.displayName ?? '—'}</dd>
            </div>
            {joinedAtFormatted && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 font-medium">Joined</dt>
                <dd className="mt-0.5 text-white">{joinedAtFormatted}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">Identity</dt>
              <dd className="mt-0.5 text-gray-400 font-mono text-xs break-all">{participantIdentity}</dd>
            </div>
          </dl>
        )}
      </div>
    </>
  );
}

function MeetingGridInner({
  isSuperAdmin,
  isHost,
  roomName,
  isRecording,
  recordError,
  soloedIdentity,
  onSoloChange,
  onStartRecording,
  onStopRecording,
  recordMode,
  onRecordModeChange,
  requestASongEnabled,
  onRequestSongClick,
  onViewParticipant,
}: {
  isSuperAdmin: boolean;
  isHost?: boolean;
  roomName?: string;
  isRecording: boolean;
  recordError: string | null;
  soloedIdentity: string | null;
  onSoloChange: (identity: string | null) => void;
  onStartRecording: (audioOnly: boolean) => void;
  onStopRecording: () => void;
  recordMode: 'video' | 'audio';
  onRecordModeChange: (mode: 'video' | 'audio') => void;
  requestASongEnabled?: boolean;
  onRequestSongClick?: () => void;
  onViewParticipant?: (identity: string) => void;
}) {
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
    <div className="lk-video-conference h-full w-full relative">
      <MeetingTimer />
      <div className="lk-video-conference-inner flex-1 min-w-0 flex flex-col min-h-0">
        <div className={`lk-grid-layout flex-1 min-h-0 p-1 ${!focusTrack && fillMode ? 'overflow-hidden' : 'overflow-auto'}`}>
          {focusTrack ? (
            <div className="lk-focus-layout-wrapper flex-1 min-h-0 w-full">
              <FocusLayoutContainer className="h-full w-full">
                <CarouselLayout tracks={carouselTracks}>
                  <div className="relative w-full h-full">
                    <ParticipantTile />
                    {(isSuperAdmin || isHost) && roomName && (
                      <MeetParticipantControls
                        roomName={roomName}
                        isSuperAdmin={isSuperAdmin}
                        isHost={isHost}
                        onViewParticipant={onViewParticipant}
                        soloedIdentity={soloedIdentity}
                        onSoloChange={onSoloChange}
                      />
                    )}
                  </div>
                </CarouselLayout>
                {focusTrack && isTrackReference(focusTrack) && (
                  <div className="relative flex-1 min-w-0">
                    <FocusLayout trackRef={focusTrack} />
                    {(isSuperAdmin || isHost) && roomName && (
                      <TrackRefContext.Provider value={focusTrack}>
                        <MeetParticipantControls
                          roomName={roomName}
                          isSuperAdmin={isSuperAdmin}
                          isHost={isHost}
                          onViewParticipant={onViewParticipant}
                          soloedIdentity={soloedIdentity}
                          onSoloChange={onSoloChange}
                        />
                      </TrackRefContext.Provider>
                    )}
                  </div>
                )}
              </FocusLayoutContainer>
            </div>
          ) : (
            <div className="grid gap-1 w-full h-full min-h-0" style={gridStyle}>
              <TrackLoop tracks={tracks}>
                <div className="relative min-w-0 min-h-0 w-full h-full overflow-hidden [&>div]:!h-full [&>div]:!min-h-0 [&>.lk-participant-tile]:!h-full [&>.lk-participant-tile]:!min-h-0">
                  <ParticipantTile className="!h-full !w-full !min-h-0" />
                  {(isSuperAdmin || isHost) && roomName && (
                    <MeetParticipantControls
                      roomName={roomName}
                      isSuperAdmin={isSuperAdmin}
                      isHost={isHost}
                      onViewParticipant={onViewParticipant}
                      soloedIdentity={soloedIdentity}
                      onSoloChange={onSoloChange}
                    />
                  )}
                </div>
              </TrackLoop>
            </div>
          )}
        </div>
        <MeetTranscriptStrip />
        <div className="flex items-center gap-2 w-full">
          <DisconnectButton
            className="flex-shrink-0 order-first mr-auto lk-disconnect-button !rounded-lg !px-3 !py-2"
            title="Leave meeting"
          >
            <Power className="h-4 w-4" strokeWidth={2} />
          </DisconnectButton>
          {isSuperAdmin && roomName && (
            <div className="flex items-center gap-2">
              {!isRecording && (
                <select
                  value={recordMode}
                  onChange={(e) => onRecordModeChange(e.target.value as 'video' | 'audio')}
                  className="px-2 py-1.5 rounded-lg text-sm bg-gray-800 text-gray-200 border border-gray-600 focus:border-gray-500 focus:outline-none"
                  aria-label="Recording type"
                >
                  <option value="video">Video</option>
                  <option value="audio">Audio only</option>
                </select>
              )}
              <button
                type="button"
                onClick={isRecording ? onStopRecording : () => onStartRecording(recordMode === 'audio')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={isRecording ? 'Stop recording' : `Start ${recordMode} recording`}
              >
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Stop
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 fill-current" />
                    Record
                  </>
                )}
              </button>
            </div>
          )}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex justify-center w-full lk-meet-control-bar-wrap">
              <MeetControlBar
                saveUserChoices={false}
                requestASongEnabled={requestASongEnabled}
                onRequestSongClick={onRequestSongClick}
              />
            </div>
            {recordError && (
              <p className="text-xs text-red-400" role="alert">{recordError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsDesktop(typeof window !== 'undefined' && window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isDesktop;
}

export function MeetingGridLayout({
  isSuperAdmin = false,
  isHost = false,
  roomName,
  requestASongEnabled = false,
  organizationId,
  organizationData,
}: {
  isSuperAdmin?: boolean;
  isHost?: boolean;
  roomName?: string;
  requestASongEnabled?: boolean;
  organizationId?: string;
  organizationData?: Record<string, unknown>;
}) {
  const isDesktop = useIsDesktop();
  const defaultShowChat = isSuperAdmin && isDesktop;
  const [widgetState, setWidgetState] = React.useState<WidgetState>({
    showChat: defaultShowChat,
    unreadMessages: 0,
    showSettings: false,
  });
  const [chatCollapsed, setChatCollapsed] = React.useState(false);
  const [panelContent, setPanelContent] = React.useState<'chat' | 'requestSong'>('chat');
  const [isRecording, setIsRecording] = React.useState(false);
  const [egressId, setEgressId] = React.useState<string | null>(null);
  const [recordError, setRecordError] = React.useState<string | null>(null);
  const [recordMode, setRecordMode] = React.useState<'video' | 'audio'>('video');
  const [soloedIdentity, setSoloedIdentity] = React.useState<string | null>(null);
  const [selectedParticipantIdentity, setSelectedParticipantIdentity] = React.useState<string | null>(null);
  const layoutContext = useCreateLayoutContext();
  const hasInitializedChat = React.useRef(false);

  const onViewParticipant = React.useCallback((identity: string) => {
    setSelectedParticipantIdentity(identity);
  }, []);

  const onRequestSongClick = React.useCallback(() => {
    setWidgetState((s) => ({ ...s, showChat: true }));
    setPanelContent('requestSong');
  }, []);

  React.useEffect(() => {
    if (isSuperAdmin && isDesktop && !hasInitializedChat.current) {
      hasInitializedChat.current = true;
      setWidgetState((s) => ({ ...s, showChat: true }));
    }
  }, [isSuperAdmin, isDesktop]);

  const handleStartRecording = React.useCallback(async () => {
    if (!roomName) return;
    setRecordError(null);
    try {
      const res = await fetch('/api/livekit/egress/meet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecordError(data.error || 'Failed to start recording');
        return;
      }
      setEgressId(data.egressId);
      setIsRecording(true);
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [roomName]);

  const handleStopRecording = React.useCallback(async () => {
    if (!egressId) return;
    setRecordError(null);
    try {
      const res = await fetch('/api/livekit/egress/meet/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ egressId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecordError(data.error || 'Failed to stop recording');
        return;
      }
      setEgressId(null);
      setIsRecording(false);
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Failed to stop recording');
    }
  }, [egressId]);

  return (
    <LayoutContextProvider value={layoutContext} onWidgetChange={setWidgetState}>
      <div className="flex flex-row h-full w-full min-h-0">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          <MeetingGridInner
            isSuperAdmin={isSuperAdmin}
            isHost={isHost}
            roomName={roomName}
            isRecording={isRecording}
            recordError={recordError}
            soloedIdentity={soloedIdentity}
            onSoloChange={setSoloedIdentity}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            recordMode={recordMode}
            onRecordModeChange={setRecordMode}
            requestASongEnabled={requestASongEnabled}
            onRequestSongClick={onRequestSongClick}
            onViewParticipant={onViewParticipant}
          />
        </div>
        {widgetState.showChat ? (
        chatCollapsed && isSuperAdmin ? (
          <div
            className="flex flex-col items-center justify-center w-12 flex-shrink-0 h-full bg-gray-900 border-l border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
            onClick={() => setChatCollapsed(false)}
            title="Expand chat"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setChatCollapsed(false)}
          >
            <MessageSquare className="h-5 w-5 text-gray-400" />
            <ChevronLeft className="h-4 w-4 text-gray-500 mt-1" />
          </div>
        ) : (
          <div className="relative flex flex-col flex-shrink-0 h-full min-w-[280px] w-[320px] max-w-[90vw] border-l border-gray-700 bg-gray-900 min-h-0 overflow-hidden lk-meet-chat-sidebar">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setChatCollapsed(true)}
                className="absolute top-2 right-10 z-10 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Minimize chat"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {requestASongEnabled && organizationId ? (
              <>
                <div className="flex border-b border-gray-700 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPanelContent('chat')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                      panelContent === 'chat'
                        ? 'text-white bg-gray-800 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelContent('requestSong')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                      panelContent === 'requestSong'
                        ? 'text-white bg-gray-800 border-b-2 border-emerald-500'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Music className="h-4 w-4" />
                    Request a Song
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  {panelContent === 'requestSong' ? (
                    <div className="h-full overflow-y-auto">
                      <MeetRequestSongPanel
                        organizationId={organizationId}
                        organizationData={organizationData}
                      />
                    </div>
                  ) : (
                    <Chat />
                  )}
                </div>
              </>
            ) : (
              <Chat />
            )}
          </div>
        )
      ) : null}
      </div>
      {isHost && roomName && (
        <Sheet
          open={!!selectedParticipantIdentity}
          onOpenChange={(open) => !open && setSelectedParticipantIdentity(null)}
        >
          <SheetContent side="right" className="bg-gray-900 border-gray-700 text-white">
            <MeetParticipantDetailContent
              roomName={roomName}
              participantIdentity={selectedParticipantIdentity}
              onClose={() => setSelectedParticipantIdentity(null)}
            />
          </SheetContent>
        </Sheet>
      )}
      <RoomAudioRenderer />
      <ConnectionStateToast />
    </LayoutContextProvider>
  );
}
