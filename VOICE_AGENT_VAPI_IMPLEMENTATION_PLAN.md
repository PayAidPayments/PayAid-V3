# 🚀 Voice Agent Vapi.ai Feature Implementation Plan

## Overview

This document provides a detailed implementation plan to match Vapi.ai's capabilities. Each feature includes code examples, database schema changes, and API endpoints.

---

## Phase 1: Critical Features (Weeks 1-4)

### 1.1 Ultra-Low Latency Implementation

#### 1.1.1 Streaming STT (Speech-to-Text)

**File:** `lib/voice-agent/stt-streaming.ts`

```typescript
import { EventEmitter } from 'events'

export interface StreamingSTTResult {
  text: string
  isFinal: boolean
  confidence: number
  language?: string
}

export class StreamingSTT extends EventEmitter {
  async transcribeStream(audioChunk: Buffer, language: string): Promise<void> {
    // Use Deepgram/Gladia streaming API
    const stream = await this.createStream(language)
    
    stream.on('partial', (text: string) => {
      this.emit('partial', { text, isFinal: false })
    })
    
    stream.on('final', (text: string) => {
      this.emit('final', { text, isFinal: true })
    })
    
    stream.write(audioChunk)
  }
}
```

#### 1.1.2 Streaming TTS (Text-to-Speech)

**File:** `lib/voice-agent/tts-streaming.ts`

```typescript
export class StreamingTTS {
  async synthesizeStream(text: string, language: string, voiceId?: string): Promise<ReadableStream> {
    // Use ElevenLabs/PlayHT streaming API
    const stream = await this.createStream(text, language, voiceId)
    return stream
  }
}
```

#### 1.1.3 Optimized WebSocket Handler

**File:** `server/websocket-voice-server.ts` (Update)

```typescript
// Process audio with streaming
const sttStream = new StreamingSTT()
sttStream.on('partial', (result) => {
  ws.send(JSON.stringify({
    type: 'partial_transcript',
    data: result.text
  }))
})

sttStream.on('final', async (result) => {
  // Generate response immediately
  const response = await generateResponse(result.text)
  
  // Stream TTS
  const ttsStream = await synthesizeStream(response)
  for await (const audioChunk of ttsStream) {
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      data: audioChunk.toString('base64')
    }))
  }
})
```

---

### 1.2 Voice Activity Detection (VAD)

**File:** `lib/voice-agent/vad.ts`

```typescript
export class VoiceActivityDetector {
  private energyThreshold = 0.01
  private silenceDuration = 1000 // ms
  private lastSpeechTime = 0
  
  detectSpeech(audioBuffer: Buffer): boolean {
    const energy = this.calculateEnergy(audioBuffer)
    const now = Date.now()
    
    if (energy > this.energyThreshold) {
      this.lastSpeechTime = now
      return true
    }
    
    // Check if silence duration exceeded
    return (now - this.lastSpeechTime) < this.silenceDuration
  }
  
  private calculateEnergy(buffer: Buffer): number {
    let sum = 0
    for (let i = 0; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i)
      sum += sample * sample
    }
    return Math.sqrt(sum / (buffer.length / 2))
  }
}
```

**Integration in WebSocket Server:**

```typescript
const vad = new VoiceActivityDetector()

// Check each audio chunk
if (vad.detectSpeech(audioBuffer)) {
  // User is speaking - process immediately
  await processAudioChunk(audioBuffer)
} else {
  // Silence detected - wait for more audio or finalize
  if (silenceDuration > 1000) {
    // Finalize current turn
    await finalizeTurn()
  }
}
```

---

### 1.3 Real-Time Tool Calling

**File:** `lib/voice-agent/tool-executor.ts`

```typescript
export interface Tool {
  name: string
  description: string
  parameters: Record<string, any>
  execute: (params: any) => Promise<any>
}

export class ToolExecutor {
  private tools: Map<string, Tool> = new Map()
  
  registerTool(tool: Tool) {
    this.tools.set(tool.name, tool)
  }
  
  async executeToolCall(toolCall: {
    name: string
    arguments: any
  }): Promise<any> {
    const tool = this.tools.get(toolCall.name)
    if (!tool) {
      throw new Error(`Tool ${toolCall.name} not found`)
    }
    
    return await tool.execute(toolCall.arguments)
  }
}
```

**Update Orchestrator:**

```typescript
// In orchestrator.ts
async processVoiceCall(...) {
  // ... existing code ...
  
  // Generate response with tool calling
  const response = await generateVoiceResponse(
    systemPrompt,
    history,
    language,
    {
      tools: this.getTools(agentId), // Get agent's tools
      tool_choice: 'auto'
    }
  )
  
  // Execute tools if needed
  if (response.tool_calls) {
    const toolResults = []
    for (const toolCall of response.tool_calls) {
      const result = await this.toolExecutor.executeToolCall(toolCall)
      toolResults.push({
        tool_call_id: toolCall.id,
        result
      })
    }
    
    // Generate final response with tool results
    const finalResponse = await generateVoiceResponse(
      systemPrompt,
      [...history, ...toolResults],
      language
    )
    
    return finalResponse
  }
}
```

**Database Schema Update:**

```prisma
model VoiceAgent {
  // ... existing fields ...
  tools Json? // Tool configurations
}

// New model for tool definitions
model VoiceAgentTool {
  id          String   @id @default(cuid())
  agentId     String
  name        String
  description String
  endpoint    String   // API endpoint
  method      String   // GET, POST, etc.
  parameters  Json     // Parameter schema
  headers     Json?    // Custom headers
  createdAt   DateTime @default(now())
  
  agent       VoiceAgent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
}
```

---

### 1.4 Phone Number Integration

**File:** `app/api/v1/voice-agents/[id]/phone-numbers/route.ts`

```typescript
// POST /api/v1/voice-agents/[id]/phone-numbers
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { provider, phoneNumber, webhookUrl } = await request.json()
  
  // Assign phone number to agent
  await prisma.voiceAgent.update({
    where: { id: params.id },
    data: { phoneNumber }
  })
  
  // Configure provider webhook
  if (provider === 'twilio') {
    await configureTwilioWebhook(phoneNumber, webhookUrl)
  } else if (provider === 'exotel') {
    await configureExotelWebhook(phoneNumber, webhookUrl)
  }
  
  return NextResponse.json({ success: true })
}
```

**File:** `app/api/v1/voice-agents/inbound/route.ts`

```typescript
// POST /api/v1/voice-agents/inbound
// Handles inbound calls from telephony provider
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const to = formData.get('To') as string
  const from = formData.get('From') as string
  
  // Find agent by phone number
  const agent = await prisma.voiceAgent.findFirst({
    where: { phoneNumber: to, status: 'active' }
  })
  
  if (!agent) {
    return new NextResponse('Agent not found', { status: 404 })
  }
  
  // Create call record
  const call = await prisma.voiceAgentCall.create({
    data: {
      agentId: agent.id,
      tenantId: agent.tenantId,
      phone: from,
      status: 'ringing',
      direction: 'INBOUND'
    }
  })
  
  // Return TwiML/Exotel response for WebSocket connection
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://your-domain.com/api/v1/voice-agents/${agent.id}/stream?callId=${call.id}" />
      </Connect>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
```

**File:** `app/api/v1/voice-agents/[id]/calls/outbound/route.ts`

```typescript
// POST /api/v1/voice-agents/[id]/calls/outbound
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { phone, customerName, customerId } = await request.json()
  
  const agent = await prisma.voiceAgent.findFirst({
    where: { id: params.id, status: 'active' }
  })
  
  if (!agent || !agent.phoneNumber) {
    return NextResponse.json({ error: 'Agent or phone number not found' }, { status: 404 })
  }
  
  // Initiate outbound call via Twilio/Exotel
  const call = await initiateOutboundCall({
    from: agent.phoneNumber,
    to: phone,
    webhookUrl: `${process.env.BASE_URL}/api/v1/voice-agents/${agent.id}/calls/webhook`
  })
  
  // Create call record
  const callRecord = await prisma.voiceAgentCall.create({
    data: {
      agentId: agent.id,
      tenantId: agent.tenantId,
      phone,
      customerName,
      customerId,
      status: 'ringing',
      direction: 'OUTBOUND',
      externalCallId: call.sid
    }
  })
  
  return NextResponse.json({ callId: callRecord.id, status: 'initiated' })
}
```

---

### 1.5 Enterprise Reliability

**File:** `lib/voice-agent/service-manager.ts`

```typescript
export class ServiceManager {
  private providers = {
    stt: ['deepgram', 'gladia', 'assemblyai'],
    llm: ['openai', 'anthropic', 'groq'],
    tts: ['elevenlabs', 'playht', 'cartesia']
  }
  
  private healthStatus: Map<string, boolean> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  
  async getService(type: 'stt' | 'llm' | 'tts', preferred?: string): Promise<string> {
    // Try preferred first
    if (preferred && await this.isHealthy(preferred)) {
      return preferred
    }
    
    // Try all providers
    for (const provider of this.providers[type]) {
      if (await this.isHealthy(provider)) {
        return provider
      }
    }
    
    throw new Error(`All ${type} services unavailable`)
  }
  
  private async isHealthy(provider: string): Promise<boolean> {
    const breaker = this.circuitBreakers.get(provider)
    if (breaker?.isOpen()) {
      return false
    }
    
    try {
      const response = await fetch(`${this.getHealthEndpoint(provider)}`, {
        signal: AbortSignal.timeout(1000)
      })
      const healthy = response.ok
      this.healthStatus.set(provider, healthy)
      return healthy
    } catch (error) {
      this.healthStatus.set(provider, false)
      breaker?.recordFailure()
      return false
    }
  }
}

// Circuit Breaker implementation
class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  recordFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    if (this.failures >= 5) {
      this.state = 'open'
    }
  }
  
  recordSuccess() {
    this.failures = 0
    this.state = 'closed'
  }
  
  isOpen(): boolean {
    if (this.state === 'open' && Date.now() - this.lastFailureTime > 60000) {
      this.state = 'half-open'
    }
    return this.state === 'open'
  }
}
```

**Update Orchestrator with Failover:**

```typescript
// In orchestrator.ts
async processVoiceCall(...) {
  const serviceManager = new ServiceManager()
  
  try {
    // Try STT with failover
    const sttProvider = await serviceManager.getService('stt', 'deepgram')
    const sttResult = await this.transcribeWithProvider(audioChunk, sttProvider, language)
  } catch (error) {
    // Automatic failover
    const sttProvider = await serviceManager.getService('stt')
    const sttResult = await this.transcribeWithProvider(audioChunk, sttProvider, language)
  }
  
  // Similar for LLM and TTS
}
```

---

## Phase 2: High Priority Features

### 2.1 Multi-Agent Orchestration (Squads)

**Database Schema:**

```prisma
model VoiceAgentSquad {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  routingRules Json   // Routing logic
  agents      VoiceAgentSquadMember[]
  createdAt   DateTime @default(now())
  
  tenant      Tenant @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}

model VoiceAgentSquadMember {
  id          String   @id @default(cuid())
  squadId     String
  agentId     String
  priority    Int      @default(0)
  conditions  Json?    // When to route to this agent
  
  squad       VoiceAgentSquad @relation(fields: [squadId], references: [id])
  agent       VoiceAgent @relation(fields: [agentId], references: [id])
  
  @@index([squadId])
  @@index([agentId])
}
```

**File:** `lib/voice-agent/squad-router.ts`

```typescript
export class SquadRouter {
  async routeCall(squadId: string, context: any): Promise<string> {
    const squad = await prisma.voiceAgentSquad.findUnique({
      where: { id: squadId },
      include: { agents: { include: { agent: true } } }
    })
    
    // Evaluate routing rules
    for (const member of squad.agents.sort((a, b) => b.priority - a.priority)) {
      if (this.evaluateConditions(member.conditions, context)) {
        return member.agentId
      }
    }
    
    // Default to first agent
    return squad.agents[0].agentId
  }
  
  async transferCall(callId: string, toAgentId: string, context: any): Promise<void> {
    // Preserve conversation history
    const call = await prisma.voiceAgentCall.findUnique({
      where: { id: callId }
    })
    
    // Transfer to new agent
    await prisma.voiceAgentCall.update({
      where: { id: callId },
      data: {
        agentId: toAgentId,
        transferredAt: new Date(),
        transferContext: context
      }
    })
  }
}
```

---

### 2.2 A/B Testing Framework

**Database Schema:**

```prisma
model VoiceAgentExperiment {
  id          String   @id @default(cuid())
  agentId     String
  name        String
  variants    Json     // Array of variant configs
  trafficSplit Json   // Traffic distribution
  status      String   // active, paused, completed
  startDate   DateTime
  endDate     DateTime?
  metrics     Json?   // Experiment results
  
  agent       VoiceAgent @relation(fields: [agentId], references: [id])
  
  @@index([agentId])
  @@index([status])
}

model VoiceAgentExperimentAssignment {
  id          String   @id @default(cuid())
  experimentId String
  callId      String
  variant     String   // Which variant was assigned
  metrics     Json?    // Call-specific metrics
  
  experiment  VoiceAgentExperiment @relation(fields: [experimentId], references: [id])
  call        VoiceAgentCall @relation(fields: [callId], references: [id])
  
  @@index([experimentId])
  @@index([callId])
}
```

---

## 📋 API Endpoints Summary

### Phone Number Management
- `POST /api/v1/voice-agents/{id}/phone-numbers` - Assign phone number
- `GET /api/v1/voice-agents/{id}/phone-numbers` - List phone numbers
- `DELETE /api/v1/voice-agents/{id}/phone-numbers/{phoneId}` - Remove phone number

### Inbound/Outbound Calls
- `POST /api/v1/voice-agents/inbound` - Handle inbound call webhook
- `POST /api/v1/voice-agents/{id}/calls/outbound` - Initiate outbound call

### Tools
- `POST /api/v1/voice-agents/{id}/tools` - Add tool
- `GET /api/v1/voice-agents/{id}/tools` - List tools
- `DELETE /api/v1/voice-agents/{id}/tools/{toolId}` - Remove tool

### Squads
- `POST /api/v1/voice-agents/squads` - Create squad
- `POST /api/v1/voice-agents/squads/{id}/transfer` - Transfer call

### Experiments
- `POST /api/v1/voice-agents/{id}/experiments` - Create experiment
- `GET /api/v1/voice-agents/{id}/experiments` - List experiments

---

## 🎯 Next Steps

1. **Start with Phase 1.1** - Implement streaming STT/TTS
2. **Add VAD** - Implement voice activity detection
3. **Integrate telephony** - Connect Twilio/Exotel
4. **Add failover** - Implement service manager
5. **Build tools** - Add real-time tool calling

---

**Reference:** [Vapi.ai Quickstart](https://docs.vapi.ai/quickstart/introduction)
