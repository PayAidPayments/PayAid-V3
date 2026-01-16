/**
 * Telephony Audio Stream Server
 * Handles real-time WebSocket connections for Twilio Media Streams
 * 
 * This server receives audio from Twilio and processes it through
 * the Voice Orchestrator for real-time STT → LLM → TTS pipeline
 * 
 * Run: npm run dev:telephony (add to package.json)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '../lib/db/prisma';
import { TelephonyVoiceOrchestrator } from '../lib/voice-agent/telephony-orchestrator';
import { FreeStackVoiceOrchestrator } from '../lib/voice-agent/free-stack-orchestrator';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const PORT = process.env.TELEPHONY_WEBSOCKET_PORT 
  ? parseInt(process.env.TELEPHONY_WEBSOCKET_PORT) 
  : 3002;

interface StreamSession {
  callSid: string;
  agentId: string;
  ws: WebSocket;
  orchestrator: TelephonyVoiceOrchestrator | null;
  isActive: boolean;
  connectedAt: Date;
}

// Store active sessions
const activeSessions = new Map<string, StreamSession>();

export function createTelephonyAudioStreamServer() {
  const wss = new WebSocket.Server({ 
    port: PORT,
    path: '/voice/stream'
  });

  console.log(`[Telephony Audio Stream] Server listening on port ${PORT}`);

  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      // ===== EXTRACT PARAMETERS =====
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const callSid = url.searchParams.get('callSid');
      const agentId = url.searchParams.get('agentId');

      if (!callSid || !agentId) {
        console.error('[Telephony Audio Stream] Missing callSid or agentId');
        ws.close(1002, 'Missing callSid or agentId');
        return;
      }

      console.log('[Telephony Audio Stream] New connection:', { callSid, agentId });

      // ===== FETCH AGENT =====
      const agent = await prisma.voiceAgent.findUnique({
        where: { id: agentId }
      });

      if (!agent) {
        console.error('[Telephony Audio Stream] Agent not found:', agentId);
        ws.close(1002, 'Agent not found');
        return;
      }

      // ===== FETCH CALL RECORD =====
      const call = await prisma.voiceAgentCall.findFirst({
        where: { callSid }
      });

      if (!call) {
        console.error('[Telephony Audio Stream] Call not found:', callSid);
        ws.close(1002, 'Call not found');
        return;
      }

      // ===== INITIALIZE ORCHESTRATOR =====
      // Use free stack orchestrator if USE_FREE_STACK is enabled
      const useFreeStack = process.env.USE_FREE_STACK === 'true';
      
      const orchestrator = useFreeStack
        ? new FreeStackVoiceOrchestrator({
            agent,
            call,
            webSocket: ws
          })
        : new TelephonyVoiceOrchestrator({
            agent,
            call,
            webSocket: ws
          });
      
      console.log(`[Telephony Audio Stream] Using ${useFreeStack ? 'Free Stack' : 'Paid Services'} orchestrator`);

      const session: StreamSession = {
        callSid,
        agentId,
        ws,
        orchestrator,
        isActive: true,
        connectedAt: new Date()
      };

      activeSessions.set(callSid, session);

      // ===== START ORCHESTRATOR =====
      await orchestrator.start();

      // ===== HANDLE INCOMING MESSAGES =====
      ws.on('message', (data: Buffer | string) => {
        if (!session.isActive) return;
        handleAudioMessage(session, data);
      });

      // ===== HANDLE CONNECTION CLOSE =====
      ws.on('close', async () => {
        console.log('[Telephony Audio Stream] Connection closed:', callSid);
        session.isActive = false;
        
        if (session.orchestrator) {
          await session.orchestrator.stop();
        }

        // Update call status
        await prisma.voiceAgentCall.updateMany({
          where: { callSid },
          data: {
            status: 'completed',
            endTime: new Date()
          }
        });

        activeSessions.delete(callSid);
      });

      // ===== HANDLE ERRORS =====
      ws.on('error', (error) => {
        console.error('[Telephony Audio Stream] Error:', error);
        session.isActive = false;
      });

      // ===== SEND CONNECTION CONFIRMATION =====
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'connected',
          callSid,
          agentId,
          message: 'Telephony audio stream connected'
        }));
      }

    } catch (error) {
      console.error('[Telephony Audio Stream] Connection error:', error);
      ws.close(1011, 'Server error');
    }
  });

  return wss;
}

function handleAudioMessage(session: StreamSession, data: Buffer | string) {
  try {
    let audioBuffer: Buffer;

    // ===== PARSE INCOMING DATA =====
    if (typeof data === 'string') {
      // JSON payload from Twilio Media Streams
      try {
        const payload = JSON.parse(data);
        
        if (payload.event === 'media') {
          // Decode base64 audio payload
          audioBuffer = Buffer.from(payload.media.payload, 'base64');
        } else if (payload.event === 'start') {
          console.log('[Telephony Audio Stream] Stream started:', session.callSid);
          return;
        } else if (payload.event === 'stop') {
          console.log('[Telephony Audio Stream] Stream stopped:', session.callSid);
          session.isActive = false;
          return;
        } else {
          // Unknown event type
          return;
        }
      } catch (parseError) {
        console.error('[Telephony Audio Stream] Failed to parse JSON:', parseError);
        return;
      }
    } else {
      // Raw audio buffer
      audioBuffer = data;
    }

    // ===== PASS TO ORCHESTRATOR =====
    if (session.orchestrator && audioBuffer.length > 0) {
      session.orchestrator.processAudio(audioBuffer);
    }

  } catch (error) {
    console.error('[Telephony Audio Stream] Error handling message:', error);
  }
}

// Export active sessions for monitoring
export { activeSessions };

// Start server if run directly
if (require.main === module) {
  const server = createTelephonyAudioStreamServer();
  console.log(`✅ Telephony Audio Stream Server running on ws://localhost:${PORT}`);
  console.log(`[Telephony Audio Stream] Server process ID: ${process.pid}`);
}
