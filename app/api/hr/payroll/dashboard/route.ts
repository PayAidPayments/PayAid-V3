import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/payroll/dashboard - Get payroll dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')

    // Get payroll cycles
    const cycles = await prisma.payrollCycle.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { payrollRuns: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    // Get payroll runs
    const runs = await prisma.payrollRun.findMany({
      where: {
        cycle: { tenantId },
      },
      include: {
        cycle: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Calculate statistics
    const totalCycles = cycles.length
    const activeCycles = cycles.filter((c) => c.status === 'active').length
    const lockedCycles = cycles.filter((c) => c.status === 'locked').length
    const totalRuns = runs.length
    const totalPayroll = runs.reduce(
      (sum, r) => sum + (parseFloat(r.netPayInr.toString()) || 0),
      0
    )

    // Monthly payroll trend
    const monthlyData = cycles.map((cycle) => ({
      month: `${cycle.month}/${cycle.year}`,
      payroll: runs
        .filter((r) => r.cycleId === cycle.id)
        .reduce((sum, r) => sum + (parseFloat(r.netPayInr.toString()) || 0), 0),
      employees: runs.filter((r) => r.cycleId === cycle.id).length,
    }))

    return NextResponse.json({
      totalCycles,
      activeCycles,
      lockedCycles,
      totalRuns,
      totalPayroll,
      monthlyData,
      recentCycles: cycles.slice(0, 5),
      recentRuns: runs.slice(0, 10),
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

