'use client'

import { useState } from 'react'
import { Users, DollarSign, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface CustomerPayment {
  id: string
  customerName: string
  totalInvoices: number
  paidInvoices: number
  outstanding: number
  avgDaysToPay: number
  creditLimit: number
  collectionEfficiency: number
}

interface CustomerPaymentInsightsProps {
  tenantId: string
}

export function CustomerPaymentInsights({ tenantId }: CustomerPaymentInsightsProps) {
  const [customers, setCustomers] = useState<CustomerPayment[]>([
    {
      id: '1',
      customerName: 'ABC Corp',
      totalInvoices: 12,
      paidInvoices: 11,
      outstanding: 50000,
      avgDaysToPay: 25,
      creditLimit: 200000,
      collectionEfficiency: 92,
    },
    {
      id: '2',
      customerName: 'XYZ Ltd',
      totalInvoices: 8,
      paidInvoices: 6,
      outstanding: 75000,
      avgDaysToPay: 35,
      creditLimit: 150000,
      collectionEfficiency: 75,
    },
  ])

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding, 0)
  const avgCollectionEfficiency = customers.reduce((sum, c) => sum + c.collectionEfficiency, 0) / customers.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Payment Insights</h2>
          <p className="text-gray-500">Analyze customer payment behavior and collection efficiency</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {formatINRForDisplay(totalOutstanding)}
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Collection Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              {avgCollectionEfficiency.toFixed(1)}%
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Days to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info">
              {Math.round(customers.reduce((sum, c) => sum + c.avgDaysToPay, 0) / customers.length)} days
            </div>
          </CardContent>
        </GlassCard>
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{customers.length}</div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Customer Payment Analysis */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Customer Payment Analysis</CardTitle>
          <CardDescription>Payment behavior and collection metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{customer.customerName}</div>
                      <div className="text-sm text-gray-500">
                        {customer.paidInvoices}/{customer.totalInvoices} invoices paid
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={customer.collectionEfficiency >= 90 ? 'default' : customer.collectionEfficiency >= 70 ? 'secondary' : 'destructive'}
                  >
                    {customer.collectionEfficiency}% efficiency
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Outstanding</div>
                    <div className="font-semibold text-warning">
                      {formatINRForDisplay(customer.outstanding)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Avg Days to Pay</div>
                    <div className="font-semibold">
                      {customer.avgDaysToPay} days
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Credit Limit</div>
                    <div className="font-semibold">
                      {formatINRForDisplay(customer.creditLimit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Utilization</div>
                    <div className="font-semibold">
                      {((customer.outstanding / customer.creditLimit) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${customer.collectionEfficiency}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
