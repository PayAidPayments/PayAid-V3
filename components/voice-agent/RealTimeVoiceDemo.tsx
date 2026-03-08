'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Loader2, Square, User, Bot } from 'lucide-react'

export interface RealTimeVoiceDemoMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface RealTimeVoiceDemoProps {
  agentId: string
  agentName: string
  agentLanguage?: string
  token: string | null
  tenantId?: string | null // from page URL; sent to API so shared demo links work
  onBack?: () => void
}

const RECOGNITION_LANG: Record<string, string> = {
  hi: 'hi-IN',
  'hi-IN': 'hi-IN',
  en: 'en-IN',
  'en-IN': 'en-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  mr: 'mr-IN',
}

export function RealTimeVoiceDemo({
  agentId,
  agentName,
  agentLanguage = 'hi',
  token,
  tenantId,
  onBack,
}: RealTimeVoiceDemoProps) {
  const [messages, setMessages] = useState<RealTimeVoiceDemoMessage[]>([])
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isProcessingRef = useRef(false)
  const shouldBeListeningRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<RealTimeVoiceDemoMessage[]>([])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const recLang = RECOGNITION_LANG[agentLanguage] || 'hi-IN'

  const restartListening = useCallback(() => {
    if (isProcessingRef.current || !shouldBeListeningRef.current) return
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    restartTimeoutRef.current = setTimeout(() => {
      const rec = recognitionRef.current
      if (rec && shouldBeListeningRef.current) {
        try {
          rec.start()
        } catch (e) {
          // already started or not allowed
        }
      }
      restartTimeoutRef.current = null
    }, 500)
  }, [])

  const processSpeech = useCallback(
    async (text: string) => {
      if (!text.trim() || !token) return
      isProcessingRef.current = true
      setStatus('processing')
      setInterimText('')
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
        currentAudioRef.current = null
      }

      const userMessage: RealTimeVoiceDemoMessage = {
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toLocaleTimeString(),
      }
      setMessages((prev) => [...prev, userMessage])

      const controller = new AbortController()
      const timeoutMs = 60_000 // 60s max wait so we don't stay stuck on "Replying..."
      const timeoutId = setTimeout(() => controller.abort(new DOMException('Request timed out after 60s', 'AbortError')), timeoutMs)

      try {
        const history = messagesRef.current.map((m) => ({ role: m.role, content: m.content }))
        const res = await fetch('/api/voice/demo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            agentId,
            transcript: text.trim(),
            ...(tenantId && { tenantId }),
            conversationHistory: history.slice(-14),
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        let data: { text?: string; audio?: string; ttsError?: string; error?: string } = {}
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        if (!res.ok) {
          console.error('Demo API failed:', data.error || res.statusText)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `[Error: ${data.error || res.statusText || 'Request failed'}. Voice may be unavailable.]`,
              timestamp: new Date().toLocaleTimeString(),
            },
          ])
          isProcessingRef.current = false
          setStatus('listening')
          restartListening()
          return
        }
        const reply = data.text || ''
        const base64Audio = data.audio
        const ttsError = data.ttsError
        const is401 = ttsError && String(ttsError).includes('401')
        const ttsHint = is401
          ? ' Fix: In .env set VEXYL_API_KEY to your server key and VEXYL_AUTH_HEADER (e.g. X-API-Key or none if no auth), then restart dev server.'
          : ''
        const displayReply = reply
          ? ttsError
            ? `${reply}\n\n🔇 Voice unavailable (${ttsError}).${ttsHint}`
            : reply
          : ttsError
            ? `[Voice unavailable: ${ttsError}]${ttsHint}`
            : '[No response text]'
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: displayReply, timestamp: new Date().toLocaleTimeString() },
        ])
        const clearProcessingAndRestart = () => {
          currentAudioRef.current = null
          isProcessingRef.current = false
          setStatus('listening')
          restartListening()
        }
        if (base64Audio) {
          try {
            const bytes = Uint8Array.from(atob(base64Audio), (c) => c.charCodeAt(0))
            const blob = new Blob([bytes], { type: 'audio/wav' })
            const url = URL.createObjectURL(blob)
            const audio = new Audio(url)
            currentAudioRef.current = audio
            audio.onended = () => {
              URL.revokeObjectURL(url)
              clearProcessingAndRestart()
            }
            audio.onerror = () => {
              URL.revokeObjectURL(url)
              clearProcessingAndRestart()
            }
            audio.play().catch((e) => {
              console.error('Audio play failed:', e)
              clearProcessingAndRestart()
            })
          } catch (e) {
            console.error('Audio decode/play failed:', e)
            clearProcessingAndRestart()
          }
        } else {
          clearProcessingAndRestart()
        }
      } catch (err) {
        clearTimeout(timeoutId)
        const isAbort = (err instanceof Error && err.name === 'AbortError') || (err && (err as { name?: string }).name === 'AbortError')
        if (!isAbort) console.error('Demo process error:', err)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: isAbort
              ? '[Response is taking too long. The server may be busy or compiling. Tap the mic to try again.]'
              : `[Error: ${err instanceof Error ? err.message : 'Network or server error'}. Try again.]`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
        isProcessingRef.current = false
        setStatus('listening')
        restartListening()
      }
    },
    [agentId, token, tenantId, restartListening]
  )

  useEffect(() => {
    const SpeechRecognition =
      (typeof window !== 'undefined' &&
        ((window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition ||
          (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition)) ||
      null
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = recLang
    rec.onstart = () => {
      setStatus('listening')
      setInterimText('')
    }
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let final = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) final += transcript
        else interim += transcript
      }
      if (final) {
        setInterimText('')
        processSpeech(final)
      } else {
        setInterimText(interim)
      }
    }
    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== 'aborted') restartListening()
    }
    rec.onend = () => {
      if (!shouldBeListeningRef.current) return
      restartListening()
    }
    recognitionRef.current = rec
    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
      rec.stop()
      recognitionRef.current = null
    }
  }, [recLang])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interimText])

  const startDemo = () => {
    shouldBeListeningRef.current = true
    setStatus('listening')
    setMessages([])
    try {
      recognitionRef.current?.start()
    } catch (e) {
      setStatus('idle')
      shouldBeListeningRef.current = false
    }
  }

  const endDemo = () => {
    shouldBeListeningRef.current = false
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    recognitionRef.current?.stop()
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current = null
    }
    isProcessingRef.current = false
    setStatus('idle')
    setInterimText('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto w-full">
      {/* Status */}
      <div className="flex items-center justify-between py-2 px-1">
        <div className="flex items-center gap-2 min-h-8">
          {status === 'listening' && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Listening… Speak now
            </span>
          )}
          {status === 'processing' && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Agent replying…
            </span>
          )}
          {status === 'idle' && (
            <span className="text-sm text-muted-foreground">Tap mic to start</span>
          )}
        </div>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-4 space-y-3">
        {messages.length === 0 && status === 'idle' && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Tap the mic to start. Speak naturally — no extra clicks between turns.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">
                {msg.role === 'user' ? 'You' : agentName} · {msg.timestamp}
              </span>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {interimText && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-xl px-4 py-2 bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 text-sm italic">
              You: {interimText}…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3 pt-4 pb-2">
        <Button
          size="lg"
          className={`rounded-full h-28 w-28 p-0 transition-all ${
            status === 'idle'
              ? 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 animate-pulse'
              : status === 'listening'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 text-white'
          }`}
          onClick={status === 'idle' ? startDemo : undefined}
          disabled={status === 'processing'}
          title={
            status === 'idle'
              ? 'Start conversation'
              : status === 'listening'
                ? 'Listening…'
                : 'Agent replying…'
          }
        >
          {status === 'processing' ? (
            <Loader2 className="h-14 w-14 animate-spin" />
          ) : (
            <Mic className="h-14 w-14" />
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          {status === 'idle' && 'Start real conversation'}
          {status === 'listening' && 'Speak — agent will reply with voice'}
          {status === 'processing' && 'Replying…'}
        </p>
        {(status === 'listening' || status === 'processing') && (
          <Button variant="outline" size="sm" onClick={endDemo} className="gap-2">
            <Square className="h-4 w-4" />
            End demo
          </Button>
        )}
      </div>
    </div>
  )
}
