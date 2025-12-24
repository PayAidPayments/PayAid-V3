import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/industries/[industry] - Get industry information and enabled features
export async function GET(
  request: NextRequest,
  { params }: { params: { industry: string } }
) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Get tenant's industry
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        industry: true,
        industrySubType: true,
        industrySettings: true,
      },
    })

    if (!tenant || tenant.industry !== params.industry) {
      return NextResponse.json(
        { error: 'Industry mismatch or not set' },
        { status: 403 }
      )
    }

    // Get enabled features for this tenant
    const features = await prisma.featureToggle.findMany({
      where: {
        tenantId: tenantId,
        isEnabled: true,
      },
      select: {
        featureName: true,
        settings: true,
      },
    })

    return NextResponse.json({
      industry: tenant.industry,
      industrySubType: tenant.industrySubType,
      industrySettings: tenant.industrySettings,
      enabledFeatures: features.map((f) => ({
        name: f.featureName,
        settings: f.settings,
      })),
    })
  } catch (error) {
    console.error('Get industry info error:', error)
    return NextResponse.json(
      { error: 'Failed to get industry information' },
      { status: 500 }
    )
  }
}

// POST /api/industries/[industry] - Set industry and auto-enable features
export async function POST(
  request: NextRequest,
  { params }: { params: { industry: string } }
) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { industrySubType, industrySettings } = body

    // Update tenant industry
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        industry: params.industry,
        industrySubType: industrySubType || null,
        industrySettings: industrySettings || null,
      },
    })

    // Auto-enable features based on industry
    const industryFeatures = getDefaultEnabledFeatures(params.industry)
    
    // Enable features for this industry
    await Promise.all(
      industryFeatures.map((featureName) =>
        prisma.featureToggle.upsert({
          where: {
            tenantId_featureName: {
              tenantId: tenantId,
              featureName,
            },
          },
          update: {
            isEnabled: true,
          },
          create: {
            tenantId: tenantId,
            featureName,
            isEnabled: true,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      industry: tenant.industry,
      industrySubType: tenant.industrySubType,
      enabledFeatures: industryFeatures,
    })
  } catch (error) {
    console.error('Set industry error:', error)
    return NextResponse.json(
      { error: 'Failed to set industry' },
      { status: 500 }
    )
  }
}

