import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createLeavePolicySchema = z.object({
  leaveTypeId: z.string(),
  accrualType: z.enum(['FIXED', 'ACCRUAL']).default('FIXED'),
  accrualAmount: z.number().positive().optional(),
  maxBalance: z.number().positive().optional(),
  carryForwardLimit: z.number().min(0).optional(),
  minDaysNotice: z.number().min(0).default(0),
  maxConsecutiveDays: z.number().positive().optional(),
  requiresApproval: z.boolean().default(true),
  requiresDocument: z.boolean().default(false),
})

// GET /api/hr/leave/policies - List all leave policies
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const leavePolicies = await prisma.leavePolicy.findMany({
      where: {
        tenantId: tenantId,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ leavePolicies })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get leave policies error:', error)
    return NextResponse.json(
      { error: 'Failed to get leave policies' },
      { status: 500 }
    )
  }
}

// POST /api/hr/leave/policies - Create a new leave policy
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createLeavePolicySchema.parse(body)

    // Verify leave type exists
    const leaveType = await prisma.leaveType.findFirst({
      where: {
        id: validated.leaveTypeId,
        tenantId: tenantId,
      },
    })

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Check if policy already exists for this leave type
    const existing = await prisma.leavePolicy.findFirst({
      where: {
        leaveTypeId: validated.leaveTypeId,
        tenantId: tenantId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Leave policy already exists for this leave type' },
        { status: 400 }
      )
    }

    const data: any = {
      tenantId: tenantId,
      leaveTypeId: validated.leaveTypeId,
      accrualType: validated.accrualType,
      minDaysNotice: validated.minDaysNotice ?? 0,
      requiresApproval: validated.requiresApproval ?? true,
      requiresDocument: validated.requiresDocument ?? false,
    }
    
    if (validated.accrualAmount !== undefined) data.accrualAmount = validated.accrualAmount
    if (validated.maxBalance !== undefined) data.maxBalance = validated.maxBalance
    if (validated.carryForwardLimit !== undefined) data.carryForwardLimit = validated.carryForwardLimit
    if (validated.maxConsecutiveDays !== undefined) data.maxConsecutiveDays = validated.maxConsecutiveDays
    
    const leavePolicy = await prisma.leavePolicy.create({
      data,
      include: {
        leaveType: true,
      },
    })

    return NextResponse.json(leavePolicy, { status: 201 })
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

    console.error('Create leave policy error:', error)
    return NextResponse.json(
      { error: 'Failed to create leave policy' },
      { status: 500 }
    )
  }
}
