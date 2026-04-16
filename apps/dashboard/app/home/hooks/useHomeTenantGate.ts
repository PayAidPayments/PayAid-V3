'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { getAuthFromStorage } from '../lib/auth-storage'

/**
 * Same access gate as `/home/[tenantId]` — redirect to login or canonical tenant home.
 */
export function useHomeTenantGate(tenantId: string | undefined) {
  const router = useRouter()
  const didRedirect = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(() => {
    if (typeof window === 'undefined' || !tenantId) return false
    const { token: t, tenant: tn } = getAuthFromStorage()
    return !!(t && tn?.id && tn.id === tenantId)
  })

  useEffect(() => {
    const id = globalThis.setTimeout(() => setMounted(true), 0)
    return () => globalThis.clearTimeout(id)
  }, [])

  useLayoutEffect(() => {
    if (!tenantId) return
    const pendingAuthTimeouts: ReturnType<typeof globalThis.setTimeout>[] = []
    const deferHasCheckedAuth = () => {
      pendingAuthTimeouts.push(globalThis.setTimeout(() => setHasCheckedAuth(true), 0))
    }

    const runAuthCheck = (isRetry = false) => {
      const { token: tokenFromStorage, tenant: tenantFromStorage } = getAuthFromStorage()
      const currentState = useAuthStore.getState()
      const finalIsAuthenticated = currentState.isAuthenticated || !!tokenFromStorage
      const finalTenant = currentState.tenant ?? tenantFromStorage

      if (finalIsAuthenticated && finalTenant?.id && tenantId !== finalTenant.id) {
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace(`/home/${finalTenant.id}`)
        }
        return
      }
      if (finalIsAuthenticated && finalTenant?.id && !tenantId) {
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace(`/home/${finalTenant.id}`)
        }
        return
      }
      if (finalIsAuthenticated && finalTenant?.id && tenantId === finalTenant.id) {
        deferHasCheckedAuth()
        return
      }
      if (!finalIsAuthenticated && !tokenFromStorage) {
        if (!isRetry) {
          setTimeout(() => runAuthCheck(true), 400)
          return
        }
        if (!didRedirect.current) {
          didRedirect.current = true
          router.replace('/login')
        }
        return
      }
      deferHasCheckedAuth()
    }

    runAuthCheck()
    return () => {
      for (const id of pendingAuthTimeouts) globalThis.clearTimeout(id)
    }
  }, [tenantId, router])

  useEffect(() => {
    if (!tenantId || hasCheckedAuth) return
    const t = setTimeout(() => {
      const { tenant: tenantFromStorage } = getAuthFromStorage()
      const storedId = tenantFromStorage?.id ?? useAuthStore.getState().tenant?.id
      if (storedId === tenantId) {
        setHasCheckedAuth(true)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [tenantId, hasCheckedAuth])

  const ready = mounted && hasCheckedAuth
  return { mounted, hasCheckedAuth, ready }
}
