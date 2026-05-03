import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { conversationAssignSchema } from '@/lib/ai-native/m1-conversations'
import { assignUniboxConversation } from '@/lib/ai-native/m1-conversation-service'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm1_unibox_ingest')

    const body = await request.json()
    const parsed = conversationAssignSchema.parse(body)

    const n = await assignUniboxConversation(tenantId, id, parsed.owner_user_id)
    if (n === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, conversation_id: id, owner_user_id: parsed.owner_user_id })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: error.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const message = error instanceof Error ? error.message : 'Failed to assign'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
