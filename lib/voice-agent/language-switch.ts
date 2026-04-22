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
  hi: 'ठीक है, अब मैं हिंदी में बात करूंगा। कृपया बताइए, मैं आपकी कैसे मदद कर सकता हूँ?',
  en: 'Sure, I will continue in English. Please tell me how I can help you.',
  ta: 'சரி, இனிமேல் நான் தமிழில் பேசுகிறேன். தயவுசெய்து எப்படி உதவலாம் என்று சொல்லுங்கள்.',
  te: 'సరే, ఇక నుంచి నేను తెలుగులో మాట్లాడుతాను. దయచేసి నేను ఎలా సహాయం చేయాలో చెప్పండి.',
  kn: 'ಸರಿ, ಇನ್ನು ಮುಂದೆ ನಾನು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತೇನೆ. ದಯವಿಟ್ಟು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬೇಕು ಎಂದು ತಿಳಿಸಿ.',
  mr: 'ठीक आहे, आता मी मराठीत बोलेन. कृपया सांगा, मी तुम्हाला कशी मदत करू शकतो?',
  gu: 'બરાબર, હવે હું ગુજરાતી માં વાત કરીશ. કૃપા કરીને કહો, હું કેવી રીતે મદદ કરું?',
  pa: 'ਠੀਕ ਹੈ, ਹੁਣ ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗਾ। ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ, ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?',
  bn: 'ঠিক আছে, এখন থেকে আমি বাংলায় কথা বলব। অনুগ্রহ করে বলুন, আমি কীভাবে সাহায্য করতে পারি?',
  ml: 'ശരി, ഇനി ഞാൻ മലയാളത്തിൽ സംസാരിക്കും. ദയവായി പറയൂ, ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
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
