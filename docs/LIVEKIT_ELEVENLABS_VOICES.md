# ElevenLabs Voices and Voice Clones with LiveKit Agents

Your LiveKit voice agent uses **ElevenLabs** for text-to-speech (TTS) via **LiveKit Inference**. You can use default ElevenLabs voices or your own **voice clones** by setting a voice ID.

## Two ways to use ElevenLabs with LiveKit

| Option | Use case | Setup |
|--------|----------|--------|
| **LiveKit Inference** (current) | Default ElevenLabs voices + custom voice IDs (including clones) | Set `ELEVENLABS_VOICE_ID` (and optionally `ELEVENLABS_TTS_MODEL`). Billing via LiveKit. |
| **ElevenLabs plugin** | Your own API key, full control over models/settings | Install `@livekit/agents-plugin-elevenlabs`, use plugin TTS in the agent, set `ELEVEN_API_KEY`. |

The agent in this repo is configured to use **LiveKit Inference** with ElevenLabs. You do **not** need a separate ElevenLabs API key for default voices or for using a voice ID (including many custom clones); LiveKit routes requests and bills you.

---

## Using a specific voice (library or your clone)

1. **Get a voice ID**
   - **ElevenLabs library:** [ElevenLabs Voices](https://elevenlabs.io/voice-library) — copy the **Voice ID** (e.g. `21m00Tcm4TlvDq8ikWAM` for Rachel).
   - **Your own voice clone:** In [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab), create or open a clone and copy its **Voice ID**.

2. **Set the env var**
   - In `.env` or your agent environment:
   - `ELEVENLABS_VOICE_ID=<your-voice-id>`
   - Example: `ELEVENLABS_VOICE_ID=ODq5zmih8GrVes37Dizd`

3. **Restart the agent**
   - The agent builds the TTS model string as `model:voice_id` when `ELEVENLABS_VOICE_ID` is set, so all agent speech uses that voice.

---

## Optional: TTS model

- **Default model:** `elevenlabs/eleven_flash_v2_5` (low latency, good for real-time).
- **Override:** Set `ELEVENLABS_TTS_MODEL` to another supported model, e.g.:
  - `elevenlabs/eleven_multilingual_v2` — multilingual
  - `elevenlabs/eleven_turbo_v2_5` — faster, slightly different quality
- Supported models are in [LiveKit Inference TTS](https://docs.livekit.io/agents/models/tts/inference/elevenlabs) (e.g. `eleven_flash_v2`, `eleven_flash_v2_5`, `eleven_turbo_v2`, `eleven_turbo_v2_5`, `eleven_multilingual_v2`).

---

## Env vars summary

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | Yes | LiveKit server URL (e.g. `wss://….livekit.cloud`). |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key (used for Inference gateway). |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret. |
| `ELEVENLABS_VOICE_ID` | No | ElevenLabs voice ID (library or your clone). If unset, a default voice is used. |
| `ELEVENLABS_TTS_MODEL` | No | TTS model (default: `elevenlabs/eleven_flash_v2_5`). |

---

## Using the ElevenLabs plugin instead (your own API key)

If you want to use your **own ElevenLabs API key** (e.g. for usage outside LiveKit billing or for plugin-specific options):

1. Install the plugin:
   ```bash
   pnpm add @livekit/agents-plugin-elevenlabs
   ```

2. In `agents/index.ts`, create TTS with the plugin instead of a model string:
   ```ts
   import { TTS } from '@livekit/agents-plugin-elevenlabs';

   // In entry():
   tts: new TTS({
     voice: { id: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM' },
     model: process.env.ELEVENLABS_TTS_MODEL || 'eleven_multilingual_v2',
     apiKey: process.env.ELEVEN_API_KEY, // or ELEVENLABS_API_KEY
   }),
   ```

3. Set `ELEVEN_API_KEY` (or `ELEVENLABS_API_KEY`) in your environment.

Plugin docs: [LiveKit Agents – ElevenLabs TTS](https://docs.livekit.io/agents/integrations/tts/elevenlabs).

---

## References

- [LiveKit Inference – ElevenLabs TTS](https://docs.livekit.io/agents/models/tts/inference/elevenlabs)
- [LiveKit Agents – ElevenLabs TTS plugin](https://docs.livekit.io/agents/integrations/tts/elevenlabs)
- [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
- [ElevenLabs Voice Lab](https://elevenlabs.io/voice-lab) (clones)
