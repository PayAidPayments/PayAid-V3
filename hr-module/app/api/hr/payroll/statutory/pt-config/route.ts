import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createPTConfigSchema = z.object({
  state: z.string().min(1),
  slabs: z.array(
    z.object({
      salaryFrom: z.number().positive(),
      salaryTo: z.number().positive().nullable(),
      ptAmountInr: z.number().positive(),
    })
  ),
})

// GET /api/hr/payroll/statutory/pt-config - List PT configurations
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state')

    const where: any = {
      tenantId: tenantId,
    }

    if (state) where.state = state

    const configs = await prisma.pTConfig.findMany({
      where,
      include: {
        ptSlabs: {
          orderBy: { salaryFrom: 'asc' },
        },
      },
    })

    return NextResponse.json({ configs })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get PT config error:', error)
    return NextResponse.json(
      { error: 'Failed to get PT configurations' },
      { status: 500 }
    )
  }
}

// POST /api/hr/payroll/statutory/pt-config - Create PT configuration
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const body = await request.json()
    const validated = createPTConfigSchema.parse(body)

    // Check if config already exists
    const existing = await prisma.pTConfig.findUnique({
      where: {
        tenantId_state: {
          tenantId: tenantId,
          state: validated.state,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'PT configuration already exists for this state' },
        { status: 400 }
      )
    }

    const config = await prisma.pTConfig.create({
      data: {
        tenantId: tenantId,
        state: validated.state,
        ptSlabs: {
          create: validated.slabs.map((slab) => ({
            salaryFrom: new Decimal(slab.salaryFrom.toString()),
            salaryTo: slab.salaryTo ? new Decimal(slab.salaryTo.toString()) : null,
            ptAmountInr: new Decimal(slab.ptAmountInr.toString()),
          })),
        },
      },
      include: {
        ptSlabs: true,
      },
    })

    return NextResponse.json(config, { status: 201 })
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

    console.error('Create PT config error:', error)
    return NextResponse.json(
      { error: 'Failed to create PT configuration' },
      { status: 500 }
    )
  }
}
