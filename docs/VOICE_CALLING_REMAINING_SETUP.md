The# Voice Calling – What’s Left on Your End

This doc lists **everything you still need to do** to get LiveKit + Twilio voice calling working end-to-end. All app code (Phases 2–4, Calls hub, Egress, call history) is implemented and pushed; the rest is **configuration, credentials, and optional features**.

---

## 1. Phase 1: Twilio + LiveKit SIP (Required for Real Calls)

Until Phase 1 is done, the Dialer will create rooms and return tokens, but **no real phone call** will be placed or received. Do the following in order.

### 1.1 LiveKit Cloud

- **Region:** Use a LiveKit Cloud project in a region that supports SIP (see [LiveKit SIP docs](https://docs.livekit.io/sip)).
- **SIP endpoint:** In the LiveKit Cloud dashboard, get your **SIP endpoint** (e.g. `sip.region.livekit.cloud`) and note any port or auth requirements for **inbound** and **outbound** from the [Twilio trunk guide](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk).

### 1.2 Twilio

- **Phone number:** Buy (or use) a Twilio number for M10 DJ Company. This will be your company line for inbound and caller ID for outbound.
- **Elastic SIP Trunk:** In Twilio Console, create an **Elastic SIP Trunk**.
  - **Inbound:** Add an **Origination URI** pointing to your LiveKit SIP endpoint (and port if required).
  - **Outbound:** Configure **authentication** (username/password or IP allowlist) so LiveKit can send SIP to Twilio (use the credentials from the Twilio trunk).
  - **Number:** Associate your Twilio number with this trunk.

### 1.3 LiveKit SIP (Dashboard or API)

- **Trunk(s):** In LiveKit Cloud (or via API), create:
  - **Inbound trunk** – Accepts inbound SIP from Twilio; use your Twilio number / signaling address and any auth LiveKit requires.
  - **Outbound trunk** – Points to Twilio’s SIP URI with the credentials from step 1.2 so LiveKit can dial out.
- **Dispatch rule (inbound):** When an inbound call hits the inbound trunk, create a room and attach the SIP participant. **Important:** Room names **must** start with `inbound-` (e.g. `inbound-{caller_id}-{timestamp}` or `inbound-{timestamp}`). The app uses this prefix to create `voice_calls` rows and show the “Incoming call” overlay.
- **Trunk IDs:** Note the **outbound trunk ID** (and inbound if separate). You will put these in env (see §3).

### 1.4 CLI / script setup (Twilio side only)

If you already have **TWILIO_ACCOUNT_SID** and **TWILIO_AUTH_TOKEN** in `.env.local`, you can create the Twilio Elastic SIP trunk, credential list, origination URL, and phone-number association in one go:

```bash
node scripts/setup-twilio-livekit-sip.js
```

**Required in `.env.local`:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`  
**Optional:** `LIVEKIT_URL` or `LIVEKIT_SIP_URI` (script derives LiveKit SIP URI from `LIVEKIT_URL` if not set), `M10DJ_TWILIO_PHONE_NUMBER` (E.164; script will associate it with the trunk), `TWILIO_SIP_USERNAME` / `TWILIO_SIP_PASSWORD` (script generates if missing; Twilio requires the password to be ≥12 chars with uppercase, lowercase, digits), `TWILIO_TRUNK_DOMAIN` (override if the default domain already exists).

The script prints the **address**, **numbers**, **auth username**, and **auth password** to use when creating the **LiveKit outbound trunk** (step 1.3). After creating that trunk in LiveKit Cloud (Telephony → SIP trunks → Create new trunk → Outbound), set `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` in `.env.local`.

**LiveKit side (still manual):** Create the outbound trunk and optionally the inbound trunk + dispatch rule in [LiveKit Cloud](https://cloud.livekit.io) → Telephony → SIP trunks / Dispatch rules, or via [LiveKit CLI](https://docs.livekit.io/reference/cli/) if you use it (`lk sip outbound create` etc.).

### 1.5 References

- [LiveKit – Create and configure a Twilio SIP trunk](https://docs.livekit.io/sip/quickstarts/configuring-twilio-trunk)
- [LiveKit SIP – Accepting calls / Dispatch rule](https://docs.livekit.io/sip/accepting-calls), [Dispatch rule](https://docs.livekit.io/sip/dispatch-rule)

---

## 2. LiveKit Webhook URL (Required for Inbound + Call End + Egress)

The app handles LiveKit events at:

- **URL:** `https://<your-domain>/api/livekit/webhook`
- **Method:** POST  
- **Auth:** LiveKit signs requests; the route verifies using `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.

**What you do:**

1. In **LiveKit Cloud** → your project → **Settings** (or **Webhooks**), add a webhook:
   - **URL:** `https://<your-production-domain>/api/livekit/webhook`
   - Use your real production domain (e.g. `https://m10djcompany.com/api/livekit/webhook`).
2. For local testing you need a public URL (e.g. ngrok) and point the webhook there, or test inbound/egress in production.

**What the webhook does:**

- **participant_joined** on rooms named `inbound-*`: creates `voice_calls` row, notifies admins (IncomingCallOverlay).
- **room_finished** on `outbound-*` / `inbound-*`: marks call completed, sets `ended_at` and `duration_seconds`.
- **egress_ended**: writes `recording_url` and `egress_id` to `voice_calls` when recording is enabled (§5).

---

## 3. Environment Variables

Set these in your deployment (Vercel, etc.) and in `.env.local` for local runs.

### 3.1 Required for LiveKit + SIP

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_URL` | LiveKit WebSocket URL (wss) | `wss://your-project.livekit.cloud` |
| `LIVEKIT_API_KEY` | LiveKit API key | From LiveKit Cloud |
| `LIVEKIT_API_SECRET` | LiveKit API secret | From LiveKit Cloud |
| `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` | Outbound SIP trunk ID from LiveKit | Required for Dialer to place real calls |

### 3.2 Optional but Recommended

| Variable | Description | Example |
|----------|-------------|---------|
| `M10DJ_TWILIO_PHONE_NUMBER` | E.164 number for outbound caller ID | `+19015551234` |

### 3.3 Inbound (Phase 3)

No extra env for inbound **logic**; the app keys off room name prefix `inbound-*`. Ensure your LiveKit **dispatch rule** creates rooms with that prefix.

### 3.4 Optional: Call Recording (Egress)

Only if you want recordings stored in S3 and linked in Call History:

| Variable | Description | Example |
|----------|-------------|---------|
| `LIVEKIT_EGRESS_ENABLED` | Must be exactly `true` to start egress | `true` |
| `LIVEKIT_EGRESS_S3_BUCKET` | S3 bucket name | `my-call-recordings` |
| `LIVEKIT_EGRESS_S3_ACCESS_KEY` | S3 access key (or IAM role credentials) | |
| `LIVEKIT_EGRESS_S3_SECRET_KEY` | S3 secret key | |
| `LIVEKIT_EGRESS_S3_REGION` | Optional; default `us-east-1` | `us-east-1` |
| `LIVEKIT_EGRESS_S3_KEY_PREFIX` | Optional path prefix in bucket | `voice-calls` |

If these are not set, no egress is started; call end and history still work, just without `recording_url`.

### 3.5 Optional: ElevenLabs (Agent TTS)

For custom/clone voices in the LiveKit agent:

| Variable | Description |
|----------|-------------|
| `ELEVENLABS_VOICE_ID` | ElevenLabs voice ID (library or clone) |
| `ELEVENLABS_TTS_MODEL` | Optional model override (e.g. `elevenlabs/eleven_multilingual_v2`) |

See `docs/LIVEKIT_ELEVENLABS_VOICES.md`.

### 3.6 Supabase (Already in Use)

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Used for `voice_calls`, admin notifications channel, and RLS. No new vars required for voice calling.

---

## 4. Database: Run Migration for Recording Columns

The app expects `voice_calls` to have `recording_url` and `egress_id` (used when Egress is enabled and when we store the URL from the webhook).

**Action:** Run the migration (if you haven’t already):

- **File:** `supabase/migrations/20260203000000_add_voice_calls_recording.sql`
- **What it does:** Adds `recording_url` and `egress_id` to `voice_calls`, plus index on `egress_id`.

Apply via your normal process (e.g. `supabase db push` or run the SQL in the Supabase SQL editor).

---

## 5. Optional: Call Recording (Egress) End-to-End

If you want “Listen to recording” in Call History:

1. **S3 (or compatible) bucket** for LiveKit Egress output. LiveKit Cloud will upload MP3 files here when egress runs.
2. **IAM / credentials:** Ensure LiveKit can write to the bucket (access key + secret, or role as per LiveKit Egress docs).
3. **Env:** Set all `LIVEKIT_EGRESS_*` variables from §3.4. Set `LIVEKIT_EGRESS_ENABLED=true`.
4. **Webhook:** Egress completion is reported via the same LiveKit webhook; the app already handles `egress_ended` and updates `voice_calls.recording_url` and `egress_id`.

No code changes needed; just config and env.

---

## 6. Optional: LiveKit Transcription

The app **already** handles transcription events: when LiveKit sends `transcription_received` / `transcription_final` to the webhook, `handleCallTranscription` appends to `voice_calls.transcript` for rooms `outbound-*`, `inbound-*`, and `call-*`. If you enable **LiveKit transcription** for those rooms (in LiveKit Cloud or room config), transcripts will start populating automatically. No extra env for this in the app.

---

## 7. Optional: AI Agent in Calls

The repo has a LiveKit agent (`agents/index.ts`) and outbound-call already has a stub that could start an AI bot in the room. Turning that into a full “agent joins outbound/inbound calls” flow is optional and would involve:

- Running the agent (e.g. as a separate process or serverless) and having it join the same room.
- Optional: ElevenLabs for TTS (§3.5 and `docs/LIVEKIT_ELEVENLABS_VOICES.md`).

No blocking steps for basic voice calling.

---

## 8. Where Everything Lives in the App

| What | Where |
|------|--------|
| **Calls hub (one sidebar icon)** | Sidebar: “Calls” → `/admin/calls`. Page: `pages/admin/calls.tsx` |
| **Dialer** | Linked from hub; route `/dialer` → `app/dialer/page.tsx` + `DialerClient.tsx` |
| **Call history** | Linked from hub; `/admin/calls/history` → `pages/admin/calls/history.tsx` |
| **Incoming call overlay** | `IncomingCallOverlay.tsx` in `AdminLayout`; listens to Supabase `admin-notifications:{userId}` |
| **Outbound API** | `app/api/livekit/outbound-call/route.ts` |
| **Inbound answer API** | `app/api/livekit/inbound-answer/route.ts` |
| **LiveKit webhook** | `app/api/livekit/webhook/route.ts` (call end, inbound, egress_ended, transcription) |
| **Egress helper** | `utils/livekit/egress.ts` (starts room composite egress when env is set) |
| **Voice_calls recording columns** | `supabase/migrations/20260203000000_add_voice_calls_recording.sql` |

---

## 9. Testing Checklist

After Phase 1 and webhook are configured:

1. **Outbound**
   - Log in as admin (M10 product context).
   - Open **Calls** → **Dialer** (or go to `/dialer`).
   - Pick a contact or enter a number, click Call.
   - Confirm the phone rings and you can talk in the browser; hang up and see the call in **Call history** with status completed and duration.

2. **Inbound**
   - Call your Twilio number from another phone.
   - On an admin session (any page), confirm the “Incoming call” overlay appears with Answer/Decline.
   - Answer and confirm two-way audio; hang up and check **Call history** for the inbound row.

3. **Call history**
   - Visit **Calls** → **Call history**. Confirm outbound and inbound calls appear with direction, status, duration. If Egress is enabled, confirm “Listen to recording” appears and works after a call.

4. **Webhook**
   - In LiveKit Cloud (or logs), confirm webhook deliveries to `/api/livekit/webhook` return 200. If you use ngrok locally, point the webhook at the ngrok URL and test.

---

## 10. LiveKit Agent Settings (Default M10 Agent “Ben”)

**We have an admin page for controlling the default M10 voice agent.** The default agent is **Ben**; all settings are editable from the UI.

| What | Where it’s configured |
|------|------------------------|
| **Agent name, instructions, greeting** | **Calls** → **Voice agent settings** (`/admin/calls/agent-settings`). Stored in `livekit_agent_settings` (platform default row). |
| **STT / LLM / TTS models and voice** | Same page: STT model, STT language, LLM model, TTS model, TTS voice ID, TTS language, background audio clip/volume. |
| **Display (role, company, prompt, first message)** | Same page: used by the Dialer and by the deployed agent when it fetches config. |
| **Dispatch** | Outbound calls automatically dispatch the agent named in settings (default `Ben`) to the room via LiveKit Agent Dispatch API. |
| **SIP trunk IDs** | Env: `LIVEKIT_SIP_OUTBOUND_TRUNK_ID`. Inbound trunk and SIP dispatch rules are in LiveKit Cloud. |
| **Voicemail, hangup, transfer** | In agent code: tools and `hangup_call` / `transfer_sip_participant` as in [LiveKit Agents telephony](https://docs.livekit.io/frontends/telephony/agents). |

**Admin UI:** **Calls** (`/admin/calls`) → **Dialer**, **Call history**, **Voice agent settings**. The agent settings page lets you change agent name, instructions, greeting, STT/LLM/TTS, and display. Changes apply to the next call and to the deployed Python agent when it loads config.

**Config-driven Python agent:** Use `agents/ben_agent.py`. It fetches config from `GET /api/livekit/agent-config` (auth: `Authorization: Bearer LIVEKIT_AGENT_CONFIG_TOKEN`). Set in the Next.js app: `LIVEKIT_AGENT_CONFIG_TOKEN`. Set in the agent env: `LIVEKIT_AGENT_CONFIG_URL` (e.g. `https://m10djcompany.com/api/livekit/agent-config`) and the same `LIVEKIT_AGENT_CONFIG_TOKEN`.

---

## 11. Quick Reference: “What’s Left” Summary

| Item | Required? | Action |
|------|-----------|--------|
| **Phase 1: Twilio + LiveKit SIP** | Yes, for real calls | Configure Twilio Elastic SIP Trunk, LiveKit inbound/outbound trunks and **dispatch rule** (room names `inbound-*`), set `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` (and optional `M10DJ_TWILIO_PHONE_NUMBER`). |
| **LiveKit webhook URL** | Yes, for inbound + call end + egress | In LiveKit Cloud, set webhook URL to `https://<your-domain>/api/livekit/webhook`. |
| **Env vars** | Yes | Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` (and optional vars from §3). |
| **DB migration** | Yes, for recording fields | Run `20260203000000_add_voice_calls_recording.sql` (adds `recording_url`, `egress_id` to `voice_calls`). |
| **Egress (recordings)** | Optional | Create S3 bucket, set `LIVEKIT_EGRESS_ENABLED=true` and S3 env vars (§3.4). |
| **Transcription** | Optional | Enable in LiveKit for rooms; app already handles events. |
| **ElevenLabs / AI agent** | Optional | See §3.5 and `docs/LIVEKIT_ELEVENLABS_VOICES.md`. |

Once Phase 1 and the webhook (and migration) are done, outbound and inbound voice calling and call history are fully usable; recording and AI are optional add-ons.
