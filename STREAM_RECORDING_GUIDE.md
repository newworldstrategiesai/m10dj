# 🎥 Stream Recording Guide - Free Options

## Overview

There are several ways to record live streams, ranging from completely free to paid services. Here are the best options for TipJar.live:

---

## 🆓 FREE OPTIONS (Recommended)

### Option 1: Client-Side Recording (100% Free) ⭐ **BEST FOR FREE**

**How it works**: Record the stream directly in the browser using MediaRecorder API, then upload to Supabase Storage (free tier: 1GB).

**Pros**:
- ✅ Completely free
- ✅ No external services needed
- ✅ Works with existing Supabase setup
- ✅ Full control over recordings
- ✅ Can record viewer's perspective (what they see)

**Cons**:
- ❌ Requires viewer's browser to stay open
- ❌ Quality depends on viewer's connection
- ❌ Uses viewer's device resources
- ❌ Limited to 1GB free storage on Supabase

**Implementation**:
```typescript
// Record from viewer's browser
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'video/webm;codecs=vp9,opus'
});

const chunks: Blob[] = [];
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'video/webm' });
  // Upload to Supabase Storage
  await uploadToSupabase(blob);
};
```

**Storage**: Supabase Storage (1GB free) or upgrade to Pro ($25/mo for 100GB)

---

### Option 2: Server-Side Recording with LiveKit Egress (Paid, but has free tier)

**How it works**: LiveKit's Egress service records streams server-side.

**Pricing**:
- **Free Tier**: None (paid only)
- **Starter**: $0.01/minute of recording (~$0.60/hour)
- **Storage**: Additional cost for storage

**Pros**:
- ✅ High quality (server-side)
- ✅ Reliable (doesn't depend on viewer)
- ✅ Automatic recording
- ✅ Multiple format options

**Cons**:
- ❌ Costs money (~$0.60/hour of recording)
- ❌ Requires LiveKit Cloud account
- ❌ Additional storage costs

**When to use**: If you need reliable, high-quality recordings and have budget.

---

### Option 3: Hybrid Approach (Free + Optional Paid)

**Strategy**: 
1. Use client-side recording for free tier users
2. Offer server-side recording as premium feature
3. Store in Supabase Storage (free tier) or S3 (cheap)

**Implementation**:
- Free users: Browser-based recording
- Premium users: Server-side recording via LiveKit Egress
- Storage: Supabase (free) or AWS S3 (~$0.023/GB/month)

---

## 💡 RECOMMENDED IMPLEMENTATION

### Phase 1: Free Client-Side Recording (Start Here)

1. **Add recording button to streamer dashboard**
2. **Use MediaRecorder API** to record stream
3. **Upload to Supabase Storage** (free tier)
4. **Store metadata** in `live_streams` table

**Database Schema Addition**:
```sql
ALTER TABLE live_streams ADD COLUMN recording_url TEXT;
ALTER TABLE live_streams ADD COLUMN recording_duration INTEGER; -- seconds
ALTER TABLE live_streams ADD COLUMN recording_size BIGINT; -- bytes
ALTER TABLE live_streams ADD COLUMN recorded_at TIMESTAMP;
```

**Storage Setup**:
- Create Supabase Storage bucket: `stream-recordings`
- Set up RLS policies for access control
- Free tier: 1GB storage

---

### Phase 2: Optional Premium Recording

If you want to offer premium recording later:
- Use LiveKit Egress API
- Charge users for recording feature
- Store in S3 or Supabase Storage

---

## 📊 Cost Comparison

| Option | Setup Cost | Per Hour | Storage | Total (10 hrs/month) |
|--------|-----------|----------|---------|---------------------|
| **Client-Side (Free)** | $0 | $0 | $0 (1GB free) | **$0/month** |
| **LiveKit Egress** | $0 | $0.60 | ~$0.10/GB | **~$7/month** |
| **Hybrid** | $0 | $0 (free) | $0 (1GB free) | **$0/month** |

---

## 🚀 Quick Start: Free Recording Implementation

### Step 1: Add Recording Button to Go-Live Page

```typescript
// In app/(marketing)/tipjar/dashboard/go-live/page.tsx
const [isRecording, setIsRecording] = useState(false);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);

const startRecording = async () => {
  // Get video stream from LiveKit room
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true
  });
  
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9,opus'
  });
  
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  
  recorder.onstop = async () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    await uploadRecording(blob);
  };
  
  mediaRecorderRef.current = recorder;
  recorder.start();
  setIsRecording(true);
};

const stopRecording = () => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }
};
```

### Step 2: Upload to Supabase Storage

```typescript
async function uploadRecording(blob: Blob) {
  const fileName = `recording-${stream?.id}-${Date.now()}.webm`;
  
  const { data, error } = await supabase.storage
    .from('stream-recordings')
    .upload(fileName, blob, {
      contentType: 'video/webm',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    return;
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('stream-recordings')
    .getPublicUrl(fileName);
  
  // Update stream record
  await supabase
    .from('live_streams')
    .update({
      recording_url: urlData.publicUrl,
      recorded_at: new Date().toISOString(),
    })
    .eq('id', stream?.id);
}
```

### Step 3: Create Storage Bucket

Run in Supabase SQL Editor:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('stream-recordings', 'stream-recordings', true);

-- Set up RLS policies
CREATE POLICY "Streamers can upload their own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stream-recordings');

CREATE POLICY "Anyone can view recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stream-recordings');
```

---

## 🎯 RECOMMENDATION

**Start with FREE client-side recording** because:
1. ✅ Zero cost
2. ✅ Easy to implement
3. ✅ Works with your existing setup
4. ✅ 1GB free storage is enough for ~10-20 hours of recordings
5. ✅ Can upgrade later if needed

**Upgrade path**:
- If you need more storage: Supabase Pro ($25/mo for 100GB)
- If you need server-side: Add LiveKit Egress later
- If you need unlimited: Use AWS S3 (~$2.30/month for 100GB)

---

## 📝 Implementation Checklist

- [ ] Add recording button to go-live page
- [ ] Implement MediaRecorder API
- [ ] Create Supabase Storage bucket
- [ ] Set up RLS policies
- [ ] Add upload function
- [ ] Update database schema
- [ ] Add recording URL to stream metadata
- [ ] Create playback page for recordings
- [ ] Add recording duration tracking
- [ ] Test recording and playback

---

## 🔗 Resources

- [MediaRecorder API Docs](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [LiveKit Egress Docs](https://docs.livekit.io/egress/) (paid option)

---

**Bottom Line**: You can absolutely do stream recording for **FREE** using client-side recording + Supabase Storage. Start there, upgrade later if needed!

