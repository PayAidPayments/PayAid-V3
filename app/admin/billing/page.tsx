'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AIBillingAdvisorCard } from '@/components/Admin/AIBillingAdvisorCard'

export default function AdminBillingPage() {
  const [billing, setBilling] = useState<{ plan: string; maxUsers: number; usage: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/billing')
      .then((r) => (r.ok ? r.json() : { data: null }))
      .then((j) => setBilling(j.data ?? null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Plan, usage, invoices</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <p className="text-sm">
              Plan: <strong>{billing?.plan ?? 'free'}</strong> · Users: {billing?.usage ?? 0} / {billing?.maxUsers ?? 1}
            </p>
          )}
        </CardContent>
      </Card>
      <AIBillingAdvisorCard
        usagePct={billing ? (billing.usage / billing.maxUsers) * 100 : 0}
      />
    </div>
  )
}
