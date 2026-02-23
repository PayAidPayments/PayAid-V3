'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'

interface PayrollRun {
  id: string
  grossEarningsInr: number
  grossDeductionsInr: number
  tdsInr: number
  pfEmployeeInr: number
  esiEmployeeInr: number
  ptInr: number
  lopDays: number
  lopAmountInr: number
  netPayInr: number
  daysPaid: number
  payoutStatus: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
  }
}

interface PayrollCycle {
  id: string
  month: number
  year: number
  status: string
  runType: string
  payrollRuns: PayrollRun[]
  _count: {
    payrollRuns: number
  }
  createdAt: string
}

export default function PayrollCycleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string

  const { data: cycle, isLoading, refetch } = useQuery<PayrollCycle>({
    queryKey: ['payroll-cycle', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/cycles/${id}`)
      if (!response.ok) throw new Error('Failed to fetch payroll cycle')
      return response.json()
    },
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/cycles/${id}/generate`, {
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate payroll')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    anomalies?: Array<{ type: string; severity: string; message: string; suggestion?: string }>
    statutoryChecks?: Array<{ name: string; passed: boolean; message: string }>
    correctionSuggestions?: string[]
    summary: Record<string, unknown>
  } | null>(null)

  const validateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/cycles/${id}/validate`)
      if (!response.ok) throw new Error('Validation failed')
      return response.json()
    },
    onSuccess: (data) => {
      setValidationResult(data)
    },
  })

  const processMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/cycles/${id}/process`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || data.message || 'Process failed')
      return data
    },
    onSuccess: (data) => {
      if (data.validation) setValidationResult(data.validation)
      refetch()
    },
  })

  const lockMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/cycles/${id}/lock`, {
        method: 'PUT',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to lock cycle')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    },
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      LOCKED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  }

  if (isLoading) {
    return <PageLoading message="Loading payroll cycle..." fullScreen={false} />
  }

  if (!cycle) {
    return <PageLoading message="Payroll cycle not found" fullScreen={false} />
  }

  const totalGross = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.grossEarningsInr), 0)
  const totalDeductions = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.grossDeductionsInr), 0)
  const totalNetPay = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.netPayInr), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Payroll Cycle - {getMonthName(cycle.month)} {cycle.year}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Payroll cycle details and runs</p>
        </div>
        <div className="flex gap-2">
          {cycle.status === 'DRAFT' && (
            <>
              <Button
                variant="outline"
                onClick={() => validateMutation.mutate()}
                disabled={validateMutation.isPending}
                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {validateMutation.isPending ? 'Validating...' : 'Validate'}
              </Button>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
              </Button>
              <Button
                onClick={() => processMutation.mutate()}
                disabled={processMutation.isPending}
                variant="secondary"
                className="dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-800/40"
              >
                {processMutation.isPending ? 'Processing...' : 'Validate & Run (one-click)'}
              </Button>
            </>
          )}
          {cycle.status === 'IN_PROGRESS' && (
            <Button
              onClick={() => lockMutation.mutate()}
              disabled={lockMutation.isPending}
              variant="outline"
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock Cycle'}
            </Button>
          )}
          <Link href={`/hr/${tenantId}/Payroll/Cycles`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">{cycle.payrollRuns.length}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">₹{totalGross.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-gray-100">₹{totalDeductions.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{totalNetPay.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Validation result */}
      {validationResult && (
        <Card className={`dark:border-gray-700 ${validationResult.isValid ? 'border-emerald-500' : 'border-amber-500'}`}>
          <CardHeader>
            <CardTitle className="dark:text-gray-100">
              Pre-run validation
              {validationResult.isValid ? ' — OK' : ' — Issues found'}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Summary: {validationResult.summary?.totalActiveEmployees ?? 0} active employees,{' '}
              {validationResult.summary?.employeesWithoutStructure ?? 0} without salary structure,{' '}
              {validationResult.summary?.employeesWithZeroDays ?? 0} with no attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {validationResult.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Errors</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {validationResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                  {validationResult.errors.length > 5 && (
                    <li>... and {validationResult.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Warnings</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {validationResult.warnings.slice(0, 5).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                  {validationResult.warnings.length > 5 && (
                    <li>... and {validationResult.warnings.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            {validationResult.anomalies && validationResult.anomalies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Anomalies</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {validationResult.anomalies.slice(0, 5).map((a, i) => (
                    <li key={i}>
                      [{a.severity}] {a.message}
                      {a.suggestion && <span className="block ml-4 text-xs text-muted-foreground">→ {a.suggestion}</span>}
                    </li>
                  ))}
                  {validationResult.anomalies.length > 5 && (
                    <li>... and {validationResult.anomalies.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
            {validationResult.statutoryChecks && validationResult.statutoryChecks.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Statutory</p>
                <ul className="text-sm space-y-1">
                  {validationResult.statutoryChecks.map((c, i) => (
                    <li key={i} className={c.passed ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                      {c.passed ? '✓' : '⚠'} {c.name}: {c.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.correctionSuggestions && validationResult.correctionSuggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Suggestions</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                  {validationResult.correctionSuggestions.slice(0, 5).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cycle Details */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Cycle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                  {cycle.status.replace('_', ' ')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Run Type</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{cycle.runType.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{format(new Date(cycle.createdAt), 'PPp')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Payroll Runs */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Payroll Runs ({cycle.payrollRuns.length})</CardTitle>
          <CardDescription className="dark:text-gray-400">Individual employee payroll calculations</CardDescription>
        </CardHeader>
        <CardContent>
          {cycle.payrollRuns.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No payroll runs generated yet</p>
              {cycle.status === 'DRAFT' && (
                <Button 
                  onClick={() => generateMutation.mutate()} 
                  disabled={generateMutation.isPending}
                  className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
                >
                  Generate Payroll
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">Employee</TableHead>
                  <TableHead className="dark:text-gray-300">Gross</TableHead>
                  <TableHead className="dark:text-gray-300">Deductions</TableHead>
                  <TableHead className="dark:text-gray-300">Net Pay</TableHead>
                  <TableHead className="dark:text-gray-300">LOP Days</TableHead>
                  <TableHead className="dark:text-gray-300">Payout Status</TableHead>
                  <TableHead className="dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycle.payrollRuns.map((run) => (
                  <TableRow key={run.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                    <TableCell className="font-medium dark:text-gray-200">
                      {run.employee.employeeCode} - {run.employee.firstName} {run.employee.lastName}
                    </TableCell>
                    <TableCell className="dark:text-gray-200">₹{Number(run.grossEarningsInr).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="dark:text-gray-200">₹{Number(run.grossDeductionsInr).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-semibold dark:text-gray-200">
                      ₹{Number(run.netPayInr).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="dark:text-gray-200">{Number(run.lopDays).toFixed(1)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {run.payoutStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/hr/${tenantId}/Payroll/Runs/${run.id}`}>
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            View
                          </Button>
                        </Link>
                        <a
                          href={`/api/hr/payroll/runs/${run.id}/payslip`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                            Payslip
                          </Button>
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
