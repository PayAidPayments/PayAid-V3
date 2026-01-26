/**
 * Revenue Forecasting Engine
 * Generates 90-day revenue forecasts using multiple time-series models
 * 
 * Phase 1: Basic forecasting with moving average + trend
 * Phase 2: Advanced models (SARIMA, Exponential Smoothing, Linear Regression) via Python service
 */

import { prisma } from '@/lib/db/prisma'
import axios from 'axios'

export interface ForecastResult {
  forecast: number[] // Daily revenue predictions
  dates: string[] // ISO date strings
  confidence: number // 0-1, model confidence score
  confidenceIntervals: {
    lower80: number[]
    upper80: number[]
    lower95: number[]
    upper95: number[]
  }
  summary: {
    total90Day: number
    dailyAverage: number
    projectionVsCurrent: number // Percentage change
    runway?: number // Months of runway at current burn rate
  }
  modelsUsed: string[]
  historicalData: {
    dates: string[]
    revenue: number[]
  }
}

export interface ForecastOptions {
  horizonDays?: number // Default 90
  historicalDays?: number // Default 180 (6 months)
  includeConfidenceIntervals?: boolean
}

/**
 * Get historical revenue data from invoices
 */
async function getHistoricalRevenueData(
  tenantId: string,
  days: number = 180
): Promise<Array<{ date: Date; revenue: number }>> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'PAID',
      createdAt: { gte: startDate },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by date and sum revenue
  const dailyRevenue: Map<string, number> = new Map()

  invoices.forEach((invoice) => {
    const dateKey = invoice.createdAt.toISOString().split('T')[0] // YYYY-MM-DD
    const revenue = Number(invoice.total || 0)
    dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) || 0) + revenue)
  })

  // Convert to array and sort by date
  const result = Array.from(dailyRevenue.entries())
    .map(([dateStr, revenue]) => ({
      date: new Date(dateStr),
      revenue,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return result
}

/**
 * Simple Moving Average + Trend forecasting
 * Phase 1 baseline implementation
 */
function simpleMovingAverageForecast(
  historicalData: Array<{ date: Date; revenue: number }>,
  horizonDays: number
): {
  forecast: number[]
  dates: Date[]
  confidence: number
} {
  if (historicalData.length === 0) {
    // No data, return zero forecast
    const dates = Array.from({ length: horizonDays }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i + 1)
      return date
    })
    return {
      forecast: new Array(horizonDays).fill(0),
      dates,
      confidence: 0,
    }
  }

  // Calculate moving average (last 30 days or available data)
  const windowSize = Math.min(30, historicalData.length)
  const recentData = historicalData.slice(-windowSize)
  const averageRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length

  // Calculate trend (simple linear regression on recent data)
  const n = recentData.length
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0

  recentData.forEach((d, i) => {
    const x = i
    const y = d.revenue
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Generate forecast
  const forecast: number[] = []
  const dates: Date[] = []
  const lastDate = historicalData[historicalData.length - 1].date

  for (let i = 1; i <= horizonDays; i++) {
    const date = new Date(lastDate)
    date.setDate(date.getDate() + i)
    dates.push(date)

    // Forecast = trend + base average
    const trendValue = intercept + slope * (windowSize + i)
    const forecastValue = Math.max(0, trendValue) // Ensure non-negative
    forecast.push(forecastValue)
  }

  // Calculate confidence based on data quality
  const variance = recentData.reduce((sum, d) => {
    const diff = d.revenue - averageRevenue
    return sum + diff * diff
  }, 0) / recentData.length

  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = averageRevenue > 0 ? stdDev / averageRevenue : 1
  const confidence = Math.max(0, Math.min(1, 1 - coefficientOfVariation)) // Lower variance = higher confidence

  return { forecast, dates, confidence }
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceIntervals(
  forecast: number[],
  historicalData: Array<{ date: Date; revenue: number }>
): {
  lower80: number[]
  upper80: number[]
  lower95: number[]
  upper95: number[]
} {
  // Calculate standard error from historical data
  const recentData = historicalData.slice(-30)
  if (recentData.length === 0) {
    return {
      lower80: forecast.map(() => 0),
      upper80: forecast.map(() => 0),
      lower95: forecast.map(() => 0),
      upper95: forecast.map(() => 0),
    }
  }

  const mean = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length
  const variance = recentData.reduce((sum, d) => {
    const diff = d.revenue - mean
    return sum + diff * diff
  }, 0) / recentData.length
  const stdDev = Math.sqrt(variance)

  // Z-scores for confidence intervals
  const z80 = 1.28 // 80% confidence
  const z95 = 1.96 // 95% confidence

  return {
    lower80: forecast.map((f) => Math.max(0, f - z80 * stdDev)),
    upper80: forecast.map((f) => f + z80 * stdDev),
    lower95: forecast.map((f) => Math.max(0, f - z95 * stdDev)),
    upper95: forecast.map((f) => f + z95 * stdDev),
  }
}

/**
 * Main forecasting function
 * Tries Python service first (advanced models), falls back to TypeScript (simple model)
 */
export async function forecastRevenue(
  tenantId: string,
  options: ForecastOptions = {}
): Promise<ForecastResult> {
  const {
    horizonDays = 90,
    historicalDays = 180,
    includeConfidenceIntervals = true,
  } = options

  // Get historical data
  const historicalData = await getHistoricalRevenueData(tenantId, historicalDays)

  // Try Python service first (advanced models)
  const pythonServiceUrl = process.env.FORECAST_SERVICE_URL || 'http://localhost:8000'
  const useAdvancedModels = process.env.USE_ADVANCED_FORECASTING !== 'false' // Default to true

  if (useAdvancedModels && historicalData.length >= 30) {
    try {
      const response = await axios.post(
        `${pythonServiceUrl}/api/forecast/revenue`,
        {
          tenant_id: tenantId,
          historical_data: historicalData.map((d) => ({
            date: d.date.toISOString().split('T')[0],
            revenue: d.revenue,
          })),
          horizon_days: horizonDays,
          historical_days: historicalDays,
          include_confidence_intervals: includeConfidenceIntervals,
        },
        {
          timeout: 30000, // 30 second timeout
        }
      )

      if (response.data) {
        // Map Python service response to our format
        return {
          forecast: response.data.forecast,
          dates: response.data.dates,
          confidence: response.data.confidence,
          confidenceIntervals: response.data.confidence_intervals
            ? {
                lower80: response.data.confidence_intervals.lower_80,
                upper80: response.data.confidence_intervals.upper_80,
                lower95: response.data.confidence_intervals.lower_95,
                upper95: response.data.confidence_intervals.upper_95,
              }
            : undefined,
          summary: {
            total90Day: response.data.summary.total_90day,
            dailyAverage: response.data.summary.daily_average,
            projectionVsCurrent: response.data.summary.projection_vs_current,
          },
          modelsUsed: response.data.models_used || ['advanced_ensemble'],
          historicalData: {
            dates: historicalData.map((d) => d.date.toISOString().split('T')[0]),
            revenue: historicalData.map((d) => d.revenue),
          },
        }
      }
    } catch (error) {
      console.warn(
        'Python forecasting service unavailable, using fallback:',
        error instanceof Error ? error.message : String(error)
      )
      // Fall through to simple model
    }
  }

  // Fallback: Use simple moving average + trend (Phase 1 implementation)
  const { forecast, dates, confidence } = simpleMovingAverageForecast(
    historicalData,
    horizonDays
  )

  // Calculate confidence intervals
  const confidenceIntervals = includeConfidenceIntervals
    ? calculateConfidenceIntervals(forecast, historicalData)
    : {
        lower80: forecast.map(() => 0),
        upper80: forecast.map(() => 0),
        lower95: forecast.map(() => 0),
        upper95: forecast.map(() => 0),
      }

  // Calculate summary metrics
  const total90Day = forecast.reduce((sum, f) => sum + f, 0)
  const dailyAverage = forecast.length > 0 ? total90Day / forecast.length : 0

  // Get current daily revenue (last 7 days average)
  const recent7Days = historicalData.slice(-7)
  const currentDailyAverage =
    recent7Days.length > 0
      ? recent7Days.reduce((sum, d) => sum + d.revenue, 0) / recent7Days.length
      : 0

  const projectionVsCurrent =
    currentDailyAverage > 0
      ? ((dailyAverage - currentDailyAverage) / currentDailyAverage) * 100
      : 0

  // Format dates as ISO strings
  const dateStrings = dates.map((d) => d.toISOString().split('T')[0])

  // Format historical data
  const historicalDates = historicalData.map((d) =>
    d.date.toISOString().split('T')[0]
  )
  const historicalRevenue = historicalData.map((d) => d.revenue)

  return {
    forecast,
    dates: dateStrings,
    confidence,
    confidenceIntervals,
    summary: {
      total90Day,
      dailyAverage,
      projectionVsCurrent,
    },
    modelsUsed: ['moving_average_trend'], // Fallback model when Python service unavailable
    historicalData: {
      dates: historicalDates,
      revenue: historicalRevenue,
    },
  }
}

/**
 * Get current daily revenue (for comparison)
 */
export async function getCurrentDailyRevenue(tenantId: string): Promise<number> {
  const recentData = await getHistoricalRevenueData(tenantId, 7)
  if (recentData.length === 0) return 0
  return recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length
}
