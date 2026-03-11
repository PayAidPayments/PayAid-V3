import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

type ReminderItem = {
  id: string
  type: 'PROBATION_END' | 'CONTRACT_EXPIRY' | 'REVIEW_DUE'
  title: string
  dueDate: string | null
  meta?: Record<string, string>
}

/** Fetch review-due reminders from PerformanceReview when model exists (endDate in window). */
async function fetchReviewDueFromDb(
  tenantId: string,
  now: Date,
  windowEnd: Date
): Promise<ReminderItem[]> {
  const delegate = (prisma as any).performanceReview
  if (!delegate || typeof delegate.findMany !== 'function') return []
  try {
    const reviews = await delegate.findMany({
      where: {
        tenantId,
        endDate: { gte: now, lte: windowEnd },
        status: { in: ['IN_PROGRESS', 'PENDING', 'DRAFT'] },
      },
      select: {
        id: true,
        period: true,
        endDate: true,
        reviewType: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      take: 50,
    })
    return (reviews || []).map((r: any) => ({
      id: r.id,
      type: 'REVIEW_DUE' as const,
      title: `Review due: ${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? 'Employee'} (${r.period ?? r.reviewType ?? 'Review'})`,
      dueDate: r.endDate?.toISOString?.()?.slice(0, 10) ?? null,
      meta: {
        period: r.period ?? '',
        reviewType: r.reviewType ?? '',
        employeeCode: r.employee?.employeeCode ?? '',
      },
    }))
  } catch {
    return []
  }
}

/**
 * GET /api/hr/reminders
 * Proactive reminders: probation ending, reviews due (from DB), contract expiry.
 * Optional: days (default 30) for window.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const daysParam = request.nextUrl.searchParams.get('days') || '30'
    const days = Math.min(90, Math.max(7, parseInt(daysParam, 10) || 30))
    const now = new Date()
    const windowEnd = new Date(now)
    windowEnd.setDate(windowEnd.getDate() + days)
    now.setHours(0, 0, 0, 0)
    windowEnd.setHours(23, 59, 59, 999)

    const [probationEmployees, contractsExpiring, reviewDueList] = await Promise.all([
      prisma.employee.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          probationEndDate: { gte: now, lte: windowEnd },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          probationEndDate: true,
          department: { select: { name: true } },
        },
      }),
      prisma.contract.findMany({
        where: {
          tenantId,
          endDate: { gte: now, lte: windowEnd },
          status: 'ACTIVE',
        },
        select: {
          id: true,
          contractNumber: true,
          title: true,
          partyName: true,
          endDate: true,
          contractType: true,
        },
        take: 50,
      }),
      fetchReviewDueFromDb(tenantId, now, windowEnd),
    ])

    const probation = probationEmployees.map((e) => ({
      id: e.id,
      type: 'PROBATION_END' as const,
      title: `Probation ending: ${e.firstName} ${e.lastName}`,
      dueDate: e.probationEndDate?.toISOString().slice(0, 10),
      meta: { employeeCode: e.employeeCode, department: e.department?.name },
    }))

    const contractReminders = contractsExpiring.map((c) => ({
      id: c.id,
      type: 'CONTRACT_EXPIRY' as const,
      title: `Contract expiring: ${c.title} (${c.partyName})`,
      dueDate: c.endDate?.toISOString().slice(0, 10),
      meta: { contractNumber: c.contractNumber, contractType: c.contractType },
    }))

    const reminders = [...probation, ...contractReminders, ...reviewDueList].sort(
      (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')
    )

    return NextResponse.json({
      reminders,
      probationCount: probation.length,
      contractCount: contractReminders.length,
      reviewCount: reviewDueList.length,
      windowDays: days,
    })
  } catch (e: unknown) {
    return handleLicenseError(e)
  }
}
