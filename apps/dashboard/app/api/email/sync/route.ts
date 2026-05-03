/**
 * Email Sync API
 * POST /api/email/sync - Trigger email sync for an account or all accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { syncEmailInbox, syncAllEmailAccounts } from '@/lib/email/sync-service'
import { z } from 'zod'

const syncEmailSchema = z.object({
  accountId: z.string().optional(),
  maxResults: z.number().min(1).max(100).default(50).optional(),
})

// POST /api/email/sync - Sync email inbox
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const body = await request.json()
    const validated = syncEmailSchema.parse(body)

    if (validated.accountId) {
      // Sync specific account
      const result = await syncEmailInbox(validated.accountId, validated.maxResults)
      return NextResponse.json({
        success: true,
        result,
        message: `Synced ${result.synced} emails, linked ${result.linked} to contacts`,
      })
    } else {
      // Sync all accounts for tenant
      const results = await syncAllEmailAccounts(tenantId)
      const total = results.reduce(
        (acc, r) => ({
          synced: acc.synced + r.synced,
          linked: acc.linked + r.linked,
          created: acc.created + r.created,
          errors: acc.errors + r.errors,
        }),
        { synced: 0, linked: 0, created: 0, errors: 0 }
      )

      return NextResponse.json({
        success: true,
        results,
        total,
        message: `Synced ${total.synced} emails across ${results.length} accounts`,
      })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Email sync error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to sync emails',
      },
      { status: 500 }
    )
  }
}
