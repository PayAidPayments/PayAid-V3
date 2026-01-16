/**
 * Bhashini TTS Integration
 * Supports Indian regional languages: hi, ta, te, kn, mr, gu, pa, bn, ml, or, as, ne, etc.
 * 
 * API Documentation: https://www.bhashini.ai/tts
 * Get API Key: https://pay.bhashini.ai/services/bhashini-o1esd
 */

const BHASHINI_API_URL = 'https://tts-api.bhashini.ai/v1/synthesize'
const BHASHINI_API_KEY = process.env.BHASHINI_API_KEY || ''

// Language code mapping (ISO 639-1 to Bhashini language codes)
const LANGUAGE_MAP: Record<string, string> = {
  'hi': 'hi', // Hindi
  'ta': 'ta', // Tamil
  'te': 'te', // Telugu
  'kn': 'kn', // Kannada
  'mr': 'mr', // Marathi
  'gu': 'gu', // Gujarati
  'pa': 'pa', // Punjabi
  'bn': 'bn', // Bengali
  'ml': 'ml', // Malayalam
  'or': 'or', // Odia
  'as': 'as', // Assamese
  'ne': 'ne', // Nepali
  'ur': 'ur', // Urdu
}

// Available voices per language
const VOICE_OPTIONS: Record<string, string[]> = {
  'hi': ['hi-IN-Standard-A', 'hi-IN-Standard-B', 'hi-IN-Standard-C', 'hi-IN-Standard-D'],
  'ta': ['ta-IN-Standard-A', 'ta-IN-Standard-B'],
  'te': ['te-IN-Standard-A', 'te-IN-Standard-B'],
  'kn': ['kn-IN-Standard-A', 'kn-IN-Standard-B'],
  'mr': ['mr-IN-Standard-A', 'mr-IN-Standard-B'],
  'gu': ['gu-IN-Standard-A', 'gu-IN-Standard-B'],
  'pa': ['pa-IN-Standard-A', 'pa-IN-Standard-B'],
  'bn': ['bn-IN-Standard-A', 'bn-IN-Standard-B'],
  'ml': ['ml-IN-Standard-A', 'ml-IN-Standard-B'],
  'or': ['or-IN-Standard-A'],
  'as': ['as-IN-Standard-A'],
  'ne': ['ne-IN-Standard-A'],
  'ur': ['ur-IN-Standard-A'],
}

export interface BhashiniTTSOptions {
  language: string
  voiceId?: string
  speed?: number
  pitch?: number
  volume?: number
}

export interface BhashiniTTSResponse {
  audioUrl: string
  audioData?: Buffer
  duration?: number
  format: string
}

/**
 * Check if Bhashini TTS is configured
 */
export function isBhashiniConfigured(): boolean {
  return !!BHASHINI_API_KEY && BHASHINI_API_KEY.length > 0
}

/**
 * Check if a language is supported by Bhashini
 */
export function isLanguageSupported(language: string): boolean {
  return language in LANGUAGE_MAP
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: string): string[] {
  const langCode = LANGUAGE_MAP[language]
  if (!langCode) return []
  return VOICE_OPTIONS[langCode] || []
}

/**
 * Synthesize speech using Bhashini TTS API
 */
export async function synthesizeWithBhashini(
  text: string,
  options: BhashiniTTSOptions
): Promise<BhashiniTTSResponse> {
  if (!isBhashiniConfigured()) {
    throw new Error('Bhashini API key not configured. Set BHASHINI_API_KEY in .env')
  }

  const langCode = LANGUAGE_MAP[options.language]
  if (!langCode) {
    throw new Error(`Language ${options.language} is not supported by Bhashini TTS`)
  }

  // Get voice ID (default to first available voice for the language)
  const availableVoices = getAvailableVoices(options.language)
  const voiceId = options.voiceId || availableVoices[0] || `${langCode}-IN-Standard-A`

  try {
    console.log(`[Bhashini TTS] Synthesizing: "${text.substring(0, 50)}..." (lang: ${langCode}, voice: ${voiceId})`)

    // Call Bhashini TTS API
    const response = await fetch(BHASHINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BHASHINI_API_KEY}`,
      },
      body: JSON.stringify({
        text: text,
        language: langCode,
        voice: voiceId,
        speed: options.speed || 1.0,
        pitch: options.pitch || 0,
        volume: options.volume || 1.0,
        format: 'wav', // or 'mp3'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(`Bhashini TTS API error: ${errorData.message || response.statusText}`)
    }

    // Bhashini returns audio as base64 or URL
    const data = await response.json()

    // Handle different response formats
    let audioData: Buffer | undefined
    let audioUrl: string

    if (data.audio_base64) {
      // Base64 encoded audio
      audioData = Buffer.from(data.audio_base64, 'base64')
      audioUrl = `data:audio/wav;base64,${data.audio_base64}`
    } else if (data.audio_url) {
      // URL to audio file
      audioUrl = data.audio_url
      // Fetch the audio file
      const audioResponse = await fetch(audioUrl)
      if (audioResponse.ok) {
        const arrayBuffer = await audioResponse.arrayBuffer()
        audioData = Buffer.from(arrayBuffer)
      }
    } else if (data.audio) {
      // Direct audio data
      audioData = Buffer.from(data.audio, 'base64')
      audioUrl = `data:audio/wav;base64,${data.audio}`
    } else {
      throw new Error('Bhashini TTS API did not return audio data')
    }

    console.log(`[Bhashini TTS] ✅ Success (${audioData?.length || 0} bytes)`)

    return {
      audioUrl,
      audioData,
      duration: data.duration,
      format: data.format || 'wav',
    }
  } catch (error) {
    console.error('[Bhashini TTS] Error:', error)
    throw new Error(`Bhashini TTS failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Test Bhashini TTS connection
 */
export async function testBhashiniConnection(): Promise<boolean> {
  if (!isBhashiniConfigured()) {
    return false
  }

  try {
    // Test with a simple Hindi text
    await synthesizeWithBhashini('नमस्ते', {
      language: 'hi',
      speed: 1.0,
    })
    return true
  } catch (error) {
    console.error('[Bhashini TTS] Connection test failed:', error)
    return false
  }
}

