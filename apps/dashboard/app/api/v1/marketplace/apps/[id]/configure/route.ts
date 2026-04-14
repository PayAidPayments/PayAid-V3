import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { marketplaceConfigureBodySchema } from '@/lib/ai-native/m2-contracts'
import { z } from 'zod'

/**
 * POST /api/v1/marketplace/apps/[id]/configure
 * Update configuration for an installed marketplace app.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_marketplace')
    const { id: appId } = await params

    // Verify app is installed
    const installation = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityId: appId,
        entityType: {
          in: ['marketplace_app_install', 'marketplace_app'],
        },
        changeSummary: {
          in: ['install', 'installed', 'marketplace_installed'],
        },
      },
    })

    if (!installation) {
      return NextResponse.json(
        { error: 'App is not installed', app_id: appId, code: 'NOT_INSTALLED' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = marketplaceConfigureBodySchema.parse(body)

     
    const prevSnapshot = (installation.afterSnapshot as Record<string, unknown> | null) ?? {}
    if (!validated.config || Object.keys(validated.config).length === 0) {
      return NextResponse.json(
        { error: 'config object must not be empty', code: 'EMPTY_CONFIG' },
        { status: 400 }
      )
    }

    // Record config update as a new audit entry
    await prisma.auditLog.create({
      data: {
        tenantId,
        changedBy: userId || 'system',
        entityType: 'marketplace_app',
        entityId: appId,
        changeSummary: 'marketplace_configured',
        afterSnapshot: {
          ...prevSnapshot,
          config: { ...((prevSnapshot.config as Record<string, unknown> | undefined) ?? {}), ...validated.config },
          configured_at: new Date().toISOString(),
          schema_version: '1.0',
        },
      },
    })

    return NextResponse.json({
      success: true,
      app_id: appId,
      config: validated.config,
      configured_at: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const errResponse = handleLicenseError(error)
    if (errResponse) return errResponse
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Marketplace app configure error:', error)
    return NextResponse.json({ error: 'Failed to configure app' }, { status: 500 })
  }
}
