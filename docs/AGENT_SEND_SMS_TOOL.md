# Agent Send-SMS Tool

The LiveKit voice agent (Ben) can send an SMS to the caller during or after a call by calling the app’s **agent-send-sms** API. This doc describes the API and how to add the `send_sms` tool to your agent.

---

## API

**Endpoint:** `POST /api/livekit/agent-send-sms`  
**Auth:** `Authorization: Bearer <token>`  
- Token: `AGENT_SMS_SECRET` or, if unset, `LIVEKIT_AGENT_CONFIG_TOKEN`.

**Body (JSON):**

| Field     | Type   | Required | Description |
|----------|--------|----------|-------------|
| `roomName` | string | one of these | Room name (e.g. `inbound-19015551234-1739123456`). Used to look up `voice_calls.client_phone` and send to the caller on that call. |
| `to`     | string | one of these | E.164 number to send to. Use when not sending by room. |
| `body`   | string | yes      | SMS message text. |

**Response:**

- Success: `{ "success": true, "messageSid": "...", "to": "+1..." }`
- Error: `{ "error": "...", "message"?: "..." }` with status 4xx/5xx.

**Env (app):**

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER` or `M10DJ_TWILIO_PHONE_NUMBER` (from number)
- `AGENT_SMS_SECRET` or `LIVEKIT_AGENT_CONFIG_TOKEN` (Bearer token)
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for `voice_calls` lookup when using `roomName`)

---

## Adding the tool to the agent

**This repo’s Ben agent already includes the tool.** In `agents/ben_agent.py`, `DefaultAgent` has a `@function_tool()` method `send_sms(context, message)` that POSTs to the app’s agent-send-sms API using the current room name. You only need to set the agent env vars below and run or redeploy the agent.

If you use a different agent (e.g. LiveKit Cloud template), it must expose a **function tool** that:

1. Accepts a **message** (and optionally `room_name`; if omitted, use the current room from context).
2. Calls `POST https://<your-app-domain>/api/livekit/agent-send-sms` with:
   - Header: `Authorization: Bearer <AGENT_SMS_SECRET or LIVEKIT_AGENT_CONFIG_TOKEN>`
   - Body: `{ "roomName": "<room name>", "body": "<message>" }`
3. Returns the API response (or a short success/failure message) so the agent can confirm to the user.

**Example (pseudo-code):**

```python
# In your agent process, e.g. when registering tools:
AGENT_SEND_SMS_URL = os.environ.get("AGENT_SEND_SMS_URL", "https://m10djcompany.com/api/livekit/agent-send-sms")
AGENT_SEND_SMS_TOKEN = os.environ.get("AGENT_SEND_SMS_TOKEN") or os.environ.get("LIVEKIT_AGENT_CONFIG_TOKEN")

async def send_sms(ctx, message: str) -> str:
    room_name = ctx.room.name if hasattr(ctx, "room") and ctx.room else None
    if not room_name:
        return "Could not determine current call; cannot send SMS."
    async with aiohttp.ClientSession() as session:
        async with session.post(
            AGENT_SEND_SMS_URL,
            headers={"Authorization": f"Bearer {AGENT_SEND_SMS_TOKEN}", "Content-Type": "application/json"},
            json={"roomName": room_name, "body": message},
        ) as resp:
            data = await resp.json()
            if resp.status == 200 and data.get("success"):
                return "Text message sent."
            return data.get("error", "Failed to send SMS.")
```

Register this as a function tool (e.g. `send_sms` with parameter `message`) so the LLM can call it when the user asks to be texted a link or follow-up.

**Env (agent)** – set these where the Ben agent runs (local, LiveKit Cloud, or your host):

- **`AGENT_SEND_SMS_URL`** – You choose this. It’s your app’s base URL plus the path: `https://<your-app-domain>/api/livekit/agent-send-sms`. Example: `https://m10djcompany.com/api/livekit/agent-send-sms`. Use the same domain as your LiveKit agent config. If unset, the tool reports “SMS is not configured.”
- **`AGENT_SEND_SMS_TOKEN`** (optional) – Same secret the **app** uses to accept the request. The app checks `Authorization: Bearer <token>` against `AGENT_SMS_SECRET` or `LIVEKIT_AGENT_CONFIG_TOKEN`. So either:
  - Leave unset and set **`LIVEKIT_AGENT_CONFIG_TOKEN`** on the agent to the same value as on the app (recommended if you already use it for agent config), or
  - Set **`AGENT_SEND_SMS_TOKEN`** on the agent to the same value as the app’s **`AGENT_SMS_SECRET`** or **`LIVEKIT_AGENT_CONFIG_TOKEN`**.

---

## Master prompt

The M10 inbound master prompt (`docs/M10_LIVEKIT_INBOUND_MASTER_PROMPT.md`) already instructs the agent: *“You may send an SMS to the caller using the send_sms tool when you want to text them a link, summary, or follow-up.”*

---

## Product scope

- **Product:** M10 DJ Company (inbound/outbound voice).
- **Data:** Uses `voice_calls.client_phone` for the current call when `roomName` is provided; no cross-brand data.
- **Safety:** Only the agent (with the shared secret) can call this API; Twilio from-number is M10-owned.
