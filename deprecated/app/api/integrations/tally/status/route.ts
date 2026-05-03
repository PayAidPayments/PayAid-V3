import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/integrations/tally/status - Get Tally sync status */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const installation = await prisma.marketplaceAppInstallation.findFirst({
      where: {
        tenantId,
        appId: 'tally-sync',
        status: 'active',
      },
    })

    if (!installation) {
      return NextResponse.json(
        { error: 'Tally integration is not installed' },
        { status: 404 }
      )
    }

    const config = installation.config as any

    return NextResponse.json({
      lastSyncAt: config.lastSyncAt || null,
      status: 'idle',
      direction: config.syncDirection || 'both',
      conflicts: 0,
      synced: {
        contacts: 0,
        invoices: 0,
      },
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
