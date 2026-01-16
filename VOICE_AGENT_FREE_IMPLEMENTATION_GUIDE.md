# 🆓 Voice Agent - FREE Implementation Guide
## Build AI Voice Agents with Zero External Costs

This guide shows you how to build Voice Agents using **100% free, open-source, and self-hosted** solutions that you already have in your platform.

---

## ✅ **GOOD NEWS: You Already Have Most Components!**

Your platform already includes:
- ✅ **Ollama** (Local LLM) - FREE
- ✅ **Coqui TTS** (Text-to-Speech) - FREE
- ✅ **Whisper** (Speech-to-Text) - FREE
- ✅ **PostgreSQL** (Database) - FREE
- ✅ **Redis** (Cache) - FREE

**What We Need to Add:**
- 🔧 **Free Telephony Solution** (WebRTC/SIP)
- 🔧 **Vector DB** (for Knowledge Base)
- 🔧 **Voice Agent Orchestration Layer**

---

## 🎯 **FREE STACK COMPARISON**

| Component | Original (Paid) | Free Alternative | Status |
|-----------|----------------|------------------|--------|
| **LLM** | Gemini 2.5 Live ($) | **Ollama (Local)** | ✅ Already Setup |
| **STT** | Google STT ($) | **Whisper (Local)** | ✅ Already Setup |
| **TTS** | Azure TTS ($) | **Coqui TTS (Local)** | ✅ Already Setup |
| **Telephony** | Exotel ($) | **WebRTC/SIP.js** | 🔧 Need to Add |
| **Vector DB** | Pinecone ($) | **Chroma/Qdrant** | 🔧 Need to Add |
| **Infrastructure** | AWS ($) | **Local/Docker** | ✅ Already Setup |

**Total Cost: ₹0/month** 🎉

---

## 📦 **COMPONENT 1: LLM (Language Model)**

### ✅ **Already Setup: Ollama (Local)**

**Current Configuration:**
```env
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.1:8b"
```

**For Voice Agents:**
- ✅ **Free Forever** - No API costs
- ✅ **Low Latency** - Runs locally (<2s response)
- ✅ **Privacy** - Data never leaves your server
- ✅ **Supports Hindi/English** - Llama 3.1 handles both

**Usage:**
```typescript
// lib/voice-agent/llm.ts
import { aiService } from '@/lib/ai'

export async function generateVoiceResponse(
  prompt: string,
  conversationHistory: Array<{role: string, content: string}>
): Promise<string> {
  // Use existing Ollama integration
  const response = await aiService.chat({
    messages: [
      { role: 'system', content: prompt },
      ...conversationHistory,
    ],
    model: 'ollama', // Uses local Ollama
  })
  
  return response.text
}
```

**Note:** For real-time voice, you may need to use streaming responses. Ollama supports this!

---

## 📦 **COMPONENT 2: Speech-to-Text (STT)**

### ✅ **Already Setup: Whisper (Local)**

**Current Setup:**
- Service: `services/speech-to-text/server.py`
- Model: `openai/whisper-large-v3`
- API: `http://localhost:8000/stt` (via AI Gateway)

**For Voice Agents:**
- ✅ **Free** - No API costs
- ✅ **Supports Hindi/English** - Whisper handles 99+ languages
- ✅ **High Accuracy** - 85-90% for Hindi
- ✅ **Real-time** - Can process streaming audio

**Usage:**
```typescript
// lib/voice-agent/stt.ts
import { aiGateway } from '@/lib/ai/gateway'

export async function transcribeAudio(
  audioUrl: string,
  language?: 'hi' | 'en'
): Promise<string> {
  const result = await aiGateway.speechToText({
    audio_url: audioUrl,
    language: language,
    task: 'transcribe',
  })
  
  return result.text
}
```

**Enable in `.env`:**
```env
USE_AI_GATEWAY="true"
AI_GATEWAY_URL="http://localhost:8000"
```

---

## 📦 **COMPONENT 3: Text-to-Speech (TTS)**

### ✅ **Already Setup: Coqui TTS (Local)**

**Current Setup:**
- Service: `services/text-to-speech/server.py`
- Model: `tts_models/multilingual/multi-dataset/xtts_v2`
- API: `http://localhost:8000/tts` (via AI Gateway)

**For Voice Agents:**
- ✅ **Free** - No API costs
- ✅ **Multilingual** - Supports Hindi, English, and 17+ languages
- ✅ **Voice Cloning** - Can clone voices (advanced feature)
- ✅ **Natural Sounding** - High-quality neural voices

**Usage:**
```typescript
// lib/voice-agent/tts.ts
import { aiGateway } from '@/lib/ai/gateway'

export async function synthesizeSpeech(
  text: string,
  language: 'hi' | 'en' = 'en',
  voice?: string
): Promise<Buffer> {
  const result = await aiGateway.textToSpeech({
    text: text,
    language: language,
    voice: voice,
    speed: 1.0,
  })
  
  // Returns audio buffer
  return Buffer.from(result.audio, 'base64')
}
```

**Available Voices (Coqui XTTS v2):**
- English: `en_female`, `en_male`
- Hindi: `hi_female`, `hi_male`
- Can clone custom voices

---

## 📦 **COMPONENT 4: Telephony (FREE ALTERNATIVES)**

### **Option A: WebRTC (Recommended for MVP)**

**Best for:**
- Web-based testing
- Browser-to-browser calls
- No phone number needed
- 100% free

**Technology:**
- **SIP.js** - WebRTC library
- **Simple-peer** - P2P WebRTC
- **Daily.co** - Free tier (1000 min/month)

**Implementation:**
```typescript
// lib/voice-agent/telephony/webrtc.ts
import Peer from 'simple-peer'

export class WebRTCCall {
  private peer: Peer.Instance
  
  async initiateCall(audioStream: MediaStream) {
    this.peer = new Peer({
      initiator: true,
      stream: audioStream,
    })
    
    // Handle connection
    this.peer.on('signal', (data) => {
      // Send signaling data to other peer
    })
    
    this.peer.on('stream', (remoteStream) => {
      // Handle incoming audio
    })
  }
}
```

**Pros:**
- ✅ Completely free
- ✅ No phone numbers needed
- ✅ Works in browser
- ✅ Low latency

**Cons:**
- ⚠️ Requires browser/app
- ⚠️ Not traditional phone calls
- ⚠️ Limited to web users

---

### **Option B: FreeSWITCH (Self-Hosted SIP)**

**Best for:**
- Real phone calls
- SIP trunking
- Production use

**Setup:**
```bash
# Docker container
docker run -d \
  --name freeswitch \
  -p 5060:5060/udp \
  -p 5060:5060/tcp \
  -p 8021:8021/tcp \
  -p 16384-32768:16384-32768/udp \
  freeswitch/freeswitch:latest
```

**Pros:**
- ✅ Open-source (free)
- ✅ Full SIP support
- ✅ Can make real phone calls
- ✅ Production-ready

**Cons:**
- ⚠️ Need SIP provider (some free options)
- ⚠️ More complex setup
- ⚠️ Requires server resources

---

### **Option C: Twilio Free Trial**

**Best for:**
- Quick testing
- Real phone numbers
- Easy integration

**Free Tier:**
- $15.50 free credit
- ~1000 minutes of calls
- Valid for testing

**Note:** After free trial, costs ~$0.013/min (still cheaper than Exotel)

---

### **Option D: SIP.js + Free SIP Provider**

**Free SIP Providers:**
1. **Linphone** - Free SIP account
2. **Zoiper** - Free SIP account
3. **SIP2SIP** - Free SIP account

**Implementation:**
```typescript
// lib/voice-agent/telephony/sip.ts
import { UserAgent, Registerer } from 'sip.js'

export class SIPCall {
  private userAgent: UserAgent
  
  async connect(sipUri: string, password: string) {
    this.userAgent = new UserAgent({
      uri: sipUri,
      transportOptions: {
        server: 'sip:sip2sip.info',
      },
    })
    
    await this.userAgent.start()
    
    const registerer = new Registerer(this.userAgent)
    await registerer.register()
  }
  
  async makeCall(phoneNumber: string) {
    // Make outbound call via SIP
  }
}
```

---

## 📦 **COMPONENT 5: Vector Database (Knowledge Base)**

### **Option A: Chroma (Recommended)**

**Free, Open-Source, Lightweight**

**Setup:**
```bash
# Docker
docker run -d \
  --name chroma \
  -p 8000:8000 \
  chromadb/chroma:latest
```

**Usage:**
```typescript
// lib/voice-agent/knowledge-base.ts
import { ChromaClient } from 'chromadb'

const client = new ChromaClient({
  path: 'http://localhost:8000',
})

export async function addToKnowledgeBase(
  agentId: string,
  documents: string[]
) {
  const collection = await client.getOrCreateCollection({
    name: `agent-${agentId}`,
  })
  
  // Generate embeddings using Ollama
  const embeddings = await generateEmbeddings(documents)
  
  await collection.add({
    ids: documents.map((_, i) => `doc-${i}`),
    embeddings: embeddings,
    documents: documents,
  })
}

export async function searchKnowledgeBase(
  agentId: string,
  query: string,
  topK: number = 3
) {
  const collection = await client.getCollection({
    name: `agent-${agentId}`,
  })
  
  const queryEmbedding = await generateEmbedding(query)
  
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  })
  
  return results.documents[0]
}
```

**Pros:**
- ✅ Completely free
- ✅ Lightweight
- ✅ Easy to use
- ✅ Good performance

---

### **Option B: PostgreSQL + pgvector**

**Use existing PostgreSQL with vector extension**

**Setup:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table
CREATE TABLE agent_knowledge (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Ollama embedding size
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index
CREATE INDEX ON agent_knowledge 
USING ivfflat (embedding vector_cosine_ops);
```

**Pros:**
- ✅ No separate service needed
- ✅ Uses existing database
- ✅ Free (part of PostgreSQL)

---

## 📦 **COMPONENT 6: Voice Agent Orchestration**

### **Architecture:**

```
┌─────────────────────────────────────────┐
│      Voice Agent Orchestrator            │
│  (lib/voice-agent/orchestrator.ts)       │
└─────────────────────────────────────────┘
           │
    ┌──────┼──────┐
    │      │      │
    ▼      ▼      ▼
┌─────┐ ┌─────┐ ┌─────┐
│ STT │ │ LLM │ │ TTS │
│(Whisper)│(Ollama)│(Coqui)│
└─────┘ └─────┘ └─────┘
    │      │      │
    └──────┼──────┘
           │
    ┌──────▼──────┐
    │  WebRTC/SIP │
    │  Telephony  │
    └─────────────┘
```

### **Implementation:**

```typescript
// lib/voice-agent/orchestrator.ts
import { transcribeAudio } from './stt'
import { generateVoiceResponse } from './llm'
import { synthesizeSpeech } from './tts'
import { searchKnowledgeBase } from './knowledge-base'

export class VoiceAgentOrchestrator {
  private conversationHistory: Array<{role: string, content: string}> = []
  
  async processVoiceCall(
    agentId: string,
    audioChunk: Buffer,
    language: 'hi' | 'en' = 'en'
  ): Promise<Buffer> {
    // Step 1: Speech-to-Text
    const transcript = await transcribeAudio(audioChunk, language)
    
    // Step 2: Search Knowledge Base (RAG)
    const context = await searchKnowledgeBase(agentId, transcript)
    
    // Step 3: Generate Response (LLM)
    const agentPrompt = await this.getAgentPrompt(agentId)
    const response = await generateVoiceResponse(
      `${agentPrompt}\n\nContext: ${context}`,
      this.conversationHistory
    )
    
    // Update conversation history
    this.conversationHistory.push(
      { role: 'user', content: transcript },
      { role: 'assistant', content: response }
    )
    
    // Step 4: Text-to-Speech
    const audioResponse = await synthesizeSpeech(response, language)
    
    return audioResponse
  }
  
  private async getAgentPrompt(agentId: string): Promise<string> {
    // Fetch from database
    const agent = await prisma.voiceAgent.findUnique({
      where: { id: agentId },
    })
    return agent?.systemPrompt || ''
  }
}
```

---

## 🚀 **QUICK START: Build Voice Agent MVP**

### **Step 1: Enable Existing Services**

```bash
# Start AI services (if not running)
docker-compose -f docker-compose.ai-services.yml up -d

# Start Ollama (if not running)
docker-compose -f docker-compose.ollama.yml up -d
```

### **Step 2: Add Chroma (Vector DB)**

```bash
# Add to docker-compose.yml
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma-data:/chroma/chroma
```

### **Step 3: Create Voice Agent Module**

```typescript
// lib/voice-agent/index.ts
export * from './orchestrator'
export * from './stt'
export * from './tts'
export * from './llm'
export * from './knowledge-base'
```

### **Step 4: Create API Endpoints**

```typescript
// app/api/v1/voice-agents/route.ts
import { VoiceAgentOrchestrator } from '@/lib/voice-agent'

export async function POST(request: NextRequest) {
  const { agentId, audioData, language } = await request.json()
  
  const orchestrator = new VoiceAgentOrchestrator()
  const audioResponse = await orchestrator.processVoiceCall(
    agentId,
    Buffer.from(audioData, 'base64'),
    language
  )
  
  return NextResponse.json({
    audio: audioResponse.toString('base64'),
  })
}
```

### **Step 5: WebRTC Frontend**

```typescript
// app/voice-agent/page.tsx
'use client'

import { useEffect, useRef } from 'react'

export default function VoiceAgentPage() {
  const audioRef = useRef<HTMLAudioElement>(null)
  
  useEffect(() => {
    // Get user's microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Process audio chunks
        const mediaRecorder = new MediaRecorder(stream)
        
        mediaRecorder.ondataavailable = async (event) => {
          // Send to backend
          const response = await fetch('/api/v1/voice-agents', {
            method: 'POST',
            body: JSON.stringify({
              agentId: 'agent-123',
              audioData: await blobToBase64(event.data),
              language: 'en',
            }),
          })
          
          const { audio } = await response.json()
          // Play response
          if (audioRef.current) {
            audioRef.current.src = `data:audio/wav;base64,${audio}`
            audioRef.current.play()
          }
        }
        
        mediaRecorder.start(1000) // Record 1-second chunks
      })
  }, [])
  
  return <audio ref={audioRef} autoPlay />
}
```

---

## 💰 **COST COMPARISON**

### **Original Plan (Paid):**
- Gemini 2.5 Live: ~$0.05/min = ₹4/min
- Google STT: ~$0.006/min = ₹0.50/min
- Azure TTS: ~$0.015/min = ₹1.25/min
- Exotel: ~₹2-3/min
- Pinecone: ~$70/month = ₹5,800/month
- **Total: ~₹7-8/min + ₹5,800/month**

### **Free Plan:**
- Ollama: ₹0 (local)
- Whisper: ₹0 (local)
- Coqui TTS: ₹0 (local)
- WebRTC: ₹0 (free)
- Chroma: ₹0 (local)
- **Total: ₹0/month** 🎉

**Savings: 100%** (₹0 vs ₹7-8/min + ₹5,800/month)

---

## ⚠️ **TRADE-OFFS**

### **Pros:**
- ✅ **Zero cost** - Completely free
- ✅ **Privacy** - All data stays local
- ✅ **No rate limits** - Use as much as you want
- ✅ **Full control** - Customize everything

### **Cons:**
- ⚠️ **Hardware requirements** - Need decent CPU/RAM
- ⚠️ **Setup complexity** - More moving parts
- ⚠️ **Maintenance** - You maintain services
- ⚠️ **Scalability** - Limited by hardware (can scale horizontally)

### **Mitigation:**
- Start with free tier
- Scale to paid services only when needed
- Use hybrid approach (free primary, paid fallback)

---

## 🎯 **RECOMMENDED APPROACH**

### **Phase 1: MVP (Free)**
1. Use **Ollama** for LLM (already setup)
2. Use **Whisper** for STT (already setup)
3. Use **Coqui TTS** for TTS (already setup)
4. Use **WebRTC** for telephony (free)
5. Use **Chroma** for vector DB (free)
6. Build basic voice agent

### **Phase 2: Scale (Hybrid)**
1. Keep free services as primary
2. Add paid fallback (Gemini, Exotel) for high load
3. Monitor costs and usage
4. Optimize based on actual usage

### **Phase 3: Production (Optimize)**
1. Use free services for 80% of traffic
2. Use paid services for 20% (peak times, premium features)
3. Cost: ~₹1-2/min (vs ₹7-8/min)

---

## 📝 **NEXT STEPS**

1. ✅ **Review this guide** - Understand free options
2. 🔧 **Enable AI services** - Start Docker containers
3. 🔧 **Add Chroma** - Set up vector database
4. 🔧 **Build orchestrator** - Create voice agent logic
5. 🔧 **Add WebRTC** - Implement telephony layer
6. 🧪 **Test MVP** - Build first working voice agent
7. 🚀 **Deploy** - Launch to users

---

## 🆘 **NEED HELP?**

If you want me to:
1. **Set up Chroma** - Add vector database
2. **Build orchestrator** - Create voice agent logic
3. **Add WebRTC** - Implement telephony
4. **Create API endpoints** - Build REST API
5. **Build frontend** - Create dashboard

Just let me know! I can help implement any of these components.

---

**Status:** ✅ **Ready to Build** - All free components available!

**Estimated Time:** 2-3 weeks for MVP (vs 6 weeks for paid version)

**Cost:** ₹0/month 🎉

