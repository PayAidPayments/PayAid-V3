/**
 * Text-to-Speech Service
 * Multi-provider TTS with automatic routing:
 * - Coqui TTS (via AI Gateway) for English/Hindi
 * - Bhashini TTS for Indian regional languages (paid, high quality)
 * - IndicParler-TTS for Indian regional languages (free, self-hosted)
 */

import { aiGateway } from '@/lib/ai/gateway'
import { 
  synthesizeWithBhashini, 
  isBhashiniConfigured, 
  isLanguageSupported as isBhashiniLanguageSupported,
  getAvailableVoices as getBhashiniVoices
} from './bhashini-tts'
import { 
  synthesizeWithIndicParler, 
  isIndicParlerAvailable, 
  isLanguageSupported as isIndicParlerLanguageSupported 
} from './indicparler-tts'

export interface TTSOptions {
  language?: string
  voiceId?: string
  speed?: number
}

// Regional Indian languages (use Bhashini or IndicParler)
// Note: Hindi (hi) and English (en) are NOT in this list - they use Coqui XTTS v2
const REGIONAL_LANGUAGES = ['ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml', 'or', 'as', 'ne', 'ur']

// Languages that use Coqui XTTS v2 (best quality for these languages)
const COQUI_LANGUAGES = ['en', 'hi']

/**
 * Synthesize speech from text with automatic provider selection
 * 
 * Routing Strategy:
 * - English (en) & Hindi (hi) → Coqui XTTS v2 (via AI Gateway)
 * - Regional languages (ta, te, kn, etc.) → Bhashini TTS (paid) or IndicParler-TTS (free)
 */
export async function synthesizeSpeech(
  text: string,
  language: string = 'en',
  voiceId?: string,
  speed: number = 1.0
): Promise<Buffer> {
  // Use Coqui XTTS v2 for English and Hindi (best quality)
  if (COQUI_LANGUAGES.includes(language)) {
    console.log(`[TTS] Using Coqui XTTS v2 for ${language}`)
    return await synthesizeWithCoqui(text, language, voiceId, speed)
  }

  // Use Bhashini (paid) or IndicParler (free) for regional languages
  if (REGIONAL_LANGUAGES.includes(language)) {
    return await synthesizeRegionalLanguage(text, language, voiceId, speed)
  }

  // Fallback: Use Coqui for any other language
  console.log(`[TTS] Using Coqui XTTS v2 (fallback) for ${language}`)
  return await synthesizeWithCoqui(text, language, voiceId, speed)
}

/**
 * Synthesize regional language using Bhashini or IndicParler
 */
async function synthesizeRegionalLanguage(
  text: string,
  language: string,
  voiceId?: string,
  speed: number = 1.0
): Promise<Buffer> {
  // Try Bhashini first (if configured)
  if (isBhashiniConfigured() && isBhashiniLanguageSupported(language)) {
    try {
      console.log(`[TTS] Using Bhashini for ${language}`)
      const result = await synthesizeWithBhashini(text, {
        language,
        voiceId,
        speed,
      })
      if (result.audioData) {
        return result.audioData
      }
      // If no audioData but we have URL, fetch it
      if (result.audioUrl && result.audioUrl.startsWith('http')) {
        const response = await fetch(result.audioUrl)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          return Buffer.from(arrayBuffer)
        }
      }
    } catch (error) {
      console.warn(`[TTS] Bhashini failed, trying IndicParler:`, error)
      // Fall through to IndicParler
    }
  }

  // Try IndicParler (free alternative)
  if (isIndicParlerLanguageSupported(language)) {
    try {
      const isAvailable = await isIndicParlerAvailable()
      if (isAvailable) {
        console.log(`[TTS] Using IndicParler for ${language}`)
        const result = await synthesizeWithIndicParler(text, {
          language,
          voiceId,
          speed,
        })
        if (result.audioData) {
          return result.audioData
        }
        // If no audioData but we have URL, fetch it
        if (result.audioUrl && result.audioUrl.startsWith('http')) {
          const response = await fetch(result.audioUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            return Buffer.from(arrayBuffer)
          }
        }
      }
    } catch (error) {
      console.warn(`[TTS] IndicParler failed, falling back to Coqui:`, error)
      // Fall through to Coqui
    }
  }

  // Fallback to Coqui TTS
  console.log(`[TTS] Using Coqui (fallback) for ${language}`)
  return await synthesizeWithCoqui(text, language, voiceId, speed)
}

/**
 * Synthesize with Coqui XTTS v2 (via AI Gateway)
 * 
 * Model: tts_models/multilingual/multi-dataset/xtts_v2
 * Best quality for English and Hindi
 */
async function synthesizeWithCoqui(
  text: string,
  language: string,
  voiceId?: string,
  speed: number = 1.0
): Promise<Buffer> {
  try {
    // Call AI Gateway TTS service
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
        // In production, this should be handled differently
        // For now, we'll need to read from the file system
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
  } catch (error) {
    console.error('[TTS] Error synthesizing speech with Coqui:', error)
    throw new Error(`Text-to-speech failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: string): string[] {
  // Try to get voices from Bhashini first
  if (isBhashiniConfigured() && isBhashiniLanguageSupported(language)) {
    const bhashiniVoices = getBhashiniVoices(language)
    if (bhashiniVoices.length > 0) {
      return bhashiniVoices
    }
  }

  // Fallback to default voices
  const voices: Record<string, string[]> = {
    hi: ['hi_female', 'hi_male', 'hi-IN-Standard-A', 'hi-IN-Standard-B'],
    en: ['en_female', 'en_male', 'en_female_1', 'en_male_1'],
    ta: ['ta_female', 'ta_male', 'ta-IN-Standard-A', 'ta-IN-Standard-B'],
    te: ['te_female', 'te_male', 'te-IN-Standard-A', 'te-IN-Standard-B'],
    kn: ['kn_female', 'kn_male', 'kn-IN-Standard-A', 'kn-IN-Standard-B'],
    mr: ['mr_female', 'mr_male', 'mr-IN-Standard-A', 'mr-IN-Standard-B'],
    gu: ['gu_female', 'gu_male', 'gu-IN-Standard-A', 'gu-IN-Standard-B'],
    pa: ['pa_female', 'pa_male', 'pa-IN-Standard-A', 'pa-IN-Standard-B'],
    bn: ['bn_female', 'bn_male', 'bn-IN-Standard-A', 'bn-IN-Standard-B'],
    ml: ['ml_female', 'ml_male', 'ml-IN-Standard-A', 'ml-IN-Standard-B'],
    or: ['or-IN-Standard-A'],
    as: ['as-IN-Standard-A'],
    ne: ['ne-IN-Standard-A'],
    ur: ['ur-IN-Standard-A'],
  }

  return voices[language] || voices['en']
}

