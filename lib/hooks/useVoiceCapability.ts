'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { hasVoiceCapability, type VoiceCapability } from '@/lib/voice-agent/rbac'

function decodeJwtPayload(token: string): { roles?: string[]; permissions?: string[] } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as { roles?: string[]; permissions?: string[] }
  } catch {
    return null
  }
}

export function useVoiceCapability(capability: VoiceCapability): boolean {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)

  return useMemo(() => {
    let roles = user?.roles ?? (user?.role ? [user.role] : [])
    let permissions: string[] = []
    if (token) {
      const payload = decodeJwtPayload(token)
      if (payload?.roles?.length) roles = payload.roles
      if (payload?.permissions?.length) permissions = payload.permissions
    }
    return hasVoiceCapability({ roles, permissions }, capability)
  }, [user, token, capability])
}
