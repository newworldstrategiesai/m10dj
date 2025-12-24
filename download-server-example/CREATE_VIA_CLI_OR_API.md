# Create Service via Render API

Unfortunately, the Render CLI **does not support creating services**. However, we can use the **Render API** directly.

## Option 1: Use Render API (Requires API Key)

### Step 1: Get API Key
1. Go to: https://dashboard.render.com/account/api-keys
2. Click **"Create API Key"**
3. Copy the key (starts with `rnd_`)

### Step 2: Create Service via API

```bash
curl -X POST "https://api.render.com/v1/services" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "m10dj-docker",
    "repo": "https://github.com/newworldstrategiesai/m10dj",
    "branch": "main",
    "rootDir": "download-server-example",
    "env": "docker",
    "dockerfilePath": "download-server-example/Dockerfile",
    "planId": "starter", 
    "region": "oregon",
    "envVars": [
      {
        "key": "SUPABASE_URL",
        "value": "https://bwayphqnxgcyjpoaautn.supabase.co"
      },
      {
        "key": "SUPABASE_SERVICE_ROLE_KEY",
        "value": "YOUR_KEY_HERE"
      },
      {
        "key": "DOWNLOAD_SERVER_API_KEY",
        "value": "63e12a3429b1b879dc7e51139048eaeaea34d8873608f3311bee0672b1c2b5c2"
      },
      {
        "key": "PORT",
        "value": "10000"
      }
    ]
  }'
```

## Option 2: Use Blueprint (Easier - No API Key Needed!)

The `render.yaml` file I created can be used with Render's Blueprint feature:

1. **Go to**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect repository**: `newworldstrategiesai/m10dj`
4. **Render will automatically read `render.yaml`** and create the service
5. **You'll need to set the environment variables** (they're marked `sync: false`)

## Option 3: Manual Dashboard (Most Reliable)

Since CLI/API are limited, the dashboard is actually the most reliable:

1. Go to: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Follow the steps in `EASIEST_SOLUTION.md`

## Recommendation

**Use Option 2 (Blueprint)** - it's the easiest automated way:
- ✅ No API key needed
- ✅ Reads `render.yaml` automatically
- ✅ Creates Docker service correctly
- ⚠️ You'll still need to add env vars manually (but that's quick)

