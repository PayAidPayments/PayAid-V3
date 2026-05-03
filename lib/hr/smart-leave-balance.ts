/**
 * Feature #7: Smart Leave Balance Management
 * Accrual note, carry-forward suggestion, encashment recommendation.
 */
import { prisma } from '@/lib/db/prisma'

export interface SmartBalanceItem {
  leaveTypeId: string
  leaveTypeName: string
  code: string
  balance: number
  asOfDate: string
  carryForwardSuggestion: string
  encashmentRecommendation: string
}

export async function getSmartLeaveBalance(
  tenantId: string,
  employeeId: string
): Promise<{ balances: SmartBalanceItem[]; summaryNote: string }> {
  const balances = await prisma.leaveBalance.findMany({
    where: { tenantId, employeeId },
    include: { leaveType: true },
    orderBy: { asOfDate: 'desc' },
  })

  const byType = new Map<string, { balance: number; asOfDate: Date; leaveType: { name: string; code: string } }>()
  for (const b of balances) {
    if (!byType.has(b.leaveTypeId)) {
      byType.set(b.leaveTypeId, {
        balance: Number(b.balance),
        asOfDate: b.asOfDate,
        leaveType: { name: b.leaveType.name, code: b.leaveType.code ?? '' },
      })
    }
  }

  const result: SmartBalanceItem[] = []
  for (const [leaveTypeId, v] of byType) {
    const carryForwardSuggestion =
      v.balance > 15
        ? 'Consider carrying forward up to policy max (e.g. 30 days) before year-end to avoid lapse.'
        : v.balance > 5
          ? 'Carry-forward optional; use or encash per policy.'
          : 'Low balance; use for planned leaves only.'
    const encashmentRecommendation =
      v.balance > 20
        ? 'Encashment can optimize tax if in lower slab; check policy and tax impact.'
        : 'Encashment typically beneficial when balance exceeds 30 days (policy permitting).'
    result.push({
      leaveTypeId,
      leaveTypeName: v.leaveType.name,
      code: v.leaveType.code,
      balance: v.balance,
      asOfDate: v.asOfDate.toISOString().slice(0, 10),
      carryForwardSuggestion,
      encashmentRecommendation,
    })
  }

  return {
    balances: result,
    summaryNote:
      'Auto-accrual depends on leave policy setup. Use carry-forward and encashment suggestions as guidance; confirm with policy.',
  }
}
