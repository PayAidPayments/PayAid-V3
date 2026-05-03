/**
 * GET /api/crm/settings/disqualify-reasons
 * Lead disqualification reasons (defaults; optional per-tenant list in industrySettings).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

const DEFAULT_DISQUALIFY_REASONS = [
  'Not qualified',
  'Wrong contact',
  'Budget',
  'Timing',
  'No response',
  'Duplicate',
  'Not interested',
  'Other',
]

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industrySettings: true },
    })
    const settings = tenant?.industrySettings as Record<string, unknown> | null
    const custom = Array.isArray(settings?.crmDisqualifyReasons)
      ? (settings.crmDisqualifyReasons as string[])
      : []
    const reasons = custom.length > 0 ? custom : DEFAULT_DISQUALIFY_REASONS

    return NextResponse.json({ success: true, reasons })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return NextResponse.json({ error: 'Failed to fetch disqualify reasons' }, { status: 500 })
  }
}
