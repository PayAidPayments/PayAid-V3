import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { setWebsiteSiteStatus } from '@/lib/website-builder/repository'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const { id } = await params

    const updated = await setWebsiteSiteStatus(tenantId, id, 'PUBLISHED')
    if (!updated.record) return NextResponse.json({ error: 'Website site not found' }, { status: 404 })

    return NextResponse.json({
      ...updated.record,
      event: 'website.site.published',
      compatibility: { mode: updated.mode },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Publish website site error:', error)
    return NextResponse.json({ error: 'Failed to publish website site' }, { status: 500 })
  }
}
