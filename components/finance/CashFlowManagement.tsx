'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { TrendingUp, TrendingDown, AlertCircle, Calendar, DollarSign } from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
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
import { Button } from '@/components/ui/button'

interface CashFlowManagementProps {
  tenantId: string
}

export function CashFlowManagement({ tenantId }: CashFlowManagementProps) {
  const [forecastPeriod, setForecastPeriod] = useState<'30' | '60' | '90'>('30')
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCashFlow()
  }, [tenantId])

  const fetchCashFlow = async () => {
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/finance/cash-flow', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setApiData(data)
      }
    } catch (error) {
      console.error('Failed to fetch cash flow:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use API data or fallback to mock
  const currentCash = apiData?.currentCash || 2500000
  const cashFlowData = apiData?.monthlyCashFlow?.map((item: any) => ({
    date: item.month || item.date,
    inflow: item.inflow || 0,
    outflow: item.outflow || 0,
    net: item.net || (item.inflow - item.outflow) || 0,
  })) || [
    { date: 'Jan', inflow: 1200000, outflow: 800000, net: 400000 },
    { date: 'Feb', inflow: 1500000, outflow: 900000, net: 600000 },
    { date: 'Mar', inflow: 1800000, outflow: 1100000, net: 700000 },
    { date: 'Apr', inflow: 1600000, outflow: 1000000, net: 600000 },
    { date: 'May', inflow: 1400000, outflow: 950000, net: 450000 },
    { date: 'Jun', inflow: 1700000, outflow: 1050000, net: 650000 },
  ]

  const forecastData = apiData?.forecast?.slice(0, 5).map((item: any, idx: number) => ({
    date: `Day ${(idx + 1) * 7}`,
    forecast: item.forecast || 0,
  })) || [
    { date: 'Day 1', forecast: 2500000 },
    { date: 'Day 7', forecast: 2800000 },
    { date: 'Day 14', forecast: 3100000 },
    { date: 'Day 21', forecast: 2900000 },
    { date: 'Day 30', forecast: 3200000 },
  ]

  const workingCapital = apiData?.workingCapital || {
    currentAssets: 5000000,
    currentLiabilities: 2000000,
    workingCapital: 3000000,
    ratio: 2.5,
  }

  const ccc = {
    dio: 45, // Days Inventory Outstanding
    dso: 30, // Days Sales Outstanding
    dpo: 20, // Days Payable Outstanding
    ccc: 55, // Cash Conversion Cycle
  }

  const isLowCash = currentCash < 1000000

  return (
    <div className="overflow-y-auto overflow-x-hidden min-h-0 min-w-0 p-4 space-y-6">
      {/* Current Cash Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <GlassCard className="overflow-hidden min-w-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium truncate">Current Cash Position</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <div className="text-2xl font-bold text-purple-600 mb-2 break-words">
              {formatINRForDisplay(currentCash)}
            </div>
            {isLowCash && (
              <Badge variant="destructive" className="mt-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Low Cash Alert
              </Badge>
            )}
          </CardContent>
        </GlassCard>

        <GlassCard className="overflow-hidden min-w-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium truncate">Working Capital</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <div className="text-2xl font-bold text-success mb-2 break-words">
              {formatINRForDisplay(workingCapital.workingCapital)}
            </div>
            <div className="text-sm text-gray-500 break-words">
              Ratio: {workingCapital.ratio}x
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard className="overflow-hidden min-w-0">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium truncate">Cash Conversion Cycle</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 overflow-hidden">
            <div className="text-2xl font-bold text-info mb-2">
              {ccc.ccc} days
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5">
              <span>DIO: {ccc.dio}</span>
              <span>DSO: {ccc.dso}</span>
              <span>DPO: {ccc.dpo}</span>
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Cash Flow Chart */}
      <GlassCard className="overflow-hidden min-w-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg font-semibold truncate">Cash Flow Trend</CardTitle>
          <CardDescription className="break-words">Monthly cash inflows and outflows</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          <div className="w-full min-w-0" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="inflow" 
                stroke="#059669" 
                fill="url(#colorInflow)"
                name="Inflow"
              />
              <Area 
                type="monotone" 
                dataKey="outflow" 
                stroke="#DC2626" 
                fill="url(#colorOutflow)"
                name="Outflow"
              />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#53328A" 
                strokeWidth={2}
                name="Net Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </GlassCard>

      {/* Cash Flow Forecast */}
      <GlassCard className="overflow-hidden min-w-0">
        <CardHeader className="pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <CardTitle className="text-lg font-semibold truncate">Cash Flow Forecast</CardTitle>
              <CardDescription className="break-words">Projected cash position for next {forecastPeriod} days</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Button
                variant={forecastPeriod === '30' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastPeriod('30')}
              >
                30 Days
              </Button>
              <Button
                variant={forecastPeriod === '60' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastPeriod('60')}
              >
                60 Days
              </Button>
              <Button
                variant={forecastPeriod === '90' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setForecastPeriod('90')}
              >
                90 Days
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          <div className="w-full min-w-0" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#F5C700" 
                strokeWidth={2}
                name="Forecasted Cash"
              />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </GlassCard>

      {/* Cash Flow Calendar */}
      <GlassCard className="overflow-hidden min-w-0">
        <CardHeader className="pb-1">
          <CardTitle className="text-lg font-semibold truncate">Cash Flow Calendar</CardTitle>
          <CardDescription className="break-words">Upcoming inflows and outflows</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium break-words">Invoice Payment - INV-001</div>
                  <div className="text-sm text-gray-500">Jan 15, 2026</div>
                </div>
              </div>
              <div className="font-semibold text-green-600 flex-shrink-0">
                +{formatINRForDisplay(50000)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <TrendingDown className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium break-words">Vendor Payment - PO-123</div>
                  <div className="text-sm text-gray-500">Jan 18, 2026</div>
                </div>
              </div>
              <div className="font-semibold text-red-600 flex-shrink-0">
                -{formatINRForDisplay(30000)}
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
