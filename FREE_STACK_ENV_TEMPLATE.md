# Free Stack Environment Variables Template

Copy these variables to your `.env` file to enable the free stack:

```env
# ============================================
# FREE STACK VOICE AGENTS CONFIGURATION
# ============================================
# Enable free stack (uses Whisper, Coqui TTS, Ollama)
USE_FREE_STACK=true

# AI Gateway Configuration
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# Ollama Configuration (Free LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:7b

# Direct Service URLs (if not using gateway)
SPEECH_TO_TEXT_URL=http://localhost:7862
TEXT_TO_SPEECH_URL=http://localhost:7861
```

## Quick Setup

Run the setup script:

```bash
# Check and configure free stack
npm run setup:free-stack

# Check and start Docker services automatically
npm run setup:free-stack:start
```

## Manual Setup

### 1. Add to `.env`

Copy the variables above to your `.env` file.

### 2. Start Docker Services

```bash
docker-compose -f docker-compose.ai-services.yml up -d
```

This starts:
- ✅ Whisper (STT) on port 7862
- ✅ Coqui TTS on port 7861
- ✅ AI Gateway on port 8000

### 3. Start Ollama

**Option A: Docker**
```bash
docker run -d -p 11434:11434 ollama/ollama
ollama pull mistral:7b
```

**Option B: Native**
```bash
ollama serve
ollama pull mistral:7b
```

### 4. Verify Services

```bash
# Check Whisper
curl http://localhost:7862/health

# Check Coqui TTS
curl http://localhost:7861/health

# Check Ollama
curl http://localhost:11434/api/tags

# Check AI Gateway
curl http://localhost:8000/health
```

### 5. Start Application

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Telephony WebSocket (if using telephony)
npm run dev:telephony
```

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Whisper (STT) | http://localhost:7862 | Speech-to-text |
| Coqui TTS | http://localhost:7861 | Text-to-speech |
| Ollama (LLM) | http://localhost:11434 | Language model |
| AI Gateway | http://localhost:8000 | Service router |

## Troubleshooting

### Services not starting?

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check service logs:
   ```bash
   docker logs payaid-speech-to-text
   docker logs payaid-text-to-speech
   docker logs payaid-ai-gateway
   ```

3. Restart services:
   ```bash
   docker-compose -f docker-compose.ai-services.yml restart
   ```

### Ollama not responding?

1. Check if Ollama is running:
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

### High latency?

1. **Use GPU** - Ensure Docker services have GPU access
2. **Use smaller models** - Use `mistral:7b` instead of larger models
3. **Optimize settings** - Adjust `PROCESS_INTERVAL` in orchestrator

---

**Status:** Ready to use  
**Cost:** $0/month (only hosting if needed)
