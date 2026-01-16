/**
 * WebSocket Server for Real-time Voice Streaming
 * 
 * This server handles real-time bidirectional voice communication
 * Run this alongside your Next.js server for WebSocket support
 * 
 * Usage: node server/websocket-voice-server.js
 * Or: npm run dev:websocket (add to package.json)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file (explicit path)
config({ path: resolve(process.cwd(), '.env') })

import { WebSocketServer, WebSocket } from 'ws'
import { VoiceAgentOrchestrator } from '../lib/voice-agent/orchestrator'
import { prisma } from '../lib/db/prisma'
import { verify } from 'jsonwebtoken'
import { VoiceActivityDetector } from '../lib/voice-agent/vad'

const PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : 3001
// Use same JWT_SECRET logic as Next.js app
const JWT_SECRET = (process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'change-me-in-production').trim()

// Log JWT_SECRET status (without exposing the actual secret)
console.log('[WebSocket] JWT_SECRET configured:', JWT_SECRET ? 'Yes' : 'No', JWT_SECRET === 'change-me-in-production' ? '(using default - may cause auth failures)' : '(custom secret)')

interface VoiceMessage {
  type: 'audio' | 'text' | 'ping' | 'pong' | 'error' | 'transcript' | 'response' | 'audio_response'
  data?: any
  agentId?: string
  token?: string
  callId?: string
  language?: string
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

class VoiceWebSocketServer {
  private wss: WebSocketServer
  private orchestrator: VoiceAgentOrchestrator
  private vad: VoiceActivityDetector
  private activeConnections: Map<string, {
    ws: WebSocket
    agentId: string
    callId: string
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    vad: VoiceActivityDetector
    pendingAudio: Buffer[]
  }> = new Map()

  constructor(port: number) {
    this.wss = new WebSocketServer({ port })
    this.orchestrator = new VoiceAgentOrchestrator()
    this.vad = new VoiceActivityDetector({
      energyThreshold: 0.01,
      silenceDuration: 1000, // 1 second
      minSpeechDuration: 200, // 200ms
    })
    this.setupServer()
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress || 'unknown'
      console.log('[WebSocket] ========================================')
      console.log('[WebSocket] New connection attempt from:', clientIp)
      console.log('[WebSocket] Request URL:', req.url)
      console.log('[WebSocket] Headers:', JSON.stringify(req.headers, null, 2))
      
      // Wrap connection handling in try-catch to prevent crashes
      try {
        // Extract token from query string or headers
        let url: URL
        try {
          url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
        } catch (urlError) {
          console.error('[WebSocket] ❌ Failed to parse URL:', req.url, 'Error:', urlError)
          ws.close(1002, 'Invalid URL')
          return
        }
        
        const token = url.searchParams.get('token') || url.searchParams.get('authorization')?.replace('Bearer ', '')
        const urlAgentId = url.searchParams.get('agentId')

        console.log('[WebSocket] AgentId from URL:', urlAgentId)
        console.log('[WebSocket] Token received, length:', token ? token.length : 0)

        if (!token) {
          console.error('[WebSocket] ❌ No token provided in connection request')
          console.error('[WebSocket] URL params:', Array.from(url.searchParams.entries()))
          ws.close(1008, 'Authentication required')
          return
        }

        // Verify token
        let userId: string
        let tenantId: string
        try {
          const decoded = verify(token, JWT_SECRET) as any
          userId = decoded.userId || decoded.id
          tenantId = decoded.tenantId
          
          if (!userId || !tenantId) {
            console.error('[WebSocket] Token missing userId or tenantId. Decoded:', { userId, tenantId, decodedKeys: Object.keys(decoded) })
            ws.close(1008, 'Invalid token: missing user or tenant info')
            return
          }
          
          console.log('[WebSocket] ✅ Token verified successfully for user:', userId, 'tenant:', tenantId)
        } catch (error) {
          console.error('[WebSocket] ❌ Token verification failed:', error instanceof Error ? error.message : error)
          console.error('[WebSocket] JWT_SECRET configured:', JWT_SECRET ? 'Yes' : 'No', JWT_SECRET === 'change-me-in-production' ? '(using default - may not match Next.js app)' : '(custom secret)')
          ws.close(1008, 'Invalid token')
          return
        }

        // Send connection confirmation - wait for connection to be ready
        const sendConnectionConfirmation = () => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'connected',
                message: 'WebSocket connection established'
              }))
              console.log('[WebSocket] ✅ Connection confirmed message sent')
            } else {
              console.warn('[WebSocket] WebSocket not ready, state:', ws.readyState, '- waiting...')
              // Wait a bit and try again
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'WebSocket connection established'
                  }))
                  console.log('[WebSocket] ✅ Connection confirmed message sent (delayed)')
                } else {
                  console.error('[WebSocket] WebSocket still not ready after delay, state:', ws.readyState)
                }
              }, 100)
            }
          } catch (error) {
            console.error('[WebSocket] Failed to send connection confirmation:', error)
            ws.close(1011, 'Server error')
            return
          }
        }
        
        // Send immediately if ready, otherwise wait for 'open' event
        // Note: WebSocket is typically already OPEN when 'connection' event fires
        if (ws.readyState === WebSocket.OPEN) {
          sendConnectionConfirmation()
        } else {
          // If not open yet, wait for open event (should happen immediately)
          ws.once('open', () => {
            console.log('[WebSocket] WebSocket opened, sending confirmation')
            sendConnectionConfirmation()
          })
          
          // Also set a timeout to ensure we don't wait forever
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN && ws.readyState !== WebSocket.CLOSED) {
              console.log('[WebSocket] WebSocket opened (timeout check), sending confirmation')
              sendConnectionConfirmation()
            }
          }, 500)
        }

        let connectionId: string | null = null
        let agentId: string | null = urlAgentId
        let callId: string | null = null

      ws.on('message', async (message: Buffer) => {
        try {
          console.log('[WebSocket] Received message, length:', message.length)
          const msg: VoiceMessage = JSON.parse(message.toString())
          console.log('[WebSocket] Parsed message type:', msg.type)
          
          switch (msg.type) {
            case 'ping':
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'pong' }))
              }
              break

            case 'text':
              // Handle text message (fallback)
              if (msg.agentId && msg.data) {
                await this.handleTextMessage(ws, msg.agentId, msg.data, msg.conversationHistory || [])
              }
              break

            case 'audio':
              // Handle audio chunk
              if (msg.agentId && msg.data && msg.callId) {
                connectionId = `${msg.agentId}-${msg.callId}`
                agentId = msg.agentId
                callId = msg.callId
                
                await this.handleAudioChunk(
                  ws,
                  connectionId,
                  msg.agentId,
                  msg.callId,
                  msg.data,
                  msg.language
                )
              }
              break

            case 'start_call':
              // Initialize call
              if (msg.agentId) {
                agentId = msg.agentId
                const call = await this.createCall(agentId, tenantId, userId)
                callId = call.id
                connectionId = `${agentId}-${callId}`
                
                // Create VAD instance for this connection
                const connectionVAD = new VoiceActivityDetector({
                  energyThreshold: 0.01,
                  silenceDuration: 1000,
                  minSpeechDuration: 200,
                })

                this.activeConnections.set(connectionId, {
                  ws,
                  agentId,
                  callId,
                  conversationHistory: [],
                  vad: connectionVAD,
                  pendingAudio: [],
                })

                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'call_started',
                    callId,
                    agentId,
                  }))
                }
              }
              break

            case 'end_call':
              if (connectionId) {
                await this.endCall(connectionId, callId || '')
                this.activeConnections.delete(connectionId)
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: 'call_ended' }))
                }
              }
              break

            default:
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'error',
                  data: 'Unknown message type',
                }))
              }
          }
        } catch (error) {
          console.error('[WebSocket] Error processing message:', error)
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({
                type: 'error',
                data: error instanceof Error ? error.message : 'Unknown error',
              }))
            } catch (sendError) {
              console.error('[WebSocket] Failed to send error message:', sendError)
            }
          }
        }
      })

        ws.on('close', (code, reason) => {
          console.log('[WebSocket] ========================================')
          console.log('[WebSocket] Connection closed. Code:', code, 'Reason:', reason?.toString() || '(no reason)')
          console.log('[WebSocket] ConnectionId:', connectionId || '(not set)')
          console.log('[WebSocket] AgentId:', agentId || '(not set)')
          console.log('[WebSocket] CallId:', callId || '(not set)')
          if (connectionId) {
            this.activeConnections.delete(connectionId)
            if (callId) {
              this.endCall(connectionId, callId).catch(console.error)
            }
          }
        })

        ws.on('error', (error) => {
          console.error('[WebSocket] ========================================')
          console.error('[WebSocket] WebSocket error:', error)
          console.error('[WebSocket] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
          console.error('[WebSocket] WebSocket state:', ws.readyState)
          // Don't close here - let onclose handle it
        })
      } catch (error) {
        console.error('[WebSocket] ❌ Fatal error in connection handler:', error)
        try {
          ws.close(1011, 'Server error during connection setup')
        } catch (closeError) {
          console.error('[WebSocket] Failed to close connection:', closeError)
        }
      }
    })

    console.log(`[WebSocket] Server listening on port ${PORT}`)
  }

  private async createCall(agentId: string, tenantId: string, userId: string) {
    // Verify agent exists and belongs to tenant
    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: agentId,
        tenantId,
        status: 'active',
      },
    })

    if (!agent) {
      throw new Error('Agent not found')
    }

    // Create call record
    const call = await prisma.voiceAgentCall.create({
      data: {
        agentId,
        tenantId,
        phone: 'websocket-call',
        status: 'answered',
        startTime: new Date(),
        languageUsed: agent.language,
        dndChecked: false,
      },
    })

    return call
  }

  private async handleAudioChunk(
    ws: WebSocket,
    connectionId: string,
    agentId: string,
    callId: string,
    audioBase64: string,
    language?: string
  ) {
    try {
      const connection = this.activeConnections.get(connectionId)
      if (!connection) {
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Call not found',
        }))
        return
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64')

      // Use VAD to detect if this chunk contains speech
      const hasSpeech = connection.vad.detectSpeech(audioBuffer)
      
      if (!hasSpeech) {
        // No speech detected - accumulate in pending buffer but don't process yet
        connection.pendingAudio.push(audioBuffer)
        
        // Check if silence duration exceeded (speech ended)
        const vadState = connection.vad.getState()
        if (vadState.silenceDuration > 1000 && connection.pendingAudio.length > 0) {
          // Silence detected for >1s - process accumulated audio if we have enough
          // This handles end-of-speech detection
          const accumulatedAudio = Buffer.concat(connection.pendingAudio)
          connection.pendingAudio = []
          
          // Process the accumulated audio
          await this.processAudioWithHistory(ws, connection, agentId, callId, accumulatedAudio, language)
        }
        return
      }

      // Speech detected - add to pending buffer
      connection.pendingAudio.push(audioBuffer)
      
      // Process accumulated audio (streaming mode - process as we go)
      if (connection.pendingAudio.length >= 2) {
        // Process every 2 chunks to balance latency vs efficiency
        const accumulatedAudio = Buffer.concat(connection.pendingAudio)
        connection.pendingAudio = []
        
        await this.processAudioWithHistory(ws, connection, agentId, callId, accumulatedAudio, language)
      }
    } catch (error) {
      console.error('[WebSocket] Error processing audio:', error)
      ws.send(JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Failed to process audio',
      }))
    }
  }

  private async processAudioWithHistory(
    ws: WebSocket,
    connection: {
      ws: WebSocket
      agentId: string
      callId: string
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
      vad: VoiceActivityDetector
      pendingAudio: Buffer[]
    },
    agentId: string,
    callId: string,
    audioBuffer: Buffer,
    language?: string
  ) {
    try {
      // Process audio chunk with per-call conversation history
      const historyForLLM = connection.conversationHistory.map(h => ({
        role: h.role,
        content: h.content,
      }))
      
      const result = await this.orchestrator.processVoiceCall(
        agentId,
        audioBuffer,
        language,
        historyForLLM // Pass per-call history
      )

      // Update conversation history
      connection.conversationHistory.push(
        { role: 'user', content: result.transcript },
        { role: 'assistant', content: result.response }
      )

      // Send transcript immediately (streaming)
      ws.send(JSON.stringify({
        type: 'transcript',
        data: result.transcript,
        callId,
      }))

      // Send response text
      ws.send(JSON.stringify({
        type: 'response',
        data: result.response,
        callId,
      }))

      // Send audio response
      ws.send(JSON.stringify({
        type: 'audio_response',
        data: result.audio.toString('base64'),
        callId,
      }))

      // Update call record
      await prisma.voiceAgentCall.update({
        where: { id: callId },
        data: {
          transcript: result.transcript,
          languageUsed: result.detectedLanguage,
        },
      })
    } catch (error) {
      console.error('[WebSocket] Error in processAudioWithHistory:', error)
      ws.send(JSON.stringify({
        type: 'error',
        data: error instanceof Error ? error.message : 'Failed to process audio',
      }))
    }
  }

  private async handleTextMessage(
    ws: WebSocket,
    agentId: string,
    text: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ) {
    // For text messages, use the demo endpoint logic
    // This is a fallback for text-only communication
    try {
      const agent = await prisma.voiceAgent.findUnique({
        where: { id: agentId },
      })

      if (!agent) {
        ws.send(JSON.stringify({
          type: 'error',
          data: 'Agent not found',
        }))
        return
      }

      // Use orchestrator's LLM directly (simplified)
      // In production, you'd want to use the full orchestrator flow
      ws.send(JSON.stringify({
        type: 'response',
        data: 'Text messages not fully supported in voice stream. Use audio chunks.',
      }))
      } catch (error) {
        console.error('[WebSocket] Error in handleTextMessage:', error)
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({
              type: 'error',
              data: error instanceof Error ? error.message : 'Failed to process text',
            }))
          } catch (sendError) {
            console.error('[WebSocket] Failed to send error in handleTextMessage:', sendError)
          }
        }
      }
  }

  private async endCall(connectionId: string, callId: string) {
    try {
      await prisma.voiceAgentCall.update({
        where: { id: callId },
        data: {
          status: 'completed',
          endTime: new Date(),
        },
      })
    } catch (error) {
      console.error('[WebSocket] Error ending call:', error)
    }
  }
}

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('[WebSocket] ========================================')
  console.error('[WebSocket] Unhandled Rejection at:', promise)
  console.error('[WebSocket] Reason:', reason)
  console.error('[WebSocket] Stack:', reason instanceof Error ? reason.stack : 'No stack')
  console.error('[WebSocket] ========================================')
  // Don't exit - log and continue
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[WebSocket] ========================================')
  console.error('[WebSocket] Uncaught Exception:', error)
  console.error('[WebSocket] Stack:', error.stack)
  console.error('[WebSocket] ========================================')
  // Don't exit - log and continue (server should keep running)
})

// Start server
if (require.main === module) {
  const server = new VoiceWebSocketServer(PORT)
  console.log(`✅ Voice WebSocket Server running on ws://localhost:${PORT}`)
  console.log(`[WebSocket] Server process ID: ${process.pid}`)
  console.log(`[WebSocket] Node version: ${process.version}`)
}

export { VoiceWebSocketServer }

