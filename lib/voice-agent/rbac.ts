/**
 * Voice Agents RBAC (Phase 3.2) — configure / operate / listen-only.
 */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { AuthUser, Permission } from '@/types/auth'
import { can } from '@/lib/rbac'
import { LicenseError, handleLicenseError } from '@/lib/middleware/license'
import { requireVoiceRealtimeAccess } from '@/lib/voice-agent/entitlements'

export type VoiceCapability = 'configure' | 'operate' | 'listen'

export const VOICE_PERMISSION_CONFIGURE = 'voice.configure' as Permission
export const VOICE_PERMISSION_OPERATE = 'voice.operate' as Permission
export const VOICE_PERMISSION_LISTEN = 'voice.listen' as Permission

const CAPABILITY_ORDER: VoiceCapability[] = ['configure', 'operate', 'listen']

const CAPABILITY_TO_PERMISSION: Record<VoiceCapability, Permission> = {
  configure: VOICE_PERMISSION_CONFIGURE,
  operate: VOICE_PERMISSION_OPERATE,
  listen: VOICE_PERMISSION_LISTEN,
}

/** configure ⊃ operate ⊃ listen */
export function voiceCapabilityRank(capability: VoiceCapability): number {
  return CAPABILITY_ORDER.indexOf(capability)
}

export function hasVoiceCapability(
  auth: { roles: string[]; permissions?: string[] },
  capability: VoiceCapability,
): boolean {
  const user: AuthUser = {
    id: '',
    email: '',
    roles: auth.roles,
    permissions: auth.permissions ?? [],
  }

  const needRank = voiceCapabilityRank(capability)
  for (const cap of CAPABILITY_ORDER) {
    if (voiceCapabilityRank(cap) > needRank) break
    if (can({ user, permission: CAPABILITY_TO_PERMISSION[cap] })) return true
  }
  return false
}

export class VoiceAccessError extends Error {
  constructor(public capability: VoiceCapability) {
    super(`Voice ${capability} access required`)
    this.name = 'VoiceAccessError'
  }
}

export type VoiceAccessContext = {
  userId: string
  tenantId: string
  licensedModules: string[]
  subscriptionTier: string
  roles: string[]
  permissions: string[]
}

/** Entitlement (voice-realtime) + capability RBAC. */
export async function requireVoiceAccess(
  request: NextRequest,
  capability: VoiceCapability,
): Promise<VoiceAccessContext> {
  const ctx = await requireVoiceRealtimeAccess(request)
  const permissions = ctx.permissions ?? []
  if (!hasVoiceCapability({ roles: ctx.roles, permissions }, capability)) {
    throw new VoiceAccessError(capability)
  }
  return { ...ctx, permissions }
}

export function handleVoiceAccessError(error: unknown): NextResponse | null {
  if (error instanceof VoiceAccessError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: 'VOICE_ACCESS_DENIED',
        capability: error.capability,
      },
      { status: 403 },
    )
  }
  if (error instanceof LicenseError) {
    return handleLicenseError(error)
  }
  return null
}
