'use client'

import { useEffect, useState } from 'react'
import { RevenueDashboard } from '@/components/super-admin/billing/RevenueDashboard'

interface RevenueData {
  mrr: number
  arr: number
  mrrGrowth: string
  churnRate: string
  paidTenants: number
  revenueByPlan: Record<string, number>
  topTenants: Array<{
    tenantId: string
    tenantName: string
    mrr: number
    tier: string
  }>
}

export default function SuperAdminBillingPage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/super-admin/billing')
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setData(j.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue & Billing</h1>
        <p className="text-muted-foreground">Platform billing overview</p>
      </div>
      <RevenueDashboard data={data} loading={loading} />
    </div>
  )
}
