import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createPartnerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  companyName: z.string().min(1),
  commissionRate: z.number().min(0).max(100),
  whiteLabelEnabled: z.boolean().default(false),
  customLogo: z.string().optional(),
  customColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
})

// GET /api/resellers/partners - Get all partners
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics') // Using analytics as placeholder

    const partners = await prisma.resellerPartner.findMany({
      where: { parentTenantId: tenantId },
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ partners })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get partners error:', error)
    return NextResponse.json(
      { error: 'Failed to get partners' },
      { status: 500 }
    )
  }
}

// POST /api/resellers/partners - Create new partner
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createPartnerSchema.parse(body)

    // Create partner tenant
    const partnerTenant = await prisma.tenant.create({
      data: {
        name: validated.companyName,
        subdomain: validated.companyName.toLowerCase().replace(/\s+/g, '-'),
        status: 'active',
        subscriptionTier: 'professional',
        industry: 'service-business',
      },
    })

    // Create partner record
    const partner = await prisma.resellerPartner.create({
      data: {
        parentTenantId: tenantId,
        partnerTenantId: partnerTenant.id,
        name: validated.name,
        email: validated.email,
        companyName: validated.companyName,
        commissionRate: validated.commissionRate,
        whiteLabelEnabled: validated.whiteLabelEnabled,
        customLogo: validated.customLogo,
        customColors: validated.customColors,
        status: 'active',
      },
    })

    return NextResponse.json({ partner }, { status: 201 })
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

    console.error('Create partner error:', error)
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    )
  }
}

