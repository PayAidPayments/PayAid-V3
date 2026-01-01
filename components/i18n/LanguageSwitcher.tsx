'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { localeNames, localeFlags, type Locale } from '@/lib/i18n/config'

interface LanguageSwitcherProps {
  currentLocale?: Locale
  onLocaleChange?: (locale: Locale) => void
}

export function LanguageSwitcher({ currentLocale = 'en', onLocaleChange }: LanguageSwitcherProps) {
  const [locale, setLocale] = useState<Locale>(currentLocale)

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    onLocaleChange?.(newLocale)
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Language:</span>
      <div className="flex gap-1 border rounded-md p-1">
        {(['en', 'hi'] as Locale[]).map((loc) => (
          <Button
            key={loc}
            variant={locale === loc ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleLocaleChange(loc)}
            className="text-sm"
          >
            <span className="mr-1">{localeFlags[loc]}</span>
            {localeNames[loc]}
          </Button>
        ))}
      </div>
    </div>
  )
}

