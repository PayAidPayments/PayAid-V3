# Free Stack Voice Agents - Quick Start

**Status:** ✅ Ready to Use  
**Time to Enable:** 2 minutes

---

## 🚀 3-Step Setup

### Step 1: Add to `.env`

```env
# Enable free stack
USE_FREE_STACK=true

# Ensure AI Gateway is enabled
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# Ollama (if not already set)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b
```

### Step 2: Start Services

```bash
# Start AI services (Whisper + Coqui TTS)
docker-compose -f docker-compose.ai-services.yml up -d

# Start Ollama (if not running)
docker run -d -p 11434:11434 ollama/ollama
ollama pull mistral:7b

# Start Next.js
npm run dev
```

### Step 3: Test

Navigate to voice agent demo page and start a call. The system will automatically use free services!

---

## ✅ What You Get

- ✅ **Whisper STT** - Free, high accuracy
- ✅ **Ollama LLM** - Free, local, private
- ✅ **Coqui TTS** - Free, high quality
- ✅ **Zero API costs** - Everything runs locally
- ✅ **Full control** - Customize everything

---

## 💰 Cost

**$0/month** (only hosting if you need a VPS)

**vs Paid Stack:** $55-70/month

**Savings: 100%**

---

## ⚡ Performance

- **With GPU:** 1-2 seconds latency (acceptable)
- **With CPU:** 3-5 seconds latency (still usable)

---

## 🔄 Switch Back to Paid

Just remove or set:
```env
USE_FREE_STACK=false
```

---

**That's it!** Your voice agents now use 100% free services.
