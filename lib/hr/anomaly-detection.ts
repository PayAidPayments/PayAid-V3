/**
 * Feature #4: Anomaly Detection and Fraud Prevention
 */
import { prisma } from '@/lib/db/prisma'

export interface AnomalyItem {
  type: 'ATTENDANCE' | 'EXPENSE' | 'LEAVE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  title: string
  description: string
  employeeId?: string
  date?: string
  metadata?: Record<string, unknown>
}

export async function runAnomalyDetection(tenantId: string): Promise<AnomalyItem[]> {
  const items: AnomalyItem[] = []
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [attendanceRecords, expenses, leaveRequests] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { tenantId, date: { gte: thirtyDaysAgo } },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.expense.findMany({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId, startDate: { gte: thirtyDaysAgo } },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ])

  const checkInGroups = new Map<string, { date: string; employeeIds: string[]; names: string[] }>()
  for (const r of attendanceRecords) {
    if (!r.checkInTime) continue
    const key = r.date.toISOString().slice(0, 10) + '_' + new Date(r.checkInTime).toTimeString().slice(0, 5)
    const existing = checkInGroups.get(key) || { date: r.date.toISOString().slice(0, 10), employeeIds: [], names: [] }
    existing.employeeIds.push(r.employeeId)
    existing.names.push(r.employee.firstName + ' ' + r.employee.lastName)
    checkInGroups.set(key, existing)
  }
  for (const v of checkInGroups.values()) {
    if (v.employeeIds.length >= 3) {
      items.push({
        type: 'ATTENDANCE',
        severity: 'MEDIUM',
        title: 'Same check-in time',
        description: v.employeeIds.length + ' employees same check-in on ' + v.date,
        date: v.date,
        metadata: { employeeIds: v.employeeIds },
      })
    }
  }

  const expenseSeen = new Map<string, { first: { amount: unknown; date: Date; employeeId: string }; count: number }>()
  for (const e of expenses) {
    const empId = e.employeeId ?? 'unknown'
    const key = String(Number(e.amount)) + '_' + e.date.toISOString().slice(0, 10) + '_' + empId
    const existing = expenseSeen.get(key)
    if (existing) existing.count++
    else expenseSeen.set(key, { first: { amount: e.amount, date: e.date, employeeId: empId }, count: 1 })
  }
  for (const v of expenseSeen.values()) {
    if (v.count >= 2) {
      items.push({
        type: 'EXPENSE',
        severity: 'HIGH',
        title: 'Duplicate expense',
        description: v.count + ' similar entries same amount and date',
        employeeId: v.first.employeeId,
        date: v.first.date.toISOString().slice(0, 10),
      })
    }
  }

  const monFri = leaveRequests.filter((lr) => {
    const day = new Date(lr.startDate).getDay()
    return day === 1 || day === 5
  })
  const byEmployee = new Map<string, number>()
  for (const lr of monFri) {
    byEmployee.set(lr.employeeId, (byEmployee.get(lr.employeeId) || 0) + 1)
  }
  for (const [empId, count] of byEmployee) {
    if (count >= 3) {
      const lr = leaveRequests.find((l) => l.employeeId === empId)
      const name = lr?.employee ? lr.employee.firstName + ' ' + lr.employee.lastName : empId
      items.push({
        type: 'LEAVE',
        severity: 'LOW',
        title: 'Frequent Mon/Fri leave',
        description: count + ' leaves on Mon/Fri - ' + name,
        employeeId: empId,
      })
    }
  }

  return items
}
