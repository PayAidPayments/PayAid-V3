import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { loadVoiceCrmLinks } from '@/lib/voice-agent/crm-link'
import { requireAnyModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** GET — Voice bundle CRM links for finance/support surfaces in CRM app. */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireAnyModuleAccess(request, ['crm', 'finance', 'ai-studio'])
    const { searchParams } = request.nextUrl
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)

    const links = await loadVoiceCrmLinks(prisma, {
      tenantId,
      entityType: entityType as 'case' | 'invoice' | undefined,
      entityId,
      limit,
    })

    return NextResponse.json({ ok: true, links, count: links.length })
  } catch (error) {
    const denied = handleLicenseError(error)
    if (denied) return denied
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load voice bundle outcomes' },
      { status: 500 },
    )
  }
}
