// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, ExternalLink, Headphones } from 'lucide-react'
import { DEFAULT_VOICE_ID, isKnownVoiceId, VOICE_OPTIONS } from '@/lib/voice-agent/voice-options'

const PURPOSES = [
  { value: 'collections', label: 'Collections' },
  { value: 'support', label: 'Support' },
  { value: 'sales', label: 'Sales' },
  { value: 'surveys', label: 'Surveys' },
]

const CONVERSATION_STYLES = [
  { value: 'casual', label: 'Casual (everyday, friendly)' },
  { value: 'neutral', label: 'Neutral (clear, balanced)' },
  { value: 'professional', label: 'Professional (business-friendly)' },
] as const

type WorkflowTab = {
  purpose?: string
  greeting?: string
  conversationStyle?: string
  script?: Record<string, string>
  objections?: { noMoney?: string; wrongNumber?: string; talkToBoss?: string }
  crm?: { autoCreateDeal?: boolean; logActivity?: boolean; whatsappFollowUp?: boolean }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth-token') || JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
}

function buildSystemPrompt(
  name: string,
  purpose: string,
  greeting: string,
  conversationStyle: string,
  script: Record<string, string>,
  objections: { noMoney: string; wrongNumber: string; talkToBoss: string }
): string {
  const purposeLabel = PURPOSES.find((p) => p.value === purpose)?.label || purpose
  let prompt = `You are ${name}, a professional ${purposeLabel} agent for PayAid.\n\n`
  prompt += `Greeting / opening: ${greeting}\n\n`
  prompt += `MUST handle objections:\n`
  if (objections.noMoney?.trim()) prompt += `- "No money": ${objections.noMoney}\n`
  if (objections.wrongNumber?.trim()) prompt += `- "Wrong number": ${objections.wrongNumber}\n`
  if (objections.talkToBoss?.trim()) prompt += `- "Talk to boss": ${objections.talkToBoss}\n`
  prompt += `\nConversation style: ${conversationStyle}.`
  prompt += `\nKeep responses concise and natural for voice. Be polite and professional.`
  const scriptKeys = Object.keys(script || {}).filter((k) => (script as Record<string, string>)[k]?.trim())
  if (scriptKeys.length) {
    prompt += `\n\nScript responses:\n`
    scriptKeys.forEach((k) => (prompt += `- ${k}: ${(script as Record<string, string>)[k]}\n`))
  }
  return prompt
}

export default function VoiceAgentStudioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const tenantId = params.tenantId as string
  const agentIdFromUrl = searchParams.get('agentId')
  const [agents, setAgents] = useState<{ id: string; name: string; language: string; voiceId: string | null; voiceTone: string | null; systemPrompt: string; workflow: unknown }[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(agentIdFromUrl)
  const [activeTab, setActiveTab] = useState('basics')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [basics, setBasics] = useState({
    name: '',
    purpose: 'collections',
    language: 'hi',
    voiceId: DEFAULT_VOICE_ID,
    voiceTone: 'formal',
    conversationStyle: 'neutral',
    greeting: '',
    phoneNumber: '',
  })
  const [script, setScript] = useState<Record<string, string>>({
    invoice: '',
    support: '',
    sales: '',
  })
  const [objections, setObjections] = useState({
    noMoney: '',
    wrongNumber: '',
    talkToBoss: '',
  })
  const [crm, setCrm] = useState({
    autoCreateDeal: false,
    logActivity: true,
    whatsappFollowUp: false,
  })

  useEffect(() => {
    const token = getToken()
    if (!token) return
    const url = new URL('/api/v1/voice-agents', window.location.origin)
    url.searchParams.set('tenantId', tenantId)
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = data?.agents ?? data ?? []
        setAgents(Array.isArray(list) ? list : [])
        const firstId = list?.length ? list[0].id : null
        if (agentIdFromUrl && list?.some((a: { id: string }) => a.id === agentIdFromUrl)) {
          setSelectedAgentId(agentIdFromUrl)
        } else if (firstId && !selectedAgentId) {
          setSelectedAgentId(firstId)
        }
      })
      .catch(() => setAgents([]))
      .finally(() => setLoading(false))
  }, [tenantId, agentIdFromUrl])

  useEffect(() => {
    if (!selectedAgentId) return
    const agent = agents.find((a) => a.id === selectedAgentId)
    if (!agent) return
    const w = agent.workflow as WorkflowTab | null | undefined
    const hasTabWorkflow = w && typeof w === 'object' && ('purpose' in w || 'greeting' in w)
    setBasics((prev) => ({
      ...prev,
      name: agent.name,
      language: agent.language || 'hi',
      voiceId: agent.voiceId || 'arjun-formal',
      voiceTone: agent.voiceTone || 'formal',
      conversationStyle: (hasTabWorkflow && w?.conversationStyle) ? w.conversationStyle : prev.conversationStyle,
      purpose: (hasTabWorkflow && w?.purpose) ? w.purpose : prev.purpose,
      greeting: (hasTabWorkflow && w?.greeting) ? w.greeting : (agent.systemPrompt?.match(/Greeting \/ opening:\s*([^\n]+)/)?.[1]?.trim() || prev.greeting),
      phoneNumber: (agent as { phoneNumber?: string }).phoneNumber ?? '',
    }))
    if (w?.script && typeof w.script === 'object') setScript((prev) => ({ ...prev, ...w.script }))
    if (w?.objections && typeof w.objections === 'object') {
      const o = w.objections as { noMoney?: string; wrongNumber?: string; talkToBoss?: string }
      setObjections({
        noMoney: o.noMoney ?? '',
        wrongNumber: o.wrongNumber ?? '',
        talkToBoss: o.talkToBoss ?? '',
      })
    }
    if (w?.crm && typeof w.crm === 'object') {
      const c = w.crm as { autoCreateDeal?: boolean; logActivity?: boolean; whatsappFollowUp?: boolean }
      setCrm({
        autoCreateDeal: c.autoCreateDeal ?? false,
        logActivity: c.logActivity ?? true,
        whatsappFollowUp: c.whatsappFollowUp ?? false,
      })
    }
  }, [selectedAgentId, agents])

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)

  const handleSave = async () => {
    if (!selectedAgentId) return
    const token = getToken()
    if (!token) return
    setSaving(true)
    try {
      const systemPrompt = buildSystemPrompt(
        basics.name,
        basics.purpose,
        basics.greeting,
        basics.conversationStyle,
        script,
        objections
      )
      const workflow: WorkflowTab = {
        purpose: basics.purpose,
        greeting: basics.greeting,
        conversationStyle: basics.conversationStyle,
        script,
        objections,
        crm,
      }
      const res = await fetch(`/api/v1/voice-agents/${selectedAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: basics.name,
          description: `${PURPOSES.find((p) => p.value === basics.purpose)?.label || basics.purpose} voice agent`,
          language: basics.language,
          voiceId: basics.voiceId || null,
          voiceTone: basics.voiceTone || null,
          phoneNumber: basics.phoneNumber?.trim() || null,
          systemPrompt,
          workflow,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAgents((prev) => prev.map((a) => (a.id === selectedAgentId ? { ...a, ...updated } : a)))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || err.message || 'Failed to save')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Agent Studio</h1>
        </div>
        <Select value={selectedAgentId ?? ''} onValueChange={(v) => setSelectedAgentId(v || null)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No agents yet. Create one first.</p>
            <Link href={`/voice-agents/${tenantId}/create`}>
              <Button>Create Agent</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Edit agent: {selectedAgent?.name ?? '—'}</CardTitle>
            <CardDescription>Tab 1: Basics · Tab 2: Script · Tab 3: CRM. Save to apply.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics">1. Basics</TabsTrigger>
                <TabsTrigger value="script">2. Script</TabsTrigger>
                <TabsTrigger value="crm">3. CRM</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Agent Name</Label>
                  <Input
                    value={basics.name}
                    onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                    placeholder="e.g. Ravi - Payment Reminder"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <select
                    value={basics.purpose}
                    onChange={(e) => setBasics({ ...basics, purpose: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select
                    value={basics.language}
                    onChange={(e) => setBasics({ ...basics, language: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="hi">Hindi</option>
                    <option value="en">English</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Voice</Label>
                  <select
                    value={basics.voiceId}
                    onChange={(e) => setBasics({ ...basics, voiceId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {VOICE_OPTIONS.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.label}
                      </option>
                    ))}
                    {!isKnownVoiceId(basics.voiceId) && (
                      <option value={basics.voiceId}>
                        {basics.voiceId} (Custom)
                      </option>
                    )}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Speaker names match real backend voices.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Greeting Script</Label>
                  <Textarea
                    value={basics.greeting}
                    onChange={(e) => setBasics({ ...basics, greeting: e.target.value })}
                    placeholder="Namaste! PayAid se..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Conversation Style</Label>
                  <select
                    value={basics.conversationStyle}
                    onChange={(e) => setBasics({ ...basics, conversationStyle: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CONVERSATION_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Twilio number (E.164)</Label>
                  <Input
                    value={basics.phoneNumber}
                    onChange={(e) => setBasics({ ...basics, phoneNumber: e.target.value })}
                    placeholder="+919876543210"
                  />
                  <p className="text-xs text-muted-foreground">Assign this number in Twilio and set voice webhook to this app’s /api/v1/voice-agents/twilio/webhook</p>
                </div>
              </TabsContent>

              <TabsContent value="script" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Responses per intent.</p>
                {['invoice', 'support', 'sales'].map((key) => (
                  <div key={key} className="space-y-2">
                    <Label>{key}</Label>
                    <Textarea
                      value={script[key] ?? ''}
                      onChange={(e) => setScript({ ...script, [key]: e.target.value })}
                      placeholder={`Response for ${key}`}
                      rows={2}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="crm" className="space-y-4 pt-4">
                <p className="text-sm font-medium">Objection handling</p>
                <div className="space-y-2">
                  <Label>No money</Label>
                  <Input
                    value={objections.noMoney}
                    onChange={(e) => setObjections({ ...objections, noMoney: e.target.value })}
                    placeholder="Offer EMI..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wrong number</Label>
                  <Input
                    value={objections.wrongNumber}
                    onChange={(e) => setObjections({ ...objections, wrongNumber: e.target.value })}
                    placeholder="Apologise and end..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Talk to boss</Label>
                  <Input
                    value={objections.talkToBoss}
                    onChange={(e) => setObjections({ ...objections, talkToBoss: e.target.value })}
                    placeholder="Take callback number..."
                  />
                </div>
                <p className="text-sm font-medium pt-2">CRM integration</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crm.autoCreateDeal}
                      onChange={(e) => setCrm({ ...crm, autoCreateDeal: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Auto-create deal if interested</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crm.logActivity}
                      onChange={(e) => setCrm({ ...crm, logActivity: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Log activity in contact timeline</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={crm.whatsappFollowUp}
                      onChange={(e) => setCrm({ ...crm, whatsappFollowUp: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">WhatsApp follow-up if no answer</span>
                  </label>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap items-center gap-4 pt-6 border-t mt-6">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Deploy Agent'}
              </Button>
              {selectedAgentId && (
                <Link href={`/voice-agents/${tenantId}/Demo?agentId=${selectedAgentId}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Headphones className="h-4 w-4" />
                    Test Demo
                  </Button>
                </Link>
              )}
              {selectedAgent?.phoneNumber ? (
                <span className="text-sm text-muted-foreground">Number: {selectedAgent.phoneNumber}</span>
              ) : (
                <Link href={`/voice-agents/${tenantId}/Home`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Assign number (Settings)
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
