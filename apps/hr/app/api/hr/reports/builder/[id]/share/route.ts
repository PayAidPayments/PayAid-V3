import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/hr/reports/builder/[id]/share
 * Deferred Phase 2: Create shareable link. Body: { expiresInHours?: number }. Returns { viewUrl, expiresAt }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params
    const report = await prisma.customReport.findFirst({
      where: { id, tenantId },
    })
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    const body = await request.json().catch(() => ({}))
    const expiresInHours = Math.min(168, Math.max(1, Number(body.expiresInHours) || 24))
    const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600
    const payload = { reportId: id, tenantId, exp }
    const token = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const viewUrl = `${base}/api/hr/reports/view?token=${token}`
    return NextResponse.json({
      viewUrl,
      expiresAt: new Date(exp * 1000).toISOString(),
      expiresInHours,
      note: 'Link includes tenant; no auth required to view.',
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
