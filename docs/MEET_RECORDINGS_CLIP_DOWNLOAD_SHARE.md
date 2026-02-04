# Meet Recordings: Clipping, Download & Social Sharing

Implementation plan for **clipping**, **download**, and **post to social** (Facebook, Instagram, TikTok) for Meet and voice call recordings.

---

## Current state

- **Meet recordings**: LiveKit Egress → S3 (or Supabase Storage). URL stored in `meet_rooms.recording_url`.
- **Voice recordings**: Stored in `voice_calls.recording_url`.
- **Recordings list**: `/tipjar/dashboard/recordings` (and M10 equivalent) shows Play + Download. Download uses direct `<a href={url} download>` — for S3/signed URLs this often opens in a new tab instead of downloading.
- **No clipping or social posting** today.

---

## 1. Download (recommended first)

**Goal**: Reliable “Download” that always triggers a file save, including for cross-origin S3/signed URLs.

**Options**:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Redirect with signed URL + `response-content-disposition`** | No proxy bandwidth; S3 does the work | Requires S3 presigned URL support (Supabase Storage and most S3 support it) |
| **B. API proxy stream** | Works for any URL; full control over filename | Uses your server bandwidth and memory |

**Recommendation**: Prefer **A** when storage is S3/Supabase (generate presigned GET with `ResponseContentDisposition=attachment; filename="..."`). Fall back to **B** if the storage URL is not presignable (e.g. fixed CDN URL).

**Implementation**:

- **API**: `GET /api/livekit/recordings/download?type=meet|voice&id=<room_id|call_id>`  
  - Auth: same rules as `/api/livekit/recordings` (super admin sees all; others only own meet).  
  - Load recording URL from DB; if presignable → redirect to presigned URL with attachment disposition; else proxy stream with `Content-Disposition: attachment`.
- **Frontend**: Recordings list “Download” button calls this API (e.g. `window.location.href = /api/livekit/recordings/download?...`) or opens in new tab so the browser gets the attachment response.

---

## 2. Clipping

**Goal**: Let users define a segment (start/end time) and get a **clip** they can download or share.

**Data model** (suggested):

- New table `meet_recording_clips` (or `recording_clips` if you want to support voice later):
  - `id`, `meet_room_id` (FK), `recording_url` (source), `start_seconds`, `end_seconds`, `clip_url` (nullable, filled when clip is generated), `created_at`, `user_id`.
- Clips reference the same `recording_url` as the room; `clip_url` is the trimmed file once generated.

**How to generate the clip**:

| Option | Description | Best for |
|--------|-------------|----------|
| **Serverless FFmpeg API** | Use a service like [ffmpeg-api.com](https://ffmpeg-api.com): send source URL + `-ss` / `-t`, get back clip URL or file | Fast to ship; no infra; pay per use |
| **Background worker (FFmpeg)** | Lambda + FFmpeg layer, or Cloud Run / EC2 job: pull source, trim with `ffmpeg -ss X -i input -t Y -c copy out.mp4`, upload to S3, save `clip_url` | Full control; can reuse for other media |
| **Browser (FFmpeg.wasm)** | Trim in the browser, then upload clip to your storage | No server cost; heavy on client; mobile/old browsers may struggle |

**Recommendation**: Start with **serverless FFmpeg API** or a **small background job** (e.g. Cloud Run) that: (1) reads clip row (start/end), (2) trims source to a new file, (3) uploads to same bucket (e.g. `meet-recordings/clips/<id>.mp4`), (4) updates `clip_url`. UI: on the recording detail (or list) add “Create clip” → set in/out points → “Generate clip” → poll or webhook for completion.

**Flow**:

1. User opens recording → “Create clip” → chooses start/end (or uses presets: “Last 60s”, “First 60s”).
2. Frontend POSTs to e.g. `POST /api/livekit/recordings/clips` with `{ type: 'meet', id, start_seconds, end_seconds }`.
3. Backend creates DB row, enqueues job (or calls FFmpeg API). Job downloads source (or passes URL), trims, uploads, updates `clip_url`.
4. UI shows “Clip ready” with Download / Share for the clip.

---

## 3. Post to social (Facebook, Instagram, TikTok)

**Goal**: Let users get a recording (or clip) onto Facebook, Instagram, and/or TikTok.

**Reality check**:

- **Native “upload for me”** requires OAuth per platform, token storage, and platform-specific upload APIs (Meta Graph API, TikTok Content Posting API). Each has app review, rate limits, and format/length rules.
- **Share link / copy link** is immediate and works everywhere: user copies the recording (or clip) URL and pastes it into each app’s share or upload flow.

**Recommended phased approach**:

| Phase | What | Effort |
|-------|------|--------|
| **1. Share link** | “Copy link” + optional “Open in Facebook / Instagram / TikTok” (open each app’s share or upload page in a new tab; user pastes link or uploads file) | Low |
| **2. Open share dialogs** | Where the platform supports it (e.g. Web Share API, or mobile app deep links with URL), pre-fill link. Many platforms do not accept a “video URL” for native share; user may still upload file. | Low–medium |
| **3. Full publish API** | OAuth + store tokens; “Post to Facebook/Instagram/TikTok” that uploads the video via API. Requires app registration, permissions, and handling async status (e.g. TikTok inbox). | High |

**Phase 1 implementation** (recommended first):

- On recording (and later clip) detail or list row:
  - **Copy link**: Button that copies the playback (or clip) URL to clipboard; toast “Link copied.”
  - **Share**: Dropdown or buttons: “Open Facebook”, “Open Instagram”, “Open TikTok” that open each platform’s share or upload page in a new tab (e.g. `https://www.facebook.com/sharer/sharer.php?u=<encoded_url>`; Instagram has no direct “share URL” — open `https://www.instagram.com/` or app; TikTok open upload page). Optional short copy: “Paste this link or upload the file after downloading.”
- This gives a clear “Download” and “Share / copy link” path; users can then paste the link or upload the file in each app.

**Phase 3 (full publish)** — if you add it later:

- **Meta (Facebook / Instagram)**: [Graph API](https://developers.facebook.com/docs/graph-api/) / [Instagram Content Publishing](https://developers.facebook.com/docs/instagram-api/guides/content-publishing). Video must be publicly reachable; resumable upload for large files. Need Facebook App, permissions, and Page/IG Business account.
- **TikTok**: [Content Posting API](https://developers.tiktok.com/doc/content-posting-api-reference-upload-video/) — init upload, then `FILE_UPLOAD` or `PULL_FROM_URL`; user may need to confirm in TikTok inbox. Rate limits (e.g. 6 req/min per user).
- Store tokens per user per platform (encrypted); “Connect Facebook/Instagram/TikTok” in settings; then “Post to …” uses stored token and uploads the recording or clip URL (or file) via the corresponding API.

---

## Suggested order of implementation

1. **Download API** + wire “Download” button to it (and optionally use for clips later).
2. **Share / copy link** + “Open in Facebook / Instagram / TikTok” links on the recordings list (and later on clip rows).
3. **Clips**: DB table + “Create clip” UI (in/out points) + backend job or FFmpeg API to generate `clip_url`; then Download + Share for clips reusing the same download and share patterns.
4. **Full social publish** (OAuth + upload APIs) only if you need true “post for me” and are ready to maintain app and tokens per platform.

---

## Cross-product / security

- **Products**: Meet recordings and this feature set are **TipJar / M10** (Meet dashboard). Do not expose DJDash or other products’ data.
- **Auth**: Reuse same rules as `GET /api/livekit/recordings` (super admin: all; others: own meet only). Clip creation and download must enforce the same scope.
- **Storage**: Clips stored in the same bucket/prefix as meet recordings; ensure RLS or IAM limits access to your app only. Signed URLs for download should be short-lived (e.g. 5–15 minutes).

---

## Files to add/change (summary)

| Item | Action |
|------|--------|
| `app/api/livekit/recordings/download/route.ts` | **Add** – auth, resolve recording URL, redirect with disposition or proxy stream |
| `app/(marketing)/tipjar/dashboard/recordings/page.tsx` | **Change** – Download → use download API; add Copy link + Share (Facebook/Instagram/TikTok) |
| `supabase/migrations/..._meet_recording_clips.sql` | **Add** (when doing clips) – table `meet_recording_clips` |
| `app/api/livekit/recordings/clips/route.ts` | **Add** (when doing clips) – POST create clip job; GET list clips |
| Clip UI (recording detail or list) | **Add** (when doing clips) – in/out points + “Generate clip” |

Implementing **Download API** and **Share / copy link** first gives immediate value; clipping and full social publish can follow using this plan.
