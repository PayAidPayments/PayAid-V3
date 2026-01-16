/**
 * IndicParler-TTS Integration (Free Alternative)
 * Open-source TTS for Indian regional languages
 * 
 * GitHub: https://github.com/AI4Bharat/IndicParler-TTS
 * Model: indicparler/indicparler-tts
 * 
 * This is a free, self-hosted alternative to Bhashini TTS
 * Requires Python and the IndicParler-TTS library
 */

const INDICPARLER_API_URL = process.env.INDICPARLER_TTS_URL || 'http://localhost:7862'

// Supported languages
const SUPPORTED_LANGUAGES = [
  'hi', // Hindi
  'ta', // Tamil
  'te', // Telugu
  'kn', // Kannada
  'mr', // Marathi
  'gu', // Gujarati
  'pa', // Punjabi
  'bn', // Bengali
  'ml', // Malayalam
  'or', // Odia
  'as', // Assamese
  'en', // English
]

export interface IndicParlerTTSOptions {
  language: string
  voiceId?: string
  speed?: number
}

export interface IndicParlerTTSResponse {
  audioUrl: string
  audioData?: Buffer
  duration?: number
  format: string
}

/**
 * Check if IndicParler TTS service is available
 */
export async function isIndicParlerAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${INDICPARLER_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2 second timeout
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): boolean {
  return SUPPORTED_LANGUAGES.includes(language)
}

/**
 * Synthesize speech using IndicParler-TTS
 */
export async function synthesizeWithIndicParler(
  text: string,
  options: IndicParlerTTSOptions
): Promise<IndicParlerTTSResponse> {
  if (!isLanguageSupported(options.language)) {
    throw new Error(`Language ${options.language} is not supported by IndicParler-TTS`)
  }

  const isAvailable = await isIndicParlerAvailable()
  if (!isAvailable) {
    throw new Error('IndicParler-TTS service is not available. Start the service or use Bhashini TTS instead.')
  }

  try {
    console.log(`[IndicParler TTS] Synthesizing: "${text.substring(0, 50)}..." (lang: ${options.language})`)

    // Call IndicParler-TTS API
    const response = await fetch(`${INDICPARLER_API_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: options.language,
        voice: options.voiceId || 'default',
        speed: options.speed || 1.0,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`IndicParler TTS API error: ${errorData.message || response.statusText}`)
    }

    // IndicParler returns audio as base64 or binary
    const contentType = response.headers.get('content-type') || ''

    let audioData: Buffer
    let audioUrl: string

    if (contentType.includes('application/json')) {
      // JSON response with base64 audio
      const data = await response.json()
      if (data.audio_base64) {
        audioData = Buffer.from(data.audio_base64, 'base64')
        audioUrl = `data:audio/wav;base64,${data.audio_base64}`
      } else if (data.audio_url) {
        audioUrl = data.audio_url
        const audioResponse = await fetch(audioUrl)
        if (audioResponse.ok) {
          const arrayBuffer = await audioResponse.arrayBuffer()
          audioData = Buffer.from(arrayBuffer)
        } else {
          throw new Error('Failed to fetch audio from IndicParler TTS')
        }
      } else {
        throw new Error('IndicParler TTS API did not return audio data')
      }
    } else {
      // Binary audio response
      const arrayBuffer = await response.arrayBuffer()
      audioData = Buffer.from(arrayBuffer)
      audioUrl = `data:audio/wav;base64,${audioData.toString('base64')}`
    }

    console.log(`[IndicParler TTS] ✅ Success (${audioData.length} bytes)`)

    return {
      audioUrl,
      audioData,
      duration: undefined, // IndicParler may not provide duration
      format: 'wav',
    }
  } catch (error) {
    console.error('[IndicParler TTS] Error:', error)
    throw new Error(`IndicParler TTS failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

