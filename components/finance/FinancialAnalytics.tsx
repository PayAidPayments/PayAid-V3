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
    <div className="overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-4 space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        {kpis.map((kpi, idx) => (
          <GlassCard key={idx} className="overflow-hidden min-w-0">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium flex items-center gap-2 min-w-0 truncate">
                {kpi.icon}
                <span className="truncate">{kpi.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden">
              <div className="text-xl font-bold text-purple-600 mb-1 break-words">{kpi.value}</div>
              <Badge variant={kpi.trend === 'up' ? 'default' : 'secondary'}>
                {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {kpi.trend === 'up' ? 'Improving' : 'Declining'}
              </Badge>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      {/* Revenue Trends */}
      <GlassCard className="overflow-hidden min-w-0">
        <CardHeader className="pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold truncate">Revenue Trends</CardTitle>
              <CardDescription className="break-words">Revenue, expenses, and profit over time</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
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
        <CardContent className="min-w-0 overflow-hidden">
          <div className="w-full min-w-0" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
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
          </div>
        </CardContent>
      </GlassCard>

      {/* Expense Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <GlassCard className="overflow-hidden min-w-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold truncate">Expense Category Breakdown</CardTitle>
            <CardDescription className="break-words">Expenses by category this month</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <div className="w-full min-w-0" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
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
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="overflow-hidden min-w-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold truncate">Customer Payment Behavior</CardTitle>
            <CardDescription className="break-words">Payment patterns and collection efficiency</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <div className="space-y-3 min-w-0">
              {paymentBehavior.map((customer, idx) => (
                <div key={idx} className="p-3 border rounded-lg min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-w-0">
                    <div className="font-medium truncate min-w-0">{customer.customer}</div>
                    <Badge variant={customer.avgDaysToPay <= 30 ? 'default' : 'secondary'} className="flex-shrink-0">
                      {customer.avgDaysToPay} days avg
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 break-words">
                    {customer.paidOnTime}/{customer.totalInvoices} paid on time
                  </div>
                  <div className="mt-2 w-full min-w-0 bg-gray-200 rounded-full h-2 overflow-hidden">
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
      <GlassCard className="overflow-hidden min-w-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg font-semibold truncate">Profit Margin Analysis</CardTitle>
          <CardDescription className="break-words">Gross and net profit margins over time</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          <div className="w-full min-w-0" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Bar dataKey="profit" fill="#059669" name="Profit Margin %" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
