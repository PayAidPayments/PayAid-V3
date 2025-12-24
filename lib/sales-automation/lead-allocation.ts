/**
 * Smart Lead Allocation System
 * Automatically assigns leads to the best sales rep based on:
 * - Workload balance (fewest assigned leads)
 * - Specialization match (industry/type)
 * - Performance (conversion rate)
 * - Availability (not on leave)
 */

import { prisma } from '@/lib/db/prisma'
import type { Contact, SalesRep } from '@prisma/client'

interface AllocationScore {
  rep: SalesRep & { user: { name: string; email: string } }
  score: number
  reasons: string[]
}

interface AllocationConfig {
  workloadWeight: number // Weight for workload balance
  specializationWeight: number // Weight for specialization match
  performanceWeight: number // Weight for conversion rate
  maxLeadsPerRep: number // Maximum leads before considering overloaded
}

const DEFAULT_CONFIG: AllocationConfig = {
  workloadWeight: -2, // -2 points per assigned lead
  specializationWeight: 50, // +50 points if specialization matches
  performanceWeight: 10, // +10 points per 10% conversion rate
  maxLeadsPerRep: 20, // Consider overloaded after 20 leads
}

/**
 * Calculate allocation score for a sales rep
 */
function calculateRepScore(
  rep: SalesRep & { user: { name: string; email: string } },
  contact: Contact,
  config: AllocationConfig = DEFAULT_CONFIG
): AllocationScore {
  const reasons: string[] = []
  let score = 100 // Start with base score

  // 1. Workload balance (fewer leads = higher score)
  const assignedLeadsCount = rep.assignedLeads?.length || 0
  const workloadPenalty = assignedLeadsCount * Math.abs(config.workloadWeight)
  score -= workloadPenalty
  reasons.push(`${assignedLeadsCount} leads assigned`)

  // Skip if overloaded
  if (assignedLeadsCount >= config.maxLeadsPerRep) {
    score = -1000 // Effectively disqualify
    reasons.push('Overloaded (max leads reached)')
    return { rep, score, reasons }
  }

  // 2. Specialization match
  if (rep.specialization) {
    // Simple matching - can be enhanced with industry detection
    const contactIndustry = contact.company?.toLowerCase() || ''
    const repSpecialization = rep.specialization.toLowerCase()

    // Check if company name contains specialization keywords
    if (
      contactIndustry.includes(repSpecialization) ||
      repSpecialization.includes(contactIndustry)
    ) {
      score += config.specializationWeight
      reasons.push(`Specialization match: ${rep.specialization}`)
    }
  }

  // 3. Performance (conversion rate)
  const performanceBonus = rep.conversionRate * config.performanceWeight * 10
  score += performanceBonus
  reasons.push(`Conversion rate: ${(rep.conversionRate * 100).toFixed(1)}%`)

  // 4. Availability check
  if (rep.isOnLeave) {
    if (rep.leaveEndDate && rep.leaveEndDate > new Date()) {
      score = -1000 // On leave, disqualify
      reasons.push('Currently on leave')
      return { rep, score, reasons }
    } else {
      // Leave ended, reactivate
      reasons.push('Recently returned from leave')
    }
  }

  return { rep, score, reasons }
}

/**
 * Find the best sales rep for a lead
 * @param contact - The lead to assign
 * @param tenantId - Tenant ID for filtering
 * @param config - Optional allocation configuration
 * @returns Best rep with score and top 3 suggestions
 */
export async function autoAllocateLead(
  contact: Contact,
  tenantId: string,
  config: Partial<AllocationConfig> = {}
): Promise<{
  bestRep: AllocationScore
  suggestions: AllocationScore[]
}> {
  const allocationConfig = { ...DEFAULT_CONFIG, ...config }

  // Get all active sales reps for this tenant
  const reps = await prisma.salesRep.findMany({
    where: {
      tenantId,
      isOnLeave: false, // Only active reps
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      assignedLeads: {
        select: {
          id: true,
        },
      },
    },
  })

  if (reps.length === 0) {
    throw new Error('No active sales reps found for this tenant')
  }

  // Calculate scores for all reps
  const scoredReps = reps.map((rep) =>
    calculateRepScore(rep as any, contact, allocationConfig)
  )

  // Sort by score (highest first)
  scoredReps.sort((a, b) => b.score - a.score)

  // Filter out disqualified reps (negative scores)
  const qualifiedReps = scoredReps.filter((sr) => sr.score > 0)

  if (qualifiedReps.length === 0) {
    // All reps overloaded or on leave - assign to highest score anyway
    const bestRep = scoredReps[0]
    return {
      bestRep,
      suggestions: scoredReps.slice(0, 3),
    }
  }

  const bestRep = qualifiedReps[0]
  const suggestions = qualifiedReps.slice(0, 3)

  return {
    bestRep,
    suggestions,
  }
}

/**
 * Assign a lead to a sales rep
 */
export async function assignLeadToRep(
  contactId: string,
  repId: string,
  tenantId: string
): Promise<void> {
  // Verify rep belongs to tenant
  const rep = await prisma.salesRep.findFirst({
    where: {
      id: repId,
      tenantId,
    },
  })

  if (!rep) {
    throw new Error('Sales rep not found or does not belong to tenant')
  }

  // Update contact
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      assignedToId: repId,
    },
  })
}

/**
 * Get allocation suggestions for a lead
 */
export async function getAllocationSuggestions(
  contactId: string,
  tenantId: string
): Promise<AllocationScore[]> {
  const contact = await prisma.contact.findFirst({
    where: {
      id: contactId,
      tenantId,
    },
  })

  if (!contact) {
    throw new Error('Contact not found')
  }

  const { suggestions } = await autoAllocateLead(contact, tenantId)
  return suggestions
}

/**
 * Calculate and update conversion rate for a sales rep
 */
export async function updateRepConversionRate(repId: string): Promise<number> {
  const rep = await prisma.salesRep.findUnique({
    where: { id: repId },
    include: {
      deals: true,
    },
  })

  if (!rep) {
    throw new Error('Sales rep not found')
  }

  const totalDeals = rep.deals.length
  const wonDeals = rep.deals.filter((deal) => deal.stage === 'won').length

  const conversionRate = totalDeals > 0 ? wonDeals / totalDeals : 0

  await prisma.salesRep.update({
    where: { id: repId },
    data: {
      conversionRate,
    },
  })

  return conversionRate
}
