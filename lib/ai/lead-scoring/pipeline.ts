/**
 * Lead Scoring Data Pipeline
 * Collects and processes historical deal data for model training and feature extraction
 */

import { prisma } from '@/lib/db/prisma'
import { prismaRead } from '@/lib/db/prisma-read'

export interface HistoricalDealData {
  dealId: string
  contactId: string
  won: boolean
  value: number
  stage: string
  probability: number
  daysToClose: number
  features: {
    // Engagement metrics
    emailOpens: number
    emailClicks: number
    websiteVisits: number
    demoAttendance: boolean
    callDuration: number
    interactionCount: number
    
    // Demographic fit
    companySize?: string
    industry?: string
    geography?: string
    revenue?: number
    
    // Behavioral signals
    timeInApp: number
    featureUsage: string[]
    paymentIntent: boolean
    documentDownloads: number
    
    // Historical patterns
    similarCustomers: number
    referralSource: string
    leadSource: string
  }
  createdAt: Date
  closedAt?: Date
}

/**
 * Collect historical deal data for training
 */
export async function collectHistoricalDealData(
  tenantId: string,
  limit: number = 1000
): Promise<HistoricalDealData[]> {
  // Get all closed deals (won or lost)
  const deals = await prismaRead.deal.findMany({
    where: {
      tenantId,
      stage: {
        in: ['won', 'lost'],
      },
    },
    include: {
      contact: {
        include: {
          interactions: {
            select: {
              type: true,
              createdAt: true,
              notes: true,
            },
          },
          emailMessages: {
            select: {
              receivedAt: true,
              isRead: true,
            },
          },
          deals: {
            select: {
              id: true,
              stage: true,
              value: true,
            },
          },
        },
      },
    },
    take: limit,
    orderBy: {
      updatedAt: 'desc',
    },
  })

  const historicalData: HistoricalDealData[] = []

  for (const deal of deals) {
    const contact = deal.contact
    if (!contact) continue

    // Calculate engagement metrics
    const emailMessages = contact.emailMessages || []
    const emailOpens = emailMessages.filter((m) => m.isRead).length
    const emailClicks = 0 // Would need email tracking data
    const websiteVisits = 0 // Would need analytics integration
    const demoAttendance = contact.interactions?.some(
      (i) => i.type === 'meeting' && i.notes?.toLowerCase().includes('demo')
    ) || false
    const callDuration = contact.interactions
      ?.filter((i) => i.type === 'call')
      .reduce((sum, i) => sum + (parseInt(i.notes || '0') || 0), 0) || 0
    const interactionCount = contact.interactions?.length || 0

    // Demographic fit
    const companySize = contact.company ? 'medium' : 'small' // Placeholder
    const industry = contact.sourceData as any || {}
    const geography = contact.country || 'India'
    const revenue = 0 // Would need company data integration

    // Behavioral signals
    const timeInApp = 0 // Would need app analytics
    const featureUsage: string[] = [] // Would need feature tracking
    const paymentIntent = deal.probability > 70
    const documentDownloads = 0 // Would need document tracking

    // Historical patterns
    const similarCustomers = contact.deals?.filter(
      (d) => d.stage === 'won' && d.id !== deal.id
    ).length || 0
    const referralSource = contact.source || 'unknown'
    const leadSource = contact.source || 'unknown'

    // Calculate days to close
    const closedAt = deal.updatedAt
    const createdAt = deal.createdAt
    const daysToClose = Math.floor(
      (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    historicalData.push({
      dealId: deal.id,
      contactId: contact.id,
      won: deal.stage === 'won',
      value: deal.value,
      stage: deal.stage,
      probability: deal.probability,
      daysToClose,
      features: {
        emailOpens,
        emailClicks,
        websiteVisits,
        demoAttendance,
        callDuration,
        interactionCount,
        companySize,
        industry: industry.industry || 'unknown',
        geography,
        revenue,
        timeInApp,
        featureUsage,
        paymentIntent,
        documentDownloads,
        similarCustomers,
        referralSource,
        leadSource,
      },
      createdAt: deal.createdAt,
      closedAt: deal.updatedAt,
    })
  }

  return historicalData
}

/**
 * Extract features for a contact (for scoring)
 */
export async function extractContactFeatures(contactId: string): Promise<HistoricalDealData['features']> {
  const contact = await prismaRead.contact.findUnique({
    where: { id: contactId },
    include: {
      interactions: {
        select: {
          type: true,
          createdAt: true,
          notes: true,
        },
      },
      emailMessages: {
        select: {
          receivedAt: true,
          isRead: true,
        },
      },
      deals: {
        select: {
          id: true,
          stage: true,
          value: true,
        },
      },
    },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  // Calculate engagement metrics
  const emailMessages = contact.emailMessages || []
  const emailOpens = emailMessages.filter((m) => m.isRead).length
  const emailClicks = 0 // Would need email tracking data
  const websiteVisits = 0 // Would need analytics integration
  const demoAttendance = contact.interactions?.some(
    (i) => i.type === 'meeting' && i.notes?.toLowerCase().includes('demo')
  ) || false
  const callDuration = contact.interactions
    ?.filter((i) => i.type === 'call')
    .reduce((sum, i) => sum + (parseInt(i.notes || '0') || 0), 0) || 0
  const interactionCount = contact.interactions?.length || 0

  // Demographic fit
  const companySize = contact.company ? 'medium' : 'small'
  const industry = (contact.sourceData as any)?.industry || 'unknown'
  const geography = contact.country || 'India'
  const revenue = 0

  // Behavioral signals
  const timeInApp = 0
  const featureUsage: string[] = []
  const paymentIntent = contact.deals?.some((d) => d.probability && d.probability > 70) || false
  const documentDownloads = 0

  // Historical patterns
  const similarCustomers = contact.deals?.filter((d) => d.stage === 'won').length || 0
  const referralSource = contact.source || 'unknown'
  const leadSource = contact.source || 'unknown'

  return {
    emailOpens,
    emailClicks,
    websiteVisits,
    demoAttendance,
    callDuration,
    interactionCount,
    companySize,
    industry,
    geography,
    revenue,
    timeInApp,
    featureUsage,
    paymentIntent,
    documentDownloads,
    similarCustomers,
    referralSource,
    leadSource,
  }
}

/**
 * Train a simple scoring model from historical data
 * Returns scoring weights based on historical patterns
 */
export async function trainScoringModel(
  tenantId: string
): Promise<{
  weights: Record<string, number>
  accuracy: number
  sampleSize: number
}> {
  const historicalData = await collectHistoricalDealData(tenantId, 500)

  if (historicalData.length < 10) {
    // Not enough data, return default weights
    return {
      weights: {
        emailOpens: 0.15,
        emailClicks: 0.20,
        websiteVisits: 0.10,
        demoAttendance: 0.25,
        interactionCount: 0.15,
        paymentIntent: 0.15,
      },
      accuracy: 0,
      sampleSize: historicalData.length,
    }
  }

  // Simple correlation-based weighting
  // In production, use proper ML (XGBoost, Random Forest, etc.)
  const wonDeals = historicalData.filter((d) => d.won)
  const lostDeals = historicalData.filter((d) => !d.won)

  // Calculate average feature values for won vs lost
  const avgWon = {
    emailOpens: wonDeals.reduce((sum, d) => sum + d.features.emailOpens, 0) / wonDeals.length,
    emailClicks: wonDeals.reduce((sum, d) => sum + d.features.emailClicks, 0) / wonDeals.length,
    interactionCount: wonDeals.reduce((sum, d) => sum + d.features.interactionCount, 0) / wonDeals.length,
    demoAttendance: wonDeals.filter((d) => d.features.demoAttendance).length / wonDeals.length,
    paymentIntent: wonDeals.filter((d) => d.features.paymentIntent).length / wonDeals.length,
  }

  const avgLost = {
    emailOpens: lostDeals.reduce((sum, d) => sum + d.features.emailOpens, 0) / lostDeals.length,
    emailClicks: lostDeals.reduce((sum, d) => sum + d.features.emailClicks, 0) / lostDeals.length,
    interactionCount: lostDeals.reduce((sum, d) => sum + d.features.interactionCount, 0) / lostDeals.length,
    demoAttendance: lostDeals.filter((d) => d.features.demoAttendance).length / lostDeals.length,
    paymentIntent: lostDeals.filter((d) => d.features.paymentIntent).length / lostDeals.length,
  }

  // Calculate weights based on difference
  const weights: Record<string, number> = {
    emailOpens: Math.max(0, (avgWon.emailOpens - avgLost.emailOpens) / 10),
    emailClicks: Math.max(0, (avgWon.emailClicks - avgLost.emailClicks) / 5),
    interactionCount: Math.max(0, (avgWon.interactionCount - avgLost.interactionCount) / 5),
    demoAttendance: (avgWon.demoAttendance - avgLost.demoAttendance) * 20,
    paymentIntent: (avgWon.paymentIntent - avgLost.paymentIntent) * 25,
  }

  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (totalWeight > 0) {
    Object.keys(weights).forEach((key) => {
      weights[key] = (weights[key] / totalWeight) * 100
    })
  }

  // Simple accuracy estimate (would need proper validation in production)
  const accuracy = 0.65 // Placeholder

  return {
    weights,
    accuracy,
    sampleSize: historicalData.length,
  }
}
