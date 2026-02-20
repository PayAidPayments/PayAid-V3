import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { syncTallyContacts, syncTallyInvoices } from '@/lib/integrations/tally/sync'
import { z } from 'zod'

const syncSchema = z.object({
  direction: z.enum(['payaid_to_tally', 'tally_to_payaid', 'both']),
})

/** POST /api/integrations/tally/sync - Trigger Tally synchronization */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = syncSchema.parse(body)

    // Get Tally installation config
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
    if (!config.tallyUrl) {
      return NextResponse.json(
        { error: 'Tally server URL not configured' },
        { status: 400 }
      )
    }

    let syncedContacts = 0
    let syncedInvoices = 0

    // Sync based on direction
    if (validated.direction === 'payaid_to_tally' || validated.direction === 'both') {
      const contactsResult = await syncTallyContacts(tenantId, config.tallyUrl, 'payaid_to_tally')
      syncedContacts += contactsResult.synced || 0

      const invoicesResult = await syncTallyInvoices(tenantId, config.tallyUrl, 'payaid_to_tally')
      syncedInvoices += invoicesResult.synced || 0
    }

    if (validated.direction === 'tally_to_payaid' || validated.direction === 'both') {
      const contactsResult = await syncTallyContacts(tenantId, config.tallyUrl, 'tally_to_payaid')
      syncedContacts += contactsResult.synced || 0

      const invoicesResult = await syncTallyInvoices(tenantId, config.tallyUrl, 'tally_to_payaid')
      syncedInvoices += invoicesResult.synced || 0
    }

    // Update installation with last sync time
    await prisma.marketplaceAppInstallation.update({
      where: { id: installation.id },
      data: {
        config: {
          ...config,
          lastSyncAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      direction: validated.direction,
      synced: {
        contacts: syncedContacts,
        invoices: syncedInvoices,
      },
      message: `Sync completed: ${syncedContacts} contacts, ${syncedInvoices} invoices`,
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

/** GET /api/integrations/tally/sync - Get sync status */
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
