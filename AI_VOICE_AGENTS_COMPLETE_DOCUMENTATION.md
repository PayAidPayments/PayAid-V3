# AI Voice Agents - Complete Implementation Documentation

**Version:** 3.0  
**Last Updated:** January 2026  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components & Services](#components--services)
4. [User Interaction Flow](#user-interaction-flow)
5. [Technical Implementation](#technical-implementation)
6. [Permissions & Security](#permissions--security)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The AI Voice Agents system enables real-time, bidirectional voice conversations between users and AI-powered agents. The system supports multiple Indian languages (Hindi, Tamil, Telugu, Kannada, Marathi, Gujarati, Punjabi, Bengali, Malayalam) and English, with natural conversation flow, knowledge base integration, and WebSocket-based real-time streaming.

### Key Features

- ✅ **Real-time Voice Communication** - WebSocket-based bidirectional audio streaming
- ✅ **Multi-language Support** - 10 Indian languages + English
- ✅ **Speech-to-Text (STT)** - OpenAI Whisper for accurate transcription
- ✅ **Text-to-Speech (TTS)** - Coqui XTTS v2 for natural voice synthesis
- ✅ **LLM Integration** - Ollama with fallback support
- ✅ **Knowledge Base (RAG)** - Chroma vector database for context-aware responses
- ✅ **Voice Activity Detection (VAD)** - Automatic speech detection and silence handling
- ✅ **Conversation History** - Per-call conversation context management
- ✅ **Multi-tenant Support** - Isolated agent management per tenant
- ✅ **Authentication & Authorization** - JWT-based security

---

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Browser (Frontend)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Voice Agent Demo Page (React/Next.js)                    │  │
│  │  - Microphone Access (getUserMedia)                       │  │
│  │  - Audio Recording & Streaming                            │  │
│  │  - WebSocket Client (useVoiceWebSocket hook)              │  │
│  │  - Real-time UI Updates                                   │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ WebSocket (ws://localhost:3001)
                           │ JWT Token Authentication
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│              WebSocket Server (Node.js/TypeScript)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  server/websocket-voice-server.ts                         │  │
│  │  - JWT Token Verification                                 │  │
│  │  - Connection Management                                  │  │
│  │  - Audio Chunk Processing                                 │  │
│  │  - Voice Activity Detection (VAD)                         │  │
│  │  - Call Record Creation (Prisma)                          │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ Voice Agent Orchestrator
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│            Voice Agent Orchestrator (TypeScript)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  lib/voice-agent/orchestrator.ts                          │  │
│  │  Pipeline: STT → Knowledge Base → LLM → TTS              │  │
│  │  - Conversation History Management                        │  │
│  │  - Tool Execution (optional)                              │  │
│  └───────┬───────────────┬───────────────┬──────────────────┘  │
└──────────┼───────────────┼───────────────┼─────────────────────┘
           │               │               │
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Speech-to- │ │  Knowledge  │ │  Text-to-   │
    │    Text     │ │    Base     │ │   Speech    │
    │   (STT)     │ │   (RAG)     │ │    (TTS)    │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           │               │               │
    ┌──────▼───────────────▼───────────────▼──────┐
    │         AI Gateway (FastAPI/Python)          │
    │  ┌────────────────────────────────────────┐ │
    │  │  services/ai-gateway/main.py           │ │
    │  │  - Request Routing                      │ │
    │  │  - Authentication (JWT)                │ │
    │  │  - Rate Limiting (Redis)                │ │
    │  │  - Usage Tracking                      │ │
    │  └───────┬───────────────┬────────────────┘ │
    └──────────┼───────────────┼─────────────────┘
               │               │
    ┌──────────▼──────┐ ┌──────▼──────────┐
    │  STT Service    │ │  TTS Service    │
    │  (Whisper)      │ │  (Coqui XTTS)   │
    │  Port: 7862     │ │  Port: 7861     │
    └─────────────────┘ └─────────────────┘
           │
           │
    ┌──────▼──────────────────────────────────┐
    │  LLM Service (Ollama)                   │
    │  - Text Generation                      │
    │  - Conversation Context                 │
    └─────────────────────────────────────────┘
           │
           │
    ┌──────▼──────────────────────────────────┐
    │  Chroma Vector Database                 │
    │  - Knowledge Base Storage               │
    │  - Semantic Search                      │
    │  Port: 8001                             │
    └─────────────────────────────────────────┘
           │
           │
    ┌──────▼──────────────────────────────────┐
    │  PostgreSQL Database (Prisma ORM)       │
    │  - VoiceAgent Model                     │
    │  - VoiceAgentCall Model                 │
    │  - Tenant Isolation                     │
    └─────────────────────────────────────────┘
```

### Data Flow

1. **User speaks** → Browser captures audio via `getUserMedia`
2. **Audio chunks** → Sent via WebSocket to server (base64 encoded)
3. **WebSocket Server** → Receives chunks, uses VAD to detect speech
4. **Orchestrator** → Processes audio through STT → Knowledge Base → LLM → TTS
5. **Response** → Audio + transcript sent back via WebSocket
6. **Browser** → Plays audio automatically, displays transcript

---

## 🧩 Components & Services

### 1. Frontend Components

#### **Voice Agent Demo Page**
- **Location:** `app/voice-agents/[tenantId]/Demo/page.tsx`
- **Purpose:** Main UI for voice agent interactions
- **Features:**
  - Microphone permission handling
  - Real-time audio recording
  - WebSocket connection management
  - Message display (transcript + responses)
  - Audio playback
  - Diagnostics modal for troubleshooting

#### **Voice Agent Home Page**
- **Location:** `app/voice-agents/[tenantId]/Home/page.tsx`
- **Purpose:** List and manage voice agents
- **Features:**
  - Agent listing with pagination
  - Create/Edit/Delete agents
  - Agent status management
  - Call history

#### **Voice Agent New Page**
- **Location:** `app/voice-agents/[tenantId]/New/page.tsx`
- **Purpose:** Create new voice agents
- **Features:**
  - Agent configuration form
  - Language selection
  - System prompt editor
  - Voice ID selection

#### **React Hooks**

**useVoiceWebSocket Hook**
- **Location:** `lib/hooks/useVoiceWebSocket.ts`
- **Purpose:** WebSocket connection management
- **Features:**
  - Auto-reconnection with retry logic
  - Connection state management
  - Audio streaming
  - Call lifecycle management
  - Error handling

### 2. Backend Services

#### **WebSocket Server**
- **Location:** `server/websocket-voice-server.ts`
- **Port:** 3001 (configurable via `WEBSOCKET_PORT`)
- **Technology:** Node.js + TypeScript + `ws` library
- **Features:**
  - JWT authentication
  - Real-time bidirectional communication
  - Voice Activity Detection (VAD)
  - Call record management
  - Per-call conversation history
  - Audio chunk buffering and processing

**Key Message Types:**
- `start_call` - Initialize a new call
- `audio` - Send audio chunk
- `end_call` - Terminate call
- `transcript` - Speech-to-text result
- `response` - LLM-generated text response
- `audio_response` - TTS-generated audio
- `error` - Error messages

#### **AI Gateway**
- **Location:** `services/ai-gateway/main.py`
- **Port:** 8000
- **Technology:** FastAPI (Python)
- **Purpose:** Centralized routing for AI services
- **Features:**
  - JWT authentication
  - Rate limiting (Redis)
  - Usage tracking
  - Health checks
  - Service routing (STT, TTS, Image-to-Text)

**Endpoints:**
- `POST /text-to-speech` - Convert text to speech
- `POST /speech-to-text` - Convert speech to text
- `POST /image-to-text` - Extract text from images
- `GET /health` - Service health check

#### **Speech-to-Text Service**
- **Container:** `payaid-speech-to-text`
- **Port:** 7862 (external), 7860 (internal)
- **Technology:** OpenAI Whisper (large-v3)
- **Model:** `openai/whisper-large-v3`
- **Features:**
  - Multi-language transcription
  - Automatic language detection
  - High accuracy

#### **Text-to-Speech Service**
- **Container:** `payaid-text-to-speech`
- **Port:** 7861 (external), 7860 (internal)
- **Technology:** Coqui TTS
- **Model:** `tts_models/multilingual/multi-dataset/xtts_v2`
- **Features:**
  - Multi-language support
  - Voice cloning
  - Natural voice synthesis

#### **Chroma Vector Database**
- **Container:** `payaid-chroma`
- **Port:** 8001
- **Purpose:** Knowledge base storage and semantic search
- **Features:**
  - Vector embeddings
  - Semantic search
  - Persistent storage

### 3. Core Libraries

#### **Voice Agent Orchestrator**
- **Location:** `lib/voice-agent/orchestrator.ts`
- **Purpose:** Coordinates the STT → LLM → TTS pipeline
- **Features:**
  - Conversation history management
  - Knowledge base integration
  - Tool execution support
  - Multi-language handling

#### **Speech-to-Text Module**
- **Location:** `lib/voice-agent/stt.ts`
- **Purpose:** Audio transcription
- **Integration:** AI Gateway → STT Service

#### **Text-to-Speech Module**
- **Location:** `lib/voice-agent/tts.ts`
- **Purpose:** Text-to-audio conversion
- **Integration:** AI Gateway → TTS Service

#### **LLM Module**
- **Location:** `lib/voice-agent/llm.ts`
- **Purpose:** Text generation
- **Integration:** Ollama (local) or cloud LLM APIs

#### **Knowledge Base Module**
- **Location:** `lib/voice-agent/knowledge-base.ts`
- **Purpose:** RAG (Retrieval-Augmented Generation)
- **Integration:** Chroma vector database

#### **Voice Activity Detector**
- **Location:** `lib/voice-agent/vad.ts`
- **Purpose:** Detect speech in audio streams
- **Features:**
  - Energy threshold detection
  - Silence duration tracking
  - Speech start/end detection

### 4. API Routes

#### **Voice Agents CRUD**
- **Location:** `app/api/v1/voice-agents/`
- **Endpoints:**
  - `POST /api/v1/voice-agents` - Create agent
  - `GET /api/v1/voice-agents` - List agents (with pagination)
  - `GET /api/v1/voice-agents/[id]` - Get agent details
  - `PUT /api/v1/voice-agents/[id]` - Update agent
  - `DELETE /api/v1/voice-agents/[id]` - Delete agent

#### **Voice Agent Demo**
- **Location:** `app/api/v1/voice-agents/[id]/demo/route.ts`
- **Endpoint:** `POST /api/v1/voice-agents/[id]/demo`
- **Purpose:** HTTP fallback for text-based interactions

#### **Voice Agent Calls**
- **Location:** `app/api/v1/voice-agents/[id]/calls/`
- **Endpoints:**
  - `POST /api/v1/voice-agents/[id]/calls` - Create call
  - `GET /api/v1/voice-agents/[id]/calls` - List calls
  - `POST /api/v1/voice-agents/[id]/calls/[callId]/process` - Process audio (HTTP mode)

### 5. Database Models

#### **VoiceAgent Model**
```prisma
model VoiceAgent {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  description   String?
  language      String   // 'hi', 'en', 'ta', etc.
  voiceId       String?
  voiceTone     String?
  systemPrompt  String
  phoneNumber   String?
  status        String   // 'active', 'paused', 'deleted'
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  calls         VoiceAgentCall[]
}
```

#### **VoiceAgentCall Model**
```prisma
model VoiceAgentCall {
  id            String   @id @default(cuid())
  agentId       String
  tenantId      String
  phone         String
  status        String   // 'answered', 'completed', 'failed'
  startTime     DateTime
  endTime       DateTime?
  transcript    String?
  languageUsed  String?
  dndChecked    Boolean  @default(false)
  agent         VoiceAgent @relation(...)
}
```

---

## 👥 User Interaction Flow

### 1. **Agent Creation Flow**

```
User → Navigate to /voice-agents/[tenantId]/New
     → Fill form (name, language, system prompt)
     → Submit → POST /api/v1/voice-agents
     → Agent created in database
     → Redirect to Home page
```

### 2. **Voice Call Flow (WebSocket Mode)**

```
User → Navigate to /voice-agents/[tenantId]/Demo?agentId=xxx
     → Page loads → Fetch agent details
     → Request microphone permission
     → Click "Start Call" → WebSocket connects
     → Send 'start_call' message
     → Server creates call record
     → User speaks → Audio chunks sent via WebSocket
     → Server processes: STT → LLM → TTS
     → Response audio + transcript sent back
     → Browser plays audio, displays transcript
     → Repeat until user ends call
     → Send 'end_call' message
     → Call record updated
```

### 3. **Microphone Permission Flow**

```
User → Page loads
     → Check navigator.permissions.query('microphone')
     → If 'prompt' → Show permission request UI
     → User clicks "Enable Microphone"
     → Call getUserMedia()
     → Browser shows permission prompt
     → User allows → Stream obtained
     → Auto-enable microphone (Google Meet style)
     → Start recording if call is active
```

### 4. **Error Handling Flow**

```
Error occurs → Logged to console
            → Error message sent via WebSocket
            → UI displays error with troubleshooting steps
            → User can retry or check diagnostics
```

---

## 🔧 Technical Implementation

### Environment Variables

```env
# AI Gateway
USE_AI_GATEWAY=true
AI_GATEWAY_URL=http://localhost:8000

# WebSocket
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001

# JWT (must match across services)
JWT_SECRET=your-secret-key-change-in-production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payaid

# Redis (for rate limiting)
REDIS_URL=redis://localhost:6379

# Chroma (Knowledge Base)
CHROMA_URL=http://localhost:8001
```

### Docker Services

**Start all services:**
```bash
docker-compose -f docker-compose.ai-services.yml up -d
```

**Services:**
- `ai-gateway` (Port 8000)
- `text-to-speech` (Port 7861)
- `speech-to-text` (Port 7862)
- `image-to-text` (Port 7864)
- `chroma` (Port 8001)

### Running the Application

**Terminal 1 - Next.js Server:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - WebSocket Server:**
```bash
npm run dev:websocket
# Runs on ws://localhost:3001
```

### Code Structure

```
PayAid V3/
├── app/
│   ├── api/v1/voice-agents/        # API routes
│   └── voice-agents/[tenantId]/    # Frontend pages
│       ├── Home/                   # Agent list
│       ├── New/                    # Create agent
│       └── Demo/                   # Voice demo
├── lib/
│   ├── hooks/
│   │   └── useVoiceWebSocket.ts    # WebSocket hook
│   └── voice-agent/
│       ├── orchestrator.ts         # Main orchestrator
│       ├── stt.ts                  # Speech-to-text
│       ├── tts.ts                  # Text-to-speech
│       ├── llm.ts                  # LLM integration
│       ├── knowledge-base.ts       # RAG
│       └── vad.ts                  # Voice activity detection
├── server/
│   └── websocket-voice-server.ts   # WebSocket server
└── services/
    └── ai-gateway/                 # AI Gateway service
        └── main.py
```

---

## 🔐 Permissions & Security

### Browser Permissions

#### **1. Microphone Permission**
- **API:** `navigator.mediaDevices.getUserMedia({ audio: true })`
- **Permission States:**
  - `granted` - User has allowed
  - `denied` - User has blocked
  - `prompt` - Browser will show prompt
  - `unknown` - Permission not yet requested
- **Handling:**
  - Check permission state on page load
  - Request permission if needed
  - Auto-enable microphone after permission granted
  - Show diagnostics if permission denied

#### **2. Secure Context Requirement**
- **Requirement:** HTTPS or localhost
- **Check:** `window.isSecureContext`
- **Impact:** `getUserMedia` only works in secure contexts

### Authentication & Authorization

#### **JWT Token Authentication**
- **Location:** Authorization header: `Bearer <token>`
- **Verification:**
  - WebSocket Server verifies token on connection
  - API routes verify token via `authenticateRequest()`
  - AI Gateway verifies token for service requests
- **Token Payload:**
  ```json
  {
    "userId": "user-id",
    "tenantId": "tenant-id",
    "email": "user@example.com"
  }
  ```

#### **Tenant Isolation**
- All agents are scoped to `tenantId`
- Database queries filter by `tenantId`
- Users can only access their tenant's agents

### Rate Limiting

- **Service:** Redis-based rate limiting
- **Limit:** 100 requests per hour per tenant per service
- **Tracking:** Per-service and total usage tracking

### CORS Configuration

- **Allowed Origins:** `http://localhost:3000`, `http://localhost:3001`
- **Methods:** All methods allowed
- **Headers:** All headers allowed
- **Credentials:** Enabled

---

## 🧪 Testing Guide

### 1. **Prerequisites**

```bash
# 1. Start Docker services
docker-compose -f docker-compose.ai-services.yml up -d

# 2. Verify services are running
docker ps | grep payaid

# 3. Check service health
curl http://localhost:8000/health
curl http://localhost:7861/health  # TTS
curl http://localhost:7862/health  # STT
curl http://localhost:8001/api/v1/heartbeat  # Chroma
```

### 2. **Start Application Servers**

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: WebSocket Server
npm run dev:websocket
```

### 3. **Test Agent Creation**

```bash
# 1. Login to get JWT token
# 2. Navigate to: http://localhost:3000/voice-agents/[tenantId]/New
# 3. Fill form:
#    - Name: "Test Agent"
#    - Language: "en" (or "hi")
#    - System Prompt: "You are a helpful assistant."
# 4. Submit
# 5. Verify agent appears in Home page
```

### 4. **Test Voice Call (WebSocket)**

```bash
# 1. Navigate to: http://localhost:3000/voice-agents/[tenantId]/Demo?agentId=xxx
# 2. Check browser console for:
#    - WebSocket connection status
#    - Microphone permission status
# 3. Click "Enable Microphone" (if needed)
# 4. Click "Start Call"
# 5. Speak into microphone
# 6. Verify:
#    - Transcript appears in chat
#    - Response text appears
#    - Audio response plays
```

### 5. **Test Microphone Permissions**

```bash
# Test Case 1: First-time permission
# - Open page in incognito mode
# - Should see permission prompt
# - Allow → Microphone should auto-enable

# Test Case 2: Denied permission
# - Block microphone in browser settings
# - Refresh page
# - Should see error with troubleshooting steps

# Test Case 3: Diagnostics
# - Click "Run Diagnostics" button
# - Verify all diagnostic information is displayed
# - Test "Copy" button
```

### 6. **Test API Endpoints**

```bash
# Get JWT token (from browser localStorage or login API)
TOKEN="your-jwt-token"

# List agents
curl -X GET http://localhost:3000/api/v1/voice-agents \
  -H "Authorization: Bearer $TOKEN"

# Create agent
curl -X POST http://localhost:3000/api/v1/voice-agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "language": "en",
    "systemPrompt": "You are helpful."
  }'

# Get agent
curl -X GET http://localhost:3000/api/v1/voice-agents/AGENT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### 7. **Test WebSocket Connection**

```bash
# Using wscat (install: npm install -g wscat)
wscat -c "ws://localhost:3001?token=YOUR_TOKEN&agentId=AGENT_ID"

# Send messages:
# {"type":"start_call","agentId":"xxx"}
# {"type":"audio","agentId":"xxx","callId":"xxx","data":"base64audio"}
# {"type":"end_call"}
```

### 8. **Test AI Gateway**

```bash
TOKEN="your-jwt-token"

# Test TTS
curl -X POST http://localhost:8000/text-to-speech \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test.",
    "language": "en"
  }'

# Test STT (requires audio file)
curl -X POST http://localhost:8000/speech-to-text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_url": "https://example.com/audio.wav",
    "language": "en"
  }'
```

### 9. **Test Knowledge Base**

```bash
# Upload document (if implemented)
# Search knowledge base
# Verify RAG responses include context
```

### 10. **Performance Testing**

```bash
# Test concurrent connections
# Test audio chunk processing latency
# Test WebSocket reconnection
# Test rate limiting
```

---

## 🐛 Troubleshooting

### Common Issues

#### **1. "WebSocket server not connected"**

**Symptoms:**
- Warning in browser console
- WebSocket connection fails

**Solutions:**
```bash
# 1. Check WebSocket server is running
npm run dev:websocket

# 2. Verify port 3001 is not in use
netstat -an | grep 3001

# 3. Check JWT_SECRET matches
# Ensure .env has same JWT_SECRET in both Next.js and WebSocket server

# 4. Check firewall/antivirus blocking port 3001
```

#### **2. "Microphone permission denied"**

**Symptoms:**
- Permission error in console
- Microphone not working

**Solutions:**
1. **Browser Settings:**
   - Click lock icon in address bar
   - Set Microphone to "Allow"
   - Refresh page

2. **Windows Privacy Settings:**
   - Windows Settings → Privacy → Microphone
   - Enable "Microphone access"
   - Enable "Allow apps to access your microphone"
   - Ensure browser is allowed

3. **Clear Site Data:**
   - DevTools (F12) → Application → Storage
   - Clear site data
   - Refresh page

4. **Check Secure Context:**
   - Must be HTTPS or localhost
   - Verify `window.isSecureContext === true`

#### **3. "Speech-to-text service is not available"**

**Symptoms:**
- AI Gateway returns error
- STT requests fail

**Solutions:**
```bash
# 1. Check Docker services
docker ps | grep speech-to-text

# 2. Check service health
curl http://localhost:7862/health

# 3. Check AI Gateway
curl http://localhost:8000/health

# 4. Check logs
docker logs payaid-speech-to-text
docker logs payaid-ai-gateway

# 5. Restart services
docker-compose -f docker-compose.ai-services.yml restart speech-to-text
docker-compose -f docker-compose.ai-services.yml restart ai-gateway
```

#### **4. "Authentication failed" (WebSocket)**

**Symptoms:**
- WebSocket closes with code 1008
- "Invalid token" error

**Solutions:**
1. **Verify JWT_SECRET matches:**
   - Check `.env` file
   - Ensure same secret in Next.js and WebSocket server
   - Restart both servers after changing

2. **Check token validity:**
   - Verify token is not expired
   - Check token format in browser console

3. **Verify token in connection:**
   - Check WebSocket URL includes token
   - Verify token is passed correctly

#### **5. "Page not loading" / "Spinning animation"**

**Symptoms:**
- Page stuck on loading
- Infinite spinner

**Solutions:**
1. **Check API calls:**
   - Open DevTools → Network tab
   - Check for failed requests
   - Verify API endpoints are responding

2. **Check authentication:**
   - Verify user is logged in
   - Check token is valid
   - Try logging out and back in

3. **Check useEffect hooks:**
   - Verify no infinite loops
   - Check dependencies in useEffect

#### **6. "No agents" showing on Home page**

**Symptoms:**
- Home page shows "No agents" but agent exists

**Solutions:**
1. **Check tenantId:**
   - Verify URL has correct tenantId
   - Check server logs for tenantId mismatch

2. **Check database:**
   - Verify agent exists in database
   - Check agent's tenantId matches user's tenantId

3. **Check API response:**
   - Open DevTools → Network
   - Check `/api/v1/voice-agents` response
   - Verify agents array is not empty

---

## 📊 Monitoring & Logging

### Log Locations

**WebSocket Server:**
- Console output (Terminal 2)
- Logs connection events, errors, message processing

**Next.js Server:**
- Console output (Terminal 1)
- Logs API requests, database queries, errors

**Docker Services:**
```bash
docker logs payaid-ai-gateway
docker logs payaid-text-to-speech
docker logs payaid-speech-to-text
docker logs payaid-chroma
```

### Key Log Messages

**WebSocket:**
- `[WebSocket] ✅ Connected successfully`
- `[WebSocket] Token verified successfully`
- `[WebSocket] Error processing message`

**API:**
- `[VoiceAgents] GET request - User: {...}`
- `[VoiceAgents] Agents for tenantId ... : X`
- `[VoiceAgents] Returning agents: {...}`

**Orchestrator:**
- `[VoiceAgent] Detected language: ...`
- `[VoiceAgent] Transcript: ...`
- `[VoiceAgent] Response: ...`

---

## 🔄 Deployment Checklist

### Pre-Deployment

- [ ] Update `JWT_SECRET` to strong random value
- [ ] Update `NEXT_PUBLIC_WEBSOCKET_URL` to production WebSocket URL
- [ ] Update CORS origins in AI Gateway
- [ ] Configure production database
- [ ] Set up Redis for rate limiting
- [ ] Configure SSL/TLS for WebSocket (wss://)
- [ ] Set up monitoring and logging
- [ ] Test all services in staging

### Production Environment Variables

```env
# Production .env
USE_AI_GATEWAY=true
AI_GATEWAY_URL=https://ai-gateway.yourdomain.com
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=wss://yourdomain.com
JWT_SECRET=<strong-random-secret>
DATABASE_URL=<production-db-url>
REDIS_URL=<production-redis-url>
CHROMA_URL=<production-chroma-url>
```

---

## 📚 Additional Resources

- **WebSocket Protocol:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **WebRTC getUserMedia:** https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- **FastAPI Documentation:** https://fastapi.tiangolo.com/
- **Coqui TTS:** https://github.com/coqui-ai/TTS
- **OpenAI Whisper:** https://github.com/openai/whisper
- **Chroma DB:** https://www.trychroma.com/

---

## 📝 Changelog

### Version 3.0 (January 2026)
- ✅ Real-time WebSocket voice streaming
- ✅ Voice Activity Detection (VAD)
- ✅ Multi-language support (10 Indian languages + English)
- ✅ Knowledge base integration (RAG)
- ✅ Microphone auto-enable after permission
- ✅ Comprehensive error handling and diagnostics
- ✅ Per-call conversation history
- ✅ Multi-tenant isolation

---

## 🤝 Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check browser console and server logs
4. Review diagnostic information in UI
5. Contact development team

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Maintained By:** PayAid Development Team
