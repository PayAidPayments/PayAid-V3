'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { numberToWords } from '@/lib/utils/number-to-words'

interface PayrollAdjustment {
  id: string
  componentName: string
  originalAmount: number
  adjustedAmount: number
  reason: string
  createdAt: string
}

interface PayrollRun {
  id: string
  grossEarningsInr: number
  grossDeductionsInr: number
  tdsInr: number
  pfEmployeeInr: number
  pfEmployerInr: number
  esiEmployeeInr: number
  esiEmployerInr: number
  ptInr: number
  lopDays: number
  lopAmountInr: number
  netPayInr: number
  daysPaid: number
  payoutStatus: string
  payaidPayoutId?: string
  generatedAt?: string
  approvedAt?: string
  paidAt?: string
  employee: {
    id: string
    employeeCode: string
    firstName: string
    lastName: string
    department?: { name: string }
    designation?: { name: string }
    location?: { name: string }
  }
  cycle: {
    id: string
    month: number
    year: number
    status: string
  }
  adjustments: PayrollAdjustment[]
}

export default function PayrollRunDetailPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const id = params.id as string

  const { data: run, isLoading } = useQuery<PayrollRun>({
    queryKey: ['payroll-run', id],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/runs/${id}`)
      if (!response.ok) throw new Error('Failed to fetch payroll run')
      return response.json()
    },
  })

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('en-IN', { month: 'long' })
  }

  if (isLoading) {
    return <PageLoading message="Loading payroll run..." fullScreen={false} />
  }

  if (!run) {
    return <PageLoading message="Payroll run not found" fullScreen={false} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Payroll Run - {run.employee.employeeCode}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {getMonthName(run.cycle.month)} {run.cycle.year}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/hr/payroll/runs/${id}/payslip`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Download Payslip</Button>
          </a>
          <Link href={`/hr/${tenantId}/Payroll/Cycles/${run.cycle.id}`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Back to Cycle</Button>
          </Link>
        </div>
      </div>

      {/* Employee Info */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Employee Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {run.employee.firstName} {run.employee.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee Code</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.employee.employeeCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.employee.department?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Designation</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.employee.designation?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.employee.location?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Days Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.daysPaid} days</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Earnings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Gross Earnings</span>
              <span className="font-semibold dark:text-gray-100">₹{Number(run.grossEarningsInr).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deductions */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Number(run.pfEmployeeInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Provident Fund (PF)</span>
                <span className="dark:text-gray-200">₹{Number(run.pfEmployeeInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(run.esiEmployeeInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Employee State Insurance (ESI)</span>
                <span className="dark:text-gray-200">₹{Number(run.esiEmployeeInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(run.ptInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Professional Tax (PT)</span>
                <span className="dark:text-gray-200">₹{Number(run.ptInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(run.tdsInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax Deducted at Source (TDS)</span>
                <span className="dark:text-gray-200">₹{Number(run.tdsInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(run.lopAmountInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Loss of Pay (LOP) - {Number(run.lopDays).toFixed(1)} days</span>
                <span className="dark:text-gray-200">₹{Number(run.lopAmountInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-gray-100">Total Deductions</span>
              <span className="font-semibold dark:text-gray-100">₹{Number(run.grossDeductionsInr).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Pay */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Net Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ₹{Number(run.netPayInr).toLocaleString('en-IN')}
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Amount in Words: {numberToWords(Number(run.netPayInr))} Rupees Only
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employer Contributions */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Employer Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Number(run.pfEmployerInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">PF Employer Contribution</span>
                <span className="dark:text-gray-200">₹{Number(run.pfEmployerInr).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(run.esiEmployerInr) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ESI Employer Contribution</span>
                <span className="dark:text-gray-200">₹{Number(run.esiEmployerInr).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Adjustments */}
      {run.adjustments.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Manual Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {run.adjustments.map((adj) => (
                <div key={adj.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium dark:text-gray-200">{adj.componentName}</span>
                    <span className="dark:text-gray-200">
                      ₹{Number(adj.originalAmount).toLocaleString('en-IN')} → ₹
                      {Number(adj.adjustedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Reason: {adj.reason}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {format(new Date(adj.createdAt), 'PPp')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-gray-100">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Payout Status</dt>
              <dd className="mt-1">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {run.payoutStatus}
                </span>
              </dd>
            </div>
            {run.payaidPayoutId && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">PayAid Payout ID</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{run.payaidPayoutId}</dd>
              </div>
            )}
            {run.generatedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Generated At</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{format(new Date(run.generatedAt), 'PPp')}</dd>
              </div>
            )}
            {run.approvedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved At</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{format(new Date(run.approvedAt), 'PPp')}</dd>
              </div>
            )}
            {run.paidAt && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid At</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{format(new Date(run.paidAt), 'PPp')}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
