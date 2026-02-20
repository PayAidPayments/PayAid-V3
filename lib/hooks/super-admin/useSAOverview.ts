'use client'

import { useCallback, useState } from 'react'

export interface SAOverviewStats {
  totalTenants: number
  activeTenants: number
  tenantsThisWeek?: number
  mau: number
  mauGrowth?: string
  mrr?: number
  mrrGrowth?: string
  arr: number
  churnRate?: string
  aiUsageCount: number
  revenueSources?: {
    card: number
    bank: number
    whatsapp: number
    total: number
  }
  merchantHealth?: {
    newThisWeek: number
    atRisk: number
    highVolume: number
    failedPaymentRate: string
  }
  platformHealth?: {
    apiUptime: number
    whatsappMessages: number
    aiCalls: number
    criticalAlerts: number
  }
  recentActivity?: Array<{
    type: string
    id: string
    name?: string
    email?: string
    tenant?: string
    tier?: string | null
    timestamp: string
  }>
}

export function useSAOverview() {
  const [data, setData] = useState<SAOverviewStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/super-admin/overview')
      if (!res.ok) {
        let errorData: any = { error: `HTTP ${res.status}` }
        try {
          const json = await res.json()
          errorData = json || errorData
        } catch (e) {
          console.error('[useSAOverview] Failed to parse error response:', e)
        }
        console.error('[useSAOverview] API error:', res.status, errorData)
        const errorMessage = (errorData && typeof errorData === 'object' && errorData.error) 
          ? errorData.error 
          : `Failed to fetch overview: ${res.status}`
        throw new Error(errorMessage)
      }
      const json = await res.json()
      console.log('[useSAOverview] Received data:', json)
      const overviewData = json.data ?? json
      setData(overviewData)
      return overviewData
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch'
      console.error('[useSAOverview] Fetch error:', e)
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchStats }
}
