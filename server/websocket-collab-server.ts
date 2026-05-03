/**
 * WebSocket Collaboration Server
 * Real-time collaboration for AI Co-Founder conversations
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'
import jwt from 'jsonwebtoken'

const PORT = process.env.WEBSOCKET_PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface Participant {
  userId: string
  tenantId: string
  ws: WebSocket
  joinedAt: Date
  isTyping: boolean
}

interface Room {
  roomId: string
  participants: Map<string, Participant>
  conversationId?: string
  createdAt: Date
}

const rooms = new Map<string, Room>()

// Create HTTP server
const server = createServer()

// Create WebSocket server
const wss = new WebSocketServer({ server })

// Helper to verify JWT token
function verifyToken(token: string): { userId: string; tenantId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
    }
  } catch {
    return null
  }
}

// Helper to get or create room
function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      participants: new Map(),
      createdAt: new Date(),
    })
  }
  return rooms.get(roomId)!
}

// Helper to broadcast to room
function broadcastToRoom(room: Room, message: any, excludeUserId?: string) {
  const payload = JSON.stringify(message)
  room.participants.forEach((participant, userId) => {
    if (userId !== excludeUserId && participant.ws.readyState === WebSocket.OPEN) {
      participant.ws.send(payload)
    }
  })
}

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  const { query } = parse(req.url || '', true)
  const token = query.token as string
  const roomId = query.roomId as string

  if (!token || !roomId) {
    ws.close(1008, 'Missing token or roomId')
    return
  }

  // Verify token
  const user = verifyToken(token)
  if (!user) {
    ws.close(1008, 'Invalid token')
    return
  }

  const { userId, tenantId } = user
  const room = getOrCreateRoom(roomId)

  // Add participant
  const participant: Participant = {
    userId,
    tenantId,
    ws,
    joinedAt: new Date(),
    isTyping: false,
  }

  room.participants.set(userId, participant)

  // Notify others of new participant
  broadcastToRoom(room, {
    type: 'participant_joined',
    userId,
    timestamp: new Date().toISOString(),
  }, userId)

  // Send current participants list to new user
  ws.send(JSON.stringify({
    type: 'participants_list',
    participants: Array.from(room.participants.values()).map(p => ({
      userId: p.userId,
      joinedAt: p.joinedAt,
    })),
  }))

  // Handle messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString())

      switch (message.type) {
        case 'typing_start':
          participant.isTyping = true
          broadcastToRoom(room, {
            type: 'user_typing',
            userId,
            isTyping: true,
          }, userId)
          break

        case 'typing_stop':
          participant.isTyping = false
          broadcastToRoom(room, {
            type: 'user_typing',
            userId,
            isTyping: false,
          }, userId)
          break

        case 'message':
          // Broadcast message to all participants
          broadcastToRoom(room, {
            type: 'new_message',
            userId,
            content: message.content,
            timestamp: new Date().toISOString(),
          })
          break

        case 'ai_response':
          // Broadcast AI response to all participants
          broadcastToRoom(room, {
            type: 'ai_response',
            response: message.response,
            timestamp: new Date().toISOString(),
          })
          break

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  })

  // Handle disconnect
  ws.on('close', () => {
    room.participants.delete(userId)

    // Notify others
    broadcastToRoom(room, {
      type: 'participant_left',
      userId,
      timestamp: new Date().toISOString(),
    })

    // Clean up empty rooms after 5 minutes
    if (room.participants.size === 0) {
      setTimeout(() => {
        if (room.participants.size === 0) {
          rooms.delete(roomId)
        }
      }, 5 * 60 * 1000)
    }
  })

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 WebSocket Collaboration Server running on port ${PORT}`)
})

// Cleanup on shutdown
process.on('SIGTERM', () => {
  wss.close(() => {
    server.close()
    process.exit(0)
  })
})
