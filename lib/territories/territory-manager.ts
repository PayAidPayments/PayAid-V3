/**
 * Territory Manager Service
 * Manages territory definitions, assignments, and routing
 */

import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

export const TerritoryCriteriaSchema = z.object({
  // Geographic criteria
  states: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  postalCodes: z.array(z.string()).optional(),
  // Industry criteria
  industries: z.array(z.string()).optional(),
  // Account size criteria
  minAnnualRevenue: z.number().optional(),
  maxAnnualRevenue: z.number().optional(),
  // Custom attributes
  customAttributes: z.record(z.any()).optional(),
})

export type TerritoryCriteria = z.infer<typeof TerritoryCriteriaSchema>

export class TerritoryManagerService {
  /**
   * Create territory
   */
  static async createTerritory(
    tenantId: string,
    data: {
      name: string
      description?: string
      criteria: TerritoryCriteria
      salesRepIds?: string[]
    }
  ) {
    const validatedCriteria = TerritoryCriteriaSchema.parse(data.criteria)

    const territory = await prisma.territory.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        criteria: validatedCriteria as any,
        assignedReps: data.salesRepIds
          ? {
              create: data.salesRepIds.map((repId) => ({
                salesRepId: repId,
                role: 'owner',
              })),
            }
          : undefined,
      },
      include: {
        assignedReps: {
          include: {
            salesRep: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    return territory
  }

  /**
   * Update territory
   */
  static async updateTerritory(
    tenantId: string,
    territoryId: string,
    data: Partial<{
      name: string
      description: string
      criteria: TerritoryCriteria
    }>
  ) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
    })

    if (!territory) {
      throw new Error('Territory not found')
    }

    return prisma.territory.update({
      where: { id: territoryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.criteria && { criteria: TerritoryCriteriaSchema.parse(data.criteria) as any }),
        updatedAt: new Date(),
      },
      include: {
        assignedReps: {
          include: {
            salesRep: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })
  }

  /**
   * Assign sales rep to territory
   */
  static async assignSalesRep(
    tenantId: string,
    territoryId: string,
    salesRepId: string,
    role: 'owner' | 'member' = 'member'
  ) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
    })

    if (!territory) {
      throw new Error('Territory not found')
    }

    return prisma.territoryAssignment.upsert({
      where: {
        territoryId_salesRepId: {
          territoryId,
          salesRepId,
        },
      },
      create: {
        territoryId,
        salesRepId,
        role,
      },
      update: {
        role,
      },
      include: {
        salesRep: {
          include: {
            user: true,
          },
        },
      },
    })
  }

  /**
   * Remove sales rep from territory
   */
  static async removeSalesRep(
    tenantId: string,
    territoryId: string,
    salesRepId: string
  ) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
    })

    if (!territory) {
      throw new Error('Territory not found')
    }

    return prisma.territoryAssignment.delete({
      where: {
        territoryId_salesRepId: {
          territoryId,
          salesRepId,
        },
      },
    })
  }

  /**
   * Find matching territory for contact/deal
   */
  static async findMatchingTerritory(
    tenantId: string,
    contactData: {
      state?: string
      city?: string
      postalCode?: string
      industry?: string
      company?: string
      annualRevenue?: number
    }
  ): Promise<string | null> {
    const territories = await prisma.territory.findMany({
      where: { tenantId },
      include: {
        assignedReps: true,
      },
    })

    for (const territory of territories) {
      const criteria = territory.criteria as TerritoryCriteria

      // Check geographic match
      if (criteria.states && contactData.state && !criteria.states.includes(contactData.state)) {
        continue
      }
      if (criteria.cities && contactData.city && !criteria.cities.includes(contactData.city)) {
        continue
      }
      if (criteria.postalCodes && contactData.postalCode && !criteria.postalCodes.includes(contactData.postalCode)) {
        continue
      }

      // Check industry match
      if (criteria.industries && contactData.industry && !criteria.industries.includes(contactData.industry)) {
        continue
      }

      // Check revenue match
      if (criteria.minAnnualRevenue && contactData.annualRevenue && contactData.annualRevenue < criteria.minAnnualRevenue) {
        continue
      }
      if (criteria.maxAnnualRevenue && contactData.annualRevenue && contactData.annualRevenue > criteria.maxAnnualRevenue) {
        continue
      }

      // If we get here, territory matches
      return territory.id
    }

    return null
  }

  /**
   * Get territory by ID
   */
  static async getTerritory(tenantId: string, territoryId: string) {
    return prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
      include: {
        assignedReps: {
          include: {
            salesRep: {
              include: {
                user: true,
              },
            },
          },
        },
        quotas: {
          orderBy: { periodStart: 'desc' },
          take: 1,
        },
      },
    })
  }

  /**
   * List all territories
   */
  static async listTerritories(tenantId: string) {
    return prisma.territory.findMany({
      where: { tenantId },
      include: {
        assignedReps: {
          include: {
            salesRep: {
              include: {
                user: true,
              },
            },
          },
        },
        _count: {
          select: { assignedReps: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Delete territory
   */
  static async deleteTerritory(tenantId: string, territoryId: string) {
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
    })

    if (!territory) {
      throw new Error('Territory not found')
    }

    return prisma.territory.delete({
      where: { id: territoryId },
    })
  }
}
