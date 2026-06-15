/**
 * Voice Agents entitlements (Phase 3.1).
 *
 * `voice-realtime` — standalone real-time voice SKU (browser-live, triggers, dialer, supervisor).
 * `ai-studio` — legacy bundle; grants voice-realtime for backward compatibility.
 */
import type { NextRequest } from 'next/server'
import { requireAnyModuleAccess } from '@/lib/middleware/license'

export const VOICE_REALTIME_CAPABILITY_ID = 'voice-realtime'
export const VOICE_LEGACY_LICENSE_MODULE = 'ai-studio'

const VOICE_REALTIME_LICENSE_MODULES = [
  VOICE_REALTIME_CAPABILITY_ID,
  VOICE_LEGACY_LICENSE_MODULE,
] as const

export function hasVoiceRealtimeEntitlement(licensedModules: readonly string[]): boolean {
  const normalized = new Set(
    licensedModules.map((id) => id.trim().toLowerCase()).filter(Boolean),
  )
  if (normalized.size === 0) return true
  return (
    normalized.has(VOICE_REALTIME_CAPABILITY_ID) ||
    normalized.has(VOICE_LEGACY_LICENSE_MODULE)
  )
}

/** API routes licensed for voice-realtime (entitlement only; pair with voice RBAC for capability). */
export async function requireVoiceRealtimeAccess(request: NextRequest) {
  return requireAnyModuleAccess(request, [...VOICE_REALTIME_LICENSE_MODULES])
}
