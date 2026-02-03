# LiveKit Voice Calling for M10 DJ Company Admin – Implementation Plan

**Goal:** Add real voice calling (PSTN) to the M10 DJ Company admin site using LiveKit + Twilio. Admins receive and make calls from the browser; calls are bridged via LiveKit SIP.

**Scope:** M10 DJ Company admin only (no DJDash/TipJar mixing). You already have a Twilio account and LiveKit packages in the repo.

---

## 1. What You Already Have

| Piece | Status | Location |
|-------|--------|----------|
| LiveKit SDKs | ✅ | `livekit-server-sdk`, `@livekit/components-react`, `livekit-client` |
| Token API | ✅ | `app/api/livekit/token/route.ts` |
| Outbound-call API | ⚠️ Stub | `app/api/livekit/outbound-call/route.ts` – creates room, no SIP yet |
| Dialer UI | ✅ | `app/dialer/DialerClient.tsx` – calls `/api/livekit/outbound-call` |
| Voice call record | ✅ | `voice_calls` table (room_name, contact_id, direction, status, etc.) |
| Twilio | ✅ | Account available (SMS/voice elsewhere) |
| LiveKit Agents / AI bot | Optional | `agents/index.ts` – can add later for AI-assisted calls |

**Gap:** SIP is not configured. The outbound-call API returns “SIP calling requires LiveKit SIP gateway configuration” and never dials the phone. There is no inbound flow (client calling your number → admin in browser).

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     M10 DJ Company Admin (Browser)                        │
│  • Dashboard / Contacts / Dialer                                          │
│  • LiveKit Room (audio): admin joins → hears/talks to SIP participant     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebRTC (token from /api/livekit/token)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         LiveKit Cloud                                     │
│  • Room: 1 admin participant (browser) + 1 SIP participant (phone leg)     │
│  • SIP service: inbound trunk + dispatch rule (inbound)                   │
│               outbound trunk (outbound)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ SIP (Twilio Elastic SIP Trunking)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Twilio                                          │
│  • Phone number(s) for M10 DJ Company                                      │
│  • Elastic SIP Trunk → LiveKit SIP endpoint (inbound + outbound)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PSTN
                                    ▼
                         Client / Contact (phone)
```

- **Inbound:** Client calls your Twilio number → Twilio sends SIP to LiveKit → LiveKit creates room + SIP participant and (via dispatch rule) can pin to a specific room or rule → Admin gets notified and joins the same room in the browser.
- **Outbound:** Admin clicks “Call” in Dialer → Your API creates a LiveKit room, creates a SIP participant (via `SipClient.createSipParticipant`) using your outbound trunk to dial the contact → SIP participant and admin share the same room → voice works in browser.

---

## 3. Twilio + LiveKit SIP Options

| Approach | Inbound | Outbound | Complexity | Best for |
|----------|---------|----------|------------|----------|
| **Twilio Elastic SIP Trunking** | ✅ | ✅ | Medium | Full voice: receive and place calls from admin dashboard |
| **Twilio Programmable Voice (TwiML)** | ✅ | ❌ | Low | Inbound-only; no SIP REFER, no outbound from LiveKit |

**Recommendation:** Use **Twilio Elastic SIP Trunking** so you get both inbound and outbound in one model. Your Dialer already expects outbound; inbound is required for “client calls company number → admin answers in browser.”

---

## 4. LiveKit Side: SIP Prerequisites

- **LiveKit Cloud:** SIP is supported; you use the LiveKit Cloud SIP endpoint as the SIP URI for Twilio. No self-hosted SIP server needed.
- **Server SDK:** `SipClient` is in `livekit-server-sdk` (already installed). Used for:
  - Creating/listing SIP trunks (or use Cloud dashboard once)
  - Creating **inbound trunk** + **dispatch rule** (inbound calls → room)
  - Creating **outbound trunk** (pointing at Twilio)
  - **Creating SIP participant** for outbound: `sipClient.createSipParticipant(sipTrunkId, number, roomName, opts)`
- **Auth:** SIP API calls require LiveKit **admin** (and for create participant, **call**) permissions; use your existing `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` in a server-only context.

---

## 5. Implementation Phases

### Phase 1: Twilio Elastic SIP Trunk + LiveKit SIP Trunks & Dispatch (Config)

**Goal:** Twilio and LiveKit are connected so that:
- Inbound: Call to your Twilio number → LiveKit room + SIP participant.
- Outbound: Your app can create a SIP participant that dials out via Twilio.

**Steps:**

1. **LiveKit Cloud**
   - Ensure project uses a region that supports SIP (documented on LiveKit Cloud).
   - Get **SIP endpoint** (e.g. `sip.region.livekit.cloud` or similar) and note **inbound** vs **outbound** requirements from [LiveKit SIP / Twilio trunk docs](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk).

2. **Twilio**
   - Buy a Twilio phone number for M10 DJ Company (if you don’t have one).
   - Create an **Elastic SIP Trunk** (Twilio Console or CLI).
   - **Inbound:** Add an Origination URI pointing to your LiveKit SIP endpoint (and port if required).
   - **Outbound:** Configure authentication (username/password or IP) so LiveKit can send outbound SIP to Twilio (credentials from Twilio trunk).
   - Associate the phone number with this trunk.

3. **LiveKit SIP (Dashboard or API)**
   - **SIP Trunk (logical trunk):** Create a trunk that represents your Twilio number (e.g. your E.164 number).
   - **Inbound trunk:** Create inbound trunk with that number; set the trunk to accept incoming SIP from Twilio (using Twilio’s signaling address / auth if required by LiveKit).
   - **Dispatch rule:** When an inbound call arrives, create (or use) a room and attach the SIP participant. Options:
     - **Direct:** Always use a fixed room name (e.g. `inbound-{caller_id}-{timestamp}`) so your backend can tell the admin which room to join.
     - **Individual:** Per-user/per-number routing if you add more numbers later.
   - **Outbound trunk:** Create outbound trunk with Twilio’s SIP URI and auth (address + credentials). LiveKit will use this when you call `createSipParticipant` with this trunk.

4. **Store IDs in env**
   - e.g. `LIVEKIT_SIP_INBOUND_TRUNK_ID`, `LIVEKIT_SIP_OUTBOUND_TRUNK_ID`, or a single trunk ID if you use one trunk for both (depending on LiveKit’s model). You’ll need at least one **trunk ID** for outbound `createSipParticipant`.

Reference: [LiveKit – Create and configure a Twilio SIP trunk](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk) (and sibling SIP docs for inbound/outbound workflow).

---

### Phase 2: Outbound Calls (Dialer → Real PSTN)

**Goal:** When an admin clicks “Call” in the Dialer, the contact’s phone rings and the admin talks in the browser.

**Backend**

1. **Use `SipClient` in `app/api/livekit/outbound-call/route.ts`:**
   - Keep existing logic: auth, load contact, create LiveKit room, write `voice_calls` row, optionally start an AI bot later.
   - Add:
     - Instantiate `SipClient` with `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` (same base URL as RoomServiceClient; use HTTPS for API).
     - After creating the room, call:
       - `sipClient.createSipParticipant(sipTrunkId, targetPhoneE164, roomName, { participantName: 'Contact', fromNumber: yourTwilioNumber })`
     - Use the outbound trunk ID from Phase 1 (env var).
   - Return `roomName` and a **token for the admin** (identity e.g. `admin-{userId}`) so the frontend can join.

2. **Token for admin:**
   - Reuse your existing `app/api/livekit/token/route.ts` with a dedicated “role” or grant for the dialer (e.g. can publish/subscribe audio, join the specific room). Alternatively, add a small endpoint like `POST /api/livekit/dialer-token` that accepts `roomName` and returns a token for the current user for that room only.

**Frontend**

3. **Dialer: after “Call” succeeds, join the room:**
   - When `POST /api/livekit/outbound-call` returns `roomName` and (if applicable) `token`, open the LiveKit room in the UI:
     - Use `LiveKitRoom` from `@livekit/components-react` with `serverUrl` and `token`, and render an audio-only UI (mic on/off, volume, hang up).
   - “Hang up” = disconnect from room and optionally call an API to close the room or SIP participant (if LiveKit exposes that).

4. **Optional:** Show “Ringing…” until the SIP participant’s state indicates “connected” (or use room participant events), then switch to “In call”.

**SDK reference:** `SipClient.createSipParticipant(sipTrunkId, number, roomName, opts)` in `livekit-server-sdk`.

---

### Phase 3: Inbound Calls (Client Calls Company Number → Admin in Browser)

**Goal:** When a client calls your Twilio number, a LiveKit room is created (by the dispatch rule) and the admin can answer and talk in the browser.

**Backend**

1. **Dispatch rule behavior:**  
   Ensure the rule creates a deterministic or predictable room name (e.g. `inbound-{from}-{timestamp}`) or that LiveKit sends a webhook when a room is created for an inbound call.

2. **Webhook (recommended):**  
   Use **LiveKit webhooks** (e.g. `room_started` or `participant_joined` for the SIP participant) to:
   - Notify your backend that an inbound call has been attached to room `X`.
   - Backend: create a `voice_calls` row (direction = inbound), and optionally:
     - Notify connected admins (e.g. over Supabase Realtime or your existing notification channel) with `roomName` and caller id so they can click “Answer”.

3. **Answer endpoint:**  
   `POST /api/livekit/inbound-answer` (or similar): body `{ roomName }`. Verifies admin auth, issues a token for that room, returns `token` and `serverUrl`. Frontend uses these to join the room.

**Frontend**

4. **Inbound UI:**  
   - “Incoming call” panel or toast: “Incoming call from +1 …” with [Answer] [Decline].
   - Answer → request token for `roomName` → join same `LiveKitRoom` (audio-only).
   - Decline → optionally tell backend to reject or end the SIP participant (if you expose an API for that).

**Optional:** Ring all online admins or only those on a “reception” page; use Supabase Realtime or LiveKit data channels to push “new inbound room” events.

---

### Phase 4: Polish & Optional AI ✅ (Implemented)

- **Call end handling:** ✅ On `room_finished` for `outbound-*` / `inbound-*` rooms, `handleCallEnd` updates `voice_calls`: `status = 'completed'`, `ended_at`, `duration_seconds`. Webhook: `app/api/livekit/webhook/route.ts`.
- **Recording:** ✅ Optional LiveKit Egress: set `LIVEKIT_EGRESS_ENABLED=true` and S3 env vars (`LIVEKIT_EGRESS_S3_BUCKET`, `LIVEKIT_EGRESS_S3_ACCESS_KEY`, `LIVEKIT_EGRESS_S3_SECRET_KEY`, optional `LIVEKIT_EGRESS_S3_REGION`, `LIVEKIT_EGRESS_S3_KEY_PREFIX`). `utils/livekit/egress.ts` starts room composite egress (audio-only, MP3) for outbound/inbound rooms; `egress_ended` webhook updates `voice_calls.recording_url` and `voice_calls.egress_id`. Migration `20260203000000_add_voice_calls_recording.sql` adds `recording_url` and `egress_id` to `voice_calls`.
- **Transcription:** Use LiveKit’s transcription or your existing agent pipeline to generate transcripts and attach to the contact/lead (as in `LIVEKIT_INTEGRATION_PROPOSAL.md`).
- **AI agent:** Optionally have your LiveKit agent join the same room for outbound/inbound so it can assist (e.g. post-call summary, or “handoff to human” from agent).

---

## 6. Env / Config Checklist

- Existing: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Add (from Phase 1):
  - `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` (required for Dialer outbound; Phase 2 code uses this)
  - `LIVEKIT_SIP_INBOUND_TRUNK_ID` or equivalent (if needed for dispatch rule)
  - `TWILIO_SIP_TRUNK_*` or similar if you store Twilio-side IDs for reference
- Optional: `M10DJ_TWILIO_PHONE_NUMBER` (E.164) for caller ID on outbound.

**Phase 2 implemented:** Outbound-call API uses `SipClient.createSipParticipant` when `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` is set, and returns `token` + `serverUrl` so the Dialer joins the room. Add these to `.env.local` when your Twilio + LiveKit SIP trunk is ready.

**Phase 3 implemented:** Inbound calls: (1) LiveKit webhook on `participant_joined` for rooms named `inbound-*` creates a `voice_calls` row and calls `broadcastToAllAdmins` with type `incoming_call`. (2) `POST /api/livekit/inbound-answer` returns an admin token for the given `roomName`. (3) `IncomingCallOverlay` in AdminLayout subscribes to Supabase channel `admin-notifications:{userId}` and shows Answer/Decline; Answer joins the room via shared `VoiceCallControls`. Configure your LiveKit SIP **dispatch rule** so inbound SIP rooms are named with prefix `inbound-` (e.g. `inbound-{timestamp}` or `inbound-{caller_id}`).

**Phase 4 implemented:** Call end: `room_finished` for `outbound-*` / `inbound-*` updates `voice_calls` (status, ended_at, duration_seconds). Transcription: `handleCallTranscription` accepts `outbound-*`, `inbound-*`, `call-*`. Recording: optional Egress via `LIVEKIT_EGRESS_ENABLED=true` and S3 env vars; `utils/livekit/egress.ts` starts audio-only egress; `egress_ended` webhook sets `voice_calls.recording_url` and `egress_id`. Migration `20260203000000_add_voice_calls_recording.sql` adds those columns.

**ElevenLabs voices / voice clones:** The LiveKit agent uses **LiveKit Inference** TTS with ElevenLabs. Set `ELEVENLABS_VOICE_ID` to any ElevenLabs voice ID (library or your own clone); set `ELEVENLABS_TTS_MODEL` to override the default model (e.g. `elevenlabs/eleven_multilingual_v2`). See `docs/LIVEKIT_ELEVENLABS_VOICES.md`.

---

## 7. Security & Product Boundary

- **Auth:** All LiveKit token and SIP participant creation must be behind your auth; only M10 DJ Company admins (your existing admin check) should get tokens and answer inbound calls.
- **Data:** `voice_calls` and any transcripts stay scoped to the organization/product (e.g. `organization_id` or product context) so DJDash/TipJar are not mixed.
- **Twilio:** Use one number (or trunk) for M10 DJ Company only; don’t share with other products without explicit design.

---

## 8. Docs and References

- LiveKit SIP overview: [docs.livekit.io/sip](https://docs.livekit.io/sip) (and llms.txt index).
- Twilio trunk with LiveKit: [Configure Twilio SIP trunk](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk).
- Inbound: [Accepting calls](https://docs.livekit.io/sip/accepting-calls), [Dispatch rule](https://docs.livekit.io/sip/dispatch-rule).
- Outbound: [Making calls](https://docs.livekit.io/sip/making-calls), [Outbound calls](https://docs.livekit.io/sip/outbound-calls).
- SIP API (Node): `SipClient` in `livekit-server-sdk`; [SIP API reference](https://docs.livekit.io/sip/api).
- Next.js/React: [LiveKit Next.js quickstart](https://docs.livekit.io/home/quickstarts/nextjs) for `LiveKitRoom` and token flow.

---

## 9. Suggested Order of Work

1. **Phase 1** – Twilio + LiveKit SIP trunk and dispatch rule (inbound + outbound). Test with a single inbound and single outbound call (e.g. via curl/Postman for createSipParticipant).
2. **Phase 2** – Wire `SipClient.createSipParticipant` in `outbound-call` and add Dialer UI to join the room and talk. Validate end-to-end outbound.
3. **Phase 3** – Inbound dispatch + webhook + “Incoming call” UI and answer flow.
4. **Phase 4** – Cleanup, recording/transcription, optional AI agent.

This keeps your existing Dialer and `voice_calls` model, adds real PSTN via Twilio + LiveKit SIP, and keeps the feature scoped to M10 DJ Company admin only.
