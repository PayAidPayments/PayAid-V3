/**
 * What-If Analysis Engine
 * Generates scenario-based forecasts and comparisons
 */

import { forecastRevenue } from './forecast-engine'
import { prisma } from '@/lib/db/prisma'

export interface WhatIfScenario {
  id: string
  name: string
  description: string
  type: 'pricing' | 'hiring' | 'product' | 'marketing' | 'custom'
  parameters: Record<string, any>
  createdAt: Date
}

export interface ScenarioResult {
  scenario: WhatIfScenario
  forecast: {
    total90Day: number
    dailyAverage: number
    projectionVsCurrent: number
    confidence: number
  }
  impact: {
    revenueChange: number // Percentage change
    absoluteChange: number // Absolute revenue change
    affectedMetrics: string[]
  }
  assumptions: string[]
}

/**
 * Apply scenario parameters to forecast
 */
async function applyScenarioToForecast(
  tenantId: string,
  scenario: WhatIfScenario
): Promise<ScenarioResult> {
  // Get baseline forecast
  const baseline = await forecastRevenue(tenantId, {
    horizonDays: 90,
    historicalDays: 180,
  })

  // Apply scenario-specific modifications
  let modifiedForecast = { ...baseline }

  switch (scenario.type) {
    case 'pricing':
      // Adjust forecast based on price change
      const priceChange = scenario.parameters.priceChangePercent || 0
      const elasticity = scenario.parameters.elasticity || -1.5 // Default price elasticity
      const volumeChange = priceChange * elasticity

      modifiedForecast.forecast = baseline.forecast.map((revenue) => {
        const newPrice = 1 + priceChange / 100
        const newVolume = 1 + volumeChange / 100
        return revenue * newPrice * newVolume
      })

      modifiedForecast.summary.total90Day = modifiedForecast.forecast.reduce(
        (sum, f) => sum + f,
        0
      )
      modifiedForecast.summary.dailyAverage =
        modifiedForecast.summary.total90Day / modifiedForecast.forecast.length
      break

    case 'hiring': {
      // Adjust forecast based on new hires (sales reps)
      const newReps = scenario.parameters.newReps || 0
      const revenuePerRep = scenario.parameters.revenuePerRep || 50000 // Monthly per rep
      const rampUpMonths = scenario.parameters.rampUpMonths || 3

      const additionalRevenue = newReps * revenuePerRep * (rampUpMonths / 3) // Ramp-up effect
      const dailyAdditional = additionalRevenue / 30

      modifiedForecast.forecast = baseline.forecast.map((revenue, index) => {
        // Gradual ramp-up over first 90 days
        const rampFactor = Math.min(1, (index + 1) / (rampUpMonths * 30))
        return revenue + dailyAdditional * rampFactor
      })

      modifiedForecast.summary.total90Day = modifiedForecast.forecast.reduce(
        (sum, f) => sum + f,
        0
      )
      modifiedForecast.summary.dailyAverage =
        modifiedForecast.summary.total90Day / modifiedForecast.forecast.length
      break
    }

    case 'product':
      // Adjust forecast based on new product launch
      const launchDate = scenario.parameters.launchDate
        ? new Date(scenario.parameters.launchDate)
        : new Date()
      const expectedMonthlyRevenue = scenario.parameters.expectedMonthlyRevenue || 100000
      const growthRate = scenario.parameters.growthRate || 0.1 // 10% monthly growth

      modifiedForecast.forecast = baseline.forecast.map((revenue, index) => {
        const forecastDate = new Date()
        forecastDate.setDate(forecastDate.getDate() + index)

        if (forecastDate >= launchDate) {
          const monthsSinceLaunch =
            (forecastDate.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          const productRevenue =
            expectedMonthlyRevenue * Math.pow(1 + growthRate, monthsSinceLaunch) / 30
          return revenue + productRevenue
        }
        return revenue
      })

      modifiedForecast.summary.total90Day = modifiedForecast.forecast.reduce(
        (sum, f) => sum + f,
        0
      )
      modifiedForecast.summary.dailyAverage =
        modifiedForecast.summary.total90Day / modifiedForecast.forecast.length
      break

    case 'marketing': {
      // Adjust forecast based on marketing spend
      const marketingSpend = scenario.parameters.marketingSpend || 0
      const roas = scenario.parameters.roas || 3.0 // Return on ad spend
      const attributionWindow = scenario.parameters.attributionWindow || 30 // days

      const additionalRevenue = marketingSpend * roas
      const dailyAdditional = additionalRevenue / attributionWindow

      modifiedForecast.forecast = baseline.forecast.map((revenue, index) => {
        // Marketing impact decays over attribution window
        if (index < attributionWindow) {
          const decayFactor = 1 - index / attributionWindow
          return revenue + dailyAdditional * decayFactor
        }
        return revenue
      })

      modifiedForecast.summary.total90Day = modifiedForecast.forecast.reduce(
        (sum, f) => sum + f,
        0
      )
      modifiedForecast.summary.dailyAverage =
        modifiedForecast.summary.total90Day / modifiedForecast.forecast.length
      break
    }

    case 'custom':
      // Custom scenario with manual adjustments
      const adjustmentFactor = scenario.parameters.adjustmentFactor || 1.0
      modifiedForecast.forecast = baseline.forecast.map((r) => r * adjustmentFactor)
      modifiedForecast.summary.total90Day = modifiedForecast.forecast.reduce(
        (sum, f) => sum + f,
        0
      )
      modifiedForecast.summary.dailyAverage =
        modifiedForecast.summary.total90Day / modifiedForecast.forecast.length
      break
  }

  // Calculate impact
  const revenueChange =
    ((modifiedForecast.summary.total90Day - baseline.summary.total90Day) /
      baseline.summary.total90Day) *
    100
  const absoluteChange =
    modifiedForecast.summary.total90Day - baseline.summary.total90Day

  // Generate assumptions
  const assumptions = generateAssumptions(scenario, baseline, modifiedForecast)

  return {
    scenario,
    forecast: {
      total90Day: modifiedForecast.summary.total90Day,
      dailyAverage: modifiedForecast.summary.dailyAverage,
      projectionVsCurrent: modifiedForecast.summary.projectionVsCurrent,
      confidence: modifiedForecast.confidence,
    },
    impact: {
      revenueChange,
      absoluteChange,
      affectedMetrics: getAffectedMetrics(scenario.type),
    },
    assumptions,
  }
}

/**
 * Generate assumptions for a scenario
 */
function generateAssumptions(
  scenario: WhatIfScenario,
  baseline: any,
  modified: any
): string[] {
  const assumptions: string[] = []

  switch (scenario.type) {
    case 'pricing':
      assumptions.push(
        `Price elasticity of ${scenario.parameters.elasticity || -1.5} assumed`
      )
      assumptions.push(
        `Customer retention rate of ${scenario.parameters.retentionRate || 80}% assumed`
      )
      break
    case 'hiring':
      assumptions.push(
        `New reps will generate ₹${scenario.parameters.revenuePerRep || 50000}/month after ${scenario.parameters.rampUpMonths || 3} months`
      )
      assumptions.push('Ramp-up period includes training and onboarding')
      break
    case 'product':
      assumptions.push(
        `Product will reach ₹${scenario.parameters.expectedMonthlyRevenue || 100000}/month with ${(scenario.parameters.growthRate || 0.1) * 100}% monthly growth`
      )
      break
    case 'marketing':
      assumptions.push(
        `ROAS of ${scenario.parameters.roas || 3.0}x assumed for marketing spend`
      )
      assumptions.push(
        `Attribution window of ${scenario.parameters.attributionWindow || 30} days`
      )
      break
  }

  assumptions.push(`Baseline forecast confidence: ${(baseline.confidence * 100).toFixed(1)}%`)
  assumptions.push('Scenario assumes current business trends continue')

  return assumptions
}

/**
 * Get affected metrics for scenario type
 */
function getAffectedMetrics(type: string): string[] {
  const metrics: Record<string, string[]> = {
    pricing: ['Revenue', 'Customer Count', 'Average Order Value'],
    hiring: ['Revenue', 'Sales Capacity', 'Customer Acquisition'],
    product: ['Revenue', 'Product Mix', 'Customer Lifetime Value'],
    marketing: ['Revenue', 'Customer Acquisition Cost', 'Lead Generation'],
    custom: ['Revenue'],
  }

  return metrics[type] || ['Revenue']
}

/**
 * Run what-if analysis for multiple scenarios
 */
export async function runWhatIfAnalysis(
  tenantId: string,
  scenarios: WhatIfScenario[]
): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = []

  for (const scenario of scenarios) {
    try {
      const result = await applyScenarioToForecast(tenantId, scenario)
      results.push(result)
    } catch (error) {
      console.error(`Error running scenario ${scenario.id}:`, error)
      // Continue with other scenarios
    }
  }

  return results
}

/**
 * Compare scenarios side-by-side
 */
export function compareScenarios(results: ScenarioResult[]): {
  bestScenario: ScenarioResult | null
  worstScenario: ScenarioResult | null
  averageImpact: number
  recommendations: string[]
} {
  if (results.length === 0) {
    return {
      bestScenario: null,
      worstScenario: null,
      averageImpact: 0,
      recommendations: [],
    }
  }

  // Sort by revenue impact
  const sorted = [...results].sort(
    (a, b) => b.impact.revenueChange - a.impact.revenueChange
  )

  const bestScenario = sorted[0]
  const worstScenario = sorted[sorted.length - 1]
  const averageImpact =
    results.reduce((sum, r) => sum + r.impact.revenueChange, 0) / results.length

  // Generate recommendations
  const recommendations: string[] = []
  if (bestScenario.impact.revenueChange > 10) {
    recommendations.push(
      `Strongly consider "${bestScenario.scenario.name}" - projected ${bestScenario.impact.revenueChange.toFixed(1)}% revenue increase`
    )
  }
  if (worstScenario.impact.revenueChange < -5) {
    recommendations.push(
      `Avoid "${worstScenario.scenario.name}" - projected ${worstScenario.impact.revenueChange.toFixed(1)}% revenue decrease`
    )
  }
  if (averageImpact > 0) {
    recommendations.push(
      `Overall, scenarios show positive potential with average ${averageImpact.toFixed(1)}% increase`
    )
  }

  return {
    bestScenario,
    worstScenario,
    averageImpact,
    recommendations,
  }
}
