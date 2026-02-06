# Meet Recording Setup

To enable the **Record** button in meet (admin side), you need LiveKit Egress configured with S3 (or S3-compatible) storage.

## 1. Choose storage

Options:
- **Supabase Storage** – S3-compatible, 1 GB free, 50 MB max file size (see below)
- **Cloudflare R2** – 10 GB free, no egress fees
- **AWS S3** – create bucket and IAM user with `s3:PutObject` permissions
- **MinIO** – self-hosted S3-compatible storage

---

## Supabase Storage (recommended for getting started)

### 1. Enable S3 in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Storage** → **Settings**
3. Enable **S3 connection via S3 protocol**
4. Generate **S3 Access Key ID** and **Secret Access Key** (copy both)

### 2. Create a bucket

1. **Storage** → **Buckets** → **New bucket**
2. Name: `meet-recordings`
3. Set **Public bucket** if you want direct playback links (otherwise use signed URLs)
4. Create

### 3. Add env vars

```bash
LIVEKIT_EGRESS_ENABLED=true
LIVEKIT_EGRESS_S3_BUCKET=meet-recordings
LIVEKIT_EGRESS_S3_ACCESS_KEY=<your Supabase S3 Access Key ID>
LIVEKIT_EGRESS_S3_SECRET_KEY=<your Supabase S3 Secret Access Key>
LIVEKIT_EGRESS_S3_REGION=us-east-1
LIVEKIT_EGRESS_S3_ENDPOINT=https://<project-ref>.storage.supabase.co/storage/v1/s3
LIVEKIT_EGRESS_S3_MEET_PREFIX=meet-recordings
```

Replace `<project-ref>` with your Supabase project reference (e.g. `abcdefghijklmnop` from `https://abcdefghijklmnop.supabase.co`).

### Supabase free tier limits

- **1 GB** total storage
- **50 MB** max file size – video meet recordings may exceed this for meetings longer than ~15–20 minutes. Short meetings or audio-only are fine.

---

## 2. Environment variables (all storage types)

Add to `.env.local` (local) and Vercel → Settings → Environment Variables (production):

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_EGRESS_ENABLED` | Yes | Must be exactly `true` |
| `LIVEKIT_EGRESS_S3_BUCKET` | Yes | Bucket name |
| `LIVEKIT_EGRESS_S3_ACCESS_KEY` | Yes | S3 access key |
| `LIVEKIT_EGRESS_S3_SECRET_KEY` | Yes | S3 secret key |
| `LIVEKIT_EGRESS_S3_REGION` | No | Default `us-east-1` |
| `LIVEKIT_EGRESS_S3_MEET_PREFIX` | No | Path prefix in bucket; default `meet-recordings` |
| `LIVEKIT_EGRESS_S3_ENDPOINT` | Yes for Supabase/R2/MinIO | Custom S3 endpoint URL |

### Cloudflare R2 example

```bash
LIVEKIT_EGRESS_ENABLED=true
LIVEKIT_EGRESS_S3_BUCKET=your-r2-bucket-name
LIVEKIT_EGRESS_S3_ACCESS_KEY=<R2 Access Key ID>
LIVEKIT_EGRESS_S3_SECRET_KEY=<R2 Secret Access Key>
LIVEKIT_EGRESS_S3_REGION=auto
LIVEKIT_EGRESS_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
```

## 3. LiveKit Cloud

If using **LiveKit Cloud**, Egress is included. Ensure your LiveKit project has Egress enabled and can reach your S3 bucket. LiveKit Cloud runs egress from their infrastructure, so the bucket must be publicly writable by the credentials you provide (or allow LiveKit’s egress IP ranges).

## 4. Webhook

The `egress_ended` webhook is already configured to update `meet_rooms.recording_url` when a recording finishes. Ensure your LiveKit webhook URL points to:

```
https://your-domain.com/api/livekit/webhook
```

## 5. Verify

1. Restart the dev server or redeploy after adding env vars
2. Join a meet as super admin
3. Click **Record**
4. Stop recording; when processing completes, the recording URL will appear in the dashboard

---

## Troubleshooting: Recordings not in Supabase bucket

If the Record button works but recordings don’t show up in the bucket or in the dashboard:

1. **Env vars** – Ensure all `LIVEKIT_EGRESS_S3_*` and `NEXT_PUBLIC_SUPABASE_URL` are set in the environment where the **webhook** runs (e.g. Vercel). The egress service uploads to S3; when it finishes, LiveKit calls your webhook. If the webhook can’t build the public URL (missing `NEXT_PUBLIC_SUPABASE_URL` or `LIVEKIT_EGRESS_S3_BUCKET`), it will still update `meet_rooms.egress_id` but not `recording_url`.

2. **Webhook URL** – In LiveKit Cloud (or self-hosted), set the webhook URL to `https://your-domain.com/api/livekit/webhook` so `egress_ended` is received.

3. **Server logs** – After stopping a recording, check your app logs for `[Webhook] meet egress_ended` or `handleMeetEgressEnded update error`. If you see “no recording URL” and a `fileResults` payload, the webhook is receiving a different shape; the handler now accepts `location`, `filename`, or `path` and builds the Supabase public URL from a key when needed.

4. **Supabase S3** – If you use Supabase Storage via S3, ensure the bucket exists, is public if you want direct playback links, and the S3 Access Key/Secret have write access. The webhook builds the public URL as `{NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/{LIVEKIT_EGRESS_S3_BUCKET}/{path}` when LiveKit sends a path instead of a full URL.

---

## Troubleshooting: Erratic speed in the recording (music speeds up/slows down)

If the final file plays back with the music (or audio) speeding up and slowing down erratically, it’s usually due to **clock drift** or **variable delivery** between the source and the encoder:

1. **Source timing**  
   Room composite egress captures whatever is in the room (mics, screen share, etc.). If the *source* of the music is unstable (e.g. streaming from a browser tab, variable network, or system audio capture), the encoder receives irregular timing and the file can have speed variations.

2. **Sample rate / clock mismatch**  
   WebRTC and capture pipelines can use different clocks (e.g. 44.1 kHz vs 48 kHz). Small mismatches cause drift; the encoder may resample or stretch/squeeze, which shows up as speed changes. We now pass explicit encoding options (48 kHz audio, constant 30 fps for video) to reduce this.

**What to try:**

- **Audio-only recording** when you mainly care about music: use the “Recording type: Audio only” option in the meet UI. That avoids video/audio sync issues and often gives more stable playback.
- **Stable playback source**: if you’re playing music (e.g. Spotify) into the meet, use a source with steady timing—e.g. a virtual audio device or a local file—instead of a heavily loaded browser tab or unstable stream.
- **Re-encode the file**: if you already have a “wobbly” file, you can fix it by re-encoding with a constant frame rate and sample rate, e.g.:
  ```bash
  ffmpeg -i recording.mp4 -af "aresample=48000" -c:v libx264 -r 30 -c:a aac -b:a 128k output_fixed.mp4
  ```

---

## Meet transcription (optional)

To have speech in meet rooms transcribed and stored:

1. **Enable transcription in LiveKit**  
   In your LiveKit project (Cloud or self-hosted), turn on transcription for rooms (e.g. enable the transcription feature so `transcription_received` / `transcription_final` events are sent to your webhook).

2. **Use the dashboard**  
   In the meet dashboard (before or after starting a meeting), turn **Transcription** on for your room. When transcription is enabled and LiveKit sends events, the webhook stores final segments in `meet_rooms.transcript` and the “Last saved transcript” appears on the meet dashboard.

3. **Live transcript in the room**  
   If LiveKit sends transcription on the room’s transcription stream, participants see a **Live transcript** strip in the meet UI (expandable panel above the control bar).
