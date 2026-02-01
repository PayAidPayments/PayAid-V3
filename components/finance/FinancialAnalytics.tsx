'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Calendar } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { GlassCard } from '@/components/modules/GlassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface FinancialAnalyticsProps {
  tenantId: string
}

const CHART_COLORS = ['#53328A', '#F5C700', '#059669', '#0284C7', '#DC2626', '#8B5CF6']

export function FinancialAnalytics({ tenantId }: FinancialAnalyticsProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  // Revenue Trends
  const revenueTrends = [
    { period: 'Jan', revenue: 1200000, expenses: 800000, profit: 400000 },
    { period: 'Feb', revenue: 1500000, expenses: 900000, profit: 600000 },
    { period: 'Mar', revenue: 1800000, expenses: 1100000, profit: 700000 },
    { period: 'Apr', revenue: 1600000, expenses: 1000000, profit: 600000 },
    { period: 'May', revenue: 1400000, expenses: 950000, profit: 450000 },
    { period: 'Jun', revenue: 1700000, expenses: 1050000, profit: 650000 },
  ]

  // Expense Category Breakdown
  const expenseCategories = [
    { name: 'Salaries', amount: 500000, percentage: 35 },
    { name: 'Rent', amount: 200000, percentage: 14 },
    { name: 'Marketing', amount: 180000, percentage: 13 },
    { name: 'Utilities', amount: 150000, percentage: 11 },
    { name: 'Supplies', amount: 200000, percentage: 14 },
    { name: 'Other', amount: 170000, percentage: 13 },
  ]

  // Customer Payment Behavior
  const paymentBehavior = [
    { customer: 'ABC Corp', totalInvoices: 12, paidOnTime: 10, avgDaysToPay: 25 },
    { customer: 'XYZ Ltd', totalInvoices: 8, paidOnTime: 6, avgDaysToPay: 35 },
    { customer: 'DEF Inc', totalInvoices: 15, paidOnTime: 14, avgDaysToPay: 20 },
  ]

  // Financial KPIs
  const kpis = [
    { label: 'Revenue Growth', value: '+15%', trend: 'up', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Profit Margin', value: '22%', trend: 'up', icon: <DollarSign className="w-5 h-5" /> },
    { label: 'Collection Rate', value: '85%', trend: 'up', icon: <Users className="w-5 h-5" /> },
    { label: 'Expense Ratio', value: '65%', trend: 'down', icon: <ShoppingCart className="w-5 h-5" /> },
  ]

  return (
    <div className="space-y-8">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <GlassCard key={idx}>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {kpi.icon}
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 mb-1">{kpi.value}</div>
              <Badge variant={kpi.trend === 'up' ? 'default' : 'secondary'}>
                {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {kpi.trend === 'up' ? 'Improving' : 'Declining'}
              </Badge>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Trends */}
      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
              <CardDescription>Revenue, expenses, and profit over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1 rounded text-sm ${period === 'daily' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1 rounded text-sm ${period === 'weekly' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1 rounded text-sm ${period === 'monthly' ? 'bg-purple-600 text-white' : 'bg-gray-100'}`}
              >
                Monthly
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#53328A" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Expense Category Breakdown</CardTitle>
            <CardDescription>Expenses by category this month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Customer Payment Behavior</CardTitle>
            <CardDescription>Payment patterns and collection efficiency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentBehavior.map((customer, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{customer.customer}</div>
                    <Badge variant={customer.avgDaysToPay <= 30 ? 'default' : 'warning'}>
                      {customer.avgDaysToPay} days avg
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {customer.paidOnTime}/{customer.totalInvoices} paid on time
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(customer.paidOnTime / customer.totalInvoices) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Profit Margin Analysis */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Profit Margin Analysis</CardTitle>
          <CardDescription>Gross and net profit margins over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Bar dataKey="profit" fill="#059669" name="Profit Margin %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>
    </div>
  )
}
