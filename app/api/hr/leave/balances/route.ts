import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/hr/leave/balances - Get leave balances
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get all leave balances for the employee
    const balances = await prisma.leaveBalance.findMany({
      where: {
        employeeId,
      },
      include: {
        leaveType: {
          select: {
            id: true,
            name: true,
            code: true,
            isPaid: true,
          },
        },
      },
      orderBy: { asOfDate: 'desc' },
    })

    // Get leave policies for context
    const policies = await prisma.leavePolicy.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        leaveType: true,
      },
    })

    // Get all leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: {
        tenantId: tenantId,
        isActive: true,
      },
    })

    // Build balance summary with policy info
    const balanceSummary = leaveTypes.map((leaveType) => {
      const balance = balances.find((b) => b.leaveTypeId === leaveType.id)
      const policy = policies.find((p) => p.leaveTypeId === leaveType.id)

      return {
        leaveType: {
          id: leaveType.id,
          name: leaveType.name,
          code: leaveType.code,
          isPaid: leaveType.isPaid,
        },
        balance: balance ? Number(balance.balance) : 0,
        asOfDate: balance?.asOfDate.toISOString(),
        policy: policy
          ? {
              accrualType: policy.accrualType,
              accrualAmount: policy.accrualAmount,
              maxBalance: policy.maxBalance,
              carryForwardLimit: policy.carryForwardLimit,
            }
          : null,
      }
    })

    // Ensure balances is always an array
    const safeBalances = Array.isArray(balanceSummary) ? balanceSummary : []

    return NextResponse.json({
      employeeId,
      balances: safeBalances,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get leave balances error:', error)
    return NextResponse.json(
      { error: 'Failed to get leave balances' },
      { status: 500 }
    )
  }
}
