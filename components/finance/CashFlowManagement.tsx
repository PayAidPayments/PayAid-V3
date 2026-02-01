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
  const [cashFlowData, setCashFlowData] = useState<any>(null)
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
        setCashFlowData(data)
      }
    } catch (error) {
      console.error('Failed to fetch cash flow:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use API data or fallback to mock
  const currentCash = cashFlowData?.currentCash || 2500000
  const cashFlowData = [
    { date: 'Jan', inflow: 1200000, outflow: 800000, net: 400000 },
    { date: 'Feb', inflow: 1500000, outflow: 900000, net: 600000 },
    { date: 'Mar', inflow: 1800000, outflow: 1100000, net: 700000 },
    { date: 'Apr', inflow: 1600000, outflow: 1000000, net: 600000 },
    { date: 'May', inflow: 1400000, outflow: 950000, net: 450000 },
    { date: 'Jun', inflow: 1700000, outflow: 1050000, net: 650000 },
  ]

  const forecastData = [
    { date: 'Day 1', forecast: 2500000 },
    { date: 'Day 7', forecast: 2800000 },
    { date: 'Day 14', forecast: 3100000 },
    { date: 'Day 21', forecast: 2900000 },
    { date: 'Day 30', forecast: 3200000 },
  ]

  const workingCapital = {
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
    <div className="space-y-8">
      {/* Current Cash Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Cash Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
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

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-2">
              {formatINRForDisplay(workingCapital.workingCapital)}
            </div>
            <div className="text-sm text-gray-500">
              Ratio: {workingCapital.ratio}x
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cash Conversion Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-info mb-2">
              {ccc.ccc} days
            </div>
            <div className="text-xs text-gray-500">
              DIO: {ccc.dio} | DSO: {ccc.dso} | DPO: {ccc.dpo}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Cash Flow Chart */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cash Flow Trend</CardTitle>
          <CardDescription>Monthly cash inflows and outflows</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
        </CardContent>
      </GlassCard>

      {/* Cash Flow Forecast */}
      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Cash Flow Forecast</CardTitle>
              <CardDescription>Projected cash position for next {forecastPeriod} days</CardDescription>
            </div>
            <div className="flex gap-2">
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
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
        </CardContent>
      </GlassCard>

      {/* Cash Flow Calendar */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cash Flow Calendar</CardTitle>
          <CardDescription>Upcoming inflows and outflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium">Invoice Payment - INV-001</div>
                  <div className="text-sm text-gray-500">Jan 15, 2026</div>
                </div>
              </div>
              <div className="font-semibold text-green-600">
                +{formatINRForDisplay(50000)}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-medium">Vendor Payment - PO-123</div>
                  <div className="text-sm text-gray-500">Jan 18, 2026</div>
                </div>
              </div>
              <div className="font-semibold text-red-600">
                -{formatINRForDisplay(30000)}
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
