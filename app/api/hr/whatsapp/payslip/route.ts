import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
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

    // Determine month/year
    let targetMonth = month
    let targetYear = year || new Date().getFullYear()

    if (!targetMonth) {
      // Default to last month
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      targetMonth = lastMonth.getMonth() + 1
      targetYear = lastMonth.getFullYear()
    }

    // Find payroll run for the month
    const payrollRun = await prisma.payrollRun.findFirst({
      where: {
        tenantId,
        payrollMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
        status: 'COMPLETED',
      },
      include: {
        payslips: {
          where: {
            employeeId,
          },
        },
      },
    })

    if (!payrollRun || !payrollRun.payslips || payrollRun.payslips.length === 0) {
      return NextResponse.json({
        error: `Payslip not found for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`,
        message: `Payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })} is not available.\n\n` +
          `Please contact HR or check if payroll has been processed for this month.`,
      }, { status: 404 })
    }

    const payslip = payrollRun.payslips[0]

    // Generate payslip summary message
    const response = `💰 *Your Payslip - ${new Date(targetYear, targetMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}*\n\n` +
      `👤 Employee: ${employee.firstName} ${employee.lastName}\n` +
      `🆔 Code: ${employee.employeeCode}\n\n` +
      `💵 *Earnings:*\n` +
      `   Basic: ₹${payslip.basicSalary || 0}\n` +
      `   HRA: ₹${payslip.hra || 0}\n` +
      `   Allowances: ₹${payslip.allowances || 0}\n` +
      `   Gross: ₹${payslip.grossSalary || 0}\n\n` +
      `📉 *Deductions:*\n` +
      `   PF: ₹${payslip.pfDeduction || 0}\n` +
      `   ESI: ₹${payslip.esiDeduction || 0}\n` +
      `   PT: ₹${payslip.ptDeduction || 0}\n` +
      `   TDS: ₹${payslip.tdsDeduction || 0}\n` +
      `   Total Deductions: ₹${payslip.totalDeductions || 0}\n\n` +
      `✅ *Net Salary: ₹${payslip.netSalary || 0}*\n\n` +
      `📄 Full payslip PDF will be sent separately.`

    return NextResponse.json({
      success: true,
      message: response,
      payslipId: payslip.id,
      downloadUrl: `/api/hr/payslips/${payslip.id}/download`,
    })
  } catch (error: any) {
    return handleLicenseError(error)
  }
}
