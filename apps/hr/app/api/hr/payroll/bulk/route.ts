import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const bulkSchema = z.object({
  action: z.enum(['salary_revision', 'lop', 'arrears']),
  employeeIds: z.array(z.string()).min(1),
  payload: z.record(z.unknown()).optional(),
})

/**
 * POST /api/hr/payroll/bulk - Bulk operations: salary revision, LWP, arrears
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const body = await request.json()
    const parsed = bulkSchema.parse(body)

    const employees = await prisma.employee.findMany({
      where: { id: { in: parsed.employeeIds }, tenantId },
      select: { id: true, employeeCode: true, firstName: true, lastName: true, ctcAnnualInr: true },
    })

    if (employees.length !== parsed.employeeIds.length) {
      return NextResponse.json(
        { error: 'Some employees not found or do not belong to tenant' },
        { status: 400 }
      )
    }

    if (parsed.action === 'salary_revision') {
      const revisions = (parsed.payload?.revisions as { employeeId: string; newCtc: number }[]) ?? []
      const updates = revisions.filter((r) => parsed.employeeIds.includes(r.employeeId))
      for (const u of updates) {
        await prisma.employee.update({
          where: { id: u.employeeId },
          data: { ctcAnnualInr: u.newCtc },
        })
      }
      return NextResponse.json({
        success: true,
        action: 'salary_revision',
        updated: updates.length,
        message: `Updated CTC for ${updates.length} employee(s). Run payroll to reflect changes.`,
      })
    }

    if (parsed.action === 'lop') {
      return NextResponse.json({
        success: true,
        action: 'lop',
        employeeCount: employees.length,
        message: 'LWP is applied per payroll run from attendance. Use Payroll Run wizard and ensure attendance data is correct.',
      })
    }

    if (parsed.action === 'arrears') {
      return NextResponse.json({
        success: true,
        action: 'arrears',
        employeeCount: employees.length,
        message: 'Include arrears in the next Payroll Run (step 1: Include arrears toggle). Arrears can be added via payroll adjustments.',
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    if (e && typeof e === 'object' && 'moduleId' in e) return handleLicenseError(e)
    console.error('POST payroll/bulk:', e)
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 })
  }
}
