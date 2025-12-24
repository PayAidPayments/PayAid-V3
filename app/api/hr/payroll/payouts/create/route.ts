import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createPayoutSchema = z.object({
  cycleId: z.string(),
  payrollRunIds: z.array(z.string()).optional(), // If not provided, all pending runs in cycle
})

// POST /api/hr/payroll/payouts/create - Create bulk payout via PayAid Payments
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createPayoutSchema.parse(body)

    const cycle = await prisma.payrollCycle.findFirst({
      where: {
        id: validated.cycleId,
        tenantId: tenantId,
      },
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    // Get payroll runs to process
    const where: any = {
      cycleId: validated.cycleId,
      tenantId: tenantId,
      payoutStatus: 'PENDING',
    }

    if (validated.payrollRunIds && validated.payrollRunIds.length > 0) {
      where.id = { in: validated.payrollRunIds }
    }

    const payrollRuns = await prisma.payrollRun.findMany({
      where,
      include: {
        employee: true,
      },
    })

    if (payrollRuns.length === 0) {
      return NextResponse.json(
        { error: 'No pending payroll runs found' },
        { status: 400 }
      )
    }

    // Prepare payout data for PayAid Payments API
    const payoutItems = payrollRuns.map((run) => ({
      employeeId: run.employeeId,
      employeeCode: run.employee.employeeCode,
      accountNumber: run.employee.bankAccountNumber, // Encrypted, will be decrypted before sending
      ifscCode: run.employee.ifscCode, // Encrypted
      amount: Number(run.netPayInr),
      payrollRunId: run.id,
    }))

    // TODO: Integrate with PayAid Payments API
    // For now, simulate payout creation
    const payoutBatchId = `PAYOUT-${Date.now()}`

    // Update payroll runs with payout status
    await prisma.payrollRun.updateMany({
      where: {
        id: { in: payrollRuns.map((r) => r.id) },
      },
      data: {
        payoutStatus: 'INITIATED',
        payaidPayoutId: payoutBatchId,
      },
    })

    return NextResponse.json({
      message: `Payout created for ${payrollRuns.length} employees`,
      payoutBatchId,
      payrollRuns: payrollRuns.map((r) => ({
        id: r.id,
        employeeCode: r.employee.employeeCode,
        amount: Number(r.netPayInr),
        status: 'INITIATED',
      })),
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create payout error:', error)
    return NextResponse.json(
      { error: 'Failed to create payout' },
      { status: 500 }
    )
  }
}
