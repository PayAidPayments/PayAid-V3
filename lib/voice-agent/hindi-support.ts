/**
 * Hindi/Hinglish Language Support Utilities
 * Provides language detection, text processing, and voice configuration for Hindi/Hinglish
 */

export interface LanguageDetectionResult {
  isHindi: boolean
  isHinglish: boolean
  detectedLanguage: 'en' | 'hi' | 'hinglish'
  confidence: number
}

/**
 * Detect if text contains Hindi or Hinglish
 * Hindi Unicode range: \u0900-\u097F
 */
export function detectHindiOrHinglish(text: string): LanguageDetectionResult {
  // Hindi Unicode range: \u0900-\u097F
  const hindiPattern = /[\u0900-\u097F]/g
  const hindiMatches = text.match(hindiPattern) || []
  const hindiCharCount = hindiMatches.length
  const totalCharCount = text.replace(/\s/g, '').length
  
  // Calculate Hindi character percentage
  const hindiPercentage = totalCharCount > 0 ? (hindiCharCount / totalCharCount) * 100 : 0
  
  // Check for common Hinglish patterns (English + Hindi mix)
  const hasEnglish = /[a-zA-Z]/.test(text)
  const hasHindi = hindiCharCount > 0
  
  const isHinglish = hasEnglish && hasHindi && hindiPercentage > 10 && hindiPercentage < 90
  const isHindi = hindiPercentage >= 50
  
  let detectedLanguage: 'en' | 'hi' | 'hinglish' = 'en'
  if (isHinglish) {
    detectedLanguage = 'hinglish'
  } else if (isHindi) {
    detectedLanguage = 'hi'
  }
  
  return {
    isHindi,
    isHinglish,
    detectedLanguage,
    confidence: Math.max(hindiPercentage / 100, isHinglish ? 0.7 : 0)
  }
}

/**
 * Get language code for STT/TTS services
 * Maps our detection to service-specific language codes
 */
export function getLanguageCode(detection: LanguageDetectionResult): string {
  if (detection.isHinglish || detection.isHindi) {
    return 'hi' // Use Hindi for both Hindi and Hinglish
  }
  return 'en'
}

/**
 * Get TTS voice ID for language
 */
export function getTTSVoiceId(language: string): string | undefined {
  const voiceMap: Record<string, string> = {
    'hi': 'hi-IN', // Hindi voice
    'hinglish': 'hi-IN', // Use Hindi voice for Hinglish
    'en': 'en-US' // English voice
  }
  
  return voiceMap[language] || voiceMap['en']
}

/**
 * Normalize Hinglish text for better processing
 * Converts common Hinglish patterns to more standard forms
 */
export function normalizeHinglish(text: string): string {
  // Common Hinglish patterns that can be normalized
  // This is a basic implementation - can be enhanced with more patterns
  return text
    .replace(/\b(ka|ki|ke|ko|se|me|par|kaun|kya|kab|kahan|kyun)\b/gi, (match) => {
      // Preserve Hindi words in Hinglish context
      return match
    })
    .trim()
}

/**
 * Get language-specific prompt instructions
 */
export function getLanguagePrompt(language: string): string {
  const prompts: Record<string, string> = {
    'hi': 'आप हिंदी में बात कर रहे हैं। कृपया हिंदी में जवाब दें।',
    'hinglish': 'You are speaking in Hinglish (Hindi-English mix). Please respond naturally in Hinglish.',
    'en': 'You are speaking in English. Please respond in English.'
  }
  
  return prompts[language] || prompts['en']
}
