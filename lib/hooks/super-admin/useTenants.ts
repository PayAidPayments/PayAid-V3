'use client'

import { useCallback, useState } from 'react'

export interface TenantRow {
  id: string
  name: string
  subdomain: string | null
  status: string
  subscriptionTier: string
  licensedModules: string[]
  maxUsers: number
  createdAt: string
  _count?: { users: number }
}

export function useTenants() {
  const [data, setData] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/super-admin/tenants')
      if (!res.ok) throw new Error('Failed to fetch tenants')
      const json = await res.json()
      const list = json.data ?? json.tenants ?? json
      setData(Array.isArray(list) ? list : [])
      return list
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchTenants }
}
