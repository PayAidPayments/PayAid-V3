'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageLoading } from '@/components/ui/loading'
import { formatINR } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'
import {
  FileCheck,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Shield,
} from 'lucide-react'

export default function PayrollCompliancePage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const token = useAuthStore((s) => s.token)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-dashboard', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    enabled: !!token,
  })

  if (isLoading) {
    return <PageLoading message="Loading compliance..." fullScreen={false} />
  }

  const compliance = data?.complianceSummary ?? {}
  const statusRow = (
    label: string,
    amount: number,
    ready: boolean,
    subLabel: string
  ) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0">
      <div className="flex items-center gap-3">
        {ready ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        )}
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-50">{label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subLabel}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-900 dark:text-slate-50">
          {amount > 0 ? formatINR(amount) : '—'}
        </p>
        <Badge variant={ready ? 'default' : 'secondary'} className="text-xs">
          {ready ? 'Ready' : 'Pending'}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Payroll`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Statutory Compliance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            TDS, PF, PT, ESI — file and pay all returns
          </p>
        </div>
      </div>

      {compliance.missingPanCount > 0 && (
        <Card className="rounded-2xl border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm">
              {compliance.missingPanCount} employee(s) missing PAN. Update in Employee records for
              Form 24Q.
            </span>
            <Link href={`/hr/${tenantId}/Employees`}>
              <Button variant="outline" size="sm">
                View Employees
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Status
            </CardTitle>
            <CardDescription>Current cycle statutory status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0">
            {statusRow(
              'TDS',
              0,
              compliance.tds?.form24QReady ?? false,
              'Form 24Q · e-filing'
            )}
            {statusRow(
              'PF',
              compliance.pf?.amount ?? 0,
              compliance.pf?.ecrFiled ?? false,
              'ECR · EPFO portal'
            )}
            {statusRow(
              'PT',
              compliance.pt?.amount ?? 0,
              compliance.pt?.challansReady ?? false,
              'State-wise challans'
            )}
            {statusRow(
              'ESI',
              compliance.esi?.amount ?? 0,
              compliance.esi?.returnReady ?? false,
              'Monthly return'
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              File & Pay
            </CardTitle>
            <CardDescription>One-click filing and challan downloads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full gap-2" size="lg">
              <FileCheck className="h-4 w-4" />
              File All Returns
            </Button>
            <Link href={`/hr/${tenantId}/Payroll/Reports`}>
              <Button variant="outline" className="w-full gap-2" size="lg">
                <Download className="h-4 w-4" />
                View Challans
              </Button>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
              ECR, Form 24Q, PT and ESI challans can be generated from Reports. Zero-cost
              integrations (Supabase + PayAid).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
