'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import Link from 'next/link'

const CHART_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']

interface FailedPaymentRow {
  id: string
  invoiceNumber: string
  tenantId: string
  tenantName: string
  total: number
  currency: string
  status: string
  paymentStatus: string | null
  createdAt: string
  customerName: string | null
  customerEmail: string | null
  dueDate: string | null
}

export function RevenuePaymentsContent() {
  const [failedPayments, setFailedPayments] = useState<FailedPaymentRow[]>([])
  const [failedSummary, setFailedSummary] = useState<{
    totalFailed: number
    totalPayments: number
    failedRate: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFailedPayments()
  }, [])

  const fetchFailedPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/super-admin/failed-payments?days=90&limit=50')
      if (res.ok) {
        const json = await res.json()
        setFailedPayments(json.data || [])
        setFailedSummary(json.summary || null)
      }
    } catch (error) {
      console.error('Failed to fetch failed payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Revenue (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">+0% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedSummary?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {failedSummary?.failedRate || '0'}% failure rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">Monthly recurring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹0</div>
            <p className="text-xs text-muted-foreground">Annual recurring</p>
          </CardContent>
        </Card>
      </div>

      {failedPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Payments (last 90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.invoiceNumber}</TableCell>
                      <TableCell>{payment.tenantName}</TableCell>
                      <TableCell>
                        {payment.customerName || payment.customerEmail || '—'}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.total, payment.currency)}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Failed
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
