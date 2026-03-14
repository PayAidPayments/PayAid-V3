import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { z } from 'zod'

const patchSchema = z.object({
  primaryColor: z.string().optional(),
  tagline: z.string().optional(),
})

// GET /api/marketing/creative-studio/brand
export async function GET(request: NextRequest) {
  let tenantId: string
  try {
    const result = await requireModuleAccess(request, 'marketing')
    tenantId = result.tenantId
  } catch (licenseError) {
    return handleLicenseError(licenseError)
  }

  try {
    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { creativeStudioPrimaryColor: true, creativeStudioTagline: true },
      })
    )
    return NextResponse.json({
      primaryColor: tenant?.creativeStudioPrimaryColor ?? undefined,
      tagline: tenant?.creativeStudioTagline ?? undefined,
    })
  } catch (error) {
    console.error('Creative Studio brand GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load brand', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PATCH /api/marketing/creative-studio/brand
export async function PATCH(request: NextRequest) {
  let tenantId: string
  try {
    const result = await requireModuleAccess(request, 'marketing')
    tenantId = result.tenantId
  } catch (licenseError) {
    return handleLicenseError(licenseError)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const validated = patchSchema.parse(body)

    await prismaWithRetry(() =>
      prisma.tenant.update({
        where: { id: tenantId },
        data: {
          ...(validated.primaryColor !== undefined && { creativeStudioPrimaryColor: validated.primaryColor || null }),
          ...(validated.tagline !== undefined && { creativeStudioTagline: validated.tagline || null }),
        },
      })
    )

    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { creativeStudioPrimaryColor: true, creativeStudioTagline: true },
      })
    )
    return NextResponse.json({
      primaryColor: tenant?.creativeStudioPrimaryColor ?? undefined,
      tagline: tenant?.creativeStudioTagline ?? undefined,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Creative Studio brand PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to save brand', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
