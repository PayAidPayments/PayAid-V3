import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generatePayslipPDF } from '@/lib/invoicing/pdf'

// GET /api/hr/payroll/runs/[id]/payslip - Generate and download payslip PDF
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
        cycle: true,
      },
    })

    if (!payrollRun) {
      return NextResponse.json(
        { error: 'Payroll run not found' },
        { status: 404 }
      )
    }

    // Generate payslip PDF
    const pdfBuffer = await generatePayslipPDF({
      employeeName: `${payrollRun.employee.firstName} ${payrollRun.employee.lastName}`,
      employeeCode: payrollRun.employee.employeeCode,
      department: payrollRun.employee.department?.name,
      designation: payrollRun.employee.designation?.name,
      month: payrollRun.cycle.month,
      year: payrollRun.cycle.year,
      basic: Number(payrollRun.grossEarningsInr) * 0.4, // Estimate basic as 40% of gross
      hra: Number(payrollRun.grossEarningsInr) * 0.2, // Estimate HRA as 20% of gross
      allowances: Number(payrollRun.grossEarningsInr) * 0.4, // Remaining as allowances
      grossEarnings: Number(payrollRun.grossEarningsInr),
      pf: Number(payrollRun.pfEmployeeInr),
      esi: Number(payrollRun.esiEmployeeInr),
      pt: Number(payrollRun.ptInr),
      tds: Number(payrollRun.tdsInr),
      lop: Number(payrollRun.lopAmountInr),
      totalDeductions: Number(payrollRun.grossDeductionsInr),
      netPay: Number(payrollRun.netPayInr),
      daysPaid: payrollRun.daysPaid,
      totalDays: getWorkingDaysInMonth(payrollRun.cycle.month, payrollRun.cycle.year),
    })

    // Update payslip URL (in production, upload to S3/MinIO)
    // For now, we'll return the PDF directly

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${payrollRun.employee.employeeCode}-${payrollRun.cycle.month}-${payrollRun.cycle.year}.pdf"`,
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Generate payslip error:', error)
    return NextResponse.json(
      { error: 'Failed to generate payslip' },
      { status: 500 }
    )
  }
}

function getWorkingDaysInMonth(month: number, year: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    if (date.getDay() !== 0) {
      workingDays++
    }
  }

  return workingDays
}
