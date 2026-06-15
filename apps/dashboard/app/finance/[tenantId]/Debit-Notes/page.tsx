'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { format } from 'date-fns'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { UniversalModuleHero } from '@/components/modules/UniversalModuleHero'
import { getModuleConfig } from '@/lib/modules/module-config'
import { FileText, IndianRupee, Plus, ArrowRightLeft } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { Badge } from '@/components/ui/badge'

export default function FinanceDebitNotesPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const limit = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['debit-notes', tenantId, page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        tenantId,
        page: String(page),
        limit: String(limit),
      })
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/finance/debit-notes?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch debit notes')
      return response.json()
    },
    enabled: !!tenantId,
  })

  if (isLoading) {
    return <PageLoading message="Loading debit notes..." fullScreen={false} />
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">Error loading debit notes: {(error as Error).message}</p>
        </div>
      </div>
    )
  }

  const debitNotes = data?.debitNotes || []
  const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 0 }
  const summary = data?.summary || { total: 0, draft: 0, issued: 0, cancelled: 0, totalAmount: { _sum: { total: 0 } } }

  const moduleConfig = getModuleConfig('finance')

  const heroMetrics = [
    {
      label: 'Total Debit Notes',
      value: String(summary.total),
      icon: <FileText className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Total Amount',
      value: formatINRForDisplay(summary.totalAmount?._sum?.total || 0),
      icon: <IndianRupee className="w-5 h-5" />,
      href: '#',
    },
    {
      label: 'Draft',
      value: String(summary.draft),
      icon: <FileText className="w-5 h-5" />,
      href: statusFilter === 'draft' ? '#' : `/finance/${tenantId}/Debit-Notes?status=draft`,
    },
    {
      label: 'Issued',
      value: String(summary.issued),
      icon: <ArrowRightLeft className="w-5 h-5" />,
      href: statusFilter === 'issued' ? '#' : `/finance/${tenantId}/Debit-Notes?status=issued`,
    },
    {
      label: 'Cancelled',
      value: String(summary.cancelled),
      icon: <FileText className="w-5 h-5" />,
      href: statusFilter === 'cancelled' ? '#' : `/finance/${tenantId}/Debit-Notes?status=cancelled`,
    },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      issued: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      additional_charge: 'Additional Charge',
      price_adjustment: 'Price Adjustment',
      other: 'Other',
    }
    return labels[reason] || reason
  }

  if (!moduleConfig) {
    return <div>Module configuration not found</div>
  }

  return (
    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative" style={{ zIndex: 1 }}>
      <UniversalModuleHero
        moduleName="Debit Notes"
        moduleIcon={<moduleConfig.icon className="w-8 h-8" />}
        gradientFrom={moduleConfig.gradientFrom}
        gradientTo={moduleConfig.gradientTo}
        metrics={heroMetrics}
      />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Debit Notes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage debit notes for additional charges and price adjustments
            </p>
          </div>
          <Link href={`/finance/${tenantId}/Debit-Notes/new`}>
            <Button className="bg-gradient-to-r from-[#53328A] to-[#F5C700] hover:from-[#3F1F62] hover:to-[#E0B200] text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Debit Note
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('draft')}
          >
            Draft
          </Button>
          <Button
            variant={statusFilter === 'issued' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('issued')}
          >
            Issued
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Debit Note #</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debitNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No debit notes found. Create your first debit note to get started.
                  </TableCell>
                </TableRow>
              ) : (
                debitNotes.map((note: any) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.debitNoteNumber}</TableCell>
                    <TableCell>
                      {note.invoiceNumber ? (
                        <Link
                          href={`/finance/${tenantId}/Invoices/${note.invoiceId || ''}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {note.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {note.customer?.name || note.customerName || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{getReasonLabel(note.reason)}</span>
                      {note.reasonDescription && (
                        <p className="text-xs text-muted-foreground mt-1">{note.reasonDescription}</p>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(note.debitNoteDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-semibold">{formatINRForDisplay(note.total)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(note.status)}>{note.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/finance/${tenantId}/Debit-Notes/${note.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} debit notes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
