import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateESIConfigSchema = z.object({
  wageCeiling: z.number().positive().optional(),
  employeePercent: z.number().min(0).max(100).optional(),
  employerPercent: z.number().min(0).max(100).optional(),
})

// GET /api/hr/payroll/statutory/esi-config - Get ESI configuration
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    let config = await prisma.eSIConfig.findUnique({
      where: { tenantId: tenantId },
    })

    if (!config) {
      config = await prisma.eSIConfig.create({
        data: {
          tenantId: tenantId,
          wageCeiling: new Decimal(21000),
          employeePercent: new Decimal(0.75),
          employerPercent: new Decimal(3.25),
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get ESI config error:', error)
    return NextResponse.json(
      { error: 'Failed to get ESI configuration' },
      { status: 500 }
    )
  }
}

// PUT /api/hr/payroll/statutory/esi-config - Update ESI configuration
export async function PUT(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = updateESIConfigSchema.parse(body)

    const updateData: any = {}
    if (validated.wageCeiling !== undefined)
      updateData.wageCeiling = new Decimal(validated.wageCeiling.toString())
    if (validated.employeePercent !== undefined)
      updateData.employeePercent = new Decimal(validated.employeePercent.toString())
    if (validated.employerPercent !== undefined)
      updateData.employerPercent = new Decimal(validated.employerPercent.toString())

    const config = await prisma.eSIConfig.upsert({
      where: { tenantId: tenantId },
      update: updateData,
      create: {
        tenantId: tenantId,
        wageCeiling: new Decimal(validated.wageCeiling?.toString() || '21000'),
        employeePercent: new Decimal(validated.employeePercent?.toString() || '0.75'),
        employerPercent: new Decimal(validated.employerPercent?.toString() || '3.25'),
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

    console.error('Update ESI config error:', error)
    return NextResponse.json(
      { error: 'Failed to update ESI configuration' },
      { status: 500 }
    )
  }
}
