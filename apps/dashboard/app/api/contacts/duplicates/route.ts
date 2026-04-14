/**
 * Duplicate Contacts API
 * GET /api/contacts/duplicates - Find duplicate contacts
 * POST /api/contacts/duplicates/merge - Merge duplicate contacts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { DuplicateDetectorService } from '@/lib/data-quality/duplicate-detector'
import { assertContactMergeAllowedBy360Suggestions } from '@/lib/crm/contact-merge-guard'
import { z } from 'zod'

const mergeContactsSchema = z.object({
  primaryContactId: z.string(),
  duplicateContactId: z.string(),
  /** Skip Contact 360 suggestion match (email/phone/GSTIN). Use only when merging with explicit operator intent. */
  bypassDuplicateSuggestionGuard: z.boolean().optional(),
})

// GET /api/contacts/duplicates - Find duplicates
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const threshold = parseInt(searchParams.get('threshold') || '70')

    const duplicates = await DuplicateDetectorService.findDuplicates(tenantId, threshold)

    return NextResponse.json({
      success: true,
      data: duplicates,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Find duplicates error:', error)
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    )
  }
}

// POST /api/contacts/duplicates/merge - Merge contacts
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = mergeContactsSchema.parse(body)

    const guard = await assertContactMergeAllowedBy360Suggestions(
      tenantId,
      validated.primaryContactId,
      validated.duplicateContactId,
      { bypassGuard: validated.bypassDuplicateSuggestionGuard === true }
    )
    if (!guard.allowed) {
      return NextResponse.json({ error: guard.message, code: 'MERGE_GUARD' }, { status: guard.status })
    }

    const result = await DuplicateDetectorService.mergeContacts(
      tenantId,
      validated.primaryContactId,
      validated.duplicateContactId
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
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

    console.error('Merge contacts error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge contacts' },
      { status: 500 }
    )
  }
}
