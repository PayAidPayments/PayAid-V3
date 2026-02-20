/**
 * Template Analytics
 * Track success metrics for industry templates
 */

import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'

export interface TemplateMetrics {
  templateId: string
  industry: string
  totalDeals: number
  dealsByStage: Record<string, number>
  averageDealValue: number
  conversionRate: number
  averageDaysInStage: Record<string, number>
  winRate: number
  totalRevenue: number
}

/**
 * Get analytics for a template
 */
export async function getTemplateAnalytics(
  tenantId: string,
  templateId: string
): Promise<TemplateMetrics | null> {
  // Get template configuration from tenant (industrySettings or onboardingData)
  const tenant = await prismaRead.tenant.findUnique({
    where: { id: tenantId },
    select: { industrySettings: true, onboardingData: true },
  })

  const settings = ((tenant?.industrySettings ?? tenant?.onboardingData) as any) || {}
  const templateConfig = settings.pipelineTemplate

  if (!templateConfig || templateConfig.templateId !== templateId) {
    return null
  }

  const industry = templateConfig.industry
  const stages = templateConfig.stages || []

  // Get all deals for this tenant
  const deals = await prismaRead.deal.findMany({
    where: { tenantId },
    select: {
      id: true,
      stage: true,
      value: true,
      createdAt: true,
      updatedAt: true,
      actualCloseDate: true,
    },
  })

  // Calculate metrics
  const totalDeals = deals.length
  const dealsByStage: Record<string, number> = {}
  let totalValue = 0
  let wonDeals = 0
  let totalRevenue = 0

  for (const deal of deals) {
    // Count by stage
    dealsByStage[deal.stage] = (dealsByStage[deal.stage] || 0) + 1

    // Sum values
    totalValue += deal.value

    // Count wins
    if (deal.stage === 'won' || deal.actualCloseDate) {
      wonDeals++
      totalRevenue += deal.value
    }
  }

  const averageDealValue = totalDeals > 0 ? totalValue / totalDeals : 0
  const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0
  const winRate = conversionRate

  // Calculate average days in each stage
  const averageDaysInStage: Record<string, number> = {}
  for (const stage of stages) {
    const stageDeals = deals.filter((d) => d.stage === stage.id)
    if (stageDeals.length > 0) {
      const totalDays = stageDeals.reduce((sum, deal) => {
        const days = Math.floor(
          (deal.updatedAt.getTime() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0)
      averageDaysInStage[stage.id] = totalDays / stageDeals.length
    }
  }

  return {
    templateId,
    industry,
    totalDeals,
    dealsByStage,
    averageDealValue,
    conversionRate,
    averageDaysInStage,
    winRate,
    totalRevenue,
  }
}

/**
 * Get template performance comparison
 */
export async function getTemplatePerformance(
  tenantId: string
): Promise<{
  currentTemplate: TemplateMetrics | null
  recommendations: string[]
}> {
  const tenant = await prismaRead.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  const settings = (tenant?.settings as any) || {}
  const templateConfig = settings.pipelineTemplate

  if (!templateConfig) {
    return {
      currentTemplate: null,
      recommendations: ['No template applied. Consider applying an industry template.'],
    }
  }

  const currentTemplate = await getTemplateAnalytics(tenantId, templateConfig.templateId)

  const recommendations: string[] = []

  if (currentTemplate) {
    // Generate recommendations based on metrics
    if (currentTemplate.conversionRate < 20) {
      recommendations.push('Conversion rate is below 20%. Consider reviewing qualification criteria.')
    }

    if (currentTemplate.averageDealValue < 50000) {
      recommendations.push('Average deal value is low. Focus on higher-value opportunities.')
    }

    // Check for bottlenecks
    const longestStage = Object.entries(currentTemplate.averageDaysInStage).sort(
      ([, a], [, b]) => b - a
    )[0]

    if (longestStage && longestStage[1] > 14) {
      recommendations.push(
        `Deals are spending ${Math.round(longestStage[1])} days in "${longestStage[0]}". Consider automation to speed up this stage.`
      )
    }
  }

  return {
    currentTemplate,
    recommendations,
  }
}
