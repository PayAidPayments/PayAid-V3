# AI Services Health Status Report
**Generated:** 2025-12-19 11:52 UTC

## 📊 Executive Summary

| Service | Status | Health | Notes |
|---------|--------|--------|-------|
| **Groq** | ✅ **HEALTHY** | Operational | API working, model responding |
| **Hugging Face** | ✅ **HEALTHY** | Operational | API working, model responding |
| **Ollama** | ⚠️ **DEGRADED** | Model Mismatch | Server running, but configured model not found |
| **Google AI Studio** | ⚠️ **CONFIGURATION REQUIRED** | Per-Tenant | Requires tenant-specific API key in database |
| **AI Gateway** | ⚠️ **DEGRADED** | Partial Service | Some services healthy, some failing |

---

## 1. ✅ Groq API - HEALTHY

**Status:** ✅ **FULLY OPERATIONAL**

### Configuration
- **API Key:** ✅ Configured (56 characters)
- **Model:** `llama-3.1-8b-instant`
- **Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

### Test Results
- ✅ Connection: **SUCCESS**
- ✅ Authentication: **VALID**
- ✅ Model Response: **WORKING**
- ✅ Test Response: `"test"` (received correctly)

### Health Check
```bash
✅ Status: HEALTHY
✅ Response Time: Normal
✅ Model: llama-3.1-8b-instant (working)
```

### Action Required
- ✅ **NONE** - Service is fully operational

---

## 2. ✅ Hugging Face Inference API - HEALTHY

**Status:** ✅ **FULLY OPERATIONAL**

### Configuration
- **API Key:** ✅ Configured (37 characters)
- **Model:** `google/gemma-2-2b-it`
- **Endpoint:** `https://router.huggingface.co/v1/chat/completions`

### Test Results
- ✅ Connection: **SUCCESS**
- ✅ Authentication: **VALID**
- ✅ Model Response: **WORKING**
- ✅ Test Response: `"test"` (received correctly)

### Health Check
```bash
✅ Status: HEALTHY
✅ Response Time: Normal
✅ Model: google/gemma-2-2b-it (working)
```

### Action Required
- ✅ **NONE** - Service is fully operational

---

## 3. ⚠️ Ollama - DEGRADED (Model Mismatch)

**Status:** ⚠️ **DEGRADED** - Server running but model configuration issue

### Configuration
- **Base URL:** `http://localhost:11434`
- **API Key:** ✅ Configured (57 characters)
- **Configured Model:** `llama3.1:3b` ❌
- **Available Models:** `llama3.1:8b` ✅

### Docker Container Status
- ✅ **Container:** `payaid-ollama` - **RUNNING**
- ✅ **Port:** `11434` - **LISTENING**
- ✅ **Status:** Up 12 minutes

### Test Results
- ✅ Server: **REACHABLE**
- ✅ API: **RESPONDING**
- ❌ Model: **NOT FOUND** - `model 'llama3.1:3b' not found`
- ✅ Available Model: `llama3.1:8b` (4.9 GB)

### Issue
The configured model `llama3.1:3b` is not available. Only `llama3.1:8b` is installed.

### Health Check
```bash
⚠️ Status: DEGRADED
✅ Server: Running
✅ Port: 11434 (listening)
❌ Model: llama3.1:3b (not found)
✅ Available: llama3.1:8b (4.9 GB)
```

### Action Required
**Fix Model Configuration:**

1. **Option 1: Update .env to use available model**
   ```env
   OLLAMA_MODEL="llama3.1:8b"
   ```

2. **Option 2: Pull the 3b model** (if you prefer smaller model)
   ```bash
   docker exec payaid-ollama ollama pull llama3.1:3b
   ```

3. **Restart dev server** after making changes
   ```bash
   npm run dev
   ```

**Recommended:** Use Option 1 (update to `llama3.1:8b`) as it's already downloaded and ready.

---

## 4. ⚠️ Google AI Studio - CONFIGURATION REQUIRED

**Status:** ⚠️ **PER-TENANT CONFIGURATION REQUIRED**

### Configuration Type
- **Method:** Per-tenant API key (stored in database, encrypted)
- **Storage:** `Tenant.googleAiStudioApiKey` field
- **Encryption:** ✅ Supported (requires `ENCRYPTION_KEY` in .env)

### Setup Requirements
1. Each tenant must add their own API key via Settings > AI Integrations
2. Get free API key from: https://aistudio.google.com/app/apikey
3. API key is stored per-tenant (not global)

### Health Check
```bash
⚠️ Status: CONFIGURATION REQUIRED
ℹ️ Type: Per-tenant (database-stored)
ℹ️ Setup: Via dashboard Settings > AI Integrations
```

### Action Required
**For Each Tenant:**
1. Go to **Dashboard > Settings > AI Integrations**
2. Click **"Add Google AI Studio API Key"**
3. Get free key from: https://aistudio.google.com/app/apikey
4. Paste and save

**For Testing:**
- Can be tested via: `POST /api/ai/google-ai-studio/generate-image`
- Will return error if tenant doesn't have API key configured

---

## 5. ⚠️ AI Gateway (Self-Hosted Services) - DEGRADED

**Status:** ⚠️ **DEGRADED** - Some services healthy, some failing

### Docker Container Status

| Service | Container | Status | Port | Health |
|---------|-----------|--------|------|--------|
| **AI Gateway** | `payaid-ai-gateway` | ✅ Running | 8000 | ⚠️ Degraded |
| **Text-to-Speech** | `payaid-text-to-speech` | ✅ Running | 7861 | ✅ Healthy |
| **Speech-to-Text** | `payaid-speech-to-text` | ✅ Running | 7862 | ✅ Healthy |
| **Image-to-Text** | `payaid-image-to-text` | ✅ Running | 7864 | ✅ Healthy |
| **Text-to-Image** | `payaid-text-to-image` | ⚠️ Restarting | 7860 | ❌ Error |
| **Image-to-Image** | `payaid-image-to-image` | ⚠️ Restarting | 7863 | ❌ Error |

### Health Check Results
```json
{
  "status": "degraded",
  "services": {
    "text-to-speech": {
      "status": "healthy",
      "response_time": 0.017
    },
    "speech-to-text": {
      "status": "healthy",
      "response_time": 0.003
    },
    "image-to-text": {
      "status": "healthy",
      "response_time": 0.002
    },
    "text-to-image": {
      "status": "error",
      "error": "[Errno -2] Name or service not known"
    },
    "image-to-image": {
      "status": "error",
      "error": "[Errno -2] Name or service not known"
    }
  }
}
```

### Working Services ✅
- ✅ **Text-to-Speech** (Coqui TTS) - Healthy
- ✅ **Speech-to-Text** (Whisper) - Healthy
- ✅ **Image-to-Text** (BLIP-2 + OCR) - Healthy

### Failing Services ❌
- ❌ **Text-to-Image** - DNS/Network error
- ❌ **Image-to-Image** - DNS/Network error

### Action Required
**Check Container Logs:**
```bash
# Check text-to-image service
docker logs payaid-text-to-image --tail 50

# Check image-to-image service
docker logs payaid-image-to-image --tail 50

# Check all services
docker-compose -f docker-compose.ai-services.yml logs -f
```

**Possible Issues:**
1. Network/DNS configuration issue
2. Service dependencies not available
3. Model download/loading issue

**Restart Services:**
```bash
docker-compose -f docker-compose.ai-services.yml restart text-to-image image-to-image
```

---

## 📋 Summary & Recommendations

### ✅ Working Services (Ready to Use)
1. **Groq** - Fully operational, ready for AI chat
2. **Hugging Face** - Fully operational, ready for AI chat

### ⚠️ Needs Attention
1. **Ollama** - Update model configuration from `llama3.1:3b` to `llama3.1:8b`
2. **Google AI Studio** - Requires per-tenant API key setup (via dashboard)
3. **AI Gateway** - Text-to-image and image-to-image services need troubleshooting

### 🔧 Quick Fixes

**1. Fix Ollama Model:**
```env
# Update .env file
OLLAMA_MODEL="llama3.1:8b"
```

**2. Check AI Gateway Services:**
```bash
docker logs payaid-text-to-image --tail 50
docker logs payaid-image-to-image --tail 50
```

**3. Setup Google AI Studio (per tenant):**
- Go to Dashboard > Settings > AI Integrations
- Add API key from https://aistudio.google.com/app/apikey

---

## 🧪 Test Endpoints

### Test All Services
```bash
# Via script
npx tsx scripts/test-ai-services.ts

# Via API (requires authentication)
GET http://localhost:3000/api/ai/test
```

### Test Ollama Health
```bash
# Via API (requires authentication)
GET http://localhost:3000/api/ai/ollama/health
```

### Test AI Gateway
```bash
# Health check
curl http://localhost:8000/health
```

---

## 📝 Next Steps

1. ✅ **Fix Ollama model configuration** - Update `.env` to use `llama3.1:8b`
2. ⏳ **Troubleshoot AI Gateway image services** - Check logs and restart if needed
3. ⏳ **Setup Google AI Studio** - Add API keys for tenants via dashboard
4. ✅ **Monitor service health** - Use test endpoints regularly

---

**Last Updated:** 2025-12-19 11:52 UTC
**Next Check:** Run `npx tsx scripts/test-ai-services.ts` to verify status
