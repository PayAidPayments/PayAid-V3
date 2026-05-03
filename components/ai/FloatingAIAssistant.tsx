'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Send, Mic, MicOff, Sparkles, Loader2, Minus } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { cn } from '@/lib/utils/cn'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface FloatingAIAssistantProps {
  tenantId?: string
}

function buildErrorMessage(status: number, data: { message?: string; error?: string; hint?: string }): string {
  const serverMessage = data?.message || data?.error
  const hint = data?.hint
  if (status === 401) {
    return "Please sign in again to use the AI assistant."
  }
  if (status === 403) {
    return serverMessage || "You don't have access to the AI assistant. Check your plan or contact support."
  }
  if (status === 400) {
    return serverMessage || "Your message couldn't be processed. Please rephrase and try again."
  }
  if (serverMessage || hint) {
    return [serverMessage, hint].filter(Boolean).join('\n\n')
  }
  return "I couldn't get a response right now. Please try again in a moment."
}

export function FloatingAIAssistant({ tenantId }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with insights, analytics, and answer questions about your dashboard. How can I assist you today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { token } = useAuthStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // No token: show sign-in message without calling the API
    if (!token) {
      const signInMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Please sign in to use the AI assistant.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, signInMessage])
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: { module: 'crm', tenantId },
        }),
      })

      let data: { message?: string; error?: string; hint?: string } = {}
      try {
        const text = await response.text()
        if (text) data = JSON.parse(text) as typeof data
      } catch {
        // non-JSON or empty body
      }

      const assistantContent =
        response.ok
          ? (data.message || "I couldn't process that request. Please try again.")
          : buildErrorMessage(response.status, data)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const isNetworkError =
        error instanceof TypeError && error.message === 'Failed to fetch'
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isNetworkError
          ? "I couldn't reach the AI service. Check your internet connection and try again. If the problem continues, your administrator may need to enable the AI Studio module or configure API keys."
          : "Something went wrong. Please try again in a moment. If it keeps happening, your administrator may need to enable the AI Studio module or check the server configuration.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.')
      return
    }

    setIsListening(true)
    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new Recognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      recognition.stop()
    }

    recognition.onerror = () => {
      setIsListening(false)
      recognition.stop()
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  const quickActions = [
    { label: 'Show insights', query: 'What are the key insights from my dashboard?' },
    { label: 'Revenue trend', query: 'What is the revenue trend this month?' },
    { label: 'Top deals', query: 'What are my top performing deals?' },
    { label: 'Action items', query: 'What actions do I need to take today?' },
  ]

  return (
    <>
      {/* Floating Button - left of Quick Actions (right-6) so both are visible */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true)
          setIsMinimized(false)
        }}
        className={cn(
          'fixed bottom-6 right-[9.5rem] z-50',
          'w-14 h-14 rounded-full',
          'bg-gradient-to-br from-purple-500 to-purple-600',
          'text-white shadow-lg',
          'flex items-center justify-center',
          'hover:shadow-xl transition-shadow',
          isOpen && 'hidden'
        )}
        aria-label="Open AI Assistant"
      >
        <Bot className="w-6 h-6" />
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              'fixed bottom-6 right-[9.5rem] z-50',
              'w-96 h-[600px]',
              'bg-white rounded-xl shadow-2xl',
              'flex flex-col',
              'border border-gray-200',
              isMinimized && 'h-16'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-purple-100">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? 'Expand' : 'Minimize'}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Close"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {(Array.isArray(messages) ? messages : []).map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-4 py-2',
                          message.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length === 1 && (
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(quickActions) ? quickActions : []).map((action) => (
                        <button
                          key={action.label}
                          onClick={() => {
                            setInput(action.query)
                            inputRef.current?.focus()
                          }}
                          className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        placeholder="Ask me anything..."
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        disabled={isLoading}
                      />
                      <button
                        onClick={handleVoiceInput}
                        className={cn(
                          'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors',
                          isListening
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        aria-label="Voice input"
                      >
                        {isListening ? (
                          <Mic className="w-4 h-4 animate-pulse" />
                        ) : (
                          <MicOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        input.trim() && !isLoading
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      )}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
