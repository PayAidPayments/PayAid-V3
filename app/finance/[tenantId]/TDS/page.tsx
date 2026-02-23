'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, Calendar, IndianRupee, Award, AlertCircle } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { PageLoading } from '@/components/ui/loading'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function FinanceTDSPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('finance')

  const { data, isLoading, error } = useQuery({
    queryKey: ['finance-tds', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/finance/tds`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to load TDS data')
      return res.json()
    },
  })

  if (isLoading) {
    return <PageLoading message="Loading TDS summary..." fullScreen={false} />
  }

  const summary = data?.summary ?? { totalTDSDeducted: 0, deductionCount: 0, byType: {} }
  const dueDates = data?.dueDates ?? []
  const deductions = data?.deductions ?? []

  const heroMetrics = [
    {
      label: 'Total TDS deducted',
      value: formatINRForDisplay(summary.totalTDSDeducted),
      icon: <IndianRupee className="w-5 h-5" />,
    },
    {
      label: 'Transactions',
      value: String(summary.deductionCount),
      icon: <FileText className="w-5 h-5" />,
    },
  ]

  const nextDue = dueDates.find((d: { dueDate: string }) => new Date(d.dueDate) > new Date())

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="TDS Management"
        moduleIcon={<Award className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                TDS by type
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Deductions grouped by section/type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.byType || {}).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No TDS deductions recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(summary.byType).map(([type, amount]) => (
                    <li key={type} className="flex justify-between text-sm">
                      <span className="dark:text-gray-300">{type}</span>
                      <span className="font-medium dark:text-gray-100">{formatINRForDisplay(Number(amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-gray-100 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Return due dates
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                26Q / 24Q filing due dates (typically 31st of next month after quarter end)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {dueDates.slice(0, 5).map((d: { form: string; period: string; dueDate: string; description: string }, i: number) => {
                  const due = new Date(d.dueDate)
                  const isPast = due < new Date()
                  return (
                    <li key={i} className="flex justify-between items-start text-sm">
                      <div>
                        <span className="font-medium dark:text-gray-200">{d.form}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2">{d.period}</span>
                        {isPast && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs">Due passed</span>
                        )}
                      </div>
                      <span className={isPast ? 'text-gray-500' : 'dark:text-gray-300'}>
                        {due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </li>
                  )
                })}
              </ul>
              {nextDue && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Next due: {nextDue.form} – {new Date(nextDue.dueDate).toLocaleDateString('en-IN')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">TDS deductions (from invoices)</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Invoices where TDS was deducted. Add TDS on invoice when creating/editing to see them here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deductions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No TDS deductions yet. TDS amounts on invoices will appear here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-gray-700">
                      <TableHead className="dark:text-gray-300">Invoice</TableHead>
                      <TableHead className="dark:text-gray-300">Customer</TableHead>
                      <TableHead className="dark:text-gray-300">Date</TableHead>
                      <TableHead className="dark:text-gray-300">TDS type</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">TDS amount</TableHead>
                      <TableHead className="dark:text-gray-300 text-right">Total</TableHead>
                      <TableHead className="dark:text-gray-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((d: any) => (
                      <TableRow key={d.id} className="dark:border-gray-700 dark:hover:bg-gray-700/50">
                        <TableCell className="dark:text-gray-200">
                          <Link href={`/finance/${tenantId}/Invoices/${d.id}`} className="text-primary hover:underline">
                            {d.invoiceNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{d.customerName}</TableCell>
                        <TableCell className="dark:text-gray-200">
                          {new Date(d.invoiceDate).toLocaleDateString('en-IN')}
                        </TableCell>
                        <TableCell className="dark:text-gray-200">{d.tdsType ?? '-'}</TableCell>
                        <TableCell className="dark:text-gray-200 text-right font-medium">
                          {formatINRForDisplay(d.tdsAmount)}
                        </TableCell>
                        <TableCell className="dark:text-gray-200 text-right">{formatINRForDisplay(d.total)}</TableCell>
                        <TableCell className="dark:text-gray-200">{d.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Compliance</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Form 16A (TDS certificates) and return filing (26Q, 27Q, 24Q) – use GST portal / TRACES for actual filing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300" disabled>
              Generate Form 16A (coming soon)
            </Button>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300" disabled>
              Prepare 26Q (coming soon)
            </Button>
            <a href="https://www.tdscpc.gov.in" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                TRACES portal
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
