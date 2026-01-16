# 🎯 Next Steps - Free Stack Voice Agents

**Status:** Code Complete ✅ | Services Need Setup ⚠️

---

## 📋 Immediate Next Steps (Priority Order)

### 1. **Start Docker Services** ⚠️ CRITICAL

The free stack services need to be started:

```bash
# Start all AI services (Whisper, Coqui TTS, AI Gateway)
docker-compose -f docker-compose.ai-services.yml up -d
```

**Expected time:** 5-10 minutes (first time, downloads models)

**What this starts:**
- ✅ Whisper (STT) on port 7862
- ✅ Coqui TTS on port 7861
- ✅ AI Gateway on port 8000

**Verify services started:**
```bash
docker ps | grep payaid
```

---

### 2. **Verify All Services** ✅

Run the setup script to check everything:

```bash
npm run setup:free-stack
```

**Expected output:**
- ✅ Whisper (STT) - Running
- ✅ Coqui TTS - Running
- ✅ Ollama (LLM) - Running (already running!)
- ✅ AI Gateway - Running

---

### 3. **Pull Ollama Model** (if needed)

If you haven't already:

```bash
ollama pull mistral:7b
```

**Alternative models:**
```bash
ollama pull llama2:7b      # Good alternative
ollama pull llama3.1:8b    # Larger, better quality
```

---

### 4. **Start Application** 🚀

Start your Next.js application and telephony server:

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Telephony WebSocket (for phone calls)
npm run dev:telephony
```

---

### 5. **Test Voice Agent** 🧪

1. Navigate to voice agent demo page in your browser
2. Create or select a voice agent
3. Start a test call
4. Verify it uses free services (check console logs)

**What to look for:**
- Console should show: `[Free Stack Orchestrator] Starting...`
- Should use Whisper for STT
- Should use Ollama for LLM
- Should use Coqui TTS for speech

---

## 🔍 Troubleshooting

### Services Not Starting?

**Check Docker:**
```bash
docker ps
docker logs payaid-speech-to-text
docker logs payaid-text-to-speech
docker logs payaid-ai-gateway
```

**Restart services:**
```bash
docker-compose -f docker-compose.ai-services.yml restart
```

### Ollama Not Responding?

**Check Ollama:**
```bash
curl http://localhost:11434/api/tags
```

**Start Ollama:**
```bash
# Docker
docker run -d -p 11434:11434 ollama/ollama

# Native
ollama serve
```

### High Latency?

**Solutions:**
1. Use GPU (if available) - services will auto-detect
2. Use smaller models (`mistral:7b` instead of larger)
3. Check service health endpoints

---

## 📊 Service Health Checks

### Manual Verification:

```bash
# Whisper (STT)
curl http://localhost:7862/health

# Coqui TTS
curl http://localhost:7861/health

# AI Gateway
curl http://localhost:8000/health

# Ollama
curl http://localhost:11434/api/tags
```

All should return `200 OK` or valid JSON.

---

## 🎯 Testing Checklist

- [ ] Docker services started
- [ ] All services verified (run `npm run setup:free-stack`)
- [ ] Ollama model pulled
- [ ] Next.js running
- [ ] Telephony WebSocket running
- [ ] Voice agent test call successful
- [ ] Console shows free stack in use
- [ ] Audio quality acceptable
- [ ] Response latency acceptable (1-3 seconds)

---

## 🚀 Production Readiness

Once testing is complete:

### 1. **Performance Optimization**

- [ ] Enable GPU for Docker services (if available)
- [ ] Optimize audio chunk sizes
- [ ] Adjust `PROCESS_INTERVAL` if needed
- [ ] Monitor latency and adjust

### 2. **Monitoring**

- [ ] Set up service health monitoring
- [ ] Log service errors
- [ ] Track call metrics
- [ ] Monitor resource usage

### 3. **Documentation**

- [ ] Document any custom configurations
- [ ] Create runbook for operations
- [ ] Document troubleshooting steps

---

## 📚 Quick Reference

### Start Everything:
```bash
# 1. Start Docker services
docker-compose -f docker-compose.ai-services.yml up -d

# 2. Verify (wait 30 seconds first)
npm run setup:free-stack

# 3. Start application
npm run dev
npm run dev:telephony
```

### Stop Everything:
```bash
# Stop Docker services
docker-compose -f docker-compose.ai-services.yml down

# Stop Ollama (if Docker)
docker stop <ollama-container-id>
```

### Check Status:
```bash
npm run setup:free-stack
```

---

## 💡 Pro Tips

1. **First Time Setup:**
   - Models download on first start (5-10 min)
   - Be patient, check logs if stuck

2. **GPU Acceleration:**
   - Services auto-detect GPU
   - Significantly improves latency
   - Check `nvidia-smi` to verify

3. **Model Selection:**
   - `mistral:7b` - Best balance (recommended)
   - `llama2:7b` - Good alternative
   - `llama3.1:8b` - Better quality, slower

4. **Testing:**
   - Start with simple test calls
   - Check console logs for errors
   - Verify each service individually

---

## 🎉 Success Criteria

You're ready when:
- ✅ All services show "Running" in setup script
- ✅ Test call completes successfully
- ✅ Console shows free stack orchestrator
- ✅ Latency is acceptable (1-3 seconds)
- ✅ Audio quality is good

---

**Next Action:** Run `docker-compose -f docker-compose.ai-services.yml up -d`

---

**Last Updated:** January 2026
