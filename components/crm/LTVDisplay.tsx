'use client'

import React from 'react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface LTVDisplayProps {
  ltv: number
  currency?: string
}

export function LTVDisplay({ ltv, currency = 'INR' }: LTVDisplayProps) {
  return (
    <div className="text-lg font-semibold">
      {currency === 'INR' ? formatINRForDisplay(ltv) : `$${ltv.toLocaleString()}`}
    </div>
  )
}
