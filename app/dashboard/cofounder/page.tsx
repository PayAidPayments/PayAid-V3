'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import type { AgentId } from '@/lib/ai/agents'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent?: {
    id: string
    name: string
  }
}

interface Agent {
  id: AgentId
  name: string
  description: string
}

export default function CoFounderPage() {
  const { token } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('cofounder')

  // Fetch available agents
  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['ai-agents'],
    queryFn: async () => {
      const response = await fetch('/api/ai/cofounder', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to fetch agents')
      return response.json()
    },
    enabled: !!token,
  })

  const agents = agentsData?.agents || []

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/ai/cofounder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message,
          agentId: selectedAgent,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to send message')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: variables, timestamp: new Date() },
        {
          role: 'assistant',
          content: data.message || 'No response',
          timestamp: new Date(),
          agent: data.agent,
        },
      ])
      setInput('')
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'An error occurred'}`,
          timestamp: new Date(),
        },
      ])
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !sendMessage.isPending) {
      sendMessage.mutate(input.trim())
    }
  }

  // Agent colors for UI
  const agentColors: Record<AgentId, string> = {
    cofounder: 'bg-blue-500',
    finance: 'bg-green-500',
    sales: 'bg-purple-500',
    marketing: 'bg-pink-500',
    hr: 'bg-orange-500',
    website: 'bg-indigo-500',
    restaurant: 'bg-red-500',
    retail: 'bg-yellow-500',
    manufacturing: 'bg-gray-500',
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Agent Selector Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">AI Agents</h2>
        <div className="space-y-2">
          {agents.length === 0 ? (
            <div className="text-sm text-gray-500 p-3">Loading agents...</div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedAgent === agent.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${agentColors[agent.id] || 'bg-gray-500'}`} />
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-500">{agent.description}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold">AI Co-Founder</h1>
          <p className="text-sm text-gray-500">
            Your strategic business partner - {agents.find(a => a.id === selectedAgent)?.description || 'Ask anything about your business'}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Start a conversation with your AI Co-Founder</p>
                <p className="text-sm mt-2">Ask about your business, get strategic advice, or consult a specialist</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {message.agent && message.role === 'assistant' && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      {message.agent.name}
                    </Badge>
                  )}
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}

            {sendMessage.isPending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${agents.find(a => a.id === selectedAgent)?.name || 'AI Co-Founder'} anything...`}
              disabled={sendMessage.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={sendMessage.isPending || !input.trim()}>
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

