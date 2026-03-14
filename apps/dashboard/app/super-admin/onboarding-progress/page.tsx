'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ClipboardList, AlertCircle } from 'lucide-react'

interface ProgressRecord {
  tenantId: string
  tenantName: string
  status: string
  kycStatus: string
  stepsCompleted: number
  stepsTotal: number
  blocker?: string
}

export default function SuperAdminOnboardingProgressPage() {
  const [records, setRecords] = useState<ProgressRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/onboarding')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      const data = (json.data || []).map((r: any) => {
        const stepsTotal = 5
        let stepsCompleted = 0
        if (r.kycStatus !== 'not_started') stepsCompleted++
        if (r.kycDocuments?.length) stepsCompleted++
        if (r.status === 'approved') stepsCompleted = stepsTotal
        else if (r.status === 'rejected') stepsCompleted = Math.min(stepsCompleted, 3)
        let blocker: string | undefined
        if (r.status === 'pending_review') blocker = 'Awaiting review'
        else if (r.kycStatus === 'not_started') blocker = 'KYC not started'
        else if (r.kycStatus === 'in_progress') blocker = 'KYC in progress'
        return {
          tenantId: r.tenantId,
          tenantName: r.tenant?.name || '—',
          status: r.status,
          kycStatus: r.kycStatus,
          stepsCompleted,
          stepsTotal,
          blocker,
        }
      })
      setRecords(data)
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const needsIntervention = records.filter((r) => r.blocker && r.status !== 'approved' && r.status !== 'rejected')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Progress</h1>
        <p className="text-muted-foreground">
          Step completion and blockers across all merchants
        </p>
      </div>

      {needsIntervention.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-5 w-5" />
              Needs attention ({needsIntervention.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsIntervention.slice(0, 10).map((r) => (
                <div key={r.tenantId} className="flex items-center justify-between text-sm">
                  <Link href={`/super-admin/onboarding/${r.tenantId}`} className="font-medium hover:underline">
                    {r.tenantName}
                  </Link>
                  <span className="text-muted-foreground">{r.blocker}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No onboarding records. Progress appears when tenants start onboarding.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((r) => (
                <div key={r.tenantId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Link href={`/super-admin/onboarding/${r.tenantId}`} className="font-medium hover:underline">
                      {r.tenantName}
                    </Link>
                    <span className="text-muted-foreground">
                      {r.stepsCompleted}/{r.stepsTotal} · {r.status}
                    </span>
                  </div>
                  <Progress value={(r.stepsCompleted / r.stepsTotal) * 100} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/super-admin/onboarding" className="hover:underline">Onboarding Queue</Link>
        {' · '}
        <Link href="/super-admin/onboarding-analytics" className="hover:underline">Analytics</Link>
      </p>
    </div>
  )
}
