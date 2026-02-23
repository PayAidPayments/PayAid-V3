'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { IndianRupee, ArrowLeft, Users, FileText, Download, Printer } from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { useAuthStore } from '@/lib/stores/auth'

interface CycleDetail {
  id: string
  cycleName: string
  month: number
  year: number
  status: string
  runType: string
  employeeCount: number
  totalNetPayInr: number
  totalGrossEarningsInr: number
  payrollRuns: Array<{
    id: string
    netPayInr: number
    grossEarningsInr: number
    payoutStatus: string
    employee: {
      id: string
      employeeCode: string
      firstName: string
      lastName: string
      department?: { name: string }
      designation?: { name: string }
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function HRPayrollRunDetailPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const id = params?.id as string
  const moduleConfig = getModuleConfig('hr') || getModuleConfig('crm')!
  const { token } = useAuthStore()

  const { data, isLoading } = useQuery<CycleDetail>({
    queryKey: ['payroll-run-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/hr/payroll-runs/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading payroll run..." fullScreen={false} />
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground mb-4">Payroll run not found</p>
        <Link href={`/hr/${tenantId}/Payroll-Runs`}>
          <Button variant="outline">Back to Payroll Runs</Button>
        </Link>
      </div>
    )
  }

  const isCycle = 'cycleName' in data && data.cycleName
  const runs = isCycle ? (data as CycleDetail).payrollRuns || [] : []

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName={isCycle ? (data as CycleDetail).cycleName : 'Payroll Run'}
        moduleIcon={<IndianRupee className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        description={isCycle ? `Payroll cycle • ${(data as CycleDetail).employeeCount} employees` : 'Run details'}
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link href={`/hr/${tenantId}/Payroll-Runs`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payroll Runs
            </Button>
          </Link>
          <div className="flex gap-2">
            {isCycle && (
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/hr/payroll-runs/export?format=csv&cycleId=${id}`} download target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Badge variant={data.status === 'PAID' || data.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {data.status}
            </Badge>
          </div>
        </div>

        {isCycle && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {(data as CycleDetail).employeeCount}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Gross</p>
                  <p className="text-2xl font-bold">
                    {formatINRForDisplay((data as CycleDetail).totalGrossEarningsInr || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Net Pay</p>
                  <p className="text-2xl font-bold">
                    {formatINRForDisplay((data as CycleDetail).totalNetPayInr || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Run Type</p>
                  <p className="text-lg font-semibold">{(data as CycleDetail).runType}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payslips in this run</CardTitle>
                <CardDescription>Employee-wise net pay for this cycle</CardDescription>
              </CardHeader>
              <CardContent>
                {runs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No payslips in this run yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Gross</TableHead>
                        <TableHead>Net Pay</TableHead>
                        <TableHead>Payout Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run: any) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">
                            {run.employee?.firstName} {run.employee?.lastName}
                          </TableCell>
                          <TableCell>{run.employee?.employeeCode}</TableCell>
                          <TableCell>{run.employee?.department?.name || '—'}</TableCell>
                          <TableCell>{formatINRForDisplay(Number(run.grossEarningsInr || 0))}</TableCell>
                          <TableCell>{formatINRForDisplay(Number(run.netPayInr || 0))}</TableCell>
                          <TableCell>
                            <Badge variant={run.payoutStatus === 'PAID' ? 'default' : 'outline'}>
                              {run.payoutStatus || 'PENDING'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/hr/${tenantId}/Payroll/Runs/${run.id}`}>
                              <Button variant="ghost" size="sm">
                                <FileText className="mr-1 h-4 w-4" />
                                Payslip
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
