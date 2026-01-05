# 🎵 BPM & Key Detection Implementation Guide

## Overview

BPM (Beats Per Minute) and Key detection are essential for DJs to:
- **BPM**: Match tempo for smooth transitions
- **Key**: Match musical keys for harmonic mixing (songs in compatible keys sound better together)

---

## 🎯 Implementation Approaches

### Option 1: Python + Librosa (Recommended for Accuracy) ⭐⭐⭐

**Pros:**
- ✅ Most accurate detection
- ✅ Industry standard library
- ✅ Free and open source
- ✅ Handles edge cases well

**Cons:**
- ❌ Requires Python runtime
- ❌ Slower processing time
- ❌ More dependencies

**How it works:**
1. Download audio to server
2. Run Python script with librosa
3. Extract BPM and key
4. Store results in database
5. Display in admin dashboard

---

### Option 2: FFmpeg + Audio Analysis (Good Balance) ⭐⭐

**Pros:**
- ✅ Already have FFmpeg installed (for yt-dlp)
- ✅ Fast processing
- ✅ Lower resource usage
- ✅ Good enough for most songs

**Cons:**
- ❌ Less accurate than librosa
- ❌ Key detection is basic
- ❌ May struggle with complex songs

---

### Option 3: JavaScript/Node.js Libraries (Easiest Integration) ⭐

**Pros:**
- ✅ Native Node.js (no Python needed)
- ✅ Easy to integrate
- ✅ Fast execution

**Cons:**
- ❌ Less mature libraries
- ❌ Lower accuracy
- ❌ Limited features

---

## 📋 Recommended Implementation: Python + Librosa

Since you already have Python on the server (for yt-dlp), this is the best option.

### Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Vercel App     │         │  Render Server   │         │   Supabase      │
│                 │────────▶│                  │────────▶│                 │
│ Request Analysis│  HTTP   │  Python Script   │  Store  │  Update Request │
│                 │         │  (librosa)       │         │  with BPM/Key   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Step-by-Step Implementation

#### 1. Install Python Dependencies

On your Render server, create `requirements.txt`:
```txt
librosa==0.10.1
soundfile==0.12.1
numpy==1.24.3
keyfinder==2.2.7  # For key detection
```

#### 2. Create Python Analysis Script

**File: `server/audio-analysis.py`**
```python
#!/usr/bin/env python3
"""
Audio Analysis Script
Detects BPM and Musical Key from audio files
"""

import sys
import json
import librosa
import soundfile as sf
from keyfinder import Tonal_Fragment

def detect_bpm(audio_path):
    """Detect BPM using librosa's tempo detection"""
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=22050)  # Resample for efficiency
        
        # Detect tempo (BPM)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        
        # Round to nearest integer
        bpm = int(round(tempo))
        
        return {
            'bpm': bpm,
            'confidence': 'high'  # librosa is generally reliable
        }
    except Exception as e:
        return {
            'bpm': None,
            'error': str(e)
        }

def detect_key(audio_path):
    """Detect musical key using keyfinder"""
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=44100)
        
        # Convert to mono if stereo
        if len(y.shape) > 1:
            y = librosa.to_mono(y)
        
        # Detect key using keyfinder
        fragment = Tonal_Fragment(audio_path)
        key = fragment.key()
        
        # keyfinder returns format like "C major" or "A minor"
        return {
            'key': key,
            'confidence': 'high'
        }
    except Exception as e:
        # Fallback to basic key detection
        try:
            # Alternative: Use librosa chroma features for basic key detection
            y, sr = librosa.load(audio_path, sr=22050)
            chroma = librosa.feature.chroma_stft(y=y, sr=sr)
            
            # Simple key detection based on chroma peaks
            # This is less accurate but works as fallback
            key_map = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            chroma_mean = chroma.mean(axis=1)
            key_idx = chroma_mean.argmax()
            
            # Determine major/minor (simplified)
            # In real implementation, you'd analyze more carefully
            key = f"{key_map[key_idx]} major"
            
            return {
                'key': key,
                'confidence': 'medium'
            }
        except Exception as e2:
            return {
                'key': None,
                'error': str(e2)
            }

def analyze_audio(audio_path):
    """Run full audio analysis"""
    results = {
        'bpm': detect_bpm(audio_path),
        'key': detect_key(audio_path)
    }
    
    return results

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No audio file path provided'}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    
    try:
        results = analyze_audio(audio_path)
        print(json.dumps(results))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
```

#### 3. Create Node.js Wrapper

**File: `server/audio-analysis-service.js`**
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);
const PYTHON_SCRIPT = path.join(__dirname, 'audio-analysis.py');

/**
 * Analyze audio file for BPM and key
 * @param {string} audioFilePath - Path to audio file
 * @returns {Promise<{bpm: number|null, key: string|null, error?: string}>}
 */
async function analyzeAudio(audioFilePath) {
  try {
    // Check if file exists
    await fs.access(audioFilePath);
    
    // Run Python script
    const { stdout, stderr } = await execAsync(
      `python3 "${PYTHON_SCRIPT}" "${audioFilePath}"`,
      { timeout: 30000 } // 30 second timeout
    );
    
    if (stderr) {
      console.warn('Python script stderr:', stderr);
    }
    
    // Parse JSON output
    const results = JSON.parse(stdout);
    
    // Extract values
    return {
      bpm: results.bpm?.bpm || null,
      key: results.key?.key || null,
      bpmError: results.bpm?.error || null,
      keyError: results.key?.error || null,
    };
  } catch (error) {
    console.error('Audio analysis error:', error);
    return {
      bpm: null,
      key: null,
      error: error.message,
    };
  }
}

module.exports = { analyzeAudio };
```

#### 4. Add API Endpoint to Render Server

**File: `server/server.js` (add to existing server)**
```javascript
const { analyzeAudio } = require('./audio-analysis-service');
const path = require('path');
const fs = require('fs').promises;

// Add endpoint to analyze audio
app.post('/api/analyze-audio', async (req, res) => {
  try {
    const { audioUrl, requestId } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ error: 'audioUrl required' });
    }
    
    // Download audio file temporarily
    const tempDir = path.join(os.tmpdir(), 'audio-analysis');
    await fs.mkdir(tempDir, { recursive: true });
    
    const tempFilePath = path.join(tempDir, `${requestId || Date.now()}.mp3`);
    
    // Download file (you'd use axios or similar)
    const response = await fetch(audioUrl);
    const buffer = await response.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(buffer));
    
    // Analyze audio
    const analysis = await analyzeAudio(tempFilePath);
    
    // Clean up temp file
    await fs.unlink(tempFilePath).catch(() => {});
    
    res.json(analysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### 5. Update Database Schema

**Migration: `supabase/migrations/20250127000003_add_audio_analysis_fields.sql`**
```sql
-- Add audio analysis fields to crowd_requests
ALTER TABLE crowd_requests
ADD COLUMN IF NOT EXISTS detected_bpm INTEGER,
ADD COLUMN IF NOT EXISTS detected_key TEXT,
ADD COLUMN IF NOT EXISTS audio_analysis_status TEXT DEFAULT 'pending'
  CHECK (audio_analysis_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS audio_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Add index for filtering by BPM
CREATE INDEX IF NOT EXISTS idx_crowd_requests_bpm 
ON crowd_requests(detected_bpm) 
WHERE detected_bpm IS NOT NULL;

-- Add comment
COMMENT ON COLUMN crowd_requests.detected_bpm IS 'Detected BPM (Beats Per Minute) from audio analysis';
COMMENT ON COLUMN crowd_requests.detected_key IS 'Detected musical key (e.g., "C major", "A minor")';
COMMENT ON COLUMN crowd_requests.audio_analysis_status IS 'Status of audio analysis: pending, processing, completed, failed';
```

#### 6. Update Vercel App to Trigger Analysis

**File: `pages/api/crowd-request/analyze-audio.js`**
```javascript
import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';

const RENDER_SERVER_URL = process.env.RENDER_SERVER_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await requireSuperAdmin(req, res);
    
    const { requestId, audioUrl } = req.body;
    
    if (!RENDER_SERVER_URL) {
      return res.status(503).json({ error: 'Analysis server not configured' });
    }
    
    // Forward to Render server
    const response = await fetch(`${RENDER_SERVER_URL}/api/analyze-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.RENDER_SERVER_API_KEY,
      },
      body: JSON.stringify({ requestId, audioUrl }),
    });
    
    const analysis = await response.json();
    
    // Update database
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    await supabase
      .from('crowd_requests')
      .update({
        detected_bpm: analysis.bpm,
        detected_key: analysis.key,
        audio_analysis_status: analysis.error ? 'failed' : 'completed',
        audio_analyzed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
    
    res.json(analysis);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

#### 7. Display in Admin Dashboard

Add to `pages/admin/crowd-requests.tsx`:
```tsx
{selectedRequest.detected_bpm && (
  <div className="mt-2 flex items-center gap-4 text-sm">
    <div className="flex items-center gap-2">
      <span className="font-semibold">BPM:</span>
      <span className="text-purple-600 dark:text-purple-400">
        {selectedRequest.detected_bpm}
      </span>
    </div>
    {selectedRequest.detected_key && (
      <div className="flex items-center gap-2">
        <span className="font-semibold">Key:</span>
        <span className="text-blue-600 dark:text-blue-400">
          {selectedRequest.detected_key}
        </span>
      </div>
    )}
  </div>
)}
```

---

## 🎯 Alternative: Simpler FFmpeg Approach

If you want to avoid Python dependencies, you can use FFmpeg with some limitations:

### FFmpeg BPM Detection

```javascript
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function detectBPMFFmpeg(audioPath) {
  try {
    // FFmpeg can do basic tempo detection
    // Note: This is less accurate than librosa
    const { stdout } = await execAsync(
      `ffmpeg -i "${audioPath}" -af "silencedetect=n=-50dB:d=0.5" -f null - 2>&1 | grep "tempo"`
    );
    
    // Parse output (simplified - actual implementation would need more parsing)
    // FFmpeg doesn't have built-in BPM detection, so this is just an example
    // You'd need to use a tool like `bpm-tools` or analyze the audio manually
    
    return null; // FFmpeg alone isn't great for BPM
  } catch (error) {
    return null;
  }
}
```

**Better FFmpeg approach:** Use `bpm-tools` package:
```bash
# Install on server
apt-get install bpm-tools

# Detect BPM
bpm "${audio_file}"
```

---

## 📊 Key Detection Formats

Musical keys are typically returned as:
- **Major keys**: `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`
- **Minor keys**: `Cm`, `C#m`, `Dm`, etc.
- **Full format**: `C major`, `A minor`

For DJ mixing, you might want to convert to Camelot Wheel format:
- **Camelot Wheel**: Numbers 1-12 with A/B (e.g., `8A`, `8B`)
- **Benefit**: Adjacent numbers are compatible for mixing

**Camelot Wheel Mapping:**
```
1A = Ab minor    |  1B = B major
2A = Eb minor    |  2B = F# major
3A = Bb minor    |  3B = Db major
4A = F minor     |  4B = Ab major
5A = C minor     |  5B = Eb major
6A = G minor     |  6B = Bb major
7A = D minor     |  7B = F major
8A = A minor     |  8B = C major
9A = E minor     |  9B = G major
10A = B minor    | 10B = D major
11A = F# minor   | 11B = A major
12A = C# minor   | 12B = E major
```

---

## ⚡ Performance Considerations

### Processing Time
- **Librosa**: ~5-15 seconds per song
- **FFmpeg**: ~2-5 seconds per song
- **JavaScript**: ~10-30 seconds per song

### Resource Usage
- **CPU**: High during analysis
- **Memory**: ~100-500MB per analysis
- **Disk**: Temporary storage for downloaded files

### Optimization Tips
1. **Cache results** - Don't re-analyze same audio
2. **Background processing** - Don't block requests
3. **Batch processing** - Analyze multiple files together
4. **Lower quality** - Use 22kHz instead of 44kHz for faster processing
5. **Resume capability** - Save progress for long playlists

---

## 🎯 Quick Start: Minimal Implementation

If you want to start simple, here's a minimal version:

### 1. Install Python packages on Render
```bash
pip3 install librosa soundfile numpy
```

### 2. Simple Python script
```python
import librosa
import json
import sys

audio_path = sys.argv[1]
y, sr = librosa.load(audio_path, sr=22050)
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

print(json.dumps({'bpm': int(round(tempo))}))
```

### 3. Call from Node.js
```javascript
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function getBPM(audioPath) {
  const { stdout } = await execAsync(`python3 -c "import librosa; y, sr = librosa.load('${audioPath}', sr=22050); tempo, _ = librosa.beat.beat_track(y=y, sr=sr); print(int(round(tempo)))"`);
  return parseInt(stdout.trim());
}
```

---

## 🔮 Future Enhancements

1. **Energy Level Detection** - Track song energy (0-100)
2. **Danceability Score** - How danceable is the track
3. **Genre Classification** - Auto-detect genre
4. **Mood Detection** - Happy, sad, energetic, etc.
5. **Compatibility Scoring** - Score how well two songs mix together

---

## 💡 Recommendation

Start with **librosa for BPM** (it's very accurate) and **simple key detection**. You can enhance key detection later. The Python approach gives you the best results and you already have Python installed for yt-dlp!

Want me to help implement this? I can create the full integration!






