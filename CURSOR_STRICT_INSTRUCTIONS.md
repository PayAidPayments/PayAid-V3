# CURSOR IMPLEMENTATION CHECKLIST & STRICT INSTRUCTIONS

**For:** Building VAPI-Compatible Voice Agents System  
**Status:** Ready for Development  
**Priority:** CRITICAL - Full Architectural Redesign Required

---

## 📋 PART 1: SETUP & DEPENDENCIES

### Step 1: Install Required Packages
```bash
# Core dependencies
npm install twilio twilio-voice-react
npm install deepgram-sdk
npm install elevenlabs
npm install @anthropic-ai/sdk
npm install silero-vad-js

# Infrastructure
npm install ws @types/ws
npm install redis
npm install prisma @prisma/client

# Utilities
npm install dotenv axios lodash

# Development
npm install --save-dev typescript @types/node ts-node
```

### Step 2: Environment Setup
Create `.env` with ALL these variables:
```env
# TWILIO - CRITICAL
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/voice-agents/twilio/webhook

# DEEPGRAM - CRITICAL (Lowest latency STT)
DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2

# ELEVENLABS - CRITICAL (Best TTS quality)
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_DEFAULT_VOICE_ID=your_voice_id

# OPENAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# WEBSOCKET
WEBSOCKET_PORT=3002
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-domain.com
TELEPHONY_WEBSOCKET_URL=wss://your-domain.com:3002

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/payaid

# JWT
JWT_SECRET=your-secret-key-256-chars-minimum

# AWS S3 (for recording storage)
AWS_REGION=us-east-1
AWS_S3_BUCKET=payaid-voice-recordings
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# REDIS (for rate limiting)
REDIS_URL=redis://localhost:6379

# ENVIRONMENT
NODE_ENV=development
```

---

## 📋 PART 2: DATABASE MIGRATIONS

### Step 3: Update Prisma Schema
```prisma
// prisma/schema.prisma

model VoiceAgent {
  id                    String   @id @default(cuid())
  tenantId              String
  name                  String
  description           String?
  
  // ===== TELEPHONY FIELDS (NEW) =====
  phoneNumber           String?  @unique
  twilioApplicationSid  String?
  inboundEnabled        Boolean  @default(true)
  outboundEnabled       Boolean  @default(true)
  
  // ===== VOICE CONFIG =====
  language              String   @default("en")
  voiceId               String?
  voiceTone             String?
  systemPrompt          String
  
  // ===== TOOLS & INTEGRATIONS =====
  tools                 String[] @default([])
  knowledgeBasePath     String?
  
  // ===== STATUS =====
  status                String   @default("active")
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // ===== RELATIONS =====
  calls                 VoiceAgentCall[]
  
  @@index([tenantId])
  @@index([phoneNumber])
}

model VoiceAgentCall {
  id                String   @id @default(cuid())
  agentId           String
  tenantId          String
  
  // ===== TELEPHONY FIELDS (NEW) =====
  callSid           String   @unique
  from              String   // E.164 format: +14155552671
  to                String   // E.164 format: +14155552671
  inbound           Boolean  @default(false)
  
  // ===== CALL LIFECYCLE =====
  status            String   // "ringing", "in-progress", "completed", "failed"
  startTime         DateTime
  endTime           DateTime?
  duration          Int?     // in seconds
  
  // ===== RECORDING & CONTENT =====
  transcript        String?
  recordingUrl      String?
  recordingSid      String?
  
  // ===== METADATA =====
  languageDetected  String?
  sentiment         String?
  tags              String[]
  notes             String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // ===== RELATIONS =====
  agent             VoiceAgent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  messages          CallMessage[]
  
  @@index([agentId])
  @@index([tenantId])
  @@index([callSid])
  @@index([from])
  @@index([startTime])
}

model CallMessage {
  id        String   @id @default(cuid())
  callId    String
  role      String   // "user", "assistant", "system"
  content   String
  timestamp DateTime @default(now())
  
  // ===== METADATA =====
  isPartial Boolean  @default(false) // Is this a partial transcript?
  confidence Float?
  
  call      VoiceAgentCall @relation(fields: [callId], references: [id], onDelete: Cascade)
  
  @@index([callId])
  @@index([timestamp])
}
```

### Step 4: Run Migration
```bash
npx prisma migrate dev --name add_telephony_fields
npx prisma db push
```

---

## 📋 PART 3: TWILIO INTEGRATION

### Step 5: Create Twilio Webhook Handler
**File:** `app/api/v1/voice-agents/twilio/webhook.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
import { verifyTwilioSignature } from '@/lib/twilio-utils';

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(request: NextRequest) {
  try {
    // ===== VALIDATE TWILIO WEBHOOK =====
    const body = await request.text();
    const signature = request.headers.get('X-Twilio-Signature') || '';
    
    if (!verifyTwilioSignature(
      process.env.TWILIO_WEBHOOK_URL || '',
      body,
      signature,
      process.env.TWILIO_AUTH_TOKEN || ''
    )) {
      return new NextResponse('Unauthorized', { status: 403 });
    }

    // ===== PARSE TWILIO PARAMETERS =====
    const formData = new URLSearchParams(body);
    const callSid = formData.get('CallSid') || '';
    const from = formData.get('From') || '';
    const to = formData.get('To') || '';
    const callStatus = formData.get('CallStatus') || '';
    const digits = formData.get('Digits');

    console.log('[Twilio Webhook] Incoming Call:', {
      callSid,
      from,
      to,
      callStatus,
      timestamp: new Date().toISOString()
    });

    // ===== FIND AGENT BY PHONE NUMBER =====
    const agent = await prisma.voiceAgent.findUnique({
      where: { phoneNumber: to }
    });

    if (!agent) {
      console.error('[Twilio] Agent not found for number:', to);
      const twiml = new VoiceResponse();
      twiml.say('Sorry, this number is not configured.');
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // ===== CREATE CALL RECORD =====
    const call = await prisma.voiceAgentCall.create({
      data: {
        callSid,
        agentId: agent.id,
        tenantId: agent.tenantId,
        from,
        to,
        inbound: true,
        status: 'ringing',
        startTime: new Date()
      }
    });

    console.log('[Twilio] Call record created:', call.id);

    // ===== GENERATE TWIML RESPONSE =====
    const twiml = new VoiceResponse();
    
    // Say greeting
    twiml.say({
      voice: 'woman',
      language: agent.language === 'en' ? 'en-US' : agent.language
    }, agent.systemPrompt.substring(0, 200)); // Use first 200 chars of system prompt as greeting

    // Connect to WebSocket stream
    twiml.connect({
      action: `${process.env.TWILIO_WEBHOOK_URL}/connect-status`,
      method: 'POST'
    }).stream({
      url: `wss://${request.headers.get('host')}/voice/stream/${callSid}?agentId=${agent.id}`,
      track: 'inbound_track'
    });

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });

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

### Step 6: Create WebSocket Audio Stream Handler
**File:** `server/telephony-audio-stream.ts`

```typescript
import WebSocket from 'ws';
import { VoiceOrchestrator } from '@/lib/voice-agent/voice-orchestrator';
import { prisma } from '@/lib/prisma';
import { validateJWT } from '@/lib/auth-utils';

interface StreamSession {
  callSid: string;
  agentId: string;
  ws: WebSocket;
  orchestrator: VoiceOrchestrator;
  audioBuffer: Buffer;
  isActive: boolean;
}

const activeSessions = new Map<string, StreamSession>();

export const createAudioStreamServer = () => {
  const wss = new WebSocket.Server({ port: parseInt(process.env.WEBSOCKET_PORT || '3002') });

  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      // ===== EXTRACT PARAMETERS =====
      const url = new URL(req.url || '', 'http://localhost');
      const callSid = url.searchParams.get('callSid');
      const agentId = url.searchParams.get('agentId');
      const token = url.searchParams.get('token');

      if (!callSid || !agentId) {
        ws.close(1002, 'Missing parameters');
        return;
      }

      // ===== VALIDATE TOKEN (if applicable) =====
      if (token) {
        try {
          validateJWT(token);
        } catch {
          ws.close(1008, 'Invalid token');
          return;
        }
      }

      console.log('[Audio Stream] New connection:', { callSid, agentId });

      // ===== FETCH AGENT & CREATE SESSION =====
      const agent = await prisma.voiceAgent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        ws.close(1002, 'Agent not found');
        return;
      }

      // ===== INITIALIZE ORCHESTRATOR =====
      const orchestrator = new VoiceOrchestrator({
        agent,
        callSid,
        webSocket: ws
      });

      const session: StreamSession = {
        callSid,
        agentId,
        ws,
        orchestrator,
        audioBuffer: Buffer.alloc(0),
        isActive: true
      };

      activeSessions.set(callSid, session);

      // ===== START PROCESSING =====
      await orchestrator.start();

      // ===== HANDLE MESSAGES =====
      ws.on('message', (data) => {
        if (!session.isActive) return;
        handleAudioData(session, data);
      });

      ws.on('close', () => {
        console.log('[Audio Stream] Connection closed:', callSid);
        session.isActive = false;
        orchestrator.stop();
        activeSessions.delete(callSid);
      });

      ws.on('error', (error) => {
        console.error('[Audio Stream] Error:', error);
        session.isActive = false;
      });

    } catch (error) {
      console.error('[Audio Stream] Connection error:', error);
      ws.close(1011, 'Server error');
    }
  });

  return wss;
};

function handleAudioData(session: StreamSession, data: Buffer | string) {
  try {
    let audioBuffer: Buffer;

    // ===== PARSE INCOMING DATA =====
    if (typeof data === 'string') {
      // JSON payload from Twilio
      const payload = JSON.parse(data);
      if (payload.event === 'media') {
        audioBuffer = Buffer.from(payload.media.payload, 'base64');
      } else {
        return;
      }
    } else {
      audioBuffer = data;
    }

    // ===== PASS TO ORCHESTRATOR =====
    session.orchestrator.processAudio(audioBuffer);

  } catch (error) {
    console.error('[Audio Handler] Error:', error);
  }
}

export { activeSessions };
```

---

## 📋 PART 4: VOICE ORCHESTRATOR (CORE ENGINE)

### Step 7: Create Real-Time Voice Orchestrator
**File:** `lib/voice-agent/voice-orchestrator.ts`

```typescript
import { Deepgram } from '@deepgram/sdk';
import { ElevenLabsClient } from 'elevenlabs';
import { OpenAI } from 'openai';
import { VoiceAgent } from '@prisma/client';
import WebSocket from 'ws';
import { prisma } from '@/lib/prisma';

interface OrchestratorConfig {
  agent: VoiceAgent;
  callSid: string;
  webSocket: WebSocket;
}

export class VoiceOrchestrator {
  private agent: VoiceAgent;
  private callSid: string;
  private ws: WebSocket;
  
  private deepgram: Deepgram;
  private elevenlabs: ElevenLabsClient;
  private openai: OpenAI;
  
  private sttStream: any;
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private isProcessing = false;
  
  constructor(config: OrchestratorConfig) {
    this.agent = config.agent;
    this.callSid = config.callSid;
    this.ws = config.webSocket;
    
    // ===== INITIALIZE AI SERVICES =====
    this.deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY);
    this.elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async start() {
    console.log('[Orchestrator] Starting for call:', this.callSid);
    
    // ===== INITIALIZE STT STREAM =====
    this.initializeSTTStream();
    
    // ===== SEND GREETING =====
    const greeting = `Hello, I'm ${this.agent.name}. ${this.agent.description || 'How can I help?'}`;
    await this.synthesizeAndPlay(greeting);
  }

  private initializeSTTStream() {
    console.log('[STT] Initializing Deepgram stream...');
    
    this.sttStream = this.deepgram.transcription.live({
      model: 'nova-2',
      language: this.agent.language,
      interim_results: true,
      vad_events: true,
      endpointing: 300,
      encoding: 'mulaw',
      sample_rate: 8000
    });

    // ===== HANDLE PARTIAL TRANSCRIPTS =====
    this.sttStream.on('transcriptReceived', async (message: any) => {
      const transcript = message.channel.alternatives[0]?.transcript || '';
      const isFinal = message.is_final;

      if (transcript.trim()) {
        if (isFinal) {
          console.log('[STT] Final:', transcript);
          this.conversationHistory.push({
            role: 'user',
            content: transcript
          });
          
          // ===== SEND TO LLM FOR RESPONSE =====
          await this.generateAndStreamResponse(transcript);
          
        } else {
          console.log('[STT] Interim:', transcript);
          // Send partial transcript to client/dashboard
          this.broadcastMessage({
            type: 'transcript_interim',
            text: transcript
          });
        }
      }
    });

    this.sttStream.on('error', (error: any) => {
      console.error('[STT] Error:', error);
    });
  }

  async processAudio(audioBuffer: Buffer) {
    // ===== SEND AUDIO TO STT STREAM =====
    if (this.sttStream && audioBuffer.length > 0) {
      this.sttStream.write(audioBuffer);
    }
  }

  private async generateAndStreamResponse(userMessage: string) {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      console.log('[LLM] Generating response for:', userMessage.substring(0, 100));

      // ===== BUILD MESSAGES FOR LLM =====
      const messages = [
        {
          role: 'system',
          content: this.agent.systemPrompt
        },
        ...this.conversationHistory
      ];

      // ===== STREAM FROM LLM =====
      let fullResponse = '';
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: messages as any,
        stream: true,
        temperature: 0.7,
        max_tokens: 500
      });

      // ===== HANDLE STREAMING RESPONSE =====
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          
          // ===== STREAM TO TTS IMMEDIATELY =====
          await this.synthesizeAndPlay(content, false);
        }
      }

      // ===== ADD TO CONVERSATION HISTORY =====
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      });

      console.log('[LLM] Response complete:', fullResponse.substring(0, 100));

      // ===== SAVE TO DATABASE =====
      await this.saveMessages();

    } catch (error) {
      console.error('[LLM] Error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async synthesizeAndPlay(text: string, isFinal: boolean = true) {
    try {
      console.log('[TTS] Synthesizing:', text.substring(0, 100));

      // ===== USE ELEVENLABS FOR STREAMING TTS =====
      const audioStream = await this.elevenlabs.generate({
        voice: this.agent.voiceId || 'Rachel',
        model_id: 'eleven_turbo_v2',
        text: text,
        stream: true
      });

      // ===== STREAM AUDIO CHUNKS TO CALLER =====
      for await (const chunk of audioStream) {
        // Convert to μ-law (Twilio format)
        const mulawAudio = this.encodeToMulaw(chunk);
        
        // Send to caller via WebSocket
        this.sendAudioToPhone(mulawAudio);
      }

    } catch (error) {
      console.error('[TTS] Error:', error);
    }
  }

  private sendAudioToPhone(audioBuffer: Buffer) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: 'media',
        media: {
          payload: audioBuffer.toString('base64')
        }
      }));
    }
  }

  private encodeToMulaw(pcmBuffer: Buffer): Buffer {
    // Convert PCM16 to μ-law
    // (This is a simplified version - use library for production)
    const output = Buffer.alloc(pcmBuffer.length / 2);
    for (let i = 0; i < output.length; i++) {
      const sample = pcmBuffer.readInt16LE(i * 2);
      output[i] = this.pcmToMulaw(sample);
    }
    return output;
  }

  private pcmToMulaw(sample: number): number {
    const MuLawCompressTable = [/* ... */];
    const SIGN_BIT = 0x80;
    const QUANT_BITS = 0xf;
    const SEG_SHIFT = 4;
    
    const sign = (sample & 0x8000) >> 8;
    if (sign !== 0) sample = -sample;
    
    if (sample > 0x1F45) sample = 0x1F45;
    
    sample = sample + 0x04 >> 3;
    
    let exponent = 7;
    for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; exponent--, expMask >>= 1);
    
    const mantissa = (sample >> (exponent + 3)) & QUANT_BITS;
    const ulawbyte = ~(sign | (exponent << SEG_SHIFT) | mantissa);
    
    return ulawbyte & 0xff;
  }

  private broadcastMessage(message: any) {
    // Broadcast to dashboard/monitoring
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private async saveMessages() {
    for (const msg of this.conversationHistory) {
      if (!msg.id) {
        await prisma.callMessage.create({
          data: {
            callId: this.callSid,
            role: msg.role,
            content: msg.content
          }
        });
        msg.id = true; // Mark as saved
      }
    }
  }

  stop() {
    console.log('[Orchestrator] Stopping for call:', this.callSid);
    if (this.sttStream) {
      this.sttStream.finish();
    }
  }
}
```

---

## 📋 PART 5: DASHBOARD & MONITORING

### Step 8: Create Calls Management Dashboard
**File:** `app/voice-agents/[tenantId]/Calls/page.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Call {
  id: string;
  callSid: string;
  from: string;
  to: string;
  status: string;
  startTime: string;
  duration?: number;
  transcript?: string;
}

export default function CallsPage() {
  const params = useParams();
  const tenantId = params.tenantId as string;
  const [calls, setCalls] = useState<Call[]>([]);
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);

  useEffect(() => {
    const fetchCalls = async () => {
      const response = await fetch(`/api/v1/voice-agents/calls?tenantId=${tenantId}`);
      const data = await response.json();
      
      setCalls(data.calls || []);
      setActiveCalls(data.activeCalls || []);
    };

    fetchCalls();
    const interval = setInterval(fetchCalls, 2000);
    return () => clearInterval(interval);
  }, [tenantId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Voice Calls</h1>

      {/* ACTIVE CALLS */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Active Calls ({activeCalls.length})</h2>
        <div className="grid gap-4">
          {activeCalls.map(call => (
            <div key={call.id} className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">{call.from}</p>
                  <p className="text-sm text-gray-600">Connected to {call.to}</p>
                </div>
                <span className="bg-green-500 text-white px-3 py-1 rounded text-sm animate-pulse">Live</span>
              </div>
              <div className="mt-2 p-2 bg-white rounded text-sm">
                {call.transcript || 'Connecting...'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CALL HISTORY */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Call History</h2>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">From</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Duration</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {calls.map(call => (
              <tr key={call.id} className="hover:bg-gray-50">
                <td className="border p-2">{call.from}</td>
                <td className="border p-2">{new Date(call.startTime).toLocaleString()}</td>
                <td className="border p-2">{call.duration ? `${call.duration}s` : '-'}</td>
                <td className="border p-2">
                  <button className="text-blue-600 hover:underline">View Transcript</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 📋 PART 6: CONFIGURATION & SETTINGS

### Step 9: Agent Settings for Phone Number Assignment
**File:** `app/voice-agents/[tenantId]/[agentId]/Settings/page.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';

export default function AgentSettingsPage() {
  const [agent, setAgent] = useState<any>(null);
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [selectedNumber, setSelectedNumber] = useState('');

  useEffect(() => {
    const fetchNumbers = async () => {
      const response = await fetch('/api/v1/twilio/available-numbers');
      const data = await response.json();
      setAvailableNumbers(data.numbers);
    };
    fetchNumbers();
  }, []);

  const assignPhoneNumber = async () => {
    await fetch(`/api/v1/voice-agents/${agent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: selectedNumber })
    });
    setAgent({ ...agent, phoneNumber: selectedNumber });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agent Settings</h1>

      <div className="bg-white p-6 rounded border">
        <h2 className="text-xl font-semibold mb-4">Phone Configuration</h2>

        {agent?.phoneNumber && (
          <div className="mb-4 p-4 bg-green-50 rounded">
            <p className="text-green-800 font-semibold">Assigned: {agent.phoneNumber}</p>
          </div>
        )}

        <div>
          <label className="block font-semibold mb-2">Available Numbers</label>
          <select 
            value={selectedNumber}
            onChange={(e) => setSelectedNumber(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          >
            <option value="">Select...</option>
            {availableNumbers.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <button 
            onClick={assignPhoneNumber}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Assign Phone Number
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT & FINAL CHECKLIST

### Pre-Deployment
- [ ] All environment variables set in production
- [ ] Twilio account verified and phone number purchased
- [ ] SSL/TLS certificate configured (for wss://)
- [ ] Database migrations applied
- [ ] All services started and running
- [ ] Load testing completed (10+ concurrent calls)
- [ ] Latency benchmarked (<600ms target)
- [ ] Recording storage (S3) configured
- [ ] Consent recording message added to greeting

### Start Services
```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Audio Stream Server
npm run dev:audio-stream

# Terminal 3: Monitor (optional)
npm run dev:monitor
```

### Test Checklist
- [ ] Call agent's phone number
- [ ] Agent responds within 600ms
- [ ] Transcript appears in real-time
- [ ] Recording stored automatically
- [ ] Call appears in dashboard
- [ ] Agent can hear caller clearly
- [ ] Response quality acceptable

---

## ⚠️ CRITICAL DO's & DON'Ts

### ✅ DO:
- Use Deepgram for STT (lowest latency)
- Use ElevenLabs for TTS (best quality)
- Process audio in PARALLEL (not sequential)
- Stream TTS while LLM is still generating
- Save call recordings automatically
- Implement rate limiting per agent
- Use WebSocket for real-time streaming
- Validate every Twilio webhook
- Test with actual phone calls

### ❌ DON'T:
- Wait for silence before processing
- Process STT → LLM → TTS sequentially
- Use slow STT services (Whisper API)
- Send entire audio buffer at once
- Forget JWT validation
- Store unencrypted call data
- Deploy without SSL/TLS
- Skip rate limiting
- Use browser microphone as primary
- Skip testing with real phones

---

**Prepared:** January 2026  
**For:** Cursor AI Code Generation  
**Status:** Ready for Implementation  
**Estimated Timeline:** 2-3 Weeks for MVP