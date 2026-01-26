/**
 * Lead Qualification Workflow
 * Auto-qualifies leads based on score and routes them appropriately
 */

import { prisma } from '@/lib/db/prisma'
import { scoreLead } from '@/lib/ai-helpers/lead-scoring'
import { autoAllocateLead, assignLeadToRep } from '@/lib/sales-automation/lead-allocation'
import type { Contact } from '@prisma/client'

export interface QualificationResult {
  qualified: boolean
  qualificationLevel: 'MQL' | 'SQL' | 'PQL' | 'unqualified'
  score: number
  action: 'auto-route' | 'nurture' | 'manual-review' | 'no-action'
  assignedRepId?: string
  nurtureSequenceId?: string
  reason: string
}

export interface QualificationConfig {
  mqlThreshold: number // Marketing Qualified Lead (score >= 75)
  sqlThreshold: number // Sales Qualified Lead (score >= 85)
  pqlThreshold: number // Product Qualified Lead (score >= 90)
  autoRouteThreshold: number // Auto-route if score >= this
  nurtureThreshold: number // Nurture if score < this
  manualReviewMin: number // Manual review if score between this and autoRouteThreshold
  manualReviewMax: number
}

const DEFAULT_CONFIG: QualificationConfig = {
  mqlThreshold: 75,
  sqlThreshold: 85,
  pqlThreshold: 90,
  autoRouteThreshold: 85,
  nurtureThreshold: 50,
  manualReviewMin: 50,
  manualReviewMax: 85,
}

/**
 * Qualify a lead and determine next action
 */
export async function qualifyLead(
  contactId: string,
  tenantId: string,
  config: Partial<QualificationConfig> = {},
  autoAssign: boolean = false
): Promise<QualificationResult> {
  const qualificationConfig = { ...DEFAULT_CONFIG, ...config }

  // Get contact
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      assignedTo: {
        select: { id: true },
      },
    },
  })

  if (!contact || contact.tenantId !== tenantId) {
    throw new Error('Contact not found')
  }

  // Score the lead
  const { score } = await scoreLead(contact, {}, true)

  // Determine qualification level
  let qualificationLevel: 'MQL' | 'SQL' | 'PQL' | 'unqualified'
  let action: 'auto-route' | 'nurture' | 'manual-review' | 'no-action'
  let reason: string
  let assignedRepId: string | undefined
  let nurtureSequenceId: string | undefined

  if (score >= qualificationConfig.pqlThreshold) {
    qualificationLevel = 'PQL'
    action = 'auto-route'
    reason = `High score (${score}) qualifies as Product Qualified Lead`
    
    // Auto-route to sales rep
    if (autoAssign && !contact.assignedToId) {
      try {
        const allocation = await autoAllocateLead(contact, tenantId)
        assignedRepId = allocation.bestRep.rep.id
        await assignLeadToRep(contactId, assignedRepId, tenantId)
        reason += ` - Auto-assigned to sales rep`
      } catch (error) {
        console.error('Auto-allocation failed:', error)
        reason += ` - Auto-assignment failed, needs manual assignment`
      }
    }
  } else if (score >= qualificationConfig.sqlThreshold) {
    qualificationLevel = 'SQL'
    action = 'auto-route'
    reason = `Score (${score}) qualifies as Sales Qualified Lead`
    
    // Auto-route to sales rep
    if (autoAssign && !contact.assignedToId) {
      try {
        const allocation = await autoAllocateLead(contact, tenantId)
        assignedRepId = allocation.bestRep.rep.id
        await assignLeadToRep(contactId, assignedRepId, tenantId)
        reason += ` - Auto-assigned to sales rep`
      } catch (error) {
        console.error('Auto-allocation failed:', error)
        reason += ` - Auto-assignment failed, needs manual assignment`
      }
    }
  } else if (score >= qualificationConfig.mqlThreshold) {
    qualificationLevel = 'MQL'
    if (score >= qualificationConfig.autoRouteThreshold) {
      action = 'auto-route'
      reason = `Score (${score}) qualifies as Marketing Qualified Lead - ready for sales`
      
      // Auto-route to sales rep
      if (autoAssign && !contact.assignedToId) {
        try {
          const allocation = await autoAllocateLead(contact, tenantId)
          assignedRepId = allocation.bestRep.rep.id
          await assignLeadToRep(contactId, assignedRepId, tenantId)
          reason += ` - Auto-assigned to sales rep`
        } catch (error) {
          console.error('Auto-allocation failed:', error)
          reason += ` - Auto-assignment failed, needs manual assignment`
        }
      }
    } else {
      action = 'manual-review'
      reason = `Score (${score}) qualifies as MQL but needs manual review before routing`
    }
  } else if (score >= qualificationConfig.nurtureThreshold) {
    qualificationLevel = 'unqualified'
    action = 'nurture'
    reason = `Score (${score}) is below qualification threshold - enroll in nurture sequence`
    
    // Enroll in nurture sequence
    nurtureSequenceId = await enrollInNurtureSequence(contactId, tenantId, score)
  } else {
    qualificationLevel = 'unqualified'
    action = 'no-action'
    reason = `Score (${score}) is too low - no action needed`
  }

  // Update contact with qualification status
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      leadScore: score,
      scoreUpdatedAt: new Date(),
      // Store qualification in notes or custom field
      notes: contact.notes
        ? `${contact.notes}\n\n[Auto-Qualified ${new Date().toISOString()}] ${reason}`
        : `[Auto-Qualified ${new Date().toISOString()}] ${reason}`,
    },
  })

  return {
    qualified: qualificationLevel !== 'unqualified',
    qualificationLevel,
    score,
    action,
    assignedRepId,
    nurtureSequenceId,
    reason,
  }
}

/**
 * Enroll contact in nurture sequence
 */
async function enrollInNurtureSequence(
  contactId: string,
  tenantId: string,
  score: number
): Promise<string | undefined> {
  try {
    // Check if already enrolled
    const existing = await prisma.nurtureEnrollment.findFirst({
      where: {
        contactId,
        tenantId,
        status: 'active',
      },
    })

    if (existing) {
      return existing.id
    }

    // Find appropriate nurture template based on score
    // In production, you'd have multiple templates
    const template = await prisma.nurtureTemplate.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!template) {
      console.warn('No nurture template found for tenant')
      return undefined
    }

    // Get total steps
    const totalSteps = await prisma.nurtureStep.count({
      where: { templateId: template.id },
    })

    // Create enrollment
    const enrollment = await prisma.nurtureEnrollment.create({
      data: {
        contactId,
        tenantId,
        templateId: template.id,
        status: 'ACTIVE',
        totalSteps,
        completedSteps: 0,
      },
    })

    return enrollment.id
  } catch (error) {
    console.error('Error enrolling in nurture sequence:', error)
    return undefined
  }
}

/**
 * Batch qualify leads
 */
export async function batchQualifyLeads(
  tenantId: string,
  contactIds?: string[],
  config: Partial<QualificationConfig> = {},
  autoAssign: boolean = false
): Promise<QualificationResult[]> {
  const where: any = {
    tenantId,
    stage: {
      in: ['prospect', 'lead'],
    },
  }

  if (contactIds && contactIds.length > 0) {
    where.id = { in: contactIds }
  }

  const contacts = await prisma.contact.findMany({
    where,
    take: 100, // Limit batch size
  })

  const results = await Promise.all(
    contacts.map((contact) => qualifyLead(contact.id, tenantId, config, autoAssign))
  )

  return results
}

/**
 * Auto-qualify new leads (called when contact is created)
 */
export async function autoQualifyNewLead(
  contactId: string,
  tenantId: string
): Promise<QualificationResult> {
  // For new leads, use lower thresholds for auto-qualification
  const config: Partial<QualificationConfig> = {
    autoRouteThreshold: 80, // Lower threshold for new leads
    nurtureThreshold: 30, // Lower threshold for nurturing
  }

  return qualifyLead(contactId, tenantId, config, false) // Don't auto-assign immediately
}
