/**
 * Attribution Engine Service
 * Analyzes which touchpoints convert leads to customers
 */

import { prisma } from '@/lib/db/prisma'

export interface AttributionTouchpoint {
  type: 'email' | 'call' | 'meeting' | 'form' | 'campaign' | 'referral'
  date: Date
  value: number // Contribution score (0-100)
}

export interface AttributionReport {
  contactId: string
  touchpoints: AttributionTouchpoint[]
  primaryTouchpoint: AttributionTouchpoint | null
  conversionPath: string[]
  totalTouchpoints: number
  timeToConvert: number // Days
}

export class AttributionEngineService {
  /**
   * Get attribution report for a contact
   */
  static async getAttributionReport(tenantId: string, contactId: string): Promise<AttributionReport> {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      include: {
        interactions: {
          orderBy: { createdAt: 'asc' },
        },
        emailMessages: {
          orderBy: { createdAt: 'asc' },
        },
        deals: {
          where: { stage: 'won' },
          orderBy: { actualCloseDate: 'asc' },
          take: 1,
        },
        formSubmissions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!contact) {
      throw new Error('Contact not found')
    }

    const touchpoints: AttributionTouchpoint[] = []

    // Add form submission touchpoint
    if (contact.formSubmissions.length > 0) {
      touchpoints.push({
        type: 'form',
        date: contact.formSubmissions[0].createdAt,
        value: 30, // Initial form submission gets high value
      })
    }

    // Add interaction touchpoints
    for (const interaction of contact.interactions) {
      let type: AttributionTouchpoint['type'] = 'call'
      if (interaction.type.includes('email')) type = 'email'
      if (interaction.type.includes('meeting')) type = 'meeting'

      touchpoints.push({
        type,
        date: interaction.createdAt,
        value: this.calculateTouchpointValue(type, interaction),
      })
    }

    // Add email touchpoints
    for (const email of contact.emailMessages) {
      touchpoints.push({
        type: 'email',
        date: email.createdAt,
        value: 10, // Email gets lower value
      })
    }

    // Sort by date
    touchpoints.sort((a, b) => a.date.getTime() - b.date.getTime())

    // Find primary touchpoint (highest value)
    const primaryTouchpoint = touchpoints.length > 0
      ? touchpoints.reduce((max, tp) => (tp.value > max.value ? tp : max))
      : null

    // Calculate conversion path
    const conversionPath = touchpoints.map((tp) => tp.type)

    // Calculate time to convert
    const firstTouchpoint = touchpoints[0]
    const lastDeal = contact.deals[0]
    const timeToConvert = firstTouchpoint && lastDeal?.actualCloseDate
      ? Math.ceil(
          (lastDeal.actualCloseDate.getTime() - firstTouchpoint.date.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    return {
      contactId,
      touchpoints,
      primaryTouchpoint,
      conversionPath,
      totalTouchpoints: touchpoints.length,
      timeToConvert,
    }
  }

  /**
   * Get attribution summary for multiple contacts
   */
  static async getAttributionSummary(
    tenantId: string,
    filters?: {
      dateRange?: { start: Date; end: Date }
      source?: string
    }
  ) {
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        stage: 'customer',
        ...(filters?.dateRange && {
          createdAt: {
            gte: filters.dateRange.start,
            lte: filters.dateRange.end,
          },
        }),
        ...(filters?.source && { source: filters.source }),
      },
      include: {
        interactions: true,
        emailMessages: true,
        formSubmissions: true,
      },
    })

    const touchpointCounts: Record<string, number> = {}
    const primaryTouchpointCounts: Record<string, number> = {}
    let totalTimeToConvert = 0
    let convertedCount = 0

    for (const contact of contacts) {
      const report = await this.getAttributionReport(tenantId, contact.id)

      // Count touchpoint types
      for (const tp of report.touchpoints) {
        touchpointCounts[tp.type] = (touchpointCounts[tp.type] || 0) + 1
      }

      // Count primary touchpoints
      if (report.primaryTouchpoint) {
        primaryTouchpointCounts[report.primaryTouchpoint.type] =
          (primaryTouchpointCounts[report.primaryTouchpoint.type] || 0) + 1
      }

      if (report.timeToConvert > 0) {
        totalTimeToConvert += report.timeToConvert
        convertedCount++
      }
    }

    return {
      totalContacts: contacts.length,
      touchpointCounts,
      primaryTouchpointCounts,
      averageTimeToConvert: convertedCount > 0 ? totalTimeToConvert / convertedCount : 0,
      conversionPaths: this.analyzeConversionPaths(contacts),
    }
  }

  /**
   * Calculate touchpoint value
   */
  private static calculateTouchpointValue(
    type: AttributionTouchpoint['type'],
    interaction: any
  ): number {
    const baseValues: Record<AttributionTouchpoint['type'], number> = {
      email: 10,
      call: 20,
      meeting: 40,
      form: 30,
      campaign: 15,
      referral: 25,
    }

    let value = baseValues[type] || 10

    // Adjust based on interaction outcome
    if (interaction.outcome === 'positive') {
      value *= 1.5
    } else if (interaction.outcome === 'negative') {
      value *= 0.5
    }

    return Math.min(value, 100)
  }

  /**
   * Analyze conversion paths
   */
  private static analyzeConversionPaths(contacts: any[]): Record<string, number> {
    const paths: Record<string, number> = {}

    for (const contact of contacts) {
      const path: string[] = []

      if (contact.formSubmissions.length > 0) path.push('form')
      if (contact.emailMessages.length > 0) path.push('email')
      if (contact.interactions.some((i: any) => i.type.includes('call'))) path.push('call')
      if (contact.interactions.some((i: any) => i.type.includes('meeting'))) path.push('meeting')

      const pathKey = path.join(' → ')
      paths[pathKey] = (paths[pathKey] || 0) + 1
    }

    return paths
  }
}
