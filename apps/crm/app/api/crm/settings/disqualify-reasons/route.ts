/**
 * GET /api/crm/settings/disqualify-reasons
 * Returns configurable lead/deal disqualify reasons (defaults; optional tenant override via industrySettings).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'

const DEFAULT_DISQUALIFY_REASONS = [
  'Not a fit (ICP)',
  'Bad / invalid data',
  'Duplicate',
  'Unresponsive',
  'Budget / authority',
  'Competitor locked-in',
  'Compliance / region',
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
