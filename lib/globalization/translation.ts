/**
 * Translation Framework
 * Multi-language support for PayAid
 */

import 'server-only'

export interface Translation {
  key: string
  language: string
  value: string
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    'invoice.title': 'Invoice',
    'invoice.number': 'Invoice Number',
    'invoice.date': 'Date',
    'contact.name': 'Contact Name',
    'deal.value': 'Deal Value',
  },
  hi: {
    'invoice.title': 'चालान',
    'invoice.number': 'चालान संख्या',
    'invoice.date': 'तारीख',
    'contact.name': 'संपर्क नाम',
    'deal.value': 'डील मूल्य',
  },
  ar: {
    'invoice.title': 'فاتورة',
    'invoice.number': 'رقم الفاتورة',
    'invoice.date': 'تاريخ',
    'contact.name': 'اسم جهة الاتصال',
    'deal.value': 'قيمة الصفقة',
  },
}

/**
 * Translate a key to target language
 */
export function translate(key: string, language: string = 'en'): string {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key
}

/**
 * Get all translations for a language
 */
export function getTranslations(language: string): Record<string, string> {
  return TRANSLATIONS[language] || TRANSLATIONS.en
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(TRANSLATIONS)
}

/**
 * Add custom translation
 */
export function addTranslation(
  key: string,
  language: string,
  value: string
): void {
  if (!TRANSLATIONS[language]) {
    TRANSLATIONS[language] = {}
  }
  TRANSLATIONS[language][key] = value
}
