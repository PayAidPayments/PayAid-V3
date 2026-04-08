import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { getUniboxConversationDetail } from '@/lib/ai-native/m1-conversation-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { uniboxConversationPublicSchema } from '@/lib/ai-native/m1-conversations'

/**
 * GET /api/v1/conversations/:id — Unibox thread detail (channel, owner, SLA, sentiment, status).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')

    const { id } = await params
    if (!id?.trim()) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }

    const detail = await getUniboxConversationDetail(tenantId, id.trim())
    if (!detail) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const parsed = uniboxConversationPublicSchema.safeParse(detail)
    if (!parsed.success) {
      console.error('[conversations/:id] schema drift', parsed.error.flatten())
      return NextResponse.json({ error: 'Internal response validation error' }, { status: 500 })
    }

    return NextResponse.json(parsed.data)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to load conversation'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
