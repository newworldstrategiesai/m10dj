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

## Meet transcription (optional)

To have speech in meet rooms transcribed and stored:

1. **Enable transcription in LiveKit**  
   In your LiveKit project (Cloud or self-hosted), turn on transcription for rooms (e.g. enable the transcription feature so `transcription_received` / `transcription_final` events are sent to your webhook).

2. **Use the dashboard**  
   In the meet dashboard (before or after starting a meeting), turn **Transcription** on for your room. When transcription is enabled and LiveKit sends events, the webhook stores final segments in `meet_rooms.transcript` and the “Last saved transcript” appears on the meet dashboard.

3. **Live transcript in the room**  
   If LiveKit sends transcription on the room’s transcription stream, participants see a **Live transcript** strip in the meet UI (expandable panel above the control bar).
