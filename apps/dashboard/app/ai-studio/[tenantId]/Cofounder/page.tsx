'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Send, Bot, User, Loader2, ChevronDown, LayoutGrid, History, AlertCircle, ExternalLink, Paperclip, Download, Table2, Zap, FolderPlus, Pencil } from 'lucide-react'
import { formatINR } from '@/lib/utils/formatINR'
import { getSuggestionsForAgent } from '@/lib/ai/co-founder-suggestions'
import {
  SPECIALIST_CATEGORY_ORDER,
  getCategoryForAgent,
  getRoleForAgent,
} from '@/lib/ai/co-founder-specialists'
import { getTemplatesForAgent } from '@/lib/ai/co-founder-templates'
import type { AgentId } from '@/lib/ai/agents'
import type { ArtifactPayload, StructuredAction } from '@/lib/ai/cofounder-structured'

const PAYAID_PURPLE = '#53328A'

const CONTEXT_OPTIONS = [
  { value: 'all', label: 'All modules' },
  { value: 'crm', label: 'CRM only' },
  { value: 'finance', label: 'Finance only' },
  { value: 'hr', label: 'HR only' },
]

const TIME_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'This quarter' },
  { value: 'custom', label: 'Custom' },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  agent?: { id: string; name: string }
  artifact?: ArtifactPayload
  structuredActions?: StructuredAction[]
}

interface Agent {
  id: AgentId
  name: string
  description: string
}

function StructuredActionButton({
  action,
  tenantId,
  getAuthHeaders,
  conversationId,
}: {
  action: StructuredAction
  tenantId: string
  getAuthHeaders: () => Record<string, string>
  conversationId: string | null
}) {
  const defaultLabels: Record<string, string> = {
    open_deal: 'Open deal', open_crm: 'Open CRM', open_finance: 'Open Finance', open_hr: 'Open HR',
    create_task: 'Create task', open_invoice: 'Open invoice', open_quotes: 'Open Quotes',
    open_contacts: 'View contacts', open_leads: 'View leads', open_contact: 'Open contact',
  }
  const label = action.label || defaultLabels[action.type] || action.type
  if (action.type === 'open_deal' && action.dealId) {
    return (
      <Link href={`/crm/${tenantId}/Deals/${action.dealId}`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: PAYAID_PURPLE, color: PAYAID_PURPLE }}>
          {label}
        </Button>
      </Link>
    )
  }
  if (action.type === 'open_crm') {
    return (
      <Link href={`/crm/${tenantId}/Home`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_finance') {
    return (
      <Link href={`/finance/${tenantId}/Invoices`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_hr') {
    return (
      <Link href={`/hr/${tenantId}`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_invoice' && action.invoiceId) {
    return (
      <Link href={`/finance/${tenantId}/Invoices/${action.invoiceId}`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_quotes') {
    return (
      <Link href={`/crm/${tenantId}/Quotes`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_contacts') {
    return (
      <Link href={`/crm/${tenantId}/Contacts`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_leads') {
    return (
      <Link href={`/crm/${tenantId}/Leads`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'open_contact' && action.contactId) {
    return (
      <Link href={`/crm/${tenantId}/Contacts/${action.contactId}`}>
        <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>{label}</Button>
      </Link>
    )
  }
  if (action.type === 'create_task') {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        style={{ borderColor: PAYAID_PURPLE, color: PAYAID_PURPLE }}
        onClick={async () => {
          try {
            await fetch('/api/ai/cofounder/actions/convert-to-task', {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify({
                action: action.title || label,
                description: action.description,
                priority: action.priority || 'medium',
                dueDate: action.due,
                conversationId: conversationId || undefined,
              }),
            })
          } catch (e) {
            console.error(e)
          }
        }}
      >
        {label}
      </Button>
    )
  }
  return null
}

function getAuthHeaders() {
  const { token } = useAuthStore.getState()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const INITIAL_SPECIALISTS_VISIBLE = 8

export default function CoFounderPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('cofounder')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [suggestedActions, setSuggestedActions] = useState<
    Array<{ action: string; description: string; priority?: string }>
  >([])
  const [contextModules, setContextModules] = useState('all')
  const [timeRange, setTimeRange] = useState('30')
  const [showAllSpecialists, setShowAllSpecialists] = useState(false)
  const [specialistsOpen, setSpecialistsOpen] = useState(false)
  const [attachContextOpen, setAttachContextOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectInstructions, setProjectInstructions] = useState('')
  const [projectContextNotes, setProjectContextNotes] = useState('')

  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['ai-agents'],
    queryFn: async () => {
      const res = await fetch('/api/ai/cofounder', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch agents')
      return res.json()
    },
    enabled: !!token,
  })

  const { data: businessContext } = useQuery({
    queryKey: ['business-context'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats', { headers: getAuthHeaders() })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  })

  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['cofounder-conversations'],
    queryFn: async () => {
      const res = await fetch('/api/ai/cofounder/conversations', {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return { conversations: [], total: 0 }
      return res.json()
    },
    enabled: !!token,
  })

  const { data: projectsData, refetch: refetchProjects } = useQuery<{ projects: Array<{ id: string; name: string; instructions: string | null; contextNotes: string | null; _count: { conversations: number } }> }>({
    queryKey: ['cofounder-projects'],
    queryFn: async () => {
      const res = await fetch('/api/ai/cofounder/projects', { headers: getAuthHeaders() })
      if (!res.ok) return { projects: [] }
      return res.json()
    },
    enabled: !!token,
  })

  const agents = agentsData?.agents || []
  const projects = projectsData?.projects || []

  type SendPayload = string | { message: string; agentId?: AgentId }
  const sendMessage = useMutation({
    mutationFn: async (payload: SendPayload) => {
      const message = typeof payload === 'string' ? payload : payload.message
      const agentId = typeof payload === 'string' ? selectedAgent : (payload.agentId ?? selectedAgent)
      const res = await fetch('/api/ai/cofounder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message,
          agentId,
          conversationId: conversationId || undefined,
          projectId: selectedProjectId || undefined,
          useMultiSpecialist: agentId === 'cofounder',
          context: { module: contextModules !== 'all' ? contextModules : undefined },
          timeRangeDays: timeRange === 'custom' ? 30 : parseInt(timeRange, 10) || 30,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Failed to send message')
      }
      return res.json()
    },
    onSuccess: (data, variables) => {
      const userContent = typeof variables === 'string' ? variables : variables.message
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userContent, timestamp: new Date() },
        {
          role: 'assistant',
          content: data.message || 'No response',
          timestamp: new Date(),
          agent: data.agent,
          ...(data.artifact && { artifact: data.artifact }),
          ...(data.structuredActions?.length && { structuredActions: data.structuredActions }),
        },
      ])
      setInput('')
      if (data.conversationId) setConversationId(data.conversationId)
      if (data.suggestedActions?.length) setSuggestedActions(data.suggestedActions)
      refetchConversations()
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`,
          timestamp: new Date(),
        },
      ])
    },
  })

  const groupedAgents = useMemo(() => {
    const byCategory: Record<string, Agent[]> = {}
    for (const cat of SPECIALIST_CATEGORY_ORDER) {
      byCategory[cat] = []
    }
    for (const agent of agents) {
      const cat = getCategoryForAgent(agent.id)
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(agent)
    }
    return SPECIALIST_CATEGORY_ORDER.map((cat) => ({
      category: cat,
      agents: byCategory[cat] || [],
    })).filter((g) => g.agents.length > 0)
  }, [agents])

  const visibleGroups = useMemo(() => {
    if (showAllSpecialists) return groupedAgents
    let count = 0
    const result: typeof groupedAgents = []
    for (const g of groupedAgents) {
      const take = Math.max(0, INITIAL_SPECIALISTS_VISIBLE - count)
      if (take === 0) break
      result.push({
        category: g.category,
        agents: take >= g.agents.length ? g.agents : g.agents.slice(0, take),
      })
      count += result[result.length - 1].agents.length
    }
    return result
  }, [groupedAgents, showAllSpecialists])

  const hasMoreSpecialists = agents.length > INITIAL_SPECIALISTS_VISIBLE && !showAllSpecialists
  const selectedAgentMeta = agents.find((a) => a.id === selectedAgent)
  const roleInfo = getRoleForAgent(selectedAgent)
  const suggestionChips = getSuggestionsForAgent(selectedAgent)
  const workflowTemplates = useMemo(() => getTemplatesForAgent(selectedAgent), [selectedAgent])

  // Latest artifact for the right-panel "AI Output"
  const latestArtifact = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].artifact) return messages[i].artifact
    }
    return null
  }, [messages])

  // When user switches specialist, show a one-line "What I can help you with"
  const [prevAgent, setPrevAgent] = useState<AgentId | null>(null)
  useEffect(() => {
    if (prevAgent !== null && prevAgent !== selectedAgent) {
      const { role } = getRoleForAgent(selectedAgent)
      const name = agents.find((a) => a.id === selectedAgent)?.name ?? 'Co-Founder'
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm ${name}. I can help with: ${role}. Ask me anything.`,
          timestamp: new Date(),
          agent: { id: selectedAgent, name },
        },
      ])
    }
    setPrevAgent(selectedAgent)
  }, [selectedAgent, agents, prevAgent])

  const handleChipSend = (text: string) => {
    if (!text.trim() || sendMessage.isPending) return
    sendMessage.mutate(text.trim())
  }

  const handleTemplateRun = (prompt: string, agentId: AgentId) => {
    if (!prompt.trim() || sendMessage.isPending) return
    sendMessage.mutate({ message: prompt.trim(), agentId })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !sendMessage.isPending) sendMessage.mutate(input.trim())
  }

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/cofounder/conversations/${convId}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return
      const data = await res.json()
      const msgs = (data.messages || []).map((m: { role: string; content: string; timestamp: string; agent?: { id: string; name: string }; artifact?: ArtifactPayload; structuredActions?: StructuredAction[] }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.timestamp),
        agent: m.agent,
        ...(m.artifact && { artifact: m.artifact }),
        ...(m.structuredActions?.length && { structuredActions: m.structuredActions }),
      }))
      setMessages(msgs)
      setConversationId(data.id)
      setSuggestedActions(Array.isArray(data.suggestedActions) ? data.suggestedActions : [])
      setSelectedProjectId(data.projectId ?? null)
    } catch (e) {
      console.error('Failed to load conversation:', e)
    }
  }

  const saveProject = useMutation({
    mutationFn: async () => {
      const headers = getAuthHeaders()
      if (editingProjectId) {
        const res = await fetch(`/api/ai/cofounder/projects/${editingProjectId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            name: projectName.trim(),
            instructions: projectInstructions.trim() || null,
            contextNotes: projectContextNotes.trim() || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to update project')
        return res.json()
      }
      const res = await fetch('/api/ai/cofounder/projects', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: projectName.trim(),
          instructions: projectInstructions.trim() || undefined,
          contextNotes: projectContextNotes.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create project')
      return res.json()
    },
    onSuccess: (data) => {
      refetchProjects()
      setProjectDialogOpen(false)
      setEditingProjectId(null)
      setProjectName('')
      setProjectInstructions('')
      setProjectContextNotes('')
      if (data?.id && !editingProjectId) setSelectedProjectId(data.id)
    },
  })

  const openNewProjectDialog = () => {
    setEditingProjectId(null)
    setProjectName('')
    setProjectInstructions('')
    setProjectContextNotes('')
    setProjectDialogOpen(true)
  }

  const openEditProjectDialog = (p: { id: string; name: string; instructions: string | null; contextNotes?: string | null }) => {
    setEditingProjectId(p.id)
    setProjectName(p.name)
    setProjectInstructions(p.instructions || '')
    setProjectContextNotes(p.contextNotes || '')
    setProjectDialogOpen(true)
  }

  const renderSpecialistsList = () => (
    <div className="space-y-6 py-2">
      {visibleGroups.map(({ category, agents: list }) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-3">
            {category}
          </h3>
          <div className="space-y-1.5">
            {list.map((agent) => {
              const isSelected = selectedAgent === agent.id
              const { role, tooltip } = getRoleForAgent(agent.id)
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgent(agent.id as AgentId)
                    setSpecialistsOpen(false)
                  }}
                  title={tooltip}
                  className={`w-full text-left rounded-xl px-3 py-3 transition-all border-l-4 ${
                    isSelected
                      ? 'bg-[#53328A]/12 dark:bg-[#53328A]/20 border-[#53328A] shadow-sm'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: isSelected ? PAYAID_PURPLE : '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {agent.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {role}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {hasMoreSpecialists && (
        <button
          type="button"
          onClick={() => setShowAllSpecialists(true)}
          className="w-full text-center text-sm text-[#53328A] font-medium py-2 hover:underline"
        >
          Show all specialists
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col">
      <div className="flex flex-1 min-h-0 max-w-[1600px] w-full mx-auto">
        {/* Left: Specialists — fixed width, hide on small */}
        <aside className="hidden lg:flex flex-col w-[280px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold" style={{ color: PAYAID_PURPLE }}>
              Specialists
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose who&apos;s in the room
            </p>
          </div>
          <ScrollArea className="flex-1 px-3">
            {agents.length === 0 ? (
              <div className="py-6 text-sm text-slate-500">Loading specialists…</div>
            ) : (
              <>
                {renderSpecialistsList()}
                {/* Projects: context memory */}
                <div className="pt-4 pb-2 border-t border-slate-200 dark:border-slate-800 mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-3 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5" style={{ color: PAYAID_PURPLE }} />
                    Project
                  </h3>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(null)}
                      className={`w-full text-left rounded-xl px-3 py-2 text-sm border transition-all ${
                        selectedProjectId === null
                          ? 'border-[#53328A]/50 bg-[#53328A]/10 dark:bg-[#53328A]/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      No project (general chat)
                    </button>
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center gap-1 group">
                        <button
                          type="button"
                          onClick={() => setSelectedProjectId(p.id)}
                          className={`flex-1 min-w-0 text-left rounded-xl px-3 py-2 text-sm border transition-all truncate ${
                            selectedProjectId === p.id
                              ? 'border-[#53328A]/50 bg-[#53328A]/10 dark:bg-[#53328A]/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                          title={p.instructions || p.name}
                        >
                          {p.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditProjectDialog(p)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Edit project"
                        >
                          <Pencil className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={openNewProjectDialog}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      + New project
                    </button>
                  </div>
                </div>
                {workflowTemplates.length > 0 && (
                  <div className="pt-4 pb-6 border-t border-slate-200 dark:border-slate-800 mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 px-3 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" style={{ color: PAYAID_PURPLE }} />
                      Workflows
                    </h3>
                    <div className="space-y-1.5">
                      {workflowTemplates.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          disabled={sendMessage.isPending}
                          title={t.description}
                          onClick={() => handleTemplateRun(t.prompt, t.agentId)}
                          className="w-full text-left rounded-xl px-3 py-2.5 transition-all border border-slate-200 dark:border-slate-700 hover:border-[#53328A]/50 hover:bg-[#53328A]/8 dark:hover:bg-[#53328A]/12 text-sm disabled:opacity-50"
                        >
                          <span className="font-medium text-slate-900 dark:text-slate-100 block truncate">{t.label}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{t.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </ScrollArea>
        </aside>

        {/* Center: Chat */}
        <main className="flex-1 flex flex-col min-w-0 lg:min-w-[400px]">
          {/* Header */}
          <header className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Drawer trigger on small */}
              <Sheet open={specialistsOpen} onOpenChange={setSpecialistsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Specialists
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Specialists</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-80px)]">
                    {renderSpecialistsList()}
                    <div className="pt-4 px-3 border-t border-slate-200 dark:border-slate-800 mt-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                        <FolderPlus className="w-3.5 h-3.5" style={{ color: PAYAID_PURPLE }} />
                        Project
                      </h3>
                      <div className="space-y-1">
                        <button type="button" onClick={() => { setSelectedProjectId(null); setSpecialistsOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-sm border border-slate-200 dark:border-slate-700">
                          No project
                        </button>
                        {projects.map((p) => (
                          <button key={p.id} type="button" onClick={() => { setSelectedProjectId(p.id); setSpecialistsOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 truncate">
                            {p.name}
                          </button>
                        ))}
                        <button type="button" onClick={() => { openNewProjectDialog(); setSpecialistsOpen(false) }} className="w-full text-left rounded-xl px-3 py-2 text-sm border border-dashed text-slate-600 dark:text-slate-400">
                          + New project
                        </button>
                      </div>
                    </div>
                    {workflowTemplates.length > 0 && (
                      <div className="pt-4 pb-6 border-t border-slate-200 dark:border-slate-800 mt-4 px-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" style={{ color: PAYAID_PURPLE }} />
                          Workflows
                        </h3>
                        <div className="space-y-1.5">
                          {workflowTemplates.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              disabled={sendMessage.isPending}
                              title={t.description}
                              onClick={() => { handleTemplateRun(t.prompt, t.agentId); setSpecialistsOpen(false) }}
                              className="w-full text-left rounded-xl px-3 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-[#53328A]/8 text-sm"
                            >
                              <span className="font-medium block truncate">{t.label}</span>
                              <span className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{t.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PAYAID_PURPLE }}
                />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedAgentMeta?.name ?? 'Co-Founder'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                  {roleInfo.role}
                </span>
              </div>
              <select
                value={contextModules}
                onChange={(e) => setContextModules(e.target.value)}
                className="w-[160px] h-8 text-xs border rounded-lg bg-background px-2"
                style={{ borderColor: `${PAYAID_PURPLE}40` }}
              >
                {CONTEXT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-[140px] h-8 text-xs border rounded-lg bg-background px-2"
                style={{ borderColor: `${PAYAID_PURPLE}40` }}
              >
                {TIME_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </header>

          {/* Messages area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: `${PAYAID_PURPLE}15` }}
                    >
                      <Bot className="w-8 h-8" style={{ color: PAYAID_PURPLE }} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Plan your next move with AI Co‑founder
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                      Choose a question or type your own. Co‑founder sees CRM, Finance, HR, and more.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestionChips.slice(0, 4).map((text, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-left h-auto py-2 px-4 whitespace-normal max-w-[280px]"
                          style={{ borderColor: `${PAYAID_PURPLE}50` }}
                          onClick={() => handleChipSend(text)}
                        >
                          {text}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isLastAssistantMessage =
                    msg.role === 'assistant' &&
                    !messages.slice(idx + 1).some((m) => m.role === 'assistant')
                  return (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: PAYAID_PURPLE }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { backgroundColor: PAYAID_PURPLE }
                          : undefined
                      }
                    >
                      {msg.role === 'assistant' && msg.agent && (
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                          {msg.agent.name}&apos;s view
                        </div>
                      )}
                      {msg.role === 'user' && (
                        <div className="text-xs font-medium text-white/80 mb-1.5">You</div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                      {msg.role === 'assistant' && isLastAssistantMessage && (msg.structuredActions?.length ? (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                          {msg.structuredActions.map((action, i) => (
                            <StructuredActionButton key={i} action={action} tenantId={tenantId} getAuthHeaders={getAuthHeaders} conversationId={conversationId} />
                          ))}
                        </div>
                      ) : suggestedActions.length > 0 ? (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: PAYAID_PURPLE, color: PAYAID_PURPLE }}
                            onClick={async () => {
                              try {
                                await fetch('/api/ai/cofounder/actions/convert-to-task', {
                                  method: 'POST',
                                  headers: getAuthHeaders(),
                                  body: JSON.stringify({
                                    action: suggestedActions[0].action,
                                    description: suggestedActions[0].description,
                                    priority: suggestedActions[0].priority || 'medium',
                                    conversationId: conversationId || undefined,
                                  }),
                                })
                              } catch (e) {
                                console.error(e)
                              }
                            }}
                          >
                            Create tasks from this plan
                          </Button>
                          <Link href={`/crm/${tenantId}/Home`}>
                            <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>
                              Open CRM to see these deals
                            </Button>
                          </Link>
                          <Link href={`/finance/${tenantId}/Invoices`}>
                            <Button size="sm" variant="outline" className="text-xs" style={{ borderColor: `${PAYAID_PURPLE}60` }}>
                              Open Finance forecast
                            </Button>
                          </Link>
                        </div>
                      ) : null)}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-9 h-9 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                )
                })}

                {sendMessage.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: PAYAID_PURPLE }}
                    >
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: PAYAID_PURPLE }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input + chips */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {suggestionChips.slice(0, 5).map((text, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleChipSend(text)}
                      disabled={sendMessage.isPending}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                      {text.length > 45 ? `${text.slice(0, 45)}…` : text}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                  <Popover open={attachContextOpen} onOpenChange={setAttachContextOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl flex-shrink-0"
                        title="Attach context (module & time range)"
                        style={{ borderColor: `${PAYAID_PURPLE}50` }}
                      >
                        <Paperclip className="w-4 h-4" style={{ color: PAYAID_PURPLE }} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-4" align="start">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Context for this conversation</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Modules</label>
                          <select
                            value={contextModules}
                            onChange={(e) => setContextModules(e.target.value)}
                            className="h-9 w-full text-xs border rounded-lg bg-background px-2"
                            style={{ borderColor: `${PAYAID_PURPLE}40` }}
                          >
                            {CONTEXT_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Time range</label>
                          <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="h-9 w-full text-xs border rounded-lg bg-background px-2"
                            style={{ borderColor: `${PAYAID_PURPLE}40` }}
                          >
                            {TIME_RANGE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Applied to the next message you send.</p>
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask ${selectedAgentMeta?.name ?? 'Co-Founder'}…`}
                    disabled={sendMessage.isPending}
                    className="flex-1 rounded-xl border-slate-200 dark:border-slate-700"
                  />
                  <Button
                    type="submit"
                    disabled={sendMessage.isPending || !input.trim()}
                    className="rounded-xl"
                    style={{ backgroundColor: PAYAID_PURPLE }}
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
        </main>

        {/* Right: Context + AI Output (Artifacts) — fixed width, stack below on small */}
        <aside className="hidden xl:flex flex-col w-[280px] flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 overflow-y-auto">
          {latestArtifact && (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Table2 className="w-4 h-4 flex-shrink-0" style={{ color: PAYAID_PURPLE }} />
                  <span className="truncate">{latestArtifact.title || 'AI Output'}</span>
                </CardTitle>
                {latestArtifact.type === 'table' && 'columns' in latestArtifact.data && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const d = latestArtifact!.data as { columns: string[]; rows: Record<string, string | number>[] }
                      const header = d.columns.join(',')
                      const body = d.rows.map((r) => d.columns.map((c) => String(r[c] ?? '')).join(',')).join('\n')
                      const csv = `${header}\n${body}`
                      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ai-output-${new Date().toISOString().slice(0, 10)}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    title="Download CSV"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {latestArtifact.type === 'table' && 'columns' in latestArtifact.data && (
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                          {latestArtifact.data.columns.map((col) => (
                            <th key={col} className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {latestArtifact.data.rows.slice(0, 20).map((row, ri) => (
                          <tr key={ri} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            {latestArtifact!.data.columns.map((col) => (
                              <td key={col} className="px-3 py-1.5 text-slate-600 dark:text-slate-400">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {latestArtifact.data.rows.length > 20 && (
                      <p className="text-[10px] text-slate-500 px-3 py-1">Showing first 20 of {latestArtifact.data.rows.length} rows</p>
                    )}
                  </div>
                )}
                {latestArtifact.type === 'checklist' && 'items' in latestArtifact.data && (
                  <ul className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
                    {latestArtifact.data.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'}>
                          {item.done ? '☑' : '☐'} {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {latestArtifact.type === 'chart' && 'labels' in latestArtifact.data && (() => {
                  const d = latestArtifact.data as { type: 'bar' | 'line'; title?: string; labels: string[]; datasets: { label: string; values: number[] }[] }
                  const chartData = d.labels.map((name, i) => ({
                    name,
                    ...Object.fromEntries(d.datasets.map((ds) => [ds.label, ds.values[i] ?? 0])),
                  }))
                  const colors = ['#53328A', '#6366f1', '#22c55e', '#f59e0b']
                  return (
                    <div className="px-4 pb-4">
                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          {d.type === 'line' ? (
                            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-slate-600" />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--slate-200)' }} />
                              <Legend />
                              {d.datasets.map((ds, i) => (
                                <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                              ))}
                            </LineChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid var(--slate-200)' }} />
                              <Legend />
                              {d.datasets.map((ds, i) => (
                                <Bar key={ds.label} dataKey={ds.label} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                              ))}
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Key metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Revenue (30d)</span>
                <span className="font-semibold" style={{ color: PAYAID_PURPLE }}>
                  {businessContext?.revenue?.last30Days != null
                    ? formatINR(Number(businessContext.revenue.last30Days))
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pipeline</span>
                <span className="font-semibold" style={{ color: PAYAID_PURPLE }}>
                  {businessContext?.pipeline?.value != null
                    ? formatINR(Number(businessContext.pipeline.value))
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active customers</span>
                <span className="font-semibold">
                  {businessContext?.counts?.contacts ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                <AlertCircle className="w-4 h-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(businessContext?.alerts?.overdueInvoices ?? 0) > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Overdue invoices</span>
                  <span className="font-semibold">{businessContext.alerts.overdueInvoices}</span>
                </div>
              )}
              {(businessContext?.alerts?.pendingTasks ?? 0) > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Pending tasks</span>
                  <span className="font-semibold">{businessContext.alerts.pendingTasks}</span>
                </div>
              )}
              {(!businessContext?.alerts?.overdueInvoices && !businessContext?.alerts?.pendingTasks) && (
                <p className="text-slate-500 text-xs">No alerts</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href={`/crm/${tenantId}/Home`}>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" style={{ borderColor: `${PAYAID_PURPLE}50` }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  CRM dashboard
                </Button>
              </Link>
              <Link href={`/finance/${tenantId}/Invoices`}>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" style={{ borderColor: `${PAYAID_PURPLE}50` }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  View invoices
                </Button>
              </Link>
              <Link href={`/hr/${tenantId}`}>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" style={{ borderColor: `${PAYAID_PURPLE}50` }}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  HR dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
          {conversationsData?.conversations?.length > 0 && (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <History className="w-4 h-4" />
                  Recent conversations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-1">
                    {conversationsData.conversations.map((conv: { id: string; title: string; lastMessageAt: string }) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => loadConversation(conv.id)}
                        className="w-full text-left px-2 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 truncate"
                      >
                        <span className="block truncate font-medium">{conv.title || 'Untitled'}</span>
                        <span className="text-slate-500">{new Date(conv.lastMessageAt).toLocaleDateString('en-IN')}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      {/* On xl breakpoint, show right panel below center when stacked */}
      <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {latestArtifact && (
            <Card className="rounded-2xl border-slate-200 dark:border-slate-700 overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Table2 className="w-4 h-4" style={{ color: PAYAID_PURPLE }} />
                  {latestArtifact.title || 'AI Output'}
                </CardTitle>
                {latestArtifact.type === 'table' && 'columns' in latestArtifact.data && (
                  <Button variant="ghost" size="sm" onClick={() => {
                    const d = latestArtifact!.data as { columns: string[]; rows: Record<string, string | number>[] }
                    const csv = [d.columns.join(','), ...d.rows.map((r) => d.columns.map((c) => String(r[c] ?? '')).join(','))].join('\n')
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `ai-output-${new Date().toISOString().slice(0, 10)}.csv`
                    a.click()
                    URL.revokeObjectURL(a.href)
                  }}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {latestArtifact.type === 'table' && 'columns' in latestArtifact.data && (
                  <div className="overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-slate-50 dark:bg-slate-800/50">
                          {latestArtifact.data.columns.map((c) => (
                            <th key={c} className="text-left px-3 py-2 font-semibold">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {latestArtifact.data.rows.slice(0, 10).map((row, ri) => (
                          <tr key={ri} className="border-b border-slate-100">
                            {latestArtifact!.data.columns.map((col) => (
                              <td key={col} className="px-3 py-1.5">{String(row[col] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {latestArtifact.type === 'checklist' && 'items' in latestArtifact.data && (
                  <ul className="px-4 pb-4 space-y-1 text-sm">
                    {latestArtifact.data.items.slice(0, 8).map((item, i) => (
                      <li key={i}>{item.done ? '☑' : '☐'} {item.label}</li>
                    ))}
                  </ul>
                )}
                {latestArtifact.type === 'chart' && 'labels' in latestArtifact.data && (() => {
                  const d = latestArtifact!.data as { type: 'bar' | 'line'; labels: string[]; datasets: { label: string; values: number[] }[] }
                  const chartData = d.labels.map((name, i) => ({ name, ...Object.fromEntries(d.datasets.map((ds) => [ds.label, ds.values[i] ?? 0])) }))
                  const colors = ['#53328A', '#6366f1']
                  return (
                    <div className="px-4 pb-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        {d.type === 'line' ? (
                          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            {d.datasets.map((ds, i) => (
                              <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 2 }} />
                            ))}
                          </LineChart>
                        ) : (
                          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            {d.datasets.map((ds, i) => (
                              <Bar key={ds.label} dataKey={ds.label} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Key metrics</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Revenue (30d)</span>
                <span className="font-semibold" style={{ color: PAYAID_PURPLE }}>
                  {businessContext?.revenue?.last30Days != null
                    ? formatINR(Number(businessContext.revenue.last30Days))
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pipeline</span>
                <span className="font-semibold" style={{ color: PAYAID_PURPLE }}>
                  {businessContext?.pipeline?.value != null
                    ? formatINR(Number(businessContext.pipeline.value))
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {businessContext?.alerts?.overdueInvoices > 0 && (
                <span className="text-amber-600">Overdue: {businessContext.alerts.overdueInvoices}</span>
              )}
              {businessContext?.alerts?.pendingTasks > 0 && (
                <span className="text-amber-600 ml-2">Tasks: {businessContext.alerts.pendingTasks}</span>
              )}
              {!businessContext?.alerts?.overdueInvoices && !businessContext?.alerts?.pendingTasks && (
                <span className="text-slate-500">No alerts</span>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Link href={`/crm/${tenantId}/Home`} className="text-xs" style={{ color: PAYAID_PURPLE }}>
                CRM dashboard
              </Link>
              <Link href={`/finance/${tenantId}/Invoices`} className="text-xs" style={{ color: PAYAID_PURPLE }}>
                View invoices
              </Link>
              <Link href={`/hr/${tenantId}`} className="text-xs" style={{ color: PAYAID_PURPLE }}>
                HR dashboard
              </Link>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>

      {/* Create / Edit Project dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProjectId ? 'Edit project' : 'New project'}</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Restaurant margins"
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Instructions (optional)</label>
              <Textarea
                value={projectInstructions}
                onChange={(e) => setProjectInstructions(e.target.value)}
                placeholder="e.g. Always consider my restaurant margins and peak hours."
                rows={3}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">The AI will remember this for all chats in this project.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Context notes (optional)</label>
              <Textarea
                value={projectContextNotes}
                onChange={(e) => setProjectContextNotes(e.target.value)}
                placeholder="Paste data, notes, or references the AI should use (e.g. key metrics, targets)."
                rows={3}
                className="rounded-xl resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">Attached to the project and injected into the AI context.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!projectName.trim() || saveProject.isPending}
              onClick={() => saveProject.mutate()}
              style={{ backgroundColor: PAYAID_PURPLE }}
            >
              {saveProject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingProjectId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
