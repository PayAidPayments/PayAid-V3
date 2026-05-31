'use client'
// @ts-nocheck — Web Speech API types vary by browser

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mic, MicOff, Radio, Square } from 'lucide-react'
import { AudioPlaybackQueue } from '@/lib/voice-agent/browser-live/audio-playback-queue'
import { LiveLatencyRecorder } from '@/lib/voice-agent/browser-live/latency-recorder'
import { BrowserLiveSessionStateMachine } from '@/lib/voice-agent/browser-live/session-state-machine'
import type { BrowserLiveSessionPhase } from '@/lib/voice-agent/browser-live/protocol'
import { resolveLiveWsUrl } from '@/lib/voice-agent/browser-live/live-voice-transport'
import { WssLiveVoiceTransport } from '@/lib/voice-agent/browser-live/wss-live-voice-transport'

export type BrowserLiveVoiceDemoProps = {
  agentId: string
  tenantId: string
  token: string
  agentName: string
}

type TranscriptLine = { role: 'user' | 'assistant' | 'system'; content: string; at: string }

function newTurnId() {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getSpeechRecognition(): SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  const W = window as Window & {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
  const K = W.SpeechRecognition || W.webkitSpeechRecognition
  return K ? new K() : null
}

const PHASE_LABEL: Record<BrowserLiveSessionPhase, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  listening: 'Listening',
  thinking: 'Thinking…',
  speaking: 'Speaking',
  error: 'Error',
}

export function BrowserLiveVoiceDemo({
  agentId,
  tenantId,
  token,
  agentName,
}: BrowserLiveVoiceDemoProps) {
  const [phase, setPhase] = useState<BrowserLiveSessionPhase>('idle')
  const [live, setLive] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [stubMode, setStubMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [interim, setInterim] = useState('')

  const transportRef = useRef<WssLiveVoiceTransport | null>(null)
  const smRef = useRef(new BrowserLiveSessionStateMachine({ onPhaseChange: (p) => setPhase(p) }))
  const audioRef = useRef(new AudioPlaybackQueue())
  const latencyRef = useRef(new LiveLatencyRecorder())
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const liveRef = useRef(false)
  const pendingUtteranceRef = useRef('')
  const utteranceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interruptSentRef = useRef(false)

  const pushLine = useCallback((role: TranscriptLine['role'], content: string) => {
    setLines((prev) => [...prev, { role, content, at: new Date().toLocaleTimeString() }])
  }, [])

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
  }, [])

  const startRecognition = useCallback(() => {
    const Rec = getSpeechRecognition()
    if (!Rec) {
      setError('Speech recognition not supported. Use Chrome/Edge on desktop.')
      return
    }
    const rec = Rec
    recognitionRef.current = rec
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-IN'

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interimLocal = ''
      let finalText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interimLocal += r[0].transcript
      }
      setInterim(interimLocal)

      const currentPhase = smRef.current.getPhase()
      if (interimLocal.trim() && (currentPhase === 'speaking' || currentPhase === 'thinking')) {
        if (!interruptSentRef.current) {
          interruptSentRef.current = true
          const silencedAt = audioRef.current.interrupt()
          latencyRef.current.record('interrupt', smRef.current.getActiveTurnId() ?? undefined)
          latencyRef.current.record('interrupt_silence', undefined, {
            msToSilence: silencedAt,
          })
          transportRef.current?.send({
            type: 'interrupt',
            turnId: smRef.current.getActiveTurnId() ?? undefined,
            at: Date.now(),
          })
          transportRef.current?.send({ type: 'speech.started', at: Date.now() })
          smRef.current.onInterrupt()
        }
      }

      if (finalText.trim()) {
        pendingUtteranceRef.current = `${pendingUtteranceRef.current} ${finalText}`.trim()
        interruptSentRef.current = false
        if (utteranceDebounceRef.current) clearTimeout(utteranceDebounceRef.current)
        utteranceDebounceRef.current = setTimeout(() => {
          const text = pendingUtteranceRef.current.trim()
          pendingUtteranceRef.current = ''
          setInterim('')
          if (!text || !liveRef.current) return
          const turnId = newTurnId()
          latencyRef.current.record('speech_stopped', turnId)
          latencyRef.current.record('utterance_sent', turnId, { text: text.slice(0, 80) })
          smRef.current.beginTurn(turnId)
          transportRef.current?.send({
            type: 'speech.stopped',
            at: Date.now(),
          })
          transportRef.current?.send({
            type: 'utterance.final',
            text,
            turnId,
            at: Date.now(),
          })
        }, 450)
      }
    }

    rec.onerror = () => {
      /* non-fatal */
    }

    rec.onend = () => {
      if (liveRef.current) {
        try {
          rec.start()
        } catch {
          /* ignore */
        }
      }
    }

    try {
      rec.start()
    } catch {
      setError('Could not start microphone / speech recognition.')
    }
  }, [])

  const endLive = useCallback(() => {
    liveRef.current = false
    setLive(false)
    stopRecognition()
    transportRef.current?.send({ type: 'session.end' })
    transportRef.current?.disconnect()
    transportRef.current = null
    audioRef.current.interrupt()
    smRef.current.reset()
    setSessionId(null)
  }, [stopRecognition])

  const startLive = useCallback(async () => {
    setError(null)
    smRef.current.connect()
    const wsUrl = resolveLiveWsUrl()
    const transport = new WssLiveVoiceTransport({
      wsUrl,
      token,
      handlers: {
        onOpen: () => {
          transport.send({ type: 'session.start', agentId, tenantId })
        },
        onError: (msg) => {
          setError(msg)
          smRef.current.onError()
        },
        onClose: () => {
          if (liveRef.current) {
            pushLine('system', 'Connection closed')
            endLive()
          }
        },
        onMessage: (msg) => {
          switch (msg.type) {
            case 'session.ready':
              setSessionId(msg.sessionId)
              setStubMode(!!msg.stubMode)
              smRef.current.onSessionReady()
              liveRef.current = true
              setLive(true)
              pushLine('system', `Live session ${msg.sessionId.slice(0, 10)}…`)
              startRecognition()
              break
            case 'transcript.final':
              latencyRef.current.record('transcript_final', msg.turnId, { text: msg.text.slice(0, 80) })
              pushLine('user', msg.text)
              break
            case 'agent.text':
              smRef.current.onAgentText(msg.turnId)
              latencyRef.current.record('agent_text', msg.turnId)
              pushLine('assistant', msg.text)
              break
            case 'agent.audio.chunk':
              latencyRef.current.record('audio_first_byte', msg.turnId, { seq: msg.seq })
              void audioRef.current.enqueueBase64(msg.data, msg.mime)
              break
            case 'turn.complete':
              latencyRef.current.record('turn_complete', msg.turnId)
              smRef.current.onTurnComplete(msg.turnId)
              interruptSentRef.current = false
              break
            case 'turn.cancelled':
              smRef.current.onTurnCancelled(msg.turnId)
              interruptSentRef.current = false
              break
            case 'error':
              setError(msg.message)
              break
            default:
              break
          }
        },
      },
    })
    transportRef.current = transport
    try {
      await transport.connect()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to connect to live voice sidecar')
      smRef.current.onError()
    }
  }, [agentId, tenantId, token, pushLine, startRecognition, endLive])

  useEffect(() => {
    return () => {
      liveRef.current = false
      stopRecognition()
      transportRef.current?.disconnect()
      audioRef.current.dispose()
    }
  }, [stopRecognition])

  return (
    <Card className="border-violet-200/70 dark:border-violet-900/40">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-violet-600" />
              Live voice demo (browser)
            </CardTitle>
            <CardDescription>
              Speak naturally with {agentName}. Interrupt anytime — agent audio stops immediately.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{PHASE_LABEL[phase]}</Badge>
            {stubMode ? <Badge variant="outline">Stub mode</Badge> : null}
            {sessionId ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {sessionId.slice(0, 12)}…
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {!live ? (
            <Button type="button" onClick={() => void startLive()} disabled={phase === 'connecting'}>
              {phase === 'connecting' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mic className="h-4 w-4 mr-2" />
              )}
              Start live voice
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={endLive}>
              <Square className="h-4 w-4 mr-2" />
              End session
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => latencyRef.current.downloadJson()}
          >
            Export latency JSON
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Sidecar: <code className="text-[11px]">{resolveLiveWsUrl() || '(set NEXT_PUBLIC_VOICE_LIVE_WS_URL)'}</code>
          {' · '}
          Requires <code className="text-[11px]">npm run dev:browser-live-ws</code> locally.
        </p>

        {interim ? (
          <p className="text-sm text-muted-foreground italic">
            <MicOff className="inline h-3 w-3 mr-1" />
            {interim}
          </p>
        ) : null}

        <div className="rounded-md border bg-muted/30 p-3 max-h-64 overflow-y-auto text-sm space-y-2">
          {lines.length === 0 ? (
            <p className="text-xs text-muted-foreground">Transcript appears here. Start live voice and speak.</p>
          ) : (
            lines.map((l, i) => (
              <div
                key={`${l.at}-${i}`}
                className={
                  l.role === 'user'
                    ? 'text-blue-700 dark:text-blue-300'
                    : l.role === 'assistant'
                      ? ''
                      : 'text-xs text-muted-foreground'
                }
              >
                <strong>{l.role}:</strong> {l.content}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
