'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar } from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
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

interface FinancialForecastingProps {
  tenantId: string
}

export function FinancialForecasting({ tenantId }: FinancialForecastingProps) {
  const [scenario, setScenario] = useState<'best' | 'base' | 'worst'>('base')
  const [forecastData, setForecastData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForecast()
  }, [tenantId])

  const fetchForecast = async () => {
    try {
      const token = useAuthStore.getState().token
      const response = await fetch('/api/finance/forecast', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setForecastData(data)
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use API data or fallback to mock
  const revenueForecast = forecastData?.forecast || [
    { month: 'Jan', actual: 1200000, forecast: 1300000, best: 1500000, worst: 1100000 },
    { month: 'Feb', actual: 1500000, forecast: 1600000, best: 1800000, worst: 1400000 },
    { month: 'Mar', actual: 1800000, forecast: 1900000, best: 2200000, worst: 1600000 },
    { month: 'Apr', actual: null, forecast: 2000000, best: 2400000, worst: 1700000 },
    { month: 'May', actual: null, forecast: 2100000, best: 2500000, worst: 1800000 },
    { month: 'Jun', actual: null, forecast: 2200000, best: 2600000, worst: 1900000 },
  ]

  // Budget vs Actual
  const budgetData = [
    { category: 'Revenue', budget: 2000000, actual: 1800000, variance: -10 },
    { category: 'Cost of Goods', budget: 800000, actual: 750000, variance: -6.25 },
    { category: 'Operating Expenses', budget: 500000, actual: 550000, variance: 10 },
    { category: 'Marketing', budget: 200000, actual: 180000, variance: -10 },
    { category: 'Admin', budget: 150000, actual: 160000, variance: 6.67 },
  ]

  const financialHealthScore = 75 // 0-100

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-8">
      {/* Financial Health Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold mb-2 ${getHealthColor(financialHealthScore)}`}>
              {financialHealthScore}/100
            </div>
            <Badge variant={financialHealthScore >= 80 ? 'default' : 'secondary'}>
              {financialHealthScore >= 80 ? 'Excellent' : financialHealthScore >= 60 ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success mb-2">+15%</div>
            <p className="text-sm text-gray-500">Month over month</p>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">22%</div>
            <p className="text-sm text-gray-500">Current month</p>
          </CardContent>
        </GlassCard>
      </div>

      {/* Revenue Forecast */}
      <GlassCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue Forecast (12 Months)</CardTitle>
              <CardDescription>Projected revenue with scenario planning</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={scenario === 'best' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenario('best')}
              >
                Best Case
              </Button>
              <Button
                variant={scenario === 'base' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenario('base')}
              >
                Base Case
              </Button>
              <Button
                variant={scenario === 'worst' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScenario('worst')}
              >
                Worst Case
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueForecast}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#53328A" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#53328A" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorWorst" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#F5C700" 
                fill="url(#colorForecast)"
                name="Actual"
              />
              <Area 
                type="monotone" 
                dataKey="forecast" 
                stroke="#53328A" 
                fill="url(#colorForecast)"
                strokeDasharray="5 5"
                name="Forecast"
              />
              {scenario === 'best' && (
                <Area 
                  type="monotone" 
                  dataKey="best" 
                  stroke="#059669" 
                  fill="url(#colorBest)"
                  strokeDasharray="3 3"
                  name="Best Case"
                />
              )}
              {scenario === 'worst' && (
                <Area 
                  type="monotone" 
                  dataKey="worst" 
                  stroke="#DC2626" 
                  fill="url(#colorWorst)"
                  strokeDasharray="3 3"
                  name="Worst Case"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </GlassCard>

      {/* Budget vs Actual */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Budget vs Actual</CardTitle>
          <CardDescription>Variance analysis by category</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatINRForDisplay(value)} />
              <Legend />
              <Bar dataKey="budget" fill="#8B5CF6" name="Budget" />
              <Bar dataKey="actual" fill="#F5C700" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {budgetData.map((item) => (
              <div key={item.category} className="flex items-center justify-between p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{item.category}</div>
                  <div className="text-sm text-gray-500">
                    Budget: {formatINRForDisplay(item.budget)} | 
                    Actual: {formatINRForDisplay(item.actual)}
                  </div>
                </div>
                <Badge 
                  variant={item.variance > 0 ? 'destructive' : 'default'}
                  className={item.variance > 0 ? 'text-red-600' : 'text-green-600'}
                >
                  {item.variance > 0 ? '+' : ''}{item.variance.toFixed(2)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </div>
  )
}
