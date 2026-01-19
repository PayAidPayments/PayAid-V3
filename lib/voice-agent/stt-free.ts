/**
 * Free Speech-to-Text Service
 * Uses Whisper (via AI Gateway or direct Docker service)
 * 
 * This is a free alternative to Deepgram
 */

import { aiGateway } from '@/lib/ai/gateway'

export interface STTResult {
  text: string
  language: string
  confidence?: number
  segments?: Array<{
    start: number
    end: number
    text: string
  }>
}

/**
 * Transcribe audio using Whisper (FREE)
 * Uses existing AI Gateway or direct service connection
 */
export async function transcribeAudioFree(
  audioData: Buffer | string,
  language?: string
): Promise<STTResult> {
  try {
    // Check if we should use AI Gateway or direct service
    const useGateway = process.env.USE_AI_GATEWAY === 'true' || !!process.env.AI_GATEWAY_URL
    const directServiceUrl = process.env.SPEECH_TO_TEXT_URL || 'http://localhost:7862'

    if (useGateway && process.env.AI_GATEWAY_URL) {
      // Use AI Gateway (recommended - handles routing)
      return await transcribeViaGateway(audioData, language)
    } else {
      // Use direct service connection (bypass gateway)
      return await transcribeDirect(audioData, language, directServiceUrl)
    }
  } catch (error) {
    console.error('[STT Free] Error transcribing audio:', error)
    throw new Error(`Speech-to-text failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Transcribe via AI Gateway (uses Whisper service)
 */
async function transcribeViaGateway(
  audioData: Buffer | string,
  language?: string
): Promise<STTResult> {
  let audioUrl: string

  if (Buffer.isBuffer(audioData)) {
    // Convert buffer to base64 data URL
    const base64 = audioData.toString('base64')
    audioUrl = `data:audio/wav;base64,${base64}`
  } else {
    audioUrl = audioData
  }

  // Call AI Gateway STT service (routes to Whisper)
  const result = await aiGateway.speechToText({
    audio_url: audioUrl,
    language: language || undefined,
    task: 'transcribe',
  })

  return {
    text: result.text || '',
    language: result.language || 'en',
    service: 'whisper-free',
    // Note: confidence not available in free STT service
    segments: result.segments?.map((seg: any) => ({
      start: seg.start || 0,
      end: seg.end || 0,
      text: seg.text || '',
    })),
  }
}

/**
 * Transcribe directly from Whisper service (bypasses gateway)
 */
async function transcribeDirect(
  audioData: Buffer | string,
  language: string | undefined,
  serviceUrl: string
): Promise<STTResult> {
  // Prepare audio data
  let audioBuffer: Buffer
  if (Buffer.isBuffer(audioData)) {
    audioBuffer = audioData
  } else {
    // If it's a URL, fetch it
    const response = await fetch(audioData)
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`)
    }
    audioBuffer = Buffer.from(await response.arrayBuffer())
  }

  // Convert to base64 for API
  const base64Audio = audioBuffer.toString('base64')

  // Call Whisper service directly
  const response = await fetch(`${serviceUrl}/api/v1/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio: base64Audio,
      language: language || 'auto',
      task: 'transcribe',
    }),
  })

  if (!response.ok) {
    throw new Error(`Whisper service error: ${response.statusText}`)
  }

  const result = await response.json()

  return {
    text: result.text || '',
    language: result.language || 'en',
    confidence: result.confidence,
    segments: result.segments || [],
  }
}

/**
 * Stream transcription (for real-time)
 * Note: Whisper doesn't natively support streaming, but we can process chunks
 */
export async function transcribeStream(
  audioChunks: Buffer[],
  language?: string
): Promise<STTResult> {
  // Combine chunks and transcribe
  const combinedAudio = Buffer.concat(audioChunks)
  return await transcribeAudioFree(combinedAudio, language)
}
