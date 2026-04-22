'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, ArrowRight, Mic, Volume2, Loader2, CheckCircle2 } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { DEFAULT_VOICE_ID, VOICE_OPTIONS } from '@/lib/voice-agent/voice-options'

const PURPOSES = [
  { value: 'collections', label: 'Collections' },
  { value: 'support', label: 'Customer Support' },
  { value: 'sales', label: 'Sales Qualification' },
  { value: 'booking', label: 'Appointment Booking' },
  { value: 'surveys', label: 'Customer Survey' },
] as const

const LANGUAGES = [
  { code: 'hi', label: 'Hindi', preview: 'Namaste' },
  { code: 'en', label: 'English', preview: 'Hello' },
  { code: 'ta', label: 'Tamil', preview: 'Vanakkam' },
  { code: 'te', label: 'Telugu', preview: 'Namaskaram' },
  { code: 'kn', label: 'Kannada', preview: 'Namaskara' },
  { code: 'mr', label: 'Marathi', preview: 'Namaskar' },
]

const DEFAULT_PREVIEW_TEXT = 'Namaste'

const DEFAULT_GREETINGS: Record<string, string> = {
  collections: 'Namaste! PayAid collections team bol raha hun. Aapka payment reminder dena tha. Kya aap ab baat karna chahenge?',
  support: 'Namaste! PayAid support se bol raha hun. Aapki madad karta hun. Kya problem hai bataiye?',
  sales: 'Namaste! PayAid sales team se. Humare naye plans dekh lijiye. Do minute dein to main batata hun?',
  booking: 'Namaste! PayAid se. Aapne appointment book karni thi. Kab aapke liye sahi rahega?',
  surveys: 'Namaste! PayAid se. Aapka feedback lena tha. Do minute dein to 3 sawal pooch lun?',
}

function getToken(token: string | null): string | null {
  if (token) return token
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token') || localStorage.getItem('auth-token') || JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token || null
}

function buildSystemPrompt(
  name: string,
  purpose: string,
  greeting: string,
  objections: { noMoney: string; wrongNumber: string; talkToBoss: string },
  crm: { logActivity: boolean; autoCreateDeal: boolean; whatsappFollowUp: boolean; transferToHuman: boolean }
): string {
  const purposeLabel = PURPOSES.find((p) => p.value === purpose)?.label || purpose
  let prompt = `You are ${name}, a professional ${purposeLabel} agent for PayAid.\n\n`
  prompt += `GREETING: ${greeting}\n\n`
  prompt += `MUST handle objections:\n`
  prompt += `- "No money": ${objections.noMoney}\n`
  prompt += `- "Wrong number": ${objections.wrongNumber}\n`
  prompt += `- "Talk to boss": ${objections.talkToBoss}\n\n`
  prompt += `CRM: Log activity=${crm.logActivity}, Create deal if interested=${crm.autoCreateDeal}, WhatsApp follow-up=${crm.whatsappFollowUp}.\n\n`
  prompt += `Be polite, professional, confirm understanding. Keep responses concise and natural for voice.`
  return prompt
}

export default function CreateVoiceAgentWizardPage() {
  const router = useRouter()
  const params = useParams()
  const { token, isAuthenticated, fetchUser } = useAuthStore()
  const tenantId = params.tenantId as string
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const previewWarmupDoneRef = useRef(false)

  const [basics, setBasics] = useState({
    name: '',
    purpose: 'collections',
    language: 'hi',
    voiceId: DEFAULT_VOICE_ID,
    greeting: DEFAULT_GREETINGS.collections,
  })
  const [objections, setObjections] = useState({
    noMoney: 'Samajhta hun ji. EMI option dekhna chahenge?',
    wrongNumber: 'Maaf kijiye, galti se call. Goodbye.',
    talkToBoss: 'Ji, callback number de dijiye.',
  })
  const [crm, setCrm] = useState({
    logActivity: true,
    autoCreateDeal: true,
    whatsappFollowUp: false,
    transferToHuman: false,
  })
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    setBasics((b) => ({ ...b, greeting: DEFAULT_GREETINGS[b.purpose] || b.greeting }))
  }, [basics.purpose])

  useEffect(() => {
    let mounted = true
    const checkAuth = async () => {
      await new Promise((r) => setTimeout(r, 100))
      const authToken = getToken(token)
      if (!authToken && !isAuthenticated) {
        router.push('/login')
        return
      }
      if (authToken && !token) try { await fetchUser() } catch {}
      if (mounted) setCheckingAuth(false)
    }
    checkAuth()
    return () => { mounted = false }
  }, [token, isAuthenticated, fetchUser, router])

  // Warm route/auth path once so first preview click is snappier.
  useEffect(() => {
    if (checkingAuth || previewWarmupDoneRef.current || typeof window === 'undefined') return
    const authToken = getToken(token)
    if (!authToken) return

    previewWarmupDoneRef.current = true
    const url = new URL('/api/voice/preview', window.location.origin)
    url.searchParams.set('text', DEFAULT_PREVIEW_TEXT)
    url.searchParams.set('lang', 'hi')
    url.searchParams.set('voiceId', DEFAULT_VOICE_ID)

    void fetch(url.toString(), {
      method: 'HEAD',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${authToken}` },
    }).catch(() => {
      // Best-effort optimization only.
    })
  }, [checkingAuth, token])

  const playPreview = async (type: 'language' | 'voice', value?: string) => {
    const authToken = getToken(token)
    if (!authToken) return
    const text = type === 'language'
      ? (LANGUAGES.find((l) => l.code === (value ?? basics.language))?.preview ?? 'Namaste')
      : (basics.name || 'Ravi')
    const lang = type === 'language' ? (value ?? basics.language) : basics.language
    const voiceId = type === 'voice' ? (value ?? basics.voiceId) : basics.voiceId
    setPreviewPlaying(`${type}-${value ?? 'current'}`)
    setPreviewError(null)
    try {
      const url = new URL('/api/voice/preview', window.location.origin)
      url.searchParams.set('text', text)
      url.searchParams.set('lang', lang)
      url.searchParams.set('voiceId', voiceId)
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${authToken}` } })
      if (!res.ok) throw new Error('Voice preview service unavailable')
      const blob = await res.blob()
      const audioUrl = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = audioUrl
        audioRef.current.play()
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setPreviewPlaying(null)
        }
      } else {
        const a = new Audio(audioUrl)
        a.play()
        a.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setPreviewPlaying(null)
        }
      }
    } catch {
      setPreviewError('Voice preview is unavailable right now. Please check TTS service connectivity.')
      setPreviewPlaying(null)
    }
  }

  const handleCreateAndTest = async () => {
    const authToken = getToken(token)
    if (!authToken || !basics.name.trim() || !basics.greeting.trim()) {
      alert('Please fill Agent Name and Greeting in Step 1.')
      return
    }
    setLoading(true)
    try {
      const systemPrompt = buildSystemPrompt(basics.name, basics.purpose, basics.greeting, objections, crm)
      const workflow = {
        purpose: basics.purpose,
        greeting: basics.greeting,
        script: {},
        objections,
        crm,
      }
      const res = await fetch('/api/v1/voice-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: basics.name.trim(),
          description: `${PURPOSES.find((p) => p.value === basics.purpose)?.label || basics.purpose} voice agent`,
          language: basics.language,
          systemPrompt,
          voiceId: basics.voiceId,
          voiceTone: basics.voiceId?.includes('formal') ? 'formal' : basics.voiceId?.includes('warm') ? 'warm' : 'calm',
          workflow,
          phoneNumber: phoneNumber.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || 'Failed to create agent')
      }
      const data = await res.json()
      setCreatedAgentId(data.agent?.id ?? null)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const handleDeployAndFinish = () => {
    router.push(`/voice-agents/${tenantId}/Home`)
  }

  if (checkingAuth) return <PageLoading message="Checking authentication..." fullScreen />

  const progress = (step / 3) * 100

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 dark:bg-slate-800">
        <div
          className="h-full bg-[#7C3AED] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href={`/voice-agents/${tenantId}/Home`}
          className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-[#7C3AED] mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-[#7C3AED]">Step {step} of 3</span>
          <span className="text-slate-500 dark:text-slate-400">
            {step === 1 ? 'Basics' : step === 2 ? 'Behaviour' : 'Deploy'}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          Create Voice Agent
        </h1>

        {/* Step 1: Basics */}
        {step === 1 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Basics</CardTitle>
              <CardDescription>Name, purpose, language and voice. Use preview to hear samples.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Agent Name *</Label>
                <Input
                  value={basics.name}
                  onChange={(e) => setBasics({ ...basics, name: e.target.value })}
                  placeholder="e.g. Ravi - Payment Reminder"
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Purpose *</Label>
                <select
                  value={basics.purpose}
                  onChange={(e) => setBasics({ ...basics, purpose: e.target.value as typeof basics.purpose })}
                  className="flex h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]"
                >
                  {PURPOSES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Language *</Label>
                <div className="flex gap-2">
                  <select
                    value={basics.language}
                    onChange={(e) => setBasics({ ...basics, language: e.target.value })}
                    className="flex h-11 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl shrink-0 border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/10"
                    onClick={() => playPreview('language')}
                    disabled={!!previewPlaying}
                    title="Play preview"
                  >
                    {previewPlaying?.startsWith('language') ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Voice *</Label>
                <div className="flex gap-2">
                  <select
                    value={basics.voiceId}
                    onChange={(e) => setBasics({ ...basics, voiceId: e.target.value })}
                    className="flex h-11 flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:ring-2 focus:ring-[#7C3AED]"
                  >
                    {VOICE_OPTIONS.map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-xl shrink-0 border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/10"
                    onClick={() => playPreview('voice')}
                    disabled={!!previewPlaying}
                    title="Play voice preview"
                  >
                    {previewPlaying?.startsWith('voice') ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {previewError && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {previewError}
                </p>
              )}
              <div className="space-y-2">
                <Label>Greeting Script *</Label>
                <Textarea
                  value={basics.greeting}
                  onChange={(e) => setBasics({ ...basics, greeting: e.target.value })}
                  placeholder="Namaste! PayAid..."
                  rows={4}
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
                >
                  Next: Behaviour
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Behaviour */}
        {step === 2 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Behaviour</CardTitle>
              <CardDescription>Objection handling and CRM actions. Pre-filled with best practices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Objection Handling</Label>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">&quot;No money right now&quot;</Label>
                  <Textarea
                    value={objections.noMoney}
                    onChange={(e) => setObjections({ ...objections, noMoney: e.target.value })}
                    rows={2}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">&quot;Wrong number&quot;</Label>
                  <Textarea
                    value={objections.wrongNumber}
                    onChange={(e) => setObjections({ ...objections, wrongNumber: e.target.value })}
                    rows={2}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500">&quot;Talk to boss&quot;</Label>
                  <Textarea
                    value={objections.talkToBoss}
                    onChange={(e) => setObjections({ ...objections, talkToBoss: e.target.value })}
                    rows={2}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold">CRM Actions</Label>
                <div className="space-y-2">
                  {[
                    { key: 'logActivity' as const, label: 'Auto-log call in contact timeline' },
                    { key: 'autoCreateDeal' as const, label: 'Create deal if "interested"' },
                    { key: 'whatsappFollowUp' as const, label: 'WhatsApp follow-up if no answer' },
                    { key: 'transferToHuman' as const, label: 'Transfer to human (add number)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={crm[key]}
                        onChange={(e) => setCrm({ ...crm, [key]: e.target.checked })}
                        className="rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED]"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-semibold">Knowledge Base</Label>
                <p className="text-xs text-slate-500">Upload PDF/DOC for FAQ or script (coming soon).</p>
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-6 text-center text-sm text-slate-500">
                  [Upload PDF/DOC] — Coming soon
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl"
                >
                  Next: Deploy
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Deploy */}
        {step === 3 && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Deploy</CardTitle>
              <CardDescription>Test your agent first, then assign a number and go live.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!createdAgentId ? (
                <>
                  <div className="rounded-2xl border-2 border-[#7C3AED]/30 bg-[#7C3AED]/5 p-6 text-center">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                      Test your agent before deploying
                    </p>
                    <Button
                      onClick={handleCreateAndTest}
                      disabled={loading}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] rounded-full h-16 px-8 text-lg gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                      {loading ? 'Creating...' : `Test ${basics.name || 'Agent'} Now`}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Number (optional)</Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91-XXXX or Twilio/BSNL"
                      className="rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6 flex items-center gap-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                        {basics.name || 'Agent'} created!
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        Test now or assign a number and go live.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/voice-agents/${tenantId}/Demo?agentId=${createdAgentId}`}
                    className="block"
                  >
                    <Button className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl h-12 gap-2" size="lg">
                      <Mic className="h-5 w-5" />
                      Test {basics.name || 'Agent'} Now
                    </Button>
                  </Link>
                  <div className="space-y-2">
                    <Label>Assign Number (optional)</Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91-XXXX or Twilio/BSNL"
                      className="rounded-xl border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <Button
                    onClick={handleDeployAndFinish}
                    className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                  >
                    Done — Go to Voice Agents
                  </Button>
                </>
              )}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                {createdAgentId && (
                  <Link href={`/voice-agents/${tenantId}/Home`}>
                    <Button variant="outline" className="rounded-xl">View all agents</Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  )
}
