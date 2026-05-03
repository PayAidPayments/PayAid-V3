'use client'

import { useEffect, useState } from 'react'
import { SystemHealthDashboard } from '@/components/super-admin/system/SystemHealthDashboard'

interface SystemHealthData {
  api: string
  db: string
  jobs?: string
  whatsapp?: string
  paymentGateway?: string
  uptime?: string
  avgLatency?: number
}

export default function SuperAdminSystemPage() {
  const [data, setData] = useState<SystemHealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/super-admin/system')
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setData(j.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Health & Logs</h1>
        <p className="text-muted-foreground">API, DB, queue, integrations</p>
      </div>
      <SystemHealthDashboard data={data} loading={loading} />
    </div>
  )
}
