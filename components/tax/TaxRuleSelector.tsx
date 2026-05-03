'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'

interface TaxRule {
  id: string
  name: string
  taxType: string
  rate: number
  isExempt: boolean
}

interface TaxRuleSelectorProps {
  value?: string
  onChange: (taxRuleId: string) => void
  className?: string
  disabled?: boolean
  taxType?: string // Filter by tax type
  showExempt?: boolean // Show exemption rules
}

export function TaxRuleSelector({
  value,
  onChange,
  className = '',
  disabled = false,
  taxType,
  showExempt = true,
}: TaxRuleSelectorProps) {
  const { data, isLoading } = useQuery<{ rules: TaxRule[] }>({
    queryKey: ['tax-rules', taxType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (taxType) params.append('taxType', taxType)
      const res = await fetch(`/api/tax/rules?${params.toString()}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return { rules: [] }
      return res.json()
    },
  })

  const rules = data?.rules?.filter((rule) => {
    if (!showExempt && rule.isExempt) return false
    return true
  }) || []

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || isLoading}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <option value="">Select tax rule...</option>
      {rules.map((rule) => (
        <option key={rule.id} value={rule.id}>
          {rule.name} ({rule.taxType} {rule.isExempt ? 'Exempt' : `${rule.rate}%`})
        </option>
      ))}
      {rules.length === 0 && !isLoading && (
        <option value="" disabled>
          No tax rules available
        </option>
      )}
    </select>
  )
}
