'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  AlertCircle,
  Lightbulb
} from 'lucide-react'
import { DashboardLoading } from '@/components/ui/loading'
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const PAYAID_PURPLE = '#53328A'
const PAYAID_GOLD = '#F5C700'

interface ForecastData {
  forecast: number[]
  dates: string[]
  confidence: number
  confidenceIntervals: {
    lower80: number[]
    upper80: number[]
    lower95: number[]
    upper95: number[]
  }
  summary: {
    total90Day: number
    dailyAverage: number
    projectionVsCurrent: number
    runway?: number
  }
  modelsUsed: string[]
  historicalData: {
    dates: string[]
    revenue: number[]
  }
}

interface AIInsight {
  type: 'positive' | 'warning' | 'info'
  message: string
}

export function RevenueForecasting() {
  const { token } = useAuthStore()
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [horizonDays, setHorizonDays] = useState(90)

  useEffect(() => {
    fetchForecast()
  }, [horizonDays])

  const fetchForecast = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/forecast/revenue?horizonDays=${horizonDays}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch forecast')
      }

      const data = await response.json()
      if (data.success && data.forecast) {
        setForecast(data.forecast)
        generateInsights(data.forecast)
      }
    } catch (error) {
      console.error('Failed to fetch revenue forecast:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateInsights = (forecastData: ForecastData) => {
    const insights: AIInsight[] = []
    const { summary, confidence, projectionVsCurrent } = forecastData

    // Revenue trend insight
    if (projectionVsCurrent > 10) {
      insights.push({
        type: 'positive',
        message: `Revenue trending up ${projectionVsCurrent.toFixed(1)}% - maintain current growth initiatives`,
      })
    } else if (projectionVsCurrent < -10) {
      insights.push({
        type: 'warning',
        message: `Revenue declining ${Math.abs(projectionVsCurrent).toFixed(1)}% - consider promotional campaigns`,
      })
    }

    // Confidence insight
    if (confidence < 0.6) {
      insights.push({
        type: 'warning',
        message: `Low forecast confidence (${(confidence * 100).toFixed(0)}%) - limited historical data available`,
      })
    } else if (confidence > 0.85) {
      insights.push({
        type: 'positive',
        message: `High forecast confidence (${(confidence * 100).toFixed(0)}%) - reliable predictions`,
      })
    }

    // Runway insight
    if (summary.runway && summary.runway < 3) {
      insights.push({
        type: 'warning',
        message: `Low cash runway (${summary.runway.toFixed(1)} months) - consider fundraising or cost reduction`,
      })
    } else if (summary.runway && summary.runway > 12) {
      insights.push({
        type: 'positive',
        message: `Strong cash runway (${summary.runway.toFixed(1)} months) - can invest in growth`,
      })
    }

    // Hiring insight
    const monthlyRevenue = summary.dailyAverage * 30
    if (monthlyRevenue > 2500000) { // ₹25L/month
      insights.push({
        type: 'info',
        message: `Forecast supports ₹${(monthlyRevenue / 100000).toFixed(1)}L/month revenue - can hire 3+ sales reps`,
      })
    }

    setInsights(insights)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`
    }
    return `₹${amount.toFixed(0)}`
  }

  if (loading && !forecast) {
    return <DashboardLoading message="Generating revenue forecast..." />
  }

  if (!forecast) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No forecast data available</p>
        <Button onClick={fetchForecast} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Forecast
        </Button>
      </div>
    )
  }

  // Prepare chart data
  const chartData = forecast.forecast.map((value, i) => ({
    date: forecast.dates[i],
    forecast: value,
    upper95: forecast.confidenceIntervals.upper95[i],
    lower95: forecast.confidenceIntervals.lower95[i],
    upper80: forecast.confidenceIntervals.upper80[i],
    lower80: forecast.confidenceIntervals.lower80[i],
  }))

  // Combine historical and forecast data for full view
  const historicalChartData = forecast.historicalData.dates.map((date, i) => ({
    date,
    revenue: forecast.historicalData.revenue[i],
    type: 'historical',
  }))

  const forecastChartData = forecast.dates.map((date, i) => ({
    date,
    revenue: forecast.forecast[i],
    type: 'forecast',
  }))

  const combinedChartData = [...historicalChartData.slice(-30), ...forecastChartData] // Last 30 days historical + forecast

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">90-Day Revenue Projection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {formatCurrency(forecast.summary.total90Day)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Confidence: {(forecast.confidence * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {formatCurrency(forecast.summary.dailyAverage)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {forecast.summary.projectionVsCurrent > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              {Math.abs(forecast.summary.projectionVsCurrent).toFixed(1)}% vs current
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Period</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: PAYAID_PURPLE }}>
              {horizonDays} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Models: {forecast.modelsUsed.join(', ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Forecast</CardTitle>
              <CardDescription>
                {horizonDays}-day forecast with confidence intervals
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={horizonDays === 30 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHorizonDays(30)}
              >
                30 days
              </Button>
              <Button
                variant={horizonDays === 90 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHorizonDays(90)}
              >
                90 days
              </Button>
              <Button
                variant={horizonDays === 180 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHorizonDays(180)}
              >
                180 days
              </Button>
              <Button variant="outline" size="sm" onClick={fetchForecast}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PAYAID_PURPLE} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={PAYAID_PURPLE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConfidence95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e0e7ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e0e7ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
              />
              <Legend />
              {/* 95% Confidence Interval */}
              <Area
                type="monotone"
                dataKey="upper95"
                stroke="none"
                fill="url(#colorConfidence95)"
                fillOpacity={0.2}
                name="95% CI Upper"
              />
              <Area
                type="monotone"
                dataKey="lower95"
                stroke="none"
                fill="url(#colorConfidence95)"
                fillOpacity={0}
                name="95% CI Lower"
              />
              {/* Main Forecast */}
              <Area
                type="monotone"
                dataKey="forecast"
                stroke={PAYAID_PURPLE}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorForecast)"
                name="Forecast"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Historical + Forecast Combined View */}
      <Card>
        <CardHeader>
          <CardTitle>Historical vs Forecast</CardTitle>
          <CardDescription>Last 30 days historical + forecast trend</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={PAYAID_PURPLE}
                strokeWidth={2}
                dot={false}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" style={{ color: PAYAID_GOLD }} />
              AI Co-Founder Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.type === 'positive'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : insight.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
