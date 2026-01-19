/**
 * Speech-to-Text Service
 * Uses Whisper (via AI Gateway) for transcription
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
 * Transcribe audio to text
 */
export async function transcribeAudio(
  audioData: Buffer | string,
  language?: string
): Promise<STTResult> {
  try {
    // Check if AI Gateway is configured
    const useGateway = process.env.AI_GATEWAY_URL || process.env.USE_AI_GATEWAY === 'true'
    
    if (!useGateway) {
      throw new Error(
        'STT service not configured. Please set AI_GATEWAY_URL or USE_AI_GATEWAY=true in your .env file. ' +
        'The AI Gateway service must be running for speech-to-text functionality.'
      )
    }

    // If audioData is a buffer, we need to save it temporarily or convert to URL
    // For now, assume it's a URL or we'll handle buffer conversion
    let audioUrl: string

    if (Buffer.isBuffer(audioData)) {
      // Convert buffer to data URL (for small chunks)
      // In production, upload to S3/storage and get URL
      const base64 = audioData.toString('base64')
      audioUrl = `data:audio/wav;base64,${base64}`
    } else {
      audioUrl = audioData
    }

    // Call AI Gateway STT service
    const result = await aiGateway.speechToText({
      audio_url: audioUrl,
      language: language || undefined, // Auto-detect if not specified
      task: 'transcribe',
    })

    return {
      text: result.text || '',
      language: result.language || 'en',
      service: 'ai-gateway',
      // Note: confidence may not be available from all STT services
      segments: result.segments?.map((seg: any) => ({
        start: seg.start || 0,
        end: seg.end || 0,
        text: seg.text || '',
      })),
    }
  } catch (error) {
    console.error('[STT] Error transcribing audio:', error)
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        throw new Error(
          'Speech-to-text service is not available. ' +
          'Please ensure the AI Gateway service is running at ' + 
          (process.env.AI_GATEWAY_URL || 'http://localhost:8000') + 
          '. Start it with: docker-compose up ai-gateway (if using Docker) or check your AI_GATEWAY_URL configuration.'
        )
      }
      throw new Error(`Speech-to-text failed: ${error.message}`)
    }
    throw new Error(`Speech-to-text failed: ${String(error)}`)
  }
}

/**
 * Transcribe audio from file URL
 */
export async function transcribeFromUrl(
  audioUrl: string,
  language?: string
): Promise<STTResult> {
  return transcribeAudio(audioUrl, language)
}

