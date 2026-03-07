import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/payroll/dashboard - Get payroll dashboard statistics + summary + compliance
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const nextPayrollDate = new Date(currentYear, currentMonth, 0) // Last day of current month

    // Active employee count (for payroll scope)
    const employeeCount = await prisma.employee.count({
      where: { tenantId, status: 'ACTIVE' },
    })

    // Employees missing PAN (compliance)
    const missingPanCount = await prisma.employee.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        OR: [{ panNumber: null }, { panNumber: '' }],
      },
    })

    // Get payroll cycles (order by year desc, month desc for "latest" first)
    const cycles = await prisma.payrollCycle.findMany({
      where: { tenantId },
      include: {
        _count: { select: { payrollRuns: true } },
        payrollRuns: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    })

    // Get payroll runs for latest cycle and aggregates
    const runs = await prisma.payrollRun.findMany({
      where: { cycle: { tenantId } },
      include: { cycle: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const totalCycles = cycles.length
    const totalRuns = runs.length
    const totalPayroll = runs.reduce(
      (sum, r) => sum + (parseFloat(r.netPayInr.toString()) || 0),
      0
    )

    // Latest cycle (current or most recent)
    const latestCycle = cycles[0] || null
    const latestRuns = latestCycle
      ? runs.filter((r) => r.cycleId === latestCycle.id)
      : []
    const grossPayroll = latestRuns.reduce(
      (sum, r) => sum + (parseFloat(r.grossEarningsInr.toString()) || 0),
      0
    )
    const netPayroll = latestRuns.reduce(
      (sum, r) => sum + (parseFloat(r.netPayInr.toString()) || 0),
      0
    )
    const totalTds = latestRuns.reduce(
      (sum, r) => sum + (parseFloat(r.tdsInr.toString()) || 0),
      0
    )
    const totalPf = latestRuns.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.pfEmployeeInr.toString()) || 0) +
        (parseFloat(r.pfEmployerInr.toString()) || 0),
      0
    )
    const totalPt = latestRuns.reduce(
      (sum, r) => sum + (parseFloat(r.ptInr.toString()) || 0),
      0
    )
    const totalEsi = latestRuns.reduce(
      (sum, r) =>
        sum +
        (parseFloat(r.esiEmployeeInr.toString()) || 0) +
        (parseFloat(r.esiEmployerInr.toString()) || 0),
      0
    )
    const totalDeductions = latestRuns.reduce(
      (sum, r) => sum + (parseFloat(r.grossDeductionsInr.toString()) || 0),
      0
    )
    const otherDeductions = Math.max(
      0,
      totalDeductions - totalTds - totalPf - totalPt - totalEsi
    )

    const payrollStatus = latestCycle?.status ?? 'DRAFT'

    const deductionsBreakdown = {
      tds: totalTds,
      pf: totalPf,
      pt: totalPt,
      esi: totalEsi,
      other: otherDeductions,
    }

    const complianceSummary = {
      tds: {
        calculated: totalTds >= 0,
        form24QReady: latestRuns.length > 0 && payrollStatus !== 'DRAFT',
      },
      pf: {
        amount: totalPf,
        ecrFiled: latestCycle ? payrollStatus === 'COMPLETED' || payrollStatus === 'LOCKED' : false,
      },
      pt: {
        amount: totalPt,
        challansReady: latestRuns.length > 0,
      },
      esi: {
        amount: totalEsi,
        returnReady: latestRuns.length > 0,
      },
      missingPanCount,
    }

    const monthlyData = cycles.map((cycle) => ({
      month: `${cycle.month}/${cycle.year}`,
      payroll: runs
        .filter((r) => r.cycleId === cycle.id)
        .reduce((sum, r) => sum + (parseFloat(r.netPayInr.toString()) || 0), 0),
      employees: runs.filter((r) => r.cycleId === cycle.id).length,
    }))

    return NextResponse.json({
      totalCycles,
      totalRuns,
      totalPayroll,
      monthlyData,
      recentCycles: cycles.slice(0, 5),
      recentRuns: runs.slice(0, 10),
      nextPayrollDate: nextPayrollDate.toISOString().slice(0, 10),
      employeeCount,
      grossPayroll,
      netPayroll,
      payrollStatus,
      deductionsBreakdown,
      complianceSummary,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get payroll dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to get payroll dashboard data' },
      { status: 500 }
    )
  }
}

