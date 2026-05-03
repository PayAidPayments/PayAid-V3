export type SupportedCallLanguage = 'hi' | 'en' | 'ta' | 'te' | 'kn' | 'mr' | 'gu' | 'pa' | 'bn' | 'ml'

const SUPPORTED_LANGUAGES: SupportedCallLanguage[] = ['hi', 'en', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml']

const LANGUAGE_SWITCH_ALIASES: Record<SupportedCallLanguage, string[]> = {
  hi: ['hindi', 'हिंदी', 'हिन्दी', 'hin'],
  en: ['english', 'अंग्रेजी', 'inglish'],
  ta: ['tamil', 'தமிழ்', 'tamizh'],
  te: ['telugu', 'తెలుగు'],
  kn: ['kannada', 'ಕನ್ನಡ'],
  mr: ['marathi', 'मराठी'],
  gu: ['gujarati', 'ગુજરાતી'],
  pa: ['punjabi', 'ਪੰਜਾਬੀ', 'panjabi'],
  bn: ['bengali', 'বাংলা', 'bangla'],
  ml: ['malayalam', 'മലയാളം'],
}

const LANGUAGE_SWITCH_ACK: Record<SupportedCallLanguage, string> = {
  hi: 'ठीक है, अब हम हिंदी में बात करते हैं। बताइए, मैं कैसे मदद करूँ?',
  en: 'Sure, we can continue in English. Tell me, how can I help?',
  ta: 'சரி, இப்போ தமிழில் பேசலாம். சொல்லுங்க, நான் எப்படி உதவலாம்?',
  te: 'సరే, ఇక తెలుగులో మాట్లాడుకుందాం. చెప్పండి, నేను ఎలా సహాయం చేయాలి?',
  kn: 'ಸರಿ, ಇನ್ನು ಕನ್ನಡದಲ್ಲೇ ಮಾತಾಡೋಣ. ಹೇಳಿ, ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  mr: 'ठीक आहे, आता मराठीत बोलूया. सांगा, मी कशी मदत करू?',
  gu: 'બરાબર, હવે ગુજરાતી માં વાત કરીએ. કહો, હું કેવી રીતે મદદ કરું?',
  pa: 'ਠੀਕ ਹੈ, ਹੁਣ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਦੇ ਹਾਂ। ਦੱਸੋ, ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?',
  bn: 'ঠিক আছে, এখন বাংলা বলি। বলুন, আমি কীভাবে সাহায্য করব?',
  ml: 'ശരി, ഇനി മലയാളത്തിൽ സംസാരിക്കാം. പറയൂ, ഞാൻ എങ്ങനെ സഹായിക്കണം?',
}

export function normalizeLanguageCode(language?: string): SupportedCallLanguage {
  const normalized = (language || 'en').toLowerCase().trim()
  const base = normalized.includes('-') ? normalized.split('-')[0] : normalized
  if ((SUPPORTED_LANGUAGES as string[]).includes(base)) {
    return base as SupportedCallLanguage
  }
  return 'en'
}

export function toTwilioGatherLanguage(language: string): string {
  const normalized = normalizeLanguageCode(language)
  switch (normalized) {
    case 'hi':
      return 'hi-IN'
    case 'ta':
      return 'ta-IN'
    case 'te':
      return 'te-IN'
    case 'kn':
      return 'kn-IN'
    case 'mr':
      return 'mr-IN'
    case 'gu':
      return 'gu-IN'
    case 'pa':
      return 'pa-IN'
    case 'bn':
      return 'bn-IN'
    case 'ml':
      return 'ml-IN'
    default:
      return 'en-IN'
  }
}

export function detectRequestedLanguageSwitch(text: string, currentLanguage: string): SupportedCallLanguage | null {
  const normalizedText = (text || '').toLowerCase()
  const current = normalizeLanguageCode(currentLanguage)

  let bestMatch: { language: SupportedCallLanguage; index: number } | null = null
  for (const language of SUPPORTED_LANGUAGES) {
    for (const alias of LANGUAGE_SWITCH_ALIASES[language]) {
      const idx = normalizedText.indexOf(alias.toLowerCase())
      if (idx === -1) continue
      if (!bestMatch || idx < bestMatch.index) {
        bestMatch = { language, index: idx }
      }
    }
  }

  if (!bestMatch) return null
  if (bestMatch.language === current) return null
  return bestMatch.language
}

export function getLanguageSwitchAcknowledgement(language: string): string {
  return LANGUAGE_SWITCH_ACK[normalizeLanguageCode(language)]
}
