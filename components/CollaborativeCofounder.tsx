'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DashboardLoading } from '@/components/ui/loading'
import { Users, Send, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'

const PAYAID_PURPLE = '#53328A'
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001'

interface Participant {
  userId: string
  joinedAt: string
}

interface Message {
  type: 'user' | 'ai' | 'system'
  userId?: string
  content: string
  timestamp: string
}

export function CollaborativeCofounder() {
  const { token, user } = useAuthStore()
  const params = useParams()
  const conversationId = params?.id as string || 'default'
  const roomId = `cofounder-${conversationId}`

  const [ws, setWs] = useState<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to WebSocket
  useEffect(() => {
    if (!token || !user) return

    const wsUrl = `${WEBSOCKET_URL}?token=${token}&roomId=${roomId}`
    const websocket = new WebSocket(wsUrl)

    websocket.onopen = () => {
      console.log('Connected to collaboration server')
      setConnected(true)
      setWs(websocket)
    }

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'participants_list':
          setParticipants(data.participants || [])
          break

        case 'participant_joined':
          setParticipants((prev) => [
            ...prev,
            { userId: data.userId, joinedAt: data.timestamp },
          ])
          setMessages((prev) => [
            ...prev,
            {
              type: 'system',
              content: `${data.userId} joined the conversation`,
              timestamp: data.timestamp,
            },
          ])
          break

        case 'participant_left':
          setParticipants((prev) => prev.filter((p) => p.userId !== data.userId))
          setMessages((prev) => [
            ...prev,
            {
              type: 'system',
              content: `${data.userId} left the conversation`,
              timestamp: data.timestamp,
            },
          ])
          break

        case 'user_typing':
          if (data.isTyping) {
            setTypingUsers((prev) => new Set([...prev, data.userId]))
          } else {
            setTypingUsers((prev) => {
              const next = new Set(prev)
              next.delete(data.userId)
              return next
            })
          }
          break

        case 'new_message':
          setMessages((prev) => [
            ...prev,
            {
              type: 'user',
              userId: data.userId,
              content: data.content,
              timestamp: data.timestamp,
            },
          ])
          break

        case 'ai_response':
          setMessages((prev) => [
            ...prev,
            {
              type: 'ai',
              content: data.response,
              timestamp: data.timestamp,
            },
          ])
          setLoading(false)
          break

        case 'pong':
          // Heartbeat response
          break
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }

    websocket.onclose = () => {
      console.log('Disconnected from collaboration server')
      setConnected(false)
      setWs(null)
    }

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      clearInterval(heartbeat)
      websocket.close()
    }
  }, [token, user, roomId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle typing
  const handleInputChange = (value: string) => {
    setInput(value)

    if (!isTyping && value.length > 0) {
      setIsTyping(true)
      ws?.send(JSON.stringify({ type: 'typing_start' }))
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      ws?.send(JSON.stringify({ type: 'typing_stop' }))
    }, 3000)
  }

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !ws || !connected) return

    const message = input.trim()
    setInput('')
    setIsTyping(false)
    ws.send(JSON.stringify({ type: 'typing_stop' }))

    // Add user message to UI
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        userId: user?.id || 'you',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ])

    // Broadcast to other participants
    ws.send(JSON.stringify({
      type: 'message',
      content: message,
    }))

    // Get AI response
    setLoading(true)
    try {
      const response = await fetch('/api/ai/cofounder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const aiResponse = data.response || data.message || 'No response'

        // Broadcast AI response
        ws.send(JSON.stringify({
          type: 'ai_response',
          response: aiResponse,
        }))
      }
    } catch (error) {
      console.error('Failed to get AI response:', error)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with participants */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Collaborative AI Co-Founder</CardTitle>
              <CardDescription>Real-time collaboration with your team</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Users className="h-5 w-5 text-gray-500" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Participants ({participants.length}):</span>
              {participants.map((p) => (
                <span key={p.userId} className="text-sm text-gray-600">
                  {p.userId}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col mb-4">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-purple-100 text-gray-900'
                      : message.type === 'ai'
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-yellow-50 text-gray-600 text-sm'
                  }`}
                >
                  {message.type === 'user' && message.userId && (
                    <div className="text-xs text-gray-500 mb-1">{message.userId}</div>
                  )}
                  <div>{message.content}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">
                    {Array.from(typingUsers).join(', ')} typing...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Type your message..."
              disabled={!connected || loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!connected || !input.trim() || loading}
              style={{ backgroundColor: PAYAID_PURPLE }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
