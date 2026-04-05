// @ts-nocheck
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CustomSelect, CustomSelectTrigger, CustomSelectContent, CustomSelectItem } from '@/components/ui/custom-select'
import { PageLoading } from '@/components/ui/loading'
import { formatINR } from '@/lib/utils/formatINR'
import { useAuthStore } from '@/lib/stores/auth'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Users,
  FileText,
  CheckCircle2,
  Play,
  Save,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'

const STEPS = [
  { id: 1, title: 'Review summary', icon: FileText },
  { id: 2, title: 'Exclude & adjustments', icon: Users },
  { id: 3, title: 'Preview payslips', icon: FileText },
  { id: 4, title: 'Confirm & disburse', icon: CheckCircle2 },
]

const RUN_TYPES = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'OFF_CYCLE', label: 'Off-cycle' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'ARREARS', label: 'Arrears' },
]

export default function PayrollRunNewPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const token = useAuthStore((s) => s.token)
  const [step, setStep] = useState(1)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [runType, setRunType] = useState('REGULAR')
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set())
  const [includeArrears, setIncludeArrears] = useState(false)
  const [includeBonuses, setIncludeBonuses] = useState(false)
  const [createdCycleId, setCreatedCycleId] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')

  const { data: dashboard } = useQuery({
    queryKey: ['payroll-dashboard', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/dashboard', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    enabled: !!token,
  })

  const { data: cyclesData } = useQuery({
    queryKey: ['payroll-cycles', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/payroll/cycles?limit=24', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { cycles: [] }
      return res.json()
    },
    enabled: !!token,
  })

  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['hr-employees-payroll', tenantId],
    queryFn: async () => {
      const res = await fetch('/api/hr/employees?limit=500&status=ACTIVE', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { employees: [] }
      const j = await res.json()
      return { employees: j.employees ?? [] }
    },
    enabled: !!token && step >= 2,
  })

  const employees = employeesData?.employees ?? []
  const includedCount = employees.length - excludeIds.size
  const sampleEmployees = employees.filter((e) => !excludeIds.has(e.id)).slice(0, 3)

  const { data: sampleCalcs, isLoading: sampleLoading } = useQuery({
    queryKey: ['payroll-preview-sample', month, year, sampleEmployees.map((e) => e.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        sampleEmployees.map((emp) =>
          fetch('/api/hr/payroll/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              employeeId: emp.id,
              month,
              year,
            }),
          }).then((r) => (r.ok ? r.json() : null))
        )
      )
      return results.filter(Boolean)
    },
    enabled: !!token && step >= 3 && sampleEmployees.length > 0,
  })

  const createCycle = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/hr/payroll/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ month, year, runType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create cycle')
      }
      return res.json()
    },
    onSuccess: (data) => setCreatedCycleId(data.cycle?.id ?? null),
  })

  const generateRuns = useMutation({
    mutationFn: async () => {
      const cycleId = createdCycleId
      if (!cycleId) throw new Error('No cycle')
      const res = await fetch(`/api/hr/payroll/cycles/${cycleId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          excludeEmployeeIds: Array.from(excludeIds),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Generate failed')
      }
      return res.json()
    },
    onSuccess: () => {
      router.push(`/hr/${tenantId}/Payroll/Cycles`)
    },
  })

  const cycles = cyclesData?.cycles ?? []
  const existingCycleForPeriod = cycles.find(
    (c: { month: number; year: number; runType: string }) =>
      c.month === month && c.year === year && c.runType === runType
  )

  const ensureCycleAndProceed = async () => {
    if (createdCycleId) {
      setStep((s) => s + 1)
      return
    }
    if (existingCycleForPeriod?.id) {
      setCreatedCycleId(existingCycleForPeriod.id)
      setStep((s) => s + 1)
      return
    }
    try {
      const data = await createCycle.mutateAsync()
      const cid = data?.cycle?.id
      if (cid) setCreatedCycleId(cid)
      setStep((s) => s + 1)
    } catch {
      // If cycle already exists, use it
      const existing = cycles.find(
        (c: { month: number; year: number; runType: string }) =>
          c.month === month && c.year === year && c.runType === runType
      )
      if (existing?.id) {
        setCreatedCycleId(existing.id)
        setStep((s) => s + 1)
      }
    }
  }

  const [disburseResult, setDisburseResult] = useState<{ cycleId: string; totalAmount: number; count: number } | null>(null)
  const disburseMutation = useMutation({
    mutationFn: async () => {
      const cid = createdCycleId
      if (!cid) throw new Error('No cycle')
      const res = await fetch('/api/hr/payroll/bulk-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cycleId: cid }),
      })
      if (!res.ok) throw new Error('Disburse failed')
      return res.json()
    },
    onSuccess: (data) => setDisburseResult(data),
  })

  const handleProcessNow = () => {
    if (!createdCycleId) {
      createCycle.mutate(undefined, {
        onSuccess: (data) => {
          const cid = data.cycle?.id
          if (cid) {
            setCreatedCycleId(cid)
            generateRuns.mutate(
              {},
              {
                onSuccess: () => router.push(`/hr/${tenantId}/Payroll/Cycles`),
              }
            )
          }
        },
      })
      return
    }
    generateRuns.mutate({})
  }

  const grossEstimate = dashboard?.grossPayroll ?? 0
  const netEstimate = dashboard?.netPayroll ?? 0
  const employeeCount = dashboard?.employeeCount ?? employees.length

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Payroll`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Run Payroll</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            4-step wizard · Exclude employees · Off-cycle option
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-xl border text-sm ${
              step === s.id
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                : step > s.id
                  ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            <s.icon className="h-4 w-4" />
            <span>{s.title}</span>
            {step > s.id && <CheckCircle2 className="h-4 w-4" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Review summary</CardTitle>
            <CardDescription>
              Select period and run type. Summary is from salary structures and attendance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Month</Label>
                <CustomSelect
                  value={String(month)}
                  onValueChange={(v) => setMonth(parseInt(v, 10))}
                  placeholder="Month"
                >
                  <CustomSelectTrigger />
                  <CustomSelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <CustomSelectItem key={m} value={String(m)}>
                        {format(new Date(2000, m - 1, 1), 'MMMM')}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <Label>Year</Label>
                <CustomSelect
                  value={String(year)}
                  onValueChange={(v) => setYear(parseInt(v, 10))}
                  placeholder="Year"
                >
                  <CustomSelectTrigger />
                  <CustomSelectContent>
                    {[year, year - 1, year + 1].map((y) => (
                      <CustomSelectItem key={y} value={String(y)}>
                        {y}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div>
                <Label>Run type</Label>
                <CustomSelect value={runType} onValueChange={setRunType} placeholder="Type">
                  <CustomSelectTrigger />
                  <CustomSelectContent>
                    {RUN_TYPES.map((t) => (
                      <CustomSelectItem key={t.value} value={t.value}>
                        {t.label}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div>
                <p className="text-xs text-slate-500 uppercase">Employees</p>
                <p className="text-xl font-semibold">{employeeCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Gross (est.)</p>
                <p className="text-xl font-semibold">{formatINR(grossEstimate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Net (est.)</p>
                <p className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatINR(netEstimate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Pay date</p>
                <p className="text-xl font-semibold">
                  {format(new Date(year, month, 0), 'MMM d')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                onClick={ensureCycleAndProceed}
                disabled={createCycle.isPending}
              >
                Next: Exclude & adjustments <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Exclude & adjustments</CardTitle>
            <CardDescription>
              Exclude employees from this run; they can be processed later. Optional: include
              arrears or bonuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={includeArrears}
                  onCheckedChange={(v) => setIncludeArrears(!!v)}
                />
                <span className="text-sm">Include arrears</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={includeBonuses}
                  onCheckedChange={(v) => setIncludeBonuses(!!v)}
                />
                <span className="text-sm">Include bonuses</span>
              </label>
            </div>
            <p className="text-sm text-slate-500">
              Exclude from this run: {excludeIds.size} selected · {includedCount} included
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
              {employeesLoading ? (
                <div className="p-4 text-center text-slate-500">Loading employees...</div>
              ) : (
                employees.map((emp: { id: string; employeeCode: string; firstName: string; lastName: string }) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={excludeIds.has(emp.id)}
                      onCheckedChange={(checked) => {
                        setExcludeIds((prev) => {
                          const next = new Set(prev)
                          if (checked) next.add(emp.id)
                          else next.delete(emp.id)
                          return next
                        })
                      }}
                    />
                    <span className="text-sm font-medium">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="text-xs text-slate-500">{emp.employeeCode}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Next: Preview payslips <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Preview payslips (sample)</CardTitle>
            <CardDescription>First 3 included employees — gross, deductions, net</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleLoading ? (
              <div className="py-8 text-center text-slate-500">Calculating sample…</div>
            ) : (
              <div className="space-y-3">
                {(sampleCalcs ?? []).map((calc: any, i: number) => {
                  const emp = sampleEmployees[i]
                  return (
                    <div
                      key={emp?.id ?? i}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {emp?.firstName} {emp?.lastName}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                        <span className="text-slate-500">Gross</span>
                        <span className="text-slate-500">Deductions</span>
                        <span className="text-slate-500">Net</span>
                        <span className="font-medium">{formatINR(calc?.earnings?.gross ?? 0)}</span>
                        <span className="font-medium">{formatINR(calc?.deductions?.total ?? 0)}</span>
                        <span className="font-semibold text-emerald-600">
                          {formatINR(calc?.netPay ?? 0)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {sampleEmployees.length === 0 && (
                  <p className="text-sm text-slate-500">No employees in scope. Adjust exclusions in Step 2.</p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Next: Confirm & disburse <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Confirm & disburse</CardTitle>
            <CardDescription>
              Process now, schedule for pay date, or save as draft. Disbursal via PayAid Payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 space-y-2 text-sm">
              <p>
                <strong>Period:</strong> {format(new Date(year, month - 1, 1), 'MMMM yyyy')} ·{' '}
                {runType}
              </p>
              <p>
                <strong>Employees:</strong> {includedCount} (excluded: {excludeIds.size})
              </p>
              <p>
                <strong>Est. net:</strong> {formatINR(netEstimate)}
              </p>
            </div>
            {disburseResult && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-200">PayAid Payments payload ready</p>
                <p className="text-emerald-700 dark:text-emerald-300">Total: {formatINR(disburseResult.totalAmount)} · {disburseResult.count} employee(s). Send payload to PayAid bulk transfer API to complete disbursal.</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleProcessNow}
                disabled={generateRuns.isPending || createCycle.isPending}
                className="gap-2"
              >
                {createCycle.isPending || generateRuns.isPending ? (
                  'Processing…'
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Process Now
                  </>
                )}
              </Button>
              {createdCycleId && (
                <Button
                  variant="outline"
                  onClick={() => disburseMutation.mutate()}
                  disabled={disburseMutation.isPending}
                  className="gap-2"
                >
                  {disburseMutation.isPending ? 'Preparing…' : 'Disburse via PayAid'}
                </Button>
              )}
              <Button variant="outline" className="gap-2">
                <Clock className="h-4 w-4" />
                Schedule for {format(new Date(year, month, 0), 'MMM d')}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/hr/${tenantId}/Payroll/Cycles`)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!createdCycleId && step > 1 && (
        <p className="text-xs text-slate-500">
          Create cycle first in Step 1, or go back to create it.
        </p>
      )}
    </div>
  )
}
