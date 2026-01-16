/**
 * Lead Scoring System
 * Calculates a 0-100 score for leads based on engagement and activity
 */

import { prisma } from '@/lib/db/prisma'
import type { Contact } from '@prisma/client'

interface ScoreComponents {
  emailOpens: number
  websiteVisits: number
  interactions: number
  deals: number
  recency: number
  total: number
}

interface ScoringConfig {
  emailOpenPoints: number // Points per email open
  emailOpenMax: number // Maximum points from email opens
  visitPoints: number // Points per website visit
  visitMax: number // Maximum points from visits
  interactionPoints: number // Points per interaction
  interactionMax: number // Maximum points from interactions
  dealPoints: number // Points per deal
  dealMax: number // Maximum points from deals
  recencyDecay: number // Points lost per day since last contact
  recencyMax: number // Maximum recency points
}

const DEFAULT_CONFIG: ScoringConfig = {
  emailOpenPoints: 10,
  emailOpenMax: 100,
  visitPoints: 5,
  visitMax: 150,
  interactionPoints: 8,
  interactionMax: 160,
  dealPoints: 25,
  dealMax: 250,
  recencyDecay: 2,
  recencyMax: 50,
}

/**
 * Calculate lead score for a contact
 * @param contact - The contact to score
 * @param config - Optional scoring configuration
 * @returns Object with score (0-100) and score components
 */
export async function scoreLead(
  contact: Contact,
  config: Partial<ScoringConfig> = {}
): Promise<{ score: number; components: ScoreComponents }> {
  const scoringConfig = { ...DEFAULT_CONFIG, ...config }

  // Get interaction count
  const interactionCount = await prisma.interaction.count({
    where: { contactId: contact.id },
  })

  // Get deal count and total value
  const deals = await prisma.deal.findMany({
    where: { contactId: contact.id },
  })
  const dealCount = deals.length

  // Calculate email opens (placeholder - would need email tracking)
  // For now, estimate based on interactions of type 'email'
  const emailInteractions = await prisma.interaction.count({
    where: {
      contactId: contact.id,
      type: 'email',
    },
  })
  const emailOpens = Math.min(
    emailInteractions * 2, // Estimate 2 opens per email sent
    scoringConfig.emailOpenMax / scoringConfig.emailOpenPoints
  )

  // Calculate website visits (placeholder - would need analytics integration)
  // For now, estimate based on interactions
  const websiteVisits = Math.min(
    Math.floor(interactionCount * 0.5), // Estimate visits
    scoringConfig.visitMax / scoringConfig.visitPoints
  )

  // Calculate points from each component
  let emailOpenPoints = Math.min(
    emailOpens * scoringConfig.emailOpenPoints,
    scoringConfig.emailOpenMax
  )
  let visitPoints = Math.min(
    websiteVisits * scoringConfig.visitPoints,
    scoringConfig.visitMax
  )
  let interactionPoints = Math.min(
    interactionCount * scoringConfig.interactionPoints,
    scoringConfig.interactionMax
  )
  let dealPoints = Math.min(
    dealCount * scoringConfig.dealPoints,
    scoringConfig.dealMax
  )

  // Calculate recency score
  let recencyPoints = scoringConfig.recencyMax
  if (contact.lastContactedAt) {
    const daysSinceContact =
      (Date.now() - contact.lastContactedAt.getTime()) / (1000 * 60 * 60 * 24)
    recencyPoints = Math.max(
      0,
      scoringConfig.recencyMax - daysSinceContact * scoringConfig.recencyDecay
    )
  } else if (contact.createdAt) {
    // If never contacted, use creation date
    const daysSinceCreation =
      (Date.now() - contact.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    recencyPoints = Math.max(
      0,
      scoringConfig.recencyMax - daysSinceCreation * scoringConfig.recencyDecay
    )
  }

  // Calculate total raw score
  const totalRawScore =
    emailOpenPoints +
    visitPoints +
    interactionPoints +
    dealPoints +
    recencyPoints

  // Normalize to 0-100 scale
  // Max possible score = 100 + 150 + 160 + 250 + 50 = 710
  // Normalize: (rawScore / 710) * 100
  const maxPossibleScore =
    scoringConfig.emailOpenMax +
    scoringConfig.visitMax +
    scoringConfig.interactionMax +
    scoringConfig.dealMax +
    scoringConfig.recencyMax

  const normalizedScore = Math.min(
    100,
    Math.max(0, (totalRawScore / maxPossibleScore) * 100)
  )

  // Ensure minimum score of 10 for any contact
  const finalScore = Math.max(10, normalizedScore)

  const components: ScoreComponents = {
    emailOpens: emailOpenPoints,
    websiteVisits: visitPoints,
    interactions: interactionPoints,
    deals: dealPoints,
    recency: recencyPoints,
    total: totalRawScore,
  }

  return {
    score: Math.round(finalScore * 10) / 10, // Round to 1 decimal place
    components,
  }
}

/**
 * Score multiple leads in batch
 * @param contacts - Array of contacts to score
 * @param config - Optional scoring configuration
 * @returns Array of scored contacts with scores
 */
export async function scoreLeadsBatch(
  contacts: Contact[],
  config: Partial<ScoringConfig> = {}
): Promise<Array<{ contact: Contact; score: number; components: ScoreComponents }>> {
  const results = await Promise.all(
    contacts.map(async (contact) => {
      const { score, components } = await scoreLead(contact, config)
      return { contact, score, components }
    })
  )

  return results
}

/**
 * Update lead score in database
 * @param contactId - ID of contact to update
 * @param config - Optional scoring configuration
 */
export async function updateLeadScore(
  contactId: string,
  config: Partial<ScoringConfig> = {}
): Promise<{ score: number; components: ScoreComponents }> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  const { score, components } = await scoreLead(contact, config)

  // Update contact with new score
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      leadScore: score,
      scoreUpdatedAt: new Date(),
      scoreComponents: components as any,
    },
  })

  return { score, components }
}

/**
 * Get score category (Hot, Warm, Cold)
 * @param score - Lead score (0-100)
 * @returns Category and color
 * 
 * NOTE: This function is also exported from lead-scoring-client.ts for client-side use
 * This export is kept for backward compatibility with server-side code
 */
export function getScoreCategory(score: number): {
  category: 'hot' | 'warm' | 'cold'
  color: string
  icon: string
  label: string
} {
  if (score >= 70) {
    return {
      category: 'hot',
      color: 'text-green-600 bg-green-50',
      icon: '🔥',
      label: 'Hot',
    }
  } else if (score >= 40) {
    return {
      category: 'warm',
      color: 'text-yellow-600 bg-yellow-50',
      icon: '⚠️',
      label: 'Warm',
    }
  } else {
    return {
      category: 'cold',
      color: 'text-gray-600 bg-gray-50',
      icon: '❄️',
      label: 'Cold',
    }
  }
}
