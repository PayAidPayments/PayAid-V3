import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updatePFConfigSchema = z.object({
  wageCeiling: z.number().positive().optional(),
  employeePercent: z.number().min(0).max(100).optional(),
  employerPercent: z.number().min(0).max(100).optional(),
  epsPercent: z.number().min(0).max(100).optional(),
  pfPercent: z.number().min(0).max(100).optional(),
})

// GET /api/hr/payroll/statutory/pf-config - Get PF configuration
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    let config = await prisma.pFConfig.findUnique({
      where: { tenantId: tenantId },
    })

    // Create default if doesn't exist
    if (!config) {
      config = await prisma.pFConfig.create({
        data: {
          tenantId: tenantId,
          wageCeiling: new Decimal(15000),
          employeePercent: new Decimal(12),
          employerPercent: new Decimal(12),
          epsPercent: new Decimal(3.67),
          pfPercent: new Decimal(8.33),
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get PF config error:', error)
    return NextResponse.json(
      { error: 'Failed to get PF configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/hr/payroll/statutory/pf-config - Update PF configuration
export async function PUT(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = updatePFConfigSchema.parse(body)

    const updateData: any = {}
    if (validated.wageCeiling !== undefined)
      updateData.wageCeiling = new Decimal(validated.wageCeiling.toString())
    if (validated.employeePercent !== undefined)
      updateData.employeePercent = new Decimal(validated.employeePercent.toString())
    if (validated.employerPercent !== undefined)
      updateData.employerPercent = new Decimal(validated.employerPercent.toString())
    if (validated.epsPercent !== undefined)
      updateData.epsPercent = new Decimal(validated.epsPercent.toString())
    if (validated.pfPercent !== undefined)
      updateData.pfPercent = new Decimal(validated.pfPercent.toString())

    const config = await prisma.pFConfig.upsert({
      where: { tenantId: tenantId },
      update: updateData,
      create: {
        tenantId: tenantId,
        wageCeiling: new Decimal(validated.wageCeiling?.toString() || '15000'),
        employeePercent: new Decimal(validated.employeePercent?.toString() || '12'),
        employerPercent: new Decimal(validated.employerPercent?.toString() || '12'),
        epsPercent: new Decimal(validated.epsPercent?.toString() || '3.67'),
        pfPercent: new Decimal(validated.pfPercent?.toString() || '8.33'),
      },
    })

    return NextResponse.json(config)
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

    console.error('Update PF config error:', error)
    return NextResponse.json(
      { error: 'Failed to update PF configuration' },
      { status: 500 }
    )
  }
}
