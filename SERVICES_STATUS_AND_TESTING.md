# 🎯 Services Status & Voice Agent Testing Guide

**Last Updated:** January 12, 2026  
**Status Check:** All core services operational

---

## 📊 Current Service Status

| Service | Status | Port | Notes |
|---------|--------|------|-------|
| **AI Gateway** | ✅ **Healthy** | 8000 | Fully operational |
| **Coqui TTS** | ✅ **Healthy** | 7861 | Text-to-speech ready |
| **Ollama (LLM)** | ✅ **Running** | 11434 | LLM ready (model downloading) |
| **Whisper (STT)** | ⚠️ **Downloading** | 7862 | Model downloading (2.88GB) |

### ⏳ In Progress

1. **Ollama Model (`mistral:7b`)** - ~4.4 GB - Downloading in background
2. **Whisper Model** - ~2.88 GB - Currently at ~41% (1.19GB downloaded)

**Note:** Services are functional, but STT will work better once Whisper model finishes downloading. LLM responses may be slower until `mistral:7b` completes.

---

## ✅ What's Ready to Test NOW

You can test voice agents **right now** with the following:

### ✅ Available Features:
- ✅ **Text-to-Speech (TTS)** - Fully working
- ✅ **LLM Responses** - Working (may use default model if mistral:7b not ready)
- ✅ **AI Gateway** - Fully operational
- ⚠️ **Speech-to-Text (STT)** - May be slow until Whisper model finishes

---

## 🧪 How to Test Voice Agents

### **Prerequisites:**

1. **Start the Application:**
   ```powershell
   # Terminal 1: Next.js App
   npm run dev

   # Terminal 2: WebSocket Server (for real-time voice)
   npm run dev:telephony
   ```

2. **Verify Services:**
   ```powershell
   npm run setup:free-stack
   ```

---

## 🎯 Testing Methods

### **Method 1: API Demo Test (Quickest - No Voice)**

Test the agent's text processing without audio:

```powershell
# Replace {agentId} and {token} with your values
$agentId = "your-agent-id"
$token = "your-auth-token"

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/voice-agents/$agentId/demo" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
  } `
  -Body (@{
    message = "नमस्ते, मेरा नाम राहुल है"
  } | ConvertTo-Json)
```

**What this tests:**
- ✅ Agent configuration
- ✅ LLM response generation
- ✅ System prompt handling
- ✅ Language support

---

### **Method 2: Browser Voice Test (Recommended)**

#### **Step 1: Navigate to Demo Page**

1. Open: `http://localhost:3000/voice-agents/{tenantId}/Demo?agentId={agentId}`
2. Or click "Test" / "Demo" button from voice agents list

#### **Step 2: Choose Testing Mode**

**Option A: Real-time WebSocket (Recommended)**
- ✅ Continuous streaming
- ✅ Low latency (2-5 seconds)
- ✅ Real-time transcripts
- ✅ Automatic audio playback

**Steps:**
1. Ensure WebSocket server is running (`npm run dev:telephony`)
2. Check "Real-time WebSocket" checkbox
3. Wait for "Real-time" connection indicator (green)
4. Click **"Start Real-time Call"**
5. Click **"Start Streaming"**
6. Speak naturally - audio streams continuously
7. Transcript and responses appear in real-time

**Option B: Push-to-Talk Mode (Fallback)**
- ✅ Works without WebSocket
- ✅ Record → Send → Process → Response
- ⚠️ Higher latency (5-10 seconds)

**Steps:**
1. Uncheck "Real-time WebSocket" checkbox
2. Click **"Start Voice Call"**
3. Grant microphone permissions
4. Click **"Start Recording"** → Speak → **"Stop Recording"**
5. Wait for processing and response

#### **Step 3: Test Features**

**Test Hindi Conversation:**
- Say: "नमस्ते, मैं आपका भुगतान जांचना चाहता हूं"
- Expected: Agent responds in Hindi

**Test English Conversation:**
- Say: "Hello, I want to check my payment status"
- Expected: Agent responds in English

**Test Knowledge Base (if configured):**
- Ask questions related to your knowledge base
- Verify agent uses context from knowledge base

---

### **Method 3: Create Voice Agent via API**

```powershell
# Create a new voice agent
$body = @{
  name = "Test Hindi Agent"
  language = "hi"
  systemPrompt = "आप एक सहायक हैं जो भुगतान से संबंधित प्रश्नों का उत्तर देते हैं।"
  voice = "female"
  model = "mistral:7b"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/v1/voice-agents" `
  -Method POST `
  -Headers @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
  } `
  -Body $body
```

---

## 🔍 Monitoring Download Progress

### **Check Ollama Model:**
```powershell
docker exec payaid-ollama ollama list
```

### **Check Whisper Download:**
```powershell
docker logs --tail 20 payaid-speech-to-text
```

### **Check All Services:**
```powershell
docker ps --filter "name=payaid" --format "table {{.Names}}\t{{.Status}}"
```

---

## ✅ Testing Checklist

### **Basic Functionality:**
- [ ] Agent can be created via API
- [ ] Demo endpoint responds correctly
- [ ] Text-to-speech works (audio response)
- [ ] LLM generates appropriate responses
- [ ] System prompt is being used

### **Voice Testing (When STT Ready):**
- [ ] Browser voice call starts successfully
- [ ] Microphone recording works
- [ ] Speech-to-text transcription is accurate
- [ ] Agent responds with correct language
- [ ] Audio response plays automatically
- [ ] Conversation history is maintained

### **Language Testing:**
- [ ] Hindi responses work correctly
- [ ] English responses work correctly
- [ ] Voice tone matches selection

### **Knowledge Base (If Configured):**
- [ ] Knowledge base search works
- [ ] Agent uses knowledge base in responses
- [ ] Context is maintained across messages

---

## 🚨 Troubleshooting

### **Issue: "Agent not found"**
- Verify the agent ID is correct
- Check that you're authenticated
- Ensure the agent belongs to your tenant

### **Issue: "Services not available"**
- Check Docker services: `docker ps --filter "name=payaid"`
- Verify environment variables in `.env`
- Run: `npm run setup:free-stack`

### **Issue: "No audio response"**
- Check TTS service: `docker logs payaid-text-to-speech`
- Verify `AI_GATEWAY_URL` in `.env`
- Check audio format (should be base64 encoded)

### **Issue: "STT not working"**
- Whisper model is still downloading (check logs)
- Verify audio quality (clear, no background noise)
- Check language code matches audio language
- Wait for model download to complete (~2.88GB)

### **Issue: "LLM responses slow"**
- Ollama model (`mistral:7b`) is still downloading
- System may be using default model
- Wait for download to complete (~4.4GB)

---

## 📝 Next Steps

1. **Wait for Downloads:**
   - Whisper model: ~1-2 hours (depending on connection)
   - Ollama model: ~30-60 minutes

2. **Once Downloads Complete:**
   - Run `npm run setup:free-stack` to verify all services
   - All health checks should pass
   - Full voice agent functionality will be available

3. **Test Full Workflow:**
   - Create agent → Test via browser → Make actual calls

---

## 🎉 You're Ready to Test!

**Current Status:**
- ✅ Core services running
- ✅ TTS fully operational
- ✅ LLM working
- ⏳ STT model downloading (functional but may be slow)
- ⏳ Ollama model downloading (functional with default)

**You can start testing voice agents now!** The system will work, but performance will improve once all models finish downloading.

---

**For detailed documentation, see:**
- `VOICE_AGENT_TESTING_GUIDE.md` - Complete testing guide
- `AI_VOICE_AGENTS_COMPLETE_DOCUMENTATION.md` - Full technical docs
