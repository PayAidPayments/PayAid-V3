'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useInvoices } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { ModuleGate } from '@/components/modules/ModuleGate'
import { getDynamicTitle, getDynamicDescription } from '@/lib/utils/status-labels'

function InvoicesPageContent() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const { data, isLoading } = useInvoices({ page, limit: 20, status: statusFilter || undefined })
  
  const dynamicTitle = getDynamicTitle('Invoices', statusFilter)
  const dynamicDescription = getDynamicDescription('Invoices', statusFilter)

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  const invoices = data?.invoices || []
  const pagination = data?.pagination

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-2 text-gray-600">Manage your invoices and billing</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button>Create Invoice</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 px-3"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{dynamicTitle}</CardTitle>
          <CardDescription>
            {dynamicDescription} ({pagination?.total || 0} total)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No invoices found</p>
              <Link href="/dashboard/invoices/new">
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
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="text-blue-600 hover:underline"
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
                        ₹{invoice.total.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/dashboard/invoices/${invoice.id}`}>
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
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <ModuleGate module="finance">
      <InvoicesPageContent />
    </ModuleGate>
  )
}
