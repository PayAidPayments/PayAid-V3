/**
 * Internationalization Configuration
 * Supports English and Hindi languages
 */

export const locales = ['en', 'hi', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'pt', 'it', 'ru', 'ko'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  de: 'Deutsch (German)',
  ar: 'العربية (Arabic)',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
  pt: 'Português (Portuguese)',
  it: 'Italiano (Italian)',
  ru: 'Русский (Russian)',
  ko: '한국어 (Korean)',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ar: '🇸🇦',
  zh: '🇨🇳',
  ja: '🇯🇵',
  pt: '🇵🇹',
  it: '🇮🇹',
  ru: '🇷🇺',
  ko: '🇰🇷',
}

