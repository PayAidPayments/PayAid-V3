'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { ArrowLeft, FileText, LayoutTemplate } from 'lucide-react'

const DATA_SOURCES = [
  { value: 'EMPLOYEES', label: 'Employees' },
  { value: 'PAYROLL', label: 'Payroll runs' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'LEAVES', label: 'Leave requests' },
  { value: 'REIMBURSEMENTS', label: 'Reimbursements' },
]

const COLUMN_OPTIONS: Record<string, string[]> = {
  EMPLOYEES: ['id', 'employeeCode', 'firstName', 'lastName', 'officialEmail', 'status', 'departmentId', 'joiningDate', 'ctcAnnualInr'],
  PAYROLL: ['netPayInr', 'grossEarningsInr', 'grossDeductionsInr', 'tdsInr', 'pfEmployeeInr', 'esiEmployeeInr', 'ptInr', 'employee.firstName', 'employee.lastName', 'employee.employeeCode', 'cycle.month', 'cycle.year', 'payoutStatus'],
  ATTENDANCE: ['id', 'employeeId', 'date', 'status', 'checkInTime', 'checkOutTime', 'workHours', 'source'],
  LEAVES: ['id', 'employeeId', 'leaveTypeId', 'startDate', 'endDate', 'days', 'status', 'reason'],
  REIMBURSEMENTS: ['id', 'employeeId', 'amount', 'status', 'expenseDate', 'description'],
}

export default function ReportBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dataSource, setDataSource] = useState('EMPLOYEES')
  const [columns, setColumns] = useState<string[]>(['employeeCode', 'firstName', 'lastName', 'status'])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [groupBy, setGroupBy] = useState<string[]>([])
  const [sortField, setSortField] = useState('')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC')

  const { data: templatesData } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const res = await fetch('/api/hr/reports/builder/templates', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return { templates: [] }
      return res.json()
    },
  })
  const templates = templatesData?.templates ?? []

  const applyTemplate = (t: { name: string; description?: string; dataSource: string; columns: string[]; sortBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }> }) => {
    setName(t.name)
    setDescription(t.description || '')
    setDataSource(t.dataSource)
    setColumns(t.columns)
    setSortField(t.sortBy?.[0]?.field || '')
    setSortDirection(t.sortBy?.[0]?.direction || 'ASC')
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const sortBy = sortField ? [{ field: sortField, direction: sortDirection }] : undefined
      const res = await fetch('/api/hr/reports/builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name || 'Untitled Report',
          description: description || null,
          dataSource,
          columns,
          filters: Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null && String(v).trim() !== '')),
          groupBy: groupBy.length > 0 ? groupBy : undefined,
          sortBy,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create report')
      }
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/hr/${tenantId}/Reports/builder/${data.report.id}`)
    },
  })

  const toggleColumn = (col: string) => {
    setColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    )
  }

  const availableColumns = COLUMN_OPTIONS[dataSource] || COLUMN_OPTIONS.EMPLOYEES

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/hr/${tenantId}/Reports`}>
          <Button variant="outline" size="icon" className="dark:border-gray-600 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create custom report</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure data source and columns</p>
        </div>
      </div>

      {templates.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-gray-100">
              <LayoutTemplate className="h-5 w-5" />
              Start from template
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Pre-filled report configs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map((t: { id: string; name: string; description?: string; dataSource: string; columns: string[]; sortBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }> }) => (
                <Button
                  key={t.id}
                  variant="outline"
                  size="sm"
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  onClick={() => applyTemplate(t)}
                >
                  {t.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Report details</CardTitle>
          <CardDescription className="dark:text-gray-400">Name and data source</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="dark:text-gray-300">Report name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly headcount"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
          </div>
          <div>
            <Label className="dark:text-gray-300">Data source</Label>
            <select
              value={dataSource}
              onChange={(e) => {
                setDataSource(e.target.value)
                setColumns([])
              }}
              className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
            >
              {DATA_SOURCES.map((ds) => (
                <option key={ds.value} value={ds.value}>
                  {ds.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Columns</CardTitle>
          <CardDescription className="dark:text-gray-400">Select fields to include (at least one)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableColumns.map((col) => (
              <label key={col} className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="checkbox"
                  checked={columns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm dark:text-gray-200">{col}</span>
              </label>
            ))}
          </div>
          {columns.length === 0 && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">Select at least one column.</p>
          )}
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Filters & options</CardTitle>
          <CardDescription className="dark:text-gray-400">Optional filters, group by, and sort</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataSource === 'EMPLOYEES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">Status</Label>
                <select
                  value={filters.status ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <Label className="dark:text-gray-300">Department ID</Label>
                <Input
                  value={filters.departmentId ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value || undefined }))}
                  placeholder="Filter by department"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>
          )}
          {dataSource === 'ATTENDANCE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">From date</Label>
                <Input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">To date</Label>
                <Input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>
          )}
          {(dataSource === 'LEAVES' || dataSource === 'REIMBURSEMENTS') && (
            <div>
              <Label className="dark:text-gray-300">Status</Label>
              <select
                value={filters.status ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                className="mt-1 w-full rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2 max-w-xs"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          )}
          {dataSource === 'PAYROLL' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="dark:text-gray-300">Month (1–12)</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={filters.month ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value || undefined }))}
                  placeholder="e.g. 3"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              <div>
                <Label className="dark:text-gray-300">Year</Label>
                <Input
                  type="number"
                  value={filters.year ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value || undefined }))}
                  placeholder="e.g. 2025"
                  className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-600">
            <div>
              <Label className="dark:text-gray-300">Group by (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableColumns.map((col) => (
                  <label key={col} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={groupBy.includes(col)}
                      onChange={() => setGroupBy((prev) => prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col])}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm dark:text-gray-200">{col}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-gray-300">Sort by (optional)</Label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
                >
                  <option value="">None</option>
                  {availableColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'ASC' | 'DESC')}
                  className="rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3 py-2"
                >
                  <option value="ASC">Asc</option>
                  <option value="DESC">Desc</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || columns.length === 0}
          className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          {createMutation.isPending ? 'Creating...' : 'Create report'}
        </Button>
        <Link href={`/hr/${tenantId}/Reports`}>
          <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">Cancel</Button>
        </Link>
      </div>
    </div>
  )
}
