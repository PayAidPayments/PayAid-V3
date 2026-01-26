/**
 * Account Engagement Service
 * Tracks and summarizes account engagement timeline
 */

import { prisma } from '@/lib/db/prisma'

export interface EngagementEvent {
  type: 'email' | 'call' | 'meeting' | 'deal' | 'contract' | 'support'
  date: Date
  description: string
  contactId?: string
  dealId?: string
  contractId?: string
}

export interface EngagementTimeline {
  accountId: string
  events: EngagementEvent[]
  summary: {
    totalInteractions: number
    lastInteraction: Date | null
    daysSinceLastInteraction: number
    upcomingEvents: EngagementEvent[]
  }
}

export class AccountEngagementService {
  /**
   * Get engagement timeline for account
   */
  static async getEngagementTimeline(
    tenantId: string,
    accountId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<EngagementTimeline> {
    const account = await prisma.account.findFirst({
      where: { id: accountId, tenantId },
      include: {
        contacts: {
          include: {
            interactions: {
              where: dateRange
                ? {
                    createdAt: {
                      gte: dateRange.start,
                      lte: dateRange.end,
                    },
                  }
                : undefined,
              orderBy: { createdAt: 'desc' },
            },
            emailMessages: {
              where: dateRange
                ? {
                    createdAt: {
                      gte: dateRange.start,
                      lte: dateRange.end,
                    },
                  }
                : undefined,
              orderBy: { createdAt: 'desc' },
            },
            deals: {
              where: dateRange
                ? {
                    createdAt: {
                      gte: dateRange.start,
                      lte: dateRange.end,
                    },
                  }
                : undefined,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        contracts: {
          where: dateRange
            ? {
                createdAt: {
                  gte: dateRange.start,
                  lte: dateRange.end,
                },
              }
            : undefined,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!account) {
      throw new Error('Account not found')
    }

    const events: EngagementEvent[] = []

    // Add interaction events
    for (const contact of account.contacts) {
      for (const interaction of contact.interactions) {
        events.push({
          type: this.mapInteractionType(interaction.type),
          date: interaction.createdAt,
          description: `${interaction.type} with ${contact.name}`,
          contactId: contact.id,
        })
      }

      // Add email events
      for (const email of contact.emailMessages) {
        events.push({
          type: 'email',
          date: email.createdAt,
          description: `Email: ${email.subject || 'No subject'}`,
          contactId: contact.id,
        })
      }

      // Add deal events
      for (const deal of contact.deals) {
        events.push({
          type: 'deal',
          date: deal.createdAt,
          description: `Deal: ${deal.name} (${deal.stage})`,
          contactId: contact.id,
          dealId: deal.id,
        })
      }
    }

    // Add contract events
    for (const contract of account.contracts) {
      events.push({
        type: 'contract',
        date: contract.createdAt,
        description: `Contract: ${contract.title} (${contract.status})`,
        contractId: contract.id,
      })
    }

    // Sort by date
    events.sort((a, b) => b.date.getTime() - a.date.getTime())

    // Calculate summary
    const lastInteraction = events.length > 0 ? events[0].date : null
    const daysSinceLastInteraction = lastInteraction
      ? Math.ceil((Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // Get upcoming events (future meetings, contract renewals)
    const now = new Date()
    const upcomingEvents = events.filter((e) => e.date > now)

    const timeline: EngagementTimeline = {
      accountId,
      events,
      summary: {
        totalInteractions: events.length,
        lastInteraction,
        daysSinceLastInteraction,
        upcomingEvents,
      },
    }

    // Update account engagement timeline
    await prisma.account.update({
      where: { id: accountId },
      data: {
        engagementTimeline: timeline as any,
      },
    })

    return timeline
  }

  /**
   * Map interaction type to engagement event type
   */
  private static mapInteractionType(interactionType: string): EngagementEvent['type'] {
    const lower = interactionType.toLowerCase()
    if (lower.includes('email')) return 'email'
    if (lower.includes('call') || lower.includes('phone')) return 'call'
    if (lower.includes('meeting') || lower.includes('appointment')) return 'meeting'
    return 'call' // Default
  }

  /**
   * Get account engagement summary
   */
  static async getEngagementSummary(tenantId: string, accountId: string) {
    const timeline = await this.getEngagementTimeline(tenantId, accountId)

    return {
      accountId,
      totalInteractions: timeline.summary.totalInteractions,
      lastInteraction: timeline.summary.lastInteraction,
      daysSinceLastInteraction: timeline.summary.daysSinceLastInteraction,
      engagementLevel: this.calculateEngagementLevel(timeline.summary.daysSinceLastInteraction),
      upcomingEvents: timeline.summary.upcomingEvents.length,
    }
  }

  /**
   * Calculate engagement level
   */
  private static calculateEngagementLevel(daysSinceLastInteraction: number): 'high' | 'medium' | 'low' {
    if (daysSinceLastInteraction <= 7) return 'high'
    if (daysSinceLastInteraction <= 30) return 'medium'
    return 'low'
  }
}
