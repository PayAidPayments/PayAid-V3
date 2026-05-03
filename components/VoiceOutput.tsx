'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { getTTSVoiceId } from '@/lib/voice-agent/hindi-support'

interface VoiceOutputProps {
  text: string
  language?: string
  voiceId?: string
  speed?: number
  onPlay?: () => void
  onPause?: () => void
  onEnd?: () => void
  className?: string
  autoPlay?: boolean
}

export function VoiceOutput({
  text,
  language = 'en',
  voiceId,
  speed = 1.0,
  onPlay,
  onPause,
  onEnd,
  className = '',
  autoPlay = false
}: VoiceOutputProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  /**
   * Synthesize speech and play
   */
  const synthesizeAndPlay = async () => {
    if (!text.trim()) {
      setError('No text to synthesize')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get voice ID based on language if not provided
      const finalVoiceId = voiceId || getTTSVoiceId(language)

      // Call TTS API
      const response = await fetch('/api/ai/voice/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'synthesize',
          text,
          language,
          voiceId: finalVoiceId,
          speed
        })
      })

      if (!response.ok) {
        throw new Error('Synthesis failed')
      }

      const data = await response.json()
      const audioUrl = data.audioUrl || data.audio

      if (!audioUrl) {
        throw new Error('No audio URL returned')
      }

      // Create audio element and play
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoading(false)
        onPlay?.()
      }

      audio.onpause = () => {
        setIsPlaying(false)
        onPause?.()
      }

      audio.onended = () => {
        setIsPlaying(false)
        onEnd?.()
      }

      audio.onerror = () => {
        setError('Failed to play audio')
        setIsLoading(false)
        setIsPlaying(false)
      }

      // Set playback rate
      audio.playbackRate = speed

      await audio.play()
    } catch (error) {
      console.error('Error synthesizing speech:', error)
      setError(error instanceof Error ? error.message : 'Failed to synthesize speech')
      setIsLoading(false)
    }
  }

  /**
   * Stop/pause audio
   */
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  /**
   * Auto-play on text change if enabled
   */
  useEffect(() => {
    if (autoPlay && text.trim() && !isPlaying && !isLoading) {
      synthesizeAndPlay()
    }
  }, [text, autoPlay])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <Button
            onClick={synthesizeAndPlay}
            disabled={isLoading || !text.trim()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synthesizing...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                Play
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={stopAudio}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <VolumeX className="h-4 w-4" />
            Stop
          </Button>
        )}
        
        {language && language !== 'en' && (
          <span className="text-sm text-muted-foreground">
            {language === 'hi' ? 'Hindi' : language === 'hinglish' ? 'Hinglish' : 'English'}
          </span>
        )}
      </div>

      {error && (
        <div className="p-2 bg-destructive/10 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {text && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm">{text}</p>
        </div>
      )}
    </div>
  )
}
