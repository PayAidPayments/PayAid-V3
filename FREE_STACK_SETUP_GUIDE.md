# Free Stack Voice Agents - Setup Guide

**Date:** January 2026  
**Status:** Ready for Use  
**Cost:** $0/month (only hosting costs)

---

## ✅ What's Already Free in Your System

You already have these free services set up:

1. ✅ **Whisper (STT)** - In Docker (`speech-to-text` service)
2. ✅ **Coqui TTS** - In Docker (`text-to-speech` service)
3. ✅ **Ollama (LLM)** - Already integrated in `lib/ai/ollama.ts`
4. ✅ **AI Gateway** - Routes to free services

**You don't need to install anything new!** Just enable the free stack.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Enable Free Stack

Add to your `.env` file:

```env
# Enable free stack (uses Whisper, Coqui TTS, Ollama)
USE_FREE_STACK=true

# Ensure AI Gateway is enabled (uses your free services)
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# Ollama configuration (already set up)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

### Step 2: Start Services

```bash
# Terminal 1: Start AI services (includes Whisper and Coqui TTS)
docker-compose -f docker-compose.ai-services.yml up -d

# Terminal 2: Start Ollama (if not already running)
# Option A: Using Docker
docker run -d -p 11434:11434 ollama/ollama

# Option B: Native install (if you have it installed)
ollama serve

# Pull a model
ollama pull mistral:7b
# or
ollama pull llama2

# Terminal 3: Start Next.js
npm run dev

# Terminal 4: Start Telephony WebSocket (if using telephony)
npm run dev:telephony
```

### Step 3: Test

The system will automatically use free services when `USE_FREE_STACK=true`.

---

## 📋 What Changed

### New Files Created:

1. **`lib/voice-agent/free-stack-orchestrator.ts`**
   - Free stack orchestrator (uses Whisper, Ollama, Coqui TTS)
   - Replaces paid services (Deepgram, OpenAI, ElevenLabs)

2. **`lib/voice-agent/stt-free.ts`**
   - Free STT wrapper (uses Whisper)
   - Can use AI Gateway or direct service

3. **`lib/voice-agent/tts-free.ts`**
   - Free TTS wrapper (uses Coqui TTS)
   - Can use AI Gateway or direct service

4. **`lib/voice-agent/llm-free.ts`**
   - Free LLM wrapper (uses Ollama)
   - Supports streaming

### Modified Files:

1. **`server/telephony-audio-stream.ts`**
   - Now supports both paid and free stack
   - Switches based on `USE_FREE_STACK` env variable

---

## 🔄 How It Works

### Free Stack Flow:

```
Audio Input
    ↓
FreeStackVoiceOrchestrator
    ├─→ Whisper (STT) - via AI Gateway or direct
    ├─→ Ollama (LLM) - direct connection
    └─→ Coqui TTS - via AI Gateway or direct
    ↓
Audio Output
```

### Service Selection:

The system automatically chooses:
- **If `USE_FREE_STACK=true`**: Uses free stack orchestrator
- **If `USE_FREE_STACK=false`**: Uses paid services orchestrator (Deepgram, OpenAI, ElevenLabs)

---

## ⚙️ Configuration Options

### Option 1: Use AI Gateway (Recommended)

```env
USE_FREE_STACK=true
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000
```

**Benefits:**
- Centralized routing
- Health checks
- Rate limiting
- Easier management

### Option 2: Direct Service Connection

```env
USE_FREE_STACK=true
USE_AI_GATEWAY=false
SPEECH_TO_TEXT_URL=http://localhost:7862
TEXT_TO_SPEECH_URL=http://localhost:7861
OLLAMA_BASE_URL=http://localhost:11434
```

**Benefits:**
- Bypasses gateway (lower latency)
- Direct control
- Simpler for single service

---

## 📊 Performance Comparison

| Aspect | Free Stack | Paid Stack |
|--------|-----------|------------|
| **STT Latency** | 500-2000ms (Whisper) | 200ms (Deepgram) |
| **LLM Latency** | 200-1000ms (Ollama) | 200-500ms (OpenAI) |
| **TTS Latency** | 500-1000ms (Coqui) | 200ms (ElevenLabs) |
| **Total Latency** | 1.2-4 seconds | 400-600ms |
| **Cost** | $0/month | $65-90/month |
| **Quality** | Good | Excellent |

**Note:** Free stack latency is acceptable for most use cases, especially with GPU acceleration.

---

## 🎯 When to Use Free Stack

### ✅ Use Free Stack If:

- [ ] Cost is a primary concern
- [ ] You have GPU available (for better performance)
- [ ] Latency of 1-4 seconds is acceptable
- [ ] You want full control
- [ ] You're in development/testing
- [ ] Low to medium volume

### ❌ Use Paid Stack If:

- [ ] You need < 600ms latency
- [ ] High volume production
- [ ] Enterprise SLA required
- [ ] You don't have GPU
- [ ] You prefer managed services

---

## 🔧 Optimization Tips

### 1. Use GPU for Better Performance

```env
# Ensure Docker services use GPU
# In docker-compose.ai-services.yml, services should have:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

### 2. Use Faster Ollama Models

```env
# Smaller, faster models
OLLAMA_MODEL=mistral:7b  # Fast, good quality
# or
OLLAMA_MODEL=llama2:7b   # Good balance
```

### 3. Optimize Audio Chunk Size

The orchestrator processes every 2 seconds. You can adjust:

```typescript
// In free-stack-orchestrator.ts
private readonly PROCESS_INTERVAL = 2000; // Adjust this
```

### 4. Enable Caching

Add response caching for common queries to reduce LLM calls.

---

## 🧪 Testing

### Test Free Stack:

1. **Set environment:**
   ```bash
   export USE_FREE_STACK=true
   ```

2. **Start services:**
   ```bash
   docker-compose -f docker-compose.ai-services.yml up -d
   npm run dev
   npm run dev:telephony
   ```

3. **Test voice agent:**
   - Navigate to voice agent demo page
   - Start a call
   - Verify it uses free services (check console logs)

### Verify Services:

```bash
# Check Whisper service
curl http://localhost:7862/health

# Check Coqui TTS service
curl http://localhost:7861/health

# Check Ollama
curl http://localhost:11434/api/tags
```

---

## 📝 Environment Variables

### Required for Free Stack:

```env
# Enable free stack
USE_FREE_STACK=true

# AI Gateway (recommended)
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

### Optional (for direct service connection):

```env
# Direct service URLs (if not using gateway)
SPEECH_TO_TEXT_URL=http://localhost:7862
TEXT_TO_SPEECH_URL=http://localhost:7861
```

---

## 🐛 Troubleshooting

### Issue: "STT service not available"

**Solution:**
1. Check Docker services are running:
   ```bash
   docker ps | grep speech-to-text
   ```

2. Check service health:
   ```bash
   curl http://localhost:7862/health
   ```

3. Restart service:
   ```bash
   docker-compose -f docker-compose.ai-services.yml restart speech-to-text
   ```

### Issue: "Ollama connection failed"

**Solution:**
1. Check Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Start Ollama:
   ```bash
   docker run -d -p 11434:11434 ollama/ollama
   ```

3. Pull a model:
   ```bash
   ollama pull mistral:7b
   ```

### Issue: High Latency

**Solution:**
1. Use GPU for services (if available)
2. Use smaller models (mistral:7b instead of llama2:70b)
3. Reduce PROCESS_INTERVAL in orchestrator
4. Optimize audio chunk sizes

---

## 📊 Cost Savings

### Free Stack Costs:

| Component | Cost |
|-----------|------|
| Whisper (STT) | $0 (local) |
| Ollama (LLM) | $0 (local) |
| Coqui TTS | $0 (local) |
| Hosting (if needed) | $10-20/month |
| **TOTAL** | **$10-20/month** |

### Paid Stack Costs:

| Component | Cost |
|-----------|------|
| Deepgram (STT) | $25-30/month |
| OpenAI (LLM) | $5-10/month |
| ElevenLabs (TTS) | $25-30/month |
| **TOTAL** | **$55-70/month** |

**Savings: $35-50/month (50-70% reduction)**

---

## 🎯 Next Steps

1. ✅ Enable free stack in `.env`
2. ✅ Start all services
3. ✅ Test with voice agent demo
4. ✅ Monitor performance
5. ✅ Optimize as needed

---

## 📚 Related Documents

- **FREE_OPEN_SOURCE_STACK.md** - Complete technical guide
- **DECISION_FREE_VS_PAID.md** - Decision matrix
- **VAPI_MIGRATION_FREE_ALTERNATIVES.md** - Free alternatives overview

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** Ready for Production
