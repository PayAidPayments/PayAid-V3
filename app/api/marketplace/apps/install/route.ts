import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const installAppSchema = z.object({
  appId: z.string(),
  config: z.record(z.unknown()),
})

/** POST /api/marketplace/apps/install - Install marketplace app */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = installAppSchema.parse(body)

    // Check if app is already installed
    const existing = await prisma.marketplaceAppInstallation.findFirst({
      where: {
        tenantId,
        appId: validated.appId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'App is already installed' },
        { status: 400 }
      )
    }

    // Create installation record
    const installation = await prisma.marketplaceAppInstallation.create({
      data: {
        tenantId,
        appId: validated.appId,
        config: validated.config as any,
        installedAt: new Date(),
      },
    })

    return NextResponse.json({
      installation: {
        id: installation.id,
        appId: installation.appId,
        status: installation.status,
        installedAt: installation.installedAt,
      },
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to install app' },
      { status: 500 }
    )
  }
}
