import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** GET /api/hr/compliance/overview - Phase 2: PF/ECR, ESI, TDS, PT status */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const now = new Date()
    const month = now.getMonth() + 1
    const year = now.getFullYear()

    const cycle = await prisma.payrollCycle.findFirst({
      where: { tenantId, month, year },
      include: { payrollRuns: { include: { employee: true } } },
    })

    const pfCount = cycle?.payrollRuns.filter((r) => r.employee.pfApplicable).length ?? 0
    const esiCount = cycle?.payrollRuns.filter((r) => r.employee.esiApplicable).length ?? 0
    const totalTds = cycle?.payrollRuns.reduce((s, r) => s + Number(r.tdsInr), 0) ?? 0
    const totalPt = cycle?.payrollRuns.reduce((s, r) => s + Number(r.ptInr), 0) ?? 0

    return NextResponse.json({
      month,
      year,
      items: [
        { type: 'PF_ECR', name: 'PF ECR', status: cycle ? 'READY' : 'NO_DATA', employeeCount: pfCount, downloadUrl: cycle ? `/api/hr/payroll/reports/ecr?month=${month}&year=${year}` : null },
        { type: 'ESI', name: 'ESI', status: cycle && esiCount > 0 ? 'READY' : cycle ? 'NA' : 'NO_DATA', employeeCount: esiCount },
        { type: 'TDS_24Q', name: 'TDS 24Q', status: cycle && totalTds > 0 ? 'READY' : cycle ? 'NA' : 'NO_DATA', totalAmount: totalTds },
        { type: 'PT', name: 'Professional Tax', status: cycle && totalPt > 0 ? 'READY' : cycle ? 'NA' : 'NO_DATA', totalAmount: totalPt },
      ],
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
