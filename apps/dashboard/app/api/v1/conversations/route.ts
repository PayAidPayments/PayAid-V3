import { NextRequest, NextResponse } from 'next/server'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { listConversationIngests } from '@/lib/ai-native/m1-conversation-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

/**
 * GET /api/v1/conversations — list ingested conversation events (audit-backed M1 slice).
 * Query: channel, status, owner (user id), limit (default 50, max 200).
 * `status` / `owner_user_id` are read from ingest `metadata` when present; default status is `open`.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')

    const sp = request.nextUrl.searchParams
    const channel = sp.get('channel')?.trim() || undefined
    const status = sp.get('status')?.trim() || undefined
    const owner = sp.get('owner')?.trim() || undefined
    const limitParam = sp.get('limit')
    const limitRaw = limitParam ? Number(limitParam) : 50
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 50

    const conversations = await listConversationIngests({
      tenantId,
      channel,
      status,
      owner,
      limit,
    })

    return NextResponse.json({
      conversations,
      count: conversations.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to list conversations'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
