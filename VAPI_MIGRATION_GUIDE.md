# AI Voice Agents → VAPI-Style Architecture Migration
## Comprehensive Implementation Guide for Cursor

**Status:** Critical Architecture Redesign  
**Priority:** High - Complete Rebuild Required  
**Target Match:** VAPI.ai Feature Parity  
**Timeline:** 2-3 Weeks for MVP

---

## ❌ WHAT'S WRONG WITH CURRENT IMPLEMENTATION

### 1. **FUNDAMENTAL ARCHITECTURE FLAW: Browser-Based Microphone Capture**

**Current Problem:**
```
User speaks → Browser captures audio via getUserMedia() 
→ Sends to WebSocket server 
→ Server processes STT → LLM → TTS 
→ Response sent back to browser
```

**Why This Fails:**
- ❌ **Requires user's microphone permission** - Creates friction
- ❌ **Not suitable for phone calls** - This is a WEB interface, not a TELEPHONY interface
- ❌ **Latency issues** - Browser audio processing adds delays
- ❌ **Recording then processing** - This is BATCH, not real-time streaming
- ❌ **No actual phone integration** - No phone numbers, no call infrastructure
- ❌ **Can't handle incoming calls** - Only outbound from browser
- ❌ **Unreliable audio quality** - Browser audio encoding varies
- ❌ **Security concerns** - Sensitive voice data crossing unencrypted channels
- ❌ **Not scalable** - Each user needs browser connection

**VAPI Does This:** ✅ Receives INCOMING phone calls on actual phone numbers
**Your Current System:** ❌ Requires browser microphone permission (fake testing interface)

---

### 2. **MISSING: ACTUAL TELEPHONY INFRASTRUCTURE**

| Feature | Current | VAPI | Gap |
|---------|---------|------|-----|
| **Phone Numbers** | ❌ None | ✅ Real DID/E.164 | CRITICAL |
| **Incoming Calls** | ❌ Not possible | ✅ Full inbound | CRITICAL |
| **Outbound Calls** | ❌ Not implemented | ✅ Full outbound | CRITICAL |
| **SIP/Telephony** | ❌ None | ✅ SIP/RTP/PSTN | CRITICAL |
| **Call Recording** | ❌ Not automatic | ✅ Automatic transcripts | HIGH |
| **DTMF Support** | ❌ None | ✅ Keypad input | MEDIUM |
| **Voicemail** | ❌ None | ✅ Integrated | MEDIUM |
| **Call Transfer/Hold** | ❌ None | ✅ Full support | HIGH |
| **Carrier Integration** | ❌ None | ✅ Twilio/Vonage/AWS | CRITICAL |

---

### 3. **MISSING: REAL-TIME STREAMING ARCHITECTURE**

**Current (WRONG):**
```
User → Browser records audio → Chunks sent to server 
→ Voice Activity Detection (VAD) waits for silence 
→ STT processes entire utterance 
→ LLM generates response 
→ TTS synthesizes audio 
→ Audio sent back to browser
```
**Latency: 2000-5000ms** ⚠️

**VAPI (CORRECT):**
```
PSTN Call → Telephony Gateway → Real-time Audio Stream (8kHz, 16-bit) 
→ Parallel Processing: STT (streaming) + VAD (continuous) 
→ Partial transcript → LLM starts processing during speech 
→ TTS streams response while LLM still generating 
→ RTP packets sent back during conversation
```
**Latency: 400-600ms** ✅

**Key Difference:**
- Current: Waits for silence → Then processes
- VAPI: Processes WHILE user is still speaking

---

### 4. **MISSING: CONTINUOUS VAD (NOT SILENCE-BASED)**

**Current Implementation:**
```typescript
// Wrong approach
detect speech → wait for X seconds of silence → process
```

**VAPI Approach:**
```typescript
// Correct approach
continuous VAD analysis → detect speech start 
→ stream to STT immediately 
→ stream partial results to LLM 
→ LLM can interrupt if needed 
→ natural turn-taking
```

---

### 5. **MISSING: CONCURRENT PROCESSING PIPELINE**

**Current (Sequential):**
```
Audio → STT (complete) → LLM (complete) → TTS (complete) → Response
```

**VAPI (Concurrent):**
```
Audio → STT (streaming) ──┐
                           ├─→ LLM (streaming) ──→ TTS (streaming) ──→ Response
                    VAD (continuous) ──┘
```

The difference: VAPI starts generating response BEFORE user finishes speaking.

---

## ✅ WHAT YOU NEED TO BUILD

### PHASE 1: TELEPHONY INTEGRATION (WEEKS 1-2)

#### Step 1.1: Choose Carrier Provider
```
Option A: TWILIO (Easiest, most tutorials)
Option B: AWS CONNECT
Option C: VONAGE/BANDWIDTH
Option D: OpenSIP (Self-hosted, hardest)

RECOMMENDED: Twilio (pay-as-you-go, $0.009/min)
```

#### Step 1.2: Set Up Phone Number
```bash
# TWILIO SETUP INSTRUCTIONS FOR CURSOR:

1. Create Twilio Account
   - Visit https://www.twilio.com/console/phone-numbers/incoming
   - Buy phone number (US: +1xxx-xxx-xxxx, India: +91xxxxxxxxxx)
   - Cost: $1-2/month + usage

2. Create TwiML Application
   - Name: "PayAid Voice Agents"
   - Voice URL: https://your-domain.com/api/v1/voice-agents/twilio/webhook
   - Voice Method: POST
   - Enable Webhook authentication

3. Create REST API Credentials
   - Get Account SID: ACxxxxxxxxxxxxx
   - Get Auth Token: your-token-here
   - Create API Key (better security)
   - Store in .env as:
     TWILIO_ACCOUNT_SID=ACxxxxx
     TWILIO_AUTH_TOKEN=xxxxx
     TWILIO_PHONE_NUMBER=+1234567890
     TWILIO_API_KEY=xxxx
     TWILIO_API_SECRET=xxxx

4. Install Twilio SDK
   npm install twilio twilio-voice-react
```

#### Step 1.3: Create Telephony Webhook Handler
```typescript
// app/api/v1/voice-agents/twilio/webhook.ts

import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Twilio call parameters
    const callSid = formData.get('CallSid');
    const from = formData.get('From');
    const to = formData.get('To');
    const callStatus = formData.get('CallStatus');
    
    // Log incoming call
    console.log('[Twilio Webhook] Incoming Call:', {
      callSid,
      from,
      to,
      callStatus,
      timestamp: new Date()
    });

    // Create TwiML response
    const twiml = new VoiceResponse();
    
    // Connect to WebSocket for real-time streaming
    twiml.connect({
      action: `https://your-domain.com/api/v1/voice-agents/twilio/connect-status`
    }).stream({
      url: `wss://your-domain.com/voice/stream/${callSid}`,
      track: 'inbound_track'
    });

    // Set response headers
    const response = new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });

    return response;

  } catch (error) {
    console.error('[Twilio Webhook] Error:', error);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, something went wrong.');
    return new NextResponse(twiml.toString(), {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}
```

---

### PHASE 2: REAL-TIME AUDIO STREAMING (WEEKS 1.5-2)

#### Step 2.1: Create WebSocket Server for Audio Streaming
```typescript
// server/telephony-voice-stream.ts

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { VoiceAgent } from '@/types';

interface StreamSession {
  callSid: string;
  ws: WebSocket;
  agentId: string;
  audioBuffer: Buffer;
  sttStream: any; // Deepgram/Gladia streaming client
  llmStream: any; // LLM streaming client
  ttsStream: any; // TTS streaming client
  isListening: boolean;
  partialTranscript: string;
  fullTranscript: string;
}

// Store active sessions
const activeSessions = new Map<string, StreamSession>();

// Create WebSocket server on port 3002
const wsServer = new WebSocket.Server({ port: 3002 });

wsServer.on('connection', (ws: WebSocket, req) => {
  const url = new URL(req.url, 'http://localhost');
  const callSid = url.searchParams.get('callSid');
  const agentId = url.searchParams.get('agentId');

  if (!callSid || !agentId) {
    ws.close(1002, 'Missing callSid or agentId');
    return;
  }

  console.log('[Audio Stream] New connection:', { callSid, agentId });

  const session: StreamSession = {
    callSid,
    ws,
    agentId,
    audioBuffer: Buffer.alloc(0),
    sttStream: null,
    llmStream: null,
    ttsStream: null,
    isListening: true,
    partialTranscript: '',
    fullTranscript: ''
  };

  activeSessions.set(callSid, session);

  // Initialize STT streaming (Deepgram recommended)
  initializeSTTStream(session);
  
  // Initialize LLM streaming
  initializeLLMStream(session);
  
  // Initialize TTS streaming
  initializeTTSStream(session);

  // Handle incoming audio
  ws.on('message', (data: Buffer) => {
    handleAudioChunk(session, data);
  });

  ws.on('close', () => {
    console.log('[Audio Stream] Connection closed:', callSid);
    finalizeSession(session);
    activeSessions.delete(callSid);
  });

  ws.on('error', (error) => {
    console.error('[Audio Stream] Error:', error);
  });
});

async function handleAudioChunk(session: StreamSession, data: Buffer) {
  // Audio comes as μ-law encoded (Twilio format)
  // Convert to PCM 16-bit
  const pcmAudio = decodeMulaw(data);

  // Send to STT streaming
  if (session.sttStream && session.isListening) {
    session.sttStream.write(pcmAudio);
  }

  // Update audio buffer for VAD
  session.audioBuffer = Buffer.concat([session.audioBuffer, pcmAudio]);
}

function initializeSTTStream(session: StreamSession) {
  // Use Deepgram for real-time STT (lowest latency)
  // Alternative: Gladia, Google STT, OpenAI Whisper API
  
  const deepgramClient = new Deepgram(process.env.DEEPGRAM_API_KEY);
  
  session.sttStream = deepgramClient.transcription.live({
    model: 'nova-2',
    language: 'en',
    // Enable interim results (partial transcripts)
    interim_results: true,
    // Enable VAD (Voice Activity Detection) 
    vad_events: true,
    // High accuracy mode
    endpointing: 300 // milliseconds of silence = end of speech
  });

  // Listen to partial results (mid-sentence)
  session.sttStream.on('transcriptReceived', (message) => {
    const { transcript, is_final } = message.channel.alternatives[0];

    if (is_final) {
      console.log('[STT] Final:', transcript);
      session.fullTranscript += ' ' + transcript;
      
      // Send final transcript to LLM
      sendToLLM(session, transcript, true);
    } else {
      console.log('[STT] Partial:', transcript);
      session.partialTranscript = transcript;
      
      // Send partial transcript to user (show on dashboard)
      broadcastToClient(session, {
        type: 'transcript_partial',
        text: transcript
      });
    }
  });

  session.sttStream.on('close', () => {
    console.log('[STT] Stream closed');
  });

  session.sttStream.on('error', (error) => {
    console.error('[STT] Error:', error);
  });
}

function initializeLLMStream(session: StreamSession) {
  // Use streaming LLM for real-time response generation
  // Options: OpenAI, Anthropic Claude, Groq (fastest)
  
  session.llmStream = {
    buffer: '',
    isGenerating: false
  };
}

async function sendToLLM(
  session: StreamSession, 
  userMessage: string, 
  isFinal: boolean
) {
  if (!isFinal) return; // Only send final transcripts to LLM

  const agent = await getVoiceAgent(session.agentId);
  const conversationHistory = await getCallHistory(session.callSid);

  // Build messages for LLM
  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ];

  // Stream from LLM
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages,
      stream: true,
      temperature: 0.7
    })
  });

  const reader = response.body.getReader();

  let fullResponse = '';

  // Read streaming response
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = new TextDecoder().decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        const content = data.choices[0].delta.content || '';
        
        if (content) {
          fullResponse += content;
          
          // Send to TTS immediately (streaming)
          sendToTTS(session, content, false);
        }
      }
    }
  }

  // Mark end of response
  sendToTTS(session, '', true);

  // Save to conversation history
  await saveCallMessage(session.callSid, {
    role: 'user',
    content: userMessage
  });

  await saveCallMessage(session.callSid, {
    role: 'assistant',
    content: fullResponse
  });
}

function initializeTTSStream(session: StreamSession) {
  // Use streaming TTS for real-time audio output
  // Options: ElevenLabs (best quality), Google TTS, Azure Speech, Coqui
  
  session.ttsStream = {
    buffer: '',
    audioQueue: [] as Buffer[]
  };
}

async function sendToTTS(
  session: StreamSession,
  textChunk: string,
  isFinal: boolean
) {
  // Buffer text until we have enough for efficient TTS
  session.ttsStream.buffer += textChunk;

  // Process in chunks (every 2-3 words or final)
  const sentences = session.ttsStream.buffer.split(/([.!?])\s+/);
  
  if (!isFinal && sentences.length < 2) return; // Wait for sentence

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;

    // Get audio from TTS service
    const audioBuffer = await synthesizeToAudio(session, sentence);
    
    // Queue audio for playback
    session.ttsStream.audioQueue.push(audioBuffer);
    
    // Start playing immediately
    playAudioToTelephone(session, audioBuffer);
  }

  session.ttsStream.buffer = '';
}

async function synthesizeToAudio(
  session: StreamSession,
  text: string
): Promise<Buffer> {
  // Use ElevenLabs for best voice quality
  const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID/stream',
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    }
  );

  return Buffer.from(await response.arrayBuffer());
}

function playAudioToTelephone(session: StreamSession, audioBuffer: Buffer) {
  // Convert PCM audio to μ-law (Twilio format)
  const mulawAudio = encodeMulaw(audioBuffer);
  
  // Send to caller's phone via WebSocket
  if (session.ws.readyState === WebSocket.OPEN) {
    session.ws.send(JSON.stringify({
      type: 'audio',
      payload: mulawAudio.toString('base64')
    }));
  }
}

export { wsServer, activeSessions };
```

---

### PHASE 3: ENHANCED VOICE ORCHESTRATION (WEEK 2)

#### Step 3.1: Create Real-Time Orchestrator
```typescript
// lib/voice-agent/telephony-orchestrator.ts

import { VoiceAgent, VoiceAgentCall } from '@/types';

export class TelephonyVoiceOrchestrator {
  private session: StreamSession;
  private agent: VoiceAgent;
  private callRecord: VoiceAgentCall;

  constructor(session: StreamSession, agent: VoiceAgent) {
    this.session = session;
    this.agent = agent;
  }

  /**
   * Main orchestration: Handles real-time voice flow
   * CRITICAL: This runs DURING the call, not after
   */
  async orchestrate() {
    // 1. Continuous VAD (Voice Activity Detection)
    this.startContinuousVAD();

    // 2. Initialize conversation with greeting
    const greeting = await this.generateGreeting();
    await this.synthesizeAndPlay(greeting);

    // 3. Main conversation loop
    while (this.session.callActive) {
      // VAD detects user speech
      const userAudio = await this.waitForSpeech();

      // Parallel: Transcribe while generating response
      const [transcript, ...] = await Promise.all([
        this.transcribeAudio(userAudio),
        this.generateAndStreamResponse(userAudio)
      ]);

      // Wait for LLM to finish
      const response = await this.llmStream.complete();

      // Start playing TTS while still listening
      await this.synthesizeAndPlay(response);
    }
  }

  private startContinuousVAD() {
    // Real-time Voice Activity Detection
    // This runs continuously, not wait-for-silence
    
    const VAD_THRESHOLD = 0.5; // Confidence threshold
    const SILENCE_DURATION = 800; // ms before considering speech ended
    let lastSpeechTime = Date.now();

    setInterval(() => {
      const vadScore = this.analyzeAudioForSpeech();
      
      if (vadScore > VAD_THRESHOLD) {
        lastSpeechTime = Date.now();
        this.session.isListening = true;
      } else {
        const timeSinceSpeech = Date.now() - lastSpeechTime;
        
        if (timeSinceSpeech > SILENCE_DURATION) {
          this.session.isListening = false;
          // Signal STT stream to mark utterance complete
        }
      }
    }, 50); // Every 50ms
  }

  private analyzeAudioForSpeech(): number {
    // Use ML model for accurate VAD (not just energy threshold)
    // Libraries: webrtcvad-gm, silero-vad, or Deepgram's native VAD
    
    // Option 1: Silero VAD (recommended - fastest)
    // Pre-load model once
    const audioChunk = this.session.audioBuffer.slice(-2048); // Last 2048 samples
    
    const vadScore = this.vadModel.process(audioChunk);
    return vadScore; // 0.0 to 1.0
  }

  private async generateAndStreamResponse(userAudio: Buffer) {
    // Get conversation context
    const history = await this.getConversationHistory();
    const transcript = this.session.partialTranscript;

    // Knowledge base retrieval (if enabled)
    let knowledgeContext = '';
    if (this.agent.knowledgeBasePath) {
      knowledgeContext = await this.searchKnowledgeBase(transcript);
    }

    // Tool availability (if configured)
    const tools = this.agent.tools || [];

    // Stream from LLM with function calling
    const response = await this.streamLLMResponse({
      systemPrompt: this.agent.systemPrompt,
      conversationHistory: history,
      userMessage: transcript,
      knowledgeContext,
      tools,
      temperature: 0.7,
      maxTokens: 500
    });

    return response;
  }

  private async synthesizeAndPlay(text: string) {
    // Real-time TTS streaming
    // Stream audio to caller WHILE TTS is still generating
    
    const audioStream = await this.ttsService.synthesizeStream(text, {
      voice: this.agent.voiceId,
      language: this.agent.language,
      speed: 1.0
    });

    // Send audio chunks to caller immediately
    audioStream.on('data', (chunk: Buffer) => {
      this.playAudioToTelephone(chunk);
    });

    await new Promise(resolve => audioStream.on('end', resolve));
  }

  private async waitForSpeech(): Promise<Buffer> {
    // Wait for user to start speaking
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.session.isListening) {
          clearInterval(checkInterval);
          resolve(this.session.audioBuffer);
        }
      }, 50);
    });
  }

  private playAudioToTelephone(audioBuffer: Buffer) {
    // Send audio to caller
    if (this.session.ws?.readyState === WebSocket.OPEN) {
      const mulawAudio = encodeMulaw(audioBuffer);
      this.session.ws.send(JSON.stringify({
        type: 'audio',
        payload: mulawAudio.toString('base64')
      }));
    }
  }
}
```

---

### PHASE 4: DASHBOARD & CALL MANAGEMENT (WEEK 2.5)

#### Step 4.1: Create Calls Dashboard
```typescript
// app/voice-agents/[tenantId]/Calls/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface VoiceCall {
  id: string;
  callSid: string;
  agentId: string;
  from: string;
  to: string;
  startTime: Date;
  endTime?: Date;
  status: 'ringing' | 'in-progress' | 'completed' | 'failed';
  transcript: string;
  duration: number;
  recordingUrl?: string;
}

export default function CallsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [activeCalls, setActiveCalls] = useState<VoiceCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      const response = await fetch(
        `/api/v1/voice-agents/calls?tenantId=${tenantId}`
      );
      const data = await response.json();
      
      setCalls(data.completedCalls);
      setActiveCalls(data.activeCalls);
      setLoading(false);
    };

    fetchCalls();
    
    // Poll for active calls every 2 seconds
    const interval = setInterval(fetchCalls, 2000);
    return () => clearInterval(interval);
  }, [tenantId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Voice Agent Calls</h1>

      {/* ACTIVE CALLS SECTION */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Active Calls ({activeCalls.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCalls.map(call => (
            <div key={call.id} className="bg-green-50 border-2 border-green-500 p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">{call.from}</p>
                  <p className="text-sm text-gray-600">Connected to {call.to}</p>
                </div>
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm animate-pulse">
                  In Progress
                </span>
              </div>
              
              <div className="bg-white p-3 rounded mb-2 max-h-24 overflow-y-auto">
                <p className="text-sm text-gray-700">{call.transcript || 'Connecting...'}</p>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>Duration: {formatDuration(call.duration)}</span>
                <button 
                  onClick={() => endCall(call.callSid)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  End Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COMPLETED CALLS SECTION */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Call History</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">From</th>
                <th className="border p-2 text-left">Date/Time</th>
                <th className="border p-2 text-left">Duration</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {calls.map(call => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="border p-2">{call.from}</td>
                  <td className="border p-2">{new Date(call.startTime).toLocaleString()}</td>
                  <td className="border p-2">{formatDuration(call.duration)}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs text-white ${
                      call.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="border p-2">
                    <button 
                      onClick={() => viewTranscript(call)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Transcript
                    </button>
                    {call.recordingUrl && (
                      <> | <a 
                        href={call.recordingUrl} 
                        target="_blank" 
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Recording
                      </a></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function endCall(callSid: string) {
  await fetch(`/api/v1/voice-agents/calls/${callSid}/end`, { method: 'POST' });
}

function viewTranscript(call: VoiceCall) {
  // Show modal with full transcript
}
```

---

### PHASE 5: PHONE NUMBER ASSIGNMENT TO AGENTS (WEEK 2.5)

#### Step 5.1: Update Agent Model
```typescript
// Update Prisma schema

model VoiceAgent {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  description   String?
  
  // NEW: Telephony configuration
  phoneNumber   String?  @unique // E.164 format: +1234567890
  twilioApplicationSid String?
  
  // Existing
  language      String
  voiceId       String?
  systemPrompt  String
  status        String
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  calls         VoiceAgentCall[]
}

model VoiceAgentCall {
  id            String   @id @default(cuid())
  agentId       String
  tenantId      String
  
  // Telephony
  callSid       String   @unique // Twilio CallSid
  from          String   // Caller number
  to            String   // Agent's phone number
  inbound       Boolean  // Is this inbound or outbound?
  
  status        String
  startTime     DateTime
  endTime       DateTime?
  
  // Recording & transcript
  transcript    String?
  recordingUrl  String?
  
  agent         VoiceAgent @relation(...)
}
```

#### Step 5.2: Create Agent Settings Page
```typescript
// app/voice-agents/[tenantId]/[agentId]/Settings/page.tsx

'use client';

export default function AgentSettingsPage() {
  const [agent, setAgent] = useState<VoiceAgent | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available Twilio numbers
    const fetchNumbers = async () => {
      const response = await fetch('/api/v1/twilio/available-numbers');
      const data = await response.json();
      setAvailableNumbers(data.numbers);
    };
    fetchNumbers();
  }, []);

  const assignPhoneNumber = async (number: string) => {
    setLoading(true);
    await fetch(`/api/v1/voice-agents/${agent.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ phoneNumber: number })
    });
    setAgent({ ...agent, phoneNumber: number });
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{agent?.name} - Settings</h1>

      {/* Phone Number Assignment */}
      <div className="bg-white p-6 rounded border mb-6">
        <h2 className="text-xl font-semibold mb-4">Phone Number Configuration</h2>
        
        {agent?.phoneNumber && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800">
              <strong>Assigned:</strong> {agent.phoneNumber}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Incoming calls to this number will be routed to this agent.
            </p>
          </div>
        )}

        <div className="mb-4">
          <label className="block font-semibold mb-2">Available Numbers</label>
          <select 
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="border p-2 rounded w-full mb-2"
          >
            <option value="">Select a phone number...</option>
            {availableNumbers.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <button
            onClick={() => assignPhoneNumber(phoneNumber)}
            disabled={!phoneNumber || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign Number'}
          </button>
        </div>

        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          + Buy New Number
        </button>
      </div>
    </div>
  );
}
```

---

### PHASE 6: ADVANCED FEATURES (WEEK 3)

#### Step 6.1: Multi-Assistant Routing (Squads)
```typescript
// Enable routing between agents (like VAPI Squads)

export class VoiceAgentSquad {
  agents: VoiceAgent[];
  routingLogic: 'round-robin' | 'skill-based' | 'custom';

  async handleIncomingCall(
    callSid: string,
    from: string,
    to: string
  ) {
    // Determine which agent should handle this
    const agent = await this.selectAgent(from);

    // Transfer to agent's orchestra
    const orchestrator = new TelephonyVoiceOrchestrator(
      this.session,
      agent
    );
    await orchestrator.orchestrate();
  }

  private async selectAgent(callerNumber: string): Promise<VoiceAgent> {
    // Implement your routing logic:
    // - By skills/tags
    // - By availability
    // - By load balancing
    // - By customer VIP status
    // - By DID/number called
  }
}
```

#### Step 6.2: Tool Integration for Live Data Access
```typescript
// Enable agents to access live data during calls

interface CallTool {
  name: string;
  description: string;
  handler: (params: Record<string, any>) => Promise<any>;
  requiredParams: string[];
}

const availableTools: Record<string, CallTool> = {
  'check_account_balance': {
    name: 'check_account_balance',
    description: 'Check customer account balance',
    requiredParams: ['customer_id'],
    handler: async (params) => {
      const balance = await db.query(
        'SELECT balance FROM accounts WHERE id = ?',
        [params.customer_id]
      );
      return balance;
    }
  },
  'schedule_appointment': {
    name: 'schedule_appointment',
    description: 'Schedule appointment for customer',
    requiredParams: ['customer_id', 'datetime', 'service'],
    handler: async (params) => {
      const appointment = await db.appointments.create({
        customerId: params.customer_id,
        datetime: params.datetime,
        service: params.service
      });
      return appointment;
    }
  }
};

// In LLM call, include tools:
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  body: JSON.stringify({
    model: 'gpt-4-turbo',
    messages: conversationHistory,
    tools: agent.tools.map(toolName => ({
      type: 'function',
      function: {
        name: toolName,
        description: availableTools[toolName].description,
        parameters: {
          type: 'object',
          required: availableTools[toolName].requiredParams,
          properties: {
            // ... define parameters
          }
        }
      }
    }))
  })
});

// Handle tool calls in response
if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    const result = await availableTools[toolCall.function.name].handler(
      JSON.parse(toolCall.function.arguments)
    );
    // Add result to conversation
  }
}
```

---

## 📋 DATABASE SCHEMA CHANGES

```sql
-- Add telephony fields to VoiceAgent
ALTER TABLE "VoiceAgent" ADD COLUMN "phoneNumber" VARCHAR(20);
ALTER TABLE "VoiceAgent" ADD COLUMN "twilioApplicationSid" VARCHAR(100);
ALTER TABLE "VoiceAgent" ADD CONSTRAINT "VoiceAgent_phoneNumber_unique" UNIQUE("phoneNumber");

-- Expand VoiceAgentCall for telephony
ALTER TABLE "VoiceAgentCall" ADD COLUMN "callSid" VARCHAR(100) NOT NULL;
ALTER TABLE "VoiceAgentCall" ADD COLUMN "from" VARCHAR(20) NOT NULL;
ALTER TABLE "VoiceAgentCall" ADD COLUMN "to" VARCHAR(20) NOT NULL;
ALTER TABLE "VoiceAgentCall" ADD COLUMN "inbound" BOOLEAN DEFAULT FALSE;
ALTER TABLE "VoiceAgentCall" ADD COLUMN "recordingUrl" VARCHAR(500);
ALTER TABLE "VoiceAgentCall" ADD CONSTRAINT "VoiceAgentCall_callSid_unique" UNIQUE("callSid");

-- Create CallMessages table for call transcripts
CREATE TABLE "CallMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "callId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("callId") REFERENCES "VoiceAgentCall"("id") ON DELETE CASCADE
);
CREATE INDEX "CallMessage_callId_idx" ON "CallMessage"("callId");
```

---

## 🔐 SECURITY CHECKLIST

- [ ] **Secure WebSocket (WSS)** - Use wss:// in production
- [ ] **JWT Validation** - Verify token on every WebSocket message
- [ ] **Rate Limiting** - 100 calls/hour per agent
- [ ] **Call Encryption** - Encrypt audio in transit (TLS/SRTP)
- [ ] **Data Residency** - Store recordings according to compliance (GDPR/CCPA)
- [ ] **Consent Recording** - Play message: "This call may be recorded"
- [ ] **PII Handling** - Mask sensitive data in logs/transcripts
- [ ] **DND Compliance** - Check Do-Not-Call registry for outbound
- [ ] **Caller ID Verification** - Prevent spoofing

---

## 🚀 ENVIRONMENT VARIABLES (.env)

```env
# TWILIO CONFIGURATION
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+1234567890

# DEEPGRAM (Real-time STT)
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2

# ELEVENLABS (Natural TTS)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id

# OPENAI (LLM)
OPENAI_API_KEY=sk-...

# VOICE STREAMING
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-domain.com
WEBSOCKET_PORT=3002 # Changed from 3001 to avoid conflicts
TELEPHONY_WEBSOCKET_PORT=3002

# DATABASE
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key-change-in-production

# STORAGE (for recordings)
AWS_S3_BUCKET=payaid-voice-recordings
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests
- [ ] Deepgram STT streaming
- [ ] ElevenLabs TTS streaming
- [ ] VAD detection accuracy
- [ ] LLM response streaming
- [ ] Tool execution in calls

### Integration Tests
- [ ] Twilio webhook handling
- [ ] WebSocket audio streaming
- [ ] End-to-end call flow
- [ ] Call recording storage
- [ ] Transcript generation

### Load Tests
- [ ] 10 concurrent calls
- [ ] 50 concurrent calls
- [ ] Audio latency measurement
- [ ] Memory usage under load

### Manual Tests
- [ ] Test incoming call to agent
- [ ] Test agent speaking and responding
- [ ] Test tool execution during call
- [ ] Test call transfer to different agent
- [ ] Test call recording and playback
- [ ] Test transcript accuracy

---

## 📊 COMPARISON: Current vs VAPI-Style

| Feature | Current | New | Status |
|---------|---------|-----|--------|
| **Call Source** | Browser microphone | Real phone numbers (PSTN) | ✅ CRITICAL |
| **Inbound Calls** | ❌ Not supported | ✅ Full support | ✅ CRITICAL |
| **Outbound Calls** | ❌ Not supported | ✅ Full support | ✅ CRITICAL |
| **Real-time Streaming** | Browser-based | PSTN/SIP | ✅ CRITICAL |
| **Latency** | 2-5 seconds | 400-600ms | ✅ CRITICAL |
| **VAD** | Silence-based | Continuous ML-based | ✅ HIGH |
| **Concurrent Processing** | Sequential | Parallel STT+LLM+TTS | ✅ HIGH |
| **Call Recording** | Manual | Automatic | ✅ HIGH |
| **Tool Integration** | Partial | Full function calling | ✅ MEDIUM |
| **Multi-Agent Routing** | ❌ None | ✅ Squads | ✅ MEDIUM |
| **Reliability** | Unknown | 99.99% uptime SLA | ✅ HIGH |
| **Enterprise Features** | ❌ None | ✅ Team management, billing | ✅ MEDIUM |

---

## 📞 IMPLEMENTATION ROADMAP

```
Week 1:
  Day 1-2:  Twilio integration + phone number setup
  Day 3-4:  WebSocket real-time audio streaming
  Day 5:    Deepgram streaming STT + VAD
  
Week 2:
  Day 1-2:  ElevenLabs streaming TTS
  Day 3-4:  Real-time LLM orchestration
  Day 5:    Call dashboard + recording storage
  
Week 3:
  Day 1-2:  Phone number assignment + agent config
  Day 3:    Tool integration for live data
  Day 4:    Multi-agent routing (Squads)
  Day 5:    Testing + performance optimization

Post-MVP:
  - Call transfer & hold
  - Voicemail
  - Analytics dashboard
  - Compliance reporting (DND, consent)
  - Multi-tenant billing
```

---

## ⚠️ CRITICAL WARNINGS

1. **DO NOT** keep the browser microphone interface as main system
   - It's a demo/fallback ONLY
   - Real voice agents MUST use telephony

2. **DO NOT** process audio serially (wait for silence, then STT)
   - Users perceive this as broken/unresponsive
   - VAPI succeeds because of parallel processing

3. **DO NOT** use slow STT/TTS services
   - Google Speech-to-Text: ~500ms
   - Whisper API: ~2000ms
   - Deepgram: ~200ms (RECOMMENDED)
   - ElevenLabs: ~100-200ms per chunk (RECOMMENDED)

4. **DO NOT** deploy without SSL/TLS
   - PSTN gateways require encrypted connections
   - Use wss:// for WebSocket in production

5. **DO NOT** skip rate limiting
   - Twilio charges per minute
   - Implement call budgets per agent/tenant

---

## 💰 ESTIMATED COSTS (Production)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Twilio | 1000 mins/mo | $9-15 |
| Deepgram | 1000 mins/mo | $25-30 |
| ElevenLabs | 1000 mins/mo | $25-30 |
| OpenAI GPT-4 | ~50k tokens/mo | $5-10 |
| AWS S3 (recordings) | 100 GB | $2-3 |
| **TOTAL** | | **~$65-90/month** |

---

## 📞 SUPPORT & RESOURCES

- Twilio Docs: https://www.twilio.com/docs/voice
- Deepgram Real-time: https://developers.deepgram.com/docs/streaming
- ElevenLabs Streaming: https://elevenlabs.io/docs/api-reference/streaming
- VAPI Architecture: https://docs.vapi.ai/quickstart/introduction
- WebSocket Audio Streaming: https://github.com/twilio/twilio-voice-react

---

**Created:** January 2026  
**For:** PayAid V3 Voice Agents System  
**Target:** VAPI.ai Feature Parity  
**Status:** Ready for Implementation