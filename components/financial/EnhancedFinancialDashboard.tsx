/**
 * Enhanced Financial Dashboard Component
 * Financial Dashboard Module 1.3
 * 
 * Complete financial dashboard with P&L, Cash Flow, Variance, and Alerts
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart,
} from 'recharts'
import { AlertBanner, FinancialAlert } from './AlertBanner'
import { VarianceTable, VarianceRecord } from './VarianceTable'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Download, RefreshCw } from 'lucide-react'

interface PLData {
  summary: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    netMargin: number
  }
  revenue: {
    accounts: Array<{
      accountName: string
      amount: number
      percentageOfTotal: number
    }>
  }
  expenses: {
    accounts: Array<{
      accountName: string
      amount: number
      percentageOfTotal: number
    }>
  }
}

interface CashFlowForecast {
  forecast: Array<{
    date: string
    forecastedInflow: number
    forecastedOutflow: number
    projectedBalance: number
    warning: boolean
  }>
}

interface VarianceSummary {
  summary: {
    accountsRequiringInvestigation: number
  }
  topVariances: VarianceRecord[]
}

export function EnhancedFinancialDashboard({ tenantId }: { tenantId: string }) {
  const [period, setPeriod] = useState({
    startDate: new Date(new Date().setDate(1)),
    endDate: new Date(),
  })
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [fiscalMonth, setFiscalMonth] = useState(new Date().getMonth() + 1)

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['financial-dashboard', tenantId],
    queryFn: async () => {
      const response = await fetch('/api/v1/financials/dashboard', {
        headers: {
          'X-Tenant-Id': tenantId,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch dashboard')
      return response.json()
    },
  })

  // Fetch P&L data
  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['pl', tenantId, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/financials/p-and-l?start_date=${period.startDate.toISOString()}&end_date=${period.endDate.toISOString()}`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch P&L')
      return response.json() as Promise<PLData>
    },
  })

  // Fetch cash flow forecast
  const { data: cfForecast, isLoading: cfLoading } = useQuery({
    queryKey: ['cash-flow-forecast', tenantId],
    queryFn: async () => {
      const response = await fetch('/api/v1/financials/cash-flow/forecast?days=30', {
        headers: {
          'X-Tenant-Id': tenantId,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch forecast')
      return response.json() as Promise<CashFlowForecast>
    },
  })

  // Fetch variance data
  const { data: varianceData, isLoading: varianceLoading } = useQuery({
    queryKey: ['variance', tenantId, fiscalYear, fiscalMonth],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/financials/variance/${fiscalYear}/${fiscalMonth}`,
        {
          headers: {
            'X-Tenant-Id': tenantId,
          },
        }
      )
      if (!response.ok) throw new Error('Failed to fetch variance')
      return response.json() as Promise<VarianceSummary>
    },
  })

  // Fetch alerts
  const { data: alertsData } = useQuery({
    queryKey: ['financial-alerts', tenantId],
    queryFn: async () => {
      const response = await fetch('/api/v1/financials/alerts/logs?limit=10', {
        headers: {
          'X-Tenant-Id': tenantId,
        },
      })
      if (!response.ok) return { logs: [] }
      const data = await response.json()
      return {
        logs: data.logs.map((log: any) => ({
          id: log.alertId,
          alertName: 'Financial Alert',
          alertType: 'variance',
          triggerDate: new Date(log.triggerDate),
          triggeredValue: log.triggeredValue,
          acknowledged: log.acknowledged,
        })) as FinancialAlert[],
      }
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    // TODO: Implement acknowledge API call
    console.log('Acknowledge alert:', alertId)
  }

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    console.log('Export PDF')
  }

  const handleExportExcel = async () => {
    // TODO: Implement Excel export
    console.log('Export Excel')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(period.startDate, 'MMM dd')} -{' '}
                {format(period.endDate, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{
                  from: period.startDate,
                  to: period.endDate,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setPeriod({
                      startDate: range.from,
                      endDate: range.to,
                    })
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alertsData?.logs && alertsData.logs.length > 0 && (
        <AlertBanner
          alerts={alertsData.logs}
          onAcknowledge={handleAcknowledgeAlert}
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(plData?.summary.totalRevenue || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(plData?.summary.totalExpenses || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div
                className={`text-2xl font-bold ${
                  (plData?.summary.netIncome || 0) >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(plData?.summary.netIncome || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {plData?.summary.netMargin?.toFixed(2) || 0}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* P&L Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>P&L Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {plLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Revenue',
                      value: plData?.summary.totalRevenue || 0,
                      fill: '#10b981',
                    },
                    {
                      name: 'Expenses',
                      value: -(plData?.summary.totalExpenses || 0),
                      fill: '#ef4444',
                    },
                    {
                      name: 'Net Income',
                      value: plData?.summary.netIncome || 0,
                      fill: '#3b82f6',
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day Cash Flow Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            {cfLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cfForecast?.forecast || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="projectedBalance"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Projected Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual (Variance Analysis)</CardTitle>
        </CardHeader>
        <CardContent>
          {varianceLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <VarianceTable
              data={varianceData?.topVariances || []}
              onInvestigate={(accountCode) => {
                console.log('Investigate:', accountCode)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
