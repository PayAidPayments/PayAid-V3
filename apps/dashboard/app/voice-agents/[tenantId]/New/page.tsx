'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageLoading } from '@/components/ui/loading'
import { DEFAULT_VOICE_ID, VOICE_OPTIONS } from '@/lib/voice-agent/voice-options'

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

const FALLBACK_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'mr', label: 'Marathi' },
]
const FALLBACK_SPEAKERS = VOICE_OPTIONS

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
  if (objections.noMoney.trim()) prompt += `- "No money": ${objections.noMoney}\n`
  if (objections.wrongNumber.trim()) prompt += `- "Wrong number": ${objections.wrongNumber}\n`
  if (objections.talkToBoss.trim()) prompt += `- "Talk to boss": ${objections.talkToBoss}\n`
  prompt += `\nConversation style: ${conversationStyle}.`
  prompt += `\nKeep responses concise and natural for voice. Be polite and professional.`
  const scriptKeys = Object.keys(script).filter((k) => script[k]?.trim())
  if (scriptKeys.length) {
    prompt += `\n\nScript responses:\n`
    scriptKeys.forEach((k) => (prompt += `- ${k}: ${script[k]}\n`))
  }
  return prompt
}

export default function NewVoiceAgentPage() {
  const router = useRouter()
  const params = useParams()
  const { token, isAuthenticated, fetchUser } = useAuthStore()
  const tenantId = params.tenantId as string
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState('basics')
  const [ttsOptions, setTtsOptions] = useState<{
    languages: { code: string; label: string }[]
    speakers: { id: string; label: string }[]
  }>({ languages: FALLBACK_LANGUAGES, speakers: FALLBACK_SPEAKERS })

  const [basics, setBasics] = useState({
    name: '',
    purpose: 'collections',
    language: 'hi',
    voiceId: DEFAULT_VOICE_ID,
    voiceTone: 'formal',
    conversationStyle: 'neutral',
    greeting: 'Namaste! PayAid se bol raha hun. Aapko payment reminder dena tha. Kya aap ab baat karna chahenge?',
  })
  const [script, setScript] = useState<Record<string, string>>({
    invoice: 'Aapka invoice amount ₹X due hai. Kripya jald payment karein.',
    support: 'Main aapki madad karta hun. Kya problem hai bataiye.',
    sales: 'Humare naye plans dekh lijiye. Kya aap interest rakhoge?',
  })
  const [objections, setObjections] = useState({
    noMoney: 'Samajhta hun. Kya EMI option dekhna chahenge?',
    wrongNumber: 'Maaf kijiye galti se call aayi. Aapka number save nahi karenge.',
    talkToBoss: 'Theek hai ji. Callback number de dijiye?',
  })
  const [crm, setCrm] = useState({
    autoCreateDeal: true,
    logActivity: true,
    whatsappFollowUp: false,
  })

  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      await new Promise((r) => setTimeout(r, 100))
      let authToken = token
      if (!authToken && typeof window !== 'undefined') {
        authToken = localStorage.getItem('token') || localStorage.getItem('auth-token')
        try {
          const s = localStorage.getItem('auth-storage')
          if (s) authToken = JSON.parse(s)?.state?.token || authToken
        } catch {}
      }
      if (authToken && !token) try { await fetchUser() } catch {}
      if (!authToken && !isAuthenticated) {
        router.push('/login')
        return
      }
      if (mounted) setCheckingAuth(false)
    }
    checkAuth()
    return () => { mounted = false }
  }, [token, isAuthenticated, fetchUser, router])

  useEffect(() => {
    let authToken = token
    if (!authToken && typeof window !== 'undefined') {
      authToken = localStorage.getItem('token') || localStorage.getItem('auth-token')
      try {
        const s = localStorage.getItem('auth-storage')
        if (s) authToken = JSON.parse(s)?.state?.token || authToken
      } catch {}
    }
    if (!authToken) return
    fetch('/api/voice/tts', { method: 'GET', headers: { Authorization: `Bearer ${authToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.languages?.length)
          setTtsOptions((prev) => ({
            ...prev,
            languages: data.languages.map((l: { code: string; label: string }) => ({ code: l.code, label: l.label })),
            speakers: data.speakers?.length ? data.speakers.map((s: { id: string; label: string }) => ({ id: s.id, label: s.label })) : prev.speakers,
          }))
      })
      .catch(() => {})
  }, [token])

  const getToken = () => {
    let t = token
    if (!t && typeof window !== 'undefined') {
      t = localStorage.getItem('token') || localStorage.getItem('auth-token')
      try {
        const s = localStorage.getItem('auth-storage')
        if (s) t = JSON.parse(s)?.state?.token || t
      } catch {}
    }
    return t
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const authToken = getToken()
    if (!authToken) {
      router.push('/login')
      return
    }
    if (!basics.name.trim()) {
      alert('Please enter an agent name')
      return
    }
    if (!basics.greeting.trim()) {
      alert('Please enter a greeting script')
      return
    }
    setLoading(true)
    try {
      const systemPrompt = buildSystemPrompt(
        basics.name,
        basics.purpose,
        basics.greeting,
        basics.conversationStyle,
        script,
        objections
      )
      const workflow = {
        purpose: basics.purpose,
        greeting: basics.greeting,
        conversationStyle: basics.conversationStyle,
        script,
        objections,
        crm,
      }
      const response = await fetch('/api/v1/voice-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: basics.name.trim(),
          description: `${PURPOSES.find((p) => p.value === basics.purpose)?.label || basics.purpose} voice agent`,
          language: basics.language,
          systemPrompt,
          voiceId: basics.voiceId || null,
          voiceTone: basics.voiceTone || null,
          workflow,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        router.push(`/voice-agents/${tenantId}/Demo?agentId=${data.agent?.id}`)
      } else {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        const err = await response.json().catch(() => ({}))
        alert(err.message || err.error || 'Failed to create agent')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) return <PageLoading message="Checking authentication..." fullScreen />

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href={`/voice-agents/${tenantId}/Home`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Create Voice Agent</CardTitle>
          <CardDescription>3-step wizard: Basics → Script → CRM. Then deploy or test demo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics">1. Basics</TabsTrigger>
                <TabsTrigger value="script">2. Script</TabsTrigger>
                <TabsTrigger value="crm">3. CRM & Deploy</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Agent Name *</Label>
                  <Input
                    value={basics.name}
                    onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                    placeholder="e.g. Ravi - Payment Reminder"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Purpose *</Label>
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
                  <Label>Language *</Label>
                  <select
                    value={basics.language}
                    onChange={(e) => setBasics({ ...basics, language: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ttsOptions.languages.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Voice *</Label>
                  <select
                    value={basics.voiceId}
                    onChange={(e) => setBasics({ ...basics, voiceId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ttsOptions.speakers.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Conversation Style *</Label>
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
                  <Label>Greeting Script *</Label>
                  <Textarea
                    value={basics.greeting}
                    onChange={(e) => setBasics({ ...basics, greeting: e.target.value })}
                    placeholder="Namaste! PayAid payment reminder..."
                    rows={4}
                    required
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => setActiveTab('script')}>
                  Next: Script
                </Button>
              </TabsContent>

              <TabsContent value="script" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Responses per intent (used in system prompt).</p>
                {['invoice', 'support', 'sales'].map((key) => (
                  <div key={key} className="space-y-2">
                    <Label>{key}</Label>
                    <Textarea
                      value={script[key] ?? ''}
                      onChange={(e) => setScript({ ...script, [key]: e.target.value })}
                      placeholder={`Response for ${key} intent`}
                      rows={2}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setActiveTab('crm')}>
                  Next: CRM & Deploy
                </Button>
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

            <div className="flex gap-4 pt-6 border-t mt-6">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Deploy Agent'}
              </Button>
              <Link href={`/voice-agents/${tenantId}/Home`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
