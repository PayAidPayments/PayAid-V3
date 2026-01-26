'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { detectHindiOrHinglish, getLanguageCode } from '@/lib/voice-agent/hindi-support'

interface VoiceInputProps {
  onTranscript?: (text: string, language: string) => void
  onError?: (error: Error) => void
  autoDetectLanguage?: boolean
  className?: string
}

export function VoiceInput({
  onTranscript,
  onError,
  autoDetectLanguage = true,
  className = ''
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState<string>('')
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Start recording audio
   */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        await processAudio()
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to start recording'))
    }
  }

  /**
   * Stop recording and process audio
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  /**
   * Process recorded audio
   */
  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return
    
    setIsProcessing(true)
    
    try {
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const audioBuffer = await audioBlob.arrayBuffer()
      
      // Send to API for transcription
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      if (autoDetectLanguage) {
        formData.append('autoDetect', 'true')
      }
      
      const response = await fetch('/api/ai/voice/process', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Transcription failed')
      }
      
      const data = await response.json()
      const transcribedText = data.transcript || ''
      const language = data.language || 'en'
      
      setTranscript(transcribedText)
      setDetectedLanguage(language)
      
      // Detect Hindi/Hinglish if auto-detect is enabled
      if (autoDetectLanguage && transcribedText) {
        const detection = detectHindiOrHinglish(transcribedText)
        const finalLanguage = getLanguageCode(detection)
        setDetectedLanguage(finalLanguage)
        onTranscript?.(transcribedText, finalLanguage)
      } else {
        onTranscript?.(transcribedText, language)
      }
    } catch (error) {
      console.error('Error processing audio:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to process audio'))
    } finally {
      setIsProcessing(false)
      audioChunksRef.current = []
    }
  }

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          variant={isRecording ? 'destructive' : 'default'}
          size="lg"
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Recording
            </>
          )}
        </Button>
        
        {detectedLanguage && detectedLanguage !== 'en' && (
          <span className="text-sm text-muted-foreground">
            Language: {detectedLanguage === 'hi' ? 'Hindi' : detectedLanguage === 'hinglish' ? 'Hinglish' : 'English'}
          </span>
        )}
      </div>
      
      {transcript && (
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
      
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          Recording...
        </div>
      )}
    </div>
  )
}
