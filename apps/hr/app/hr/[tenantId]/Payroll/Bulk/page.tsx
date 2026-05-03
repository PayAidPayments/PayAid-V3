'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Users, TrendingUp, Calendar, Receipt } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINR } from '@/lib/utils/formatINR'

export default function PayrollBulkPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.tenantId as string
  const token = useAuthStore((s) => s.token)
  const [action, setAction] = useState<'salary_revision' | 'lop' | 'arrears'>('salary_revision')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [revisions, setRevisions] = useState<Record<string, number>>({})

  const { data: employeesData } = useQuery({
    queryKey: ['hr-employees-bulk', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=500&status=ACTIVE', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { employees: [] }
      return res.json()
    },
    enabled: !!token,
  })

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/hr/payroll/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action,
          employeeIds: Array.from(selectedIds),
          payload: action === 'salary_revision' ? { revisions: Object.entries(revisions).map(([employeeId, newCtc]) => ({ employeeId, newCtc })) } : undefined,
        }),
      })
      if (!res.ok) throw new Error('Bulk action failed')
      return res.json()
    },
    onSuccess: () => {
      setSelectedIds(new Set())
      setRevisions({})
    },
  })

  const employees = employeesData?.employees ?? []

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Payroll`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Bulk Wizard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Mass salary revision, LWP, arrears — one screen for bulk operations
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        {[
          { id: 'salary_revision' as const, label: 'Salary revision', icon: TrendingUp },
          { id: 'lop' as const, label: 'Loss of pay', icon: Calendar },
          { id: 'arrears' as const, label: 'Arrears', icon: Receipt },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAction(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              action === tab.id
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Select employees ({selectedIds.size} selected)
          </CardTitle>
          <CardDescription>
            {action === 'salary_revision' && 'Set new CTC per employee. Run payroll after to apply.'}
            {action === 'lop' && 'LWP is computed from attendance in each Payroll Run.'}
            {action === 'arrears' && 'Include arrears in the next Payroll Run (toggle in wizard).'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
            {employees.map((emp: { id: string; employeeCode: string; firstName: string; lastName: string; ctcAnnualInr?: number }) => (
              <div key={emp.id} className="flex items-center gap-4 px-4 py-2">
                <Checkbox
                  checked={selectedIds.has(emp.id)}
                  onCheckedChange={(c) => {
                    setSelectedIds((s) => {
                      const next = new Set(s)
                      if (c) next.add(emp.id)
                      else next.delete(emp.id)
                      return next
                    })
                  }}
                />
                <span className="text-sm font-medium">{emp.firstName} {emp.lastName}</span>
                <span className="text-xs text-slate-500">{emp.employeeCode}</span>
                {action === 'salary_revision' && selectedIds.has(emp.id) && (
                  <div className="ml-auto flex items-center gap-2">
                    <Label className="text-xs">New CTC (₹/yr)</Label>
                    <Input
                      type="number"
                      className="w-28 h-8 text-sm"
                      placeholder={emp.ctcAnnualInr?.toString() ?? ''}
                      value={revisions[emp.id] ?? ''}
                      onChange={(e) => setRevisions((r) => ({ ...r, [emp.id]: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => bulkMutation.mutate()}
              disabled={selectedIds.size === 0 || bulkMutation.isPending}
            >
              {bulkMutation.isPending ? 'Processing…' : 'Apply'}
            </Button>
            {bulkMutation.data && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">{bulkMutation.data.message}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
