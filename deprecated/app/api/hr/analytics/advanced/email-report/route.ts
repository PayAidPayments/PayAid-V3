import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/analytics/advanced/email-report
 * Deferred Phase 2: Scheduled report delivery. Body: { emails: string[] }.
 * Returns report payload; actual email sending requires configured SMTP/mailer (cron can call this and send).
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const now = new Date()
    const monthsBack = 12

    const headcountTrend: { month: string; count: number }[] = []
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const count = await prisma.employee.count({
        where: {
          tenantId,
          status: { in: ['ACTIVE', 'PROBATION'] },
          joiningDate: { lte: end },
          OR: [{ exitDate: null }, { exitDate: { gt: end } }],
        },
      })
      headcountTrend.push({
        month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        count,
      })
    }

    const totalActive = await prisma.employee.count({
      where: { tenantId, status: 'ACTIVE' },
    })
    const exitsLast6Months = await prisma.employee.count({
      where: {
        tenantId,
        exitDate: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) },
      },
    })
    const attritionRate = totalActive > 0 ? (exitsLast6Months / totalActive) * 100 : 0

    const body = await request.json().catch(() => ({}))
    const emails = Array.isArray(body.emails) ? body.emails.filter((e: unknown) => typeof e === 'string') : []

    return NextResponse.json({
      message: emails.length > 0
        ? 'Report payload ready. Configure SMTP or use a cron to GET /api/hr/analytics/advanced and send to recipients.'
        : 'Provide { emails: string[] } to enable delivery. Configure SMTP for actual send.',
      report: {
        generatedAt: new Date().toISOString(),
        headcountTrend,
        summary: { currentHeadcount: totalActive, attritionRateLast6Months: Math.round(attritionRate * 10) / 10, exitsLast6Months },
      },
      recipients: emails,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
