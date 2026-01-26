/**
 * Form Analytics Service
 * Tracks form performance, conversion rates, and drop-off points
 */

import { prisma } from '@/lib/db/prisma'

export interface FormAnalytics {
  totalSubmissions: number
  uniqueSubmissions: number
  conversionRate: number
  averageTimeToSubmit: number
  fieldDropOffRates: Record<string, number>
  sourceBreakdown: Record<string, number>
  dailySubmissions: Array<{ date: string; count: number }>
  statusBreakdown: Record<string, number>
}

export class FormAnalyticsService {
  /**
   * Get form analytics
   */
  static async getFormAnalytics(
    tenantId: string,
    formId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<FormAnalytics> {
    const form = await prisma.form.findFirst({
      where: { id: formId, tenantId },
      include: {
        submissions: {
          where: dateRange
            ? {
                createdAt: {
                  gte: dateRange.start,
                  lte: dateRange.end,
                },
              }
            : undefined,
        },
      },
    })

    if (!form) {
      throw new Error('Form not found')
    }

    const submissions = form.submissions
    const totalSubmissions = submissions.length

    // Unique submissions (by email or IP)
    const uniqueEmails = new Set(
      submissions
        .map((s) => (s.data as any)?.email)
        .filter(Boolean)
    )
    const uniqueIPs = new Set(submissions.map((s) => s.ipAddress).filter(Boolean))
    const uniqueSubmissions = Math.max(uniqueEmails.size, uniqueIPs.size)

    // Conversion rate (submissions that created contacts)
    const converted = submissions.filter((s) => s.contactId !== null).length
    const conversionRate = totalSubmissions > 0 ? (converted / totalSubmissions) * 100 : 0

    // Field drop-off analysis (requires form view tracking - future enhancement)
    const fieldDropOffRates: Record<string, number> = {}

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {}
    submissions.forEach((s) => {
      const source = s.source || 'direct'
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1
    })

    // Daily submissions
    const dailyMap = new Map<string, number>()
    submissions.forEach((s) => {
      const date = s.createdAt.toISOString().split('T')[0]
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
    })
    const dailySubmissions = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    submissions.forEach((s) => {
      statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1
    })

    return {
      totalSubmissions,
      uniqueSubmissions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageTimeToSubmit: 0, // Would require form view tracking
      fieldDropOffRates,
      sourceBreakdown,
      dailySubmissions,
      statusBreakdown,
    }
  }

  /**
   * Get analytics for all forms
   */
  static async getAllFormsAnalytics(tenantId: string) {
    const forms = await prisma.form.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { submissions: true },
        },
        submissions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return forms.map((form) => ({
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      totalSubmissions: form._count.submissions,
      lastSubmission: form.submissions[0]?.createdAt || null,
    }))
  }

  /**
   * Track form view (for drop-off analysis)
   */
  static async trackFormView(formId: string, metadata?: {
    ipAddress?: string
    userAgent?: string
    referrer?: string
  }) {
    // This would update form analytics
    // For now, we'll store it in the form's analytics JSON
    // TODO: Create separate FormView model for detailed tracking
    const form = await prisma.form.findUnique({
      where: { id: formId },
    })

    if (!form) return

    const analytics = (form.analytics as any) || {}
    const views = analytics.views || 0

    await prisma.form.update({
      where: { id: formId },
      data: {
        analytics: {
          ...analytics,
          views: views + 1,
          lastViewAt: new Date().toISOString(),
        },
      },
    })
  }
}
