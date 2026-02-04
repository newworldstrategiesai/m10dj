# Broadcasting direct music / app audio from mobile

Research summary: ways to broadcast app audio (Spotify, Tidal, djay Pro, etc.) from phones/tablets with **no microphone** — i.e. “music only” from mobile.

---

## Web / PWA (current meet app)

**Conclusion: not possible today.**

- **iOS Safari / Android Chrome** do **not** support `getDisplayMedia()` with audio (tab/system audio) on mobile.
- The meet UI runs in the browser, so it can only use:
  - **Microphone** (`getUserMedia({ audio: true })`) — real mic only.
  - **Screen share** — on mobile browsers, screen share is either unsupported or video-only (no audio).
- There is no web API that lets a mobile browser capture audio from other apps (Spotify, djay Pro, etc.).

So **from the current web meet app, users cannot broadcast “direct music audio” from mobile**; that’s a platform/browser limitation, not something we can fix in the web app.

---

## Native mobile apps (the only way on mobile)

To broadcast app/system audio from a phone or tablet, you need a **native app** (or hybrid with a native broadcast component) that uses platform APIs and then sends audio to LiveKit.

### Android (API 29+)

- **API:** [AudioPlaybackCaptureConfiguration](https://developer.android.com/reference/android/media/AudioPlaybackCaptureConfiguration) with **MediaProjection** (same one used for screen capture).
- **Rules:** The **capturing app** can record audio from other apps only if those apps allow it (e.g. `android:allowAudioPlaybackCapture="true"` or they don’t opt out). Many media apps (Spotify, YouTube, etc.) are captureable on Android 10+.
- **LiveKit:** The **LiveKit Android SDK** provides [ScreenAudioCapturer](https://docs.livekit.io/reference/client-sdk-android/livekit-android-sdk/io.livekit.android.audio/-screen-audio-capturer/index.html):
  - Uses the same MediaProjection as screen share.
  - Captures **playback audio** (other apps’ audio) and can feed it into the **microphone** track (e.g. “music only” by disabling real mic and using only this capturer).
  - Needs `RECORD_AUDIO` and a **foreground service** (e.g. type `microphone`) when capturing in the background.

**Flow:** User starts screen share (or an “audio only” flow that still uses MediaProjection) → app uses `ScreenAudioCapturer` to capture app audio → publish as the participant’s audio track to the same LiveKit room. No browser involved.

### iOS

- **API:** **ReplayKit** (in-app or **Broadcast Upload Extension**).
  - **In-app:** Captures only your app; stops when the app is backgrounded.
  - **Broadcast Extension:** User starts “Broadcast” from Control Center (or from your app). System captures **full screen + system audio** (including other apps like djay Pro, Spotify, Apple Music) and sends buffers to your extension. Your app can then send that to LiveKit.
- **LiveKit:** The [LiveKit Swift SDK](https://docs.livekit.io/transport/media/screenshare/) supports:
  - **In-app capture** — share only your app.
  - **Broadcast capture** — full screen + system audio via a Broadcast Upload Extension (custom `SampleHandler` + App Group). Same room as your web or native clients.

**Flow:** User starts a broadcast from your native app (or Control Center) → extension receives screen + system audio → app sends to LiveKit. Other participants (web or native) see/hear the same room. So “broadcast direct music audio from mobile” (e.g. djay Pro, Spotify) is possible **only from a native iOS app** using this path.

---

## Practical options for “broadcast music from mobile”

| Approach | Web-only (current) | Native iOS app | Native Android app |
|----------|--------------------|----------------|--------------------|
| Broadcast app audio (Spotify, djay Pro, etc.) from phone | ❌ Not possible | ✅ Yes (ReplayKit Broadcast + LiveKit) | ✅ Yes (MediaProjection + ScreenAudioCapturer + LiveKit) |
| No microphone (music only) | ❌ | ✅ (send only system/app audio) | ✅ (send only playback capture) |

### Option A: Stay web-only

- **Mobile:** No “direct music audio” from the browser. Copy in the meet UI already states: *“Browsers cannot capture app audio (djay Pro, Spotify, Tidal, etc.) on phones yet. Use desktop with a virtual device or tab share, or use the mic for voice.”*
- **Desktop:** Unchanged: virtual audio device in mic dropdown, or share a browser tab with audio.

### Option B: Add native “broadcast” apps

- **iOS:** App that uses LiveKit Swift SDK + ReplayKit Broadcast Extension. User joins a meet room from the app and starts a broadcast → system audio (including djay Pro, Spotify) is sent to the room. Web and other clients join the same room as today.
- **Android:** App that uses LiveKit Android SDK + MediaProjection + `ScreenAudioCapturer`. User starts “share screen” (or “share audio”) → app captures other apps’ audio and publishes it as the user’s audio track. Again, same room as web.
- **Product:** Either one “TipJar Live” (or M10) native app (iOS + Android) that can “broadcast from this device” into an existing meet room, or a dedicated “DJ broadcast” app that only does capture + LiveKit publish.

### Option C: Third-party / partner app

- Use or partner with an existing native app that captures device/screen audio and can send to a LiveKit (or generic WebRTC) endpoint. Your backend would issue tokens; the app would publish into the same room. Your web app stays viewer-only for that flow.

---

## References

- [LiveKit – Screen sharing](https://docs.livekit.io/transport/media/screenshare/) (web, iOS, Android)
- [LiveKit Android – ScreenAudioCapturer](https://docs.livekit.io/reference/client-sdk-android/livekit-android-sdk/io.livekit.android.audio/-screen-audio-capturer/index.html)
- [Android – Capture video and audio playback](https://developer.android.com/media/platform/av-capture) (AudioPlaybackCaptureConfiguration)
- [iOS – ReplayKit](https://developer.apple.com/documentation/replaykit), Broadcast Upload Extension
- [MDN – getDisplayMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) (browser support; no audio on mobile)
