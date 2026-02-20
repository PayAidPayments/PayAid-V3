'use client'

import { CurrencyDisplay } from '@/components/currency/CurrencyDisplay'

interface TaxBreakdownItem {
  itemId?: string
  itemName?: string
  taxableAmount: number
  taxRate: number
  taxAmount: number
  taxType: string
}

interface TaxBreakdownProps {
  breakdown: TaxBreakdownItem[]
  taxByType: Record<string, number>
  totalTax: number
  currency: string
  className?: string
}

export function TaxBreakdown({
  breakdown,
  taxByType,
  totalTax,
  currency,
  className = '',
}: TaxBreakdownProps) {
  if (breakdown.length === 0 && totalTax === 0) {
    return null
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-sm font-semibold text-gray-700">Tax Breakdown</div>
      
      {/* Tax by Type Summary */}
      {Object.keys(taxByType).length > 0 && (
        <div className="space-y-1">
          {Object.entries(taxByType).map(([taxType, amount]) => (
            <div key={taxType} className="flex justify-between text-sm">
              <span className="text-gray-600">{taxType}:</span>
              <CurrencyDisplay amount={amount} currency={currency} />
            </div>
          ))}
        </div>
      )}

      {/* Detailed Breakdown */}
      {breakdown.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            View item-wise breakdown
          </summary>
          <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
            {breakdown.map((item, index) => (
              <div key={item.itemId || index} className="text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">{item.itemName || 'Item'}:</span>
                  <span className="text-gray-500">
                    {item.taxRate}% = <CurrencyDisplay amount={item.taxAmount} currency={currency} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Total Tax */}
      <div className="pt-2 border-t border-gray-200 flex justify-between font-semibold">
        <span>Total Tax:</span>
        <CurrencyDisplay amount={totalTax} currency={currency} />
      </div>
    </div>
  )
}
