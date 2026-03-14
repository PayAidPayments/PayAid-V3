import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * Feature #14: Banking Integration (PayAid Payments)
 * GET: List payout status for a cycle. POST: Prepare bulk payout payload for PayAid Payments API.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const cycleId = request.nextUrl.searchParams.get('cycleId')
    if (!cycleId) return NextResponse.json({ error: 'cycleId required' }, { status: 400 })
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId, cycleId },
      include: { employee: { select: { id: true, employeeCode: true, firstName: true, lastName: true } } },
    })
    const items = runs.map((r) => ({
      employeeId: r.employeeId,
      employeeCode: r.employee.employeeCode,
      name: r.employee.firstName + ' ' + r.employee.lastName,
      netPayInr: Number(r.netPayInr),
      payoutStatus: r.payoutStatus,
    }))
    return NextResponse.json({
      cycleId,
      totalAmount: items.reduce((s, i) => s + i.netPayInr, 0),
      count: items.length,
      items,
      note: 'Integrate with PayAid Payments API to push payoutStatus updates and trigger actual transfers.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const body = await request.json().catch(() => ({}))
    const cycleId = body.cycleId
    if (!cycleId) return NextResponse.json({ error: 'cycleId required' }, { status: 400 })
    const runs = await prisma.payrollRun.findMany({
      where: { tenantId, cycleId },
      include: { employee: true },
    })
    const payload = runs.map((r) => ({
      employeeId: r.employeeId,
      amountInr: Number(r.netPayInr),
      bankAccountRef: r.employee.bankAccountNumber || r.employee.bankName || 'CONFIGURE',
      name: r.employee.firstName + ' ' + r.employee.lastName,
    }))
    return NextResponse.json({
      cycleId,
      totalAmount: payload.reduce((s, p) => s + p.amountInr, 0),
      count: payload.length,
      payloadForPayAidPayments: payload,
      note: 'Send payload to PayAid Payments bulk transfer API; then PATCH payroll runs with payoutStatus.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
