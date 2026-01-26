import { prisma } from '@/lib/db/prisma'
import { forecastRevenue, ForecastResult } from './forecast-engine'
import { calculateDealClosureProbability } from './deal-closure-probability'

export interface RevenueForecastScenarios {
  conservative: number // P20 scenario (20th percentile)
  base: number // P50 scenario (median)
  upside: number // P80 scenario (80th percentile)
  confidence: number // Overall confidence 0-100%
}

export interface DealBasedForecast {
  scenarios: RevenueForecastScenarios
  dealBreakdown: Array<{
    dealId: string
    dealName: string
    value: number
    probability: number
    expectedValue: number
    stage: string
  }>
  totalExpectedValue: number
  confidenceIntervals: {
    lower80: number
    upper80: number
    lower95: number
    upper95: number
  }
}

/**
 * Generate 90-day revenue forecast based on deals
 * Combines time-series forecasting with deal probability analysis
 */
export async function generateRevenueForecast(
  tenantId: string,
  horizonDays: number = 90
): Promise<DealBasedForecast> {
  // Get all active deals
  const deals = await prisma.deal.findMany({
    where: {
      tenantId,
      status: { notIn: ['won', 'lost'] },
    },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  // Calculate expected value for each deal
  const dealBreakdown: DealBasedForecast['dealBreakdown'] = []
  let totalExpectedValue = 0

  for (const deal of deals) {
    try {
      const probability = await calculateDealClosureProbability({
        dealId: deal.id,
        tenantId,
      })

      const expectedValue = (deal.value * probability.probability) / 100

      dealBreakdown.push({
        dealId: deal.id,
        dealName: deal.name,
        value: deal.value,
        probability: probability.probability,
        expectedValue,
        stage: deal.stage,
      })

      totalExpectedValue += expectedValue
    } catch (error) {
      console.error(`Error calculating probability for deal ${deal.id}:`, error)
    }
  }

  // Sort by expected value (highest first)
  dealBreakdown.sort((a, b) => b.expectedValue - a.expectedValue)

  // Calculate scenarios based on probability distribution
  const scenarios = calculateScenarios(dealBreakdown, totalExpectedValue)

  // Calculate confidence intervals
  const confidenceIntervals = calculateConfidenceIntervals(
    dealBreakdown,
    totalExpectedValue
  )

  return {
    scenarios,
    dealBreakdown: dealBreakdown.slice(0, 20), // Top 20 deals
    totalExpectedValue,
    confidenceIntervals,
  }
}

/**
 * Calculate forecast scenarios (conservative, base, upside)
 */
function calculateScenarios(
  dealBreakdown: DealBasedForecast['dealBreakdown'],
  baseValue: number
): RevenueForecastScenarios {
  // Conservative (P20): Assume lower probabilities
  const conservative = dealBreakdown.reduce((sum, deal) => {
    const conservativeProb = Math.max(0, deal.probability - 20)
    return sum + (deal.value * conservativeProb) / 100
  }, 0)

  // Base (P50): Use actual probabilities
  const base = baseValue

  // Upside (P80): Assume higher probabilities
  const upside = dealBreakdown.reduce((sum, deal) => {
    const upsideProb = Math.min(100, deal.probability + 20)
    return sum + (deal.value * upsideProb) / 100
  }, 0)

  // Calculate overall confidence based on deal count and probability spread
  const avgProbability = dealBreakdown.length > 0
    ? dealBreakdown.reduce((sum, d) => sum + d.probability, 0) / dealBreakdown.length
    : 0
  const confidence = Math.min(100, Math.max(0, avgProbability))

  return {
    conservative: parseFloat(conservative.toFixed(0)),
    base: parseFloat(base.toFixed(0)),
    upside: parseFloat(upside.toFixed(0)),
    confidence: parseFloat(confidence.toFixed(1)),
  }
}

/**
 * Calculate confidence intervals
 */
function calculateConfidenceIntervals(
  dealBreakdown: DealBasedForecast['dealBreakdown'],
  baseValue: number
): DealBasedForecast['confidenceIntervals'] {
  // Calculate standard deviation of expected values
  const expectedValues = dealBreakdown.map((d) => d.expectedValue)
  const mean = expectedValues.length > 0
    ? expectedValues.reduce((sum, v) => sum + v, 0) / expectedValues.length
    : 0
  const variance = expectedValues.length > 0
    ? expectedValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / expectedValues.length
    : 0
  const stdDev = Math.sqrt(variance)

  // Z-scores for confidence intervals
  const z80 = 1.28 // 80% confidence
  const z95 = 1.96 // 95% confidence

  return {
    lower80: Math.max(0, parseFloat((baseValue - z80 * stdDev).toFixed(0))),
    upper80: parseFloat((baseValue + z80 * stdDev).toFixed(0)),
    lower95: Math.max(0, parseFloat((baseValue - z95 * stdDev).toFixed(0))),
    upper95: parseFloat((baseValue + z95 * stdDev).toFixed(0)),
  }
}

/**
 * Generate combined forecast (time-series + deal-based)
 */
export async function generateCombinedForecast(
  tenantId: string,
  horizonDays: number = 90
): Promise<{
  timeSeriesForecast: ForecastResult
  dealBasedForecast: DealBasedForecast
  combinedForecast: {
    conservative: number
    base: number
    upside: number
    confidence: number
  }
}> {
  // Get time-series forecast
  const timeSeriesForecast = await forecastRevenue(tenantId, {
    horizonDays,
  })

  // Get deal-based forecast
  const dealBasedForecast = await generateRevenueForecast(tenantId, horizonDays)

  // Combine both forecasts (weighted average)
  // Time-series gets 40% weight, deal-based gets 60% weight
  const timeSeriesWeight = 0.4
  const dealBasedWeight = 0.6

  const combinedForecast = {
    conservative: parseFloat(
      (
        timeSeriesForecast.summary.total90Day * timeSeriesWeight * 0.8 +
        dealBasedForecast.scenarios.conservative * dealBasedWeight
      ).toFixed(0)
    ),
    base: parseFloat(
      (
        timeSeriesForecast.summary.total90Day * timeSeriesWeight +
        dealBasedForecast.scenarios.base * dealBasedWeight
      ).toFixed(0)
    ),
    upside: parseFloat(
      (
        timeSeriesForecast.summary.total90Day * timeSeriesWeight * 1.2 +
        dealBasedForecast.scenarios.upside * dealBasedWeight
      ).toFixed(0)
    ),
    confidence: parseFloat(
      (
        (timeSeriesForecast.confidence * 100 * timeSeriesWeight +
          dealBasedForecast.scenarios.confidence * dealBasedWeight)
      ).toFixed(1)
    ),
  }

  return {
    timeSeriesForecast,
    dealBasedForecast,
    combinedForecast,
  }
}
