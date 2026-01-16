/**
 * Free Text-to-Speech Service
 * Uses Coqui TTS (already in Docker)
 * 
 * This is a free alternative to ElevenLabs
 */

import { aiGateway } from '@/lib/ai/gateway'

export interface TTSOptions {
  language?: string
  voiceId?: string
  speed?: number
}

/**
 * Synthesize speech using Coqui TTS (FREE)
 * Uses existing AI Gateway or direct service connection
 */
export async function synthesizeSpeechFree(
  text: string,
  language: string = 'en',
  voiceId?: string,
  speed: number = 1.0
): Promise<Buffer> {
  try {
    // Check if we should use AI Gateway or direct service
    const useGateway = process.env.USE_AI_GATEWAY === 'true' || !!process.env.AI_GATEWAY_URL
    const directServiceUrl = process.env.TEXT_TO_SPEECH_URL || 'http://localhost:7861'

    if (useGateway && process.env.AI_GATEWAY_URL) {
      // Use AI Gateway (recommended)
      return await synthesizeViaGateway(text, language, voiceId, speed)
    } else {
      // Use direct service connection
      return await synthesizeDirect(text, language, voiceId, speed, directServiceUrl)
    }
  } catch (error) {
    console.error('[TTS Free] Error synthesizing speech:', error)
    throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Synthesize via AI Gateway (uses Coqui TTS service)
 */
async function synthesizeViaGateway(
  text: string,
  language: string,
  voiceId: string | undefined,
  speed: number
): Promise<Buffer> {
  // Call AI Gateway TTS service (routes to Coqui TTS)
  const result = await aiGateway.textToSpeech({
    text: text,
    language: language,
    voice: voiceId,
    speed: speed,
  })

  // Gateway returns audio_url
  if (result.audio_url) {
    // Handle file:// URLs (local files)
    if (result.audio_url.startsWith('file://')) {
      const { readFileSync } = await import('fs')
      const filePath = result.audio_url.replace('file://', '')
      return readFileSync(filePath)
    }
    
    // Handle HTTP URLs
    if (result.audio_url.startsWith('http')) {
      const response = await fetch(result.audio_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
  }

  throw new Error('No audio data returned from TTS service')
}

/**
 * Synthesize directly from Coqui TTS service (bypasses gateway)
 */
async function synthesizeDirect(
  text: string,
  language: string,
  voiceId: string | undefined,
  speed: number,
  serviceUrl: string
): Promise<Buffer> {
  // Call Coqui TTS service directly
  const response = await fetch(`${serviceUrl}/api/v1/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      language: language,
      voice: voiceId || 'default',
      speed: speed,
    }),
  })

  if (!response.ok) {
    throw new Error(`Coqui TTS service error: ${response.statusText}`)
  }

  // Coqui TTS returns audio as binary or base64
  const contentType = response.headers.get('content-type') || ''
  
  if (contentType.includes('audio')) {
    // Binary audio
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } else {
    // JSON with base64 audio
    const result = await response.json()
    if (result.audio) {
      return Buffer.from(result.audio, 'base64')
    }
    if (result.audio_url) {
      const audioResponse = await fetch(result.audio_url)
      const arrayBuffer = await audioResponse.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
    throw new Error('No audio data in response')
  }
}

/**
 * Stream TTS (for real-time)
 * Note: Coqui TTS doesn't natively support streaming, but we can process in chunks
 */
export async function synthesizeStream(
  textChunks: string[],
  language: string = 'en',
  voiceId?: string
): Promise<Buffer[]> {
  const audioBuffers: Buffer[] = []
  
  for (const chunk of textChunks) {
    if (chunk.trim()) {
      const audio = await synthesizeSpeechFree(chunk, language, voiceId)
      audioBuffers.push(audio)
    }
  }
  
  return audioBuffers
}
