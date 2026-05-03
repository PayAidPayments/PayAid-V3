'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'

type ComplianceReport = {
  totals: number
  compliant: number
  complianceScore: number
  blockedItcAmount: number
  blockedReturns: number
  overdueExports: number
}

export default function FinanceCompliancePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const token = useAuthStore.getState().token
      const res = await fetch('/api/finance/compliance/report', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      const data = await res.json()
      setReport(data)
      setLoading(false)
    }
    run().catch(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Finance Compliance Reports</h1>
            <p className="text-sm text-slate-500">GST 2026, ITC and EXIM deadline tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/settings/${tenantId}/Billing#finance-compliance`}>
              <Button variant="ghost">Configure GSP/IRP Keys</Button>
            </Link>
            <Link href={`/finance/${tenantId}/GST`}>
              <Button variant="outline">Back to GST</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card><CardHeader><CardTitle className="text-sm">Compliance Score</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{loading ? '--' : `${report?.complianceScore ?? 0}%`}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Blocked ITC</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{loading ? '--' : formatINRForDisplay(report?.blockedItcAmount ?? 0)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Blocked Returns</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{loading ? '--' : (report?.blockedReturns ?? 0)}</CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Overdue Exports</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{loading ? '--' : (report?.overdueExports ?? 0)}</CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ITC Status Report</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-300">
            {loading
              ? 'Loading report...'
              : `${report?.compliant ?? 0} of ${report?.totals ?? 0} invoices are in matched/claimed ITC state.`}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
