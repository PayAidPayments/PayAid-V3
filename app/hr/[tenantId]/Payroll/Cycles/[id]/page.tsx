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
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
            </Button>
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
