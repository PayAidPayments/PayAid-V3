/**
 * GET /api/crm/settings/lost-reasons
 * Returns configurable deal lost reasons (default list; can be extended from tenant settings later).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'

const DEFAULT_LOST_REASONS = [
  'Budget constraints',
  'Chose competitor',
  'Timeline mismatch',
  'No longer needed',
  'Pricing',
  'Feature gap',
  'No response',
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
    const custom = Array.isArray(settings?.crmLostReasons) ? settings.crmLostReasons as string[] : []
    const reasons = custom.length > 0 ? custom : DEFAULT_LOST_REASONS

    return NextResponse.json({ success: true, reasons })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    return NextResponse.json({ error: 'Failed to fetch lost reasons' }, { status: 500 })
  }
}
