'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mic, MicOff, Radio, Square } from 'lucide-react'
import { AudioPlaybackQueue } from '@/lib/voice-agent/browser-live/audio-playback-queue'
import { LiveLatencyRecorder } from '@/lib/voice-agent/browser-live/latency-recorder'
import { BrowserLiveSessionStateMachine } from '@/lib/voice-agent/browser-live/session-state-machine'
import type {
  BrowserLivePostCallArtifacts,
  BrowserLiveSessionPhase,
} from '@/lib/voice-agent/browser-live/protocol'
import { BROWSER_LIVE_TONE_PRESETS } from '@/lib/voice-agent/browser-live/protocol'
import {
  DEFAULT_VOICE_BEHAVIOR,
  VOICE_PACE_PRESETS,
  type VoicePacePreset,
  type VoiceTonePreset,
} from '@/lib/voice-agent/voice-behavior-config'
import { PhaseWatchdog } from '@/lib/voice-agent/browser-live/phase-watchdog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { resolveLiveWsUrl } from '@/lib/voice-agent/browser-live/live-voice-transport'
import { WssLiveVoiceTransport } from '@/lib/voice-agent/browser-live/wss-live-voice-transport'

export type BrowserLiveVoiceDemoProps = {
  agentId: string
  tenantId: string
  token: string
  agentName: string
}

type TranscriptLine = { role: 'user' | 'assistant' | 'system'; content: string; at: string }

const SERVER_STT_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_VOICE_BROWSER_LIVE_SERVER_STT === '1'

/** Minimal Web Speech API surface — avoids relying on lib.dom SpeechRecognition (not in all TS configs). */
type BrowserSpeechRecognitionResult = {
  isFinal: boolean
  0: { transcript: string }
}

type BrowserSpeechRecognitionEvent = {
  resultIndex: number
  results: BrowserSpeechRecognitionResult[] & { length: number }
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getSpeechRecognition(): BrowserSpeechRecognition | null {
  if (typeof window === 'undefined') return null
  const W = window as Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition
  }
  const K = W.SpeechRecognition || W.webkitSpeechRecognition
  return K ? new K() : null
}

function newTurnId() {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
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
  const [offlineReal, setOfflineReal] = useState(false)
  const [bargeInCount, setBargeInCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [connectionNote, setConnectionNote] = useState<string | null>(null)
  const [sttNotice, setSttNotice] = useState<string | null>(null)
  const [audioNotice, setAudioNotice] = useState<string | null>(null)
  const [lines, setLines] = useState<TranscriptLine[]>([])
  const [interim, setInterim] = useState('')
  const [tonePreset, setTonePreset] = useState<VoiceTonePreset>(DEFAULT_VOICE_BEHAVIOR.tonePreset)
  const [pacePreset, setPacePreset] = useState<VoicePacePreset>(DEFAULT_VOICE_BEHAVIOR.pacePreset)
  const [callerPhone, setCallerPhone] = useState('')
  const [crmWritebackEnabled, setCrmWritebackEnabled] = useState(true)
  const [postCallArtifacts, setPostCallArtifacts] = useState<BrowserLivePostCallArtifacts | null>(null)

  const transportRef = useRef<WssLiveVoiceTransport | null>(null)
  const smRef = useRef(new BrowserLiveSessionStateMachine({ onPhaseChange: (p) => setPhase(p) }))
  const audioRef = useRef(new AudioPlaybackQueue())
  const latencyRef = useRef(new LiveLatencyRecorder())
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const liveRef = useRef(false)
  const pendingUtteranceRef = useRef('')
  const utteranceDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interruptSentRef = useRef(false)
  const firstAudioRecordedRef = useRef<Record<string, boolean>>({})
  const phaseWatchdogRef = useRef(
    new PhaseWatchdog({
      onStuck: (stuckPhase, turnId) => {
        setConnectionNote(`Stuck in ${stuckPhase} — ending turn watchdog for ${turnId ?? 'unknown'}`)
      },
    }),
  )
  const ttsWatchRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionRecorderRef = useRef<MediaRecorder | null>(null)
  const sessionRecordingChunksRef = useRef<Blob[]>([])

  const pushLine = useCallback((role: TranscriptLine['role'], content: string) => {
    setLines((prev) => [...prev, { role, content, at: new Date().toLocaleTimeString() }])
  }, [])

  const stopMediaCapture = useCallback(() => {
    try {
      mediaRecorderRef.current?.stop()
    } catch {
      /* ignore */
    }
    mediaRecorderRef.current = null
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
    mediaStreamRef.current = null
    audioChunksRef.current = []
  }, [])

  const startMediaCapture = useCallback(async () => {
    if (!SERVER_STT_ENABLED || typeof navigator === 'undefined') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.start(250)
    } catch {
      setError('Microphone access required for server STT mode.')
    }
  }, [])

  const flushRecorderBlob = useCallback(async (): Promise<{ base64: string; mime: string } | null> => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return null

    return new Promise((resolve) => {
      const chunks = [...audioChunksRef.current]
      recorder.onstop = () => {
        audioChunksRef.current = []
        if (!chunks.length) {
          resolve(null)
          return
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        void blobToBase64(blob).then((base64) => {
          resolve({ base64, mime: recorder.mimeType || 'audio/webm' })
          if (liveRef.current && mediaStreamRef.current) {
            try {
              const next = new MediaRecorder(mediaStreamRef.current, {
                mimeType: recorder.mimeType,
              })
              mediaRecorderRef.current = next
              next.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
              }
              next.start(250)
            } catch {
              /* ignore */
            }
          }
        })
      }
      try {
        recorder.stop()
      } catch {
        resolve(null)
      }
    })
  }, [])

  const sendUtterance = useCallback(
    async (text: string) => {
      if (!text.trim() || !liveRef.current) return
      const turnId = newTurnId()
      latencyRef.current.record('speech_stopped', turnId)
      smRef.current.beginTurn(turnId)
      transportRef.current?.send({ type: 'speech.stopped', at: Date.now() })

      if (SERVER_STT_ENABLED && mediaRecorderRef.current) {
        const audio = await flushRecorderBlob()
        latencyRef.current.record('utterance_audio_sent', turnId, {
          bytes: audio?.base64.length ?? 0,
        })
        transportRef.current?.send({
          type: 'utterance.audio',
          turnId,
          mime: audio?.mime || 'audio/webm',
          data: audio?.base64 || '',
          clientTextHint: text,
          at: Date.now(),
        })
      } else {
        latencyRef.current.record('utterance_sent', turnId, { text: text.slice(0, 80) })
        transportRef.current?.send({
          type: 'utterance.final',
          text,
          turnId,
          at: Date.now(),
        })
      }
    },
    [flushRecorderBlob],
  )

  const stopRecognition = useCallback(() => {
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
  }, [])

  const startRecognition = useCallback(() => {
    const Rec = getSpeechRecognition()
    if (!Rec && !SERVER_STT_ENABLED) {
      setError('Speech recognition not supported. Use Chrome/Edge on desktop.')
      return
    }
    if (!Rec) return

    const rec = Rec
    recognitionRef.current = rec
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-IN'

    rec.onresult = (event: BrowserSpeechRecognitionEvent) => {
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
          void sendUtterance(text)
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
  }, [sendUtterance])

  const stopSessionRecording = useCallback(async (): Promise<{ base64: string; mime: string } | null> => {
    const recorder = sessionRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return null
    return new Promise((resolve) => {
      const chunks = [...sessionRecordingChunksRef.current]
      recorder.onstop = () => {
        sessionRecordingChunksRef.current = []
        sessionRecorderRef.current = null
        if (!chunks.length) {
          resolve(null)
          return
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        void blobToBase64(blob).then((base64) => {
          resolve({ base64, mime: recorder.mimeType || 'audio/webm' })
        })
      }
      try {
        recorder.stop()
      } catch {
        resolve(null)
      }
    })
  }, [])

  const startSessionRecording = useCallback(async () => {
    if (typeof navigator === 'undefined') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      sessionRecorderRef.current = recorder
      sessionRecordingChunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) sessionRecordingChunksRef.current.push(e.data)
      }
      recorder.start(1000)
    } catch {
      setSttNotice('Session recording unavailable — transcript and summary still captured.')
    }
  }, [])

  const endLive = useCallback(() => {
    void (async () => {
      liveRef.current = false
      setLive(false)
      stopRecognition()
      stopMediaCapture()
      const recording = await stopSessionRecording()
      transportRef.current?.send({
        type: 'session.end',
        recordingMime: recording?.mime,
        recordingData: recording?.base64,
      })
      transportRef.current?.disconnect()
      transportRef.current = null
      audioRef.current.interrupt()
      smRef.current.reset()
      phaseWatchdogRef.current.clear()
      if (ttsWatchRef.current) clearTimeout(ttsWatchRef.current)
      setSessionId(null)
      setBargeInCount(0)
      firstAudioRecordedRef.current = {}
    })()
  }, [stopRecognition, stopMediaCapture, stopSessionRecording])

  const startLive = useCallback(async () => {
    setError(null)
    setPostCallArtifacts(null)
    setAudioNotice(null)
    setConnectionNote(null)
    smRef.current.connect()
    const wsUrl = resolveLiveWsUrl()
    const transport = new WssLiveVoiceTransport({
      wsUrl,
      token,
      handlers: {
        onOpen: () => {
          transport.send({
            type: 'session.start',
            agentId,
            tenantId,
            callerPhone: callerPhone.trim() || undefined,
            crmWritebackEnabled,
            voiceBehavior: { tonePreset, pacePreset },
          })
        },
        onError: (msg) => {
          setError(msg)
          smRef.current.onError()
        },
        onClose: () => {
          if (!liveRef.current) return
          latencyRef.current.record('connection_lost')
          setConnectionNote('Connection lost — attempting one reconnect…')
          phaseWatchdogRef.current.clear()
        },
        onMessage: (msg) => {
          switch (msg.type) {
            case 'session.ready':
              setSessionId(msg.sessionId)
              setStubMode(!!msg.stubMode)
              setOfflineReal(!!msg.offlineReal)
              latencyRef.current.setMode(msg.stubMode ? 'stub' : 'real')
              setConnectionNote(null)
              latencyRef.current.record('connection_restored')
              smRef.current.onSessionReady()
              liveRef.current = true
              setLive(true)
              pushLine(
                'system',
                msg.stubMode
                  ? `Stub session ${msg.sessionId.slice(0, 10)}…`
                  : `Live session ${msg.sessionId.slice(0, 10)}… (Groq + Sarvam TTS)`,
              )
              void startSessionRecording()
              void startMediaCapture()
              startRecognition()
              break
            case 'session.ended':
              if (msg.artifacts) setPostCallArtifacts(msg.artifacts)
              pushLine('system', 'Session ended — post-call artifacts ready.')
              break
            case 'transcript.final':
              latencyRef.current.record('transcript_final', msg.turnId, {
                text: msg.text.slice(0, 80),
              })
              pushLine('user', msg.text)
              break
            case 'agent.text':
              smRef.current.onAgentText(msg.turnId)
              phaseWatchdogRef.current.arm('speaking', msg.turnId)
              latencyRef.current.record('agent_text', msg.turnId)
              pushLine('assistant', msg.text)
              if (ttsWatchRef.current) clearTimeout(ttsWatchRef.current)
              ttsWatchRef.current = setTimeout(() => {
                if (!firstAudioRecordedRef.current[msg.turnId] && !stubMode) {
                  latencyRef.current.record('tts_missing', msg.turnId)
                  setAudioNotice('Audio unavailable — read the reply above.')
                }
              }, 2500)
              break
            case 'agent.audio.chunk': {
              if (msg.final || !msg.data) break
              if (!firstAudioRecordedRef.current[msg.turnId]) {
                firstAudioRecordedRef.current[msg.turnId] = true
                latencyRef.current.record('audio_first_byte', msg.turnId, { seq: msg.seq })
                smRef.current.onAgentText(msg.turnId)
              } else {
                latencyRef.current.record('audio_chunk', msg.turnId, { seq: msg.seq })
              }
              void audioRef.current.enqueueBase64(msg.data, msg.mime)
              break
            }
            case 'turn.complete':
              phaseWatchdogRef.current.clear()
              if (ttsWatchRef.current) clearTimeout(ttsWatchRef.current)
              latencyRef.current.record('turn_complete', msg.turnId)
              smRef.current.onTurnComplete(msg.turnId)
              interruptSentRef.current = false
              break
            case 'turn.cancelled':
              audioRef.current.interrupt()
              phaseWatchdogRef.current.clear()
              if (ttsWatchRef.current) clearTimeout(ttsWatchRef.current)
              latencyRef.current.record('turn_cancelled', msg.turnId, { reason: msg.reason })
              smRef.current.onTurnCancelled(msg.turnId)
              interruptSentRef.current = false
              break
            case 'interrupt.ack':
              setBargeInCount(msg.bargeInCount)
              latencyRef.current.record('interrupt_ack', msg.cancelledTurnId, {
                bargeInCount: msg.bargeInCount,
              })
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
  }, [
    agentId,
    tenantId,
    token,
    pushLine,
    startRecognition,
    endLive,
    startMediaCapture,
    startSessionRecording,
    callerPhone,
    crmWritebackEnabled,
    tonePreset,
    pacePreset,
  ])

  useEffect(() => {
    return () => {
      liveRef.current = false
      stopRecognition()
      stopMediaCapture()
      transportRef.current?.disconnect()
      audioRef.current.dispose()
    }
  }, [stopRecognition, stopMediaCapture])

  const sttLabel = SERVER_STT_ENABLED ? 'Server STT (Whisper)' : 'Browser STT'

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
            <Badge variant="outline">{sttLabel}</Badge>
            {stubMode ? <Badge variant="outline">Stub mode</Badge> : null}
            {offlineReal && !stubMode ? (
              <Badge variant="outline">Offline real (Groq)</Badge>
            ) : null}
            {bargeInCount > 0 ? (
              <Badge variant="outline">Barge-ins: {bargeInCount}</Badge>
            ) : null}
            {sessionId ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {sessionId.slice(0, 12)}…
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionNote ? (
          <p className="text-sm text-amber-700 dark:text-amber-300" role="status">
            {connectionNote}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {sttNotice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {sttNotice}
          </p>
        ) : null}
        {audioNotice ? (
          <p className="text-sm text-muted-foreground" role="status">
            {audioNotice}
          </p>
        ) : null}

        {!live ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="demo-tone">Tone / persona</Label>
              <Select value={tonePreset} onValueChange={(v) => setTonePreset(v as VoiceTonePreset)}>
                <SelectTrigger id="demo-tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {BROWSER_LIVE_TONE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-pace">Speaking pace</Label>
              <Select value={pacePreset} onValueChange={(v) => setPacePreset(v as VoicePacePreset)}>
                <SelectTrigger id="demo-pace">
                  <SelectValue placeholder="Select pace" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_PACE_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="demo-caller-phone">Caller phone (CRM routing)</Label>
              <Input
                id="demo-caller-phone"
                placeholder="e.g. 9876543210"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={crmWritebackEnabled}
                  onChange={(e) => setCrmWritebackEnabled(e.target.checked)}
                />
                CRM writeback on end
              </label>
              <p className="text-xs text-muted-foreground">
                Matched contact → interaction; unknown phone → lead; no phone → inbox only.
              </p>
            </div>
          </div>
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
          Spoken path: <code className="text-[11px]">BROWSER_LIVE_TTS_PROVIDER=sarvam</code> +{' '}
          <code className="text-[11px]">SARVAM_API_KEY</code> + <code className="text-[11px]">GROQ_API_KEY</code>.
        </p>

        {postCallArtifacts ? (
          <div className="rounded-md border border-violet-200/60 bg-violet-50/40 dark:bg-violet-950/20 p-3 text-sm space-y-2">
            <p className="font-medium">Post-call artifacts</p>
            <p>
              <strong>Routing:</strong> {postCallArtifacts.routing.replace(/_/g, ' ')}
            </p>
            <p>
              <strong>Disposition:</strong> {postCallArtifacts.disposition}
            </p>
            <p>
              <strong>Summary:</strong> {postCallArtifacts.summary}
            </p>
            {postCallArtifacts.sentiment ? (
              <p>
                <strong>Sentiment:</strong> {postCallArtifacts.sentiment.sentiment}
                {' '}
                (score {postCallArtifacts.sentiment.score.toFixed(2)})
              </p>
            ) : null}
            {postCallArtifacts.objectionTags?.length ? (
              <p>
                <strong>Objections:</strong> {postCallArtifacts.objectionTags.join(', ')}
              </p>
            ) : null}
            <p>
              <strong>Entities:</strong>{' '}
              {postCallArtifacts.entities.phones.length
                ? `phones: ${postCallArtifacts.entities.phones.join(', ')}`
                : 'no phones'}
              {postCallArtifacts.entities.emails.length
                ? ` · emails: ${postCallArtifacts.entities.emails.join(', ')}`
                : ''}
            </p>
            {postCallArtifacts.recording ? (
              <p>
                <strong>Recording:</strong> {postCallArtifacts.recording.mime}
                {postCallArtifacts.recording.truncated ? ' (truncated)' : ''}
              </p>
            ) : null}
            {postCallArtifacts.crm?.contactId ? (
              <p className="text-xs font-mono text-muted-foreground">
                CRM contact {postCallArtifacts.crm.contactId.slice(0, 12)}…
                {postCallArtifacts.crm.interactionId
                  ? ` · interaction ${postCallArtifacts.crm.interactionId.slice(0, 12)}…`
                  : ''}
                {postCallArtifacts.crm.leadCreated ? ' · new lead' : ''}
                {postCallArtifacts.crm.voiceLeadUnverified ? ' · voice lead (unverified)' : ''}
                {postCallArtifacts.crm.inboxOnly ? ' · inbox only' : ''}
                {postCallArtifacts.crm.followUpTaskTitles?.length
                  ? ` · tasks: ${postCallArtifacts.crm.followUpTaskTitles.join(', ')}`
                  : ''}
              </p>
            ) : null}
          </div>
        ) : null}

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
