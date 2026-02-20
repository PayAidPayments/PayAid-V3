'use client'

import {
  IndianRupee,
  DollarSign,
  Euro,
  PoundSterling,
  type LucideIcon,
} from 'lucide-react'

const CURRENCY_ICONS: Record<string, LucideIcon> = {
  INR: IndianRupee,
  USD: DollarSign,
  EUR: Euro,
  GBP: PoundSterling,
}

interface BillingIconProps {
  currency?: string | null
  className?: string
}

/**
 * Renders a currency-appropriate icon for Billing (₹ for INR, $ for USD, etc.).
 * Defaults to Indian Rupee when currency is missing or unknown.
 */
export function BillingIcon({ currency, className }: BillingIconProps) {
  const code = (currency || 'INR').toUpperCase()
  const Icon = CURRENCY_ICONS[code] ?? IndianRupee
  return <Icon className={className} />
}
