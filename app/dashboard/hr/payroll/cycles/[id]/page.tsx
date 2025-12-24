'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  const id = params.id as string

  const { data: cycle, refetch } = useQuery<PayrollCycle>({
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
      DRAFT: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      LOCKED: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  }

  if (!cycle) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const totalGross = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.grossEarningsInr), 0)
  const totalDeductions = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.grossDeductionsInr), 0)
  const totalNetPay = cycle.payrollRuns.reduce((sum, run) => sum + Number(run.netPayInr), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payroll Cycle - {getMonthName(cycle.month)} {cycle.year}
          </h1>
          <p className="mt-2 text-gray-600">Payroll cycle details and runs</p>
        </div>
        <div className="flex gap-2">
          {cycle.status === 'DRAFT' && (
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
            </Button>
          )}
          {cycle.status === 'IN_PROGRESS' && (
            <Button
              onClick={() => lockMutation.mutate()}
              disabled={lockMutation.isPending}
              variant="outline"
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock Cycle'}
            </Button>
          )}
          <Link href="/dashboard/hr/payroll/cycles">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycle.payrollRuns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalGross.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDeductions.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalNetPay.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cycle Details */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cycle.status)}`}>
                  {cycle.status.replace('_', ' ')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Run Type</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{cycle.runType.toLowerCase()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{format(new Date(cycle.createdAt), 'PPp')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Payroll Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs ({cycle.payrollRuns.length})</CardTitle>
          <CardDescription>Individual employee payroll calculations</CardDescription>
        </CardHeader>
        <CardContent>
          {cycle.payrollRuns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No payroll runs generated yet</p>
              {cycle.status === 'DRAFT' && (
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                  Generate Payroll
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>LOP Days</TableHead>
                  <TableHead>Payout Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycle.payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {run.employee.employeeCode} - {run.employee.firstName} {run.employee.lastName}
                    </TableCell>
                    <TableCell>₹{Number(run.grossEarningsInr).toLocaleString('en-IN')}</TableCell>
                    <TableCell>₹{Number(run.grossDeductionsInr).toLocaleString('en-IN')}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{Number(run.netPayInr).toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>{Number(run.lopDays).toFixed(1)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {run.payoutStatus}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/hr/payroll/runs/${run.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <a
                          href={`/api/hr/payroll/runs/${run.id}/payslip`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
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
