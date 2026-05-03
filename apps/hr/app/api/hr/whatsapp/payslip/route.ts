import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/whatsapp/payslip
 * Get payslip via WhatsApp request
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const { employeeId, month, year } = body

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Verify employee
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Determine month/year (1-based month)
    let targetMonth = month
    let targetYear = year ?? new Date().getFullYear()

    if (!targetMonth) {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      targetMonth = lastMonth.getMonth() + 1
      targetYear = lastMonth.getFullYear()
    }

    // Find PayrollCycle by month/year, then PayrollRun for this employee
    const cycle = await prisma.payrollCycle.findFirst({
      where: { tenantId, month: targetMonth, year: targetYear },
    })
    if (!cycle) {
      return NextResponse.json({
        error: `Payroll not found for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
        message: `Payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} is not available.\n\nPlease contact HR or check if payroll has been processed.`,
      }, { status: 404 })
    }

    const payrollRun = await prisma.payrollRun.findFirst({
      where: { tenantId, cycleId: cycle.id, employeeId },
      include: { cycle: true },
    })
    if (!payrollRun) {
      return NextResponse.json({
        error: `Payslip not found for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
        message: `Payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} is not available.\n\nPlease contact HR.`,
      }, { status: 404 })
    }

    const gross = Number(payrollRun.grossEarningsInr)
    const deductions = Number(payrollRun.grossDeductionsInr)
    const net = Number(payrollRun.netPayInr)

    const response = `💰 *Your Payslip - ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}*\n\n` +
      `👤 ${employee.firstName} ${employee.lastName} (${employee.employeeCode})\n\n` +
      `💵 Gross Earnings: ₹${gross.toLocaleString('en-IN')}\n` +
      `📉 Deductions: ₹${deductions.toLocaleString('en-IN')}\n` +
      `   PF: ₹${Number(payrollRun.pfEmployeeInr).toLocaleString('en-IN')} | ESI: ₹${Number(payrollRun.esiEmployeeInr).toLocaleString('en-IN')}\n` +
      `   PT: ₹${Number(payrollRun.ptInr).toLocaleString('en-IN')} | TDS: ₹${Number(payrollRun.tdsInr).toLocaleString('en-IN')}\n\n` +
      `✅ *Net Salary: ₹${net.toLocaleString('en-IN')}*\n\n` +
      `📄 Download PDF from HR portal.`

    return NextResponse.json({
      success: true,
      message: response,
      payslipId: payrollRun.id,
      downloadUrl: `/api/hr/payroll/runs/${payrollRun.id}/payslip`,
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
