'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, PlayCircle, Save, ShieldCheck, Send, Volume2 } from 'lucide-react'
import { parseVoiceBehaviorFromWorkflow } from '@/lib/voice-agent/voice-behavior-config'
import { VoiceBehaviorPreview } from '@/components/voice-agent/VoiceBehaviorPreview'

export interface BrowserDemoV1Props {
  agentId: string
  tenantId: string
  token: string
  /** Loaded from GET agent — used for tone/pace/verbosity preview only (no runtime merge). */
  agentWorkflow?: unknown
}

type PackState = {
  draftJson: unknown
  approvedJson: unknown | null
  version: number
  publishedTrainingPackVersion: number | null
  approvedAt?: string | null
  lastPublishedAt?: string | null
}

type TranscriptTurn = { role: 'user' | 'assistant'; content: string; timestamp: string }

function formatHintDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
})

export function BrowserDemoV1({ agentId, tenantId, token, agentWorkflow }: BrowserDemoV1Props) {
  const voiceBehavior = parseVoiceBehaviorFromWorkflow(agentWorkflow)
  const [pack, setPack] = useState<PackState | null>(null)
  const [draftText, setDraftText] = useState('{}')
  const [packLoading, setPackLoading] = useState(true)
  const [packError, setPackError] = useState<string | null>(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [approveBusy, setApproveBusy] = useState(false)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionBusy, setSessionBusy] = useState(false)
  const [turnMessage, setTurnMessage] = useState('')
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([])
  const [turnBusy, setTurnBusy] = useState(false)

  const [qaTurnIndex, setQaTurnIndex] = useState(0)
  const [qaTags, setQaTags] = useState('tone,accurate')
  const [checkGreeting, setCheckGreeting] = useState(false)
  const [checkCompliance, setCheckCompliance] = useState(false)
  const [checkEscalation, setCheckEscalation] = useState(false)
  const [qaBusy, setQaBusy] = useState(false)

  const [publishBusy, setPublishBusy] = useState(false)
  const [publishNote, setPublishNote] = useState<string | null>(null)

  const [previewBusy, setPreviewBusy] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const base = `/api/v1/voice-agents/${agentId}`

  const loadPack = useCallback(async () => {
    setPackLoading(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/training-pack`, { headers: authHeaders(token) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      const data = (await res.json()) as PackState
      setPack(data)
      setDraftText(JSON.stringify(data.draftJson ?? {}, null, 2))
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Failed to load training pack')
    } finally {
      setPackLoading(false)
    }
  }, [agentId, token, base])

  useEffect(() => {
    void loadPack()
  }, [loadPack])

  const saveDraft = async () => {
    let parsed: unknown
    try {
      parsed = JSON.parse(draftText || '{}')
    } catch {
      setPackError('Draft must be valid JSON')
      return
    }
    setSaveBusy(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/training-pack`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify({ draftJson: parsed }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      await loadPack()
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaveBusy(false)
    }
  }

  const approvePack = async () => {
    setApproveBusy(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/training-pack/approve`, {
        method: 'POST',
        headers: authHeaders(token),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      await loadPack()
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setApproveBusy(false)
    }
  }

  const startSession = async () => {
    setSessionBusy(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/demo/sessions`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      const data = (await res.json()) as { sessionId: string }
      setSessionId(data.sessionId)
      setTranscript([])
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Session start failed')
    } finally {
      setSessionBusy(false)
    }
  }

  const sendTurn = async () => {
    if (!sessionId || !turnMessage.trim()) return
    setTurnBusy(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/demo/sessions/${sessionId}/turn`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ message: turnMessage.trim() }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      const data = (await res.json()) as { transcript: TranscriptTurn[] }
      setTranscript(data.transcript)
      setTurnMessage('')
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Turn failed')
    } finally {
      setTurnBusy(false)
    }
  }

  const saveQa = async () => {
    if (!sessionId) {
      setPackError('Start a demo session first')
      return
    }
    setQaBusy(true)
    setPackError(null)
    try {
      const tags = qaTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await fetch(`${base}/demo/sessions/${sessionId}/qa`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({
          qaFlags: [{ turnIndex: qaTurnIndex, tags, note: 'demo-console' }],
          qaChecklist: [
            { intentId: 'greeting', passed: checkGreeting },
            { intentId: 'compliance', passed: checkCompliance },
            { intentId: 'escalation_path', passed: checkEscalation },
          ],
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'QA save failed')
    } finally {
      setQaBusy(false)
    }
  }

  const publish = async () => {
    setPublishBusy(true)
    setPublishNote(null)
    setPackError(null)
    try {
      const res = await fetch(`${base}/publish`, {
        method: 'POST',
        headers: authHeaders(token),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((j as { error?: string; detail?: string }).error || (j as { detail?: string }).detail || res.statusText)
      }
      setPublishNote(`Published v${(j as { publishedTrainingPackVersion?: number }).publishedTrainingPackVersion}`)
      await loadPack()
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setPublishBusy(false)
    }
  }

  const playPreview = async (useGreeting: boolean) => {
    setPreviewBusy(true)
    setPackError(null)
    try {
      const res = await fetch(`${base}/preview-tts`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(useGreeting ? { useGreeting: true } : { text: 'Short preview line for this agent.' }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || res.statusText)
      }
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('audio')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        if (!audioRef.current) audioRef.current = new Audio()
        audioRef.current.pause()
        audioRef.current.src = url
        await audioRef.current.play().catch(() => {
          setPackError('Could not play audio in this browser')
        })
        return
      }
      /* text fallback */
      await res.json().catch(() => ({}))
    } catch (e) {
      setPackError(e instanceof Error ? e.message : 'Preview failed')
    } finally {
      setPreviewBusy(false)
    }
  }

  return (
    <Card className="border-blue-200/60 dark:border-blue-900/40">
      <CardHeader className="pb-2 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Browser demo (v1)</CardTitle>
            <CardDescription>
              HTTP/text training pack, session turns, QA, and publish — same merged prompt intent as Bolna (within v1).
              Workspace <code className="text-xs">{tenantId}</code>
            </CardDescription>
          </div>
          {pack ? (
            <div className="flex flex-wrap gap-1 shrink-0">
              <Badge variant="outline">pack v{pack.version}</Badge>
              {pack.publishedTrainingPackVersion != null ? (
                <Badge variant="secondary" title="Synced to phone/Bolna when telephony is live">
                  synced v{pack.publishedTrainingPackVersion}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
        {pack && !packLoading && (
          <div className="w-full rounded-md border bg-muted/25 p-3 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Training state</p>
            <p>
              <span className="text-foreground">Draft:</span> editable below (save to persist).
            </p>
            <p>
              <span className="text-foreground">Approved:</span>{' '}
              {pack.version >= 1 ? `snapshot v${pack.version}` : 'none yet — approve after editing'}
              {pack.approvedAt ? ` · ${formatHintDate(typeof pack.approvedAt === 'string' ? pack.approvedAt : String(pack.approvedAt))}` : ''}
            </p>
            <p>
              <span className="text-foreground">Published:</span>{' '}
              {pack.publishedTrainingPackVersion != null
                ? `v${pack.publishedTrainingPackVersion} (phone/Bolna sync — optional for browser demo)`
                : 'not published to phone'}
              {pack.lastPublishedAt ? ` · last published ${formatHintDate(pack.lastPublishedAt)}` : ''}
            </p>
            {pack.version >= 1 &&
              pack.publishedTrainingPackVersion != null &&
              pack.publishedTrainingPackVersion !== pack.version && (
                <p className="text-amber-700 dark:text-amber-300">
                  Newer approved snapshot (v{pack.version}) than published (v{pack.publishedTrainingPackVersion}).
                  Publish to update phone/Bolna when telephony is enabled.
                </p>
              )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <VoiceBehaviorPreview behavior={voiceBehavior} variant="demo" />

        {packError && (
          <p className="text-sm text-destructive" role="alert">
            {packError}
          </p>
        )}
        {publishNote && <p className="text-sm text-green-600 dark:text-green-400">{publishNote}</p>}

        <div className="rounded-md border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Quick test (in order)</p>
          <ol className="list-decimal pl-4 space-y-0.5">
            <li>Optional: edit training JSON → <strong>Save draft</strong> → <strong>Approve snapshot</strong></li>
            <li>
              <strong>Start session</strong> (required before sending messages)
            </li>
            <li>Type a message → press Enter or the send button</li>
            <li>
              <strong>Publish</strong> stays off until you approve a snapshot (optional for browser demo)
            </li>
          </ol>
        </div>

        {/* Training */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Training pack</h3>
          {packLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : (
            <>
              <Textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} className="font-mono text-xs min-h-[140px]" />
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={saveBusy} onClick={() => void saveDraft()}>
                  {saveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Save draft
                </Button>
                <Button type="button" size="sm" disabled={approveBusy} onClick={() => void approvePack()}>
                  {approveBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
                  Approve snapshot
                </Button>
              </div>
            </>
          )}
        </div>

        {/* TTS preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Preview voice (short)
          </h3>
          <p className="text-xs text-muted-foreground">
            Short browser clip only — not a phone call. Audio may differ from live telephony.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={previewBusy} onClick={() => void playPreview(true)}>
              {previewBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-1" />}
              Greeting
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={previewBusy} onClick={() => void playPreview(false)}>
              Sample line
            </Button>
          </div>
        </div>

        {/* Session */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Demo session</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <Button type="button" size="sm" disabled={sessionBusy} onClick={() => void startSession()}>
              {sessionBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Start session
            </Button>
            {sessionId && (
              <span className="text-xs text-muted-foreground font-mono">
                id: {sessionId}
              </span>
            )}
          </div>
          {!sessionId && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Message send is disabled until you click <strong>Start session</strong>.
            </p>
          )}
          <div className="flex gap-2">
            <Input
              placeholder="User message…"
              value={turnMessage}
              onChange={(e) => setTurnMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void sendTurn()
              }}
            />
            <Button
              type="button"
              disabled={!sessionId || turnBusy || !turnMessage.trim()}
              title={!sessionId ? 'Click Start session first' : !turnMessage.trim() ? 'Type a message' : 'Send message'}
              onClick={() => void sendTurn()}
            >
              {turnBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="rounded-md border bg-muted/30 p-3 max-h-48 overflow-y-auto text-sm space-y-1">
            {transcript.length === 0 ? (
              <p className="text-muted-foreground text-xs">No turns yet.</p>
            ) : (
              transcript.map((t, i) => (
                <div key={`${t.timestamp}-${i}`} className={t.role === 'user' ? 'text-blue-700 dark:text-blue-300' : ''}>
                  <strong>{t.role}:</strong> {t.content}
                </div>
              ))
            )}
          </div>
        </div>

        {/* QA */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">QA</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">Turn index</label>
              <Input type="number" min={0} value={qaTurnIndex} onChange={(e) => setQaTurnIndex(parseInt(e.target.value, 10) || 0)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tags (comma)</label>
              <Input value={qaTags} onChange={(e) => setQaTags(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={checkGreeting} onChange={(e) => setCheckGreeting(e.target.checked)} />
              Greeting ok
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={checkCompliance} onChange={(e) => setCheckCompliance(e.target.checked)} />
              Compliance ok
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={checkEscalation} onChange={(e) => setCheckEscalation(e.target.checked)} />
              Escalation ok
            </label>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={qaBusy || !sessionId}
            title={!sessionId ? 'Start a demo session first' : 'Save QA tags for this session'}
            onClick={() => void saveQa()}
          >
            {qaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save QA
          </Button>
        </div>

        {/* Publish */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Publish</h3>
          <p className="text-xs text-muted-foreground">
            Optional for browser demo. Requires approved pack (v ≥ 1). When telephony is live, publish syncs phone/Bolna.
          </p>
          <Button
            type="button"
            disabled={publishBusy || !(pack && pack.version >= 1)}
            title={
              pack && pack.version >= 1
                ? 'Publish approved training to phone/Bolna (optional for browser demo)'
                : 'Approve a training snapshot first (version must be ≥ 1)'
            }
            onClick={() => void publish()}
          >
            {publishBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish training version
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
