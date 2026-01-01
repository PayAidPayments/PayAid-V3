/**
 * i18n Hooks for Client Components
 * Simple translation hook that can be used in client components
 */

import { useMemo } from 'react'

// Simple translation hook (can be enhanced with next-intl later)
export function useTranslation(locale: string = 'en') {
  const translations = useMemo(() => {
    try {
      // In a real implementation, this would load from messages/{locale}.json
      // For now, return a simple function that can be enhanced
      return require(`../../messages/${locale}.json`)
    } catch {
      return require('../../messages/en.json')
    }
  }, [locale])

  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.')
    let value: any = translations

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) return key
    }

    if (typeof value !== 'string') return key

    // Simple parameter replacement
    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(`{{${param}}}`, String(val)),
        value
      )
    }

    return value
  }

  return { t, locale }
}

