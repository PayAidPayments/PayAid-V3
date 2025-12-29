'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, Bot, User, Loader2, TrendingUp, DollarSign, Users, FileText, Zap } from 'lucide-react'
import type { AgentId } from '@/lib/ai/agents'
import Link from 'next/link'

// PayAid brand colors
const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'
const PAYAID_DARK_PURPLE = '#2D1B47'
const PAYAID_LIGHT_PURPLE = '#6B4BA1'

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

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
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

  // Fetch business context (dashboard stats)
  const { data: businessContext } = useQuery({
    queryKey: ['business-context'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) return null
      return response.json()
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
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

  // Quick actions
  const quickActions = [
    { label: 'Generate Business Plan', icon: FileText, action: () => setInput('Generate a comprehensive business plan for my company') },
    { label: 'Create Pitch Deck', icon: Zap, action: () => setInput('Help me create a pitch deck for investors') },
    { label: 'Analyze Revenue', icon: DollarSign, action: () => setInput('Analyze my revenue trends and provide insights') },
    { label: 'Growth Strategy', icon: TrendingUp, action: () => setInput('Suggest growth strategies for my business') },
  ]

  // Agent colors using PayAid theme
  const agentColors: Record<AgentId, string> = {
    cofounder: PAYAID_PURPLE,
    finance: '#10B981', // Green
    sales: PAYAID_PURPLE,
    marketing: '#EC4899', // Pink
    hr: '#F59E0B', // Orange
    website: '#6366F1', // Indigo
    restaurant: '#EF4444', // Red
    retail: PAYAID_GOLD,
    manufacturing: '#6B7280', // Gray
    'growth-strategist': PAYAID_GOLD,
    'operations': PAYAID_LIGHT_PURPLE,
    'product': '#8B5CF6', // Purple
    'industry-expert': '#14B8A6', // Teal
    'analytics': '#3B82F6', // Blue
    'customer-success': '#06B6D4', // Cyan
    'compliance': '#F97316', // Orange
    'fundraising': PAYAID_GOLD,
    'market-research': '#A855F7', // Purple
    'scaling': PAYAID_PURPLE,
    'tech-advisor': '#6366F1', // Indigo
    'design': '#EC4899', // Pink
    'documentation': '#64748B', // Slate
  }

  return (
    <div className="flex h-screen" style={{ background: 'linear-gradient(135deg, #F8F7F3 0%, #FFFFFF 100%)' }}>
      {/* Agent Selector Sidebar */}
      <div className="w-72 bg-white border-r-2 p-4 overflow-y-auto" style={{ borderColor: PAYAID_PURPLE }}>
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: PAYAID_PURPLE }}>AI Co-Founder Hub</h2>
          <p className="text-sm text-gray-600">17 Specialist Agents</p>
        </div>
        
        <div className="space-y-2">
          {agents.length === 0 ? (
            <div className="text-sm text-gray-500 p-3">Loading agents...</div>
          ) : (
            agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedAgent === agent.id
                    ? 'shadow-lg border-2'
                    : 'border-2 border-transparent hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedAgent === agent.id ? `${PAYAID_PURPLE}15` : 'transparent',
                  borderColor: selectedAgent === agent.id ? agentColors[agent.id] || PAYAID_PURPLE : 'transparent',
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: agentColors[agent.id] || PAYAID_PURPLE }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: PAYAID_PURPLE }}>{agent.name}</div>
                    <div className="text-xs text-gray-500 truncate">{agent.description}</div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 pt-6 border-t-2" style={{ borderColor: PAYAID_PURPLE + '20' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: PAYAID_PURPLE }}>Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, idx) => {
              const Icon = action.icon
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="w-full text-left p-2 rounded-lg hover:shadow-md transition-all flex items-center gap-2 text-sm"
                  style={{
                    backgroundColor: `${PAYAID_GOLD}15`,
                    border: `1px solid ${PAYAID_GOLD}40`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: PAYAID_GOLD }} />
                  <span className="font-medium" style={{ color: PAYAID_PURPLE }}>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b-2 p-4" style={{ borderColor: PAYAID_PURPLE }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>AI Co-Founder</h1>
              <p className="text-sm text-gray-600">
                {agents.find(a => a.id === selectedAgent)?.description || 'Your strategic business partner'}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" style={{ borderColor: PAYAID_PURPLE, color: PAYAID_PURPLE }}>
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-20">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: `${PAYAID_PURPLE}15` }}>
                    <Bot className="w-10 h-10" style={{ color: PAYAID_PURPLE }} />
                  </div>
                  <p className="text-xl font-semibold mb-2" style={{ color: PAYAID_PURPLE }}>Start a conversation with your AI Co-Founder</p>
                  <p className="text-sm mt-2">Ask about your business, get strategic advice, or consult a specialist</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
                      style={{ backgroundColor: agentColors[message.agent?.id as AgentId] || PAYAID_PURPLE }}
                    >
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-4 shadow-md ${
                      message.role === 'user'
                        ? 'text-white'
                        : 'bg-white border-2'
                    }`}
                    style={{
                      backgroundColor: message.role === 'user' ? PAYAID_PURPLE : 'white',
                      borderColor: message.role === 'assistant' ? (agentColors[message.agent?.id as AgentId] || PAYAID_PURPLE) : 'transparent',
                    }}
                  >
                    {message.agent && message.role === 'assistant' && (
                      <Badge 
                        className="mb-2 text-xs"
                        style={{ 
                          backgroundColor: `${agentColors[message.agent.id as AgentId] || PAYAID_PURPLE}20`,
                          color: agentColors[message.agent.id as AgentId] || PAYAID_PURPLE,
                          borderColor: agentColors[message.agent.id as AgentId] || PAYAID_PURPLE,
                        }}
                      >
                        {message.agent.name}
                      </Badge>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-white/70' : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {sendMessage.isPending && (
                <div className="flex gap-3 justify-start">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                    style={{ backgroundColor: agentColors[selectedAgent] || PAYAID_PURPLE }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border-2 rounded-lg p-4 shadow-md" style={{ borderColor: PAYAID_PURPLE + '40' }}>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: PAYAID_PURPLE }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Business Context Panel */}
          <div className="w-80 bg-white border-l-2 p-4 overflow-y-auto" style={{ borderColor: PAYAID_PURPLE }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: PAYAID_PURPLE }}>Business Context</h3>
            
            {businessContext ? (
              <div className="space-y-4">
                <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold" style={{ color: PAYAID_PURPLE }}>Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contacts</span>
                      <span className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>{businessContext.counts?.contacts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Deals</span>
                      <span className="text-lg font-bold" style={{ color: PAYAID_GOLD }}>{businessContext.counts?.deals || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Invoices</span>
                      <span className="text-lg font-bold" style={{ color: PAYAID_PURPLE }}>{businessContext.counts?.invoices || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Orders</span>
                      <span className="text-lg font-bold" style={{ color: PAYAID_GOLD }}>{businessContext.counts?.orders || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2" style={{ borderColor: PAYAID_GOLD }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold" style={{ color: PAYAID_PURPLE }}>Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1" style={{ color: PAYAID_GOLD }}>
                      ₹{businessContext.revenue?.last30Days?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <CardDescription className="text-xs">Last 30 days</CardDescription>
                  </CardContent>
                </Card>

                <Card className="border-2" style={{ borderColor: PAYAID_PURPLE }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold" style={{ color: PAYAID_PURPLE }}>Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-1" style={{ color: PAYAID_PURPLE }}>
                      ₹{businessContext.pipeline?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}
                    </div>
                    <CardDescription className="text-xs">{businessContext.pipeline?.activeDeals || 0} active deals</CardDescription>
                  </CardContent>
                </Card>

                {(businessContext.alerts?.overdueInvoices > 0 || businessContext.alerts?.pendingTasks > 0) && (
                  <Card className="border-2 border-red-300 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-red-800">Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {businessContext.alerts?.overdueInvoices > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">Overdue Invoices</span>
                          <span className="text-lg font-bold text-red-600">{businessContext.alerts.overdueInvoices}</span>
                        </div>
                      )}
                      {businessContext.alerts?.pendingTasks > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-700">Pending Tasks</span>
                          <span className="text-lg font-bold text-red-600">{businessContext.alerts.pendingTasks}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-4 text-center">
                Loading business context...
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t-2 p-4" style={{ borderColor: PAYAID_PURPLE }}>
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${agents.find(a => a.id === selectedAgent)?.name || 'AI Co-Founder'} anything...`}
              disabled={sendMessage.isPending}
              className="flex-1 border-2"
              style={{ borderColor: PAYAID_PURPLE + '40' }}
            />
            <Button 
              type="submit" 
              disabled={sendMessage.isPending || !input.trim()}
              style={{ 
                backgroundColor: PAYAID_PURPLE,
                color: 'white',
              }}
              className="hover:opacity-90"
            >
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
