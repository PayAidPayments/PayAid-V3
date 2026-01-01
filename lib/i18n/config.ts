/**
 * Internationalization Configuration
 * Supports English and Hindi languages
 */

export const locales = ['en', 'hi'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिंदी (Hindi)',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  hi: '🇮🇳',
}

