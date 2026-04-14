import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const configureAppSchema = z.object({
  config: z.record(z.unknown()),
})

/** POST /api/marketplace/apps/[id]/configure — Update an installed app's configuration */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: appId } = await params
    const body = await request.json()
    const validated = configureAppSchema.parse(body)

    const installation = await prisma.marketplaceAppInstallation.findFirst({
      where: { tenantId, appId },
    })

    if (!installation) {
      return NextResponse.json(
        { error: 'App not installed', code: 'NOT_INSTALLED' },
        { status: 404 }
      )
    }

    const updated = await prisma.marketplaceAppInstallation.update({
      where: { id: installation.id },
      data: { config: validated.config as any },
    })

    return NextResponse.json({
      success: true,
      installation: {
        id: updated.id,
        appId: updated.appId,
        status: updated.status,
        config: updated.config,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    console.error('Configure app error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to configure app' },
      { status: 500 }
    )
  }
}
