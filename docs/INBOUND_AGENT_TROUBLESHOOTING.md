# Inbound Agent Not Getting Calls – Troubleshooting

When the inbound AI agent (Ben) is not receiving calls, use this guide and the diagnostic script to find the cause.

## Quick diagnostic

```bash
npm run verify:inbound-agent
```

This checks: LiveKit env and API, agent dispatch (`createDispatch(roomName, "Ben")`), `livekit_agent_settings` (agent_name, auto_answer), and optional agent config URL.

---

## How inbound agent flow works

1. **Call reaches LiveKit SIP**  
   Caller dials your Twilio number → Twilio **Elastic SIP Trunk** sends SIP to **LiveKit SIP** (not Twilio Programmable Voice).

2. **LiveKit creates room**  
   LiveKit **SIP dispatch rule** creates a room and attaches the SIP participant. **Room names should start with `inbound-` or `sip-`** (e.g. `inbound-19015551234-1739123456`). Both prefixes create a row in admin call history.

3. **Webhook runs**  
   LiveKit sends `room_started` and `participant_joined` to your webhook (`/api/livekit/webhook`). The app creates/updates `voice_calls` for rooms whose name starts with **`inbound-`** or **`sip-`**.

4. **App creates voice_calls and notifies admins**  
   `handleInboundSipCall` inserts a `voice_calls` row and broadcasts to admins (IncomingCallOverlay).

5. **Auto-answer (agent) after delay**  
   After `auto_answer_delay_seconds` (default 20s), if the call is still ringing and no admin joined, `scheduleAutoAnswer` calls **`AgentDispatchClient.createDispatch(roomName, agentName, …)`** with `agentName` from `livekit_agent_settings` (default **"Ben"**).

6. **Agent joins**  
   A worker registered with LiveKit as **"Ben"** (e.g. Python `agents/ben_agent.py` with `@server.rtc_session(agent_name="Ben")`) receives the dispatch and joins the room.

---

## Common reasons the agent never gets the call

| Cause | What to check |
|-------|----------------|
| **Calls not going to LiveKit SIP** | Twilio number must use **Elastic SIP Trunk** with origination URI pointing at **LiveKit SIP endpoint**. If the number uses a **Voice webhook** (e.g. `pages/api/voice/incoming-call.js`), the call never hits LiveKit; the app creates a `call-*` room but the caller is dialed to the admin and never joins that room. |
| **Dispatch rule room prefix** | In LiveKit Cloud → Telephony → SIP → Dispatch rules, the room name must **start with `inbound-` or `sip-`**. Both are supported; if you use another prefix, the app will not create `voice_calls` rows and calls will not appear in admin call history. |
| **Webhook URL missing or wrong** | LiveKit project must have webhook URL set to `https://<your-domain>/api/livekit/webhook`. Otherwise `participant_joined` never hits your app. |
| **Agent not running or wrong name** | The Python agent (`agents/ben_agent.py`) must be **running** and registered with **agent_name="Ben"**. If you use a different agent (e.g. TS `agents/index.ts`), it must also register with the same name. `createDispatch(roomName, "Ben", …)` only reaches workers that registered as "Ben". |
| **Agent name mismatch** | `livekit_agent_settings.default_m10.agent_name` should be **"Ben"** (or whatever name the agent registers). If the DB says another name, dispatch still uses that name; the worker must match. |
| **Auto-answer disabled** | If `auto_answer_enabled` is false in `livekit_agent_settings`, the app never calls `createDispatch` for inbound; only the admin notification is sent. |
| **Caller hangs up before delay** | Default `auto_answer_delay_seconds` is 20. If the caller hangs up before that, the agent is never dispatched. |

---

## Files involved

| What | Where |
|------|--------|
| Webhook (participant_joined → handleInboundSipCall, scheduleAutoAnswer) | `app/api/livekit/webhook/route.ts` |
| Auto-answer → createDispatch(roomName, agentName) | `scheduleAutoAnswer()` in same file |
| Agent settings (agent_name, auto_answer_*) | `livekit_agent_settings` (default_m10 row) |
| Python agent (agent_name="Ben") | `agents/ben_agent.py` |
| Inbound SIP setup (Twilio → LiveKit) | `scripts/setup-twilio-livekit-sip.js`, LiveKit Cloud SIP + dispatch rule |
| Diagnostic script | `scripts/verify-livekit-inbound-agent.js` |
| Agent send-SMS API (text caller during/after call) | `app/api/livekit/agent-send-sms/route.ts`; see `docs/AGENT_SEND_SMS_TOOL.md` |

---

## Caller hears ringing forever (call never “answers”)

LiveKit sends **200 OK** (answers the call) only when **another participant publishes tracks** to the room (see [Workflow & setup](https://docs.livekit.io/telephony/accepting-calls/workflow-setup/): “User continues to hear a dial tone until another participant publishes tracks to the room”). So the caller keeps hearing ringback until the **agent publishes audio**.

| Cause | What to do |
|-------|------------|
| **Agent never joins** | Dispatch rule must pin agent “Ben”; agent must be running and registered as “Ben”. Check LiveKit Agents tab: is the agent deployed and healthy? |
| **Agent joins but doesn’t publish** | Agent must **publish audio** (e.g. greet) as soon as it joins. Call `generate_reply` (or equivalent) in `on_enter` right after `session.start`. If there’s an error before any audio is sent (missing API key, exception, slow TTS), no tracks are published → no 200 OK → infinite ringing. |
| **Agent is slow (cold start / TTS)** | Time from INVITE to first agent audio can be long (cold start, model load, first TTS). Caller may hear ringback for 10–30+ seconds. Reduce by: keeping the agent warm, using faster TTS/STT models, or a very short first utterance so tracks publish sooner. |
| **Errors in agent** | Check LiveKit Cloud agent logs (or your agent logs) during a test call: does the job start? Does the agent join the room? Does it reach `on_enter` and `generate_reply`? Any exceptions (e.g. OPENAI_API_KEY, ELEVENLABS_API_KEY)? |

**Quick check:** During a live test call, open LiveKit Cloud → Rooms → open the `inbound-*` or `sip-*` room. Is there a second participant (the agent)? Does that participant have a published audio track? If no second participant or no track, fix dispatch/agent or agent code so the agent joins and publishes a greeting immediately.

---

## Calls in LiveKit but not in admin call history

You see rooms/calls in **LiveKit Cloud → Rooms** but nothing at **Admin → Calls → History** ([/admin/calls/history](https://www.m10djcompany.com/admin/calls/history)). That page reads from the **`voice_calls`** table; rows are created only when your app’s webhook runs for those rooms.

| Check | What to do |
|-------|------------|
| **Webhook URL** | In LiveKit Cloud → Project → Webhooks, set the URL to `https://<your-app-domain>/api/livekit/webhook` (e.g. `https://www.m10djcompany.com/api/livekit/webhook`). Use the same domain as your deployed app. Without this, the app never receives `room_started` / `participant_joined` and never creates `voice_calls` rows. |
| **Room name prefix** | The app creates `voice_calls` only for rooms whose name **starts with `inbound-` or `sip-`**. In LiveKit Cloud → Telephony → SIP → Dispatch rules, set the inbound rule’s room name to use one of these prefixes (e.g. `inbound-{{.CallID}}` or `sip-{{.CallID}}`). If your rooms use a different prefix, they will not appear in call history. |
| **RLS / admin access** | Call history is visible only to users who pass the “Admins can view all voice calls” RLS policy (i.e. in `admin_roles` with `is_active = true`). If you’re not in `admin_roles`, you won’t see any rows. |
| **Deploy** | After changing the webhook or room names, new calls should create rows. Existing LiveKit rooms created before the fix will not have rows unless you backfill or the room is recreated. |

The app now creates a **minimal** `voice_calls` row on **`room_started`** for `inbound-*` and `sip-*` rooms, then updates **`client_phone`** on **`participant_joined`**. So you get a row as soon as the room exists, even if `participant_joined` is delayed.

---

## If using Twilio Programmable Voice for inbound

The handler `pages/api/voice/incoming-call.js` (when `ENABLE_LIVEKIT_CALLS=true`) creates a LiveKit room named **`call-*`** but then returns TwiML that **dials the admin’s phone**. The caller never joins the LiveKit room, so no `participant_joined` for that room and no agent dispatch.

To have the **agent** answer inbound calls, calls must go through **LiveKit SIP** (Twilio Elastic SIP → LiveKit) with a dispatch rule that creates **`inbound-*`** rooms, as above. The Programmable Voice path is for “dial admin only” and does not involve the agent.
