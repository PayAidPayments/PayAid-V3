'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/currency'
import type { Invoice } from '@/types/base-modules'

interface InvoiceListProps {
  organizationId: string
}

export function InvoiceList({ organizationId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchInvoices()
  }, [organizationId, page])

  async function fetchInvoices() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/finance/invoices?organizationId=${organizationId}&page=${page}&pageSize=${pageSize}`
      )
      const data = await response.json()
      
      if (data.success) {
        setInvoices(data.data.invoices)
        setTotal(data.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generatePaymentLink(invoiceId: string) {
    try {
      const response = await fetch(`/api/finance/invoices/${invoiceId}/payaid-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })
      
      const data = await response.json()
      
      if (data.success && data.data.paymentLink) {
        window.open(data.data.paymentLink, '_blank')
      }
    } catch (error) {
      console.error('Failed to generate payment link:', error)
      alert('Failed to generate payment link')
    }
  }

  if (loading) {
    return <div className="p-4">Loading invoices...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900'
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 dark:bg-blue-900'
      default:
        return 'bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button onClick={() => {/* Open create modal */}}>Create Invoice</Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Invoice #</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Due Date</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-4 font-medium">{invoice.invoiceNumber}</td>
                <td className="p-4">
                  {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                </td>
                <td className="p-4">
                  {invoice.dueDate 
                    ? new Date(invoice.dueDate).toLocaleDateString('en-IN')
                    : '-'}
                </td>
                <td className="p-4 text-right font-medium">
                  {formatINR(invoice.totalINR)}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {invoice.status !== 'paid' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePaymentLink(invoice.id)}
                    >
                      Generate Payment Link
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {total > pageSize && (
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              disabled={page >= Math.ceil(total / pageSize)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
