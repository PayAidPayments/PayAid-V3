# 🧪 Voice Agent Testing Guide

## Quick Testing Methods

After creating a voice agent, here are several ways to test it:

---

## 🎯 **Method 1: API Testing (Recommended for Quick Test)**

### **Step 1: Get Your Agent ID**

After creating the agent, you'll receive a response with the agent ID:
```json
{
  "agent": {
    "id": "agent-123",
    "name": "Hindi Payment Agent",
    ...
  }
}
```

### **Step 2: Test with Demo Endpoint**

Use the demo endpoint to test the agent without making actual calls:

```bash
curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/demo \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "नमस्ते, मेरा नाम राहुल है"
  }'
```

**Note:** The `language` field is not needed - the endpoint uses the agent's configured language from the database.

This will:
1. Process the text message
2. Generate a response using the agent's system prompt
3. Convert response to speech (if audio requested)
4. Return the conversation result

---

## 🎯 **Method 2: Browser Voice Testing (Recommended for Voice Testing)**

### **Real-time vs Push-to-Talk**

The demo page supports two modes:

1. **Real-time WebSocket** (Recommended) - Continuous streaming, low latency
2. **HTTP Push-to-Talk** (Fallback) - Record → Send → Process → Response

### **Real-time Mode Setup**

1. **Start WebSocket Server:**
   ```bash
   npm run dev:websocket
   # Or run both together:
   npm run dev:all
   ```

2. **Configure Environment:**
   Add to `.env`:
   ```env
   WEBSOCKET_PORT=3001
   NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3001"
   ```

3. **See `VOICE_AGENT_REALTIME_SETUP.md` for detailed setup instructions**

### **Using Real-time Mode**

### **Step 1: Navigate to Demo Page**

1. Go to: `http://localhost:3000/voice-agents/{tenantId}/Demo?agentId={agentId}`
2. Or click "Test" / "Demo" button from the voice agents list

### **Step 2: Choose Mode**

**Real-time Mode (Recommended):**
1. Ensure WebSocket server is running: `npm run dev:websocket`
2. Check "Real-time WebSocket" checkbox
3. Wait for connection indicator to show "Real-time" (green badge)
4. Click **"Start Real-time Call"**
5. Click **"Start Streaming"** - audio streams continuously
6. Speak naturally - no need to stop/start
7. Transcript and responses appear in real-time

**Push-to-Talk Mode (Fallback):**
1. Uncheck "Real-time WebSocket" checkbox
2. Click **"Start Voice Call"** button
3. Grant microphone permissions when prompted
4. Click **"Start Recording"** to begin speaking
5. Speak your message (e.g., "नमस्ते, मैं आपका भुगतान जांचना चाहता हूं")
6. Click **"Stop Recording"** when done
7. Wait for processing and response

### **Step 3: Continue Conversation**

**Real-time Mode:**
- Speak continuously - audio streams every 500ms
- Transcript appears as you speak
- Response appears immediately after processing
- Audio plays automatically
- Full conversation history maintained

**Push-to-Talk Mode:**
- Keep recording and stopping to have a full conversation
- The agent maintains conversation history
- You can also type messages while in a call

### **Features:**

**Real-time Mode:**
- ✅ Continuous audio streaming
- ✅ Real-time transcript updates
- ✅ Low latency responses (2-5 seconds)
- ✅ Automatic audio playback
- ✅ Per-call conversation history
- ✅ Works in browser (no phone needed)

**Push-to-Talk Mode:**
- ✅ Voice recording (chunk-based)
- ✅ Automatic speech-to-text
- ✅ Audio response playback
- ✅ Conversation history
- ✅ Works in browser (no phone needed)
- ⚠️ Higher latency (5-10 seconds per turn)

---

## 🎯 **Method 3: Process Audio Call via API**

### **Step 1: Create a Call**

```bash
curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+919876543210",
    "language": "hi"
  }'
```

This returns a `callId`.

### **Step 2: Process Audio**

Send audio data (base64 encoded) to process:

```bash
curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/calls/{callId}/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "audioData": "base64-encoded-audio-here",
    "language": "hi"
  }'
```

**To encode audio:**
```bash
# On Linux/Mac
base64 -i audio.wav

# On Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("audio.wav"))
```

---

## 🎯 **Method 4: Browser-Based Testing (WebRTC)**

### **Step 1: Check WebRTC Endpoint**

The system has a WebRTC endpoint for browser-based testing:

```bash
# Get WebRTC offer
curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/webrtc/offer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "offer": "webrtc-offer-sdp"
  }'
```

### **Step 2: Use Browser Console**

Open browser console and test:

```javascript
// Get your auth token first
const token = 'YOUR_AUTH_TOKEN';
const agentId = 'YOUR_AGENT_ID';

// Test demo endpoint
fetch(`/api/v1/voice-agents/${agentId}/demo`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: 'Hello, how are you?',
    language: 'en'
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data));
```

---

## 🎯 **Method 5: Test with Audio File**

### **Step 1: Record or Prepare Audio File**

Record a test audio file (WAV, MP3, or WebM format):
- Speak clearly in the agent's language
- Keep it under 30 seconds for best results
- Use a quiet environment

### **Step 2: Convert Audio to Base64**

**On Windows PowerShell:**
```powershell
$bytes = [IO.File]::ReadAllBytes("test-audio.wav")
$base64 = [Convert]::ToBase64String($bytes)
$base64 | Out-File -Encoding utf8 "audio-base64.txt"
```

**On Linux/Mac:**
```bash
base64 -i test-audio.wav > audio-base64.txt
```

### **Step 3: Create Call and Process Audio**

```bash
# Step 1: Create call
CALL_RESPONSE=$(curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+919876543210",
    "language": "hi"
  }')

# Extract callId (requires jq or manual extraction)
CALL_ID=$(echo $CALL_RESPONSE | jq -r '.callId')

# Step 2: Read base64 audio
AUDIO_BASE64=$(cat audio-base64.txt | tr -d '\n')

# Step 3: Process audio
curl -X POST http://localhost:3000/api/v1/voice-agents/{agentId}/calls/$CALL_ID/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"audioData\": \"$AUDIO_BASE64\",
    \"language\": \"hi\"
  }"
```

### **Step 4: Save and Play Audio Response**

The response includes `audio` field (base64 encoded). Decode and save:

```bash
# Save response
curl ... > response.json

# Extract and decode audio (Linux/Mac)
cat response.json | jq -r '.audio' | base64 -d > response.wav

# Play audio
# On Linux: aplay response.wav
# On Mac: afplay response.wav
# On Windows: start response.wav
```

---

## 🎯 **Method 6: Frontend UI Testing (If Available)**

1. Navigate to: `/dashboard/ai-calling` or `/dashboard/voice-agents`
2. Find your created agent
3. Click "Test" or "Demo" button
4. Enter a test message
5. Listen to the response

---

## 📋 **Testing Checklist**

### **Basic Functionality**
- [ ] Agent created successfully
- [ ] Agent appears in list endpoint
- [ ] Demo endpoint responds correctly
- [ ] Text-to-speech works (if testing audio)
- [ ] Speech-to-text works (if testing audio input)

### **Voice Testing**
- [ ] Browser voice call starts successfully
- [ ] Microphone recording works
- [ ] Speech-to-text transcription is accurate
- [ ] Agent responds with correct language
- [ ] Audio response plays automatically
- [ ] Conversation history is maintained
- [ ] Multiple voice turns work correctly

### **Language Testing**
- [ ] Hindi responses work correctly
- [ ] English responses work correctly
- [ ] System prompt is being used
- [ ] Voice tone matches selection

### **Knowledge Base (If Configured)**
- [ ] Knowledge base search works
- [ ] Agent uses knowledge base in responses
- [ ] Context is maintained across messages

---

## 🔧 **Troubleshooting**

### **Issue: "Agent not found"**
- Verify the agent ID is correct
- Check that you're authenticated
- Ensure the agent belongs to your tenant

### **Issue: "Services not available"**
- Check Docker services are running:
  ```bash
  docker-compose -f docker-compose.ai-services.yml ps
  docker-compose -f docker-compose.ollama.yml ps
  ```
- Verify environment variables in `.env`

### **Issue: "No audio response"**
- Check TTS service is running
- Verify `AI_GATEWAY_URL` is correct
- Check audio format (should be base64 encoded)

### **Issue: "STT not working"**
- Check Whisper service is running
- Verify audio quality (clear, no background noise)
- Check language code matches audio language

---

## 🚀 **Quick Test Script**

Save this as `test-voice-agent.sh`:

```bash
#!/bin/bash

# Configuration
AGENT_ID="your-agent-id"
TOKEN="your-auth-token"
BASE_URL="http://localhost:3000"

echo "🧪 Testing Voice Agent: $AGENT_ID"

# Test 1: Get Agent Details
echo "📋 Getting agent details..."
curl -s -X GET "$BASE_URL/api/v1/voice-agents/$AGENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .

# Test 2: Demo Test
echo "💬 Testing demo endpoint..."
curl -s -X POST "$BASE_URL/api/v1/voice-agents/$AGENT_ID/demo" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "message": "Hello, this is a test"
  }' | jq .

echo "✅ Testing complete!"
```

Make it executable:
```bash
chmod +x test-voice-agent.sh
./test-voice-agent.sh
```

---

## 📞 **Next Steps After Testing**

1. **If working correctly:**
   - Add knowledge base documents
   - Configure phone number integration
   - Set up WebRTC for browser calls
   - Configure DND checking (TRAI compliance)

2. **If issues found:**
   - Check service logs
   - Verify all Docker containers are running
   - Review environment configuration
   - Check API response errors

---

## 📚 **Additional Resources**

- `VOICE_AGENT_QUICK_START.md` - Setup guide
- `VOICE_AGENT_FREE_IMPLEMENTATION_GUIDE.md` - Implementation details
- API Documentation: `/api/v1/voice-agents` endpoints

---

**Happy Testing! 🎉**

