import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@payaid/db'

const DEFAULT = [
  'Price / value',
  'Relationship',
  'Product fit',
  'Timing',
  'Other',
]

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industrySettings: true },
    })
    const s = tenant?.industrySettings as Record<string, unknown> | null
    const custom = Array.isArray(s?.crmWonReasons) ? (s.crmWonReasons as string[]) : []
    const reasons = custom.length > 0 ? custom : DEFAULT
    return NextResponse.json({ success: true, reasons })
  } catch (e: any) {
    if (e && typeof e === 'object' && 'moduleId' in e) return handleLicenseError(e)
    return NextResponse.json({ error: 'Failed to fetch won reasons' }, { status: 500 })
  }
}
