/**
 * Shared helper for WhatsApp (and other) payslip requests.
 * Resolves month/year from natural language and returns message text.
 */
import { prisma } from '@/lib/db/prisma'

export async function getPayslipMessageForEmployee(
  tenantId: string,
  employeeId: string,
  options: { month?: number; year?: number; preferLastMonth?: boolean } = {}
): Promise<{ message: string; payslipId?: string }> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, tenantId },
    select: { firstName: true, lastName: true, employeeCode: true },
  })
  if (!employee) {
    return { message: "Employee record not found. Please contact HR." }
  }

  let targetMonth = options.month
  let targetYear = options.year ?? new Date().getFullYear()

  if (targetMonth == null || options.preferLastMonth) {
    const d = new Date()
    if (options.preferLastMonth || targetMonth == null) {
      d.setMonth(d.getMonth() - 1)
    }
    targetMonth = targetMonth ?? d.getMonth() + 1
    targetYear = targetYear ?? d.getFullYear()
  }

  const cycle = await prisma.payrollCycle.findFirst({
    where: { tenantId, month: targetMonth, year: targetYear },
  })
  if (!cycle) {
    return {
      message: `Payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} is not available. Please contact HR.`,
    }
  }

  const payrollRun = await prisma.payrollRun.findFirst({
    where: { tenantId, cycleId: cycle.id, employeeId },
  })
  if (!payrollRun) {
    return {
      message: `Payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} is not available. Please contact HR.`,
    }
  }

  const gross = Number(payrollRun.grossEarningsInr)
  const deductions = Number(payrollRun.grossDeductionsInr)
  const net = Number(payrollRun.netPayInr)

  const message =
    `💰 *Your Payslip - ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}*\n\n` +
    `👤 ${employee.firstName} ${employee.lastName} (${employee.employeeCode})\n\n` +
    `💵 Gross: ₹${gross.toLocaleString('en-IN')}\n` +
    `📉 Deductions: ₹${deductions.toLocaleString('en-IN')}\n` +
    `✅ *Net Salary: ₹${net.toLocaleString('en-IN')}*\n\n` +
    `📄 Download PDF from HR portal.`

  return { message, payslipId: payrollRun.id }
}

/** Parse month/year from natural language (e.g. "february 2026", "last month", "latest"). */
export function parseMonthYearFromText(text: string): { month?: number; year?: number; preferLastMonth?: boolean } {
  const lower = text.toLowerCase().trim()
  if (lower === 'latest' || lower === 'last month' || lower === 'previous month') {
    return { preferLastMonth: true }
  }
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  }
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) {
      const yearMatch = lower.match(/\b(20\d{2})\b/)
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
      return { month: num, year }
    }
  }
  const numMatch = lower.match(/\b(1[0-2]|[1-9])\b.*\b(20\d{2})\b/) || lower.match(/\b(20\d{2})[-\/](1[0-2]|[1-9])\b/)
  if (numMatch) {
    const a = parseInt(numMatch[1], 10)
    const b = parseInt(numMatch[2], 10)
    if (a >= 1 && a <= 12 && b >= 2020 && b <= 2030) {
      return { month: a, year: b }
    }
    if (b >= 1 && b <= 12 && a >= 2020 && a <= 2030) {
      return { month: b, year: a }
    }
  }
  return {}
}
