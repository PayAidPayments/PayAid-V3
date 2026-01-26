/**
 * Lead Router Service
 * Routes leads to sales reps based on territory and capacity
 */

import { prisma } from '@/lib/db/prisma'
import { TerritoryManagerService } from './territory-manager'

export type RoutingStrategy = 'round-robin' | 'weighted' | 'capacity-based' | 'territory-based'

export class LeadRouterService {
  /**
   * Route lead to appropriate sales rep
   */
  static async routeLead(
    tenantId: string,
    contactData: {
      state?: string
      city?: string
      postalCode?: string
      industry?: string
      company?: string
      annualRevenue?: number
    },
    strategy: RoutingStrategy = 'territory-based'
  ): Promise<string | null> {
    // First, try territory-based routing
    if (strategy === 'territory-based' || strategy === 'capacity-based') {
      const territoryId = await TerritoryManagerService.findMatchingTerritory(
        tenantId,
        contactData
      )

      if (territoryId) {
        const territory = await TerritoryManagerService.getTerritory(tenantId, territoryId)

        if (territory && territory.assignedReps.length > 0) {
          // Get available reps (not on leave)
          const availableReps = territory.assignedReps.filter(
            (assignment) => !assignment.salesRep.isOnLeave
          )

          if (availableReps.length === 0) {
            return null // No available reps
          }

          if (strategy === 'capacity-based') {
            // Route to rep with least assigned contacts
            const repWorkloads = await Promise.all(
              availableReps.map(async (assignment) => {
                const contactCount = await prisma.contact.count({
                  where: {
                    tenantId,
                    assignedToId: assignment.salesRepId,
                  },
                })
                return {
                  salesRepId: assignment.salesRepId,
                  workload: contactCount,
                }
              })
            )

            const leastLoaded = repWorkloads.reduce((min, rep) =>
              rep.workload < min.workload ? rep : min
            )

            return leastLoaded.salesRepId
          } else {
            // Round-robin within territory
            return this.roundRobinRoute(availableReps.map((a) => a.salesRepId))
          }
        }
      }
    }

    // Fallback to round-robin or weighted routing
    if (strategy === 'round-robin' || strategy === 'weighted') {
      const allReps = await prisma.salesRep.findMany({
        where: {
          tenantId,
          isOnLeave: false,
        },
      })

      if (allReps.length === 0) {
        return null
      }

      if (strategy === 'weighted') {
        // Route based on conversion rate (higher conversion = more leads)
        const sortedReps = allReps.sort((a, b) => b.conversionRate - a.conversionRate)
        return sortedReps[0].id
      } else {
        // Round-robin
        return this.roundRobinRoute(allReps.map((r) => r.id))
      }
    }

    return null
  }

  /**
   * Round-robin routing (simple implementation)
   */
  private static roundRobinRoute(repIds: string[]): string {
    // Simple round-robin: get rep with least recent assignment
    // In production, you'd use Redis or database to track last assignment
    return repIds[Math.floor(Math.random() * repIds.length)]
  }

  /**
   * Auto-assign contact to territory rep
   */
  static async autoAssignContact(
    tenantId: string,
    contactId: string,
    strategy: RoutingStrategy = 'territory-based'
  ) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    // Find matching territory and route
    const salesRepId = await this.routeLead(
      tenantId,
      {
        state: contact.state || undefined,
        city: contact.city || undefined,
        postalCode: contact.postalCode || undefined,
        industry: contact.company || undefined, // Using company as industry proxy
      },
      strategy
    )

    if (salesRepId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { assignedToId: salesRepId },
      })

      return salesRepId
    }

    return null
  }
}
