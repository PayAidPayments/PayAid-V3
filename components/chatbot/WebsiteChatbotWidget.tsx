'use client'

import { useState, useEffect, useRef } from 'react'

interface ChatbotWidgetProps {
  chatbotId: string
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  greetingMessage?: string
  autoGreet?: boolean
  autoGreetDelay?: number
}

export default function WebsiteChatbotWidget({
  chatbotId,
  position = 'bottom-right',
  primaryColor = '#53328A',
  greetingMessage = 'Hello! How can I help you today?',
  autoGreet = true,
  autoGreetDelay = 3000,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate session and visitor IDs
    const session = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const visitor = `visitor_${Math.random().toString(36).substr(2, 16)}`
    setSessionId(session)
    setVisitorId(visitor)

    // Auto-greet
    if (autoGreet && autoGreetDelay > 0) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        setMessages([{
          role: 'assistant',
          content: greetingMessage,
          timestamp: new Date().toISOString(),
        }])
      }, autoGreetDelay)
      return () => clearTimeout(timer)
    }
  }, [autoGreet, autoGreetDelay, greetingMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/chatbots/${chatbotId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId,
          visitorId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.response,
            timestamp: new Date().toISOString(),
          },
        ])

        // If contact/deal was created, show success message
        if (data.contactId) {
          console.log('Lead captured! Contact ID:', data.contactId)
        }
      } else {
        const error = await response.json()
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed ${positionClasses[position]} z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Open chat"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses[position]} z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col`}
        >
          {/* Header */}
          <div
            className="p-4 rounded-t-lg flex justify-between items-center text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <div>
              <h3 className="font-semibold">Chat with us</h3>
              <p className="text-xs opacity-90">We&apos;re here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:opacity-70 transition-opacity"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-white'
                  }`}
                  style={message.role === 'assistant' ? { backgroundColor: primaryColor } : {}}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

