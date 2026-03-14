import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/payroll/reports/ecr - Generate ECR (Electronic Challan cum Return) file
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Get payroll cycle
    const cycle = await prisma.payrollCycle.findUnique({
      where: {
        tenantId_month_year_runType: {
          tenantId: tenantId,
          month,
          year,
          runType: 'REGULAR',
        },
      },
      include: {
        payrollRuns: {
          where: {
            employee: {
              pfApplicable: true,
            },
          },
          include: {
            employee: true,
          },
        },
      },
    })

    if (!cycle) {
      return NextResponse.json(
        { error: 'Payroll cycle not found' },
        { status: 404 }
      )
    }

    // Generate ECR data (EPFO format)
    const ecrData = cycle.payrollRuns.map((run) => ({
      uan: run.employee.uanNumber || '',
      employeeName: `${run.employee.firstName} ${run.employee.lastName}`,
      wageMonth: month.toString().padStart(2, '0'),
      wageYear: year.toString(),
      grossWages: Number(run.grossEarningsInr),
      epfWages: Number(run.pfEmployeeInr) > 0 ? Number(run.grossEarningsInr) : 0,
      epsWages: Number(run.pfEmployeeInr) > 0 ? Number(run.grossEarningsInr) : 0,
      edliWages: Number(run.pfEmployeeInr) > 0 ? Number(run.grossEarningsInr) : 0,
      epfContribution: Number(run.pfEmployeeInr),
      epsContribution: Number(run.pfEmployerInr) * 3.67 / 12.0, // EPS portion
      edliContribution: 0, // EDLI if applicable
      epfRemittance: Number(run.pfEmployeeInr) + Number(run.pfEmployerInr),
      ncpDays: Number(run.lopDays),
    }))

    return NextResponse.json({
      month,
      year,
      totalEmployees: ecrData.length,
      totalEPFContribution: ecrData.reduce((sum, d) => sum + d.epfContribution, 0),
      totalEPSContribution: ecrData.reduce((sum, d) => sum + d.epsContribution, 0),
      totalRemittance: ecrData.reduce((sum, d) => sum + d.epfRemittance, 0),
      ecrData,
      // In production, generate CSV/Excel file
      downloadUrl: null, // TODO: Generate and upload file
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate ECR error:', error)
    return NextResponse.json(
      { error: 'Failed to generate ECR file' },
      { status: 500 }
    )
  }
}
