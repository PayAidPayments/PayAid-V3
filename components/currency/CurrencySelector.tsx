'use client'

import { SUPPORTED_CURRENCIES, CurrencyInfo } from '@/lib/currency/converter'

interface CurrencySelectorProps {
  value: string
  onChange: (currency: string) => void
  className?: string
  showSymbol?: boolean
  showCode?: boolean
  disabled?: boolean
}

export function CurrencySelector({
  value,
  onChange,
  className = '',
  showSymbol = true,
  showCode = true,
  disabled = false,
}: CurrencySelectorProps) {
  const currencies = Object.values(SUPPORTED_CURRENCIES)

  const formatCurrencyOption = (currency: CurrencyInfo) => {
    const parts: string[] = []
    if (showSymbol) parts.push(currency.symbol)
    parts.push(currency.name)
    if (showCode) parts.push(`(${currency.code})`)
    return parts.join(' ')
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {currencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {formatCurrencyOption(currency)}
        </option>
      ))}
    </select>
  )
}
