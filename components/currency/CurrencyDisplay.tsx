'use client'

import { formatCurrency, getCurrencyInfo } from '@/lib/currency/converter'

interface CurrencyDisplayProps {
  amount: number
  currency: string
  showSymbol?: boolean
  showCode?: boolean
  className?: string
  exchangeRate?: number
  baseCurrency?: string
}

export function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  showCode = false,
  className = '',
  exchangeRate,
  baseCurrency,
}: CurrencyDisplayProps) {
  const currencyInfo = getCurrencyInfo(currency)
  const formattedAmount = currencyInfo
    ? amount.toFixed(currencyInfo.decimals)
    : amount.toFixed(2)

  const displayText = showSymbol && currencyInfo
    ? `${currencyInfo.symbol}${formattedAmount}`
    : `${formattedAmount} ${currency}`

  return (
    <span className={className}>
      {displayText}
      {showCode && currencyInfo && (
        <span className="text-gray-500 ml-1">({currencyInfo.code})</span>
      )}
      {exchangeRate && baseCurrency && baseCurrency !== currency && (
        <span className="text-xs text-gray-500 ml-2">
          ≈ {formatCurrency(amount * exchangeRate, baseCurrency)} @ {exchangeRate.toFixed(4)}
        </span>
      )}
    </span>
  )
}
