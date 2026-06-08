import type { NextRequest } from 'next/server'
import { requireVoiceAccess } from '@/lib/voice-agent/rbac'

/** Session (ai-studio) or webhook secret + x-tenant-id. */
export async function resolveVoiceTriggerTenantId(request: NextRequest): Promise<string | null> {
  const secret = process.env.VOICE_TRIGGER_WEBHOOK_SECRET?.trim()
  const headerSecret = request.headers.get('x-voice-trigger-secret')?.trim()
  if (secret && headerSecret === secret) {
    return request.headers.get('x-tenant-id')?.trim() || null
  }
  try {
    const { tenantId } = await requireVoiceAccess(request, 'operate')
    return tenantId
  } catch {
    return null
  }
}
