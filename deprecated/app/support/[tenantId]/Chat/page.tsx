'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Send, 
  Bot,
  User,
  Zap,
  BookOpen,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  aiActions?: {
    resolved?: boolean
    routed?: boolean
    booked?: boolean
    confidence?: number
  }
}

interface ChatSession {
  id: string
  customerId?: string
  customerName?: string
  status: 'active' | 'resolved' | 'routed' | 'booked'
  messages: ChatMessage[]
  aiResolved: boolean
}

export default function SupportChatPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize or load chat session
    initializeSession()
  }, [tenantId, token])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  const initializeSession = async () => {
    try {
      if (!token) return

      const response = await fetch('/api/support/chat/session', {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data.session || {
          id: `session_${Date.now()}`,
          status: 'active',
          messages: [],
          aiResolved: false,
        })
      }
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !session || !token) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }

    // Add user message to session
    const updatedSession = {
      ...session,
      messages: [...session.messages, userMessage],
    }
    setSession(updatedSession)
    setMessage('')
    setIsTyping(true)

    try {
      // Send to AI support chat API
      const response = await fetch('/api/support/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          message: userMessage.content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          aiActions: data.actions,
        }

        setSession({
          ...updatedSession,
          messages: [...updatedSession.messages, aiMessage],
          status: data.actions?.resolved ? 'resolved' : data.actions?.routed ? 'routed' : data.actions?.booked ? 'booked' : 'active',
          aiResolved: data.actions?.resolved || false,
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setSession({
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
      })
    } finally {
      setIsTyping(false)
    }
  }

  if (loading) {
    return <PageLoading message="Loading support chat..." fullScreen={false} />
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">AI Support Assistant</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {session?.status === 'resolved' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Issue Resolved
                      </span>
                    ) : session?.status === 'routed' ? (
                      <span className="flex items-center gap-1 text-blue-600">
                        <Zap className="h-4 w-4" />
                        Routed to Agent
                      </span>
                    ) : session?.status === 'booked' ? (
                      <span className="flex items-center gap-1 text-purple-600">
                        <Calendar className="h-4 w-4" />
                        Meeting Booked
                      </span>
                    ) : (
                      'Ready to help'
                    )}
                  </p>
                </div>
              </div>
              {session?.aiResolved && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  <Zap className="h-3 w-3 mr-1" />
                  AI Resolved
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="flex-1 flex flex-col mb-4">
          <CardContent className="flex-1 overflow-y-auto p-6">
            {session && session.messages.length > 0 ? (
              <div className="space-y-4">
                {session.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.role === 'assistant' && (
                          <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        )}
                        {msg.role === 'user' && (
                          <User className="h-5 w-5 text-white mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.aiActions && (
                            <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                              {msg.aiActions.resolved && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs mr-2">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                              {msg.aiActions.routed && (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs mr-2">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Routed
                                </Badge>
                              )}
                              {msg.aiActions.booked && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Meeting Booked
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
                        <span className="text-gray-600 dark:text-gray-400">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Start a conversation with AI Support
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    AI can resolve, route, or book meetings automatically
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isTyping}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                AI-powered responses
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Knowledge base integrated
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Auto-resolve enabled
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
