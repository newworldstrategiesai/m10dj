'use client';

/**
 * MeetControlBar - Meet-specific control bar with explicit camera/screen control.
 * Admin can use: camera only, screen share only, or both at once.
 * Works on desktop and mobile (screen share shown only when browser supports it).
 */
import { Track } from 'livekit-client';
import * as React from 'react';
import {
  TrackToggle,
  DisconnectButton,
  ChatToggle,
  MediaDeviceMenu,
  useLocalParticipantPermissions,
  usePersistentUserChoices,
  ChatIcon,
  LeaveIcon,
  StartMediaButton,
} from '@livekit/components-react';
import { Music } from 'lucide-react';
import { supportsScreenSharing } from '@livekit/components-core';

const trackSourceToProtocol = (source: Track.Source): number => {
  switch (source) {
    case Track.Source.Camera:
      return 1;
    case Track.Source.Microphone:
      return 2;
    case Track.Source.ScreenShare:
      return 3;
    default:
      return 0;
  }
};

export function MeetControlBar({
  saveUserChoices = false,
  onDeviceError,
  requestASongEnabled = false,
  onRequestSongClick,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  saveUserChoices?: boolean;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
  requestASongEnabled?: boolean;
  onRequestSongClick?: () => void;
}) {
  const [isScreenShareEnabled, setIsScreenShareEnabled] = React.useState(false);
  const [isCompact, setIsCompact] = React.useState(false);
  const [showMusicAudioHelp, setShowMusicAudioHelp] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const update = () => setIsCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const localPermissions = useLocalParticipantPermissions();
  const browserSupportsScreenSharing = supportsScreenSharing();

  const visible = React.useMemo(() => {
    const v = { microphone: true, camera: true, screenShare: true, chat: true, leave: true };
    if (!localPermissions) {
      v.camera = false;
      v.chat = false;
      v.microphone = false;
      v.screenShare = false;
      return v;
    }
    const canPublish = (source: Track.Source) =>
      localPermissions.canPublish &&
      (localPermissions.canPublishSources.length === 0 ||
        localPermissions.canPublishSources.includes(trackSourceToProtocol(source)));
    v.camera = canPublish(Track.Source.Camera);
    v.microphone = canPublish(Track.Source.Microphone);
    v.screenShare = canPublish(Track.Source.ScreenShare);
    v.chat = !!localPermissions.canPublishData;
    return v;
  }, [localPermissions]);

  const showText = !isCompact;
  const showIcon = true;

  const {
    saveAudioInputEnabled,
    saveVideoInputEnabled,
    saveAudioInputDeviceId,
    saveVideoInputDeviceId,
  } = usePersistentUserChoices({ preventSave: !saveUserChoices });

  const microphoneOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveAudioInputEnabled(enabled) : null,
    [saveAudioInputEnabled],
  );
  const cameraOnChange = React.useCallback(
    (enabled: boolean, isUserInitiated: boolean) =>
      isUserInitiated ? saveVideoInputEnabled(enabled) : null,
    [saveVideoInputEnabled],
  );

  return (
    <div className="lk-control-bar lk-meet-control-bar" {...props}>
      {visible.microphone && (
        <div className="lk-button-group" title="Audio source: choose mic or a virtual device (e.g. Serato Virtual Audio, VB-Audio) to broadcast DJ app or music only">
          <TrackToggle
            source={Track.Source.Microphone}
            showIcon={showIcon}
            onChange={microphoneOnChange}
            onDeviceError={(e) => onDeviceError?.({ source: Track.Source.Microphone, error: e })}
          >
            {showText && 'Microphone'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="audioinput"
              onActiveDeviceChange={(_kind, deviceId) =>
                saveAudioInputDeviceId(deviceId ?? 'default')
              }
            />
          </div>
        </div>
      )}
      {visible.camera && (
        <div className="lk-button-group">
          <TrackToggle
            source={Track.Source.Camera}
            showIcon={showIcon}
            onChange={cameraOnChange}
            onDeviceError={(e) => onDeviceError?.({ source: Track.Source.Camera, error: e })}
            title="Camera — use alone or with screen share"
          >
            {showText && 'Camera'}
          </TrackToggle>
          <div className="lk-button-group-menu">
            <MediaDeviceMenu
              kind="videoinput"
              onActiveDeviceChange={(_kind, deviceId) =>
                saveVideoInputDeviceId(deviceId ?? 'default')
              }
            />
          </div>
        </div>
      )}
      {visible.screenShare && browserSupportsScreenSharing && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{
            audio: true,
            selfBrowserSurface: 'include',
            systemAudio: 'include',
          }}
          showIcon={showIcon}
          onChange={(enabled) => setIsScreenShareEnabled(enabled)}
          onDeviceError={(e) => onDeviceError?.({ source: Track.Source.ScreenShare, error: e })}
          title="Share screen — camera can stay on. On desktop, choose a tab/window to capture its audio (e.g. Spotify, Tidal, or a browser tab)."
        >
          {showText && (isScreenShareEnabled ? 'Stop screen share' : 'Share screen')}
        </TrackToggle>
      )}
      {visible.screenShare && !browserSupportsScreenSharing && (
        <span
          className="lk-meet-control-bar-hint lk-meet-control-bar-unsupported"
          title="Screen sharing is not supported in this browser (e.g. some mobile browsers)"
        >
          {showText ? 'Screen share not available' : 'No screen share'}
        </span>
      )}
      {visible.chat && (
        <ChatToggle title="Chat">
          {showIcon && <ChatIcon />}
          {showText && 'Chat'}
        </ChatToggle>
      )}
      {requestASongEnabled && onRequestSongClick && (
        <button
          type="button"
          onClick={onRequestSongClick}
          className="lk-button lk-meet-request-song-button"
          title="Request a song"
        >
          {showIcon && <Music className="lk-icon" style={{ width: 20, height: 20 }} />}
          {showText && 'Request a Song'}
        </button>
      )}
      {visible.leave && (
        <DisconnectButton title="Leave meeting">
          {showIcon && <LeaveIcon />}
          {showText && 'Leave'}
        </DisconnectButton>
      )}
      <StartMediaButton />
      {browserSupportsScreenSharing && (
        <p className="lk-meet-control-bar-hint" aria-hidden>
          Camera and screen can both be on
        </p>
      )}
      <div className="lk-meet-music-audio-help">
        <button
          type="button"
          onClick={() => setShowMusicAudioHelp((v) => !v)}
          className="lk-meet-music-audio-help-trigger"
          aria-expanded={showMusicAudioHelp}
        >
          {showMusicAudioHelp ? 'Hide' : 'Share music / app audio?'}
        </button>
        {showMusicAudioHelp && (
          <div className="lk-meet-music-audio-help-content">
            <p><strong>Desktop:</strong> To broadcast music only (no mic): (1) Route your playback app (e.g. Serato, djay Pro, Rekordbox, Spotify, Tidal) through a virtual audio device, then open the mic dropdown and choose that device (e.g. Serato Virtual Audio, VB-Audio Cable, BlackHole). (2) Or use Share screen and select a browser tab playing audio — that tab’s audio will be captured.</p>
            <p><strong>Mobile (browser):</strong> Browsers cannot capture app audio (djay Pro, Spotify, Tidal, etc.) on phones yet. Use desktop with a virtual device or tab share, or use the mic for voice.</p>
            <p><strong>Mobile (native app):</strong> To broadcast app audio from a phone you need a native app (iOS ReplayKit Broadcast or Android screen/audio capture). See docs for options.</p>
          </div>
        )}
      </div>
    </div>
  );
}
