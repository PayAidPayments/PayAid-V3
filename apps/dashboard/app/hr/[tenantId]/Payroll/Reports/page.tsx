'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileSpreadsheet, FileCheck, BarChart3, Users, Shield, Download } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'

export default function PayrollReportsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const token = useAuthStore((s) => s.token)
  const [ecrMonth, setEcrMonth] = useState(new Date().getMonth() + 1)
  const [ecrYear, setEcrYear] = useState(new Date().getFullYear())
  const [form16EmployeeId, setForm16EmployeeId] = useState('')
  const [form16FY, setForm16FY] = useState('2024-25')
  const [tallyCycleId, setTallyCycleId] = useState('')
  const [tallyDownloading, setTallyDownloading] = useState(false)

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
  const cycles = cyclesData?.cycles ?? []

  const { data: ecrData, isLoading: ecrLoading, refetch: refetchECR } = useQuery({
    queryKey: ['ecr-report', ecrMonth, ecrYear],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/reports/ecr?month=${ecrMonth}&year=${ecrYear}`)
      if (!response.ok) throw new Error('Failed to fetch ECR report')
      return response.json()
    },
    enabled: false, // Only fetch on button click
  })

  const { data: form16Data, isLoading: form16Loading, refetch: refetchForm16 } = useQuery({
    queryKey: ['form16-report', form16EmployeeId, form16FY],
    queryFn: async () => {
      const response = await fetch(
        `/api/hr/payroll/reports/form-16?employeeId=${form16EmployeeId}&financialYear=${form16FY}`
      )
      if (!response.ok) throw new Error('Failed to fetch Form 16')
      return response.json()
    },
    enabled: false, // Only fetch on button click
  })

  const reportCards = [
    {
      title: 'Payroll Register',
      description: 'Excel export — all employees, gross, deductions, net',
      icon: FileSpreadsheet,
      href: `/hr/${tenantId}/Payroll/Reports`,
      action: 'Export Excel',
    },
    {
      title: 'Statutory Reports',
      description: '24Q, ECR, ESI — generate and download',
      icon: FileCheck,
      href: null,
      action: 'See below',
    },
    {
      title: 'Cost Analysis',
      description: 'Fixed vs variable cost breakdown',
      icon: BarChart3,
      href: null,
      action: 'Coming soon',
    },
    {
      title: 'Employee Cost Breakdown',
      description: 'Per-employee cost and YTD',
      icon: Users,
      href: null,
      action: 'Coming soon',
    },
    {
      title: 'Compliance Audit Trail',
      description: 'Filing history and challan status',
      icon: Shield,
      href: `/hr/${tenantId}/Payroll/Compliance`,
      action: 'View',
    },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Payroll Reports</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Pre-built: Register, Statutory (24Q, ECR, ESI), Cost Analysis, Employee Cost, Compliance Audit
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCards.map((r) => (
          <Card
            key={r.title}
            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <r.icon className="h-4 w-4" />
                {r.title}
              </CardTitle>
              <CardDescription className="text-xs">{r.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {r.href ? (
                <Link href={r.href}>
                  <Button variant="outline" size="sm">{r.action}</Button>
                </Link>
              ) : (
                <span className="text-xs text-slate-500">{r.action}</span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tally Export */}
      <Card className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base dark:text-slate-100">Tally Export</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Download payroll journal entries for Tally (CSV or XML)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Payroll cycle</label>
            <select
              value={tallyCycleId}
              onChange={(e) => setTallyCycleId(e.target.value)}
              className="w-full min-w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select cycle</option>
              {cycles.map((c: { id: string; month: number; year: number }) => (
                <option key={c.id} value={c.id}>
                  {new Date(c.year, c.month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={!tallyCycleId || tallyDownloading}
            onClick={async () => {
              if (!tallyCycleId || !token) return
              setTallyDownloading(true)
              try {
                const res = await fetch(
                  `/api/hr/tally/export/payroll?cycleId=${tallyCycleId}&format=csv`,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                if (!res.ok) throw new Error('Export failed')
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `tally-payroll-${tallyCycleId}.csv`
                a.click()
                URL.revokeObjectURL(url)
              } finally {
                setTallyDownloading(false)
              }
            }}
          >
            {tallyDownloading ? 'Downloading…' : 'Download CSV'}
          </Button>
          <Button
            variant="outline"
            disabled={!tallyCycleId || tallyDownloading}
            onClick={async () => {
              if (!tallyCycleId || !token) return
              setTallyDownloading(true)
              try {
                const res = await fetch(
                  `/api/hr/tally/export/payroll?cycleId=${tallyCycleId}&format=xml`,
                  { headers: { Authorization: `Bearer ${token}` } }
                )
                if (!res.ok) throw new Error('Export failed')
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `tally-payroll-${tallyCycleId}.xml`
                a.click()
                URL.revokeObjectURL(url)
              } finally {
                setTallyDownloading(false)
              }
            }}
          >
            Download XML
          </Button>
        </CardContent>
      </Card>

      {/* ECR Report */}
      <Card className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
        <CardTitle className="text-base dark:text-slate-100">ECR (Electronic Challan cum Return)</CardTitle>
        <CardDescription className="dark:text-slate-400">Generate ECR file for EPFO submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                <select
                  value={ecrMonth}
                  onChange={(e) => setEcrMonth(parseInt(e.target.value))}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <Input
                  type="number"
                  value={ecrYear}
                  onChange={(e) => setEcrYear(parseInt(e.target.value))}
                  min={2020}
                  max={2100}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => refetchECR()} disabled={ecrLoading} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">
                  {ecrLoading ? 'Generating...' : 'Generate ECR'}
                </Button>
              </div>
            </div>

            {ecrData && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2 dark:text-gray-100">ECR Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Employees</div>
                    <div className="text-lg font-bold dark:text-gray-100">{ecrData.totalEmployees}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total EPF Contribution</div>
                    <div className="text-lg font-bold dark:text-gray-100">
                      ₹{ecrData.totalEPFContribution.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total EPS Contribution</div>
                    <div className="text-lg font-bold dark:text-gray-100">
                      ₹{ecrData.totalEPSContribution.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Remittance</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{ecrData.totalRemittance.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form 16 Report */}
      <Card className="rounded-2xl dark:bg-slate-900 dark:border-slate-800">
        <CardHeader>
        <CardTitle className="text-base dark:text-slate-100">Form 16</CardTitle>
        <CardDescription className="dark:text-slate-400">Generate Form 16 for employee tax filing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                <Input
                  type="text"
                  value={form16EmployeeId}
                  onChange={(e) => setForm16EmployeeId(e.target.value)}
                  placeholder="Enter employee ID"
                  className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Financial Year</label>
                <select
                  value={form16FY}
                  onChange={(e) => setForm16FY(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
                >
                  <option value="2024-25">2024-25</option>
                  <option value="2025-26">2025-26</option>
                  <option value="2026-27">2026-27</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => refetchForm16()}
                  disabled={form16Loading || !form16EmployeeId}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  {form16Loading ? 'Generating...' : 'Generate Form 16'}
                </Button>
              </div>
            </div>

            {form16Data && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2 dark:text-gray-100">Form 16 Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Employee</div>
                    <div className="text-lg font-bold dark:text-gray-100">{form16Data.employee.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">PAN: {form16Data.employee.pan}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Financial Year</div>
                    <div className="text-lg font-bold dark:text-gray-100">{form16Data.financialYear}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Gross Salary</div>
                    <div className="text-lg font-bold dark:text-gray-100">
                      ₹{form16Data.salaryDetails.grossSalary.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Taxable Income</div>
                    <div className="text-lg font-bold dark:text-gray-100">
                      ₹{form16Data.salaryDetails.taxableIncome.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Tax Deducted</div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      ₹{form16Data.taxDetails.totalTaxDeducted.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
