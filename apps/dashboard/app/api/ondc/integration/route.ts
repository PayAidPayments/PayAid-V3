import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createIntegrationSchema = z.object({
  sellerId: z.string().min(1),
  sellerAppId: z.string().min(1),
  sellerAppKey: z.string().min(1),
  networkId: z.string().default('ONDC:RETail'),
  isTestMode: z.boolean().default(true),
})

// GET /api/ondc/integration - Get ONDC integration
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const integration = await prisma.oNDCIntegration.findUnique({
      where: { tenantId },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    })

    if (!integration) {
      return NextResponse.json({ integration: null })
    }

    return NextResponse.json({ integration })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get ONDC integration error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ONDC integration' },
      { status: 500 }
    )
  }
}

// POST /api/ondc/integration - Create/Update ONDC integration
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createIntegrationSchema.parse(body)

    const integration = await prisma.oNDCIntegration.upsert({
      where: { tenantId },
      update: {
        sellerId: validated.sellerId,
        sellerAppId: validated.sellerAppId,
        sellerAppKey: validated.sellerAppKey,
        networkId: validated.networkId,
        isTestMode: validated.isTestMode,
      },
      create: {
        tenantId,
        sellerId: validated.sellerId,
        sellerAppId: validated.sellerAppId,
        sellerAppKey: validated.sellerAppKey,
        networkId: validated.networkId,
        isTestMode: validated.isTestMode,
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create ONDC integration error:', error)
    return NextResponse.json(
      { error: 'Failed to create ONDC integration' },
      { status: 500 }
    )
  }
}

