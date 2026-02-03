'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/loading'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRStandard } from '@/lib/utils/formatINR'

interface GSTR1Data {
  filingPeriod: string
  b2b: Array<{
    gstin: string
    invoices: Array<{
      invoiceNumber: string
      invoiceDate: string
      amount: number
      gst: number
      total: number
    }>
    totalAmount: number
    totalGST: number
    total: number
  }>
  b2c: {
    invoices: Array<{
      invoiceNumber: string
      invoiceDate: string
      amount: number
      gst: number
      total: number
    }>
    totalAmount: number
    totalGST: number
    total: number
  }
  summary: {
    totalInvoices: number
    totalAmount: number
    totalGST: number
  }
}

export default function FinanceGSTR1Page() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const { token } = useAuthStore()

  const { data, isLoading, refetch } = useQuery<GSTR1Data>({
    queryKey: ['gstr-1', month, year],
    queryFn: async () => {
      const response = await fetch(`/api/gst/gstr-1?month=${month}&year=${year}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!response.ok) throw new Error('Failed to fetch GSTR-1')
      return response.json()
    },
  })

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const url = `/api/gst/gstr-1/export?month=${month}&year=${year}&format=${format}`
      const response = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (!response.ok) {
        if (response.status === 501) {
          alert('PDF export is not yet implemented. Please use Excel export.')
          return
        }
        const error = await response.json()
        throw new Error(error.error || 'Failed to export')
      }
      
      if (format === 'excel') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `GSTR-1-${month}-${year}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      } else {
        alert('PDF export is not yet implemented. Please use Excel export.')
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to export GSTR-1')
    }
  }

  if (isLoading) {
    return <PageLoading message="Loading GSTR-1 report..." fullScreen={false} />
  }

  const gstr1 = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">GSTR-1 Report</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sales Register - Outward Supplies</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="h-10 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('en-IN', { month: 'long' })}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="h-10 w-24 rounded-md border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 px-3"
            min="2020"
            max="2100"
          />
          <Button onClick={() => refetch()} className="dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600">Refresh</Button>
          <Button variant="outline" onClick={() => handleExport('excel')} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')} className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">{gstr1?.summary.totalInvoices || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">
              {formatINRStandard((gstr1?.summary.totalAmount || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total GST</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold dark:text-gray-100">
              {formatINRStandard((gstr1?.summary.totalGST || 0) / 1000)}
            </div>
          </CardContent>
        </Card>
      </div>

      {gstr1?.b2b && gstr1.b2b.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">B2B Invoices (Registered Customers)</CardTitle>
            <CardDescription className="dark:text-gray-400">Invoices to GST-registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {gstr1.b2b.map((b2bGroup) => (
                <div key={b2bGroup.gstin} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg dark:text-gray-100">GSTIN: {b2bGroup.gstin}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {b2bGroup.invoices.length} invoice(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold dark:text-gray-100">
                        {formatINRStandard((b2bGroup.total || 0) / 1000)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="dark:text-gray-300">Invoice #</TableHead>
                        <TableHead className="dark:text-gray-300">Date</TableHead>
                        <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                        <TableHead className="text-right dark:text-gray-300">GST</TableHead>
                        <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {b2bGroup.invoices.map((invoice) => (
                        <TableRow key={invoice.invoiceNumber} className="dark:border-gray-700">
                          <TableCell className="font-medium dark:text-gray-100">{invoice.invoiceNumber}</TableCell>
                          <TableCell className="dark:text-gray-300">
                            {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right dark:text-gray-300">
                            {formatINRStandard((invoice.amount || 0) / 1000)}
                          </TableCell>
                          <TableCell className="text-right dark:text-gray-300">
                            {formatINRStandard((invoice.gst || 0) / 1000)}
                          </TableCell>
                          <TableCell className="text-right font-semibold dark:text-gray-100">
                            {formatINRStandard((invoice.total || 0) / 1000)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {gstr1?.b2c && gstr1.b2c.invoices.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">B2C Invoices (Unregistered Customers)</CardTitle>
            <CardDescription className="dark:text-gray-400">Invoices to non-GST registered customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {gstr1.b2c.invoices.length} invoice(s)
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold dark:text-gray-100">
                  {formatINRStandard((gstr1.b2c.total || 0) / 1000)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="dark:text-gray-300">Invoice #</TableHead>
                  <TableHead className="dark:text-gray-300">Date</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Amount</TableHead>
                  <TableHead className="text-right dark:text-gray-300">GST</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gstr1.b2c.invoices.map((invoice) => (
                  <TableRow key={invoice.invoiceNumber} className="dark:border-gray-700">
                    <TableCell className="font-medium dark:text-gray-100">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="dark:text-gray-300">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right dark:text-gray-300">
                      {formatINRStandard((invoice.amount || 0) / 1000)}
                    </TableCell>
                    <TableCell className="text-right dark:text-gray-300">
                      {formatINRStandard((invoice.gst || 0) / 1000)}
                    </TableCell>
                    <TableCell className="text-right font-semibold dark:text-gray-100">
                      {formatINRStandard((invoice.total || 0) / 1000)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {(!gstr1?.b2b || gstr1.b2b.length === 0) &&
        (!gstr1?.b2c || gstr1.b2c.invoices.length === 0) && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
              No invoices found for the selected period
            </CardContent>
          </Card>
        )}
    </div>
  )
}
