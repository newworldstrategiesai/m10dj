# LiveKit Agent End-of-Call Webhook Fix

Your agent’s `_on_session_end_func` currently posts to an **empty URL** (`session.post("", ...)`). Apply these changes so it posts to your app and you don’t shadow the `json` module.

## 1. Use env var for the webhook URL

In `_on_session_end_func`:

- Read the URL from env, e.g. `END_OF_CALL_WEBHOOK_URL`.
- If it’s empty, skip the POST (and optionally log).
- Use that URL in `session.post(url, ...)`.

Also rename the payload variable so it doesn’t shadow the `json` module (e.g. use `payload` instead of `json`).

**Replace the end-of-call block with something like:**

```python
async def _on_session_end_func(ctx: JobContext) -> None:
    ended_at = datetime.now(UTC)
    session = ctx._primary_agent_session
    if not session:
        logger.error("no primary agent session found for end_of_call processing")
        return

    report = ctx.make_session_report()
    summarizer = inference.LLM(model="openai/gpt-4.1-nano")
    summary = await _summarize_session(summarizer, report.chat_history)
    if not summary:
        logger.info("no summary generated for end_of_call processing")
        return

    webhook_url = (os.environ.get("END_OF_CALL_WEBHOOK_URL") or "").strip()
    if not webhook_url:
        logger.info("END_OF_CALL_WEBHOOK_URL not set; skipping session-end POST")
        return

    payload = {
        "job_id": report.job_id,
        "room_id": report.room_id,
        "room": report.room,
        "started_at": datetime.fromtimestamp(report.started_at, UTC).isoformat().replace("+00:00", "Z")
            if report.started_at
            else None,
        "ended_at": ended_at.isoformat().replace("+00:00", "Z"),
        "summary": summary,
    }

    token = os.environ.get("END_OF_CALL_WEBHOOK_SECRET") or os.environ.get("LIVEKIT_AGENT_CONFIG_TOKEN") or ""
    headers_dict = {"Authorization": f"Bearer {token}"} if token else {}

    try:
        http_session = utils.http_context.http_session()
        timeout = aiohttp.ClientTimeout(total=10)
        resp = await asyncio.shield(http_session.post(
            webhook_url, timeout=timeout, json=payload, headers=headers_dict
        ))
        if resp.status >= 400:
            raise ToolError(f"error: HTTP {resp.status}: {resp.reason}")
        await resp.release()
    except ToolError:
        raise
    except (TimeoutError, aiohttp.ClientError) as e:
        raise ToolError(f"error: {e!s}") from e
```

## 2. Configure env in LiveKit Cloud (Agents tab)

In your agent’s **Secrets** (or env):

| Variable | Value |
|----------|--------|
| `END_OF_CALL_WEBHOOK_URL` | `https://m10djcompany.com/api/livekit/agent-session-end` (or your app URL) |
| `END_OF_CALL_WEBHOOK_SECRET` | Same secret you use in the app (see below), or leave unset to use `LIVEKIT_AGENT_CONFIG_TOKEN` |

## 3. App side (this repo)

- **Route:** `POST /api/livekit/agent-session-end` — already added; it expects `room` (or `room_id`) and `summary`, and updates `voice_calls.agent_summary` by `room_name`.
- **Auth:** `Authorization: Bearer <token>`. The route accepts either `END_OF_CALL_WEBHOOK_SECRET` or `LIVEKIT_AGENT_CONFIG_TOKEN` (set in the Next.js app env).
- **DB:** Migration `20260211100000_add_agent_summary_to_voice_calls.sql` adds `voice_calls.agent_summary`. Run your migrations so the column exists.

After deploying the agent changes and setting `END_OF_CALL_WEBHOOK_URL` (and optional secret), end-of-call summaries will be stored on the matching `voice_calls` row.
