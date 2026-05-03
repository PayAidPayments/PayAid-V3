import { prisma } from '@/lib/db/prisma'
import { calculateDealClosureProbability } from './deal-closure-probability'
import { calculateChurnRisk } from './churn-predictor'
import { calculateUpsellOpportunity } from './upsell-detector'
import { generateRevenueForecast } from './revenue-forecast'

/**
 * Scenario Planning (What-If Analysis)
 * 
 * Allows users to simulate different scenarios:
 * - What if we close these at-risk deals?
 * - What if we lose these customers?
 * - What if we upsell these customers?
 * - What if we improve deal closure rates?
 */

export interface ScenarioInput {
  tenantId: string
  scenarioType: 'close-deals' | 'lose-customers' | 'upsell-customers' | 'improve-closure-rate'
  parameters: {
    dealIds?: string[]
    contactIds?: string[]
    closureRateImprovement?: number // Percentage improvement
  }
}

export interface ScenarioResult {
  scenarioType: string
  currentState: {
    revenue: number
    customerCount: number
    dealCount: number
  }
  projectedState: {
    revenue: number
    customerCount: number
    dealCount: number
    revenueChange: number
    revenueChangePercent: number
  }
  actions: Array<{
    type: string
    description: string
    impact: number
    priority: 'high' | 'medium' | 'low'
  }>
  recommendations: string[]
  confidence: number // 0-100%
}

/**
 * Run scenario analysis
 */
export async function runScenario(input: ScenarioInput): Promise<ScenarioResult> {
  // Get current state
  const currentState = await getCurrentState(input.tenantId)

  // Calculate projected state based on scenario
  let projectedState: ScenarioResult['projectedState']
  let actions: ScenarioResult['actions'] = []
  let recommendations: string[] = []

  switch (input.scenarioType) {
    case 'close-deals':
      projectedState = await scenarioCloseDeals(input, currentState)
      actions = await generateCloseDealActions(input.parameters.dealIds || [], input.tenantId)
      recommendations = generateCloseDealRecommendations(projectedState)
      break

    case 'lose-customers':
      projectedState = await scenarioLoseCustomers(input, currentState)
      actions = await generateRetentionActions(input.parameters.contactIds || [], input.tenantId)
      recommendations = generateRetentionRecommendations(projectedState)
      break

    case 'upsell-customers':
      projectedState = await scenarioUpsellCustomers(input, currentState)
      actions = await generateUpsellActions(input.parameters.contactIds || [], input.tenantId)
      recommendations = generateUpsellRecommendations(projectedState)
      break

    case 'improve-closure-rate':
      projectedState = await scenarioImproveClosureRate(input, currentState)
      actions = await generateImprovementActions(input.tenantId)
      recommendations = generateImprovementRecommendations(projectedState)
      break
  }

  // Calculate confidence
  const confidence = calculateScenarioConfidence(input, projectedState)

  return {
    scenarioType: input.scenarioType,
    currentState,
    projectedState,
    actions,
    recommendations,
    confidence,
  }
}

/**
 * Get current state metrics
 */
async function getCurrentState(tenantId: string): Promise<ScenarioResult['currentState']> {
  const [deals, contacts, forecast] = await Promise.all([
    prisma.deal.findMany({
      where: {
        tenantId,
        stage: { notIn: ['won', 'lost'] },
      },
    }),
    prisma.contact.findMany({
      where: {
        tenantId,
        stage: { notIn: ['lost', 'inactive'] },
      },
    }),
    generateRevenueForecast(tenantId, 90),
  ])

  const totalRevenue = forecast.totalExpectedValue

  return {
    revenue: totalRevenue,
    customerCount: contacts.length,
    dealCount: deals.length,
  }
}

/**
 * Scenario: Close specific deals
 */
async function scenarioCloseDeals(
  input: ScenarioInput,
  currentState: ScenarioResult['currentState']
): Promise<ScenarioResult['projectedState']> {
  if (!input.parameters.dealIds || input.parameters.dealIds.length === 0) {
    return {
      ...currentState,
      revenueChange: 0,
      revenueChangePercent: 0,
    }
  }

  let additionalRevenue = 0

  for (const dealId of input.parameters.dealIds) {
    try {
      const deal = await prisma.deal.findUnique({
        where: { id: dealId, tenantId: input.tenantId },
      })

      if (deal) {
        const probability = await calculateDealClosureProbability({
          dealId,
          tenantId: input.tenantId,
        })

        // If we close this deal, we get the full value
        // Current expected value is already in forecast, so we add the difference
        const currentExpectedValue = (deal.value * probability.probability) / 100
        const additionalValue = deal.value - currentExpectedValue
        additionalRevenue += additionalValue
      }
    } catch (error) {
      console.error(`Error processing deal ${dealId}:`, error)
    }
  }

  const projectedRevenue = currentState.revenue + additionalRevenue
  const revenueChange = additionalRevenue
  const revenueChangePercent = currentState.revenue > 0
    ? (revenueChange / currentState.revenue) * 100
    : 0

  return {
    revenue: projectedRevenue,
    customerCount: currentState.customerCount,
    dealCount: currentState.dealCount - input.parameters.dealIds.length, // Deals move to won
    revenueChange,
    revenueChangePercent: parseFloat(revenueChangePercent.toFixed(1)),
  }
}

/**
 * Scenario: Lose specific customers
 */
async function scenarioLoseCustomers(
  input: ScenarioInput,
  currentState: ScenarioResult['currentState']
): Promise<ScenarioResult['projectedState']> {
  if (!input.parameters.contactIds || input.parameters.contactIds.length === 0) {
    return {
      ...currentState,
      revenueChange: 0,
      revenueChangePercent: 0,
    }
  }

  let lostRevenue = 0

  for (const contactId of input.parameters.contactIds) {
    try {
      // Get customer's active deals
      const deals = await prisma.deal.findMany({
        where: {
          tenantId: input.tenantId,
          contactId,
          stage: { notIn: ['won', 'lost'] },
        },
      })

      for (const deal of deals) {
        const probability = await calculateDealClosureProbability({
          dealId: deal.id,
          tenantId: input.tenantId,
        })
        const expectedValue = (deal.value * probability.probability) / 100
        lostRevenue += expectedValue
      }

      // Estimate monthly recurring revenue loss (if applicable)
      // This would integrate with finance module
      lostRevenue += 5000 // Placeholder: ₹5k/month per customer
    } catch (error) {
      console.error(`Error processing contact ${contactId}:`, error)
    }
  }

  const projectedRevenue = Math.max(0, currentState.revenue - lostRevenue)
  const revenueChange = -lostRevenue
  const revenueChangePercent = currentState.revenue > 0
    ? (revenueChange / currentState.revenue) * 100
    : 0

  return {
    revenue: projectedRevenue,
    customerCount: currentState.customerCount - input.parameters.contactIds.length,
    dealCount: currentState.dealCount,
    revenueChange,
    revenueChangePercent: parseFloat(revenueChangePercent.toFixed(1)),
  }
}

/**
 * Scenario: Upsell specific customers
 */
async function scenarioUpsellCustomers(
  input: ScenarioInput,
  currentState: ScenarioResult['currentState']
): Promise<ScenarioResult['projectedState']> {
  if (!input.parameters.contactIds || input.parameters.contactIds.length === 0) {
    return {
      ...currentState,
      revenueChange: 0,
      revenueChangePercent: 0,
    }
  }

  let additionalRevenue = 0

  for (const contactId of input.parameters.contactIds) {
    try {
      const opportunity = await calculateUpsellOpportunity({
        contactId,
        tenantId: input.tenantId,
      })

      // Additional monthly revenue from upsell
      additionalRevenue += opportunity.estimatedUpsellValue * 3 // 3 months
    } catch (error) {
      console.error(`Error processing contact ${contactId}:`, error)
    }
  }

  const projectedRevenue = currentState.revenue + additionalRevenue
  const revenueChange = additionalRevenue
  const revenueChangePercent = currentState.revenue > 0
    ? (revenueChange / currentState.revenue) * 100
    : 0

  return {
    revenue: projectedRevenue,
    customerCount: currentState.customerCount,
    dealCount: currentState.dealCount,
    revenueChange,
    revenueChangePercent: parseFloat(revenueChangePercent.toFixed(1)),
  }
}

/**
 * Scenario: Improve closure rate
 */
async function scenarioImproveClosureRate(
  input: ScenarioInput,
  currentState: ScenarioResult['currentState']
): Promise<ScenarioResult['projectedState']> {
  const improvementPercent = input.parameters.closureRateImprovement || 10

  // Get all active deals
  const deals = await prisma.deal.findMany({
    where: {
      tenantId: input.tenantId,
      stage: { notIn: ['won', 'lost'] },
    },
  })

  let additionalRevenue = 0

  for (const deal of deals) {
    try {
      const probability = await calculateDealClosureProbability({
        dealId: deal.id,
        tenantId: input.tenantId,
      })

      // Improved probability
      const improvedProbability = Math.min(
        100,
        probability.probability + improvementPercent
      )

      const currentExpectedValue = (deal.value * probability.probability) / 100
      const improvedExpectedValue = (deal.value * improvedProbability) / 100
      additionalRevenue += improvedExpectedValue - currentExpectedValue
    } catch (error) {
      console.error(`Error processing deal ${deal.id}:`, error)
    }
  }

  const projectedRevenue = currentState.revenue + additionalRevenue
  const revenueChange = additionalRevenue
  const revenueChangePercent = currentState.revenue > 0
    ? (revenueChange / currentState.revenue) * 100
    : 0

  return {
    revenue: projectedRevenue,
    customerCount: currentState.customerCount,
    dealCount: currentState.dealCount,
    revenueChange,
    revenueChangePercent: parseFloat(revenueChangePercent.toFixed(1)),
  }
}

/**
 * Generate actions for closing deals
 */
async function generateCloseDealActions(
  dealIds: string[],
  tenantId: string
): Promise<ScenarioResult['actions']> {
  const actions: ScenarioResult['actions'] = []

  for (const dealId of dealIds) {
    try {
      const probability = await calculateDealClosureProbability({
        dealId,
        tenantId,
      })

      actions.push({
        type: 'close-deal',
        description: `Close deal: ${dealId}`,
        impact: probability.probability,
        priority: probability.probability >= 70 ? 'high' : probability.probability >= 50 ? 'medium' : 'low',
      })
    } catch (error) {
      console.error(`Error generating action for deal ${dealId}:`, error)
    }
  }

  return actions
}

/**
 * Generate retention actions
 */
async function generateRetentionActions(
  contactIds: string[],
  tenantId: string
): Promise<ScenarioResult['actions']> {
  const actions: ScenarioResult['actions'] = []

  for (const contactId of contactIds) {
    try {
      const risk = await calculateChurnRisk({
        contactId,
        tenantId,
      })

      actions.push({
        type: 'retain-customer',
        description: `Retain customer: ${contactId}`,
        impact: 100 - risk.riskScore, // Higher impact if risk is lower
        priority: risk.riskLevel === 'critical' ? 'high' : risk.riskLevel === 'high' ? 'medium' : 'low',
      })
    } catch (error) {
      console.error(`Error generating action for contact ${contactId}:`, error)
    }
  }

  return actions
}

/**
 * Generate upsell actions
 */
async function generateUpsellActions(
  contactIds: string[],
  tenantId: string
): Promise<ScenarioResult['actions']> {
  const actions: ScenarioResult['actions'] = []

  for (const contactId of contactIds) {
    try {
      const opportunity = await calculateUpsellOpportunity({
        contactId,
        tenantId,
      })

      actions.push({
        type: 'upsell',
        description: `Upsell customer: ${contactId}`,
        impact: opportunity.opportunityScore,
        priority: opportunity.opportunityLevel === 'very-high' || opportunity.opportunityLevel === 'high' ? 'high' : 'medium',
      })
    } catch (error) {
      console.error(`Error generating action for contact ${contactId}:`, error)
    }
  }

  return actions
}

/**
 * Generate improvement actions
 */
async function generateImprovementActions(
  tenantId: string
): Promise<ScenarioResult['actions']> {
  return [
    {
      type: 'improve-process',
      description: 'Improve sales process and training',
      impact: 50,
      priority: 'high' as const,
    },
    {
      type: 'better-qualification',
      description: 'Improve lead qualification',
      impact: 30,
      priority: 'medium' as const,
    },
    {
      type: 'faster-followup',
      description: 'Reduce time to follow-up',
      impact: 20,
      priority: 'medium' as const,
    },
  ]
}

/**
 * Generate recommendations for each scenario type
 */
function generateCloseDealRecommendations(
  projectedState: ScenarioResult['projectedState']
): string[] {
  return [
    `Closing these deals would increase revenue by ₹${(projectedState.revenueChange / 100000).toFixed(1)}L (${projectedState.revenueChangePercent.toFixed(1)}%)`,
    'Focus on high-probability deals first',
    'Schedule follow-up calls for deals stuck in negotiation',
    'Prepare final proposals for deals in proposal stage',
  ]
}

function generateRetentionRecommendations(
  projectedState: ScenarioResult['projectedState']
): string[] {
  return [
    `Losing these customers would reduce revenue by ₹${(Math.abs(projectedState.revenueChange) / 100000).toFixed(1)}L (${Math.abs(projectedState.revenueChangePercent).toFixed(1)}%)`,
    'Schedule immediate customer success calls',
    'Offer retention discounts or special packages',
    'Address any outstanding support issues',
    'Request feedback to understand churn reasons',
  ]
}

function generateUpsellRecommendations(
  projectedState: ScenarioResult['projectedState']
): string[] {
  return [
    `Upselling these customers would increase revenue by ₹${(projectedState.revenueChange / 100000).toFixed(1)}L (${projectedState.revenueChangePercent.toFixed(1)}%)`,
    'Schedule upsell calls with high-opportunity customers',
    'Prepare personalized demos of recommended features',
    'Show ROI and value proposition for upgrades',
  ]
}

function generateImprovementRecommendations(
  projectedState: ScenarioResult['projectedState']
): string[] {
  return [
    `Improving closure rates would increase revenue by ₹${(projectedState.revenueChange / 100000).toFixed(1)}L (${projectedState.revenueChangePercent.toFixed(1)}%)`,
    'Invest in sales training and process improvement',
    'Improve lead qualification to focus on high-probability deals',
    'Reduce time to follow-up on new leads',
    'Implement better deal management practices',
  ]
}

/**
 * Calculate scenario confidence
 */
function calculateScenarioConfidence(
  input: ScenarioInput,
  projectedState: ScenarioResult['projectedState']
): number {
  let confidence = 70 // Base confidence

  // More specific scenarios = higher confidence
  if (input.scenarioType === 'close-deals' && input.parameters.dealIds) {
    confidence = 85 // Closing specific deals is more certain
  } else if (input.scenarioType === 'lose-customers' && input.parameters.contactIds) {
    confidence = 80 // Losing specific customers is more certain
  } else if (input.scenarioType === 'upsell-customers' && input.parameters.contactIds) {
    confidence = 60 // Upselling is less certain
  } else if (input.scenarioType === 'improve-closure-rate') {
    confidence = 50 // Process improvements are less certain
  }

  // Adjust based on revenue change magnitude
  if (Math.abs(projectedState.revenueChangePercent) > 50) {
    confidence -= 10 // Large changes are less certain
  }

  return Math.max(0, Math.min(100, confidence))
}
