import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { fetchUnifiedInbox } from '@/lib/marketing/unified-inbox'

/** GET /api/marketing/home/unified-inbox — multi-channel engagement feed */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const sinceDays = Math.min(30, Math.max(1, parseInt(request.nextUrl.searchParams.get('days') || '7', 10)))
    const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)))

    const data = await fetchUnifiedInbox(tenantId, { sinceDays, limit })
    return NextResponse.json(data)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Unified inbox error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch unified inbox',
        items: [],
        summary: { mentions: 0, comments: 0, dms: 0, whatsapp: 0, email: 0 },
      },
      { status: 500 },
    )
  }
}
