'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useInvoices } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'
import { formatINRStandard, formatINRForDisplay } from '@/lib/utils/formatINR'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { GlassCard } from '@/components/modules/GlassCard'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, IndianRupee, Plus, TrendingUp } from 'lucide-react'

export default function FinanceInvoicesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading } = useInvoices({ page, limit: 20, status: statusFilter || undefined })
  
  const dynamicTitle = getDynamicTitle('Invoices', statusFilter)
  const dynamicDescription = getDynamicDescription('Invoices', statusFilter)

  if (isLoading) {
    return <PageLoading message="Loading invoices..." fullScreen={false} />
  }

  const invoices = data?.invoices || []
  const pagination = data?.pagination
  const moduleConfig = getModuleConfig('finance')

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
  const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'draft').length

  const heroMetrics = [
    {
      label: 'Total Invoices',
      value: pagination?.total?.toString() || invoices.length.toString(),
      icon: FileText,
      href: `#`,
    },
    {
      label: 'Total Amount',
      value: formatINRForDisplay(totalAmount),
      icon: IndianRupee,
      href: `#`,
    },
    {
      label: 'Paid',
      value: paidInvoices.toString(),
      icon: TrendingUp,
      href: `#`,
    },
    {
      label: 'Pending',
      value: pendingInvoices.toString(),
      icon: FileText,
      href: `#`,
    },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      {/* Universal Module Hero */}
      <UniversalModuleHero
        moduleName="Invoices"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      {/* Content Sections - 32px gap */}
      <div className="p-6 space-y-8 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Action Button */}
        <div className="flex items-center justify-end">
          <Link href={`/finance/${tenantId}/Invoices/New`}>
            <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <GlassCard>
          <div className="p-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </GlassCard>

        {/* Invoices Table */}
        <GlassCard>
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{dynamicTitle}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {dynamicDescription} ({pagination?.total || 0} total)
              </p>
            </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="mb-4">No invoices found</p>
              <Link href={`/finance/${tenantId}/Invoices/New`}>
                <Button variant="outline">Create your first invoice</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/finance/${tenantId}/Invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {invoice.customer?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatINRStandard(invoice.total)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/finance/${tenantId}/Invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm">View</Button>
                          </Link>
                          <Link href={`/api/invoices/${invoice.id}/pdf`} target="_blank">
                            <Button variant="ghost" size="sm">PDF</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
