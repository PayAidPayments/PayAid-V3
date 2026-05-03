'use client'

import { useCallback, useState } from 'react'

export interface TenantDetails {
  id: string
  name: string
  subdomain: string | null
  status: string
  plan: string
  subscriptionTier: string
  licensedModules: string[]
  maxUsers: number
  maxContacts: number
  maxInvoices: number
  createdAt: string
  _count?: { users: number }
}

export function useTenantDetails(tenantId: string | null) {
  const [data, setData] = useState<TenantDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!tenantId) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/super-admin/tenants/${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch tenant')
      const json = await res.json()
      const out = json.data ?? json
      setData(out)
      return out
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  return { data, loading, error, fetchDetails }
}
